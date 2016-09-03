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

const USER_DATA={
email:'user@user.com',
password:'9999999'
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




    it.only('Should register a new user and create a user record in db', function(done) {
        api.post('/api/register').send({ user_email: USER_DATA.email, user_password: USER_DATA.password }).expect(200, function(error, result) {
            // should return user object
            assert.equal(result.body.data.userEmail, USER_DATA.email)
            if (!error)
                done()
        })
    })

    it.only('User should be found in db now', function(done) {
        users.findOne({ email: USER_DATA.email }, (err, result) => {
            user = result
            done()
        })
    })

    it.only('Should reject the invalid token', function(done) {
        let activationLink = '/api/activate/?email=' + user.email + '&token=' + '888'
        api.get(activationLink).expect(500, function(error, res) {
            assert(res.body.error)
            assert(res.error instanceof Error)
            done()
        })

    })


    it.only('The token and email should be available for activation', function(done) {
        let activationLink = '/api/activate/?email=' + user.email + '&token=' + user.email_token
        api.get(activationLink).expect(200, function() {
            done()
        })
    })


    it('Should close db connection', function(done) {
        db.close()
        done()
    })
})

describe('Login', function() {

  it.only('Should return unauthorize status with invalid login', function(done) {
        api.post('/api/login').send({ username: '', password: '' }).expect(401, done)
    })

    it.only('should login with registered user data', function(done) {
        api.post('/api/login').send({ username: USER_DATA.email, password: USER_DATA.password }).expect(200, done)
    })
})

describe('Forgot  and reset password', function() {

    it('Should send an email', function() {

    })

    it('The reset link with supplied password should change user password')

})
