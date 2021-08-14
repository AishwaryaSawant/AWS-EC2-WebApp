var models  = require('../models');
const { v4: uuidv4 } = require('uuid');
const auth = require('basic-auth');
const bcrypt = require('bcrypt');
// require('../config/config.json')
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

require('dotenv/config')
const multer = require('multer')
const AWS = require('aws-sdk')

exports.answerQuestion = (req, res) => {
    var start = new Date().getTime();
    client.increment("Answer.POST.addAnswer")
    log.info('in api answer a question')
	var creds = auth(req);
	if (!creds) {
        console.log("no creds")
        log.error("No authorization credentials found in request");
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
		res.end('Access denied')
	} else {
		var usrname = creds.name;
		var password = creds.pass;
        var questionId = req.url.split("/")[3];

		models.User.findOne({
			where: {
				username: usrname
			}
		}).then(function(result) {
            log.info("found")
            var valid = true;
            log.info(password)
            log.info(result.password)
			valid = bcrypt.compareSync(password, result.password) && valid;
			if (valid) {
                log.info("valid")
				models.Question.findOne({
					where: {
						question_id: questionId
						// user_id: result.id
					}
				}).then(function(question) {
                    log.info(question.user_id)
                    if(question==null){
                        res.statusCode = 404
                        // res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                        res.end('Question not found')
                    }
                    else{
                        if(req.body.answer_id || req.body.question_id || req.body.created_timestamp || req.body.updated_timestamp ){
                            res.statusCode = 401
                            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                            res.end('Access Denied ! You cannot set id and timestamps!')
                        }
                        else{
                            if(req.body.answer_text==""){
                                log.error('Answer text cannot be empty')
                                res.statusCode = 400
                                // res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                                res.end('Answer cannot be empty')
                            }
                            else{
                                console.log("here")
                                var datetimestamp = new Date();
                                datetimestamp = datetimestamp.toISOString();

                                var startdb1 = new Date().getTime(); 

                                var Answer = models.Answer.build({
                                answer_id : uuidv4(),
                                question_id : question.question_id,				
                                created_timestamp : datetimestamp,
                                updated_timestamp : datetimestamp,
                                user_id : result.id,
                                answer_text : req.body.answer_text
                                })
                                console.log("here2")
                                Answer.save().then(function(err){
                                console.log("here3")
                                models.Answer.findOne({
									where: {
									  answer_id: Answer.answer_id,
									},
									include: [
									  {
										  model: models.File,
										  required: false,
										  where: { answer_id: Answer.answer_id}
									  }
									],
								  })
									.then(function(result) {
                                        log.info("Answer found in system");

										var enddb1 = new Date().getTime();
                                        client.timing("createanswer.db",enddb1-startdb1);
                                        
                                        console.log("NEW"+result)
										if(result == null){
											res.status(404);
											res.end("Answer Not Found")
										}
									  res.status(201).send(result);
									})
									.catch(function (err) {
                                        log.error("Answer not found")
                                        console.log("Answer Not Found!!");
                                        console.log(err);
                                        res.status(404).send("Not Found!!");
                                    }); 

                                log.info("Answer created successfully")
                                console.log(Answer);

                                AWS.config.update({ region: "us-east-1" });
                                log.info(usrname);
                                log.info(question.user_id)
                                models.User.findOne({
                                    where: {
                                        id: question.user_id,
                                      }
                                }).then(function(send){
                                    log.info(send.username)
                                    const params = {
                                        Message: JSON.stringify({ email: send.username,//usrname,
                                        msg: "You question with question id: "+questionId+" has been Answered.\n The answer id: "+Answer.answer_id+" and answer text: "+
                                        Answer.answer_text+"\n Link for the answer: <html><body><a href='https://prods.aishwaryas.me/v1/question/"+questionId+"/answer/"+Answer.answer_id+
                                        "'>https://prods.aishwaryas.me/v1/question/"+questionId+
                                        "/answer/"+Answer.answer_id+
                                        "</a>\n Link for question:<a href='https://prods.aishwaryas.me/v1/question/"+questionId+"'>https://prods.aishwaryas.me/v1/question/"+questionId+"</a></body></html>",
                                        subject: "Question is Answered",
                                        answerId: Answer.answer_id,
                                        answerText: Answer.answer_text,
                                        action: "Posted",
                                        questionId: questionId,
                                        userId: result.id}),
                                        // questionId: questionId,
                                        // answerId: Answer.answer_id,
                                        // answerText: Answer.answer_text,
                                        // answerlink: "api.prods.aishwaryas.me/v1/question/"+questionId+"/answer/"+Answer.answer_id,
                                        // questionlink: "api.prods.aishwaryas.me/v1/question/"+questionId,
                                        // action: "Answered" }),
                                        TopicArn: "arn:aws:sns:us-east-1:663668038035:answer_events"
                                    };
    
                                    const awssns = new AWS.SNS({ apiVersion: "2010-03-31" })
                                    .publish(params)
                                    .promise();
                                
                                    awssns
                                    .then(function(data) {
                                        log.info(`message ${params.Message} sent to ${params.TopicArn}`);
                                    })
                                    .catch(function (err) {
                                        log.info(err);
                                    });
                                    res.status(201).send(Answer);
                                }).catch(function(err){
                                    log.info("in error")
                                    log.info(err)
                                })
                                
                            }).catch(function(err){
                                log.error("Error in answer creation ")
                                res.status(400).send("Error in answer creation");
                            });
                            question.addAnswer(Answer);
                            }
                        } 
                    }

				}).catch(function(err) {
                    log.error("No question found")
                    console.log(err);
                    res.send(400)
                    res.end("No Question Found");
				});

			} else {
                log.error("Access denied")
				res.statusCode = 401
				res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
				res.end('Access denied')
			}
		}).catch(function(err) {
            console.log("not found")
            log.error("Access denied")
			res.statusCode = 401
			res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
			res.end('Access denied')
		});

    }
    var end = new Date().getTime();
    client.timing("AnswerPostRequest",end-start);  
    log.info("Answer created successfully")

}

