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
    const memberList = req.body.memberList?.split(/\s*[;\r|\n]+\s*/).filter(email => email !== '') || []
    if (!memberList.includes(email)) memberList.push(email)

    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO app_group(name, description) VALUES ($1, $2) RETURNING *', [name, description], async (err, res) => {
                if (err) { done(); throw err }
                const group_id = res.rows[0].id
                
                for (const member of memberList) {
                    if (!await isUser(member)) await addUser(member)
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
    const email = formatEmail(req.session.account.email)
    const group_id = req.body.groupId || null
    const title = req.body.title
    const link = req.body.link || null
    const description = req.body.description || null

    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO item(member_email_id, group_id, title, link, description) VALUES ($1, $2, $3, $4, $5) RETURNING *', [email, group_id, title, link, description], (err, res) => {
                if (err) { done(); throw err }
                done(), resolve(res.rows[0]), response.redirect(req.body.redirecturl || '/')
            })
        })
    })
}

function postUpdateItem(req, response) {
    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            const itemId = req.params.itemId
            const title = req.body.title
            const link = req.body.link
            const description = req.body.description
            const groupId = req.body.groupId

            client.query('UPDATE item SET title = $1, link = $2, description = $3, group_id = $4 WHERE id = $5', [title, link, description, groupId, itemId], (err, res) => {
                if (err) { done(); throw err }
                done(), resolve(res.rows[0])
                response.redirect('/items/' + itemId + '/view')
            })
        })
    })
}

function postDeleteItem(req, response) {
    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            const itemId = req.params.itemId

            client.query('DELETE FROM item WHERE id = $1', [itemId], (err, res) => {
                if (err) { done(); throw err }
                done(), resolve(res.rows[0])
                response.redirect('/items')
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
            client.query('SELECT g.id, g.name FROM group_membership AS gm JOIN app_group AS g ON gm.group_id = g.id WHERE LOWER(gm.member_email_id) = LOWER($1)', [email], (err, res) => {
                done()
                if (err) {
                    console.error(err.stack)
                } else {
                    response.locals.mygroups = res.rows
                    resolve(), next()
                }
            })
        })
    })
}

function ViewItemAccessControl(user) {
    return `JOIN group_membership AS gm ON item.group_id = gm.group_id WHERE gm.member_email_id = '${user.email}'`
}

function EditItemAccessControl(user) {
    return `WHERE member_email_id = '${user.email}'`
}

function ViewGroupAccessControl(user) {
    return `JOIN group_membership AS gm ON app_group.id = gm.group_id WHERE gm.member_email_id = '${user.email}'`
}

function ViewUserAccessControl(user) {
    return `JOIN group_membership AS gm ON app_user.email_id = gm.member_email_id JOIN group_membership AS gm2 ON gm.group_id = gm2.group_id WHERE (gm2.member_email_id = '${user.email}' OR app_user.email_id = '${user.email}')`
}

function NoAccessControl(user) {
    return ''
}

function AccessControl(name) {
    switch (name) {
        case 'edit_item': return EditItemAccessControl;
        case 'view_item': return ViewItemAccessControl;
        case 'view_group': return ViewGroupAccessControl;
        case 'view_user': return ViewUserAccessControl;
        case 'none': return NoAccessControl;
    }

    return null;
}

function post(tablename, accessControl) {
    return async(req, res, next) => {
        query(tablename, req.query, req.session.account, accessControl)
            .then((rows) => {
                if (rows) {
                    // TODO update item(s)
                    res.end(JSON.stringify({ message: "TODO update item(s)", data: rows, update: req.body }))
                }
            })
            .catch(next)
    }
}

function get(tablename, accessControl) {
    return async(req, res, next) => {
        query(tablename, req.query, req.session.account, accessControl)
            .then((rows) => res.send(JSON.stringify({ data: rows })))
            .catch(next)
    }
}

async function query(tablename, params, account, accessControl) {
    if (typeof accessControl !== 'function') throw "No access Control provided. Must provide Access Control function"
    const { select, filter } = parseQuery(params)
    select && await verifyColumns(tablename, select)

    return new Promise((resolve, reject) => {
        pool.connect((err, client, done) => {
            if (err) { done(); reject(err); return; };
            const ac = accessControl(account)
            const qry = `SELECT DISTINCT(${tablename}.id), ${select ? select.map(col => `${tablename}.${col}`).join(',') : `${tablename}.*`} FROM ${tablename} ${ac} ${ac ? (filter.toString(tablename) ? 'AND' : '') : (filter.toString(tablename) ? 'WHERE' : '')} ${filter.toString(tablename) ? `${filter.toString(tablename)}` : ''}`
            // console.log(query)
            client.query(qry, [], (err, res) => {
                done(); if (err) { reject(err); return; };
                res.rows.forEach((row) => { if(select && !select.includes('id')) { delete row.id }})
                resolve(res.rows);
            })
        })
    })
}

function parseQuery({ $select, $filter, $group, $order }) {
    const select = parseSelect($select)
    const filter = parseFilter($filter)

    return { select, filter }
}

const WhiteSpace = `(\\s+)`
class SimpleFilter {
    static get Ops() { return `(EQ|NE|LT|LE|GT|GE)` }
    static get Operands() { return `('.*?(?<!\\\\)'|[0-9]+\\.?[0-9]+|\\w+)` }
    static get ColumnFormat() { return `[^\\d](\\w+)` }
    static get OpConversion() {
        return { "EQ": "=", "NE": "<>", "LT": "<", "LE": "<=", "GT": ">", "GE": ">=" }
    }
    lhs; op; rhs;
    
    constructor() {}

    verify() {
        if (!this.full()) { 
            console.error(this)
            throw "Malformatted Filter - Simple" 
        }
    }

