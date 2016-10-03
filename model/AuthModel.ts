import * as jwt from 'jsonwebtoken'
import { CONFIG } from '../core/Main'
import * as UserModel from '../model/UserModel'
import * as LocalStrategy from 'passport-local'
import * as FacebookStrategy from 'passport-facebook'
import * as passport from 'passport'
import * as validator from 'validator'
import { Mail } from '../core/Mail'

/**
 * Handle all authentication related activities
 */
class AuthModel {
    private _currentUser = null
    private _expireIn = 720000

    constructor() {
    }

    /**
     * Issue token
     * @param user
     * @param expireTime
     * @returns {{token: void, secret: string, expiresInMinutes: number}}
     */
    public issueToken(user, expireIn = this._expireIn) {
        return jwt.sign(user, CONFIG.AUTH.SECRET_KEY, { expiresIn: expireIn })
    }

    /**
     * Passport facebook strategy
     * @return {[type]} [description]
     */
    public getFacebookStrategy() {
        // TODO:120 move to auth model
        return new FacebookStrategy.Strategy(CONFIG.AUTH.FACEBOOK, (accessToken, refreshToken, profile, done) => {
            let json = profile._json
            let socialAccount = ''
            try {
                socialAccount = JSON.stringify(profile._json)
            } catch (e) {
                throw new Error('Parsing error')
            }

            // create an user account if not exist
            return UserModel.findOne({
                'email': json.email
            }).then((result) => {
                //if no user found create a new user
                if (!result) {
                    new UserModel({
                        'display_name': json.name,
                        'email': json.email,
                        'social_account': socialAccount,
                        'thumb': json.picture.data.url,
                        'locale': json.locale
                    }).addOne().then((result) => {

                        let token = this.issueToken({ sub: result._id })
                        this.saveToken(result, token)
                    }).catch((error) => {

                        console.log('error :', error)
                    })
                    return done(null, profile)
                    // when there are existing user
                } else {

                    let token = this.issueToken({ sub: result._id })
                    this.saveToken(result, token)
                    return done(null, result)
                }

            }).catch((error) => {
                console.log(error)
                return done(error, profile)
            })
        })

    }

    /**
     * [getLocalStrategy description]
     * @return {Promise} [description]
     */
    public getLocalStrategy() {
        let Strategy = LocalStrategy.Strategy
        return new Strategy((email, password, done) => {
            new Promise((resolve, reject) => {
                //if no email or password reject
                if (!email || !password)
                    return reject('email or password')
                //search for user
                return resolve(UserModel.findOne({ 'email': email }))

            }).then((result: any) => {
                //see if we found user
                if (!result) {
                    return Promise.reject('User not Found')
                }
                return result

            }).then((result: any) => {

                //see if login success
                if (require('bcrypt').compareSync(password, result.password)) {

                    // if there's an existing token and valid
                    // TODO : verify this token with jwt
                    if (result.token) return Promise.resolve(result)

                    // else re issue the token
                    result.token = this.issueToken({ sub: result._id }, 3434000)
                    return Promise.resolve(result.save())
                }

                return Promise.reject('email or password doesnt match')

            }).then((user) => {
                // pass to passport.authenticate
                return done(null, user)

            }).catch((e) => {
                return done(new Error(e), null)
            })
        })
    }

    /**
     * [register description]
     * @return {Promise}        [description]
     */
    public register(email, password) {
        // Load the bcrypt module
        let hashedPassword = this.getPasswordHash(password)
        //TODO:160 validate password and email here
        if (!(hashedPassword && email))
            return Promise.reject(new Error('password or email no good'))
        return UserModel.findOne({ email: email }).then((user) => {
            if (user)
                return Promise.reject(new Error('User already exist'))
            return this.getEmailHash()
        }).then((token) => {
            let emailToken = token
            let emailExpires = Date.now() + 3600000
            //Move to user model
            //promise thennable
            return new UserModel({
                'email': email,
                'password': hashedPassword,
                'email_token': emailToken,
                'email_expires': emailExpires,
                'status': 'require_email_verify'
            }).addOne()
        }).then((data) => {
            // Send email here
            return this.sendMail('ACTIVATION', data.email, data.email_token)
        }).then((res) => {
            return res
        })
    }

    /**
     * [sendMail description]
     * @param  {[type]} type='activation' [description]
     * @param  {[type]} email             [description]
     * @param  {[type]} token=null        [description]
     * @return {Promise}                   [description]
     */
    public sendMail(type = 'ACTIVATION', email = null, token = null): Promise<any> {
        switch (type) {
            case 'ACTIVATION': {
                if (!(email && token))
                    return Promise.reject(new Error('send mail error'))
                //some mail funcition here
                let mail = new Mail({
                    email: email,
                    subject: 'Email activation',
                    html: 'Dear' + email + ',Please visit ' + CONFIG.ENV.URL + '/auth/activate/?email=' + email + '&token=' + token
                })

                mail.send()

                return Promise.resolve({ userEmail: email })
            }
            case 'REST_PASSWORD': {

                if (!(email && token))

                    //some mail funcition here
                    return Promise.reject(new Error('send mail error'))
                return Promise.resolve({ userEmail: email })
            }
        }
    }

    /**
     * Account activation operation
     */
    public activate(email, token) {

        return UserModel.findOne({ email: email, email_token: token }).then((result) => {
            // no result found
            if (!result)
                return Promise.reject(new Error('User not found or token incorrect'))
            // token expires prepare
            if (this.isExpired(result.email_expires))
                return Promise.reject(new Error('Activation token expires'))
            result.email_expires = 0
            result.email_token = null
            return result.save()
        }).then((user) => {
            return user
        })
    }

