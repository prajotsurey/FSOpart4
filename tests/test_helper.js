const Blog = require('../models/blog')
const User = require('../models/user')
const initialBlogs = [
  {
    title: 'title1',
    author: 'author1',
    url: 'url1',
    likes: 4,
  },
  {
    title: 'title2',
    author: 'author2',
    url: 'url2',
    likes: 3,
  },
]

const initialUsers = [
  {
    username: 'username1',
    name: 'name1',
    password: 'password1'
  },
  {
    username: 'username2',
    name: 'name2',
    password: 'password2'
  }

]

const blogsInDB = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDB = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}

module.exports = {
  initialBlogs, blogsInDB, usersInDB, initialUsers
}