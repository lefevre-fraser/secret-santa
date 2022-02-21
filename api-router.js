const APIRouter = require('express').Router({ mergeParams: true })
const pgcontroller = require('./controllers/pgcontroller')

APIRouter
  .get('/', (req, res) => res.render('pages/index', { title: 'Home' }))
  .get('/addgroup', (req, res) => res.render('pages/addgroup', { title: 'Add Group' }))
  .post('/addgroup', pgcontroller.postAddGroup)
  .get('/groups/:groupId', pgcontroller.getGroupMemberList)
  .get('/additem', (req, res) => res.render('pages/additem', { title: 'Add Item' }))
  .post('/additem', pgcontroller.postAddItem)
  .get('/items', pgcontroller.getItemList)
  .get('/items/:emailId', pgcontroller.getItemList)
  .get('/items/:itemId/view', async (req, res) => res.render('pages/item', { item: await pgcontroller.getItem(req.params.itemId), mode: 'view' }))
  .get('/items/:itemId/update', async (req, res) => res.render('pages/item', { item: await pgcontroller.getItem(req.params.itemId), mode: 'edit' }))
  .post('/items/:itemId/purchase', pgcontroller.postPurchaseItem)
  .post('/items/:itemId/update', pgcontroller.postUpdateItem)
  .post('/items/:itemId/delete', pgcontroller.postDeleteItem)

module.exports = APIRouter