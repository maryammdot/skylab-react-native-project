require('dotenv').config()
const { env: { MONGODB_URL_TEST } } = process
const { mongoose, models: { User } } = require('@skylab/data')
const authenticateUser = require('./authenticate-user')
const { expect } = require('chai')

describe('authenticateUser', () => {
    let user, authUser

    before(async () => {
        await mongoose.connect(MONGODB_URL_TEST, { useNewUrlParser: true, useUnifiedTopology: true })
        await User.deleteMany()
    })

    describe('on valid fields', () => {
        beforeEach(async () => {
            user = new User({
                email: `email-${Math.random()}@email.com`,
                username: `username-${Math.random()}`,
                password: `password-${Math.random()}`
            })

            user.save()
            
            authUser = {
                email: user.email,
                password: user.password
            }
        })

        it('should return the user on success', async () => {
            const registeredUser = await User.findOne({ email: user.email })
            const { id } = await authenticateUser(authUser.email, authUser.password)

            expect(id).to.equal(registeredUser.id)
        })

        it('should not expose the database', async () => {
            const user = await authenticateUser(authUser.email, authUser.password)

            expect(user.__v).not.to.exist
            expect(user._id).not.to.exist
            expect(user._doc).not.to.exist
        })

        it('should fail on wrong password and valid email', async () => {
            authUser.password = `wrong${authUser.password}`

            try {
                await authenticateUser(authUser.email, authUser.password)
            } catch(error) {
                expect(error).to.be.an.instanceof(Error)
                expect(error.message).to.equal('wrong credentials')
            }
        })

        it('should fail on non existing email', async () => {
            authUser.email = `wrong${authUser.email}`

            try {
                await authenticateUser(authUser.email, authUser.password)
            } catch(error) {
                expect(error).to.be.an.instanceof(Error)
                expect(error.message).to.equal('wrong credentials')
            }
        }) 
     })

     describe('on wrong fields', async () => {
        beforeEach(() => {
            user = new User({
                email: `email-${Math.random()}@email.com`,
                username: `username-${Math.random()}`,
                password: `password-${Math.random()}`
            })

            user.save()

            authUser = {
                email: user.email,
                password: user.password
            }
        })

        it('should fail on non string password', async () => {
            authUser.password = true

            try {
                await authenticateUser(authUser.email, authUser.password)
            } catch(error) {
                expect(error).to.be.an.instanceof(Error)
                expect(error.message).to.equal('password must be a string')
            }
        })

        it('should fail on non string email', async () => {
            authUser.email = true

            try {
                await authenticateUser(authUser.email, authUser.password)
            } catch(error) {
                expect(error).to.be.an.instanceof(Error)
                expect(error.message).to.equal('email must be a string')
            }
        })

        it('should fail on non valid email pattern', async () => {
            authUser.email = `nonValidEmail`

            try {
                await authenticateUser(authUser.email, authUser.password)
            } catch(error) {
                expect(error).to.be.an.instanceof(Error)
                expect(error.message).to.equal('nonValidEmail is not an email')
            }
        })
     })

    after(async () => {
        await User.deleteMany()
        await mongoose.disconnect()
    })
})