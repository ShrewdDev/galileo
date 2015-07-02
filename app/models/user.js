
var  mongoose          = require('mongoose')
    ,Schema            = mongoose.Schema
    ,Department        = mongoose.model('Department')
    ,Organization      = mongoose.model('Organization')
    ,crypto            = require('crypto')
    ,moment            = require('moment')
    ,validator         = require('validator')
    ,randomstring      = require("randomstring")
    ,validate          = require('mongoose-validator')
    ,uniqueValidator   = require('mongoose-unique-validator')
    ,nodemailer        = require('nodemailer')
    ,roles             = ['Customer_Admin', 'Customer_Manager', 'Customer_TeamMember'] // remove 'Site_Admin', 
    ,adminEmails       = ['khalid.rahmani.mail@gmail.com', 'admin@test.com']
    ,subscriptioLevels = {'Level_1':'Level 1($25/user/month)', 'Level_2':'Level 2($30/user/month)', 'Level_3':'Level 3($35/user/month)'}
    ,monthsOfYear      = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    ,async             = require("async")
    ,sendgrid          = require('sendgrid')("app36066965@heroku.com", "gehrdtdn1302")
    ,_                 = require('underscore')

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'no.reply.smtp.222@gmail.com',
        pass: 'password0511'
    }
});

var UserSchema = new Schema({
  email:                { type: String, required: "Email can't be blank", unique: true, validate: validate({validator: 'isEmail'}) },  
  organization:         { type: Schema.ObjectId, ref : 'Organization' },
  department:           { type: Schema.ObjectId, ref : 'Department'   },
  role:                 { type: String },
  firstName:            { type: String },
  lastName:             { type: String },
  location:             { type: String },

  subscriptionLevel:      { type: String },
  subscriptionExpiryDate: { type: Date   },

  surveyYearStart:               { type: String },
  surveyTotalEmployees:          { type: String, validate: validate({validator: 'isNumeric'}) },
  surveyConfidence:              { type: String, validate: validate({validator: 'isNumeric'}) },
  surveyLikelyResponseRate:      { type: String, validate: validate({validator: 'isNumeric'}) },
  surveyRecomendedSampleSize:    { type: String, validate: validate({validator: 'isNumeric'}) },
  surveySampleSizeAccountedFor:  { type: String, validate: validate({validator: 'isNumeric'}) },

  password:                       { type: String },
  salt:                           { type: String },  
  resetPasswordToken:             { type: String },
  resetPasswordExpires:           { type: Date   },
  createdAt:                      { type: Date, default : Date.now }
})

UserSchema.virtual('emailPrefix').get(function () {
  return this.email.split('@')[0]
})

UserSchema.post('save remove', function (user) {
  if(user.department){
    this.model('User').find({department: user.department, role: 'Customer_TeamMember'}, function(err, users){
      if(users){
        emails = []
        for(_user in users){
          emails.push(users[_user].email)
        }
        var teamMembers = emails.join(', ')
        Department.update({_id: user.department}, {teamMembers: teamMembers}, function(err, numAffected){})
      }
    })
    this.model('User').findOne({department: user.department, role: 'Customer_Manager'}, function(err, user){
      if(user){
        Department.update({_id: user.department}, {manager_email: user.email}, function(err, numAffected){})
      }
    })
  }
  this.model('User').find({organization: user.organization, role: 'Customer_Admin'}, function(err, users){
      if(users){
        emails = []
        for(_user in users){
          emails.push(users[_user].email)
        }
        var admin_emails = emails.join(', ')
        Organization.update({_id: user.organization}, {admin_emails: admin_emails}, function(err, numAffected){})
      }
  })
})

UserSchema.pre('save', function(next) {
  this.email = this.email.toLowerCase()
  if (!this.password){
    var password  = "password" //randomstring.generate(7)
    this.password = password
    this.setPassword()
    this.sendWelcomeEmail(this.email, password)    
  } 
  if(this.role == 'Customer_Manager'){
    this.model('User').update({department: this.department ,role: 'Customer_Manager'}, {role: 'Customer_TeamMember'},
      { multi: true }, function(err, numAffected){
        next()
      })
  }
  else next()
})

UserSchema.methods = {
  getManagerSurveys:function (cb){
    this.model('Survey').find({organization: this.organization, type: 'Manager Survey'}, function(err, surveys){
      cb(surveys)
    })
  }, 
  usersResponsible:function (){
    return ['Site_Admin', 'Customer_Admin', 'Customer_Manager', 'Customer_TeamMember'].indexOf(this.role) > -1
  },   
  getAdminEmails:function (){
    return adminEmails
  }, 
  setPassword:function (){
    this.salt = this.makeSalt()
    this.password = this.encryptPassword(this.password)
  },
  getSubscriptionExpiryDate:function (){
    return (this.subscriptionExpiryDate) ? moment(this.subscriptionExpiryDate).format("MMMM,D YYYY") : ''
  },
  hasRole: function (role){
    return this.role == role
  }, 
  getRoles: function (){
    if(this.role == 'Customer_Admin') return roles
    else  return ['Customer_Manager', 'Customer_TeamMember']
  },   
  authenticate: function (plainText){
    return this.encryptPassword(plainText) === this.password
  },
  makeSalt: function (){
    return randomstring.generate(7)
  },
  encryptPassword: function (password) {
    if (!password) return ''
    var encrypred
    try {
      encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex')
      return encrypred
    } catch (err) {
      return ''
    }
  },
  sendWelcomeEmail: function(email, password){
    var mailOptions = {
      from: 'SurveyApp <contact@survey.com>', 
      to: email,
      subject: 'Account Created',
      text: 'Your account was created. you can login to your account using you email address, your password is : '+password+' '
    };
    transporter.sendMail(mailOptions, function(error, info){});          
  },  
}

