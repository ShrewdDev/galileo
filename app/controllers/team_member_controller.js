var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Department = mongoose.model('Department'),
    Organization = mongoose.model('Organization'),
    extend = require('util')._extend

exports.index = function (req, res){
	User.find({role: 'Customer_TeamMember'}).populate('manager department').exec(function (err, team_members) {
		res.render('team_member/index', {
		    team_members: team_members
		});
	})	
}
exports.new = function (req, res){
	res.render('team_member/form', {   
		user: new User(),
		action: "/team_member/create"
	})
}

exports.create = function (req, res) {
  var user = new User(req.body);
  user.role = 'Customer_TeamMember'
  user.setPassword()
  user.manager    = req.user
  user.department = req.user.department
  user.save(function (err){
    if (err) {
      return res.render('team_member/form', {
        errors: err.errors,
        user:  user,
        action: "/team_member/create"
      });
    }
    else {     
      return res.redirect('/team_members');            
    }
  });
};

exports.edit = function (req, res){
	User.findOne({ _id:  req.params.id}).exec(function (err, user) {
		res.render('team_member/form', {
			user: user,
			action: "/team_member/"+user.id+"/update"
		})		
	})
}

exports.update = function (req, res){
	User.findOne({ _id:  req.params.id}).exec(function (err, user) {
		user         = extend(user, req.body)
		user.save(function (err){
		if (err) {
		  return res.render('team_member/form', {
		    errors: err.errors,
		    user:  user,
		    action: "/team_member/"+user.id+"/update"
		  });
		}
		else {     
		  return res.redirect('/team_members');            
		}
	  });		
	})
}