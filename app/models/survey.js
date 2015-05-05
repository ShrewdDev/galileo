var  mongoose        = require('mongoose')
    ,Schema          = mongoose.Schema
    ,validator       = require('validator')
    ,validate        = require('mongoose-validator')
    ,uniqueValidator = require('mongoose-unique-validator')
    ,surveyTypes     = ['Manager Survey', 'Employee Survey']


var ResultSchema = new Schema({
  user:             { type: Schema.ObjectId, ref: 'User'},
  survey:           { type: Schema.ObjectId, ref: 'Survey'},
  question:         { type: Schema.ObjectId, ref: 'Question'},
  response:         [ ResponseSchema ],
  value:            { type: String}
})

var ResponseSchema = new Schema({
  response:         { type: String }  
})

var QuestionSchema = new Schema({
  question:         { type: String, required: "Question can't be blank" },
  type:             { type: String, required: "Question type can't be blank" },
  defaultResponse:  { type: String   },
  responses:        [ ResponseSchema ]  
})

var SurveySchema = new Schema({
    title:             { type : String, required: "Title can't be blank" },
    type:              { type : String, required: "Survey type can't be blank"  },
    questions:         [ QuestionSchema ],
    organization:      { type : Schema.ObjectId, ref : 'Organization'},    
    totalParticipants: { type : Number, default : 0},
    createdAt:         { type : Date, default : Date.now},
})

SurveySchema.methods = {
  getSurveyTypes:function (){
    return surveyTypes;
  }
}

SurveySchema.methods = {
  getSurveyTypes:function (){
    return surveyTypes;
  }
}

ResultSchema.index({user: 1, survey: 1, question: 1}, {unique: true})

mongoose.model('Result',    ResultSchema)
mongoose.model('Survey',    SurveySchema)
mongoose.model('Question',  QuestionSchema)
mongoose.model('Response',  ResponseSchema)
