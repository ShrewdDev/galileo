var fs = require('fs');
var env = {};
var envFile = __dirname + '/env.json';

if (fs.existsSync(envFile)) {
  env = fs.readFileSync(envFile, 'utf-8');
  env = JSON.parse(env);
  Object.keys(env).forEach(function (key) {
    process.env[key] = env[key];
  });
}

module.exports = {
  db: 'mongodb://localhost/survey_app'
};
