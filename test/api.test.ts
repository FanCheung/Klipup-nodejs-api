//TODO Authorisation header
import * as  chai from 'chai'
import * as CONFIG from '../core/CONFIG'
import * as io from 'socket.io-client'
import { TestRunner } from './TestRunner'

// import * as ioClient from
let supertest = require('supertest')
let api = supertest('http://localhost:5000');
// let chai = require('chai')
let should = chai.should()
let assert = chai.assert
let expect = chai.expect
var MongoClient = require('mongodb').MongoClient
var siteUrl = 'http://localhost:8080'
const DB_URL = 'mongodb://localhost:27017/klipup'
let TEST_DATA = { socket: null, db: null, users: null, _user: {}, token: '' }
let db = null
let _users = {}
// let _user = {}
let _token = ''

const USER_DATA = {
    email: 'user@user.com',
    password: '999'
}

function connectDb(DB_URL = 'mongodb://localhost:27017/klipup') {
    return new Promise(function(resolve, reject) {
        MongoClient.connect(DB_URL, function(err, db) {
            return resolve(db)
            // db.close()
        })
    })
}


describe('Db tests', function() {



    it('should not return error object', function(done) {
        MongoClient.connect('mongodb://localhost:27017/klipup', function(err, db) {
            console.log('-----------',err)
            expect(err).to.equal(null)
            db.close()
            done()
        })
    })
})

describe('Registration', function() {
    let db = null
    let _users:any = {}
    let _user:any = {}
    before(function(done) {
        MongoClient.connect(DB_URL, function(err, result) {
            //make db availabel for use avoid multiple connection call back
            db = result
            _users = db.collection('users');
            // remove all users
            _users.deleteMany({})
            return done()
        })
    })

    it('Should register a new user and create a user record in db',
        function(done) {
            api.post('/api/register').send({ user_email: USER_DATA.email, user_password: USER_DATA.password }).expect(200, function(error, result) {
                // should return user object
                assert.equal(result.body.data.userEmail, USER_DATA.email)
                if (!error)
                    done()
            })
        })

    it('User should be found in db now', function(done) {
        _users.findOne({ email: USER_DATA.email }, (err, result) => {
            _user = result
            done()
        })
    })

    it('Should reject the invalid token', function(done) {
        let activationLink = '/api/activate/?email=' + _user.email + '&token=' + '888'
        api.get(activationLink).expect(500, function(error, res) {
            assert(res.body.error)
            assert(res.error instanceof Error)
            done()
        })

    })

    // how to make this dynamic guess we have to segmentie the tests
    it('The token and email should be good for activation', function(done) {
        let activationLink = '/api/activate/?email=' + _user.email + '&token=' + _user.email_token
        api.get(activationLink).expect(200, function(error, res) {
            assert.equal(res.body.data.email_token, null, 'why the toekn still in db!!')
            assert.equal(res.body.data.email_expires, 0, 'Should expire expire')
            done()
        })
    })
})

describe('Login', function() {

    let token = ''
    it('Should return unauthorize status with invalid login', function(done) {
        api.post('/api/login').send({ username: 'invalid', password: 'invalid' }).expect(401, done)
    })

    it('should login with registered user data', function(done) {
        api.post('/api/login').send({ username: USER_DATA.email, password: USER_DATA.password }).expect(200, function(err, result) {
            assert(result.body.data.token, 'jwt token not available')
            assert(result.body.data.uid, 'uid not available')
            token = result.body.data.token
            done()
        })
    })

    it('login again with same data should get identical token, so multiple device login can share the same stateless credential', function(done) {
        api.post('/api/login').send({ username: USER_DATA.email, password: USER_DATA.password }).expect(200, function(err, result) {
            assert.equal(result.body.data.token, token)
            done()
        })
    })
})

describe('Forgot  and reset password', function() {
    it('Should send an email', function() {

    })

    it('The reset link with supplied password should change user password', function() {

    })
})