exports.updateAnswer = (req, res) => {
    client.increment("Answer.UPDATE.updateAnswer");
	// var apiStartTime = timecalculator.TimeInMilliseconds();
	var start = new Date().getTime();
	log.info("In Answer update api");
	var creds = auth(req);
	const data = req.body;

	if (!creds) {
        log.error("No authorization credentials found in request");
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
		res.end('Access Denied')
	}   else {
		
		var usrname = creds.name;
		var password = creds.pass;
        var questionId = req.url.split("/")[3];
        var answerId = req.url.split("/")[5];
        // var data1 = req.body;

		models.User.findOne({
            where: {
                username: usrname
              }
              }).then(function(account){


				var datetimestamp = new Date();
				datetimestamp = datetimestamp.toISOString();

				// console.log(account);
				var valid = true;
				valid = bcrypt.compareSync(password, account.password) && valid;
				// valid = compare(usrname, data1.username) && valid;
				if (valid) {
					
					if(req.body.answer_id || req.body.question_id || req.body.created_timestamp || req.body.updated_timestamp ){
                        res.statusCode = 401
                        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                        res.end('Access Denied ! You cannot set id and timestamps!')
                    }

                    if(req.body.answer_text==""){
                        res.statusCode = 400
                        // res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                        res.end('Answer cannot be empty')
                    }
                    // console.log("validated");
                    // models.Question.findOne({
                    //     where :{
                    //         id: questionId
                    //     }
                    // }).then(function(question){

                    // })catch(function(err){
                    //     console.log(err);
                    //     res.statusCode = 401
                    //         res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                    //         res.end('Please enter a valid email address')
                    // });

                    models.Question.findOne({
                        where: {
                            question_id: questionId
                            // user_id: result.id
                        }
                    }).then(function(question) {
                        if(question==null){
                            res.statusCode = 404
                            res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                            res.end('Question not found')
                        }
                        var datetimestamp = new Date();
                        datetimestamp = datetimestamp.toISOString();
                        models.Answer.findOne({
                            where : {
                                // question_id : questionId,
                                answer_id : answerId
                                // user_id : account.id
                            }
                        }).then(function(ans){
                            if(ans==null){
                                res.statusCode = 404
                                res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                                res.end('Answer not found')
                            }
                            var startdb1 = new Date().getTime();

                            models.Answer.update({
                                answer_text : data.answer_text,
                                updated_timestamp : datetimestamp,
                            },{where:{
                                
                                answer_id : answerId,
                                user_id : account.id,
                                question_id: questionId
                            }
                            }).then(function(result){
                                var enddb1 = new Date().getTime();
                                client.timing("updateanswer.db",enddb1-startdb1); 
                                log.info("Answer updated successfully");
                                console.log(result)
                                if(result==0)
                                {
                                    res.status(401)
                                    res.end('Access Denied')
                                }
                                AWS.config.update({ region: "us-east-1" });
                                log.info(usrname);
                                models.User.findOne({
                                    where: {
                                        id: question.user_id,
                                      }
                                }).then(function(send){
                                const params = {
                                    Message: JSON.stringify({ email: send.username,
                                    msg: "You question with question id: "+questionId+" ,it's answer has been updated.\n The answer id: "+answerId+" and answer text: "+
                                    data.answer_text+"\n Link for the answer: <html><body><a href='https://prods.aishwaryas.me/v1/question/"+questionId+"/answer/"+answerId+
                                    "'>https://prods.aishwaryas.me/v1/question/"+questionId+
                                    "/answer/"+answerId+
                                    "</a>\n Link for question:<a href='https://prods.aishwaryas.me/v1/question/"+questionId+"'>https://prods.aishwaryas.me/v1/question/"+questionId+"</a></body></html>",
                                    subject: "Answer to your question is updated",
                                    answerId: answerId,
                                    answerText: data.answer_text,
                                    action: "Updated",
                                    questionId: questionId,
                                    userId: account.id}),
                                    // questionId: questionId,
                                    // answerId: Answer.answer_id,
                                    // answerText: Answer.answer_text,
                                    // answerlink: "api.prods.aishwaryas.me/v1/question/"+questionId+"/answer/"+Answer.answer_id,
                                    // questionlink: "api.prods.aishwaryas.me/v1/question/"+questionId,
                                    // action: "Answered" }),
                                    TopicArn: "arn:aws:sns:us-east-1:663668038035:answer_events"
                                };

                                const awssns = new AWS.SNS({ apiVersion: "2010-03-31" })
                                .publish(params)
                                .promise();
                            
                                awssns
                                .then(function(data) {
                                    log.info(`message ${params.Message} sent to ${params.TopicArn}`);
                                })
                                .catch(function (err) {
                                    log.info(err);
                                });
                                res.status(204)
                                res.end()
                            }).catch(function(err){
                                log.error("Answer update unsuccessful")
                                console.log(err);
                                res.status(400)
                                res.end();
                            })
                            
                            // Answer.save().then(function(err){
                            //     console.log(Answer);
                            //     res.status(201).send(Answer);
                            // }).catch(function(err){
                            //     res.status(400).send("Error in answer creation");
                            // });
                            // question.addAnswer(Answer);

                        }).catch(function(err){
                            log.error("User unauthorized")
                            res.statusCode = 404
                            res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                            res.end('Answer not found')
                        })
                       
    
                    }).catch(function(err) {
                        log.error("Question not found")
                        res.statusCode = 404
                        res.end('Question not found')
                        console.log(err);
                    });
                }).catch(function(err){
                    log.info("in error")
                    log.info(err)
                })
                }else{
                    log.err('Access denied')
                    res.statusCode = 401
                    res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                    res.end('Access Denied')
                }
			  }).catch(function(err){
                    console.log(err);
                    log.error("Invalid email address")
                    res.statusCode = 401
					res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
					res.end('Please enter a valid email address')
			  });
    }
    var end = new Date().getTime();
    client.timing("AnswerUpdateRequest",end-start);

}

