require('dotenv').config()
const googleauth = require('./authentication/googleauth')
const pgcontroller = require('./controllers/pgcontroller')
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
  // .use((req, res, next) => { console.log(req.session), next() })
  .use((req, res, next) => { res.locals.title = '', next() }) // prevent nav/header failing if page has no title
  .get('/signout', googleauth.signout)
  .use(googleauth.setupSignin)
  .use(googleauth.getGoogleAccount)
  .use(pgcontroller.getMyGroups)
  .get('/', (req, res) => res.render('pages/index', { title: 'Home' }))
  .use(googleauth.requireSignin)
  .get('/addgroup', (req, res) => res.render('pages/addgroup', { title: 'Add Group' }))
  .post('/addgroup', pgcontroller.postAddGroup)
  .get('/additem', (req, res) => res.render('pages/additem', { title: 'Add Item' }))
  .post('/additem', pgcontroller.postAddItem)
  .get('/groups/:groupId', pgcontroller.getGroup)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
