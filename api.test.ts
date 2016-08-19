import * as  chai from 'chai'
let supertest = require('supertest')
let api = supertest('http://localhost:5000');

let should = chai.should()
let assert = chai.assert
let expect = chai.expect
var MongoClient = require('mongodb').MongoClient


describe('Db tests', () => {
    it('should not return error object', (done) => {
        MongoClient.connect('mongodb://localhost:27017/klipup', function(err, db) {
            expect(err).to.equal(null)
            db.close()
            done()
        })
    })
})

describe('Auth api', function() {
    it('Should return unauthorize sta  tus w i th i nv alid login', (done) => {
        api.post('/api/login').send({ username: '', password: '' }).expect(401, done)
    })

    it('Should register a new user', (done) => {
        api.post('/api/register').send({ user_email: 'test@test.com', user_password: 'hello' }).expect(200, done)
    })

    it('Should have a Authorisation header', (done) => {

    })
    it('Should accept a valid password', (done) => {

    })
})
