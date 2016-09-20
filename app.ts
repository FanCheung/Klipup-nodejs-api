// TODO:30 Node inspector
// TODO:40 Reuse Token
// TODO:10 Construct email  to send for auth print the reset link
// TODO:0 Check socket io with different identity
// TODO:50 Weibo login
// TODO:60 Yeild
// TODO:130 move to github
import * as passport from 'passport'
import * as path from 'path';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser'
import * as Route from './route/Route'
import * as Express from 'express'
import * as mongoose from 'mongoose'
import Db from './core/Db'
import SocketServer from './core/SocketServer'
import * as Promise from 'bluebird'
import {Mail} from './core/Mail'
import * as _ from 'lodash'

global.Promise = Promise
var chalk = require('chalk')

global.log = function(text='',color='white')  {
 console.log(chalk['yellow'](text))
}
/**
 * App
 */
class App {
    app
    passport
    route
    db
    server
    constructor() {
        //plugin bluebird promise for mongoose
        mongoose.Promise = Promise
        var app = Express()
        this.server = require('http').Server(app);

        app.set('view engine', 'jade')
        app.set('views', __dirname + '/view')
        app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE')
            if (req.method === 'OPTIONS') {
                console.log('options')
                return res.send(200)
            }
            next();
        });
        app.use(logger('dev'))
        app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded

        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({ extended: false }))

        app.use(cookieParser());
        // allow cross origin requrest

        app.use(passport.initialize())
        app.use(passport.session())
        console.log(path.join(__dirname, '/../react'))
        app.use(Express.static(path.join(__dirname, '/../react')))
        app.use(Route.init())


        let env = process.env.NODE_ENV || 'development';

        // development only
        // if (env === 'development') {
            //Error catching
            app.use((error: any, req, res, next) => {
                res.status(error['status'] || 500);
                next(error)
            })
        // }

        // production only
        if (env === 'production') {
            // TODO
        }
        // Error catching
        this.app = app

        this.db = new Db()
        //start database connection pool before starting app
        this.db.connect().then((data) => {
            this.start()
        }).catch(function(data) {
            console.error.bind(console, 'connection error:')
        })

    }

    setupMiddleWare() {

    }

    /**
     * [boostrap description]
     * @return {[type]} [description]
     */
    static boostrap() {
        return new App()
    }

    public config() {
    }
    /**
     * [start description]
     * @return {[type]} [description]
     */
    public start() {
        new SocketServer(this.server)
        this.server.listen(5000, (req, res) => {
            console.log(' i am listening')
        })
    }
}

var app = App.boostrap()
