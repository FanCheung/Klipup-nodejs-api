import * as express from "express"
import AuthRoute from './AuthRoute'
import UserRoute from './UserRoute'
import * as passport from 'passport'
import KlipRoute from './klipRoute'
import AuthModel from '../model/AuthModel'
import JsonRes from '../core/JsonRes'
import * as Rx from 'rxjs'

let UserModel = require('../model/UserModel')
const Event = require('events')

module Route {
    export function init() {
        let router = express.Router()
        //Users
        router.get('/user/:uid', AuthRoute.authenticateToken, UserRoute.getProfile)
        router.delete('/user/delete/:uid', UserRoute.removeUser)

        router.get('/api/users/:page', UserRoute.getAll)
        router.put('/api/user/update/:uid', UserRoute.updateUser)
        router.post('/api/user/add', UserRoute.addUser)
        router.put('/api/user/:uid/klip', AuthRoute.authenticateToken, AuthRoute.authenticateAcl, UserRoute.addKlip)
        router.delete('/api/user/:uid/klip/:kid', AuthRoute.authenticateToken, AuthRoute.authenticateAcl, UserRoute.deleteKlip)

        router.get('/api/user/:uid/klips/', AuthRoute.authenticateToken, AuthRoute.authenticateAcl, UserRoute.getKlips)

        router.get('/api/user/:uid/profile/', AuthRoute.authenticateToken, UserRoute.getProfile)
        router.post('/api/user/:uid/profile/', AuthRoute.authenticateToken, UserRoute.updateProfile)

        router.post('/api/login', AuthRoute.login)
        router.post('/api/register',AuthRoute.register) 

        router.post('/api/reset-password/', AuthRoute.resetPassword)
        router.post('/api/forgot-password', AuthRoute.forgotPassword)
        router.post('/api/create-account', AuthRoute.createAccount)
        router.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }))
        // router.post('/auth/get-token/', AuthRoute.issueToken)

        router.get('/api/activate', AuthRoute.activate)
        router.get('/api/auth/get-user/', function(res, req, next) {
            next()
        })

        router.get('/api/auth/facebook/callback', passport.authenticate('facebook', {
            failureRedirect: '/login',
            session: false
        }), function(req, res, next) {
            // going to the frontend page and issue the token
            //should go to setup password page
            let user = req.user
            res.redirect('http://localhost:8080/auth/?token=' + user.token + '&uid=' + user._id)
        })
        return router
    }

    export function useSocketRoute(socket) {

    }
}
export =Route
