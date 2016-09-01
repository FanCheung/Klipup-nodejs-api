
require('./ENV.js')
module CONFIG {
    export let AUTH = {
        FACEBOOK: {
            clientID: '570107509759319',
            clientSecret: process.env.FACEBOOK_SECRET,
            callbackURL: 'http://klipup.com:5000/api/auth/facebook/callback',
            // profileFields: ['id', 'emails', 'name'] //This
            profileFields: ['id', 'gender', 'locale', 'birthday', 'name', 'displayName', 'photos', 'email'],
            enableProof: true
        },

        GOOGLE: {

        },

        WEIBO: {

        },

        LOCAL: {

        },
        SECRET_KEY: 'secretkey',
    }

    export let SMTP = {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false, // use SSL
        auth: {
            user: 'fancheung@outlook.com',
            pass: process.env.SMTP_PASS
        }
    }


    export let ENV = {
        URL: 'http://klipup.com:5000'
    }
}
export =CONFIG
