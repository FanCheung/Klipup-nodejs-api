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
    static getProfile(req, res, next) {
        UserModel.findOne({ _id: req.params.uid }).then((response) => {
            new JsonRes(res).success(response)
            next()
        }).catch((e) => {
            next(e)
        })
    }

    static updateProfile(req, res, next) {
        next()
    }


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

        // TODO need test cases move to user model
        return KlipModel.find({ uid: req.params.uid }).sort({ last_modified: -1 }).then((response) => {
            if (!response)
                return new JsonRes(res).fail('fail to fetch getKlip')
            return new JsonRes(res).success(response)
        })
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
