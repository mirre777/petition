var pg = require('spiced-pg');
var express = require('express');
var app = express();
var hb = require('express-handlebars');
var sign = require('./moduleDatabaseQueries.js').sign;
var getSigners = require('./moduleDatabaseQueries.js').getSigners;
var hashPassword = require('./passwordModule.js').hashPassword;
var checkPassword = require('./passwordModule.js').checkPassword;
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require ('body-parser');
const spicedPg = require('spiced-pg');
var db = spicedPg('postgres:${dbUSer}:${dbPass}@localhost:5432/petition');


app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(cookieSession ({
    secret: require('./secrets.json').sessSecret,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));
//function of sessScret is adding making itmore complicated to get the signature with user id and hash. You are adding a random string to the signature.
app.use(bodyParser.urlencoded ({
    extended: false
}));
app.listen(8080, function(){
    console.log('listening..');
});

//____________________________________________________________

//register user
// app.get('/login', function(request, response) {
//     console.log('in app.get/login');
//     response.render('register', {
//         layout: 'basiclayout',
//         css: 'stylesheet.css'
//     });
//     hashPassword(request.body.password)
//         .then(function(hashedPassword) {
//             console.log(hashedPassword);
//             const q = `INSERT INTO users (first, last, email, hashedPassword) VALUES ($1, $2, $3, $4) RETURNING id`
//             const params = [request.body.first, request.body.last, request.body.email, hashPassword];
//             db.query(q, params)
//                 .then(function(results) {
//                     console.log('inserted', results.rows);
//                 });
//         });
// //if:
// //already has user id, then response.redirect to /petition
// //already has signedCookie (session.sigId), redirect to /petition/signed
// });
//
//
// //db query to see if entered password and hashed pasword match
// app.post('/login', function(request, response) {
//     console.log('in app.post/login');
//     //const q = 'SELECT * FROM petition WHERE email is $1'
//     //const params = [email]
//     //db query(q, params).then(results => checkPassword)
// });


//set cookie/session Id
//request.cookies.cookieSet is now request.session.sigId
//don't check for NOT cookie, because it would redirect them to /petition again, ust check for DO have cookie, then redirect to petition/signed.
app.get('/petition', function(request, response) {
    console.log('in app.get /petition');
    if (request.session.sigId) {
        return response.redirect('/petition/signed');

    }
    else {
        response.render('firstpagecontent', {
            layout: 'basiclayout',
            css:'stylesheet.css'
        });
    }
});

//db query
app.post('/petition', function (request, response) {
    console.log(request.body);
//send data to server if all field are filled in
    if (request.body.firstname && request.body.lastname && request.body.canvas) {
        sign(request.body.firstname, request.body.lastname, request.body.canvas)
//get back id and turn it into cookie by attaching it to session.
            .then(function(sigId) {
                request.session.sigId = sigId;
                response.redirect('/petition/signed');
            })
            .catch(function(err) {
                console.log('not clean');
                response.statusCode = 404;
            });
    }
    else {
        response.redirect('/petition');
        response.render('firstpagecontentERROR', {
            layout: 'basiclayout',
            css:'stylesheet.css'
        });
    }
});


//received data (submit) in databse: error, succes: create a row for the user
//cookies
//don't check for NOT cookieSet, because it would redirect them to /petition again, ust check for DO have cookieSet, then redirect to petition/signed.
app.get('/petition/signed', requireSignature, function(request, response) {
    console.log('in app.get /petition/signed');
    response.render('secondpagecontent', {
        layout: 'basiclayout',
        css:'stylesheet.css'
    });
});


app.get('/petition/signers', requireSignature, function(request, response) {
    console.log('in app.get /petition/signed');
    response.render('thirdpagecontent', {
        layout: 'basiclayout',
        css:'stylesheet.css'
    });
    response.body.getSigners;
});


//functions we need in multiple paths______________________________________________________


//if !request.cookies.signed, redirect
function requireSignature(request, response, next) {
    if (!request.session.sigId) {
        response.redirect('/petition');
    }
    else {
        next();
    }
}
