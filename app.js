const models = require('./models');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const db = require("./models");
// const NODE_ENV=development
var fileUpload = require('express-fileupload');
require('./config/config.json')
require('dotenv/config')
const multer = require('multer')
const AWS = require('aws-sdk')
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'webapp',
    streams: [{
        path: './app-logs/csye6225.log',
    }]
});
// const AppLogger = require('./app-logs/loggerFactory.js');
// const logger = AppLogger.defaultLogProvider("server");

// var bunyan = require('bunyan');
// var StatsD = require('node-statsd'),
//       client = new StatsD();
// var log = bunyan.createLogger({
//     name: 'webapp',
//     streams: [{
//         path: './log/application.log',
//     }]
// });

// const uuid = require('uuid/v4')
// import { v4 as uuidv4 } from 'uuid'
//
var port = normalizePort(process.env.PORT || '3000');


const app = express();
app.set('port',port);
app.use(bodyParser.json());
app.use(fileUpload());


app.get('/',(req,res) => {
    res.statusCode = 200
    res.json({'message':'Account Creation!!'}); 
});

// app.use("/v1/question/:question_id/file",require("./controllers/attachFileNewController"));



// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ID,
//   secretAccessKey: process.env.AWS_SECRET
// })

// const storage = multer.memoryStorage({
//   destination: function(req,file, callback){
//     callback(null,'')
//   }
// })

// const upload = multer({storage})

// app.post('/v1/question/:question_id/file',upload.single('image'),(req,res)=>{
//   console.log(req.files)
//   let myFile =req.files.image.name.split(".")
//   const fileType = myFile[myFile.length-1]
//   // console.log(req.files)
//   console.log(req.files.image.data)
//   res.send({
//     message:"Hello"
//   })
//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: `${uuidv4()}.${fileType}`,
//     Body: req.files.image.data
//   }
//   s3.upload(params,(error,data)=>{
//     if(error){
//       res.status(500).send(error)
//     }
//     res.status(200).send(data)
//   })
// })
//

require('./routes/userRoutes')(app);
  models.sequelize.sync().then(function() {
    /**
     * Listen on provided port, on all network interfaces.
     */
    app.listen(port, function() {
      console.log('Server listening on port ' + port);
    });
    app.on('error', onError);
    app.on('listening', onListening);
  }).catch(function(err){
    console.log(err);
  });

  function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
  }


  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }
  
    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;
  
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }
  
  /**
   * Event listener for HTTP server "listening" event.
   */
  
  function onListening() {
    var addr = app.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    console.log('Listening on ' + bind);
  }

  // db.sequelize.sync().then(() => {
  //   app.listen(3000, () => {
  //     console.log("Server is running on port 3000 http://localhost:3000/");
  //   });
  // }).catch(function(err){
  //   console.log(err)
  // });
  
  module.exports = app;
  


