require('dotenv').config()
const googleauth = require('./authentication/googleauth')
const pgcontroller = require('./controllers/pgcontroller')
const api_router = require('./api-router')
const express = require('express')
const session = require('express-session')
const path = require('path')
const PORT = process.env.PORT || 5000

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(session({ secret: 'secret santa', resave: false, saveUninitialized: true, cookie: { secure: false }}))
  .use((req, res, next) => { 
    res.locals.account = req.session.account 
    res.locals.title = ''
    next()
  }) // default values to fields for .ejs files
  .get('/signout', googleauth.signout)
  .use(googleauth.setupSignin)
  .use(googleauth.getGoogleAccount)
  .use(pgcontroller.getMyGroups)
  // .use('/', (req, res, next) => { if(!req.path.startsWith('/api')) res.render('pages/index'); else next(); })
  // .use(googleauth.requireSignin)
  .use((req, res, next) => { req.session.signedin = true; req.session.account = { email: 'mp3lefevre@gmail.com' }; next(); }) // dummy account for testing
  .use('/api', googleauth.requireSignin, api_router)
  .use('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
