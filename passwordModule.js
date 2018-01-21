var bcrypt = require('bcryptjs');

function hashPassword (plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject(err);
            }
            bcrypt.hash(plainTextPassword, salt, function(err, hashedPassword) {
                if (err) {
                    return reject(err);
                }
                resolve(hashedPassword);
            });
        });
    });
}
//no else, because the return in the if wil stop the function
function checkPassword (textInLoginForm, hashedPasswordFromDatabase) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(textInLoginForm, hashedPasswordFromDatabase, function(doesNotMatch, doesMatch) {
            if (doesNotMatch) {
                reject(doesNotMatch);
            }
            else {
                resolve(doesMatch);
            }
        });
    });
}
//get hashedPasswordFromDatabase from database (query)
//get textinloginform: val(loginform)
exports.hashPassword = hashPassword;
exports.checkPassword = checkPassword;
