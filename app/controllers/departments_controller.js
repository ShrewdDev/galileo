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
	User.validateUniqueAdminsEmails([department.manager_email], [], function(err){
		if(err){
		      res.render('department/_form',{
		        errors: {manager_email:{message: err}},
		        department: req.body,
		        label: 'New Department',
		        action: "/department/create"
		      })				
		}
		else{
			User.validateUniqueAdminsEmails(department.getSpaceCleanedEmails(), [], function(err){
			if(err){
		       res.render('department/_form',{
		        errors: {teamMembers:{message: err}},
		        department: req.body,
		        label: 'New Department',
		        action: "/department/create"
		      })
			}
		else{
			department.organization = req.user.organization
			department.save(function (err) {
				if(err){
					errors = err.errors || {departmentName: {message: "duplicate department name."}}
			       res.render('department/_form',{
			        errors: errors,
			        department: req.body,
			        label: 'New Department',
			        action: "/department/create"
			      })
				}
				else{
					//User.createUpdateUsers([department.manager_email], {organization: department.organization, department: department.id, role: 'Customer_Manager'})
					//User.createUpdateUsers(department.teamMembers.split(','), {organization: department.organization, department: department.id,	role: 'Customer_TeamMember'})
					User.saveDepartmentUsers(department, null)
		    		req.flash('message', {type: 'success', message: 'Department created !'});   
		        	res.send({status: "saved", url: "/departments"})			
				  }
				})
				}
			})		
		}
	})
}

exports.edit = function (req, res){
	Department.findOne({ _id:  req.params.id}, function (err, department) {		
		res.render('department/_form', {
			department: department,
			label: 'Update Department',
			notNew: true,			
			action: "/department/"+department.id+"/update"
		})		
	})
}

exports.update = function (req, res){
	Department.findOne({ _id:  req.params.id}, function (err, department) {
	old_emails   = department.getSpaceCleanedEmails()
	department       = extend(department, req.body)
	emails             = department.getSpaceCleanedEmails()		
	User.validateUniqueAdminsEmails([req.body.manager_email], [department.manager_email], function(err){
		if(err){
		      return res.render('department/_form',{
		        errors: {manager_email:{message: err}},
		        department: req.body,
				label: 'Update Department',
				notNew: true,			
				action: "/department/"+department.id+"/update"
		      })				
		}
		else{
			User.validateUniqueAdminsEmails(emails, old_emails, function(err){
			if(err){
		      res.render('department/_form',{
		        errors: {teamMembers:{message: err}},
		        department: req.body,
				label: 'Update Department',
				notNew: true,			
				action: "/department/"+department.id+"/update"
		      })
			}
		else{
			department.save(function (err) {
				if(err){
			      res.render('department/_form',{
			        errors: err.errors,
			        department: req.body,
					label: 'Update Department',
					notNew: true,			
					action: "/department/"+department.id+"/update"
			      })
				}
				else{
					User.saveDepartmentUsers(department, "update")
		    		req.flash('message', {type: 'success', message: 'Department updated !'})
		        	res.send({status: "saved", url: "/departments"})			
				 }
				})
				}
			})		
		}
	})
	})	
}

exports.destroy = function (req, res){
	Department.findOneAndRemove({ _id:  req.params.id}, function (err, department) {		
		User.remove({ department: department.id }, function(err, users){
			req.flash('message', {type: 'success', message: 'Organization deleted !'})
	    	res.send({status: "saved", url: "/organizations"})     					
		})			
	})
}
