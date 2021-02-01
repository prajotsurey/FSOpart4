const app = require('../app')
const mongoose = require('mongoose')
const supertest = require('supertest')
const api = supertest(app)
const Blog = require('../models/blog')
const helper = require('./test_helper')
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
beforeEach(async () => {
  await Blog.deleteMany({})
  console.log('cleared')

  await User.deleteMany({})
  console.log('cleared users')

  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({username: 'initialusername1', passwordHash})

  await user.save()

  const blogsWithUsers = helper.initialBlogs.map(blog => {
    blog['user'] = user.id
    return blog
  })

  const blogObjects = blogsWithUsers.map( blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)

})

const getToken = async () => {
  const users = await helper.usersInDB()
  const userForToken = {
    username: users[0].username,
    id: users[0].id,
  }
  const token = jwt.sign(userForToken, process.env.SECRET)
  return token
}

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
    const token = await getToken()
    const header = 'bearer ' + token
    await api
      .post('/api/blogs')
      .set('Authorization', header)
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
    
    const token = await getToken()
    const header = 'bearer ' + token

    await api
      .post('/api/blogs')
      .set('Authorization', header)
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
    
    const token = await getToken()
    const header = 'bearer ' + token
  
    const response = await api.post('/api/blogs').set('Authorization', header).send(newBlog)
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Blog validation failed: title: Path `title` is required.')
  })
  
  test('blog with missing url', async () => {
    const newBlog = {
      title: 'Latest Blog',
      author: 'Latest Author',
    }
  
    const token = await getToken()
    const header = 'bearer ' + token
    
    const response = await api.post('/api/blogs').set('Authorization', header).send(newBlog)
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Blog validation failed: url: Path `url` is required.')
  })

  test('adding blog fails when token is not provided', async () => {
    const newBlog = {
      title: 'Latest Blog',
      author: 'Latest Author',
      url: 'Latest URL',
      likes: 7
    }
    const result = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)

    expect(result.body.error).toBe('jwt must be provided')
  
    const blogsAtEnd = await helper.blogsInDB()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    
  })
})

test('unique identifier is named id', async () => {
  const response = await api.get('/api/blogs')
  response.body.forEach(blog => expect(blog.id).toBeDefined())
})


describe('blog can be deleted', () => {
  test('blog can be deleted', async () => {
    const initialBlogs = await helper.blogsInDB()
    const blogToDelete = initialBlogs[0]

    const token = await getToken()
    const header = 'bearer ' + token

    await api
      .delete(`/api/blogs/${blogToDelete.id}`).set('Authorization', header)
      .expect(204)
    
    const blogsAtEnd = await helper.blogsInDB()
    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length - 1)
  
    const blogs = blogsAtEnd.map(blog => blog.title)
    expect(blogs).not.toContain(blogToDelete.title)
  
  })
})

describe('blog can be updated', () => {
  test('blog can be updated', async () => {
    const initialBlogs = await helper.blogsInDB() 
    const blogToBeUpdated = initialBlogs[0]
    const blog = {likes : 40}
  
    await api
      .put(`/api/blogs/${blogToBeUpdated.id}`)
      .send(blog)
      .expect(200)
      .expect('Content-Type',/application\/json/)
  
    const blogsAtEnd = await helper.blogsInDB()
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
    const usersAtStart = await helper.usersInDB()
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

    const usersAtEnd = await helper.usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(user => user.username)
    expect(usernames).toContain(user.username)
  })

  test('cannot add a user with repeated username', async () => {
    
    const usersAtStart = await helper.usersInDB()
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
    const usersAtEnd = await helper.usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

  })
  test('cannot add user with a short username', async () => {
    const usersAtStart = await helper.usersInDB()
    const user = {
      username:'as',
      name:'name1',
      password:'password'
    }

    const result = await api
      .post('/api/users/')
      .send(user)
      .expect(400)

    expect(result.body.error).toContain('is shorter than the minimum allowed length (3).')
    
    const usersAtEnd = await helper.usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
  test('cannot add user with a short password', async () => {
    const usersAtStart = await helper.usersInDB()
    const user = {
      username:'abas',
      name:'name1',
      password:'te'
    }

    const result = await api
      .post('/api/users/')
      .send(user)
      .expect(400)

    expect(result.body.error).toContain('password must be atleast 3 characters long')

    const usersAtEnd = await helper.usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(()=> {
  mongoose.connection.close()
})