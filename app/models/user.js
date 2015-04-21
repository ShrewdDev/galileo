
var  mongoose = require('mongoose')
    ,Schema = mongoose.Schema
    ,crypto = require('crypto')
    ,validator = require('validator')
    ,validate  = require('mongoose-validator')
    ,uniqueValidator = require('mongoose-unique-validator')
    ,nodemailer = require('nodemailer')
    ,roles       = ['Site_Admin', 'Customer_Admin', 'Customer_Manager', 'Customer_TeamMember']
    ,adminEmails = ['khalid.rahmani.mail@gmail.com', 'admin@test.com']
    ,rolesByCreator = {'Site_Admin':'Customer_Admin', 'Customer_Admin': 'Customer_Manager', 'Customer_Manager':'Customer_TeamMember'}

var UserSchema = new Schema({
  email:                { type: String, required: "Email can't be blank", unique: true, validate: validate({validator: 'isEmail'}) },  
  companyName:          { type: String, required: "Company Name can't be blank", unique: true },
  firstName:            { type: String },
  lastName:             { type: String },
  role:                 { type: String },
  password:             { type: String, required: "can't be blank"},
  salt:                 { type: String },  
  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date   },
  created_by:           { type: Schema.ObjectId, ref : 'User'},
  createdAt:            { type: Date, default : Date.now }
})

UserSchema.pre('save', function(next){
  this.salt = this.makeSalt()
  this.password = this.encryptPassword(this.password)
  next()
})

UserSchema.methods = {
  hasRole: function (role){
    if(role == "Site_Admin") return this.role ==  "Site_Admin" || (adminEmails.indexOf(this.email) > -1)
    return this.role == role
  },
  authenticate: function (plainText){
    return this.encryptPassword(plainText) === this.password
  },
  makeSalt: function (){
    return Math.round((new Date().valueOf() * Math.random())) + ''
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
  }
}

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'no.reply.smtp.222@gmail.com',
        pass: 'password0511'
    }
});

UserSchema.statics = {
  getRoleByCreator: function (role) {    
    return rolesByCreator[role]
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
          user.password = password
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