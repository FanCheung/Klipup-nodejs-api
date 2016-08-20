import * as  chai from 'chai'
let supertest = require('supertest')
let api = supertest('http://localhost:5000');

let should = chai.should()
let assert = chai.assert
let expect = chai.expect
var MongoClient = require('mongodb').MongoClient


describe('Db tests', function() {

    before(functionm(){
        //clear db here
    })

    it('should clear the db', function() {

    })

    it('should not return error object', function(done) {

        MongoClient.connect('mongodb://localhost:27017/klipup', function(err, db) {
            expect(err).to.equal(null)
            db.close()
            done()
        })
    })
})

describe('Auth api', function() {

    it('Should return unauthorize status with invalid login', function(done) {
        api.post('/api/login').send({ username: '', password: '' }).expect(401, done)
    })

    it('Should register a new user', function(done) {
        api.post('/api/register').send({ user_email: 'test@test.com', user_password: 'hello' }).expect(200, done)
    })

    it('Should have a Authorisation header', function(done) {

    })

    it('Should accept a valid password', function(done) {

    })
})
