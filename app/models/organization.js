var  mongoose         = require('mongoose')
    ,Schema           = mongoose.Schema
    ,validator        = require('validator')
    ,validate         = require('mongoose-validator')
    ,uniqueValidator  = require('mongoose-unique-validator')

var OrganizationSchema = new Schema({
  organization_name:    { type: String, required: "Company name can't be blank", unique: true },
  owner:                { type: Schema.ObjectId, ref : 'User'}
})

mongoose.model('Organization', OrganizationSchema)