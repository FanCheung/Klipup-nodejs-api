import * as  chai from 'chai'
import * as CONFIG from './core/CONFIG'
let supertest = require('supertest')
let api = supertest('http://localhost:5000');
// let chai = require('chai')
let should = chai.should()
let assert = chai.assert
let expect = chai.expect
var MongoClient = require('mongodb').MongoClient
var siteUrl = 'http://localhost:8080'
var dbUrl = 'mongodb://localhost:27017/klipup'

function connectDb(dbUrl = 'mongodb://localhost:27017/klipup') {
    return new Promise(function(resolve, reject) {
        MongoClient.connect(dbUrl, function(err, db) {
            return resolve(db)
            // db.close()
        })
    })
}


describe('Db tests', function() {
    before(function(done) {
        // clean db here
    })
    it('should clear the db', function() { })
    it('should not return error object', function(done) {
        MongoClient.connect('mongodb://localhost:27017/klipup', function(err, db) {
            expect(err).to.equal(null)
            db.close()
            done()
        })
    })
})

describe('Registration', function() {
    let db = null
    let users = {}
    let user = {}
    let testData = { email: 'test@test.com', password: '000000' }
    before(function(done) {

        MongoClient.connect(dbUrl, function(err, result) {
            //make db availabel for use avoid multiple connection call back
            db = result
            users = db.collection('users');

            // remove all users
            users.deleteMany({})
            return done()
        })
    })

    it('Facebook login', function(done) {

    })

    it('Should return unauthorize status with invalid login', function(done) {
        api.post('/api/login').send({ username: '', password: '' }).expect(401, done)
    })

    it.only('Should register a new user and create a user record in db', function(done) {

        api.post('/api/register').send({ user_email: 'test@test.com', user_password: 'hello' }).expect(200, function(error, result) {
            // should return user object
            assert.equal(result.body.data.userEmail, 'test@test.com')
            if (!error)
                done()
        })
    })

    it.only('User should be found in db now', function(done) {
        users.findOne({ email: 'test@test.com' }, (err, result) => {
            user = result
            done()
        })
    })

    it.only('Should reject the an expired token', function(done) {
        let activationLink = '/api/activate/?email=' + user.email + '&token=' + '888'
        api.get(activationLink).expect(500, function(error, res) {
            assert(res.body.error)
            assert(res.error instanceof Error)
            done()
        })


    })

    it('Should reject a invalid token', function(done) {
    })

    it.only('The token and email should be available for activation', function(done) {
        let activationLink = '/api/activate/?email=' + user.email + '&token=' + user.email_token
        console.log(activationLink)
        api.get(activationLink).expect(200, function() {
            done()
        })
    })


    it('Should accept a valid password', function(done) {

    })
})
