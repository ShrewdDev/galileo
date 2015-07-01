var   mongoose       = require('mongoose'),
      User           = mongoose.model('User'),
      Organization   = mongoose.model('Organization'),
      Department     = mongoose.model('Department'),
      User           = mongoose.model('User'),
      extend         = require('util')._extend


exports.index = function (req, res){
	Organization.find({}).populate('admin').exec(function (err, organizations) {
		res.render('organization/index', {	    
		    organizations: organizations,
		    message: req.flash('message')
		});
	})
}

exports.new = function (req, res){
	res.render('organization/form', { 
		organization: new Organization(),
		label: 'New Organization',
		action: '/organization/create'
	})
}

exports.create = function (req, res){
	var organization = new Organization(req.body)
	emails = organization.getSpaceCleanedEmails()

	User.validateUniqueAdminsEmails(emails, [], function(err){
		if(err){
		      return res.render('organization/form',{
		        errors: {admin_emails:{message: err}},
		        organization: req.body,
		        label: 'New Organization',
		        action: "/organization/create"
		      });				
		}
		else{
			organization.save(function (err) {
				if(err){
			      return res.render('organization/form',{
			        errors: err.errors,
			        organization: req.body,
			        label: 'New Organization',
			        action: "/organization/create"
			      });
				}
				else{
					User.createUpdateOrganizationAdmins(organization, null);
		    		req.flash('message', {type: 'success', message: 'Organization created !'});   
		        	res.send({status: "saved", url: "/organizations"})			
				}
			})			
		}
	})
}

exports.edit = function (req, res){
	Organization.findOne({ _id:  req.params.id}, function (err, organization) {		
		res.render('organization/form', {
			organization: organization,
			label: 'Update Organization',
			notNew: true,
			action: "/organization/"+organization.id+"/update"
		})		
	})
}

exports.update = function (req, res){
	Organization.findOne({ _id:  req.params.id}, function (err, organization) {
		old_admin_emails   = organization.getSpaceCleanedEmails()
		organization       = extend(organization, req.body)
		console.log(organization)
		emails             = organization.getSpaceCleanedEmails()
		console.log(emails)
		User.validateUniqueAdminsEmails(emails, old_admin_emails, function(err){
				if(err){
				      return res.render('organization/form',{
				        errors: {admin_emails:{message: err}},
				        organization: req.body,
						label: 'Update Organization',
						notNew: true,
						action: "/organization/"+organization.id+"/update"
				      });				
				}
				else{
					organization.save(function (err) {
						if(err){
					      return res.render('organization/form',{
					        errors: err.errors,
					        organization: req.body,
							label: 'Update Organization',
							notNew: true,
							action: "/organization/"+organization.id+"/update"
					      });
						}
						else{
							User.createUpdateOrganizationAdmins(organization, "delete removed organization admins");
				    		req.flash('message', {type: 'success', message: 'Organization updated !'});  
				        	res.send({status: "saved", url: "/organizations"})				
						}
					})			
				}
			})
	})	
}

exports.destroy = function (req, res){
	Organization.findOneAndRemove({ _id:  req.params.id}, function (err, organization) {
		Department.remove({ organization: organization.id }, function(err, departments){
			User.remove({ organization: organization.id }, function(err, users){
				req.flash('message', {type: 'success', message: 'Organization deleted !'})
		    	res.send({status: "saved", url: "/organizations"})     					
			})	
		})
	})
}