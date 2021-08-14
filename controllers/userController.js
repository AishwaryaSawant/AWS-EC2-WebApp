const bcrypt = require('bcrypt');
const auth = require('basic-auth');
const compare = require('tsscmp');
const saltRounds = 10;
var models  = require('../models');
const { v4: uuidv4 } = require('uuid');
var bunyan = require('bunyan');
var passwordValidator = require('password-validator');
// require('./config/config.json')
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + '/../config/config.json')[env];

var StatsD = require('node-statsd'),
      client = new StatsD();
var log = bunyan.createLogger({
    name: 'webapp',
    streams: [{
        path: './app-logs/csye6225.log',
    }]
});
// const AppLogger = require('../app-logs/loggerFactory');
// const logger = AppLogger.defaultLogProvider("User-controller");
// const Usermetrics = require('../app-metrics/metricsFactory');
// const timecalculator = require('./timingController');

var schema = new passwordValidator();
schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()                           // Should not have spaces
.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

// exports.test = (req,res) => {
// 	res.status(200).send({
// 		Message: "test!"
// 	});
// }

exports.create = (req, res) => {
	// Usermetrics.increment("User.POST.adduser");
	// var apiStartTime = timecalculator.TimeInMilliseconds();
	client.increment("User.POST.addUser")
	var start = new Date().getTime();
	
    var uuid = uuidv4();
    const data = req.body;
	var first_name = data.first_name;
	var last_name = data.last_name;
	var password = data.password;
	var username = data.username;


	var emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	var nameRegex = /^[A-Za-z.-]+(\s*[A-Za-z.-]+)*$/;
	var validated_email = emailRegex.test(username);
	var validated_fname = nameRegex.test(first_name);
	var validated_lname = nameRegex.test(last_name);

	console.log(req.body)

	if (!first_name){
		res.status(400).send({
			Message: "Please provide first_name"
		});
	}
	else if(!last_name) {
		res.status(400).send({
			Message: "Please provide last_name"
		});
	}
	else if(!password){
		res.status(400).send({
			Message: "Please provide password"
		});
	}else if(!username){
		res.status(400).send({
			Message: "Please provide username"
		});
	}
	 else if (!validated_email) {
		res.status(400).send({
			Message: "Please enter a valid email address!"
		});
	} else if (!validated_fname) {
		res.status(400).send({
			Message: "Please enter a valid first_name with characters!"
		});
	} else if (!validated_lname) {
		res.status(400).send({
			Message: "Please enter a valid last_name with characters!"
        });
    
	} else if (!schema.validate(password)) {
		res.status(400).send({
			Message: "Please enter a valid password!"
        });
	}
	
	else {
		bcrypt.hash(password, saltRounds, function(err, hash) {
			if (err) {
				log.error("Password storage Unsuccessful!");
				
			} else {
				var datetimestamp = new Date();
				datetimestamp = datetimestamp.toISOString();
				var startdb1 = new Date().getTime();
                var User = models.User.build({
					id:uuid,
                    first_name : first_name,
	                last_name : last_name,
	                password : hash,
	                username : username,
                    account_created :datetimestamp,
                    account_updated : datetimestamp
				})
				// var DBQueryStartTime = timecalculator.TimeInMilliseconds(); 
                User.save().then(function(err){
					log.info("User created successfully")
					console.log(User);
					// logger.info("User created successfully");
					User.password = undefined;
					var enddb1 = new Date().getTime();
					client.timing("usercreate.db",enddb1-startdb1);
					// var apiEndTime = timecalculator.TimeInMilliseconds();
					// Usermetrics.timing("User.POST.DBQueryComplete",apiEndTime-DBQueryStartTime);
					// Usermetrics.timing("User.POST.APIComplete",apiEndTime-apiStartTime);
                    res.status(201).send(User);
                }).catch(function(err){
					log.error("Error while users creation : ", err);
                    res.status(400).send("Try with a different email address.");
                });
				
			}
        });
	}
	var end = new Date().getTime();
    client.timing("UserPostRequest",end-start);
	
}

exports.view = (req, res) => {
	// Usermetrics.increment("User.GET.viewUser");
	// var apiStartTime = timecalculator.TimeInMilliseconds();
	client.increment("User.GET.getUser")
	var start = new Date().getTime();
	log.info("In GET user");
	
	var creds = auth(req);
	if (!creds) {
		// logger.error("No authorization credentials found in request");
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
		res.end('Access denied')
	} else {
		var usrname = creds.name;
		var password = creds.pass; 
		// var DBQueryStartTime = timecalculator.TimeInMilliseconds();  
		var startdb1 = new Date().getTime();    
        models.User.findAll({
            where: {
                username: usrname
              }
              }).then(function(account){
				var enddb1 = new Date().getTime();
				client.timing("getuser.db",enddb1-startdb1);
                var valid = true;
                var User;
                valid = compare(usrname, account[0].username) ;
                valid = bcrypt.compareSync(password, account[0].password) && valid;
                if (valid) {
					User = {
						id: account[0].id,
						first_name: account[0].first_name,
						last_name: account[0].last_name,
						username: account[0].username,
						account_created: account[0].account_created,
						account_updated: account[0].account_updated
					}
					res.statusCode = 200
					// var apiEndTime = timecalculator.TimeInMilliseconds();
					// Usermetrics.timing("User.GET.DBQueryComplete",DBQueryEndTime-DBQueryStartTime);
					// Usermetrics.timing("User.GET.APIComplete",apiEndTime-apiStartTime);
					 
					log.info("User fetched successfully")
					console.log("User fetched successfully");
					res.send(User);
				}else {
					log.error("User unauthorized");
					res.statusCode = 401
					res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
					res.end('Access denied')
				}
              }).catch(function(err){
				log.error("User doesn't exist in system");
                res.statusCode = 401
				res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
				res.end('Access denied')
              });
	}
	var end = new Date().getTime();
	client.timing("UserGetRequest",end-start); 
}

