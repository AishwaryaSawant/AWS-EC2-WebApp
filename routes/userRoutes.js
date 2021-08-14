module.exports = (app) => {
    const user = require('../controllers/userController.js');
    const question = require('../controllers/questionController.js');
    const answer = require('../controllers/answerController.js');
    // const file = require('../controllers/attachFileController.js');
    // const util = require('../controllers/awsfileupload.js');
    // const filenew = require('../controllers/attachFileNewController.js');
    const file = require('../controllers/fileController.js');

    app.post('/v1/user',user.create);
    app.get('/v1/user/self',user.view);
    app.put('/v1/user/self',user.update);
    app.get('/v1/user/:id',user.getInfo);
    // app.get('/v1/test',(req,res) => {
    //     res.statusCode = 200
    //     res.json({'message':'Testing redeploy!!'}); 
    // });



    app.post('/v1/question',question.createQuestion);
    app.put('/v1/question/:id',question.updateQuestion);
    app.delete('/v1/question/:id',question.deleteQuestion);
    app.get('/v1/question/:id',question.getQuestion);
    app.get('/v1/questions',question.getAllQuestions);

    app.post('/v1/question/:id/answer',answer.answerQuestion);
    app.put('/v1/question/:question_id/answer/:answer_id',answer.updateAnswer)
    app.delete('/v1/question/:question_id/answer/:answer_id',answer.deleteAnswer)
    app.get('/v1/question/:question_id/answer/:answer_id',answer.getAnswer)

    // app.post('/v1/question/:question_id/file',file.create)


    // app.post('/v1/question/:question_id/file',file.create)
    app.post('/v1/question/:question_id/file',file.create);
    app.post('/v1/question/:question_id/answer/:answer_id/file',file.ansCreate)
    app.delete('/v1/question/:question_id/file/:file_id',file.delete);
    app.delete('/v1/question/:question_id/answer/:answer_id/file/:file_id',file.ansDelete);

    // app.get('/v1/question/:id/file/:fileId',file.getFile);
    // app.delete('/v1/question/:id/file/:fileId',file.deleteFile);
}
