var  mongoose        = require('mongoose')
    ,Schema          = mongoose.Schema
    ,Department      = mongoose.model('Department')
    ,_               = require("underscore")    
    ,S               = require('string')
    ,validator       = require('validator')
    ,validate        = require('mongoose-validator')
    ,uniqueValidator = require('mongoose-unique-validator')
    ,surveyTypes     = ['Manager Survey', 'Employee Survey']
    ,surveyItems     = ['Documents', 'Document numbers or specification numbers', 'Signature approval', 'Funds', 'Material resources', 'Production process knowledge', 'Business process knowledge', 'Product knowledge', 'Technical knowledge', 'Manufacturing knowledge', 'Contacts', 'Document design/review', 'Training', 'FYI emails or memos', 'Technical services', 'Skilled Labor/People resources']


var ResultSchema = new Schema({
  user:             { type: Schema.ObjectId, ref: 'User'},
  survey:           { type: Schema.ObjectId, ref: 'Survey'},
  question:         { type: Schema.ObjectId, ref: 'Question'},
  tag:              { type: String },
  response:         [ ResponseSchema ],
  value:            { type: String}
})

var ResponseSchema = new Schema({
  response:         { type: String }  
})

var QuestionSchema = new Schema({
  question:         { type: String, required: "Question can't be blank" },
  type:             { type: String, required: "Question type can't be blank" },
  generic:          { type: Boolean, default : false },
  genericParent:    { type: Boolean, default : false },
  tag:              { type: String },
  tagOrder:         { type: Number },  
  defaultResponse:  { type: String   },
  responses:        [ ResponseSchema ]
})

var SurveySchema = new Schema({
    title:             { type : String, required: "Title can't be blank" },
    type:              { type : String, required: "Survey type can't be blank"  },
    questions:         [ QuestionSchema ],
    organization:      { type : Schema.ObjectId, ref : 'Organization'},  
    confirmed:         { type : Boolean, default : false},
    totalParticipants: { type : Number,  default : 0},
    createdAt:         { type : Date,    default : Date.now},
})

function getTagAndNumber(tag){
  var number = parseInt(tag.match(/\d+/)[0])
  var _tag = tag.split('_')
  _tag     = _tag[1]
  return {tag: _tag, number: parseInt(number+1)}
}

SurveySchema.pre('save', function(next) {
  _this = this
  Department.find({organization: _this.organization}, function(err, departments){
    _.each(_this.questions, function(question){
      if(question.type == 'department'){  
          question.generic = true
          question.responses = []         
          _.each(departments, function(department){
            console.log(department.departmentName)
            question.responses.push({ response: department.departmentName})    
          })          
      }
      if(question.type == 'items_rank' || question.type == 'items_multiple_choices'){
        question.generic = true
        question.responses = []
        _.each(surveyItems, function(item){
          question.responses.push({ response: item})
        })
      }
      if(S(question.question).include("[{")) {
        question.tag = S(question.question).between('[{', '}]').s
      }
      if(S(question.question).include("{tag_")) {
        question.generic = true
        var tags = question.question.match(/\{(.*?)\}/g)
        if(tags.length == 1){
          var tag    = tags[0]
          var result = getTagAndNumber(tag)
          for (var i = 1; i < result.number; i++) {
            questionString = question.question
            questionString = questionString.replace(tag, "{"+result.tag+"_"+i+"}")
            _this.questions.push({ question: questionString, tag: result.tag, tagOrder: i, type: question.type, genericParent: true, responses: question.responses })      
          } 
        }
        if(tags.length == 2){
          var tag1    = tags[0]
          var result1 = getTagAndNumber(tag1)
          var tag2    = tags[1]
          var result2 = getTagAndNumber(tag2)        
          for (var i = 1; i < result1.number; i++) {
            for (var j = 1; j < result2.number; j++) {            
              questionString = question.question
              questionString = questionString.replace(tag1, "{"+result1.tag+"_"+i+"}").replace(tag2, "{"+result2.tag+"_"+j+"}")
              _this.questions.push({ question: questionString, type: question.type, genericParent: true, responses: question.responses })
            }        
          }
        }  
      }  
    })
  next()
  })      
  
})

SurveySchema.methods = {
  getQuestionRessources:function (questionId){
    question   = this.questions.id(questionId)
    ressources = question.responses[0].response.split(',')    
    return ressources
  },
  getQuestionBins:function (questionId){    
    question   = this.questions.id(questionId)
    bins       = question.responses[1].response.split(',')    
    return bins
  },  
  getSurveyTypes:function (){
    return surveyTypes
  }
}


ResultSchema.index({user: 1, survey: 1, question: 1}, {unique: true})

mongoose.model('Result',    ResultSchema)
mongoose.model('Survey',    SurveySchema)
mongoose.model('Question',  QuestionSchema)
mongoose.model('Response',  ResponseSchema)
