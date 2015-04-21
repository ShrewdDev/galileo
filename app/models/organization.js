var  mongoose = require('mongoose')
    ,Schema = mongoose.Schema
    ,validator = require('validator')
    ,validate  = require('mongoose-validator')
    ,uniqueValidator = require('mongoose-unique-validator')
    ,nodemailer = require('nodemailer')

var OrganizationSchema = new Schema({
  departmentName:       { type: String, required: "Department Name can't be blank" },
  leaderEmail:          { type: String, required: "Leader email can't be blank", validate: validate({validator: 'isEmail'})},
  teamMembers:          { type: Number },
  location:             { type: String },  
  created_by:           { type: Schema.ObjectId, ref : 'User'},
  createdAt:            { type: Date, default : Date.now }
})

mongoose.model('Organization', OrganizationSchema)