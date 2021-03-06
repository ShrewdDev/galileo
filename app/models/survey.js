require(__dirname + '/user.js')

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
            "question" : "What are the items you receive from {tag_department_repeat_3_as_ressource} ?",
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
            "type" : "items_multiple_choices_2"
        }         
    ]
}
var employee_template = {
    "type" : "Employee Survey",
    "questions" : [
        {
            "question" : "What are the items you receive from {manager_tag_department_repeat_3_as_ressource} ?",
            "type"     : "items_multiple_choices_2"
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
            "question" : "What resource would most improve {manager_tag_department_repeat_3}'s delivery of {tag_ressource_repeat_3} ?",
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
            "type"     : "items_multiple_choices"
        }                          
    ]
}

var mongoose           = require('mongoose'),
    Schema             = mongoose.Schema,
    Department         = mongoose.model('Department'),
    Organization       = mongoose.model('Organization'),
    User               = mongoose.model('User'),
    _                  = require("underscore"),    
    S                  = require('string'),
    validator          = require('validator'),
    async              = require("async"),
    validate           = require('mongoose-validator'),
    uniqueValidator    = require('mongoose-unique-validator'),
    extend             = require('mongoose-validator').extend,
    surveyTypes        = ['All Members Survey', 'Manager Survey', 'Employee Survey'],
    subscriptionLevels = {1: 'Level 1($25/user/month)', 2: 'Level 2($30/user/month)', 3: 'Level 3($35/user/month)'},
    _surveyItems       = {0: 'Documents',1: 'Document numbers or specification numbers', 2: 'Signature approval', 3: 'Funds', 4: 'Material resources', 5: 'Production process knowledge', 6: 'Business process knowledge', 7: 'Product knowledge', 8: 'Technical knowledge', 9: 'Manufacturing knowledge', 10: 'Contacts', 11: 'Document design/review', 12: 'Training', 13: 'FYI emails or memos', 14: 'Technical services'},
    surveyItems        = [{id: 0, value: 'Documents'}, {id: 1, value: 'Document numbers or specification numbers'}, {id: 2, value: 'Signature approval'}, {id: 3, value: 'Funds'}, {id: 4, value: 'Material resources'}, {id: 5, value: 'Production process knowledge'}, {id: 6, value: 'Business process knowledge'}, {id: 7, value: 'Product knowledge'}, {id: 8, value: 'Technical knowledge'}, {id: 9, value: 'Manufacturing knowledge'}, {id: 10, value: 'Contacts'}, {id: 11, value: 'Document design/review'}, {id: 12, value: 'Training'}, {id: 13, value: 'FYI emails or memos'}, {id: 14, value: 'Technical services'}],
    defaultCloseDays   = 45

extend('nullOrRequired', function (val) {  
  return true
}, 'Invalid');

var ResultSchema = new Schema({
  user:             { type: Schema.ObjectId, ref: 'User'},
  department:       { type: Schema.ObjectId, ref: 'Department'},
  survey:           { type: Schema.ObjectId, ref: 'Survey'},
  question:         { type: Schema.ObjectId, ref: 'Question'},
  tag:              { type: String },
  object:           { type: String }, // departmet
  action:           { type: String }, // give or receive
  objectvalue:      { type: String }, //
  ressource:        { type: String },
  response:         [ ResponseSchema ],
  value:            { type: String}
})

var ResponseSchema = new Schema({
  _id:              { type: String, default: mongoose.Types.ObjectId },
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
    department:         { type : Schema.ObjectId, ref : 'Department'}, 
    step:               { type : Number },
    finished:           { type : Boolean, default: false }
})

var SurveySchema = new Schema({
    title:             { type : String, required: "Title can't be blank" },
    relatedSurvey:     { type : Schema.ObjectId, ref : "Survey"}, // the manager survey for employee survey
    type:              { type : String, required: "Survey type can't be blank"  },
    role:              { type : String }, // Customer_Admin or Customer_Admin
    subscriptionLevel: { type : Number, validate: validate({validator: 'nullOrRequired'}) },
    questions:         [ QuestionSchema ],
    organization:      { type : Schema.ObjectId, ref : "Organization"},
    confirmed:         { type : Boolean, default : false},
    locked:            { type : Boolean, default : false},
    userSteps:         [ UserStepSchema ],
    totalParticipants: { type : Number, default : 0},
    dateSent:          { type : Date },
    dateClosed:        { type : Date },
    createdAt:         { type : Date, default : Date.now},
})

