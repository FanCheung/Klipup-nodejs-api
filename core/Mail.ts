import * as nodemailer from 'nodemailer'

class Mail {
    transporter = nodemailer.createTransport('smtps://user%40gmail.com:pass@smtp.gmail.com')
    constructor(private options = {
        from: null,
        to: null,
        subject: null,
        text: '',
        html: ''
    }) {
        // create reusable transporter object using the default SMTP transport
    }

    public send() {
        this.transporter.sendMail(this.options, function(error, info) {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        })
    }

}

// // setup e-mail data with unicode symbols
// var mailOptions = {
//     from: '"Fred Foo 👥" <foo@blurdybloop.com>', // sender address
//     to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
//     subject: 'Hello ✔', // Subject line
//     text: 'Hello world 🐴', // plaintext body
//     html: '<b>Hello world 🐴</b>' // html body
// };

// send mail with defined transport object
