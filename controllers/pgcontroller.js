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
    //   process.exit(-1)
})

// callback - checkout a client
// pool.connect((err, client, done) => {
//     if (err) throw err
//     client.query('SELECT * FROM users WHERE id = $1', [1], (err, res) => {
//         done()
//         if (err) {
//             console.log(err.stack)
//         } else {
//             console.log(res.rows[0])
//         }
//     })
// })

function formatEmail(email) {
    console.debug('email: ', email)
    emailparts = email.split(/\@/)
    emailparts[0] = emailparts[0].replace(/\./, '')
    email = emailparts.join('@')
    console.debug('formatted email: ', email)
    return email
}

function getUser(email) {
    return new Promise((resolve) => { 
        pool.connect((err, client, done) => {
            email = formatEmail(email)

            if (err) throw err
            client.query('SELECT email_id, name FROM app_user WHERE LOWER(email_id) = LOWER($1)', [email], (err, res) => {
                if (err) { done(); throw err }
                console.log(res.rows)

                done(), resolve(res.rows)
            })
        })
    })
}

async function isUser(email) {
    const users = await getUser(email)
    if (users.length === 1) return true
    return false
}

function addUser(email, name) {
    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) { done(); throw err }
            email = formatEmail(email)

            client.query('INSERT INTO app_user(email_id, name) VALUES ($1, $2) RETURNING *', [email, name], (err, res) => {
                if (err) { done(); throw err }
                console.log(res.rows)
                
                done(), resolve(res.rows)
            })
        })
    })
}

function postAddGroup(req, response) {
    const email = req.session.account.email
    const name = req.body.name
    const description = req.body.description
    const memberList = req.body.memberList?.split(/\s*(;|\r\n|\r|\n)\s*/) || []
    console.log('memberList: ', memberList)
    // console.log('req: ', req)

    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO app_group(creator_email_id, name, description) VALUES ($1, $2, $3) RETURNING *', [email, name, description], async (err, res) => {
                if (err) { done(); throw err }
                console.log(res.rows)
                const group_id = res.rows[0].id
                if (!memberList.includes(email)) memberList.push(email)
                
                for (const member of memberList) {
                    console.debug('member: ', member)
                    if (!await isUser(member)) addUser(member)
                    const user = (await getUser(member))[0]

                    client.query('INSERT INTO group_membership(group_id, member_email_id) VALUES ($1, $2)', [group_id, user.email_id], (err, res) => {
                        if (err) { done(); throw err }
                        console.log(res.rows)
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
    const group_id = req.body.group_id
    const title = req.body.title
    const link = req.body.link
    const description = req.body.description

    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO item(member_email_id, group_id, title, link, description) VALUES ($1, $2, $3, $4, $5) RETURNING *', [email, group_id, title, link, description], (err, res) => {
                if (err) throw err
                console.log(res.rows)
                resolve(res.rows), response.redirect('/')
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
                    console.log(res.rows)
                    response.locals.mygroups = res.rows
                    resolve(), next()
                }
            })
        })
    })
}

function getMyItems(req, response) {
    pool.connect((err, client, done) => {
        if (err) throw err
        const email = formatEmail(req.session.account.email)
        client.query('SELECT id, member_email_id, group_id, title, link, description FROM item WHERE LOWER(member_email_id) = LOWER($1)', [email], (err, res) => {
            done()
            if (err) {
                console.log(err.stack)
            } else {
                console.log(res.rows)
                response.locals.myitems = res.rows
                response.render('pages/item')
            }
        })
    })
}

function getGroup(req, response) {
    pool.connect((err, client, done) => {
        if (err) throw err
        const email = formatEmail(req.session.account.email)
        const groupId = req.params.groupId
        client.query('SELECT u.name, u.email_id FROM app_user AS u JOIN group_membership AS gm ON u.email_id = gm.member_email_id WHERE gm.group_id = $1', [groupId], (err, res) => {
            done()
            if (err) {
                console.log(err.stack)
            } else {
                console.log(res.rows)
                response.locals.memberList = res.rows
                response.render('pages/group')
            }
        })
    })
}

exports.addUser = addUser
exports.getUser = getUser
exports.isUser = isUser

exports.postAddItem = postAddItem
exports.postAddGroup = postAddGroup
exports.getMyGroups = getMyGroups

exports.getMyItems = getMyItems
exports.getGroup = getGroup