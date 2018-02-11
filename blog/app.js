var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongoose = require("mongoose");

var index = require('./routes/index');
var users = require('./routes/users');
var blogpage = require('./routes/blog-page');
var authorpage = require('./routes/author-page');
var about = require('./routes/about-us');
var contact = require('./routes/contact');

var app = express();

var connection = mongoose.connect("database",{useMongoClient:true});
if(connection){
  console.log("yes");
}
else{
  console.log("no");
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//SCHEMA
var postSchema = new mongoose.Schema({
    publishdate: String,
    image: String,
    title: String,
    content: String,
    author:String,
    authorImage:String,
    authorDescription:String
});

var blogPost = mongoose.model("posts", postSchema);

//Index page
app.get('/blog-posts/:page', function(req, res, next) {
    var perPage = 5;
    var page = req.params.page || 1;
    blogPost
        .find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, allPosts) {
            blogPost.count().exec(function(err, count) {
                if (err) {
                    return next(err);
                }
                else{
                    blogPost.aggregate([
                        {"$group": {"_id":{name:"$author", picture:"$authorImage"}}}], function(err, authorsGroup){
                            if(err){
                                console.log(err);
                            }
                            else{        
                                blogPost
                                .find({})
                                .limit(4)
                                .exec(function(err, lastAdded) {
                                    res.render('index', {allPosts:allPosts, lastAdded: lastAdded,authorsGroup:authorsGroup,  current: page, pages: Math.ceil(count / perPage) });
                                });                       
                               
                            }
                        });
                }
            });
        });   

    //  blogPost.find({}, function(err,allPosts){
    //      if(err) console.log(err);
    //      else{
    //         blogPost.aggregate([
    //             {"$group": {"_id":{name:"$author", picture:"$authorImage"}}}], function(err, authorsGroup){
    //                 if(err){
    //                     console.log(err);
    //                 }
    //                 else{        
                        
    //                         res.render('index', {allPosts:allPosts, authorsGroup:authorsGroup });
                                            
                       
    //                 }
    //             });
    //      }
    //  });
        
});


//SHOW one post = gets blog ID and shows more info
app.get("/blog-posts/post/:id",function(req,res){
    blogPost.findById(req.params.id, function(err,foundBlog){
        if(err){
            res.redirect("/blog-posts");
        }
        else{
            blogPost
                    .find({})
                    .limit(4)
                    .exec(function(err, lastAdded) {
                        res.render("blog-page", {blog: foundBlog, lastAdded:lastAdded});
                    });       
        }
    })
});

//SHOW the author of the post

app.get("/blog-posts/post/:id/:author",function(req,res){
    blogPost.findById(req.params.id, function(err,foundBlog){
        if(err){
            res.redirect("/blog-posts");
        }
        else{
            res.render("author-page", {blog:foundBlog});                   
        }
    })
});

app.get('/about-us', function(req, res) {
    res.render('about-us');
});


app.get('/contact', function(req, res) {
    res.render('contact');
});


app.use('/users', users);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
