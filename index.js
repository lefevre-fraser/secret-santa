require('dotenv').config()
const googleauth = require('./authentication/googleauth')
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/signin', (req, res) => res.render('pages/signin', { signinurl: googleauth.signinurl() }))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
