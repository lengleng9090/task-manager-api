const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase, userTwo} = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should signup a new user', async()=>{
    const response = await request(app).post('/users').send({
        name: 'admin',
        email: 'admin@example.com',
        password: 'MyPass777!'
    }).expect(201)

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertions about the response
    expect(response.body).toMatchObject({
        user:{
            name:'admin',
            email: 'admin@example.com'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('MyPass777!')
})

test('Should login existing user', async()=>{
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login non-existing user',async ()=>{
    await request(app).post('/users/login').send({
        email: 'dummyEmail@example.com',
        password: 'dummyEmail1!'
    }).expect(400)
})

test('Should get profile for user',async()=>{
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user',async ()=>{
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async ()=>{
    await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async ()=>{
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should upload avatar image',async()=>{
    await request(app)
    .post('/users/me/avatar')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .attach('avatar','tests/fixtures/profile-pic.jpg')
    .expect(200)
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async ()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send({
        name: 'Mike'
    })
    .expect(200)

    const user = await User.findById(userOneId)

    expect(user.name).toEqual('Mike')
})

test('Should not update invalid user fields', async ()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send({
        location: 'Thailand'
    })
    .expect(400)
})

test('Should not signup user with invalid name', async()=>{
    await request(app)
    .post('/users')
    .send({
        email:'art@example.com',
        password:'MyArt777!'
    })
    .expect(400)
})

test('Should not signup user with invalid email', async()=>{
    await request(app)
    .post('/users')
    .send({
        name:'Art',
        password:'MyArt777!'
    })
    .expect(400)
})

test('Should not signup user with invalid password', async()=>{
    await request(app)
    .post('/users')
    .send({
        name:'Art',
        email:'art@example.com'
    })
    .expect(400)
})

test('Should not update user if unauthenticated', async()=>{
    await request(app)
    .patch('/users/me')
    .send({
        password:'youHasBeenHack!55'
    })
    .expect(401)
})

test('Should not update user with invalid name', async ()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization',`Bearer ${userTwo.tokens[0].token}`)
    .send({
        name: null
    })
    .expect(400)
})

test('Should not update user with invalid email', async ()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization',`Bearer ${userTwo.tokens[0].token}`)
    .send({
        email: 'thisIsAEmail'
    })
    .expect(400)
})

test('Should not update user with invalid password', async ()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization',`Bearer ${userTwo.tokens[0].token}`)
    .send({
        password:'password'
    })
    .expect(400)
})

test('Should not delete user if unauthenticated',async ()=>{
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})