exports.update = (req, res) => {
	// Usermetrics.increment("User.PUT.updateUser");
	// var apiStartTime = timecalculator.TimeInMilliseconds();
	client.increment("User.UPDATE.updateUser")
	var start = new Date().getTime();
	log.info("In api user update");
	var creds = auth(req);
	const data = req.body;


	if (!creds) {
		log.error("No authorization credentials found in request");
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
		res.end('Access Denied')
	}   else {
		if (!data.first_name) {
			res.status(400).send({
				Message: "Please provide first_name"
			});
		}else if (!data.last_name) {
			res.status(400).send({
				Message: "Please provide last_name"
			});
		} else if (!data.password) {
			res.status(400).send({
				Message: "Please provide password"
			});
		} else if (!schema.validate(data.password)) {
				res.status(400).send({
					Message: "Please enter a valid password!"
				});
				res.end();
			}
		else if (!data.username) {
			res.status(400).send({
				Message: "Please provide email address"
			});
		}  else if (data.account_created ){
			res.status(400).send({
				Message: "Account creation date cannot be updated"
			});
		} else if (data.account_updated ){
			res.status(400).send({
				Message: "Account updation date cannot be updated"
			});
		} else if (data.id ){
			res.status(400).send({
				Message: "Account id cannot be updated"
			});
		}
		else{
		var usrname = creds.name;
		var password = creds.pass;
		models.User.findAll({
            where: {
                username: usrname
              }
              }).then(function(account){
				var datetimestamp = new Date();
				datetimestamp = datetimestamp.toISOString();

				console.log(account);
				var valid = true;
				valid = bcrypt.compareSync(password, account[0].password) && valid;
				valid = compare(usrname, data.username) && valid;
				if (valid) {
					console.log("validated");
					bcrypt.hash(data.password, saltRounds, function(err, hash) {
						if(err){
							console.log(err);
						}
						else{
							var startdb1 = new Date().getTime();

						// var DBQueryStartTime = timecalculator.TimeInMilliseconds();
						models.User.update({
							first_name : data.first_name,
							last_name: data.last_name,
							password: hash,
							account_updated: datetimestamp
						}, {where: {
								username: usrname
						}
						}).then(function(){
							var enddb1 = new Date().getTime();
							client.timing("updateuser.db",enddb1-startdb1); 
							log.info("User details updated successfully");
							// var apiEndTime = timecalculator.TimeInMilliseconds();
							// Usermetrics.timing("User.PUT.DBQueryComplete",apiEndTime-DBQueryStartTime);
							// Usermetrics.timing("User.PUT.APIComplete",apiEndTime-apiStartTime);
							res.status(204)
							res.end()
						}).catch(function(err){
							console.log(err);
							res.status(400)
							res.end();
						})
					}
				});
				}else{
					log.error("User unauthorized");
					res.statusCode = 401
					res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
					res.end('Access Denied')
				}
				
			  }).catch(function(err){
				log.error("User doesn't exist in system");
				console.log(err);
				res.statusCode = 401
				res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
				res.end('Please enter a valid email address')
			  });
			}
	}
	var end = new Date().getTime();
  	client.timing("UserUpdateRequest",end-start); 

}

exports.getInfo = (req, res) => {
	// Usermetrics.increment("User.GET.viewUser");
	// var apiStartTime = timecalculator.TimeInMilliseconds();
	client.increment("User.GET.getUserInfo")
	var start = new Date().getTime();
	log.info("In GET userinfo");

	var userId = req.url.split("/")[3];
	// var DBQueryStartTime = timecalculator.TimeInMilliseconds();      
	var startdb1 = new Date().getTime();

	models.User.findOne({
		where: {
			id: userId
			}
			}).then(function(account){
				// var DBQueryEndTime = timecalculator.TimeInMilliseconds();  
				log.info("User details found in system");
				var enddb1 = new Date().getTime();
				client.timing("getuserinfo.db",enddb1-startdb1); 
				log.info("User details found successfully");
				User = {
					id: account.id,
					first_name: account.first_name,
					last_name: account.last_name,
					username: account.username,
					account_created: account.account_created,
					account_updated: account.account_updated
				}

				res.statusCode = 200
				// var apiEndTime = timecalculator.TimeInMilliseconds();
				// Usermetrics.timing("User.GET.DBQueryComplete",DBQueryEndTime-DBQueryStartTime);
				// Usermetrics.timing("User.GET.APIComplete",apiEndTime-apiStartTime);
				
				console.log("User found");
				res.send(User);
		
			}).catch(function(err){
				log.error("User unauthorized");
				res.statusCode = 404
				res.setHeader('WWW-Authenticate', 'User account Authentication"')
				res.end('User Not Found')
			});
		var end = new Date().getTime();
		client.timing("UserInfoRquest",end-start);  
}