UserSchema.statics = {
  getDepartmentMembersEmails:function (department, cb){
    this.find({department: department, role: 'Customer_TeamMember'}).select('email').lean().exec(function(err, users){
      emails = []
      for(user in users){
        emails.push(users[user].email)
      }
      cb(emails.join(', '))
    })
  },   
  sendSurveyNotification: function(survey, department, role){
    _this = this
    //types = {'Manager Survey': 'Customer_Manager', 'Employee Survey':'Customer_TeamMember'}
    var query = {organization: survey.organization, role: role}
    if(department) query = {organization: survey.organization, department: department, role: role}
    this.find(query, function(err, users){
        for(user in users){
          _user = users[user]
          console.log('sending to ' + _user.email)
          sendgrid.send({
            to:       _user.email,
            from:     'admin@shrwed.com',
            subject:  'Survey Invitation',
            text:     'You have been invited to participate to the survey  : '+ survey. title+'. \n\n' +
                      'Please login to your account to take the survey. \n\n'
          }, function(err, json) {
            if (err) { console.error(err); }
            console.log(json);
          })
        }
      })
  },
  validateUniqueAdminsEmails: function (emails, old_admin_emails, callback){
      _this  = this
      async.each(emails, function (email, cb) {
        if(old_admin_emails.indexOf(email) > -1) cb()
        else{
          var user = new _this({email: email})
          user.validate(function(err){
            if(err) callback("Invalid or duplicate email "+ email)
            else cb()  
          })          
        }              
      },function(err){
        callback (null)
      })            
  },
  createUpdateOrganizationAdmins: function (organization, remove){
    _this  = this
    emails = organization.getSpaceCleanedEmails()
    if(remove) _this.remove({organization: organization.id, role: 'Customer_Admin', email: {$nin: emails}}, function(err, users){ })
    emails.forEach(function (email) { 
      _this.findOne({email: email}, function(err, user){
        if(!user){
          var user = new _this({email: email, role: 'Customer_Admin'})
        }
        user.organization = organization.id
        user.save(function (err){ 
          if(err) console.log(err)
        })
      })      
    })             
  },
  saveDepartmentUsers: function (department, update){
    team_members = department.getSpaceCleanedEmails()
    _this = this
    if(update){
      _this.remove({department: department.id, role: 'Customer_TeamMember', email: {$nin: team_members}}, function(err, users){
        _this.findOne({department: department.id, role: 'Customer_Manager'}, function(err, user){
          if(user){
            user.email = department.manager_email
            user.save(function(err){})
          }
          else{
            data = {email: department.manager_email, organization: department.organization, department: department.id, location: department.location, role: 'Customer_Manager'}          
            var user = new _this(data)
            user.save(function (err){ })            
          }
        })        
      })
    }
    else{
      var user = new _this({organization: department.organization, location: department.location, department: department.id, role: 'Customer_Manager', email: department.manager_email})
      user.save(function (err){})
    }
    team_members.forEach(function (email) {  
      data = {email: email, organization: department.organization, department: department.id, location: department.location, role: 'Customer_TeamMember'}          
      var user = new _this(data)
      user.save(function (err){ })
    })
  },
  getMonthsOfYear: function (){
    return monthsOfYear;
  },  
  makeSalt: function (){
    return randomstring.generate(7)
  },
  encryptPassword: function (password, salt) {    
    var encrypred
    try {
      encrypred = crypto.createHmac('sha1', salt).update(password).digest('hex')
      return encrypred
    } catch (err) {
      return ''
    }
  },  
  sendCustomerAdiminWelcomeEmail: function(email, password, cb){
    var mailOptions = {
      from: 'SurveyApp <contact@survey.com>', 
      to: email,
      subject: 'Account Created',
      text: 'Your account was created. you can login to your account using you email address, your password is : '+password+' '
    };
    transporter.sendMail(mailOptions, function(error, info){
      cb(error, info)
    });          
  },
  validateForgottenEmail: function(email, host, cb){
    if(validator.isEmail(email)){ 
      this.findOne({ email: email }, function(err, user) {
        if (user){
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex')
            user.resetPasswordToken = token
            user.resetPasswordExpires = Date.now() + 3600000
            user.save(function(err) {
              var mailOptions = {
                from: 'SurveyApp <contact@survey.com>', 
                to: email,
                subject: 'Password Reset',
                text: 'You are receiving this because you have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + host + '/reset/' + token + '\n\n'
              };
              transporter.sendMail(mailOptions, function(error, info){
                cb(error, info)
              });  
            }); 
          });
        }
        else{
          cb('couldn\'t find a user with this email.', 'invalid email');   
        }
      })
    }
    else cb('invalid email', 'invalid email');    
  },
  resetPassword: function(token, password, password_confirmation, cb){
    if(password != password_confirmation) cb('error', 'password does not match confirmation')
    else {
      this.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user) {
        if(err || !user) cb('error', 'Password reset token is invalid or has expired.')
        else {          
          user.salt     = user.makeSalt()
          user.password = user.encryptPassword(password, user.salt)          
          user.resetPasswordToken = undefined
          user.resetPasswordExpires = undefined
          user.save(function(err) {
            console.log(user)
            cb(undefined, 'passord updated!')
          })        
        }
      })
    }      
  }
}

UserSchema.plugin(uniqueValidator, { message: '{PATH} already in use.' })
mongoose.model('User', UserSchema)