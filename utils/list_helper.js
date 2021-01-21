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

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog
}

