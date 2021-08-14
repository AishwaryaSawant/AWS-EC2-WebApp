var models  = require('../models');
const { v4: uuidv4 } = require('uuid');
const auth = require('basic-auth');
const bcrypt = require('bcrypt');
// require('./config/config.json')
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + '/../config/config.json')[env];
var bunyan = require('bunyan');

var StatsD = require('node-statsd'),
      client = new StatsD();
var log = bunyan.createLogger({
    name: 'webapp',
    streams: [{
        path: './app-logs/csye6225.log',
    }]
});
// const AppLogger = require('../app-logs/loggerFactory');
// const logger = AppLogger.defaultLogProvider("File-controller");
// const Questionmetrics = require('../app-metrics/metricsFactory');
// const timecalculator = require('./timingController');

require('dotenv/config')
const multer = require('multer')
const AWS = require('aws-sdk')
// const aws = require("aws-sdk");
// const multer = require("multer");
// const multerS3 = require("multer-s3");
// const models = require("../models");
// const express = require("express");
// const { Op } = require("sequelize");
// const router = express.Router();
// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.json')[env];


exports.createQuestion = (req, res) => {
	// Questionmetrics.increment("Question.POST.addQuestion");
	// var apiStartTime = timecalculator.TimeInMilliseconds();
	client.increment("Question.POST.addQuestion")
	log.info("in question create api")
	var creds = auth(req);
	var start = new Date().getTime();
	// console.log("in");
		if (!creds) {
			log.error("No authorization credentials found in request");
			console.log('Auth Check');
			res.statusCode = 401
			res.setHeader('Authorization', 'Basic: user account authentication')
			res.send({"message" : "Access denied "})
		} 
		else{
			var data = req.body;
			// console.log('Auth Check DONE');
			var usrname = creds.name;
			var password = creds.pass;

			var question_text= data.question_text;
			var categories= data.categories;
			// console.log(categories)
			// if(!categories){
			// 	console.log("NOT")
			// }
			// var categories = data.categories[0];
			
			var createdDate = new Date();
			createdDate = createdDate.toISOString();
			
			// console.log("username "+ authUsername);
			// console.log("password "+ authPassword);
			models.User.findOne({
				where: {
					username: usrname
				}
				}).then(async function(result){
					//console.log(result)
					var valid=true;
					valid=bcrypt.compareSync(password, result.password) && valid;
				
					if (valid)
					{
						var id = uuidv4();

						if(req.body.question_id || req.body.created_timestamp || req.body.updated_timestamp){
							res.statusCode = 401
							res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
							res.end('Access Denied ! You cannot set id and timestamps!')
						}
						else{
							if(question_text == ""){
								res.statusCode = 400
								// res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
								res.end('Question cannot be empty')
							}
							//console.log("RSULT ID ", result);
							else{
								var Question={
									question_id:id,
									created_timestamp: createdDate,
									updated_timestamp: createdDate,
									user_id: result.id,
									question_text: question_text
								} 
					
								var question_result= await models.Question.create(Question)
								// console.log("Question Created  ", question_result);
		
								if(!question_result)
								{
									log.error("Question  not created");
									console.log('Internal Server Error');
									res.statusCode = 503;
									res.setHeader('Authorization', 'Basic auth')
									res.send({"message" : "Internal Server Error for Async Function!"})
								}
								
								if(categories){
									if(categories.length>0){
										for(i=0 ; i<categories.length; i++){
											// console.log(categories)
											let itemLower = categories[i]; //.toLowerCase();
											// console.log("ITEM  --- ", itemLower)
											// var catid = 
											// console.log(itemLower.getType())
											if(itemLower.category==""){
												continue;
											}
											const [categoryAdded,created] = await models.Category.findOrCreate({
												where: { category: itemLower.category.toLowerCase() },
												defaults: {
												category_id: uuidv4()
												}
											});
									
											var c = await question_result.addCategory(categoryAdded)				
											
										}
									}
								}

								//check part
							// 	var uuid = uuidv4();
							// 	var nameUUID = shortid.generate();
								
							// 	if(req.files==null){
							// 		res.status(400)
							// 		res.end()
							// 	}
							// 	if(!(req.files.image.mimetype === 'image/jpeg' || req.files.image.mimetype === 'image/png' || req.files.image.mimetype === 'image/jpg')){
							// 		res.status(400)
							// 		res.end()
							// 	}
							// 	else{
							// 	var file = req.files.image;
							// 	var file_name = nameUUID+"_"+file.name;
							// 	var upload_date = new Date().toISOString();//.split('T')[0];
							// 	var questionId = Question.question_id;
							// 	var metaDataObj = {
							// 		size: file.size,
							// 		encoding: file.encoding,
							// 		mimetype: file.mimetype,
							// 		md5: file.md5
							// 	}
							   
							//    const s3 = new AWS.S3({
							// 	accessKeyId: process.env.AWS_ID,
							// 	secretAccessKey: process.env.AWS_SECRET
							//   })
							  
							//   const storage = multer.memoryStorage({
							// 	destination: function(req,file, callback){
							// 	  callback(null,'')
							// 	}
							//   })
							  
							// //   const upload = multer({storage})
			
							//   console.log(req.files)
							// 	let myFile =req.files.image.name.split(".")
							// 	const fileType = myFile[myFile.length-1]
							// 	// console.log(req.files)
							// 	console.log(req.files.image.data)
							// 	// res.send({
							// 	//   message:"Hello"
							// 	// })
							// 	const params = {
							// 	  Bucket: process.env.AWS_BUCKET_NAME,
							// 	  Key: uuid+file_name,//`${uuidv4()}.${fileType}`,
							// 	  Body: req.files.image.data
							// 	}
							// 	s3.upload(params,(error,data)=>{
							// 	  if(error){
							// 		res.status(500).send(error)
							// 	  }
			
							// 	models.File.create({
							// 		file_id: uuid,
							// 		file_name: file_name,
							// 		s3_object_name: questionId+User.id+file_name,//Data.Location,
							// 		created_date: upload_date,
							// 		question_id: questionId,
							// 		answer_id: null,
							// 		metaData: metaDataObj
			
							// 	}).then(function(f){
			
							// 	 var File = models.File.build({
							// 		file_id: uuid,
							// 		file_name: file_name,
							// 		s3_object_name: questionId+User.id+file_name,//Data.Location,
							// 		created_date: upload_date,
							// 		// question_id: questionId,
							// 		// answer_id: null,
							// 		// metaData: metaDataObj
			
							// 	})
			
							// 	// var f = File.file_id
								
							// 		res.status(201).send(File);
							// 		console.log("File object created successfully")
							// 	}).catch(function(err){
							// 		console.log("Unable to create file object")
							// 		console.log(err)
							// 	})
			
								  
							// 	})
							// }
								//check part end
								var startdb1 = new Date().getTime();

								models.Question.findOne({
									where: {
									  question_id: id,
									},
									include: [
									  {
										model: models.Category,
										required: false,
										through: {
										  attributes: [],
										},
									  },
									  {
										model: models.Answer,
										required: false,
										where: { question_id: id },
									  },
									  {
										  model: models.File,
										  required: false,
										  where: { question_id: id}
									  }
									],
								  })
									.then(function (result) {
										log.info("Question found in system");
										var enddb1 = new Date().getTime();
										client.timing("createquestion.db",enddb1-startdb1);
										// var apiEndTime = timecalculator.TimeInMilliseconds();
										// Billmetrics.timing("Question.GETALL.DBQueryComplete",apiEndTime-DBQueryStartTime);
										// Billmetrics.timing("Question.GETALL.APIComplete",apiEndTime-apiStartTime);
				
										if(result == null){
											res.status(404);
											res.end("Question Not Found")
										}
									  res.status(201).send(result);
									})
									.catch(function (err) {
									  log.info("Question coudn't be found due to some issue");

									  console.log("Question Not Found!!");
									  console.log(err);
									  res.status(404).send("Not Found!!");
									});
									
							}
						}
						
						
					}
				
				else{
					   log.error("User unauthorized");

						console.log('User Not Found!');
						res.statusCode = 401;
						//res.setHeader('Authorization', 'Basic: #username+password')
						res.send('Access Denied')
					}   
					}).catch(function(err){
						log.error("User unauthorized");

						console.log('User Not Found!!');
						console.log(err);
						res.status(401).send('Access Denied');
					});

					
		}
		var end = new Date().getTime();
		client.timing("QuestionPostRequest",end-start);  
		log.info("Question created successfully")
         
}

