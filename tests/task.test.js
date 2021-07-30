const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const { userOneId, 
    userOne, 
    userTwoId,
    userTwo, 
    taskOne,
    taskTwo,
    taskThree, 
    setupDatabase} = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should create task for user', async () => {
 const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        description:'From my test'
    })
    .expect(201)
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toEqual(false)
})

test('should get userOne tasks', async () =>{
    const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    expect(response.body).toHaveLength(2)
})

test('should reject when UserTwo try to delete UserOne task',async()=>{
    const response = await request(app)
    .delete('/tasks/'+taskOne._id)
    .set('Authorization',`Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404)

    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
})

test('Should not create task with invalid description', async ()=>{
    await request(app)
    .post('/tasks')
    .set('Authorization',`Bearer ${userTwo.tokens[0].token}`)
    .send({
        description: null
    })
    .expect(400)
})

test('Should not create task with invalid completed', async ()=>{
    await request(app)
    .post('/tasks')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send({
        description: 'My task',
        completed: 'has true'
    })
    .expect(400)
})

test('Should not update task with invalid description',async ()=>{
    await request(app)
    .patch('/tasks/'+taskOne._id)
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send({
        description:null
    })
    .expect(400)
})

test('Should not update task with invalid completed',async ()=>{
    await request(app)
    .patch('/tasks/'+taskOne._id)
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send({
        completed: 400
    })
    .expect(400)
})

test('Should delete user task',async ()=>{
    await request(app)
    .delete('/tasks/'+taskThree._id)
    .set('Authorization',`Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not delete task if unauthenticated', async ()=>{
    await request(app)
    .delete('/tasks/'+taskThree._id)
    .send()
    .expect(401)
})

test('Should not update other users task',async ()=>{
    await request(app)
    .delete('/tasks/'+taskThree._id)
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(404)
})

test('Should fetch user task by id', async ()=>{
    await request(app)
    .get('/tasks/'+taskOne._id)
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not fetch user task by id if unauthenticated', async ()=>{
    await request(app)
    .get('/tasks/'+taskOne._id)
    .send()
    .expect(401)
})

test('Should not fetch other users task by id', async ()=>{
    await request(app)
    .get('/tasks/'+taskOne._id)
    .set('Authorization',`Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404)
})

test('Should fetch only completed tasks', async ()=>{
    const response = await request(app)
    .get('/tasks?completed=true')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    const result = response.body.filter( task => task.completed === false);
    expect(result).toHaveLength(0)
})

test('Should fetch only incomplete tasks', async ()=>{
    const response = await request(app)
    .get('/tasks?completed=false')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    const result = response.body.filter( task => task.completed === true);
    expect(result).toHaveLength(0)
})

test('Should sort tasks by description', async ()=>{
    const response = await request(app)
    .get('/tasks?sortBy=description:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    expect(response.body[0]._id.toString()).toBe(taskTwo._id.toString())
})

test('Should sort tasks by completed',async () =>{
    const response = await request(app)
    .get('/tasks?sortBy=completed:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    expect(response.body[0].completed).toBe(true)
})

test('Should sort tasks by createdAt',async () =>{
    const response = await request(app)
    .get('/tasks?sortBy=createdAt:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    expect(response.body[0]._id.toString()).toBe(taskTwo._id.toString())
})

test('Should sort tasks by updatedAt',async () =>{
    await Task.findByIdAndUpdate(taskOne._id, { completed: true })

    const response = await request(app)
    .get('/tasks?sortBy=updatedAt:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    expect(response.body[0]._id.toString()).toBe(taskOne._id.toString())
})

test('Should fetch page of tasks',async ()=>{
    const response = await request(app)
    .get('/tasks?skip=0&limit=1')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
    
    expect(response.body.length).toBe(1)
})


