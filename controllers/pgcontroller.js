const e = require('express')
const { Pool } = require('pg')
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 60000,
    idleTimeoutMillis: 30000
})

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    client.release()
})

function formatEmail(email) {
    emailparts = email.split(/\@/)
    emailparts[0] = emailparts[0].replace(/\./g, '')
    email = emailparts.join('@')
    return email
}

function getUser(email) {
    return new Promise((resolve) => { 
        pool.connect((err, client, done) => {
            email = formatEmail(email)

            if (err) throw err
            client.query('SELECT email_id, name FROM app_user WHERE LOWER(email_id) = LOWER($1)', [email], (err, res) => {
                if (err) { done(); throw err }
                done(), resolve(res.rows[0])
            })
        })
    })
}

async function isUser(email) {
    const user = await getUser(email)
    if (user) return true
    return false
}

function addUser(email, name) {
    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) { done(); throw err }
            email = formatEmail(email)

            client.query('INSERT INTO app_user(email_id, name) VALUES ($1, $2) RETURNING *', [email, name], (err, res) => {
                if (err) { done(); throw err }
                done(), resolve(res.rows)
            })
        })
    })
}

function updateUser(account) {
    return new Promise((resolve) => {
        pool.connect(async (err, client, done) => {
            if (err) throw err
            const email = formatEmail(account.email)
            const name = account.name
            
            client.query('UPDATE app_user SET name = $1 WHERE email_id = $2', [name, email], (err, res) => {
                done()
                if (err) {
                    console.log(err.stack)
                } else {
                    resolve(res.rows[0])
                }
            })
        })
    })
}

function postAddGroup(req, response) {
    const email = req.session.account.email
    const name = req.body.name
    const description = req.body.description
    const memberList = req.body.memberList?.split(/\s*(;|\r\n|\r|\n)\s*/) || []

    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO app_group(name, description) VALUES ($1, $2) RETURNING *', [name, description], async (err, res) => {
                if (err) { done(); throw err }
                const group_id = res.rows[0].id
                if (!memberList.includes(email)) memberList.push(email)
                
                for (const member of memberList) {
                    if (!await isUser(member)) addUser(member)
                    const user = await getUser(member)

                    client.query('INSERT INTO group_membership(group_id, member_email_id) VALUES ($1, $2)', [group_id, user.email_id], (err, res) => {
                        if (err) { done(); throw err }
                    })
                }

                done(), resolve(res.rows)
                response.redirect('/')
            })
        })
    })
}

function postAddItem(req, response) {
    const email = req.session.account.email
    const group_id = req.body.groupId || null
    const title = req.body.title
    const link = req.body.link || null
    const description = req.body.description || null

    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO item(member_email_id, group_id, title, link, description) VALUES ($1, $2, $3, $4, $5) RETURNING *', [email, group_id, title, link, description], (err, res) => {
                if (err) throw err
                resolve(res.rows), response.redirect(req.body.redirecturl || '/')
            })
        })
    })
}

function getGroup(groupId) {
    return new Promise((resolve) => { 
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('SELECT id, name FROM app_group WHERE id = $1', [groupId], (err, res) => {
                if (err) { done(); throw err }
                done(), resolve(res.rows[0])
            })
        })
    })
}

function getMyGroups(req, response, next) {
    if (!req.session.signedin) { next(); return }

    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            const email = formatEmail(req.session.account.email)
            client.query('SELECT gm.group_id, g.name FROM group_membership AS gm JOIN app_group AS g ON gm.group_id = g.id WHERE LOWER(gm.member_email_id) = LOWER($1)', [email], (err, res) => {
                done()
                if (err) {
                    console.log(err.stack)
                } else {
                    response.locals.mygroups = res.rows
                    resolve(), next()
                }
            })
        })
    })
}

function getItems(email) {
    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            email = formatEmail(email)
            client.query('SELECT i.id, i.member_email_id, i.group_id, g.name AS group_name, i.title, i.link, i.description, i.purchased FROM item AS i LEFT JOIN app_group AS g ON i.group_id = g.id WHERE LOWER(i.member_email_id) = LOWER($1) ORDER BY i.id', [email], (err, res) => {
                done()
                if (err) {
                    console.log(err.stack)
                } else {
                    console.log(res.rows)
                    resolve(res.rows)
                }
            })
        })
    })
}

function getItemList(req, response) {
    const email = req.params.emailId || req.session.account.email
    getItems(email)
        .then(async (items) => {
            const user = await getUser(email) || {}
            response.render('pages/itemlist', { 
                title: (user.name ? user.name : user.email_id) + ' - Items',
                user: user, 
                itemList: items 
            })
        })
}

function postPurchaseItem(req, response) {
    pool.connect(async (err, client, done) => {
        if (err) throw err
        const itemId = req.params.itemId
        
        client.query('UPDATE item SET purchased = TRUE WHERE id = $1', [itemId], (err, res) => {
            done()
            if (err) {
                console.log(err.stack)
            } else {
                response.redirect(req.body.redirecturl || '')
            }
        })
    })
}

function getGroupMemberList(req, response) {
    pool.connect(async (err, client, done) => {
        if (err) throw err
        const email = formatEmail(req.session.account.email)
        const groupId = req.params.groupId
        const group = await getGroup(groupId)
        client.query('SELECT u.name, u.email_id FROM app_user AS u JOIN group_membership AS gm ON u.email_id = gm.member_email_id WHERE gm.group_id = $1', [groupId], async (err, res) => {
            done()
            if (err) {
                console.log(err.stack)
            } else {
                response.render('pages/group', {memberList: res.rows, group: await getGroup(groupId) })
            }
        })
    })
}

exports.addUser = addUser
exports.getUser = getUser
exports.isUser = isUser
exports.formatEmail = formatEmail

exports.updateUser = updateUser

exports.postAddItem = postAddItem
exports.postAddGroup = postAddGroup
exports.postPurchaseItem = postPurchaseItem
exports.getMyGroups = getMyGroups

exports.getItemList = getItemList
exports.getGroupMemberList = getGroupMemberList