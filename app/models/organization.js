var  mongoose         = require('mongoose')
    ,Schema           = mongoose.Schema
    ,validator        = require('validator')
    ,validate         = require('mongoose-validator')
    ,uniqueValidator  = require('mongoose-unique-validator')
    ,extend           = require('mongoose-validator').extend

extend('is3CommaSeparatedEmailsMax', function (val) {
  var valid = true;
  var emailsArray = val.split(",");
  if (emailsArray.length > 3) valid = false;
  emailsArray.forEach(function (email) { if (! validator.isEmail(email)) valid = false; });  
  return valid;
}, 'Invalid or more than 3 emails');

var OrganizationSchema = new Schema({
  organization_name:    { type: String, required: "Company name can't be blank", unique: true },
  admin_emails:         { type: String, validate: validate({validator: 'is3CommaSeparatedEmailsMax'}) }
})

OrganizationSchema.plugin(uniqueValidator, { message: '{PATH} already in use.' })
mongoose.model('Organization', OrganizationSchema)