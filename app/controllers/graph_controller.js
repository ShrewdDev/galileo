var mongoose      = require('mongoose'),
    User          = mongoose.model('User'),
    Survey        = mongoose.model('Survey'),
    Result        = mongoose.model('Result'),
    Department    = mongoose.model('Department'),
    Organization  = mongoose.model('Organization'),
    _             = require("underscore"),  
    async         = require("async")

exports.index = function (req, res){
	var surveyIndex  = req.query.survey || 0,
		itemIndex    = req.query.item   || 0,
		items        = Survey.getItems()

	Department.find({organization: req.user.organization}).exec(function (err, departments) {	
		Survey.find({organization: req.user.organization, confirmed: true}).exec(function (err, surveys) {
			survey = surveys[surveyIndex]
			console.log(survey.id)
			console.log(survey.userSteps)
			nodes  = []
			edges  = []
			colors = ['#97C2FC', '#FFFF00', '#FB7E81', '#7BE141', '#6E6EFD', '#C2FABC', '#FFA807', '#6E6EFD']
			for(index in departments){
				usersThatfinishedSurvey = []
				department = departments[index]
				console.log(department.id)
				size = 5
				_.each(survey.userSteps, function(step){
					if(step.department == department.id && step.finished) {
						size += 5
						usersThatfinishedSurvey.push(step.id)						
					}
				})
				console.log(usersThatfinishedSurvey)
				nodes.push({id: department.id, label: department.departmentName, color: colors[index%colors.length], size: size})
				to = parseInt(index) + 1
				

				edges.push({from: index, to: to, color:{color:'blue'}, length: 200, label: "label"})
			




			}

			_.each(survey.questions , function(question){
				_.each(question.responses , function(response){
					if(response.response == items[itemIndex]) {
						console.log("found")
						console.log(response)
					}
				})				
			})
			res.render('graph/index', {
				surveys: surveys,
				surveyIndex:  surveyIndex,
				itemIndex: itemIndex,
				items: items,
				nodes: nodes,
				edges: edges
			})
		})
	})
}



/*
nodes = [
    {id: 1, label: "HR", color:'#97C2FC', size: 40},
    {id: 2, label: "DIR", color:'#FFFF00', size: 20},
    {id: 3, label: "Sales", color:'#FB7E81', size: 23},
    {id: 4, label: 4, color:'#7BE141'},
    {id: 5, label: 5, color:'#6E6EFD'},
    {id: 6, label: 6, color:'#C2FABC'},
    {id: 7, label: 7, color:'#FFA807'},
    {id: 8, label: 8, color:'#6E6EFD'}
  ]
edges = [
    {from: 1, to: 8, color:{color:'red'}, label: "label"},
    {from: 1, to: 3, color:'rgb(20,24,200)'},
    {from: 1, to: 2, color:{color:'rgba(30,30,30,0.2)', highlight:'blue'}},
    {from: 2, to: 5, color:{inherit:'from'}},
    {from: 5, to: 6, color:{inherit:'both'}},
    {from: 6, to: 7, color:{color:'#ff0000', opacity:0.3}},
    {from: 6, to: 8, color:{opacity:0.3}},
  ]
*/