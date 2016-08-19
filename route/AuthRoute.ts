
/**

 * Authenticatio class to plugin to route
 */
import * as passport from 'passport'
import * as FacebookStrategy from 'passport-facebook'
var jwt = require("jsonwebtoken")
import * as CONFIG from '../core/CONFIG'
import * as UserModel from '../model/UserModel'
import AuthModel from '../model/AuthModel'
import * as Promise from 'bluebird'
import JsonRes from '../core/JsonRes'
import * as LocalStrategy from 'passport-local'
/**
 *
 */
class AuthRoute {
    constructor() {
        this._useFacebook()
        passport.use(AuthModel.getLocalStrategy())
    }
    /**
 * Passport facebook strategy
 * @return {[type]} [description]
 */
    private _useFacebook() {
        // TODO move to auth model
        let Strategy = FacebookStrategy.Strategy
        passport.use(new Strategy(CONFIG.AUTH.FACEBOOK
            , (accessToken, refreshToken, profile, done) => {
                let json = profile._json
                let socialAccount = ''
                try {
                    socialAccount = JSON.stringify(profile._json)
                } catch (e) {
                    throw new Error('Parsing error')
                }

                // create an user account if not exist
                UserModel.findOne({
                    'email': json.email
                }).then((result) => {
                    //if no user found create a new user
                    if (!result) {
                        let token = AuthModel.issueToken(profile)
                        new UserModel({
                            'display_name': json.name,
                            'email': json.email,
                            'social_account': socialAccount,
                            'thumb': json.picture.data.url,
                            'locale': json.locale
                        }).addOne().then((result) => {
                            // TODO move to Auth model
                            let token = AuthModel.issueToken({ sub: result._id })
                            this.saveToken(result, token)
                        }).catch((error) => {
                            console.log('error :', error)
                        })
                        return done(null, profile)
                        // when there are existing user
                    } else {
                        // TODO move to Auth model
                        let token = AuthModel.issueToken({ sub: result._id })
                        this.saveToken(result, token)
                        return done(null, result)
                    }


                }).catch((error) => {
                    console.log(error)
                    done(error, profile)
                })
            })
        )
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
            if (!user)
              return new JsonRes(res).fail({ message: 'username or password no match' }, 401)

            return new JsonRes(res).success({ uid: user._id, token: user.token })
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
            new JsonRes(res).success({ message: 'successfully create account and sent email' })
        }).catch((e) => {
            new JsonRes(res).fail({ message: e.message })
        })
    }

    /**
     * Save Token to db for a found user
     * @param result:mongoose model
     * @param token
     */
    public saveToken(result, token: String) {
        result.token = token
        result.save()
    }

    //middleware
    public authenticateToken(req, res, next) {
        new Promise((resolve, reject) => {
            AuthModel.extractToken(req).then((token) => {
                return jwt.verify(token, CONFIG.AUTH.SECRET_KEY, function(err, payload) {
                    if (err) {
                        // return Promise.reject(new Error(err))
                        return reject(new Error(err))
                    } else
                        AuthModel.setCurrentUser(payload.sub).then((result) => {
                            next()
                        })
                })
            })

        }).then((error) => console.log('assed?')).catch((e) => {
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
        console.log(req.body)

        //process with authmodel method
        AuthModel.resetPassword(email, email_token, newPassword)
            .then((result) => {
                return new JsonRes(res).success({ success: 'true' })
            }).catch((e) => {
                return new JsonRes(res).fail({ message: e.message })
            })
    }

    public createPassword(req, res, next) { }

    public authenticateAcl(req, res, next) {
        if (req.params.uid && req.params.uid == AuthModel.getCurrentUser())
            next()
        else
            next(new Error('not powerful enough'))
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
