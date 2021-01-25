const app = require('../app')
const mongoose = require('mongoose')
const supertest = require('supertest')
const api = supertest(app)
const Blog = require('../models/blog')
const helper = require('./test_helper')
const test_helper = require('./test_helper')
const User = require('../models/user')
const bcrypt = require('bcrypt')

beforeEach(async () => {
  await Blog.deleteMany({})
  console.log('cleared')

  const blogObjects = helper.initialBlogs.map( blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})


describe('viewing blogs',() => {
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

})

describe('adding blogs', () => {
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
})

test('unique identifier is named id', async () => {
  const response = await api.get('/api/blogs')
  response.body.forEach(blog => expect(blog.id).toBeDefined())
})


describe('blog can be deleted', () => {
  test('blog can be deleted', async () => {
    const initialBlogs = await test_helper.blogsInDB()
    const blogToDelete = initialBlogs[0]
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)
    
    const blogsAtEnd = await test_helper.blogsInDB()
    expect(blogsAtEnd).toHaveLength(
      test_helper.initialBlogs.length - 1)
  
    const blogs = blogsAtEnd.map(blog => blog.title)
    expect(blogs).not.toContain(blogToDelete.title)
  
  })
})

describe('blog can be updated', () => {
  test('blog can be updated', async () => {
    const initialBlogs = await test_helper.blogsInDB() 
    const blogToBeUpdated = initialBlogs[0]
    const blog = {likes : 40}
  
    await api
      .put(`/api/blogs/${blogToBeUpdated.id}`)
      .send(blog)
      .expect(200)
      .expect('Content-Type',/application\/json/)
  
    const blogsAtEnd = await test_helper.blogsInDB()
    const blogTitles = blogsAtEnd.map(blog => blog.title)
    expect(blogTitles).toContain(blogToBeUpdated.title)
  
    blogsAtEnd.forEach(blog => {
      if(blog.title === blogToBeUpdated.title)
        expect(blog.likes).toBe(blog.likes)
    })
  
  })
})

describe('user tests', () => {

  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({username: 'initialusername', passwordHash})

    await user.save()
  })

  test('add a user with unique username', async () => {
    const usersAtStart = await test_helper.usersInDB()
    console.log(usersAtStart)
    const user = {
      username: 'testusername',
      name: 'testname',
      password: 'testpassword'
    }
    await api
      .post('/api/users/')
      .send(user)
      .expect(200)
      .expect('Content-Type',/application\/json/)

    const usersAtEnd = await test_helper.usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(user => user.username)
    expect(usernames).toContain(user.username)
  })

  test('cannot add a user with repeated username', async () => {
    
    const usersAtStart = await test_helper.usersInDB()
    const user = {
      username: 'initialusername',
      name: 'testname',
      password: 'testpassword',
    }
    const result = await api
      .post('/api/users/')
      .send(user)
      .expect(400)

    expect (result.body.error).toContain('`username` to be unique')
    const usersAtEnd = await test_helper.usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

  })
})

afterAll(()=> {
  mongoose.connection.close()
})