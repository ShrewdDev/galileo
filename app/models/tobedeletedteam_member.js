var  mongoose         = require('mongoose')
    ,Schema           = mongoose.Schema
    ,validator        = require('validator')
    ,validate         = require('mongoose-validator')     

var TeamMemberSchema = new Schema({
  departmentName:       { type: String },
  email:                { type: String, required: "email can't be blank", validate: validate({validator: 'isEmail'})},
  firstName:            { type: String },
  lastName:             { type: String },  
  department:           { type: Schema.ObjectId, ref : 'Department'},  
  createdAt:            { type: Date, default : Date.now }
})
mongoose.model('TeamMember', TeamMemberSchema)