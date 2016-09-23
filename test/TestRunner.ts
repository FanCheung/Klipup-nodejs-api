export class TestRunner {
    socket = null
    db = null
    users = null
    authorizedUser = null
    token = null
    static URL = { socket: 'http://localhost:5000' }
    static USER_DATA = {
        email: 'user@user.com',
        password: '999'
    }

    socketAuth(done) {
        let socket = this.socket = io(TestRunner.URL.socket)
        this.socket.emit('authenticate', { token: this.token })
            .on('authenticated', (socket) => {
                done()
            })

        this.socket.on("unauthorized", function(error, callback) {
            if (error) throw error
        });
    }

    async login(done) {

        MongoClient.connect(DB_URL, (err, result) => {
            this.db = result;
            this.users = this.db.collection('users')
            this.users.deleteMany({})
        });

        try {
            await new Promise(resolve => {
                api.post('/api/register').send({ user_email: TestRunner.USER_DATA.email, user_password: TestRunner.USER_DATA.password }).expect(200, (error, result) => {
                    if (error)
                        throw error
                    if (!result)
                        throw 'Register failed'
                    return resolve(result)
                })
            })

            this.authorizedUser = await new Promise(resolve => {
                this.users.findOne({ email: TestRunner.USER_DATA.email }, (err, result) => {
                    this.authorizedUser = result;
                    // activate the account
                    return resolve(result)
                })
            })

            let activationLink = '/api/activate/?email=' + this.authorizedUser.email + '&token=' + this.authorizedUser.email_token;

            await new Promise(resolve => {
                api.get(activationLink).expect(200, (error, res) => {
                    assert.equal(res.body.data.email_token, null, 'why the toekn still in db!!');
                    assert.equal(res.body.data.email_expires, 0, 'Should expire expire');
                    resolve(true)
                })
            })

            this.token = await new Promise(resolve => {
                api.post('/api/login').send({ username: TestRunner.USER_DATA.email, password: TestRunner.USER_DATA.password }).expect(200, (err, result) => {
                    assert(result.body.data.token, 'jwt token not available');
                    assert(result.body.data.uid, 'uid not available');
                    return resolve(result.body.data.token)
                })
            })

            done()
            return Promise.resolve(this.token)

        } catch (e) {
            console.error(e)
            throw e
        }
    }

    /**
    * Clear all klips
    */
    clearKlips(done): void {
        let klips = this.db.collection('klips');
        klips.deleteMany({}, error => assert(!error))
        done()
    }
}
