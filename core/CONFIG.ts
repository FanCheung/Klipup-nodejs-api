require('./ENV.js')
module CONFIG {
    export let AUTH = {
        FACEBOOK: {
            clientID: '570107509759319',
            // clientSecret: 'd863725e85d08f5fff24efff605b74f2',
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

    export let ENV = {
        URL: 'http://klipup.com:5000'
    }
}
export =CONFIG
