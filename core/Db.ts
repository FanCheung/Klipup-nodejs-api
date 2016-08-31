/**
 * Core db class handles connection, schema assignment
 */
import * as mongoose from 'mongoose'
var assert = require('assert')
export default class Db {
    private db
    private dbUrl:String

    constructor() {
        //Document for clipboard content
        let _klipSchema = {
            type: String,
            last_modified: {type: Date, default: Date.now},
            content: mongoose.Schema.Types.Mixed,
            created_date: Date,
            tags: [String],
            user_id: mongoose.Schema.Types.ObjectId
        }
    }

    //Various event listener
    public on(event) {
        return new Promise(function (resolve, reject) {

        })
    }

    public connect() {
        return new Promise((resolve, reject) => {
            let db = mongoose.connection
            mongoose.connect('mongodb://localhost:27017/klipup');
            db.once('open', ()=> {
                // User.find({}).then(function (err, data) {
                //     console.log( 'callback'+err)
                //     })
                resolve(db)
                // we're connected!
            })
            db.on('error', function () {
                reject('Connection Error')
            })

            //TODO:80 just console log this for now need attach it to the class
            db.on('connected', function () {
                console.log('Mongoose connected to ');
            });
            db.on('error', function (err) {
                console.log('Mongoose connection error: ' + err);
            });
            db.on('disconnected', function () {
                console.log('Mongoose disconnected');
            });

            process.on('SIGINT', function () {
                mongoose.connection.close(function () {
                    console.log('Mongoose disconnected through app termination');
                    process.exit(0);
                });
            });
        })
    }

    /**
     *  Setup all the schema
     */
    private setUpModal() {
    }

    /**
     * Return mongoose schema
     */
    public getSchema() {

    }
}
