import { event } from './Event'
var socketioJwt = require('socketio-jwt')
import * as CONFIG from './CONFIG'

class SocketServer {
    public server
    private _io
    static start(server) {
        return new SocketServer(server)
    }
    constructor(server?) {
        this._io = require('socket.io')(server)
        this._io.on('connection', (socket) => {

        })

        this._io.on('connection', socketioJwt.authorize({
            secret: CONFIG.AUTH.SECRET_KEY,
            timeout: 15000 // 15 seconds to send the authentication message
        })).on('authenticated', (socket) => {

            event.on('klipAdded', function(record) {
                socket.emit('klipAdded', record)
            })

            console.log(socket.decoded_token)
            //this socket i authenticated, we are good to handle more events from it.
        });

        // on disconnect event
        this._io.on('disconnect', function() {

        })

        this._io.of("/user-klips").on("connection", function(socket) {
            // Event emmitter
            // socket.broadcast.send(JSON.stringify({ message: 'message' }))

        })
        return this._io
    }


    /**
     * [initEvents description]
     * @return {[type]} [description]
     */
    public initAuthEvents(socket) {
        // event.emit('klipAdded', 'aksdfjaksdjfkasf')
        event.on('onKlipRemove', (res) => {
            console.log(res)
        })
    }
    public initEvents(socket) {
        event.on('publicBoardUpdate', () => {
            socket.emit('publicBoardUpdate')
        })
    }

}


export default SocketServer
