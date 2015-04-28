var   mongoose     = require('mongoose'),
      User         = mongoose.model('User'),
      Organization = mongoose.model('Organization'),
      Department   = mongoose.model('Department'),
      extend       = require('util')._extend,
      validator       = require('validator')


exports.index = function (req, res){
	Department.find({ organization:  req.user.organization}).populate('owner').exec(function (err, departments) {
		res.render('department/index', {
		    departments: departments
	});
		});
}

exports.new = function (req, res){
	res.render('department/form', {   
		department: new Department(),
		action: "/department/create"
	})
}

exports.create = function (req, res){
	var department   = new Department(req.body)
	var user         = new User(req.body)
	department.validate(function (err1) {
		user.validate(function (err2) {
	    if (err1 || err2) {
	    err1 = 	(err1) ? err1.errors : {}
	    err2 = 	(err2) ? err2.errors : {}
	    errors = extend(err1, err2)	
	    console.log("errors")
	    console.log(errors)
	      return res.render('department/form',{
	        errors: errors,
	        department: req.body,
	        action: "/department/create"
	      });
	    }
	    else {
	    	user.role         = 'Customer_Manager'
	    	user.setPassword()
	    	user.department = department
	    	user.save(function (err2) {
		    	department.owner = user
		    	department.organization = req.user.organization
		    	department.save(function (err1) {
		    		console.log(err1)
		        	return res.redirect('/');     
		        })  
	    	})
	     }	    
	})
  });
}

exports.edit = function (req, res){
	Department.findOne({ _id:  req.params.id}).populate('owner').exec(function (err, department) {
		console.log(department)
		res.render('department/form', {
			department: department,
			action: "/department/"+department.id+"/update"
		})		
	})
}

exports.update = function (req, res){
	Department.findOne({ _id:  req.params.id}).populate('owner').exec(function (err, department) {
		department   = extend(department, req.body)
		user         = extend(department.owner, req.body)
		department.validate(function (err1) {
			user.validate(function (err2) {
		    if (err1 || err2) {
		    err1 = 	(err1) ? err1.errors : {}
		    err2 = 	(err2) ? err2.errors : {}
		    errors = extend(err1, err2)	
		      return res.render('department/form',{
		        errors: errors,
		        department: req.body,
		        action: "/department/"+department.id+"/update"
		      });
		    }
		    else {
		    	user.setPassword()
		    	user.save(function (err2) {
			    	department.save(function (err1) {
			        	return res.redirect('/');     
			        })  
		    	})
		     }	    
		})
	  })
	})	
}