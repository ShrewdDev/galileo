exports.requiresLogin = function (req, res, next) {
  if (req.isAuthenticated()) return next()
  if (req.method == 'GET') req.session.returnTo = req.originalUrl
  res.redirect('/login')
}

exports.siteAdminAuth = function (req, res, next) {
  if (req.isAuthenticated() && req.user.hasRole("Site_Admin")) return next()
  if (req.method == 'GET') req.session.returnTo = req.originalUrl
  res.redirect('/login')
}

exports.isSiteAdmin = function (req, res, next) {
  if (req.isAuthenticated() && req.user.hasRole("Site_Admin")) return next()
  req.flash('message', {type: 'danger', message: 'You are not authorized'})
  res.redirect('/')
}

exports.user = {
  hasAuthorization: function (req, res, next) {
    if (req.profile.id != req.user.id) {
      req.flash('info', 'You are not authorized')
      return res.redirect('/users/' + req.profile.id)
    }
    next()
  }
}

exports.article = {
  hasAuthorization: function (req, res, next) {
    if (req.article.user.id != req.user.id) {
      req.flash('info', 'You are not authorized')
      return res.redirect('/articles/' + req.article.id)
    }
    next()
  }
}

exports.comment = {
  hasAuthorization: function (req, res, next) {
    if (req.user.id === req.comment.user.id || req.user.id === req.article.user.id) {
      next()
    } else {
      req.flash('info', 'You are not authorized')
      res.redirect('/articles/' + req.article.id)
    }
  }
}
