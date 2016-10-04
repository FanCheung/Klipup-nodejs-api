/**
 * Authenticatio class to plugin to route
 */
import * as passport from 'passport'
import * as FacebookStrategy from 'passport-facebook'
var jwt = require("jsonwebtoken")
import { CONFIG } from '../core/Main'
import * as UserModel from '../model/UserModel'
import AuthModel from '../model/AuthModel'
import * as Promise from 'bluebird'
import JsonRes from '../core/JsonRes'
import * as LocalStrategy from 'passport-local'
import * as mongoose from 'mongoose'

class AuthRoute {
    constructor() {
        //TODO:90 move facebook strategy to AuthModel
        this.setUpStrategy()
    }
    /**
     * [setUpStrategy description]
     * @return {[type]} [description]
     */
    public setUpStrategy() {
        passport.use(AuthModel.getFacebookStrategy())
        //TODO: passport localStrategy is kinda no use, enforce the user of username and password on req
        passport.use(AuthModel.getLocalStrategy())
    }

    /**
     * Login endpoint
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @return {Promise}        [description]
     */
    public login(req, res, next) {

        //response coming from passport strategy
        passport.authenticate('local', { session: false }, function(err, user, info) {
            //TODO check if activation code is still there
            if (!user)
                return new JsonRes(res).fail({ message: 'Username or password no match' }, 401)
            //Temporary disable it

            //TODO consider adding a status field to be more precise
            // account is not activated
            // if (user.email_token || user.email_expires != 0)
            //     return new JsonRes(res).fail({ message: 'Account not activated' }, 401)

            let userObj = {
                uid: user.id,
                email: user.email,
                firends: user.friends,
                join_date: user.join_date,
                token: user.token,
            }
            //TODO add a last_login to db
            return new JsonRes(res).success(userObj)
        })(req, res, next);
    }

    /**
     * [register description]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    public register(req, res, next) {
        // Consider some mapping, variable name may just change
        AuthModel.register(req.body.user_email, req.body.user_password).then((data) => {
            new JsonRes(res).success({ userEmail: data.userEmail, message: 'successfully create account and sent email' })
        }).catch((e) => {
            new JsonRes(res).fail({ message: e.message })
        })
    }

    //TODO: need major refactoring
    //middleware
    public authenticateToken(req, res, next) {
        new Promise((resolve, reject) => {
            AuthModel.extractToken(req).then((token) => {
                return jwt.verify(token, CONFIG.AUTH.SECRET_KEY, function(err, payload) {
                    if (err)
                        return reject(new Error(err))
                    //if current user is equal id extracted
                    // usr._id is type ObjectId
                    let user = AuthModel.getCurrentUser()
                    if (user && user._id.toString() == payload.sub) {
                        return next()
                    }
                    return AuthModel.setCurrentUser(payload.sub)
                })
            })
        }).then(result => {
// pass down the route all good
            next()
        }).catch((e) => {
            res.json({ fail: true })
            next(e)
        }).finally(() => {
            next()
        })
    }
    /**
     * [forgotPassword description]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    public forgotPassword(req, res, next) {
        AuthModel.forgotPassword(req.body.email).then((result) => {
            return new JsonRes(res).success({ success: 'true' })
        }).catch((e) => {
            return new JsonRes(res).fail({ message: e.message })
        })
    }

    /**
     * Reset password enpoint, expect email and token in query * * string
     * @return {[type]}        [description]
     */
    public resetPassword(req, res, next) {

        let {newPassword, email, email_token} = req.body
        //process with authmodel method
        AuthModel.resetPassword(email, email_token, newPassword)
            .then((result) => {
                return new JsonRes(res).success({ success: 'true' })
            }).catch((e) => {
                return new JsonRes(res).fail({ message: e.message })
            })
    }

    /**
     * Create Account after social login ask to input password
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    public createAccount(req, res, next) {
        AuthModel.extractToken(req).then((token) => {
            return token
        }).then((token) => {
            return AuthModel.createAccount(req.body.user_password, token)
        }).then((user) => {
            return new JsonRes(res).success({
                uid: user._id,
                display_name: user.display_name,
                email: user.email,
                thumb: user.thumb,
                message: 'hello'
            })
        }).catch((e) => {
            return new JsonRes(res).fail({ message: e.message })
        })
    }

    public authenticateAcl(req, res, next) {
        //TODO verfiy with token maybe
        if (req.params.uid && req.params.uid === AuthModel.getCurrentUser()._id.toString()) {
            next()
        }
        else
            next(new Error('not powerful enough'))
    }

    public activate(req, res, next) {
        let {email, token} = req.query
        AuthModel.activate(email, token).then((user) => {
            //TODO: Consider auto login
            return new JsonRes(res).success(user)
        }).catch((e) => {
            return new JsonRes(res).fail({ message: e.message })
        })
    }

    /**
     * [logOut description]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    public logOut(req, res, next) {
        // expect user id
        // delete token
    }
}
export default new AuthRoute()