SurveySchema.pre('save', function(next) {
  if (this.confirmed && this.role == "Customer_Admin"){
    var now           = new Date()
    this.dateSent     = now
    var closeDate     = new Date(now)
    closeDate.setDate(closeDate.getDate() + defaultCloseDays)
    this.dateClosed   = closeDate
  } 
  next()
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
  },getItems:function (){
    return surveyItems
  },get_Items:function (){
    return _surveyItems
  },get_Item:function (item){
    return _surveyItems[item]
  },getItem:function (itemIndex){
    var val = 'not found'
    _.each(surveyItems, function(surveyItem){      
      if(surveyItem.id == parseInt(itemIndex)) {val = surveyItem.value }
    })    
    return val
  },createOrganizationsSurveys: function(survey){
    _this = this
    Organization.find({subscriptionLevel: { $gte: survey.subscriptionLevel }}, function(err, organizations){      
        async.each(organizations, function (organization, cb) {
            var _survey = new _this({ title: survey.title, 
                                  type:  survey.type, 
                                  locked: survey.locked,
                                  organization: organization.id, 
                                  role: "Customer_Admin", 
                                  subscriptionLevel: survey.subscriptionLevel,                                  
                                  questions: survey.questions})
          _survey.save(function (err){ 
            if(err) console.log(err)
            else console.log("saved organization")  
            cb()  
          })                           
        },function(err){
          console.log('finished')
        })
      })
   
  }
}

