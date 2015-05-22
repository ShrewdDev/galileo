var manager_template = {
    "type" : "Manager Survey",
    "questions" : [ 
        {
            "question" : "Select the resources most important to your group’s getting their job done [{ressource}]",
            "type" : "items_rank"
        }, 
        {
            "question" : "What are the top 3 teams with which your team interacts on a regular basis? [{department}]",
            "type" : "department"
        }, 
        {
            "question" : "What are the items you receive from {tag_department_repeat_3} ?",
            "type" : "items_multiple_choices"
        }, 
        {
            "question" : "How frequently are you expecting {tag_ressource_repeat_3} from {tag_department_repeat_3} ?",
            "type" : "unique_choice",
            "responses" : [ 
                {
                    "response" : "Weekly"
                }, 
                {
                    "response" : "Monthly"
                }, 
                {
                    "response" : "Quarterly"
                }, 
                {
                    "response" : "Less often"
                }
            ]
        }, 
        {
            "question" : "How frequently are they sharing {tag_ressource_repeat_3} from {tag_department_repeat_3} ?",
            "type" : "unique_choice",
            "responses" : [ 
                {
                    "response" : "Weekly"
                }, 
                {
                    "response" : "Monthly"
                }, 
                {
                    "response" : "Quarterly"
                }, 
                {
                    "response" : "Less often"
                }
            ]
        }, 
        {
            "question" : "Are you receiving {tag_ressource_repeat_3} from {tag_department_repeat_3} on time for your purposes?",
            "type" : "unique_choice",
            "responses" : [ 
                {
                    "response" : "Rarely"
                }, 
                {
                    "response" : "Sometimes"
                }, 
                {
                    "response" : "Often"
                }, 
                {
                    "response" : "Always"
                }
            ]
        }, 
        {
            "question" : "What is the level of quality of {tag_ressource_repeat_3} from {tag_department_repeat_3} ?",
            "type" : "unique_choice",
            "responses" : [ 
                {
                    "response" : "Minimal quality"
                }, 
                {
                    "response" : "Acceptable quality"
                }, 
                {
                    "response" : "Excellent quality"
                }
            ]
        }, 
        {
            "question" : "What do you give to {tag_department_repeat_3} ?",
            "type" : "items_multiple_choices"
        }        
    ]
}
var  mongoose        = require('mongoose')
    ,Schema          = mongoose.Schema
    ,Department      = mongoose.model('Department')
    ,_               = require("underscore")    
    ,S               = require('string')
    ,validator       = require('validator')
    ,async           = require("async")
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
  defaultResponse:  { type: String },
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
      
      var responses    = [] 
      var questionType = question.type
      if(question.type == 'department'){
        questionType   = 'multiple_choices'
        _.each(departments, function(department){            
          responses.push({ response: department.departmentName})    
        })
      }
      else if(question.type == 'items_rank'){
        questionType   = 'multiple_choices'
        _.each(surveyItems, function(item){
          responses.push({ response: item})
        })
      } 
      else if(question.type == 'items_multiple_choices'){
        questionType   = 'multiple_choices'
        _.each(surveyItems, function(item){
          responses.push({ response: item})
        })
      } 
      else{
        responses    = question.responses
      }

      if(S(question.question).include("[{")) {
        question.generic = true
        question.tag     = S(question.question).between('[{', '}]').s
        var tags         = question.question.match(/\[(.*?)\]/g)
        questionString   = question.question.replace(tags[0], '')
        _this.questions.push({ question: questionString, tag: question.tag, type: questionType, genericParent: true, responses: responses })
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
            _this.questions.push({ question: questionString, tag: result.tag, type: questionType, genericParent: true, responses: responses })      
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
              _this.questions.push({ question: questionString, type: questionType, genericParent: true, responses: responses })
            }        
          }
        }  
      }  
    })
  next()
  })      
  
})

SurveySchema.statics = {
  getTemplate:function (type){
    return manager_template
  }
}  

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
  },  
  validQuestions:function (){
    var q = []
    _.each(this.questions, function(question){
      if(! question.generic) q.push(question)
    })    
    return q
  },
  setQuestionTitle:function (user, question, cb){      
      _this = this
      var title = question.question
      var tags  = question.question.match(/\{(.*?)\}/g)
      if(tags && tags.length > 0){
        async.each(tags, function(tag, callback){
          console.log("inside " + tag)
          _tag    = S(tag).between('{', '}').s
          split   = _tag.split('_')
          _tag     = split[0]
          index   = parseInt(split[1])          
          _this.model('Result').findOne({user: user, survey: _this.id, tag: _tag}, function(err, prior_results){            
            if(prior_results){
              console.log("prior_results")
              console.log(prior_results)
              result   = prior_results.response
              q        = _this.questions.id(prior_results.question)
              title    = title.replace(tag, q.responses.id(result[index-1]).response)
              callback() 
            }
            else callback()            
        })
        }, function(err){
          question.question = title 
          cb
        })         
      }   
      else cb
    }
}

ResultSchema.index({user: 1, survey: 1, question: 1}, {unique: true})

mongoose.model('Result',    ResultSchema)
mongoose.model('Survey',    SurveySchema)
mongoose.model('Question',  QuestionSchema)
mongoose.model('Response',  ResponseSchema)
