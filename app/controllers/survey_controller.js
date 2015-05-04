var mongoose     = require('mongoose'),
    User         = mongoose.model('User'),
    Survey       = mongoose.model('Survey'),
    Result       = mongoose.model('Result'),
    Department   = mongoose.model('Department'),
    Organization = mongoose.model('Organization'),
    extend       = require('util')._extend

exports.index = function (req, res){
	res.render('survey/index', {

	});	
}

exports.customer_admin_surveys = function (req, res){
	Survey.find({}, function (err, surveys) {
		res.render('survey/index', {
			surveys: surveys
		});
	});
}

exports.new = function (req, res){
	res.render('survey/form', {   
		survey: new Survey(),
		action: "/survey/create"
	})
}

exports.survey_question_partial = function (req, res){
	console.log(req)
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
      return res.render('survey/form', {
        errors: err.errors,
        survey:  survey,
        action: "/survey/create"
      });
    }
    else {     
      return res.redirect('/admin/surveys');            
    }
  });
};

exports.edit = function (req, res){
	Survey.findOne({ _id:  req.params.id}).exec(function (err, survey) {
		res.render('survey/form', {
			survey: survey,
			action: "/survey/"+survey.id+"/update"
		})		
	})
}

exports.update = function (req, res){
	Survey.findOne({ _id:  req.params.id}).exec(function (err, survey) {
		survey         = extend(survey, req.body)
		survey.save(function (err){
		if (err) {
			console.log(err)
		  return res.render('survey/form', {
		    errors: err.errors,
		    survey:  survey,
		    action: "/survey/"+survey.id+"/update"
		  });
		}
		else {     
		  return res.redirect('/admin/surveys');            
		}
	  });		
	})
}

exports.manager_surveys = function (req, res){
	Survey.find({ organization:  req.user.organization, type: 'Manager Survey'}).exec(function (err, surveys) {	
		res.render('survey/manager_survey', {
			surveys: surveys
		});	
	});	
}

exports.take_manager_survey = function (req, res){
	var step = req.params.step
	Survey.findOne({ _id:  req.params.id}).exec(function (err, survey) {
		if(step < survey.questions.length){
			question = survey.questions[step]
			Result.findOne({user: req.user.id, survey: survey.id, question: question.id}, function(err, result){
				res.render('survey/take_manager_survey',{
					survey:      survey,
					question:    question,
					result:    	 result,
					step:        step
				});
			})
		}else{
			return res.redirect('/manager/surveys');
		}
	});	
}

exports.post_survey_result = function (req, res){
	console.log(req.body)
	var step = parseInt(req.params.step) + 1
	var survey_id = req.params.id

	Result.findOneAndUpdate({ user: req.user.id, survey: survey_id, question: req.body.question }, 
							{ response: req.body.response }, 
							{ upsert: true }, 
    	function(err, doc) {		
			if(err){

			}
			else{
				return res.redirect('/manager/'+survey_id+'/takesurvey/'+step); 
			}
    });
}