import * as  chai from 'chai'
let should = chai.should()
let supertest = require('supertest')
let api = supertest('http://localhost:5000');
let assert = chai.assert
let expect = chai.expect
var MongoClient = require('mongodb').MongoClient


describe('Db tests', () => {
    it('should not return error object', (done) => {
        MongoClient.connect('mongodb://localhost:27017/klipup', function(err, db) {
            assert.equal(err, null)
            db.close()
            done()
        })
    })
})

describe('Auth api', function() {
    it('Should return unauthorize sta  tus w i th i nv alid login', (done) => {
        api.post('/api/login').send({ username: '', password: '' }).expect(401, done)
    })

    it('should return error message w  hen p a sswo rd  incorrrect ', (done) => {
        api.post('/api/login').send({ dkadf: 'akdf' }).expect(401, done)
    })

    it('should return error message when username incorrrect', (done) => {
        api.post('/api/login').send({ dkadf: 'akdf' }).expect(401, done)
    })
})
