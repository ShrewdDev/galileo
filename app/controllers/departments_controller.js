var   mongoose     = require('mongoose'),
      User         = mongoose.model('User'),
      Organization = mongoose.model('Organization'),
      Department   = mongoose.model('Department'),
      extend       = require('util')._extend,
      validator    = require('validator')


exports.index = function (req, res){	
	Department.find({ organization:  req.user.organization}).populate('manager').exec(function (err, departments) {
		res.render('department/index', {
		    departments: departments,
		    message: req.flash('message') 
		});
	});
}

exports.new = function (req, res){
	res.render('department/_form', { 
		department: new Department(),
		label: 'New Department',
		action: '/department/create'
	})
}

exports.create = function (req, res){
	var department = new Department(req.body)
	User.validateUniqueAdminsEmails([req.body.manager_email], "", function(err){
		if(err){
		      return res.render('department/_form',{
		        errors: {manager_email:{message: err}},
		        department: req.body,
		        label: 'New Department',
		        action: "/department/create"
		      });				
		}
		else{
			User.validateUniqueAdminsEmails(req.body.teamMembers.split(","), "", function(err){
			if(err){
		      return res.render('department/_form',{
		        errors: {teamMembers:{message: err}},
		        department: req.body,
		        label: 'New Department',
		        action: "/department/create"
		      });				
			}
		else{
			department.organization = req.user.organization
			department.save(function (err) {
				if(err){
					console.log(err)
			      return res.render('department/_form',{
			        errors: err.errors,
			        department: req.body,
			        label: 'New Department',
			        action: "/department/create"
			      });
				}
				else{
					User.createUpdateUsers([department.manager_email], {organization: department.organization, department: department.id, role: 'Customer_Manager'})
					User.createUpdateUsers(department.teamMembers.split(','), {organization: department.organization, department: department.id,	role: 'Customer_TeamMember'})
		    		req.flash('message', {type: 'success', message: 'Department created !'});   
		        	res.send({status: "saved", url: "/departments"})			
				}
			})	
			}
			})		
		}
	})
}
/*
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
	      return res.render('department/_form',{
	        errors: errors,
	        department: req.body,
	        action: "/department/create"
	      });
	    }
	    else {
	    	user.role         = 'Customer_Manager'
	    	user.setPassword()
	    	user.department   = department
	    	user.organization = req.user.organization	    	
	    	user.save(function (err2) {
		    	department.manager = user
		    	department.organization = req.user.organization
		    	department.save(function (err1) {
		    		console.log(err1)
		        	return res.redirect('/');     
		        })  
		        User.createNewDepartmentMembers(department)
	    	})
	     }	    
	})
  });
}
*/
exports.edit = function (req, res){
	Department.findOne({ _id:  req.params.id}).populate('manager').exec(function (err, department) {		
		res.render('department/_form', {
			department: department,
			label: 'Update Department',
			notNew: true,			
			action: "/department/"+department.id+"/update"
		})		
	})
}

exports.update = function (req, res){
	Department.findOne({ _id:  req.params.id}).populate('manager').exec(function (err, department) {
		department   = extend(department, req.body)
		user         = extend(department.manager, req.body)
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
			        User.createNewDepartmentMembers(department)			        
		    	})
		     }	    
		})
	  })
	})	
}
exports.destroy = function (req, res){
	Department.findOne({ _id:  req.params.id}).populate('admin').exec(function (err, department) {
		department.remove(function (err){
    		req.flash('message', {type: 'success', message: 'Department deleted !'})
        	res.send({status: "saved", url: "/departments"})     
		})
	})
}