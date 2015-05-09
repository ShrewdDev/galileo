var   mongoose      = require('mongoose'),
      User          = mongoose.model('User'),
      Organization  = mongoose.model('Organization'),
      extend        = require('util')._extend


exports.index = function (req, res) {
  query = {}
  if(req.user.role == 'Customer_Admin')   query = {organization: req.user.organization}
  if(req.user.role == 'Customer_Manager') query = {organization: req.user.organization, department: req.user.department}
  User.find(query).populate('organization department').exec(function (err, users) {
    return res.render('users/admin_users', {
      users: users,
      message: req.flash('message')
    })
  });
};

/*
exports.admin_users = function (req, res) {
  User.find({}).populate('organization').exec(function (err, users) {
    return res.render('users/admin_users', {
      users: users,
      message: req.flash('message')
    })
  });
};
*/

exports.admin_new_user = function (req, res) {
  Organization.find({}, function(err, organizations){
    var user = new User()
    res.render('users/admin_user_form', { 
      user: user,
      roles: user.getRoles(),
      organizations: organizations,
      label: 'New User',
      action: '/admin/users/create'
    })
  })
};

exports.admin_create_user = function (req, res) {
  var user = new User(req.body);
  user.save(function (err) {
    if(err){
      Organization.find({}, function(err2, organizations){
          return res.render('users/admin_user_form',{
            errors: err.errors,
            roles: user.getRoles(),
            organizations: organizations,
            user: req.body,
            label: 'New User',
            action: '/admin/users/create'
          })
        })
    }
    else{
        req.flash('message', {type: 'success', message: 'User created !'});   
        res.send({status: "saved", url: "/admin/users"})
    }
  })
}

exports.admin_edit_user = function (req, res){
  User.findOne({ _id:  req.params.id}, function (err, user){   
    Organization.find({}, function(err, organizations){
      res.render('users/admin_user_form', {
        user: user,
        roles: user.getRoles(),
        organizations: organizations,
        notNew: true,
        label: 'Update User',
        action: '/admin/users/'+user.id+'/update'
      })    
    })
  })
}

exports.admin_update_user = function (req, res){
  User.findOne({ _id:  req.params.id}, function (err, user){   
    user       = extend(user, req.body)
    user.save(function (err) {
      if(err){      
        res.render('users/admin_user_form', {
          user: user,
          roles: user.getRoles(),
          organizations: organizations,
          notNew: true,
          label: 'Update User',
          action: '/admin/users/'+user.id+'/update'
        })
      }
      else{
        req.flash('message', {type: 'success', message: 'User updated !'});   
        res.send({status: "saved", url: "/admin/users"})        
      }
    })
  })
}

exports.create = function (req, res) {
  var user = new User(req.body)
  user.save(function (err) {
    if(err){
      Organization.find({}, function(err2, organizations){
          return res.render('users/admin_user_form',{
            errors: err.errors,
            roles: user.getRoles(),
            organizations: organizations,
            user: req.body,
            label: 'New User',
            action: '/admin/users/create'
          })
        })
    }
    else{
        req.flash('message', {type: 'success', message: 'User created !'});   
        res.send({status: "saved", url: "/admin/users"})
    }
  })
}

/*
exports.create = function (req, res) {
  var user = new User(req.body);
  user.role = (user.getAdminEmails().indexOf(req.body.email) > -1) ? "Site_Admin" : "Customer_Admin"
  user.save(function (err) {
    if (err) {
      return res.render('users/signup', {
        errors: err.errors,
        user:  user,
        title: 'Sign up'
      });
    }
    else {
      user.setPassword()
      user.save(function (err) {
        User.sendCustomerAdiminWelcomeEmail(req.body.email, req.body.password, function(error, message){
          message = error || 'message sent'
          req.flash('error', 'Customer created!');
          return res.redirect('/');
        });  
      });    
    }
  });
};
*/
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

exports.session = function (req, res) {
  User.findOne({ email: req.body.email}, function (err, user) {
    if(user && user.authenticate(req.body.password)){       
        req.logIn(user, function(err) {
          return res.redirect('/');
        }); 
    }
    else{
      res.render('users/login', {
         errors: "Invalid email or password.",
          user: req.body
      });
    }
    
  });
};


//exports.session = login;

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
  console.log(req.body)  
  user = extend(user, req.body)
  user.save(function (err) {
    if (err) {
      view = req.body.view || 'users/edit'
      console.log(err)
      errors = err.errors || err
      return res.render(view, {
        errors: err.errors,
        monthsOfYear:  User.getMonthsOfYear(),
        user:  req.body
      });
    }
    else {
        req.flash('message', {type: 'success', message: 'Profile updated!'});
        return res.redirect('/');
      };  
    })
};

exports.destroy = function (req, res){
  User.findOne({ _id:  req.params.id}, function (err, user) {
    user.remove(function (err){
        req.flash('message', {type: 'success', message: 'User deleted !'});   
        res.send({status: "saved", url: "/admin/users"})     
    })
  })
}