    full() {
        return this.lhs && this.op && this.rhs
    }

    isColumn(str) {
        return new RegExp(`^${SimpleFilter.ColumnFormat}$`).test(str)
    }

    toString(prefix) {
        return `${this.isColumn(this.lhs)?`${prefix}.${this.lhs}`:this.lhs} ${SimpleFilter.OpConversion[this.op.toUpperCase()]} ${this.isColumn(this.rhs)?`${prefix}.${this.rhs}`:this.rhs}`
    }

    static fromFilterString(filter) {
        const simplefilter = new SimpleFilter();
        let match = null;
        
        while (!simplefilter.full() && !/^$/.test(filter)) {
            ;({ filter, match } = consume(filter, WhiteSpace));
            
            // Operators (EQ, NE, etc.)
            if (({ filter, match } = consume(filter, SimpleFilter.Ops)) && match) {
                simplefilter.op = match;
            }

            // Operands (strings, column names, numbers)
            else if (({ filter, match } = consume(filter, SimpleFilter.Operands)) && match) {
                if (!simplefilter.lhs) { simplefilter.lhs = match; }
                else { simplefilter.rhs = match; }
            }

            // Other Values should not be present
            else {
                throw `Malformatted Filter: ${filter}`;
            }
        }
    
        simplefilter.verify();
        return { filter, simplefilter };
    }
}

class FilterGroup {
    static get GroupStart() { return `(\\()` }
    static get GroupEnd() { return `(\\))` }
    static get GroupOps() { return `(AND|OR)` }
    ops = []; operands = [];
    constructor () {}

    addOp(op) {
        this.ops.push(op)
    }

    addOperand(operand) {
        this.operands.push(operand)
    }

    verify() {
        if (this.ops.length !== (this.operands.length-1)) {
            throw `Malformatted Group Filter: ${JSON.stringify(this)}`
        }
    }

    toString(prefix) {
        if (!this.operands.length) { return '' }
        const filterstring = this.operands.map((filter, i) => {
            return `${filter.toString(prefix)}${this.ops.length > 0 && this.ops.length != i ? ` ${this.ops[i]} ` : ''}`
        }).join('');

        return `(${filterstring})`
    }

    static fromFilterString(filter) {
        let group = new FilterGroup();
        let match = null;
    
        while(!/^$/.test(filter)) {
            // remove leading whitespace
            ;({ filter, match } = consume(filter, WhiteSpace));
    
            // beginning of a group
            if (({ filter, match } = consume(filter, FilterGroup.GroupStart)) && match) {
                const sub = FilterGroup.fromFilterString(filter)
                filter = sub.filter; group.addOperand(sub.group)
            }
    
            // end of a group
            else if (({ filter, match } = consume(filter, FilterGroup.GroupEnd)) && match) {
                return { group, filter } 
            }
    
            // group operands
            else if (({ filter, match } = consume(filter, FilterGroup.GroupOps)) && match) {
                group.addOp(match);
            }
    
            // simple filter
            else {
                let simplefilter = null;
                ;({ filter, simplefilter } = SimpleFilter.fromFilterString(filter));
                group.addOperand(simplefilter);
            }
        }
    
        group.verify()
        return { group, filter }
    }
}

function consume(filter, regexstring) {
    const regex = new RegExp(`^${regexstring}(.*)$`, 'i');
    const res = regex.exec(filter);

    filter = res ? (res[2] ? res[2] : (res[2] === '' ? '' : filter)) : filter;
    return { filter: filter, match: res && res[1] };
}

function parseFilter(filter) {
    if (!filter) return new FilterGroup()
    const { group } = FilterGroup.fromFilterString(filter);
    return group;
}

function parseSelect(selectColumns) {
    if (!selectColumns) return '';
    return selectColumns.split(/\s*,\s*/).map(column => column.trim()).filter(column => column)
}

function verifyColumn(tablename, column) {
    return new Promise(async (resolve, reject) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('SELECT column_name FROM information_schema.columns WHERE table_name=$1 and column_name=$2', [tablename, column], (err, res) => {
                done()
                if (err) {
                    console.log(err.stack)
                } else {
                    if (res.rows.length !== 1) {
                        reject(`Column '${column}' does not exist on '${tablename}'`)
                    } else {
                        resolve(res.rows)
                    }
                }
            })
        })
    }) 
}

function verifyColumns(tablename, columnsArray) {
    return new Promise(async (resolve, reject) => {
        let promises = []
        for (col of columnsArray) {
            promises.push(verifyColumn(tablename, col))
        }
        Promise.all(promises)
            .then(() => { resolve(true) })
            .catch((err) => { reject(err) })
    });
}

function selectQuery(tablename, req) {
    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) { resolve({ error: err }); return; }
            client.query()
        })
    })
}

function getItem(id) {
    return new Promise((resolve) => {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('SELECT id, member_email_id, group_id, title, link, description, purchased FROM item WHERE id = $1', [id], (err, res) => {
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
            response.end(JSON.stringify(items, null, 3)); return;

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

exports.parseColumns = parseSelect
exports.verifyColumns = verifyColumns
exports.parseQuery = parseQuery
exports.get = get
exports.post = post
exports.AccessControl = AccessControl

exports.addUser = addUser
exports.getUser = getUser
exports.isUser = isUser
exports.formatEmail = formatEmail

exports.updateUser = updateUser

exports.getItem = getItem
exports.postAddItem = postAddItem
exports.postUpdateItem = postUpdateItem
exports.postDeleteItem = postDeleteItem

exports.postAddGroup = postAddGroup
exports.postPurchaseItem = postPurchaseItem
exports.getMyGroups = getMyGroups

exports.getItemList = getItemList
exports.getGroupMemberList = getGroupMemberList