var mongoose = require('mongoose');
var User = mongoose.model('User');

exports.index = function (req, res){	
	if(req.isAuthenticated()){
		User.find({ role : 'Customer_Admin' }, function (err, users) {
		res.render('home/index', {
		    title: "Homepage",
		    users: users
		});	
	})		
	}
	else{	
		res.render('home/home', {
		    title: "Homepage",
		    isAuthenticated: req.isAuthenticated()
		})
	}	
}