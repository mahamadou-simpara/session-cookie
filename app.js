const path = require('path');

const express = require('express');
const session = require('express-session');
const MongoClient = require('express-mongodb-session');
// const bcrypt = require('bcrypt');

const db = require('./data/database');
const demoRoutes = require('./routes/demo');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const StoreMongodb =  MongoClient(session);

const store = new StoreMongodb({
  uri: 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.9.1',
  databaseName: 'explore-session-cookie',
  collection: 'mysession'
});



app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'session-secret',
  resave: false,
  saveUninitialized: false,
  store: store
}))

app.use(async function(req, res, next) {
  const user = req.session.user;
  const isAuthenticated = req.session.isAuthenticated;

  if(!user || !isAuthenticated){
    return next();
  }

  result = await db.getDb().collection('users').findOne({email: user.email});


  const isAdmin = result.isAdmin



  res.locals.isAuthenticated = isAuthenticated;
  res.locals.isAdmin = isAdmin

  next();

})

app.use(demoRoutes);

app.use(function(error, req, res, next) {
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});
