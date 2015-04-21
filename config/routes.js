
var users_controller = require('users_controller');
var home_controller   = require('home_controller');
var auth = require('./middlewares/authorization');

module.exports = function (app, passport) {

  app.get('/profile', users_controller.profile);

  app.get('/login', users_controller.login);
  app.get('/signup', users_controller.signup);
  app.get('/logout', users_controller.logout);
  app.post('/users', users_controller.create);
  /*app.post('/users/session',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }), users_controller.session);*/
  app.post('/users/session', passport.authenticate('local',{
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: 'Invalid email or password.'
  }),function(req, res){
        res.render('users/login', {
          email: "reqemail"
      });
  })
 
  app.get('/users/edit', auth.requiresLogin, users_controller.edit);
  app.post('/users/update', auth.requiresLogin, users_controller.update) 
  app.get('/forgot', users_controller.forgot);
  app.post('/forgot', users_controller.post_forgot);
  app.get('/reset/:token', users_controller.reset);
  app.post('/reset/:token', users_controller.post_reset); 


  app.get('/organization/new', auth.requiresLogin, home_controller.new_organization); 
  app.post('/organization/new', auth.requiresLogin, home_controller.create_organization); 

  app.get('/admin/customer/new', auth.siteAdminAuth, users_controller.new_customer_admin);

  //app.get('/users/:user_id/edit', auth.siteAdminAuth, users_controller.edit_customer_admin);

  app.get('/', home_controller.index);

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
