var  mongoose         = require('mongoose')
    ,Schema           = mongoose.Schema
    ,validator        = require('validator')
    ,validate         = require('mongoose-validator')
    ,uniqueValidator  = require('mongoose-unique-validator')
    ,extend           = require('mongoose-validator').extend

extend('isLessThan3CommaSeparatedEmails', function (val) {
  var valid = true;
  var emailsArray = val.split(",");
  if (emailsArray.length > 3) valid = false;
  emailsArray.forEach(function (email) { if (! validator.isEmail(email)) valid = false; });  
  return valid;
}, 'Invalid emails');

var OrganizationSchema = new Schema({
  organization_name:    { type: String, required: "Company name can't be blank", unique: true },
  admin_emails:         { type: String, required: "Admins emails can't be blank", validate: validate({validator: 'isLessThan3CommaSeparatedEmails'}) }
})

mongoose.model('Organization', OrganizationSchema)