exports.updateQuestion = (req, res) => {
	client.increment("Question.UPDATE.updateQuestion");
	// var apiStartTime = timecalculator.TimeInMilliseconds();
	var start = new Date().getTime();
	log.info("In Question Update api");
	var creds = auth(req);
	const data = req.body;


	if (!creds) {
		log.error("No authorization credentials found in request");

		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
		res.end('Access Denied 1st')
	}   else {
		
		var usrname = creds.name;
		var password = creds.pass;
		var questionId = req.url.split("/")[3];
		var data1 = req.body;
		models.User.findOne({
            where: {
                username: usrname
              }
              }).then(async function(account){


				var datetimestamp = new Date();
				datetimestamp = datetimestamp.toISOString();

				// console.log(account);
				var valid = true;
				valid = bcrypt.compareSync(password, account.password) && valid;
				console.log(valid)
				// valid = compare(usrname, data1.username) && valid;
				// console.log(valid)
				if (valid) {
					
					var categories= data1.categories;
					console.log("validated");
					
						var question = models.Question.findOne({
							where:{
								question_id : questionId
							}
						}).then(async function(quest){
							// logger.info("Question details updated in system");
							// var apiEndTime = timecalculator.TimeInMilliseconds();
							// Billmetrics.timing("Question.PUT.DBQueryComplete",apiEndTime-DBQueryStartTime);
							// Billmetrics.timing("Question.PUT.APIComplete",apiEndTime-apiStartTime);

							console.log("quest: "+quest)
							if(quest==null){
								res.status(404);
								res.end('Question not found')
							}
							if(data1.question_text==""){
								res.status(400);
								res.end('Question text cannot be empty')
							}

							if(data1.question_id || data1.created_timestamp || data1.updated_timestamp){
								res.statusCode = 401
								res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
								res.end('Access Denied! You cannot set id and timestamps!')
							}

							// models.QuestionCategory.findAll({
							// 	where:{
							// 		question_id : questionId
							// 	}
							// }).then(function(qc){
							// 	if(qc!=null){
								models.QuestionCategory.destroy({
									where:{
										question_id : questionId
									}
								})
							// }
							// })
							console.log("here")
							var startdb1 = new Date().getTime();
							var question_result=  await models.Question.update({
								question_text : data1.question_text,
								
								updated_timestamp: datetimestamp
							},{
								where:{
									question_id: questionId,
									user_id : account.id
								}
							})
							
							console.log(question_result)
							if(question_result==0){
								res.statusCode = 401
								res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
								res.end('Access Denied')
							}
							// console.log("question_result",question_result)
							if(categories.length==0){
								console.log("cat loop out")
								res.statusCode = 204
									res.end('Question Successfully Updated')
							}else{
								console.log("cat loop")
								if(categories){
									if(categories.length>0){
										for(i=0 ; i<categories.length; i++){
											// console.log(categories)
											let itemLower = categories[i]; //.toLowerCase();
											// console.log("ITEM  --- ", itemLower)
											// var catid = 
											// console.log(itemLower.getType())
											if(itemLower.category==""){
												continue;
											}
											const [categoryAdded,created] = await models.Category.findOrCreate({
												where: { category: itemLower.category.toLowerCase() },
												defaults: {
												category_id: uuidv4()
												}
											});
										
											await quest.addCategory(categoryAdded)
											
											var enddb1 = new Date().getTime();
											client.timing("updatequestion.db",enddb1-startdb1); 
											log.info("Question updated successfully");
											
										}
									}
								}

									log.info('Question updated Successfully!')
									res.statusCode = 204
									res.end('Question Successfully Updated')	
							}
							
						})

					}
				// });
				//}
				else{
					log.info("Question didn't get updated");

					res.statusCode = 401
					res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
					res.end('Access Denied')
				}
			  }).catch(function(err){
				log.error("User unauthorized");

				console.log(err);
				res.statusCode = 401
					res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
					res.end('Please enter a valid email address')
			  });
			
	}
	var end = new Date().getTime();
	client.timing("QuestionUpdateRequest",end-start); 

}	

