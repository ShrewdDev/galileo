var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Organization = mongoose.model('Organization');    

exports.index = function (req, res){	
	if(req.isAuthenticated()){
		if(req.user.hasRole('Site_Admin')){
			User.find({ role : 'Customer_Admin' }, function (err, users) {
			res.render('home/index', {			    
			    users: users
			});
			})
		} else {
			Organization.find({ user : req.user._id }, function (err, organizations) {
			res.render('home/organization', {			    
			    organizations: organizations
			});
		})}
	}
	else{	
		res.render('home/home', {		    
		})
	}	
}

exports.new_organization = function (req, res){	
	res.render('home/organization_form', {		    
	})		
}

exports.create_organization = function (req, res){	
  var organization = new Organization(req.body);
  organization.created_by = req.user.id;
  organization.save(function (err) {
    if (err) {
      return res.render('home/organization_form',{
        errors: err.errors,
        organization: organization
      });
    }
    else {
        req.flash('error', 'Organization created!');
        return res.redirect('/');       
    }
  });		
}
