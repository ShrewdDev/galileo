var  mongoose         = require('mongoose')
    ,Schema           = mongoose.Schema
    ,validator        = require('validator')
    ,validate         = require('mongoose-validator')
    ,uniqueValidator  = require('mongoose-unique-validator')
    ,nodemailer       = require('nodemailer')
    ,extend           = require('mongoose-validator').extend

extend('isCommaSeparatedEmails', function (val) {
  var valid = true;
  val.split(",").forEach(function (email) { if (! validator.isEmail(email)) valid = false; });  
  return valid;
}, 'Invalid emails');

var DepartmentSchema = new Schema({
  departmentName:       { type: String, required: "Department Name can't be blank" },
  organization:         { type: Schema.ObjectId, ref : 'Organization' },
  manager:              { type: Schema.ObjectId, ref : 'User'},
  teamMembers:          { type: String, validate: validate({validator: 'isCommaSeparatedEmails'}) },
  location:             { type: String }
})


DepartmentSchema.index({ departmentName: 1, organization: 1 }, { unique: true });

mongoose.model('Department', DepartmentSchema)
