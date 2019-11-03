// Exercise Tracker Project by Yasmin Melean 01/11/2019.
// init project
const mongo = require("mongodb");
const mongoose = require("mongoose");
const shortid = require("shortid");
const express = require("express");
const app = express();

// Parse incoming request bodies in a middleware before your handlers
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(urlencodedParser);

// Require CORS to allow FCC the remote testing of the API.
// More about Cors: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing.
const cors = require('cors');
app.use(cors({optionsSuccessStatus: 200})); // Some legacy browsers (IE11, various SmartTVs) choke on 204

// Global setting for safety timeouts to handle callbacks that will never be called.
var timeout = 10000;

// Start MonngoDB connection to the database 
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}).catch(error => console.log(error));

// To fix deprecation warnings from findAndUpdate
mongoose.set('useFindAndModify', false);

// Use mongoose basic Schema types to create the Model.
const Schema = mongoose.Schema;
var userSchema = new Schema({
  username: {type: String, required: true},
  _id: {type: String, required: true},
  count: {type: Number, default: 0},
  log: [{
    description: String,
    duration: Number,
    date: Date,
    _id: false
  }]
});

var User = mongoose.model('User', userSchema);

// Find user given the username.
var findUserByUsername = function(username, done) {
  User.find({username: username}, function(err, data) {
    err ? done(err) : done(null, data);
  });
}

// Create a document instance usijng the User constructor.
var createAndSaveUser = function(username, userId, done) {
  var newUser = new User({username: username, _id: userId});
  newUser.save(function(err, data) {
    if(err) {
      return done(err);
    }else {
      done(null, data);      
    }
  });
}

// Find and update user by _id.
var findAndUpdateUserById = function(userId, exercise, done) {
  User.findByIdAndUpdate({_id: userId}, {$push:{log:exercise}, $inc:{count: 1}}, 
                         {new: true, fields: {__v: 0}}, function(err, data) {
    err ? done(err) : done(null, data);
  });
};

// Find user by _id
var findUserById = function(userId, done) {
  User.findById({_id: userId}, {__v: 0}, function(err, data) {
    err ? done(err) : done(null, data);
  });
}

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

function pad(num) {
  return num < 10 ? '0' + num.toString() : num.toString();
}

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", function(req, res, next) {
  var t = setTimeout(() => {next({message: 'timeout'})}, timeout);
  var username = req.body.username;
  
  // Find user by username. Use Model.Find() passing the username as search key.
  findUserByUsername(username, function(err, data) {
    clearTimeout(t);
    if(err) { return next(err) }
    if(!data) {
      console.log("Missing 'done()' argument");
      return next({message: 'Missing callback argument in create a new user'});            
    }
    if(data.length == 0) {
      createAndSaveUser(username, shortid.generate(), function(err, data2) {
        clearTimeout(t);
        if(err) { return next(err) }
        if(!data2) {
          console.log("Missing 'done()' argument");
          return next({message: 'Missing callback argument in create and save url'});          
        }
        res.json({username: data2.username, _id: data2._id});
      });
    }else {
      res.json({username: username + ", username already taken"});
    }
  });
});

app.get("/api/exercise/users", function(req, res, next) {
  var t = setTimeout(() => {next({message: 'timeout'})}, timeout);
  // Retrieve all users present in the database
  User.find({}, function(err, data) {
    clearTimeout(t);
    if(err) { return next(err) }
    if(!data) {
      console.log("Missing 'done()' argument");
      return next({message: 'Missing callback argument in retrieving all users'});                
    }
    var allUsers = Object.keys(data).map(function(i) {
      return {username: data[i].username, _id: data[i]._id};
    });
    res.send(allUsers);
  });  
});

app.post("/api/exercise/add", function(req, res, next) {
  var t = setTimeout(() => {next({message: 'timeout'})}, timeout);
  var date = req.body.date;
  if(!date) { 
    var today = new Date();
    date = today.getFullYear() + "-" + (today.getMonth()+1) + "-" + pad(today.getDate());
  }
  var userId = req.body.userId;
  var exercise = {description: req.body.description, duration: req.body.duration, date: date};
  findAndUpdateUserById(userId, exercise, function(err, data) {
    clearTimeout(t);
    if(err) { return next(err) }
    if(!data) {
      console.log("Missing 'done()' argument in find user by _id");
      return next({message: 'Unknown userId'});            
    }
    var len = data.log.length-1;
    res.json({username: data.username, _id: data._id, count: data.count, description: data.log[len].description, 
              duration: data.log[len].duration, date: data.log[len].date.toDateString() });
  });
});

app.get("/api/exercise/log", function(req, res, next) {
  var t = setTimeout(() => {next({message: 'timeout'})}, timeout);
  if(req.query.userId) {
    let from, to, limit;
    if(req.query.from) { from = new Date(req.query.from); }
    if(req.query.to) { to = new Date(req.query.to); }
    if(req.query.limit) { limit = req.query.limit; }
    findUserById(req.query.userId, function(err, data) {
      clearTimeout(t);
      if(err) { return next(err) }
      if(!data) {
        console.log("Missing 'done()' argument in find user by _id");
        return next({message: 'Unknown userId'});                
      }
      var log = data.log;
      if(from && to) {
        from = from.toISOString();
        to = to.toISOString();
        log = data.log.sort((a, b) => a.date - b.date);
        log = log.filter(function(exercise) { return from <= exercise.date.toISOString() && exercise.date.toISOString() <= to});
      }
      if(limit && limit < data.log.length) {
        log = log.slice(0, limit);  
      }
      // Need improvement on date format. A search didn't return a nice way of formatting log dates.
      res.json({username: data.username, _id: data._id, count: data.count, log: log});
    });
  }else {
    res.json({userId: "UserId parameter not entered. log?userId=theuseridyouhave"});
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

// Starts the server and listens for requests in PORT
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app Exercise Tracker is listening on port " + listener.address().port);
});