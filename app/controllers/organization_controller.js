var   mongoose = require('mongoose'),
      User = mongoose.model('User'),
      Organization = mongoose.model('Organization'),
      extend = require('util')._extend


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
			User.createUpdateOrganizationAdmins(organization);
			// create users from organization.admin_emails, delete users with role ADMIN and organization self
    		req.flash('message', {type: 'success', message: 'Organization created !'});   
        	res.send({status: "saved", url: "/organizations"})			
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
		organization = extend(organization, req.body)
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
				User.createUpdateOrganizationAdmins(organization);
	    		req.flash('message', {type: 'success', message: 'Organization updated !'});  
	        	res.send({status: "saved", url: "/organizations"})			
			}
		})
	})	
}

exports.destroy = function (req, res){
	Organization.findOne({ _id:  req.params.id}).populate('admin').exec(function (err, organization) {
		organization.remove(function (err){
    		req.flash('message', {type: 'success', message: 'Organization deleted !'});   
        	res.send({status: "saved", url: "/organizations"})     
		});
	})
};