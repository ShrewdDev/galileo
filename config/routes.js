
var users_controller         = require('users_controller'),
    main_controller          = require('main_controller'),
    organization_controller  = require('organization_controller'),
    department_controller    = require('departments_controller'),
    team_member_controller   = require('team_member_controller'),
    survey_controller        = require('survey_controller')

var auth                     = require('./middlewares/authorization');

module.exports = function (app, passport) {

  app.get('/signup', users_controller.signup)
  app.post('/signup', users_controller.post_signup)
  app.get('/login', users_controller.login)  
  app.get('/logout', users_controller.logout)
  
  app.post('/users/session', users_controller.session);

  app.get('/users', auth.usersResponsible, users_controller.index);

  app.get('/admin/users/new', auth.usersResponsible, users_controller.admin_new_user);
  app.post('/admin/users/create', auth.usersResponsible, users_controller.admin_create_user);  
  app.get('/admin/users/:id/edit', auth.usersResponsible, users_controller.admin_edit_user);
  app.post('/admin/users/:id/update', auth.usersResponsible, users_controller.admin_update_user);  
  app.delete('/admin/users/:id/update', auth.usersResponsible, users_controller.destroy);

  app.get('/users/edit', auth.requiresLogin, users_controller.edit);
  app.post('/users/update', auth.requiresLogin, users_controller.update) 
  app.get('/forgot', users_controller.forgot);
  app.post('/forgot', users_controller.post_forgot);
  app.get('/reset/:token', users_controller.reset);
  app.post('/reset/:token', users_controller.post_reset); 
  //app.get('/admin/users', auth.requiresLogin, users_controller.admin_users) 

  app.get('/organizations', auth.isSiteAdmin, organization_controller.index);
  app.get('/organization/new', auth.isSiteAdmin, organization_controller.new);
  app.post('/organization/create', auth.isSiteAdmin, organization_controller.create); 
  app.get('/organization/:id/edit', auth.isSiteAdmin, organization_controller.edit);
  app.post('/organization/:id/update', auth.isSiteAdmin, organization_controller.update);  
  app.delete('/organization/:id/update', auth.isSiteAdmin, organization_controller.destroy);

  app.get('/departments', auth.requiresLogin, department_controller.index);
  app.get('/department/new', auth.requiresLogin, department_controller.new);
  app.post('/department/create', auth.requiresLogin, department_controller.create); 
  app.get('/department/:id/edit', auth.requiresLogin, department_controller.edit);
  app.post('/department/:id/update', auth.requiresLogin, department_controller.update);  
  app.delete('/department/:id/update', auth.requiresLogin, department_controller.destroy);
  /*
  app.get('/departments', auth.requiresLogin, department_controller.index);
  app.get('/department/new', auth.requiresLogin, department_controller.new);
  app.post('/department/create', auth.requiresLogin, department_controller.create); 
  app.get('/department/:id/edit', auth.requiresLogin, department_controller.edit);
  app.post('/department/:id/update', auth.requiresLogin, department_controller.update);  
*/
  app.get('/team_members', auth.requiresLogin, team_member_controller.index);
  app.get('/team_member/new', auth.requiresLogin, team_member_controller.new);  
  app.post('/team_member/create', auth.requiresLogin, team_member_controller.create); 
  app.get('/team_member/:id/edit', auth.requiresLogin, team_member_controller.edit);
  app.post('/team_member/:id/update', auth.requiresLogin, team_member_controller.update);
  app.delete('/team_member/:id/update', auth.requiresLogin, team_member_controller.destroy); 
  //app.get('/survey/index', auth.requiresLogin, survey_controller.index);
  
  app.get('/admin/surveys', auth.requiresLogin, survey_controller.customer_admin_surveys);
  app.get('/users/managesurveys', auth.requiresLogin, main_controller.managesurveys);  
  app.get('/survey/new', auth.requiresLogin, survey_controller.new);
  app.get('/survey/:type/new', auth.requiresLogin, survey_controller.new_from_template);  
  
  app.post('/survey/create', auth.requiresLogin, survey_controller.create); 
  app.get('/survey/:id/edit', auth.requiresLogin, survey_controller.edit);
  app.post('/survey/:id/update', auth.requiresLogin, survey_controller.update);

  app.get('/survey/question_partial', auth.requiresLogin, survey_controller.survey_question_partial);
  app.get('/survey/question_response_partial', auth.requiresLogin, survey_controller.question_response_partial);

  app.get('/surveys', auth.requiresLogin, survey_controller.user_surveys);
  app.get('/surveys/:id/takesurvey/:step', auth.requiresLogin, survey_controller.take_survey);
  app.post('/surveys/:id/takesurvey/:step', auth.requiresLogin, survey_controller.post_survey_result);

  //app.get('/departments', auth.requiresLogin, main_controller.departments);
  //app.get('/team_member/new', auth.requiresLogin, main_controller.new_team_member);  

  app.get('/users/account', auth.requiresLogin, main_controller.account);

  //app.get('/admin/customer/new', auth.siteAdminAuth, users_controller.new_customer_admin);

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
