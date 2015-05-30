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
var employee_template = {
    "type" : "Employee Survey",
    "questions" : [
        {
            "question" : "What are the items you receive from {manager_tag_department_repeat_3_as_ressource} ?",
            "type" : "items_multiple_choices"
        }, 
        {
            "question" : "Are you receiving {tag_ressource_repeat_3} from {manager_tag_department_repeat_3} on time for your purposes?",
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
        } ,   
        {
            "question" : "What is the level of quality of {tag_ressource_repeat_3} from {manager_tag_department_repeat_3} ?",
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
            "question" : "What are areas of improvement of {tag_ressource_repeat_3} for partner department : {manager_tag_department_repeat_3} ?",
            "type" : "unique_choice",
            "responses" : [ 
                {
                    "response" : "Technical training"
                }, 
                {
                    "response" : "Soft skill training"
                }, 
                {
                    "response" : "Staffing levels"
                }, 
                {
                    "response" : "Equipment resources"
                }, 
                {
                    "response" : "Not applicable/none of the above"
                }
            ]
        },
        {
            "question" : "What do you provide to {manager_tag_department_repeat_3} ?",
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
  tag:              { type: String,  default : false },
  defaultResponse:  { type: String },
  responses:        [ ResponseSchema ]
})

var UserStepSchema = new Schema({
    _id:                { type : Schema.ObjectId, ref : 'User'}, 
    step:               { type : Number }
})

var SurveySchema = new Schema({
    title:             { type : String, required: "Title can't be blank" },
    relatedSurvey:     { type : Schema.ObjectId, ref : 'Survey'}, // the manager survey for employee survey
    type:              { type : String, required: "Survey type can't be blank"  },
    questions:         [ QuestionSchema ],
    organization:      { type : Schema.ObjectId, ref : 'Organization'},
    confirmed:         { type : Boolean, default : false},
    userSteps:         [ UserStepSchema ],
    totalParticipants: { type : Number,  default : 0},
    createdAt:         { type : Date,    default : Date.now},
})

function getTagAndNumber(tag){
  var number = parseInt(tag.match(/\d+/)[0])
  var _tag   = tag.split('_')
  _tag       = _tag[1]
  return {tag: _tag, number: parseInt(number+1)}
}

SurveySchema.statics = {
  getTemplate:function (type){
    templates = {'manager': manager_template, 'employee' : employee_template}
    return templates[type]
  },  
  updateStep:function (survey_id, user_id, step, cb){    
    this.findOne({_id: survey_id}, function(err, survey){      
      if(survey.userSteps.id(user_id)){
        var userStep = survey.userSteps.id(user_id)
        userStep.step = step
      }
      else{
       survey.userSteps.push({_id: user_id, step: step}) 
      }      
      survey.save(function(err){
        cb()
      })
    })
  }
}

SurveySchema.methods = { 
  userStep: function(user_id){
    var step = 0, v  = this.validQuestions()
    if(this.userSteps.id(user_id)){ 
      step = this.userSteps.id(user_id)
      step = step.step      
    }
    return (Math.round((parseFloat(step) / parseFloat(v.length)) * 100)) + ' %'    
},
  generateQuestions:function (cb){
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

      if(S(question.question).include("{manager_tag")) {  // {manager_tag_department_repeat_3}
          question.generic = true
          if(S(question.question).include("{tag_")) {     // {tag_ressource_repeat_3}
              console.log("223")
              tag1    = S(question.question).between('{tag_', '}').s
              _tag1   = '{tag_'+tag1+'}'
              split    = tag1.split('_')
              tag1    = split[0]
              number1  = parseInt(split[2]) + 1

              tag2    = S(question.question).between('{manager_tag_', '}').s
              _tag2   = '{manager_tag_'+tag2+'}'
              split    = tag2.split('_')

              manager_tag    = split[0]
              number2        = parseInt(split[2]) + 1
              console.log(number1)
              for (var i = 1; i < number1; i++) {
                for (var j = 1; j < number2; j++) {                  
                  questionString = question.question
                  questionString = questionString.replace(_tag1, "{"+tag1+"_"+i+"}").replace(_tag2, "{manager_"+manager_tag+"_"+j+"}")
                  console.log(questionString)
                  _this.questions.push({ question: questionString, related: true, type: questionType, genericParent: true, responses: responses })
                }
              }
          }
          else{
            tag              = S(question.question).between('{', '}').s
            _tag             = tag.split('_')
            manager_tag      = _tag[2]
            repeat           = _tag[4]
            _tag             = _tag[6]

            for (var i = 1; i <= repeat; i++) {
              questionString = question.question
              questionString = questionString.replace('{'+tag+'}', "{manager_"+manager_tag+"_"+i+"}")
              _this.questions.push({ question: questionString, tag: _tag, related: true, type: questionType, genericParent: true, responses: responses })                  
            }
        }
      }

      else{

        if(S(question.question).include("[{")) {
          question.generic = true
          tag              = S(question.question).between('[{', '}]').s
          question.tag     = tag
          questionString   = question.question.replace('[{'+tag+'}]', '') 
          _this.questions.push({ question: questionString, tag: tag, type: questionType, genericParent: true, responses: responses })
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
      }
    })
    if(_this.type == 'Manager Survey' ) _this.questions.push({ question: 'When should Shrewd send this Quarterly Employee survey to all of your direct reports?', type: 'date', genericParent: true })
    _this.save(function(){
      cb()
    })
  })
  },


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
  getRelatedSurvey:function (cb){
    if(this.relatedSurvey){
      this.model('Survey').findOne({_id: this.relatedSurvey}, function(err, survey){
        if(survey) cb(survey)
        else cb(null)  
      })
    }
    else cb(null)
  },  

  setQuestionTitle:function (user, question, cb){
      _this = this
      var title = question.question
      var tags  = question.question.match(/\{(.*?)\}/g)
      if(tags && tags.length > 0){
        async.eachSeries(tags, function(tag, callback){
          var _tag    = S(tag).between('{', '}').s
          var related = false
          var split       = _tag.split('_')
          var _tag        = split[0]
          var index       = parseInt(split[1])          
          
          if(S(_tag).include("manager")) {
            _tag    = split[1]
            index   = parseInt(split[2])
            related = true          
          }

          query   = {user: user.id, survey: _this.id, tag: _tag}

          _this.model('User').findOne({department: user.department, role: 'Customer_Manager'}, function(err, manager){
            if(related) {
              query   = {user: manager.id, survey: _this.relatedSurvey, tag: _tag}
            }
            _this.getRelatedSurvey(function(relatedSurvey){
              _this.model('Result').findOne(query, function(err, prior_results){
                  if(prior_results){
                    console.log(prior_results)
                    result   = prior_results.response
                    q        = (relatedSurvey && related)? relatedSurvey.questions.id(prior_results.question) : _this.questions.id(prior_results.question)
                    title    = title.replace(tag, q.responses.id(result[index-1]).response)
                    callback() 
                  }
                  else callback()
                })
            })
          })
        }, function(err){
          cb(title)
        })         
      }   
      else cb(title)
    }
}

ResultSchema.index({user: 1, survey: 1, question: 1}, {unique: true})

//SurveyStepSchema.index({user: 1, survey: 1, step: 1}, {unique: true})

//mongoose.model('SurveyStep',    SurveyStepSchema)

mongoose.model('UserStep',    UserStepSchema)

mongoose.model('Result',        ResultSchema)
mongoose.model('Survey',        SurveySchema)
mongoose.model('Question',      QuestionSchema)
mongoose.model('Response',      ResponseSchema)
