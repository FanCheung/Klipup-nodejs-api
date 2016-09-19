import * as UserModel from '../model/UserModel'
import JsonRes from '../core/JsonRes'
import * as KlipModel from '../model/KlipModel'
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
        return KlipModel.find().then((response) => {
            new JsonRes(res).success(response)
next()
        })
    }


    /**
     * Expect j
     * @param req
     * @param res
     * @param next
     */
    static addKlip(req, res, next) {
        // record passed json header it gets auto parsed
        let record = req.body
        let currentUser = AuthModel.getCurrentUser()

        //TODO:140 perform a current user check against uid
        if (currentUser)
            KlipModel.addOne({ uid: currentUser, content: record.content, description: record.description }).then((result) => {
                // TODO:70 got to check result it might not pass validation
                // let KlipEvent = new Event()
                event.emit('klipAdded', record)

                new JsonRes(res).success()
            }).catch((e) => {
                console.log('catchhhhhhhhhhhhhhh')
                next(e)
            })
        else
            next(new Error('user not found'))
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
