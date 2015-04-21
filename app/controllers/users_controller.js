var   mongoose = require('mongoose'),
      User = mongoose.model('User'),
      extend = require('util')._extend

exports.load = function (req, res, next, id) {
  User.findOne({ _id : id }, function (err, user) {
    if (err) return next(err);
    if (!user) return next(new Error('Failed to load User ' + id));
    req.profile = user;
    next();
  });
};

exports.create = function (req, res) {
  var user = new User(req.body);
  user.role = User.getRoleByCreator(req.user.role)
  user.save(function (err) {
    if (err) {
      return res.render('users/signup', {
        errors: err.errors,
        user:  user,
        title: 'Sign up'
      });
    }
    else {
      User.sendCustomerAdiminWelcomeEmail(req.body.email, req.body.password, function(error, message){
        message = error || 'message sent'
        req.flash('error', 'Customer created!');
        return res.redirect('/');
      });  
    }
    /*req.logIn(user, function(err) {
      if (err) req.flash('info', 'Sorry! We are not able to log you in!');
      return res.redirect('/');
    });*/
  });
};

exports.profile = function (req, res) {
  var user = req.user;
  res.render('users/profile', {
    title: user.email,
    user: user
  });
};

exports.signin = function (req, res) {};

exports.authCallback = login;

exports.login = function (req, res) {
  console.log(req.flash)
  res.render('users/login', {

  });
};

exports.signup = function (req, res) {
  res.render('users/signup', {
    title: 'Sign up',
    user: new User()
  });
};

exports.new_customer_admin = function (req, res) {
  res.render('users/signup', {
    title: 'new customer admin',
    user: new User()
  });
};

exports.logout = function (req, res) {
  req.logout();
  res.redirect('/');
};

exports.session = login;

function login (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
};

exports.forgot = function (req, res) {
  res.render('users/forgot', {
    title: 'Forgot password'
  });
};

exports.post_forgot = function (req, res) {
  User.validateForgottenEmail(req.body.email, req.headers.host, function(error, message){
    message = error || 'message sent'
    res.render('users/forgot', {
      title: 'Forgot password',
      email: req.body.email,
      message: message
    });
  });  
};

exports.reset = function (req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('users/reset', {
      title: 'Reset password',
      token: req.params.token
    });
  });  
};

exports.post_reset = function (req, res) {

  User.resetPassword(req.params.token, req.body.password, req.body.password_confirmation, function(error, message){
    if(error){
      res.render('users/reset', {
        title: 'Reset password',
        token: req.params.token,
        message: message
      });  
    }
    else {
      req.flash('message', 'Password updated.');
      res.redirect('/');
    } 
  })  
};

exports.edit = function (req, res) {
  res.render('users/edit', {
    user: req.user
  });
};

exports.update = function (req, res) {
  user = req.user
  user = extend(user, req.body)
  user.save(function (err) {
    if (err) {
      return res.render('users/edit', {
        errors: err.errors,
        user:  user
      });
    }
    else {
        req.flash('message', 'Profile updated!');
        return res.redirect('/');
      };  
    })
};
