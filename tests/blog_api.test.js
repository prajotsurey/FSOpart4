const app = require('../app')
const mongoose = require('mongoose')
const supertest = require('supertest')
const api = supertest(app)
const Blog = require('../models/blog')
const helper = require('./test_helper')

beforeEach(async () => {
  await Blog.deleteMany({})
  console.log('cleared')

  const blogObjects = helper.initialBlogs.map( blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

test('blogs are returned as json', async () => {
  
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type',/application\/json/)
})

test('correct amount of blogs are returned', async () => {
  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('unique identifier is named id', async () => {
  const response = await api.get('/api/blogs')
  response.body.forEach(blog => expect(blog.id).toBeDefined())
})

test('blog can be added', async () => {
  const newBlog = {
    title: 'Latest Blog',
    author: 'Latest Author',
    url: 'Latest URL',
    likes: 7
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDB()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

})

test('blog with missing likes property defaults it to 0', async () => {
  const newBlog = {
    title: 'Latest Blog',
    author: 'Latest Author',
    url: 'Latest URL',
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDB()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const addedBlog = blogsAtEnd.find(blog => blog.title === newBlog.title)
  expect(addedBlog.likes).toBe(0)

})
test('blog with missing title', async () => {
  const newBlog = {
    author: 'Latest Author',
    url: 'Latest URL',
  }


  const response = await api.post('/api/blogs').send(newBlog)
  expect(response.status).toBe(400)
  expect(response.body.error).toBe('Blog validation failed: title: Path `title` is required.')
})

test('blog with missing url', async () => {
  const newBlog = {
    title: 'Latest Blog',
    author: 'Latest Author',
  }

  const response = await api.post('/api/blogs').send(newBlog)
  expect(response.status).toBe(400)
  expect(response.body.error).toBe('Blog validation failed: url: Path `url` is required.')
})

afterAll(()=> {
  mongoose.connection.close()
})