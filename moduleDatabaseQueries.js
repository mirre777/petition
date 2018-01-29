//requirespiced-pg
const spicedPg = require('spiced-pg');
//require secrets.json with paasword and user
const {dbUser, dbPass} = require('./secrets.json');
//spiced pg database with passord and user
var db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`);

function insertRegisterData (first, last, email, hashedpassword) {
    const q = `INSERT INTO users_table (first, last, email, hashedPassword) VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [first, last, email, hashedpassword];
    return db.query(q, params)
        .then(function(results) {
            return results.rows[0].id;
        });
}


function getHashedpw (email) {
    const q = `SELECT hashedpassword FROM users_table WHERE email = $1`;
    const params = [email]
    return db.query(q, params)
        .then(function(results) {
            return results.rows[0];
        })
        .catch(function(err) {
            console.log(err)
        });
}


function getUserId(email) {
    const q = `SELECT
    id
    FROM users_table
    WHERE email = $1`
    const params = [email];
    return db.query(q, params)
        .then(function(results) {
            return results.rows[0];
        })
}


// function getRegisterData (userId) {
//     var fullname = `SELECT first, last FROM users_table WHERE id = $1`;
//     return db.query(fullname, [userId])
//         .then(function(result) {
//             return result.rows[0];
//         })
//         .catch(function(err) {
//             console.log('problem in getRegisterData, not getting first and last', err)
//         });
// }
//getting back first and last name for user with this id --> that we just set in insertRegisterData.
//in route pass it request.session.userId


function sign (canvas, user_id) {
    var insertFields = `INSERT INTO petition_data (canvas, user_id) VALUES ($1, $2) RETURNING id`;
    return db.query(insertFields, [canvas, user_id])
        .then(function(result) {
            return result.rows[0].id;
        }).catch(function(err) {
            console.log('problem in sign function', err);
        })
}


function getSignatureId(user_id) {
    const q = `SELECT * FROM petition_data WHERE user_id = $1`;
    const params = [user_id];
    return db.query(q, params)
        .then(function(results) {
            return results.rows[0].canvas
        })
        .catch(function(err) {
            console.log('problem in getSignatureId', err)
        });
}


function getSigners () {
    var fullname = `SELECT
    first, last
    FROM petition_data
    LEFT JOIN users_table
    ON petition_data.user_id = users_table.id`;
    return db.query(fullname)
        .then(function(results) {
            return results.rows;
        })
        .catch(function(err) {
            console.log('problem in getSigners', err);
        });
}


function getUserProfile (user_id) {
    const q = `SELECT
    city, age, website
    FROM users_profile
    WHERE user_id = $1`;
    const params = [user_id];
    return db.query(q, params)
        .then(function(results) {
            console.log(results.rows)
            return results.rows[0];
        })
        .catch(function(err) {
            console.log('problem in getUserProfile', err);
        });
}


function editYourProfile (city, age, website, user_id) {
    const q =
    `INSERT INTO users_profile (city, age, website, user_id) VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET city = $1, age = $2, website = $3
        `;
    const params = [city, age, website, user_id];
    return db.query(q, params)
        .then(function(userprofile) {
            console.log('in edityourprofile, successful edit');

        })
        .catch(function(err) {
            console.log('error in editYourProfile', err);
        });
}


function unsign (user_id) {
    const q = `DELETE canvas WHERE user_id = $1`;
    const params = [user_id];
    return db.query(q, params)
        .then(function(results) {
            console.log('unsign successfull');
        })
        .catch(function(err) {
            console.log('error in unsign', err);
        });
}
//create columns in table
exports.getSigners = getSigners;
exports.sign = sign;
exports.insertRegisterData = insertRegisterData;
exports.getSignatureId = getSignatureId;
exports.getUserId = getUserId;
exports.getHashedpw = getHashedpw;
exports.editYourProfile = editYourProfile;
exports.getUserProfile = getUserProfile;
exports.unsign = unsign;
