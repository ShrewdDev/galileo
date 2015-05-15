var  mongoose         = require('mongoose')
    ,Schema           = mongoose.Schema
    ,validator        = require('validator')
    ,validate         = require('mongoose-validator')
    ,uniqueValidator  = require('mongoose-unique-validator')
    ,nodemailer       = require('nodemailer')
    ,extend           = require('mongoose-validator').extend

extend('isCommaSeparatedEmails', function (val) {
  var valid = true;
  val.replace(/ /g, "").split(",").forEach(function (email) { if (! validator.isEmail(email.trim())) valid = false; })
  return valid;
}, 'Invalid emails');

var DepartmentSchema = new Schema({
  departmentName:       { type: String, required: "Department Name can't be blank" },
  organization:         { type: Schema.ObjectId, ref : 'Organization' },
  manager:              { type: Schema.ObjectId, ref : 'User'},
  manager_email:        { type: String, validate: validate({validator: 'isEmail'})},
  teamMembers:          { type: String, validate: validate({validator: 'isCommaSeparatedEmails'}) },
  location:             { type: String }
})

DepartmentSchema.methods = {  
  getSpaceCleanedEmails:function (){
    return this.teamMembers.replace(/ /g, "").split(",")
  }
}

DepartmentSchema.index({ departmentName: 1, organization: 1 }, { unique: true });

mongoose.model('Department', DepartmentSchema)
