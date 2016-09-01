import * as nodemailer from 'nodemailer'
import * as CONFIG from './CONFIG';
class Mail {
    private transporter
    private options = {
        from: '"Support 👥" <fancheung@outlook.com>', // sender address
        to: 'dan@varomatic.com',
        subject: 'testing',
        text: 'testing',
        html: 'testing'
    }
    constructor(options) {

        this.options = Object.assign(this.options, options)
        this.transporter = nodemailer.createTransport(CONFIG.SMTP)
        this.transporter.verify(function(error, success) {
            if (error) {
                console.log(error);
            } else {
                console.log('Server is ready to take our messages');
            }
        })

        // create reusable transporter object using the default SMTP transport

    }

    public send() {

console.log(this.options)
        // this.transporter.sendMail(this.options, function(error, info) {
        //     if (error) {
        //         return console.log(error);
        //     }
        //     console.log('Message sent: ' + info.response);
        // })
    }

}
export { Mail }