/**
* [describe description]
*/

describe('Klips CRUD', function() {

    let testRunner = new TestRunner()
    before('Authenticate', function(done) {
        testRunner.login(done)
    })

    before('connect to socket', function(done) {
        testRunner.socketAuth().then((socket) => {
            // testRunner.socket.on('klipAdded', (data) => {
            //     console.log('klipadddfasdfasf')
            // })
            done()
        })
    })

    //Remove all data in the collection for integrity
    before('Clear klips', function(done) {
        testRunner.clearKlips(done)
    })

    describe('Check db is empty', function() {

        it('Should not find any klips', function(done) {
            let klips = testRunner.db.collection('klips');
            klips.find({}).toArray((err, results) => {
                //record set length equal to zero
                assert.equal(results.length, 0)
                done()
            })
        })
    })

    describe('Add a klip ', function() {

        it('Should add klip with emit a socket even with returned klip data', function(done) {
            // this is a round trip teset only pass if it arrive at socket
            testRunner.socket.on('klipAdded', (data) => {
                assert.equal(TestRunner.KLIP_DATA.content, data.content)
                assert.equal(TestRunner.KLIP_DATA.title, data.title)
                // assert.equal(TestRunner.authorizedUser._id)
                done()
                testRunner.socket.disconnect()
            })
            //post new klip and server will emit socket event
            api.put(`/api/user/${testRunner.authorizedUser._id}/klip`).send(TestRunner.KLIP_DATA)
                .set('Authorization', 'Bearer ' + testRunner.token)
                .expect(200, function() {
                })
        })

        it('Should reject klip with missing of empty content', function(done) {

            api.put(`/api/user/${testRunner.authorizedUser._id}/klip`).send({ title: 'test title', content: '' })
                .set('Authorization', 'Bearer ' + testRunner.token)
                .expect(500, function() {
                    done()
                })
        })

    })

    describe('Remove', function() {

        it('Should delete klip', function(done) {
            let kid = ''

            new Promise(resolve => {
                api.put(`/api/user/${testRunner.authorizedUser._id}/klip`).send(TestRunner.KLIP_DATA)
                    .set('Authorization', 'Bearer ' + testRunner.token)
                    .expect(200, function(err, res) {
                        resolve(res.body.data._id)
                    })

            }).then((kid) => {
                api.delete(`/api/user/${testRunner.authorizedUser._id}/klip/${kid}`).send()
                    .set('Authorization', 'Bearer ' + testRunner.token)
                    .expect(200, function(err, res) {
                        assert.equal(res.body.data._id, kid)
                        done()
                    })
            })
        })
    })

    after(function(done) {
        // disconnect io clients after each test
        // io.disconnect()
        done()
    })

})

describe('User Profile', function() {

    let testRunner = new TestRunner()
    before('Authenticate', function(done) {
        testRunner.login(done)
    })

    it('Get user profile', function(done) {
        api.get(`/api/user/${testRunner.authorizedUser._id}/profile`)
            .set('Authorization', 'Bearer ' + testRunner.token)
            .expect(200, function(err, res) {
                assert(!err)
                assert.equal(res.body.data.email, testRunner.authorizedUser.email)
                done()
            })
    })

    it('Update some fields', function(done) {
        let newEmail = 'new@new.com',
            newDisplayName = 'new display name',
            newGender = 'male'

        api.post(`/api/user/${testRunner.authorizedUser._id}/profile`).send({ email: newEmail, display_name: newDisplayName, gender: newGender })
            .set('Authorization', 'Bearer ' + testRunner.token)
            .expect(200, function(err, res) {
                assert.equal(res.body.data.email, newEmail)
                assert.equal(res.body.data.display_name, newDisplayName)
                assert.equal(res.body.data.gender, newGender)
                done()
            })
    })

})

describe('tidy up', function() {
    it('Should close db connection', function(done) {
        done()
    })
})
