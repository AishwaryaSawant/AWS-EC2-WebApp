const auth = require('basic-auth');
var models = require('../models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
var shortid = require('shortid');
const fs = require('fs');
// const util = require('./aws-client-fileUpload');
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
// const Filemetrics = require('../app-metrics/metricsFactory');
// const timecalculator = require('./timingController');

require('dotenv/config')
const multer = require('multer')
const AWS = require('aws-sdk')

exports.create = (req, res) => {
    var start = new Date().getTime();
    client.increment("File.POST.addFile")
    log.info('in api create file for question')
    // Filemetrics.increment("File.POST.addFile");
	// var apiStartTime = timecalculator.TimeInMilliseconds();
    var credentials = auth(req);
    if (!credentials) {
        // logger.error("No authorization credentials found in request");
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Access denied')
    } else {
        var usrname = credentials.name;
        var password = credentials.pass;
        var questionId = req.url.split("/")[3];

        if (!questionId) {
            log.error("No Question Id found in request");
            console.log("No Question Id found in request");
            res.status(400).send({
                Message: "Please provide correct Question Id !!"
            });
        }
        models.User.findOne({
            where: {
                username: usrname
            }
        }).then(function(User) {
            var valid = true;
            valid = bcrypt.compareSync(password, User.password) && valid;
            console.log(valid)
            if (valid) {
                models.Question.findOne({
                    where: {
                        question_id: questionId,
                        user_id: User.id
                    }
                }).then(function(Question) {
                    console.log(Question)
                   
                    var uuid = uuidv4();
                    var nameUUID = shortid.generate();
                    
                    if(req.files==null){
                        res.status(400)
                        res.end()
                    }
                    if(!(req.files.image.mimetype === 'image/jpeg' || req.files.image.mimetype === 'image/png' || req.files.image.mimetype === 'image/jpg')){
                        res.status(400)
                        res.end()
                    }
                    else{
                    var file = req.files.image;
                    var file_name = nameUUID+"_"+file.name;
                    var upload_date = new Date().toISOString();
                    var questionId = Question.question_id;
                    var metaDataObj = {
                        size: file.size,
                        encoding: file.encoding,
                        mimetype: file.mimetype,
                        md5: file.md5
                    }
                   
                   const s3 = new AWS.S3({
                    accessKeyId: config.AWS_ID,
                    secretAccessKey: config.AWS_SECRET
                  })
                  
                  const storage = multer.memoryStorage({
                    destination: function(req,file, callback){
                      callback(null,'')
                    }
                  })
                  
                //   const upload = multer({storage})

                  console.log(req.files)
                    let myFile =req.files.image.name.split(".")
                    const fileType = myFile[myFile.length-1]
                    // console.log(req.files)
                    console.log(req.files.image.data)
                    // res.send({
                    //   message:"Hello"
                    // })
                    const params = {
                      Bucket: config.s3_bucket,//process.env.AWS_BUCKET_NAME,
                      Key: uuid+file_name,//`${uuidv4()}.${fileType}`,
                      Body: req.files.image.data
                    }
                    // var S3UploadStartTime = timecalculator.TimeInMilliseconds();
                    var startS3 = new Date().getTime(); 

                    s3.upload(params,(error,data)=>{
                      if(error){
                        res.status(500).send(error)
                      }
                    //   var S3UploadEndTime = timecalculator.TimeInMilliseconds();
                    //   var DBQueryStartTime = timecalculator.TimeInMilliseconds();
                    var endS3 = new Date().getTime();
                    client.timing("createquestionfileS3.db",endS3-startS3);
                    log.info('Files successfully uploaded to bucket')
                    var startdb1 = new Date().getTime(); 

                    models.File.create({
                        file_id: uuid,
                        file_name: file_name,
                        s3_object_name: questionId+User.id+file_name,//Data.Location,
                        created_date: upload_date,
                        question_id: questionId,
                        answer_id: null,
                        metaData: metaDataObj

                    }).then(function(f){
                        var enddb1 = new Date().getTime();
						client.timing("createquestionfile.db",enddb1-startdb1);
                        
                        // logger.info("Successful added file record");
                        // var apiEndTime = timecalculator.TimeInMilliseconds();
                        // Filemetrics.timing("File.POST.S3",S3UploadEndTime-S3UploadStartTime);
                        // Filemetrics.timing("File.POST.DBQueryComplete",apiEndTime-DBQueryStartTime);
                        // Filemetrics.timing("File.POST.APIComplete",apiEndTime-apiStartTime);
                        f.metaData = undefined
                        f.question_id = undefined
                        f.answer_id = undefined

                    // var f = File.file_id
                        console.log("File object created successfully")
                        log.info('File uploaded to question succesfully')
                        res.statusCode = 201
                        res.send(f)
                       // res.end();
                        
                    }).catch(function(err){
                        log.error("Unable to create file");
                        console.log("Unable to create file object")
                        console.log(err)
                    })

                      
                    })
                }

                }).catch(function(err) {
                    log.error("Issue while adding file for the question");
                    console.log(err)
                    console.log("Question doesn't exist");
                    res.status(404).send({
                        message: 'question doesnt exist'
                    });
                });

            }else{
                log.error("User doesn't exist in system");

                console.log("User doesn't exist in system");
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Access denied')
            }
        }).catch(function(err) {
            log.error("User doesn't exist in system");
            console.log("User doesn't exist in system");
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Access denied')
        });

    }
    var end = new Date().getTime();
    client.timing("FilePostRequest",end-start);  
    log.info("File created successfully")

}

exports.ansCreate = (req, res) => {
    client.increment("File.POST.addAnsFile")
    var start = new Date().getTime();
    log.info('in ans file attach api')
    // Filemetrics.increment("File.POST.addFile");
    // var apiStartTime = timecalculator.TimeInMilliseconds();
    var credentials = auth(req);
    if (!credentials) {
        log.error("No authorization credentials found in request");

        console.log("No authorization credentials found in request");
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Access denied')
    } else {
        var usrname = credentials.name;
        var password = credentials.pass;
        var questionId = req.url.split("/")[3];
        var answerId = req.url.split("/")[5];

        if (!questionId) {
            log.error("No Question Id found in request");

            console.log("No Question Id found in request");
            res.status(400).send({
                Message: "Please provide correct Question Id !!"
            });
        }
        if (!answerId) {
            log.error("No Answer Id found in request");

            console.log("No Answer Id found in request");
            res.status(400).send({
                Message: "Please provide correct Answer Id !!"
            });
        }
        models.User.findOne({
            where: {
                username: usrname
            }
        }).then(function(User) {
            var valid = true;
            valid = bcrypt.compareSync(password, User.password) && valid;
            console.log(valid)
            if (valid) {
                models.Question.findOne({
                    where: {
                        question_id: questionId
                        // user_id: User.id
                    }
                }).then(function(Question) {
                    console.log(Question)
                   
                    models.Answer.findOne({
                        where: {
                            question_id: questionId,
                            answer_id: answerId,
                            user_id: User.id
                        }
                    }).then(function(Answer){
                        var uuid = uuidv4();
                        var nameUUID = shortid.generate();
                        console.log(req.files)
                        if(req.files==null){
                            res.status(400)
                            res.end()
                        }
                        // if(!(req.files.image.mimetype === 'image/jpeg' || req.files.image.mimetype === 'image/png' || req.files.image.mimetype === 'image/jpg')){
                        //     res.status(400)
                        //     res.end()
                        // }
                       
                        console.log(req.files.mimetype)
                        var file = req.files.image;
                        var file_name = nameUUID+"_"+file.name;
                        var upload_date = new Date().toISOString();//.split('T')[0];
                        var answerId = Answer.answer_id;
                        var metaDataObj = {
                            size: file.size,
                            encoding: file.encoding,
                            mimetype: file.mimetype,
                            md5: file.md5
                        }
                   
                   const s3 = new AWS.S3({
                    accessKeyId: config.AWS_ID,
                    secretAccessKey: config.AWS_SECRET
                  })
                  
                  const storage = multer.memoryStorage({
                    destination: function(req,file, callback){
                      callback(null,'')
                    }
                  })
                  
                  const upload = multer({storage})

                  console.log(req.files)
                    let myFile =req.files.image.name.split(".")
                    const fileType = myFile[myFile.length-1]
                    console.log(req.files.image.mimetype)
                    if(req.files.image.mimetype === 'image/jpeg' || req.files.image.mimetype === 'image/png' || req.files.image.mimetype === 'image/jpg'){
                        
                    var startdb1 = new Date().getTime(); 

                    // console.log(req.files)
                    console.log(req.files.image.data)
                    // res.send({
                    //   message:"Hello"
                    // })
                    const params = {
                      Bucket: config.s3_bucket,//process.env.AWS_BUCKET_NAME,
                      Key: uuid+file_name,//`${uuidv4()}.${fileType}`,
                      Body: req.files.image.data
                    }
                    // var S3UploadStartTime = timecalculator.TimeInMilliseconds();
                    var startS3 = new Date().getTime(); 

                    s3.upload(params,(error,data)=>{
                      if(error){
                        res.status(500).send(error)
                      }
                    //   var S3UploadEndTime = timecalculator.TimeInMilliseconds();
                    //   var DBQueryStartTime = timecalculator.TimeInMilliseconds();
                    var endS3 = new Date().getTime();
                    client.timing("filepostS3",endS3-startS3);
                    log.info('File uploaded to S3 bucket')

                    models.File.create({
                        file_id: uuid,
                        file_name: file_name,
                        s3_object_name: questionId+User.id+file_name,//Data.Location,
                        created_date: upload_date,
                        question_id: questionId,
                        answer_id: answerId,
                        metaData: metaDataObj

                    }).then(function(f){
                        var enddb1 = new Date().getTime();
						client.timing("createAnswerFile.db",enddb1-startdb1);
                        log.info("Successful added file record");

                     var File = models.File.build({
                        file_id: uuid,
                        file_name: file_name,
                        s3_object_name: questionId+User.id+file_name,//Data.Location,
                        created_date: upload_date,
                        // question_id: questionId,
                        // answer_id: null,
                        // metaData: metaDataObj

                    })

                    // var f = File.file_id
                    // logger.info("Successful updated bill with attached file details");
                    // var apiEndTime = timecalculator.TimeInMilliseconds();
                    // Filemetrics.timing("File.POST.S3",S3UploadEndTime-S3UploadStartTime);
                    // Filemetrics.timing("File.POST.DBQueryComplete",apiEndTime-DBQueryStartTime);
                    // Filemetrics.timing("File.POST.APIComplete",apiEndTime-apiStartTime);
                      
                        log.info("File created successfully")
                        res.status(201).send(File);
                        console.log("File object created successfully")
                    }).catch(function(err){
                        logger.error("Couldn't add file object");

                        console.log("Unable to create file object")
                        console.log(err)
                    })  
                    })
                }else{
                    log.error("Format of the file is incorrect")
                    res.status(400).send({
                        message: "Should be jpeg,jpg or png"
                    })
                }
                    }).catch(function(err){
                        log.error("Couldn't find answer");

                        console.log(err)
                        console.log("Answer doesn't exist");
                        res.status(404).send({
                        message: 'answer doesnt exist'
                        });
                    })


                }).catch(function(err) {
                    log.error("Couldn't find Question");

                    console.log(err)
                    console.log("Question doesn't exist");
                    res.status(404).send({
                        message: 'question doesnt exist'
                    });
                });

            }else{
                log.error("User doesn't exist in system");

                console.log("User doesn't exist in system");
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Access denied')
            }
        }).catch(function(err) {
            log.error("User doesn't exist in system");

            console.log("User doesn't exist in system");
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            res.end('Access denied')
        });

    }
    var end = new Date().getTime();
    client.timing("FileAnsPostRequest",end-start);

}

exports.delete = (req, res) => {
    client.increment("File.DELETE.deleteFile")
	var start = new Date().getTime();
    log.info("In DELETE file for ans api");
    // Filemetrics.increment("File.DEL.deleteFile");
    // var apiStartTime = timecalculator.TimeInMilliseconds();
    var credentials = auth(req);
    if (!credentials) {
        log.error('Access denied')
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Access denied')
    } else {
        var usrname = credentials.name;
        var password = credentials.pass;
        var questionId = req.url.split("/")[3];
        var fileId = req.url.split("/")[5];

        if (!questionId || !fileId) {
            log.error("Question Id or File Id Not found in request");
            res.status(404).send({
                Message: "Please provide correct Question Id and File Id !!"
            });
        } else {
            models.User.findOne({
                where: {
                    username: usrname
                }
            }).then(function(User) {
                var valid = true;
                valid = bcrypt.compareSync(password, User.password) && valid;
                console.log(valid)
                if (valid) {
                    models.Question.findOne({
                        where: {
                            question_id: questionId,
                            user_id: User.id
                        }
                    }).then(function(Question) {
                        if (Question) {
                            models.File.findOne({
                                where: {
                                    file_id: fileId,
                                    question_id: questionId
                                }
                            }).then(function(file) {

                                console.log(file)
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
                                //   const upload = multer({storage})
                
                                  //console.log(req.files)
                                    // let myFile =req.files.image.name.split(".")
                                    // const fileType = myFile[myFile.length-1]
                                    // console.log(req.files)
                                    // console.log(req.files.image.data)
                                    // res.send({
                                    //   message:"Hello"
                                    // })
                                    console.log(file.file_id+file.file_name)
                                    const params = {
                                      Bucket: config.s3_bucket,//process.env.AWS_BUCKET_NAME,
                                      Key: file.file_id+file.file_name,//`${uuidv4()}.${fileType}`,
                                      //Body: req.files.image.data
                                    }

                                    console.log("here2")
                                    // var S3DeleteStartTime = timecalculator.TimeInMilliseconds();
                                    var startS3 = new Date().getTime(); 

                                    s3.deleteObject(params,(error,data)=>{
                                      if(error){
                                        res.status(500).send(error)
                                        console.log("in error")
                                      }
                                      var endS3 = new Date().getTime();
                                        client.timing("questionfiledeleteS3",endS3-startS3);
                                    //   logger.info("Deleted File from S3 Bucket");
                                    //   var S3DeleteEndTime = timecalculator.TimeInMilliseconds();
                                    //   var DBQueryStartTime = timecalculator.TimeInMilliseconds();
                                    var startdb1 = new Date().getTime();
                                    log.info('File deleted successfully from S3') 

                                      models.File.destroy({
                                          where: {
                                              file_id : file.file_id
                                          }
                                      }).then(function(dest){
                                        var enddb1 = new Date().getTime();
                                        client.timing("questionfiledelete.db",enddb1-startdb1);
                                        log.info("Deleted File record from system");
                                            
                                          res.status(204)
                                          res.end("File deleted successfully")
                                          console.log("destroyed")
                                          
                                      }).catch(function(err){
                                        logger.erre("File record is not found");

                                          res.status(400)
                                          res.end()
                                          console.log("Unable to delete file from the bucket")
                                      })
                                    })

                            }).catch(function(err) {
                                logger.error("File record is not found");

                                console.log("File not found");
                                res.status(404).send("file record doesn't exist !!")
                            });
                        } else {
                            log.error("Question record is not found");

                            console.log("Question not found");
                            res.status(404).end();
                        }

                    }).catch(function(err) {
                        logger.error("Issue while deleting the file record");

                        console.log("Issue while finding Question");
                        res.status(404).send("Question record doesn't exist !!")
                    });

                } else {
                    logger.error("User unauthorized");

                    console.log("User unauthorized");
                    res.statusCode = 401
                    res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                    res.end('Access denied')
                }
            }).catch(function(err) {
                log.error("File not found");

                console.log("User doesn't exist in system");
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Access denied')
            });

        }

    }

    var end = new Date().getTime();
    client.timing("FileDeleteRequest",end-start);  
    log.info("File deleted successfully")

}

exports.ansDelete = (req, res) => {
    client.increment("File.DELETE.deleteAnsFile")
	var start = new Date().getTime();
    log.info("In DELETE Ans file");
    // Filemetrics.increment("File.DEL.deleteFile");
    // var apiStartTime = timecalculator.TimeInMilliseconds();
    var credentials = auth(req);
    if (!credentials) {
        log.err('Invalid credentials')
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Access denied')
    } else {
        var usrname = credentials.name;
        var password = credentials.pass;
        var questionId = req.url.split("/")[3];
        var answerId = req.url.split("/")[5];
        var fileId = req.url.split("/")[7];

        if (!questionId || !fileId || !answerId) {
            // logger.error("Question Id or File Id or AnswerId Not found in request");
            res.status(400).send({
                Message: "Please provide correct Question Id, Answer Id and File Id!!"
            });
        } else {
            models.User.findOne({
                where: {
                    username: usrname
                }
            }).then(function(User) {
                var valid = true;
                valid = bcrypt.compareSync(password, User.password) && valid;
                if (valid) {
                    models.Question.findOne({
                        where: {
                            question_id: questionId,
                            user_id: User.id
                        }
                    }).then(function(Question){
                        console.log(User)
                        console.log(Question)
                        console.log(answerId)
                        console.log(questionId)
                        console.log(User.id)
                        if(Question){
                            models.Answer.findOne({
                                where : {
                                    answer_id : answerId,
                                    user_id: User.id,
                                    question_id: questionId
                                }
                            }).then(function(Answer) {
                                console.log(Answer)
                                //if(Answer) {
                                    models.File.findOne({
                                        where: {
                                            file_id: fileId,
                                            answer_id: answerId
                                        }
                                    }).then(function(file) {


                                        console.log(file)
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
                                        //   const upload = multer({storage})
                        
                                          //console.log(req.files)
                                            // let myFile =req.files.image.name.split(".")
                                            // const fileType = myFile[myFile.length-1]
                                            // console.log(req.files)
                                            // console.log(req.files.image.data)
                                            // res.send({
                                            //   message:"Hello"
                                            // })
                                            console.log(file.file_id+file.file_name)
                                            const params = {
                                              Bucket: config.s3_bucket,//process.env.AWS_BUCKET_NAME,
                                              Key: file.file_id+file.file_name,//`${uuidv4()}.${fileType}`,
                                              //Body: req.files.image.data
                                            }
        
                                            console.log("here2")
                                            // var S3DeleteStartTime = timecalculator.TimeInMilliseconds();
                                            var startS3 = new Date().getTime(); 

                                            s3.deleteObject(params,(error,data)=>{
                                              if(error){
                                                res.status(500).send(error)
                                                console.log("in error ")
                                              }

                                              var endS3 = new Date().getTime();
                                              client.timing("fileansdeleteS3",endS3-startS3);
                                              log.info('File deleted from bucket')
                                            //   logger.info("Deleted File from S3 Bucket");
                                            //   var S3DeleteEndTime = timecalculator.TimeInMilliseconds();
                                            //   var DBQueryStartTime = timecalculator.TimeInMilliseconds();
                                              var startdb1 = new Date().getTime(); 

                                              models.File.destroy({
                                                  where: {
                                                      file_id : file.file_id
                                                  }
                                              }).then(function(dest){
                                                var enddb1 = new Date().getTime();
                                                client.timing("fileansdelete.db",enddb1-startdb1);
                                                log.info("Deleted File record from system");
                                                
                                                  res.status(204)
                                                  res.end("File deleted successfully")
                                                  console.log("destroyed")
                                              }).catch(function(err){
                                                log.error("Couldn't Update the delete file record");

                                                  res.status(400)
                                                  res.end()
                                                  console.log(err)
                                              })
                                            })
                                            
                                      
        
                                    }).catch(function(err) {
                                        log.error("File not found");

                                        console.log("File not found");
                                        res.status(404).send("file record doesn't exist !!")
                                    });
                                // } else {
                                //     console.log("Question not found");
                                //     res.status(404).end();
                                // }
        
                            }).catch(function(err) {
                                log.error("Couldn't find ans for file deletion");

                                console.log("Answer not found");
                                res.status(404).send("Answer not found for the user !!")
                            });
                        }
                    }).catch(function(err){
                        log.error("Couldn't find question");

                        console.log("Question not found");
                        res.status(404)
                        res.end("Question not found !!")
                    })
                    

                } else {
                    log.error("User unauthorized");

                    console.log("User unauthorized");
                    res.statusCode = 401
                    res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                    res.end('Access denied')
                }
            }).catch(function(err) {
                // logger.error("Couldn't Update Bill record after file deletion");
                log.error("User doesn't exist in system");

                console.log("User doesn't exist in system");
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Access denied')
            });

        }

    }

    var end = new Date().getTime();
    client.timing("FileAnsDeleteRequest",end-start);  
    log.info("File deleted successfully")

}
