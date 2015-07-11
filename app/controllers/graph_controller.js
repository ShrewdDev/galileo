var mongoose      = require('mongoose'),
    User          = mongoose.model('User'),
    Survey        = mongoose.model('Survey'),
    Result        = mongoose.model('Result'),
    Department    = mongoose.model('Department'),
    Organization  = mongoose.model('Organization'),
    _             = require("underscore"),  
    async         = require("async")

exports.getEdgeDetails = function (req, res){
	var  items          = Survey.getItems()
		,surveyIndex    = req.body.surveyIndex
		,itemIndex      = req.body.itemIndex
		,visualization  = req.body.visualization
		,edge           = req.body.edge
		edge            = edge.split('-')
		fromDepartment  = edge[0]
		toDepartment    = edge[1]

	Department.findOne({_id: fromDepartment}, function (err, from_department){
		Department.findOne({_id: toDepartment}, function (err, to_department){
			Survey.find({organization: req.user.organization, confirmed: true}).exec(function (err, surveys) {
				title  = Survey.getItem(itemIndex) + ', '+ from_department.departmentName + ' => ' + to_department.departmentName
				survey = surveys[surveyIndex]
			    //query = {survey: survey.id, objectvalue: toDepartment, department: fromDepartment, ressource: itemIndex}
			    query = { survey: survey.id, ressource: itemIndex }
			    _data = {} // {Weekly: 0, Monthly: 0, Quarterly: 0}
			    items = []

		    	if(visualization == 'between_teams'){
				    Result.find(query).exec(function (err, results) {
				    	_.each(results, function(result, index){
					    	q = survey.questions.id(result.question)
					    	//if((q.question.indexOf('frequently') > -1) && (q.question.indexOf('sharing') > -1)) {
					    	if(q.question.indexOf('frequently') > -1) {
					    		console.log(q.question)
					    		val = q.responses.id(result.response).response
					    		_data[val] = _data[val] ? _data[val] + 1 : 1
					    	}
				    	})
				    	i = 0
				    	_.each(_data, function(value, key){			    		
				    		var x = 20*(1+i), yOffset = parseInt(330 - ((value/5) * 50)) // 335
				    		items.push({ x: x, y: value, group: i, label: { content: key,  xOffset: -20, yOffset: -10 }})
				    		i++
				    	})
					res.render('graph/_between_teams', {
							 title: title
							,items: items
						})
					})
				}
				else if(visualization == 'key_ressource_grid'){
					User.findOne({department: to_department, role: 'Customer_Manager'}, function (err, departmentManager){
						Survey.findOne({_id: survey.relatedSurvey}, function (err, relatedSurvey){
							var question_id = '', ressources
							_.each(relatedSurvey.questions, function(question){
								if(!question.generic && (question.question.indexOf('Select the resources most important to your group') > -1))
									question_id = question.id
							})
							Result.findOne({question: question_id, user: departmentManager.id, survey: relatedSurvey.id}).exec(function (err, result) {
								ressources = result.response	
								

								res.render('graph/_key_ressource_grid',{
									title: 		 title
									,items: 	 Survey.get_Items()
									,ressources: ressources
								})
							})
						})
					})
				}				
			})
		})
	})
}

exports.index = function (req, res){
	var surveyIndex   = req.query.survey   || 0,
		itemIndex     = req.query.item     || 0,
		visualization = req.query.visualization || 'between_teams',
		workflow      = req.query.workflow || 'global',
		items         = Survey.getItems(),
		nodes         = [],
		edges         = [],
		connected_departments = [],
		colors       = ['#97C2FC', '#FFFF00', '#FB7E81', '#7BE141', '#6E6EFD', '#C2FABC', '#FFA807', '#6E6EFD']

	Department.find({organization: req.user.organization}).exec(function (err, departments) {
		Survey.find({organization: req.user.organization, confirmed: true}).exec(function (err, surveys) {
			survey = surveys[surveyIndex],
			usersThatfinishedSurvey = []
			
			Result.find({ survey: survey.id, object: 'department', action: {$in:['give', 'receive']}}, function(err, results){
				_.each(results, function(result){
					_.each(result.response, function(response, index){
						if(_.contains(response, itemIndex)){
							var from, to 
							if(result.action == 'give'){
								from = result.department
								to   = result.objectvalue
							}
							else{
								to   = result.department
								from = result.objectvalue
							}
							connected_departments.push(to.toString())
							connected_departments.push(from.toString())
							var  id = from+"-"+to//+"-"+index
							    ,duplicate = false
							_.each(edges, function(edge, index){		
								if(edge.id == id) {	duplicate = true }
							})
							//if(! duplicate) edges.push({id: from+"-"+to+"-"+index, from: from, to: to, arrows: {to: true}, color:{color:'blue'}, length: 200})
							//if(! duplicate) edges.push({id: id, from: from, to: to, arrows: {to: true}, color:{color:'blue'}, length: 200})
							if(! duplicate) edges.push({id: id, from: from, to: to, arrows: {to: true}, color:{color:'blue'}, length: 200})
						}
					})
				})

				_.each(departments, function(department, index){						
					console.log("itemIndex " + itemIndex)
					size = 5
					_.each(survey.userSteps, function(step){
						if(step.department == department.id && step.finished) {
							size += 5
							usersThatfinishedSurvey.push(step.id)
						}
					})
					if(workflow != 'department' || ( workflow == 'department' && _.contains(connected_departments, department.id))){
						nodes.push({id: department.id, label: department.departmentName, color: colors[index%colors.length], size: size})
					}
				})
			    res.render('graph/index', {
					surveys: surveys
					,surveyIndex:  surveyIndex
					,itemIndex: itemIndex
					,items: items
					,nodes: nodes
					,edges: edges
					,workflow: workflow
					,visualization: visualization
				})
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