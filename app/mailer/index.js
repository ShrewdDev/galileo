var mongoose = require('mongoose');
var Notifier = require('notifier');
var config = require('config');

Notifier.prototype.processTemplate = function (tplPath, locals) {
  var swig = require('swig');
  locals.filename = tplPath;
  return swig.renderFile(tplPath, locals);
};

module.exports = {

  comment: function (options, cb) {
    var article = options.article;
    var author = article.user;
    var user = options.currentUser;
    var notifier = new Notifier(config.notifier);

    var obj = {
      to: author.email,
      from: 'your@product.com',
      subject: user.name + ' added a comment on your article ' + article.title,
      alert: user.name + ' says: "' + options.comment,
      locals: {
        to: author.name,
        from: user.name,
        body: options.comment,
        article: article.name
      }
    };

    try {
      notifier.send('comment', obj, cb);
    } catch (err) {
      console.log(err);
    }
  }
};
