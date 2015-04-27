
var users_controller = require('users_controller');
var main_controller   = require('main_controller');
var organization_controller = require('organization_controller');
var department_controller = require('departments_controller');
var team_member_controller = require('team_member_controller');

var auth = require('./middlewares/authorization');

module.exports = function (app, passport) {

  app.get('/profile', users_controller.profile);

  app.get('/login', users_controller.login);
  app.get('/signup', users_controller.signup);
  app.get('/logout', users_controller.logout);
  app.post('/users', users_controller.create);
  app.post('/users/session',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }), users_controller.session);
 
  app.get('/users/edit', auth.requiresLogin, users_controller.edit);
  app.post('/users/update', auth.requiresLogin, users_controller.update) 
  app.get('/forgot', users_controller.forgot);
  app.post('/forgot', users_controller.post_forgot);
  app.get('/reset/:token', users_controller.reset);
  app.post('/reset/:token', users_controller.post_reset); 
  app.get('/admin/users', auth.requiresLogin, users_controller.admin_users) 

  app.get('/organization/new', auth.requiresLogin, organization_controller.new);
  app.post('/organization/create', auth.requiresLogin, organization_controller.create); 
  app.get('/organization/:id/edit', auth.requiresLogin, organization_controller.edit);
  app.post('/organization/:id/update', auth.requiresLogin, organization_controller.update);  

  app.get('/department/new', auth.requiresLogin, department_controller.new);
  app.post('/department/create', auth.requiresLogin, department_controller.create); 
  app.get('/department/:id/edit', auth.requiresLogin, department_controller.edit);
  app.post('/department/:id/update', auth.requiresLogin, department_controller.update);  

  app.get('/team_members', auth.requiresLogin, team_member_controller.index);
  app.get('/team_member/new', auth.requiresLogin, team_member_controller.new);  
  app.post('/team_member/create', auth.requiresLogin, team_member_controller.create); 
  app.get('/team_member/:id/edit', auth.requiresLogin, team_member_controller.edit);
  app.post('/team_member/:id/update', auth.requiresLogin, team_member_controller.update);
    
  app.get('/departments', auth.requiresLogin, main_controller.departments);

  //app.get('/team_member/new', auth.requiresLogin, main_controller.new_team_member);  

  app.get('/users/account', auth.requiresLogin, main_controller.account);
  app.get('/users/managesurveys', auth.requiresLogin, main_controller.managesurveys);

  app.get('/admin/customer/new', auth.siteAdminAuth, users_controller.new_customer_admin);

  //app.get('/users/:user_id/edit', auth.siteAdminAuth, users_controller.edit_customer_admin);

  app.get('/', main_controller.index);

  app.use(function (err, req, res, next) {
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    console.error(err.stack);
    res.status(500).render('500', { error: err.stack });
  });

  app.use(function (req, res, next) {
    res.status(404).render('404', {
      url: req.originalUrl,
      error: 'Not found'
    });
  });
}