exports.deleteAnswer = (req, res) => {
    client.increment("Answer.DELETE.deleteAnswer")
	var start = new Date().getTime();
    log.info("In DELETE answer");
    
    var creds = auth(req);
	const data = req.body;

	if (!creds) {
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
		res.end('Access Denied')
    }else{	
		var usrname = creds.name;
		var password = creds.pass;
        var questionId = req.url.split("/")[3];
        var answerId = req.url.split("/")[5];
        // var data1 = req.body;

		models.User.findOne({
            where: {
                username: usrname
              }
              }).then(function(account){

                console.log(account)
				// var datetimestamp = new Date();
				// datetimestamp = datetimestamp.toISOString();

				// console.log(account);
				var valid = true;
				valid = bcrypt.compareSync(password, account.password) && valid;
                // valid = compare(usrname, data1.username) && valid;
                console.log(valid)
				if(valid) {

                    models.Question.findOne({
                        where: {
                            question_id: questionId
                            // user_id: result.id
                        }
                    }).then(function(question) {
                        if(question==null){
                            res.statusCode = 404
                            res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                            res.end('Question not found')
                        }
                        // var datetimestamp = new Date();
                        // datetimestamp = datetimestamp.toISOString();
                        models.Answer.findOne({
                            where : {
                                answer_id : answerId,
                                user_id : account.id
                            }
                        }).then(function(ans){
                            var anstext = ans.answer_text
                            console.log(ans)
                            if(ans==null){
                                res.statusCode = 404
                                res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                                res.end('Answer not found')
                            }
                            models.File.findAll({
                                where:{
                                    question_id : questionId
                                }
                            }).then(function(Files){

                                for(var i=0;i<Files.length;i++){
                                    const s3 = new AWS.S3({
                                        accessKeyId: config.AWS_ID,
                                        secretAccessKey: config.AWS_SECRET
                                      })
                                      
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
                                        var startS3 = new Date().getTime(); 

                                        s3.deleteObject(params,(error,data)=>{
                                          if(error){
                                            res.status(500).send(error)
                                            console.log("in error ")
                                          }else{
                                              res.status(204)
                                              console.log("Deleted successfully")
                                          }
                                        //   models.File.destroy({
                                        // 	  where: {
                                        // 		  file_id : file.file_id
                                        // 	  }
                                        //   }).then(function(dest){
                                        // 	  res.status(204)
                                        // 	  res.end("File deleted successfully")
                                        // 	  console.log("destroyed")
                                        //   }).catch(function(err){
                                        // 	  res.status(400)
                                        // 	  res.end()
                                        // 	  console.log(err)
                                        //   })
                                        })
                                        var endS3 = new Date().getTime();
                                client.timing("deleteanswerS3",endS3-startS3); 
                                log.info("Answer deleted from bucket");
                                //         var enddb1 = new Date().getTime();
                                // client.timing("deleteanswer.db",enddb1-startdb1); 
                                // log.info("Answer deleted successfully");
                                }
                            }).catch(function(err){
                                console.log(err)
                                res.send(400)
                                res.end("Unable to delete files from bucket")
                            })
                            var startdb1 = new Date().getTime(); 

                            models.Answer.destroy({
                            where:{
                                answer_id : answerId,
                                user_id : account.id
                            }
                            }).then(function(result){
                                var enddb1 = new Date().getTime();
                                client.timing("deleteanswer.db",enddb1-startdb1); 

                                log.info("Answer deleted successfully");
                                // console.log(result)
                                if(result==0){
                                    res.statusCode = 401
                                    res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                                    res.end('Access Denied')
                                }

                                AWS.config.update({ region: "us-east-1" });
                                log.info(usrname);
                                models.User.findOne({
                                    where: {
                                        id: question.user_id,
                                      }
                                }).then(function(send){
                                const params = {
                                    Message: JSON.stringify({ email: send.username,
                                    msg: "You question with question id: "+questionId+" ,it's answer has been deleted.\n The answer id: "+answerId+" and answer text: "+
                                    anstext+"\n Link for question:<html><body><a href='https://prods.aishwaryas.me/v1/question/"+questionId+"'>https://prods.aishwaryas.me/v1/question/"+questionId+"</a></body></html>",
                                    subject: "Answer to your question is deleted",
                                    answerId: answerId,
                                    answerText: anstext,
                                    action: "Deleted",
                                    questionId: questionId,
                                    userId: account.id}),
                                    // questionId: questionId,
                                    // answerId: Answer.answer_id,
                                    // answerText: Answer.answer_text,
                                    // answerlink: "api.prods.aishwaryas.me/v1/question/"+questionId+"/answer/"+Answer.answer_id,
                                    // questionlink: "api.prods.aishwaryas.me/v1/question/"+questionId,
                                    // action: "Answered" }),
                                    TopicArn: "arn:aws:sns:us-east-1:663668038035:answer_events"
                                };

                                const awssns = new AWS.SNS({ apiVersion: "2010-03-31" })
                                .publish(params)
                                .promise();
                            
                                awssns
                                .then(function(data) {
                                    log.info(`message ${params.Message} sent to ${params.TopicArn}`);
                                })
                                .catch(function (err) {
                                    log.info(err);
                                });

                                res.status(204)
                                res.end("Answer deleted successfully!")
                            }).catch(function(err){
                                log.info("in error")
                                log.info(err)
                            })
                            }).catch(function(err){
                                log.error('Unable to delete answer')
                                console.log(err);
                                res.status(401)
                                res.end('Access Denied');
                            })

                        }).catch(function(err){
                            log.error('Access denied')
                            res.statusCode = 401
                            res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                            res.end('Access Denied')
                        })                    
    
                    }).catch(function(err) {
                        log.error('Access Denied')
                        console.log(err);
                    });
                
				}else{
                    log.error('Access Denied')
					res.statusCode = 401
					res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
					res.end('Access Denied')
				}
			}).catch(function(err){
                log.error('Enter a valid email address')
				console.log(err);
				res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                res.end('Please enter a valid email address')
            })
        
    }
    var end = new Date().getTime();
    client.timing("AnswerDeleteRequest",end-start);

}
    
