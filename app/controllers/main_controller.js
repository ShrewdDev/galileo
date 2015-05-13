var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Department = mongoose.model('Department'),
    Organization = mongoose.model('Organization')

exports.index = function (req, res){
	req.flash('info', "main")	
	if(req.isAuthenticated()){
		if(req.user.hasRole('Site_Admin')){
			return res.redirect('/organizations');
		} else if (req.user.hasRole('Customer_Admin')){
			return res.redirect('/departments'); 
		}
		else if (req.user.hasRole('Customer_Manager')){
			return res.redirect('/team_members');  
		}
		else if (req.user.hasRole('Customer_TeamMember')){
			return res.redirect('/surveys');  
		}
	}
	else{
		res.render('main/home', {

		})
	}
}

exports.account = function (req, res){
	res.render('main/account', {   
		user: req.user 
	})		
}

exports.managesurveys = function (req, res){
	res.render('main/managesurveys', {  
		monthsOfYear:  User.getMonthsOfYear(),
		user:          req.user
	})		
}

exports.new_department = function (req, res){
	res.render('main/department_form', {   
		action: "/department/new" 
	})		
}

exports.create_department = function (req, res){	
  var department           = new Department(req.body);
  department.organization  = req.user.companyName;
  department.save(function (err) {
    if (err) {
    	console.log(err)

    	errors = (err.errors) ? err.errors : {departmentName:  {  message: 'Duplicate department name.' }}
      return res.render('main/department_form',{
        errors: errors,
        department: department
      });
    }
    else {
        req.flash('error', 'Department created!');
        return res.redirect('/');       
    }
  });		
}

exports.departments = function (req, res){
	res.render('main/departments', {
		
	})		
}

exports.team_members = function (req, res){
	res.render('main/team_members', {
	
	})	
}

exports.new_team_member = function (req, res){
	var user  = new User(req.body);
	user.role = 'Customer_TeamMember'

	res.render('main/team_member_form', {
	
	})
}

exports.create_team_member = function (req, res){
	res.render('main/team_member_form', {
		
	})	
}

exports.edit_department = function (req, res){
	Department.findOne({ _id:  req.params.id}, function (err, department) {
		res.render('main/department_form', {
			action: "/department/"+req.params.id+"/update",
			department: department
		})		
	})
}

exports.update_department = function (req, res){	
	Department.findOne({ _id:  req.params.id}, function (err, department) {
		res.render('main/department_form', {
			action: "/department/"+req.params.id+"/update",
			department: req.body
		})		
	})
}

exports.destroy = function (req, res){
	var article = req.article;
		article.remove(function (err){
		req.flash('info', 'Deleted successfully');
		res.redirect('/articles');
	});
};