    /**
     * [reActivate description]
     * @param  {[type]} email [description]
     * @return {[type]}       [description]
     */
    public reActivate(email) {

        UserModel.findOne({ email: email }).then((result) => {
            // no result found
            if (!result)
                return Promise.reject(new Error('User not found'))
            // generate token here
            // token

            return result.save()
        }).then((user) => {
            return user
        })
    }

    /**
     * [createAccount description]
     * @param  {[type]} password [description]
     * @param  {[type]} token    [description]
     * @return {[type]}          [description]
       */
    public createAccount(password, token) {

        // TODO:150 see whether we should enforce user to have password
        //TODO:180 validate password weakness length etc
        if (!password) return Promise.reject(new Error('Password invalid'))
        if (!token) return Promise.reject(new Error('Missing Token'))

        return this.verifyToken(token).then((uid) => {
            return UserModel.findOne({ _id: uid })
        }).then((result) => {

            if (!result)
                return Promise.reject(new Error('User not found'))
            //password alrewady exist should reject
            if (result.password)
                return Promise.reject(new Error('Password already exist'))

            result.password = this.getPasswordHash(password)
            return result.save()
        }).then((user) => {
            return user
        })
    }
    /**
     * Send reset password email
     * @param  {[type]} email='' [description]
     * @return {[type]}          [description]
     */
    public forgotPassword(email = '') {
        //should type to mongoose
        let user = {}
        // return erorr immediately if email not valid format
        if (!validator.isEmail(email))
            return Promise.reject(new Error('Not valid email: #{email}'))

        return UserModel.findOne({ email: email }).then((result) => {
            // let's generate  token
            if (!result) Promise.reject(new Error('User not found'))
            user = result
            return this.getEmailHash()

        }).then((token) => {
            //Sendmail and ensure it is delivered before saving token
            user.email_expires = Date.now() + 3600000
            user.email_token = token
            return this.sendMail('RESET_PASSWORD',
                user.email, user.email_token)

        }).then((res) => {
            //save the token to user record
            return user.save()
        }).then((result) => {
            // resolve to router
            return Promise.resolve('email sent')
        })
    }

    /**
     * [resetPassword description]
     * @return {[type]} [description]
     */
    public resetPassword(email: string = null, emailToken = null, password: string = null) {

        // TODO:170 validate password lenght and strength
        if (!validator.isEmail(email))
            return Promise.reject(new Error('Not valid email'))
        if (!password)
            return Promise.reject(new Error('Passwor no good'))

        //check if email and token matches
        return UserModel.findOne({ email: email, email_token: emailToken }).then((result) => {
            //get user object
            if (!result) return Promise.reject(new Error('User not found'))
            //check if token expires consider make it function

            if (this.isExpired(result.email_expires)) {
                // remove the token
                result = this.clearResetToken(result)
                return result.save().then(() => {
                    return Promise.reject(new Error('token Expire'))
                })
            }
            // user is good to save
            return Promise.resolve(result)

        }).then((result) => {
            // finally saving new password
            result = this.clearResetToken(result)
            result.password = this.getPasswordHash(password)

            //!important remove the exsiting jwt
            result.token = null
            return result.save()
        }).then((result) => {

            // maybe send email
            return Promise.resolve('all good')
        })
    }
    public clearResetToken(obj = null) {
        if (!obj) return
        obj.email_token = null
        obj.email_expires = 0
        return obj

    }
    /**
     * Check if timestamp expires
     * @param  {number} timeStamp [description]
     * @return {[type]}           [description]
     */
    public isExpired(timeStamp: number) {
        return Date.now() > timeStamp
    }
    /**
     * Save Token to db for a found user
     * @param result:mongoose model
     * @param token
     */
    public saveToken(result, token: String) {
        result.token = token
        return result.save()
    }

    /**
     * Save the current user obecj to UserModel
     * @param  {String}       uid [description]
     * @return {Promise<any>}     [description]
     */
    public setCurrentUser(uid: String): Promise<any> {
        return UserModel.findOne({ _id: uid }).then((result) => {
            if (result) {
                this._currentUser = result
                console.warn('thiscurrent user', this._currentUser)
            }
            else
                Promise.reject(new Error('No User found'))
        })
    }

    /**
     * Email hash for password reset or activation
     * @return {Promise} [description]
     */
    public getEmailHash() {
        return new Promise((resolve, reject) => {
            require('crypto').randomBytes(20, function(err, buf) {
                resolve(buf.toString('hex'))
            })
        })
    }

    /** Generate password bcrypt hash
     * @return {[type]} [description]
     */
    public getPasswordHash(password: string = null) {
        if (!password) return false
        let bcrypt = require('bcrypt');
        // Hash the password with the salt
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    }

    /**
     * Save current user to userModel?
     * @return {[type]} [description]
     */
    public getCurrentUser() {
        if (this._currentUser)
            return this._currentUser
        else
            return false
    }

    /**
     * [verify description]
     * @param  {[type]} token [description]
     * @return {[type]}       [description]
     */
    public verifyToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, CONFIG.AUTH.SECRET_KEY, function(err, payload) {
                if (err) {
                    // return Promise.reject(new Error(err))
                    return reject(new Error(err))
                } else
                    // return userid
                    return resolve(payload.sub)
            })
        })
    }

    /**
       * Extract token from authorization header
       * @return {Promise} [description]
       */
    public extractToken(req): Promise<any> {
        return new Promise((resolve, reject) => {
            let bearerHeader = req.headers["authorization"]
            if (typeof bearerHeader !== 'undefined') {
                try {
                    let token = bearerHeader.split(" ")[1];
                    resolve(token)
                } catch (e) {
                    reject(new Error(e))
                }
            } else
                reject(new Error('Authorisation header not found'))
        })
    }
}

export default new AuthModel()