exports.getQuestion = (req, res) => {
	client.increment("Question.GET.getQuestion")
	var start = new Date().getTime();
	log.info("In GET question");
	var questionId = req.url.split("/")[3];
  
	if (questionId.length === 0) {
	  res.status(404).send("Please provide a valid Question ID !");
	} else {
	  var startdb1 = new Date().getTime(); 
	  models.Question.findOne({
		where: {
		  question_id: questionId,
		},
		include: [
		  {
			model: models.Category,
			required: false,
			through: {
			  attributes: [],
			},
		  },
		  {
			model: models.Answer,
			required: false,
			where: { question_id: questionId },
			include: [
				{
					model: models.File,
					required: false,
					where: { question_id: questionId },
					defaultScope: {
						attributes: { exclude: ['metaData'] }
					  }
				}
			]
		  },
		  {
			model: models.File,
			required: false,
			where: { question_id: questionId,
			answer_id: null },
			defaultScope: {
				attributes: { exclude: ['metaData'] }
			  }
		  },
		],
	  })
		.then(function (result) {
			var enddb1 = new Date().getTime();
			client.timing("getquestion.db",enddb1-startdb1);
			if(result == null){
				res.status(404);
				res.end("Question Not Found")
			}
			
			log.info("Question fetched successfully")
		  	res.status(200).send(result);
		})
		.catch(function (err) {
			log.error("Question not found")
		  console.log("Question Not Found");
		  console.log(err);
		  res.status(404).send("Not Found");
		});
	}
	var end = new Date().getTime();
	client.timing("QuestionGetRequest",end-start);  
};

