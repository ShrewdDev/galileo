var  mongoose         = require('mongoose')
    ,Schema           = mongoose.Schema
    ,validator        = require('validator')
    ,validate         = require('mongoose-validator')

var CommentSchema = new Schema({
   text:                 { type: String, required: "Comment can't be blank" }
  ,view_tag:             { type: String } 
  ,user:                 { type: Schema.ObjectId, ref : 'User'}
  ,actionItemUser:       { type: Schema.ObjectId, ref : 'User'}  
  ,privacy:              { type: String }
  ,isActionItem:         { type: Boolean }
  ,createdAt:            { type : Date, default : Date.now}
})

mongoose.model('Comment', CommentSchema)
