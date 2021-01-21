const { keyBy } = require('lodash')
var _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.length === 0
    ? 0
    : blogs.reduce( (sum, blog) => sum + blog.likes, 0 )
}

const favouriteBlog = (blogs) => {
  const max = (highest, blog) => {
    return highest.likes && highest.likes>= blog.likes
      ? {
        title: highest.title,
        author: highest.author,
        likes: highest.likes 
      }
      : {
        title: blog.title,
        author: blog.author,
        likes: blog.likes
      }
  } 
  return blogs.reduce(max,{})
}

const mostBlogs = (blogs) => {
  
  const max = (maxAuthor, author) => {
    return maxAuthor.author && maxAuthor.likes >= author.likes
      ? maxAuthor
      : author
  }
  
  const groupedByAuthor = _.groupBy(blogs,'author')
  const finalList = _.map(groupedByAuthor, (authorBlogs, author)=> ({ author:author, blogs:authorBlogs.length }))
  
  return finalList.reduce(max,{})
}

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog,
  mostBlogs
}

