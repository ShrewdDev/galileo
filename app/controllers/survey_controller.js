var mongoose      = require('mongoose'),
    User          = mongoose.model('User'),
    Survey        = mongoose.model('Survey'),
    Result        = mongoose.model('Result'),
    Department    = mongoose.model('Department'),
    Organization  = mongoose.model('Organization'),
    async         = require("async"),
    extend        = require('util')._extend,
    _             = require('underscore')

exports.customer_admin_surveys = function (req, res){
	query = req.user.hasRole('Customer_Admin') ? {organization: req.user.organization} : {}	
	query.role = req.user.role
	console.log(query)
	Survey.find(query).sort({createdAt: 'desc'}).exec(function (err, surveys) {
		res.render('survey/index', {
			surveys: surveys,
			message: req.flash('message')
		})
	})
}

exports.new = function (req, res){
	Organization.find({}, function(err, organizations){
		res.render('survey/form', {   
			survey: new Survey(),
			action: "/survey/create",
			organizations: organizations
		})	
	})
}

exports.new_from_template = function (req, res){
	template = Survey.getTemplate(req.params.type)
	Organization.find({}, function(err, organizations){
		req.user.getManagerSurveys(function(manager_surveys){
			res.render('survey/form', {   
				survey: new Survey(template),
				manager_surveys: manager_surveys,
				from_template: 1,
				organizations: organizations,
				action: "/survey/create"
			})
		})
	})	
}

exports.survey_question_partial = function (req, res){
	res.render('survey/_question_partial', {		
		question_index: req.query.question_index
	})
}

exports.question_response_partial = function (req, res){
	res.render('survey/_question_response_partial', {   		
		question_index: req.query.question_index,
		response_index: req.query.response_index
	})
}

exports.create = function (req, res) {	
  if(req.body.organization == "") delete (req.body.organization)	// for model validation	
  var survey = new Survey(req.body)
  if(!survey.organization && survey.role == "Customer_Admin") survey.organization = req.user.organization
  survey.save(function (err){
    if (err) {
		console.log(err)
		survey.confirmed = false
		Organization.find({}, function(err2, organizations){
			req.user.getManagerSurveys(function(manager_surveys){
		      return res.render('survey/form', {
		        errors: err.errors,
		        survey:  survey,
		        manager_surveys: manager_surveys,
		        organizations: organizations,
		        from_template: req.body.from_template,
		        action: "/survey/create"
			})
	    })  
      })
    }
    else {
    	survey.generateQuestions(function(){
    		if(survey.confirmed) {
    			if(survey.role == 'Customer_Admin') User.sendSurveyNotification(survey, null, 'Customer_Manager')
    			if(survey.role == 'Site_Admin')     Survey.createOrganizationsSurveys(survey)
    		}	
      		return res.redirect('/admin/surveys')		
    	})      
    }
  })
}

exports.edit = function (req, res){
	Organization.find({}, function(err, organizations){
		Survey.findOne({ _id:  req.params.id}).exec(function (err, survey) {
			req.user.getManagerSurveys(function(manager_surveys){
				res.render('survey/form', {
					survey: survey,
					manager_surveys: manager_surveys,
					organizations: organizations,
					action: "/survey/"+survey.id+"/update"
				})
			})
		})
	})
}

exports.update = function (req, res){
	Survey.findOne({ _id:  req.params.id}).exec(function (err, survey) {
		survey         = extend(survey, req.body)
		console.log(survey)
		survey.save(function (err){
		if (err) {
			console.log(err)
			survey.confirmed = false
			req.user.getManagerSurveys(function(manager_surveys){
			  return res.render('survey/form', {
			    errors: err.errors,
			    survey:  survey,
			    manager_surveys: manager_surveys,
			    action: "/survey/"+survey.id+"/update"
			  })
		  })
		}
		else { 
	    	survey.generateQuestions(function(){
    			if(survey.role == 'Customer_Admin') User.sendSurveyNotification(survey, null, 'Customer_Manager')
    			if(survey.role == 'Site_Admin')     Survey.createOrganizationsSurveys(survey)
			  	return res.redirect('/admin/surveys')      
	    	})		  
		}
	  })
	})
}

exports.user_surveys = function (req, res){
	types = {'Customer_Manager' : 'Employee Survey', 'Customer_TeamMember' : 'Manager Survey'}
	query = {organization: req.user.organization, type: {$ne: types[req.user.role]}, confirmed: true}
	//if(req.user.role == 'Customer_TeamMember') query.ready = true
	Survey.find(query).sort({createdAt: 'desc'}).exec(function (err, surveys) {	
		console.log(surveys.length)
		if(req.user.role == 'Customer_TeamMember'){
			User.findOne({role: 'Customer_Manager', department: req.user.department}, function(err, manager){
				member_surveys = []		
				async.each(surveys, function (survey, cb) {
					if(!survey.relatedSurvey) {
						member_surveys.push(survey)
						cb()
					}
					else{
						Survey.findOne({_id: survey.relatedSurvey}, function(err, manager_survey){
							if(manager_survey && manager_survey.finished(manager.id)) member_surveys.push(survey)
							cb()    
						})	
					}				          
				},function(err){
					res.render('survey/user_survey', {
						surveys: member_surveys,
						message: req.flash('message')
					})
				})
			})
		}
		else{
			res.render('survey/user_survey', {
				surveys: surveys,
				message: req.flash('message')
			})			
		}
	})
}

exports.take_survey = function (req, res){
	var step = req.params.step
	Survey.findOne({ _id:  req.params.id}).exec(function (err, survey) {
		var validQuestions 	= survey.validQuestions()
		survey.updateStep(req.user, step, function(){			
			if(step < validQuestions.length){
				question 		= validQuestions[step]
				survey.setQuestionTitle(req.user, question,	function(title, object, action, objectvalue, ressource){
					question.question = title
					Result.findOne({user: req.user.id, survey: survey.id, question: question.id}, function(err, result){
						result = result ? result.response : null
						d = req.user.department
						res.render('survey/take_user_survey',{
							survey:      survey,
							question:    question,
							result:    	 result,
							step:        step,
							object:      object,
							objectvalue: objectvalue,
							action:      action,
							ressource:   ressource
						})
					})
				})
			}else{
				return res.redirect('/surveys')
			}
		})
	})
}

exports.post_survey_result = function (req, res){
	var step = parseInt(req.params.step) + 1
	var survey_id = req.params.id
	req.body.survey = survey_id
	Result.findOneAndUpdate({ user: req.user.id, survey: survey_id, question: req.body.question }, 
							req.body,
							{ upsert: true }, function(err, doc) {		
					if(err){
						console.log(err)
					}
					else{			
				return res.redirect('/surveys/'+survey_id+'/takesurvey/'+step)			
		}
	})
}

exports.destroy = function (req, res){
	Survey.findOneAndRemove({ _id:  req.params.id}, function (err, survey) {
		req.flash('message', {type: 'success', message: 'Survey deleted !'})
		return res.redirect('/admin/surveys')
	})
}