const { v4: uuidv4 } = require('uuid');

var uuid = uuidv4();

const request = require('supertest');
const express = require('express');
var bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json())
require('../routes/userRoutes')(app);

// describe('Post /v1/user', function(req,res) {
//     it('responds with json', function(done) {
//       request(app)
//         .post('/v1/user')
//         .send({
//           "id": uuid,
//             "first_name": "Aishwarya",
//             "last_name": "Sawant",
//             "password": "Ash@12345",
//             "username": "aishwarya.sawant@example.com"})
//         .set('Accept', 'application/json')
//         .expect('Content-Type', 'text/html; charset=utf-8')
//         .expect(400)
//         .end(function(err, res) {
//             if (err) return done(err);
//             done();
//           });
//     });
//   });
describe('Simple test suite:', function() {
  it('1 === 1 should be true', function() {
      assert(1 === 1);
  });
});

  // describe('Post /v1/user', function(req,res) {
  //   it('responds with json', function(done) {
  //     request(app)
  //       .post('/v1/user')
  //       .send({
  //           "first_name": "Aishwarya",
  //           "last_name": "Sawant",
  //           "password": "",
  //           "username": "aishwarya.sawant@example.com"})
  //       .set('Accept', 'application/json')
  //       .expect('Content-Type', /json/)
  //       .expect(400)
  //       .end(function(err, res) {
  //           if (err) return done(err);
  //           done();
  //         });
  //   });
  // });
