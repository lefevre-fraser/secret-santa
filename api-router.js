const APIRouter = require('express').Router({ mergeParams: true })
const pgcontroller = require('./controllers/pgcontroller')

APIRouter
  // .use(async (req, res, next) => { console.log(req.query); const col = pgcontroller.parseColumns(req.query.$select); await pgcontroller.verifyColumns('item', col); res.end(JSON.stringify(col)); })
  .get('/', (req, res) => res.render('pages/index', { title: 'Home' }))
  .use((req, res, next) => { res.setHeader("Content-Type", "application/json"); next(); })
  .get('/test/query', (req, res) => res.end(JSON.stringify(pgcontroller.parseQuery(req))))
  .get('/addgroup', (req, res) => res.render('pages/addgroup', { title: 'Add Group' }))
  .post('/addgroup', pgcontroller.postAddGroup)
  // .get('/groups/:groupId', pgcontroller.getGroupMemberList)
  .get('/additem', (req, res) => res.render('pages/additem', { title: 'Add Item' }))
  .post('/additem', pgcontroller.postAddItem)
  // .get('/items', pgcontroller.getItemList)
  // .get('/items/:groupId/:emailId', pgcontroller.getItemList)
  // .get('/items/:itemId', pgcontroller.getItem)
  // .post('/items/:itemId', pgcontroller.setItem)
  .get('/currentuser', (req, res, next) => {
    req.params.$filter = `email_id eq ${req.session.account.email}`
    pgcontroller.get('app_user', pgcontroller.AccessControl('view_user'))(req, res, next)
  })
  .get('/users', pgcontroller.get('app_user', pgcontroller.AccessControl('view_user')))
  .get('/users/:emailId', (req, res, next) => {
    req.query.$filter = `email_id eq '${req.params.emailId}'`
    pgcontroller.get('app_user', pgcontroller.AccessControl('view_user'))(req, res, next)
  })
  .get('/groups', pgcontroller.get('app_group', pgcontroller.AccessControl('view_group')))
  .get('/groups/:groupId', (req, res, next) => {
    req.query.$filter = `id eq ${req.params.groupId}`
    pgcontroller.get('app_group', pgcontroller.AccessControl('view_group'))(req, res, next)
  })
  .get('/myitems', async(req, res, next) => {
    req.query.$filter  = `member_email_id eq '${req.session.account.email}'`
    pgcontroller.get('item', pgcontroller.AccessControl('view_item'))(req, res, next)
  })
  .get('/items', pgcontroller.get('item', pgcontroller.AccessControl('view_item')))
  .get('/items/:itemId', async(req, res, next) => {
    req.query.$filter = `id eq ${req.params.itemId}`
    pgcontroller.get('item', pgcontroller.AccessControl('view_item'))(req, res, next)
  })
  .post('/items/:itemId', async(req, res, next) => {
    req.query.$filter = `id eq ${req.params.itemId}`
    pgcontroller.post('item', pgcontroller.AccessControl('edit_item'))(req, res, next)
  })
  .get('/items/:itemId/view', async (req, res) => res.render('pages/item', { item: await pgcontroller.getItem(req.params.itemId), mode: 'view' }))
  .get('/items/:itemId/update', async (req, res) => res.render('pages/item', { item: await pgcontroller.getItem(req.params.itemId), mode: 'edit' }))
  .post('/items/:itemId/purchase', pgcontroller.postPurchaseItem)
  .post('/items/:itemId/update', pgcontroller.postUpdateItem)
  .post('/items/:itemId/delete', pgcontroller.postDeleteItem)
  .get('/items/:groupId/:emailId', (req, res, next) => {
    req.query.$filter = `member_email_id eq '${req.params.emailId}' and group_id eq ${req.params.groupId}`
    pgcontroller.get('item', pgcontroller.AccessControl('view_item'))(req, res, next)
  })
  .use((err, req, res, next) => {
    console.error(err.stack?err.stack:err)
    res.status(500).send("Something Broke")
  })

module.exports = APIRouter