exports.getAnswer = (req, res) => {
    client.increment("Answer.GET.getAnswer")
	var start = new Date().getTime();
	log.info("In GET answer");
    var questionId = req.url.split("/")[3];
    var answerId = req.url.split("/")[5];

            models.Question.findOne({
                where: {
                    question_id: questionId
                }
            }).then(function(question) {
                if(question ==null){
                    res.status(404)
                    res.end("Question Not Found");
                }
                models.Answer.findOne({
                    where : {
                        answer_id : answerId,
                        question_id : questionId
                    }
                }).then(function(ans){
                    var startdb1 = new Date().getTime(); 
                    // Answer = {
                    //     answer_id: ans.answer_id,
                    //     question_id : questionId,
                    //     created_timestamp: ans.created_timestamp,
                    //     updated_timestamp: ans.updated_timestamp,
                    //     user_id : ans.user_id,
                    //     answer_text: ans.answer_text
                        
                    // }
                    models.Answer.findOne({
                        where: {
                          answer_id: answerId,
                        },
                        include: [
                          {
                            model: models.File,
                            required: false,
                            where: { question_id: questionId },
                          },
                        ],
                      }).then(function (result) {
                        var enddb1 = new Date().getTime();
                        client.timing("getanswer.db",enddb1-startdb1);
                        if(result == null){
                            res.status(404);
                            res.end("Answer Not Found")
                        }
                        log.info('Answer fetched successfully')
                        res.status(200).send(result);
                    })
                    .catch(function (err) {
                        log.error('Answer not found')
                      console.log("Answer Not Found");
                      console.log(err);
                      res.status(404).send("Not Found");
                    });
                    // res.statusCode = 200
                    // res.send(Answer);
                    
                    }).catch(function(err){
                        log.error('Answer not found')
                        console.log(err);
                        res.status(404)
                        res.end("Answer Not Found");

                }).catch(function(err){
                    log.error('Access denied')
                    res.statusCode = 401
                    res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
                    res.end('Access Denied')
                })   

            }).catch(function(err) {
                log.error('Question not found')
                console.log(err);
            });					
        var end = new Date().getTime();
        client.timing("AnswerGetRequest",end-start);  
        log.info("Answer fetched successfully")
}