SurveySchema.methods = { 

  finished: function(user_id){    
    if(this.userSteps.id(user_id)){
      userStep = this.userSteps.id(user_id)
      return userStep.finished
    }
    else return false
  },
  updateStep:function (user, step, cb){
      _this = this
      var valid  = this.validQuestions()
      if(this.userSteps.id(user.id)){
        var userStep = this.userSteps.id(user.id)
        userStep.step = step
        if(step == valid.length)  {
          userStep.finished = true
            if(this.type == 'Manager Survey'){
              this.model('Survey').find({relatedSurvey: this.id}, function(err, surveys){
                _.each(surveys, function(survey){
                  User.sendSurveyNotification(survey, user.department, 'Customer_TeamMember')
                })
            })
          }
        }
      }
      else{
       this.userSteps.push({_id: user.id, department: user.department, step: step}) 
      }
      this.save(function(err){
        cb()
      })    
  },  
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
      _.each(_this.questions, function(question, index){
        var responses    = [] 
        var questionType = question.type
        if(question.type == 'department'){
          questionType   = 'multiple_choices'
          _.each(departments, function(department){       
            responses.push({ response: department.departmentName, _id: department.id})    
          })
      }
      else if(question.type == 'items_rank'){
        questionType   = 'multiple_choices'
        _.each(surveyItems, function(item){
          responses.push({ _id: item.id, response: item.value})
        })
      } 
      else if(question.type == 'items_multiple_choices'){
        questionType   = 'multiple_choices'
        _.each(surveyItems, function(item){
          responses.push({ _id: item.id, response: item.value})
        })
      }
      else if(question.type == 'items_multiple_choices_2'){
        questionType   = 'multiple_choices'
        _.each(surveyItems, function(item){
          ignoreEmployeeItems = [2, 3]
          if(! _.contains(ignoreEmployeeItems, item.id)){
            responses.push({ _id: item.id, response: item.value})  
          }
        })
      }

      else{
        responses    = question.responses
      }

      if(S(question.question).include("{manager_tag")) {  // {manager_tag_department_repeat_3}
          question.generic = true
          if(S(question.question).include("{tag_")) {     // {tag_ressource_repeat_3}
              tag1    = S(question.question).between('{tag_', '}').s
              _tag1   = '{tag_'+tag1+'}'
              split   = tag1.split('_')
              tag1    = split[0]
              number1 = parseInt(split[2]) + 1
              tag2    = S(question.question).between('{manager_tag_', '}').s
              _tag2   = '{manager_tag_'+tag2+'}'
              split   = tag2.split('_')
              manager_tag    = split[0]
              number2        = parseInt(split[2]) + 1
              console.log(number1)
              for (var j = 1; j < number2; j++) {
                for (var i = 1; i < number1; i++) {
                  questionString = question.question
                  questionString = questionString.replace(_tag1, "{"+tag1+j+"_"+i+"}").replace(_tag2, "{manager_"+manager_tag+"_"+j+"}")
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
              _this.questions.push({ question: questionString, tag: _tag+''+i, related: true, type: questionType, genericParent: true, responses: responses })                  
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
          if(tags.length == 1){ // {tag_department_repeat_3_as_ressource}
            var tag  = tags[0]
            var _tag   = S(tag).between('{', '}').s
            _tag       = _tag.split('_')
            number = parseInt(_tag[3])+1
            for (var i = 1; i < number; i++) {
              var __tag     = (_tag.length > 4)? _tag[5]+i : _tag[1]
              questionString = question.question
              questionString = questionString.replace(tag, "{"+_tag[1]+"_"+i+"}")
                _this.questions.push({ question: questionString, tag: __tag, type: questionType, genericParent: true, responses: responses })      
            }
          }

          if(tags.length == 2){
            var tag1    = tags[0]
            var result1 = getTagAndNumber(tag1)
            var tag2    = tags[1]
            var result2 = getTagAndNumber(tag2)        
            for (var j = 1; j < result2.number; j++) { 
              for (var i = 1; i < result1.number; i++) {
                questionString = question.question
                questionString = questionString.replace(tag1, "{"+result1.tag+j+"_"+i+"}").replace(tag2, "{"+result2.tag+"_"+j+"}")
                  _this.questions.push({ question: questionString, type: questionType, genericParent: true, responses: responses })
              }        
            }
          }  
        }  
      }
    })
    if(_this.type == 'Manager Survey' ) _this.questions.push({ question: 'When should Shrewd send this Quarterly Employee survey to all of your direct reports?', type: 'date', genericParent: true })
    _this.save(function(err){
      if(err) console.log(err)
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
  getSubscriptionLevels:function (){
    return subscriptionLevels
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
      var action = object = objectvalue = ressource = ''
      if(S(title).include('receive')) action = 'receive'
      if(S(title).include('give'))    action = 'give'  
      
      if(tags && tags.length > 0){
        async.eachSeries(tags, function(tag, callback){
          console.log(title)
          var _tag    = S(tag).between('{', '}').s

          var related = false
          var split       = _tag.split('_')
          var _tag        = split[0]
          if(split.length == 1) { var index = parseInt(_tag.slice(-1)) } // Employee ressource1
          else                  { var index = parseInt(split[1])       }
          
          if(S(_tag).include("manager")){
            _tag    = split[1]
            index   = parseInt(split[2])
            related = true          
          }

          query   = {user: user.id, survey: _this.id, tag: _tag}
          _this.model('User').findOne({department: user.department, role: 'Customer_Manager'}, function(err, manager){
            if(related){
              query   = {user: manager.id, survey: _this.relatedSurvey, tag: _tag}
            }
            _this.getRelatedSurvey(function(relatedSurvey){
              _this.model('Result').findOne(query, function(err, prior_results){
                  if(prior_results){                                       
                    result   = prior_results.response
                    q        = (relatedSurvey && related)? relatedSurvey.questions.id(prior_results.question) : _this.questions.id(prior_results.question)
                    title    = title.replace(tag, q.responses.id(result[index-1]).response)
                    
                    if(S(_tag).include("department")) {
                      object      = 'department'
                      objectvalue = q.responses.id(result[index-1]).id
                    }
                    else{
                      ressource = q.responses.id(result[index-1]).id
                    }
                    callback() 
                  }
                  else callback()
                })
            })
          })
        }, function(err){
          cb(title, object, action, objectvalue, ressource)
        })         
      }   
      else cb(title, object, action, objectvalue, ressource)
    }
}

ResultSchema.index({user: 1, survey: 1, question: 1}, {unique: true})

mongoose.model('UserStep',      UserStepSchema)
mongoose.model('Result',        ResultSchema)
mongoose.model('Survey',        SurveySchema)
mongoose.model('Question',      QuestionSchema)
mongoose.model('Response',      ResponseSchema)
