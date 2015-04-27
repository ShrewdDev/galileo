var  mongoose         = require('mongoose')
    ,Schema           = mongoose.Schema
    ,validator        = require('validator')
    ,validate         = require('mongoose-validator')
    ,uniqueValidator  = require('mongoose-unique-validator')
    ,nodemailer       = require('nodemailer')

var DepartmentSchema = new Schema({
  departmentName:       { type: String, required: "Department Name can't be blank" },
  organization:         { type: Schema.ObjectId, ref : 'Organization' },
  owner:                { type: Schema.ObjectId, ref : 'User'},
  teamMembers:          { type: String, validate: validate({validator: 'isNumeric'}) },
  location:             { type: String }
})
DepartmentSchema.index({ departmentName: 1, organization: 1 }, { unique: true });
mongoose.model('Department', DepartmentSchema)
