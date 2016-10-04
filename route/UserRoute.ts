import * as UserModel from '../model/UserModel'
import JsonRes from '../core/JsonRes'
import { KlipModel } from '../model/KlipModel'
import AuthModel from '../model/AuthModel'
import SocketServer from '../core/SocketServer'
import { event } from '../core/Event'
import * as passport from 'passport'

export default class UserRoute {
    constructor() {
    }

    /**
     * Native mongoose findOne method
     * @returns {void}
     */
    static async getProfile(req, res, next) {
        try {
            let response = await UserModel.getProfile(req.params.uid)
            return new JsonRes(res).success(response)
        } catch (e) {
            return next(e)
        }
    }

    /**
     * [updateProfile description]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    static async updateProfile(req, res, next) {

        let profile = req.body,
         uid = req.params.uid

        UserModel.updateProfile(uid, profile).then(response => {
            return new JsonRes(res).success(response)
        }).catch(e => next(e))
    }

    /**
     * [verifyEmail description]
     * @param  {[type]}   res  [description]
     * @param  {[type]}   req  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    static verifyEmail(res, req, next) {
        if (req.query.token) {
        }
    }

    static resendEmailVerification() {
    }

    static removeUser(req, res, next) {
        UserModel.deleteOne(req.params.uid).then((response) => {
            new JsonRes(res).success(response)
            next()
        }).catch((error) => {
            res.json({ success: false })
        })
    }

    static getKlips(req, res, next) {

        KlipModel.find({ uid: req.params.uid }).sort({ last_modified: -1 }).then((response) => {
             return new JsonRes(res).success(response)
        }).catch(e=>next(e))
    }

    /**
     * Expect
     * @param req
     * @param res
     * @param next
     */
    static addKlip(req, res, next) {
        // record passed json header it gets auto parsed
        let uid = req.params.uid
        let record = req.body

        if (!req.body.content.trim())
            return next('missing content')

        UserModel.addKlip(record, uid).then(result => {
            //scoket fire
            event.emit('klipAdded', result)
            return new JsonRes(res).success(result)
        }
        ).catch(e => next(e))

    }

    static deleteKlip(req, res, next) {
        let kid = req.params.kid
        let uid = req.params.uid

        UserModel.deleteKlip(uid, kid).then(result => {
            return new JsonRes(res).success(result)
        }).catch(e => next(e))

    }

    static updateUser(req, res, next) {

    }

    static getAll(req, res, next) {

    }

    static addUser(req, res, next) {
        let param = req.body
        // new UserModel(req.body).addOne().then((response)=> {
        //     new JsonRes(res).success( response)
        // }).catch((e)=> {
        //    new JsonRes(res).fail( e)
        // })
        next()
    }
}
