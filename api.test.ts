//TODO Authorisation header
import * as  chai from 'chai'
import * as CONFIG from './core/CONFIG'
import * as io from 'socket.io-client'

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

class TestRunner {
    socket = null
    db = null
    users = null
    authorizedUser = null
    token = ''
    static URL = { socket: 'http://localhost:5000' }
    static USER_DATA = {
        email: 'user@user.com',
        password: '999'
    }

    socketAuth(done) {
        let socket = this.socket = io(TestRunner.URL.socket)
        this.socket.emit('authenticate', { token: this.token })
            .on('authenticated', (socket) => {
                done()
            })

        this.socket.on("unauthorized", function(error, callback) {
            if (error) throw error
        });
    }

    async login(done) {

        MongoClient.connect(DB_URL, (err, result) => {
            this.db = result;
            this.users = this.db.collection('users')
            this.users.deleteMany({})
        });

        try {
            await new Promise(resolve => {
                api.post('/api/register').send({ user_email: TestRunner.USER_DATA.email, user_password: TestRunner.USER_DATA.password }).expect(200, (error, result) => {
                    if (error)
                        throw error
                    if (!result)
                        throw 'Register failed'
                    return resolve(result)
                })
            })

            this.authorizedUser = await new Promise(resolve => {
                this.users.findOne({ email: TestRunner.USER_DATA.email }, (err, result) => {
                    this.authorizedUser = result;
                    // activate the account
                    return resolve(result)
                })
            })

            let activationLink = '/api/activate/?email=' + this.authorizedUser.email + '&token=' + this.authorizedUser.email_token;

            await new Promise(resolve => {
                api.get(activationLink).expect(200, (error, res) => {
                    assert.equal(res.body.data.email_token, null, 'why the toekn still in db!!');
                    assert.equal(res.body.data.email_expires, 0, 'Should expire expire');
                    resolve(true)
                })
            })

            this.token = await new Promise(resolve => {
                api.post('/api/login').send({ username: TestRunner.USER_DATA.email, password: TestRunner.USER_DATA.password }).expect(200, (err, result) => {
                    assert(result.body.data.token, 'jwt token not available');
                    assert(result.body.data.uid, 'uid not available');
                    return resolve(result.body.data.token)
                })
            })
            done()
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    /**
    * Clear all klips
    */
    clearKlips(done):void {
        let klips = this.db.collection('klips');
        klips.deleteMany({}, error => assert(!error))
        done()
    }
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
    let _users = {}
    let _user = {}
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

    it('Should return unauthorize status with invalid login', function(done) {
        api.post('/api/login').send({ username: 'invalid', password: 'invalid' }).expect(401, done)
    })

    it('should login with registered user data', function(done) {
        api.post('/api/login').send({ username: USER_DATA.email, password: USER_DATA.password }).expect(200, function(err, result) {
            assert(result.body.data.token, 'jwt token not available')
            assert(result.body.data.uid, 'uid not available')
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

describe.only('Klips CRUD', function() {

    let testRunner = new TestRunner()

    before('Authenticate', function(done) {
        testRunner.login(done)
    })

    before('connect to socket', function(done) {
        testRunner.socketAuth(done)
    })

    //Remove all data in the collection for integrity
    describe('Delete klips', function() {
        before('clear klips', function(done) {
            testRunner.clearKlips(done)
        })

        it('Create a new record with valid jwt', function(done) {
            let klips = testRunner.db.collection('klips');

            klips.deleteMany({}, error => assert(!error))
            done()
        })

        it('should receive an emit from socket', function(done) {
            done()
        })

        it('Create a new record with invalide jwt', function(done) {
            done()
        })
    })


    describe('Read', function() {
        it('Read 10 records')
        it('10')
    })

    describe('Update', function() {
        it('Should update a record with provided id')
        it('Should fail to update with an nonexisting id')
        it('Should fail to update with empty content')

    })

    after(function(done) {
        // disconnect io clients after each test
        // io.disconnect()
        done()
    })

})

describe('tidy up', function() {
    it('Should close db connection', function(done) {
        db.close()
        done()
    })
})
