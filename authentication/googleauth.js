const { google } = require('googleapis')
const pgcontroller = require('./../controllers/pgcontroller')
// import { google } from 'googleapis';
// require { google } from 'googleapis';

const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID, // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // e.g. _ASDFA%DFASDFASDFASD#FAD-
  redirect: process.env.GOOGLE_CLIENT_REDIRECT_URI // this must match your google api settings
};

/**
 * Create the google auth object which gives us access to talk to google's apis.
 */
function createAuthConnection(redirecturl) {
  return new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    redirecturl || googleConfig.redirect
  );
}

/**
 * This scope tells google what information we want to request.
 */
const defaultScope = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
 */
function getConnectionUrl(auth) {
  return auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
    scope: defaultScope
  });
}

/**
 * Create the google url to be sent to the client.
 */
function urlGoogle(redirecturl) {
  const auth = createAuthConnection(redirecturl); // this is from previous step
  const url = getConnectionUrl(auth);
  return url;
}

/**
 * Helper function to get the library with access to the google plus api.
 */
function getGooglePlusApi(auth) {
  return google.plus({ version: 'v1', auth });
}

/**
 * Extract the email and id of the google account from the "code" parameter.
 */
async function getGoogleAccountFromCode(auth, code) {
  const data = await auth.getToken(code)
  auth.setCredentials(data.tokens)
  
  const oauth2 = google.oauth2({ auth: auth, version: 'v2' })
  const res = await oauth2.userinfo.get({})
  return res.data
}

function setupSignin(req, res, next) {
  if (!req.session.signedin) {
    req.session.auth = createAuthConnection()
    res.locals.signinurl = getConnectionUrl(req.session.auth)
  }

  res.locals.signedin = req.session.signedin
  next()
}

function requireSignin(req, res, next) {
  if (!req.session.signedin) {
    req.session.signinredirect = req.protocol + '://' + req.get('host') + req.originalUrl
    res.redirect(res.locals.signinurl);
  } else {
    next()
  }
}

async function getGoogleAccount(req, res, next) {
  if (!req.session.signedin && req.query.code) {
    const account = await getGoogleAccountFromCode(req.session.auth, req.query.code)
    if (!await pgcontroller.isUser(account.email)) await pgcontroller.addUser(account.email, account.name)
    if (!(await pgcontroller.getUser(account.email)).name) pgcontroller.updateUser(account)

    account.email = pgcontroller.formatEmail(account.email)
    req.session.account = account
    req.session.signedin = true
    res.redirect(req.session.signinredirect || '/')
  } else {
    next()
  }
}

function signout(req, res) {
  req.session.destroy()
  res.redirect('/')
}

exports.setupSignin = setupSignin
exports.requireSignin = requireSignin
exports.getGoogleAccount = getGoogleAccount
exports.signout = signout