exports.getAllQuestions = (req, res) => {
	client.increment("Question.GETALL.getQuestion")
	var start = new Date().getTime();
	log.info("In GETALL questions");
	var startdb1 = new Date().getTime();    

	models.Question.findAll({
		include: [
		{
			model: models.Category,
			required: false,
			through: {
			attributes: [],
			},
		},
		{
			model: models.Answer,
			required: false,
			include: [
				{
					model: models.File,
					required: false
				}
			]
		},{
			model: models.File,
			required: false,
			where: { answer_id : null }
		},
		],
	})
		.then(function (result) {
			var enddb1 = new Date().getTime();
			client.timing("getallquestion.db",enddb1-startdb1);
			console.log(result)
			if(result.length == 0){
				res.status(404)
				res.end("No Questions Found")
			}
			
			log.info('All questions fetched succesfully')
		res.status(200).send(result);
		})
		.catch(function (err) {
			log.error("Question not found")
			console.log("Question Not Found");
			console.log(err);
			res.status(404).send("Not Found!!");
		});
		var end = new Date().getTime();
		client.timing("QuestionsGetAllRequest",end-start);  
		// log.info("Questions fetched successfully")
};

exports.deleteQuestion = (req, res) => {
	client.increment("Question.DELETE.deleteQuestion")
	var start = new Date().getTime();
	log.info("In DELETE question");

	var creds = auth(req);
	const data = req.body;


	if (!creds) {
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
		res.end('Access Denied')
		} else {
			var usrname = creds.name;
			var password = creds.pass;
			var questionId = req.url.split("/")[3];
			console.log(questionId)


			models.User.findOne({
				where: {
					username: usrname
				  }
				  }).then(function(account){	
					var valid = true;
					valid = bcrypt.compareSync(password, account.password) && valid;
					// valid = compare(usrname, data1.username) && valid;
					if (valid) {	
						models.Question.findOne({
							where: {
								question_id: questionId,
								user_id: account.id
							}
						}).then(function(question) {
							if(question == null){
								res.status(404)
								res.end('Question not Found')
							}
							models.Answer.findOne({
								where : {
									question_id : questionId
									// user_id : account.id
								}
							}).then(function(ans){
								if(ans==null){
									models.File.findAll({
										where:{
											question_id : questionId
										}
									}).then(function(Files){
										console.log(Files)
										console.log("length: "+Files.length)
										for(var i=0;i<Files.length;i++){
											
											  
											  const storage = multer.memoryStorage({
												destination: function(req,file, callback){
												  callback(null,'')
												}
											  })
											  console.log("here")
											
												console.log(Files[i].file_id+Files[i].file_name)
												const params = {
												  Bucket: config.s3_bucket,//process.env.AWS_BUCKET_NAME,
												  Key: Files[i].file_id+Files[i].file_name,//`${uuidv4()}.${fileType}`,
												  //Body: req.files.image.data
												}
			
												console.log("here2")
												const AWS = require('aws-sdk');
												const REGION = 'us-east-1';
												const s3 = new AWS.S3({
													accessKeyId: config.AWS_ID,
													secretAccessKey: config.AWS_SECRET
												  })
												AWS.config.update({
													region: REGION,
													secretAccessKey: 'AKIAYZCPJONLQR3DBEFX',
													accessKeyId: 'pLTOeyhxM+y7vUWQOsYjUTwc8cNyIUsyCMBSMhxx'
												});
												
												
												// AWS.config.credentials = new AWS.EC2MetadataCredentials({
												// 	httpOptions: { timeout: 5000 },
												// 	maxRetries: 10,
												// 	retryDelayOptions: { base: 200 }
												// })
												
												// module.exports = AWS;
												var startS3 = new Date().getTime();    
		
												s3.deleteObject(params,(error,data)=>{
												  if(error){
													res.status(500).send(error)
													console.log("in error ")
												  }else{
													  res.status(204)
													  console.log("Deleted successfully")
												  }
											
												})
												var endS3= new Date().getTime();
												client.timing("questiondeleteS3",endS3-startS3);
												var startdb1 = new Date().getTime();    

												models.Question.destroy({
													where:{
														question_id : questionId,
														user_id : account.id
													}
													}).then(function(ques){
														var enddb1 = new Date().getTime();
														client.timing("deletequestion.db",enddb1-startdb1);  
														// log.info("Question deleted successfully")
														// console.log(ques)
														if(ques==0){
															res.statusCode = 401
															// res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
															res.end('Access Denied')
														}
														log.info('question deleted successfully from the database!')
														res.status(204)
														res.end("Question deleted successfully!")
													}).catch(function(err){
														log.error("Unable to delete a question")
														console.log(err);
														res.status(400)
														res.end();
													})
												
										}
									}).catch(function(err){
										log.error("Unable to delete files from bucket")
										console.log(err)
										res.send(400)
										res.end("Unable to delete files from bucket")
									})
									
	
								}else{
									res.statusCode = 401
									res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
									res.end('Question contains an answer so cannot delete it')
								}
							}).catch(function(err){
								log.error("Unable to find ans")
								console.log(err)
								res.status(500).send("error while finding ans")
							})
						});
					}
				}).catch(function(err){
					log.error("User unauthorized")
					res.statusCode = 401
					res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
					res.end('Access Denied')
				})
				
	
		}
		var end = new Date().getTime();
		client.timing("questionDELETErequest",end-start);  
		log.info("Question deleted successfully !")
	}
