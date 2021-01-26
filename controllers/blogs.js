const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user',{'username':1,'name':1,'id':1})
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body
  const users = await User.find({})

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: users[0]._id
  })
  const savedBlog = await blog.save()
  
  users[0].blogs = users[0].blogs.concat(savedBlog._id)
  await users[0].save()
  
  response.json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const blog = {
    likes:body.likes
  }
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {new:true})
  response.json(updatedBlog)
})

module.exports = blogsRouter