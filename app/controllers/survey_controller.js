var mongoose      = require('mongoose'),
    User          = mongoose.model('User'),
    Survey        = mongoose.model('Survey'),
    Result        = mongoose.model('Result'),
    Department    = mongoose.model('Department'),
    Organization  = mongoose.model('Organization'),
    async         = require("async"),
    extend        = require('util')._extend

exports.customer_admin_surveys = function (req, res){
	Survey.find({organization: req.user.organization}).sort({createdAt: 'desc'}).exec(function (err, surveys) {
		res.render('survey/index', {
			surveys: surveys,
			message: req.flash('message')
		});
	});
}

exports.new = function (req, res){
	res.render('survey/form', {   
		survey: new Survey(),
		action: "/survey/create"
	})
}

exports.new_from_template = function (req, res){
	template = Survey.getTemplate(req.params.type)
	req.user.getManagerSurveys(function(manager_surveys){
		res.render('survey/form', {   
			survey: new Survey(template),
			manager_surveys: manager_surveys,
			action: "/survey/create"
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
  var survey = new Survey(req.body);
  survey.organization = req.user.organization
  survey.save(function (err){
    if (err) {
		console.log(err)
		req.user.getManagerSurveys(function(manager_surveys){
	      return res.render('survey/form', {
	        errors: err.errors,
	        survey:  survey,
	        manager_surveys: manager_surveys,
	        action: "/survey/create"
	      })
      })
    }
    else {
    	survey.generateQuestions(function(){
    		if(survey.confirmed) User.sendSurveyNotification(survey, null, 'Customer_Manager')
      		return res.redirect('/admin/surveys')		
    	})      
    }
  })
}

exports.edit = function (req, res){
	Survey.findOne({ _id:  req.params.id}).exec(function (err, survey) {
		req.user.getManagerSurveys(function(manager_surveys){
			res.render('survey/form', {
				survey: survey,
				manager_surveys: manager_surveys,
				action: "/survey/"+survey.id+"/update"
			})
		})
	})
}

exports.update = function (req, res){
	Survey.findOne({ _id:  req.params.id}).exec(function (err, survey) {
		survey         = extend(survey, req.body)
		survey.save(function (err){
		if (err) {
			console.log(err)
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
	    		if(survey.confirmed) User.sendSurveyNotification(survey, null, 'Customer_Manager') 		
			  	return res.redirect('/admin/surveys')      
	    	})		  
		}
	  })
	})
}

exports.user_surveys = function (req, res){
	types = {'Customer_Manager' : 'Manager Survey' , 'Customer_TeamMember' : 'Employee Survey'}	
	query = { organization:  req.user.organization, type: types[req.user.role], confirmed: true}
	//if(req.user.role == 'Customer_TeamMember') query.ready = true
	Survey.find(query).sort({createdAt: 'desc'}).exec(function (err, surveys) {	
		console.log(surveys.length)
		if(req.user.role == 'Customer_TeamMember'){
			User.findOne({role: 'Customer_Manager', department: req.user.department}, function(err, manager){
				member_surveys = []
				async.each(surveys, function (survey, cb) {
					Survey.findOne({_id: survey.relatedSurvey}, function(err, manager_survey){
						if(manager_survey && manager_survey.finished(manager.id)) member_surveys.push(survey)
						cb()    
					})					          
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
				survey.setQuestionTitle(req.user, question,	function(title, object, action, objectvalue){
					question.question = title
					Result.findOne({user: req.user.id, survey: survey.id, question: question.id}, function(err, result){
						result = result ? result.response : null
						res.render('survey/take_user_survey',{
							survey:      survey,
							question:    question,
							result:    	 result,
							step:        step,
							object:      object,
							objectvalue: objectvalue,
							action:      action
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