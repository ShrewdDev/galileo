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
		action: "/organization/create"
	})
}

exports.create = function (req, res){
	var organization = new Organization(req.body)
	var user         = new User(req.body)
	organization.validate(function (err1) {
		user.validate(function (err2) {
	    if (err1 || err2) {
	    err1 = 	(err1) ? err1.errors : {}
	    err2 = 	(err2) ? err2.errors : {}
	    errors = extend(err1, err2)	
	      return res.render('organization/form',{
	        errors: errors,
	        organization: req.body,
	        label: 'New Organization',
	        action: "/organization/create"
	      });
	    }
	    else {
	    	user.role        = 'Customer_Admin'
	    	user.setPassword()
	    	user.organization = organization
	    	user.save(function (err2) {
		    	organization.admin = user
		    	organization.save(function (err1) {
		    		req.flash('message', {type: 'success', message: 'Organization created !'});   
		        	res.send({status: "saved", url: "/organizations"})
		        })  
	    	})
	     }  
	})
  });
}

exports.edit = function (req, res){
	Organization.findOne({ _id:  req.params.id}).populate('admin').exec(function (err, organization) {
		console.log(organization)
		res.render('organization/form', {
			organization: organization,
			label: 'Update Organization',
			notNew: true,
			action: "/organization/"+organization.id+"/update"
		})		
	})
}

exports.update = function (req, res){
	Organization.findOne({ _id:  req.params.id}).populate('admin').exec(function (err, organization) {
		organization = extend(organization, req.body)
		user         = extend(organization.admin, req.body)
		organization.validate(function (err1) {
			user.validate(function (err2) {
		    if (err1 || err2) {
		    err1 = 	(err1) ? err1.errors : {}
		    err2 = 	(err2) ? err2.errors : {}
		    errors = extend(err1, err2)	
		      return res.render('organization/form',{
		        errors: errors,
		        organization: req.body,
		        notNew: true,
		        label: 'Update Organization',
		        action: "/organization/"+organization.id+"/update"
		      });
		    }
		    else {
		    	user.setPassword()
		    	user.save(function (err2) {
			    	organization.save(function (err1) {
			    		req.flash('message', {type: 'success', message: 'Organization updated !'});   
			        	res.send({status: "saved", url: "/organizations"})     
			        })  
		    	})
		     }	    
		})
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