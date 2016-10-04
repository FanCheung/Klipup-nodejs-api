import { JsonRes } from '../core/Util'
import AuthModel from './AuthModel'
import { KlipModel } from './KlipModel'
import { event } from '../core/Event'

/*k
 * Singleton user model
 * will add another class implementation approach
 */
var mongoose = require('mongoose')
import * as Promise from 'bluebird'

//set up schema
let _schema = new mongoose.Schema({
    user_name: String,
    display_name: { type: String },
    password: String,
    email: { type: String, unique: true, require: true },
    first_name: String,
    last_name: String,
    social_type: String, // google, faceboko etc
    social_account: String, // social profile json
    last_login: Date,
    join_date: { type: Date, default: Date.now },
    token: String,
    thumb: String,
    ip: String,
    gender: String,
    email_token: String,
    email_expires: Number,
    mixed: mongoose.Schema.Types.Mixed,
    friends: [mongoose.Schema.Types.ObjectId],
    last_modified: { type: Date, default: Date.now },
})

let _modelName = 'UserModel'

let _pageSize = 10


/**
 * Setup static method
 */
_schema.statics = {
    getMany: getMany,
    deleteOne: deleteOne,
    updateOne: updateOne,
    findOrCreate: findOrCreate,
    addKlip: addKlip,
    deleteKlip: deleteKlip,
    getProfile: getProfile,
    updateProfile: updateProfile,

}

/**
 * Setup instance method
 */
_schema.methods = {
    addOne: addOne,
}

let UserModel = mongoose.model(_modelName, _schema, 'users')

async function updateProfile(uid = null, fields = null) {
    if (!uid || !Object.keys(fields))
        return Promise.reject('uid or fields not found')

    return new Promise((resolve, reject) => {
        UserModel.findOne({ _id: uid }).then(record => {
            if (!record) return reject('User not found')

            // assigning value
            // TODO: santize and validation
            record.display_name = fields.display_name || record.display_name
            record.email = fields.email || record.email

            // make sure there's password
            // TODO: need to reset and resend token
            if (fields.password && fields.password.length)
                record.password = fields.password
            record.gender = fields.gender || record.gender

            return record.save()
        }).then(record => {
            return resolve(record)
        })
    })
}

function deleteKlip(uid = null, kid = null): Promise<any> {

    if (!(uid && kid))
        return Promise.reject('uid not kid not found')

    return new Promise((resolve, reject) => {
        KlipModel.findOne({ _id: kid }).then((result) => {
            return result.remove()
        }).then(data => {
            if (data._id.toString() === kid)
                return resolve(data)
            else return reject('some error')
        })
    })
}

/**
 * [addKlip description]
 * @param  {[type]}       record=null [description]
 * @param  {[type]}       uid=null    [description]
 * @return {Promise<any>}             [description]
 */
function addKlip(record = null, uid = null): Promise<any> {

    if (!record)
        return Promise.reject('Record not found')

    return new Promise((resolve, reject) => {
        KlipModel.addOne({ uid: uid, content: record.content, title: record.title }).then((result) => {
            if (!result) return reject('No record found')
            // TODO: maybe move that to the route level
            return resolve(result)
        })
    })

}

function getProfile(uid = null) {
    if (!uid) return Promise.reject('Uid is not defined')
    return UserModel.findOne({ _id: uid }).then(result => {
        if (!result) return Promise.reject('user not found')
        let user = result

// remove sensitive user information
         user.password=undefined
         user.email_token=undefined
         user.token=undefined
console.log(user)
        return user
    })
}

/**
 * add a single record
 */
function addOne() {
    return this.save()
    //  return this.model(_modelName).save()
}

function findOrCreate(query, json) {
    return this.findOne({ query }).then((result) => {
        if (!result) {
        }
    })
}

function deleteOne(uid) {
    //should introduce three step updastes
    return this.findOne({ _id: uid }).then((user) => {

    })
}

function getMany(query, page) {
    return this.find(query).skip(page).limit(page * _pageSize - 1
    )
}

function updateOne(uid) {
    /*
     this.find({_id:uid}).then(function(user){
     if(user._id) {
     return user.save()
     }
     }).catch(function(error){
     })
     */
    //one step return promise
    return this.update(
        { _id: uid },
        { $set: { last_modified: Date.now() } }
    )
}

export = UserModel
