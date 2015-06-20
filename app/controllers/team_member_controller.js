var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Department = mongoose.model('Department'),
    Organization = mongoose.model('Organization'),
    extend = require('util')._extend

exports.index = function (req, res){
	User.find({department: req.user.department, role: 'Customer_TeamMember'}).populate('department').exec(function (err, team_members) {
		res.render('team_member/index', {
		    team_members: team_members,
		    message: req.flash('message')
		});
	})	
}

exports.new = function (req, res){
	user = new User()
	Department.findOne({_id: req.user.department}, function(err, department){
		user.departmentName = department.departmentName
		user.location = department.location
		res.render('team_member/form', {
			user:  user,
			label: 'New Member',
			action: '/team_member/create'
		})
	})
}

exports.create = function (req, res) {
  var user = new User(req.body);
  user.role = 'Customer_TeamMember'
  user.department   = req.user.department
  user.organization = req.user.organization
  user.save(function (err){
    if (err) {
      return res.render('team_member/form', {
        errors: err.errors,
        user:  req.body,
        label: 'New Member',
        action: "/team_member/create"
      });
    }
    else {
    	User.getDepartmentMembersEmails(user.department, function(teamMembers){
    		Department.update({_id: user.department}, { teamMembers:  teamMembers}, function(){})
    	})    	
		req.flash('message', {type: 'success', message: 'Member created !'})
    	res.send({status: "saved", url: "/team_members"})   
    }
  })
}

exports.edit = function (req, res){
	User.findOne({ _id:  req.params.id}).populate('department').exec(function (err, user) {
		res.render('team_member/form', {
			user: user,
			label: 'Edit Member',
			notNew: true,
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
		    notNew: true,
		    label: 'Edit Member',
		    action: "/team_member/"+user.id+"/update"
		  });
		}
		else {     
    	User.getDepartmentMembersEmails(user.department, function(teamMembers){
    		Department.update({_id: user.department}, { teamMembers:  teamMembers}, function(){})
    	})    	
		req.flash('message', {type: 'success', message: 'Member updated !'})
    	res.send({status: "saved", url: "/team_members"})            
		}
	  });		
	})
}

exports.destroy = function (req, res){
	User.findOneAndRemove({ _id:  req.params.id}, function (err, user) {
		req.flash('message', {type: 'success', message: 'User deleted !'})
    	res.send({status: "saved", url: "/team_members"})
	})
}