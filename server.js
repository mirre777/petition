var pg = require('spiced-pg');
var express = require('express');
var app = express();
var hb = require('express-handlebars');
var sign = require('./moduleDatabaseQueries.js').sign;
var getSigners = require('./moduleDatabaseQueries.js').getSigners;
var insertRegisterData = require('./moduleDatabaseQueries.js').insertRegisterData;
var getSignatureId = require('./moduleDatabaseQueries.js').getSignatureId;
var hashPassword = require('./passwordModule.js').hashPassword;
var checkPassword = require('./passwordModule.js').checkPassword;

var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require ('body-parser');


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

//ROUTES____________________________________________________________

//register user
app.get('/register', function(request, response) {
    console.log('in app.get/register');
    response.render('register', {
        layout: 'basiclayout',
        css: 'stylesheet.css'
    });
//if: set user id? how do you create: user id? where do you checkpassword?
//already has user id, then response.redirect to /petition
//already has signedCookie (session.sigId), redirect to /petition/signed
});


//db query to see if entered password and hashed pasword match
app.post('/register', function(request, response) {
    console.log('in app.post/register');
    if (!request.session.userId) {
        console.log('user does not have userId, render registration form');
        hashPassword(request.body.password)
            .then(function(hashedPassword) {
                insertRegisterData(request.body.first, request.body.last, request.body.email, hashedPassword)
                    .then(function(userId) {
                        request.session.userId = userId;
                        request.session.first = request.body.first;
                        request.session.last = request.body.last;
                        console.log('user id created')
                        return response.redirect('/petition/');
                    });
            }).catch(function(err) {
                console.log('error in post/register' , err)
            });
    }
    else {
        console.log('user alread has userId, redirect to /petition');
        response.redirect('/petition');
    }
    //const q = 'SELECT * FROM petition WHERE email is $1'
    //const params = [email]
    //db query(q, params).then(results => checkPassword)
});


//set cookie/session Id
//request.cookies.cookieSet is now request.session.sigId
//don't check for NOT cookie, because it would redirect them to /petition again, ust check for DO have cookie, then redirect to petition/signed.
app.get('/petition', function(request, response) {
    console.log('in app.get /petition');
    if(request.session.userId) {
        if (request.session.sigId) {
            console.log('user has signature id, redirect to signed page')
            return response.redirect('/petition/signed');
        }
        else {
            console.log('user doesnt have signature id, rendering signing page: firstpagecontent.handlebars')
            response.render('firstpagecontent', {
                first: request.session.first,
                last: request.session.last,
                layout: 'basiclayout',
                css:'stylesheet.css'

                ////prefill in the request.session.first and request.session.last. or add in data
            });

        }
    }
    else {
        response.redirect('/register');
    }
});


//db query
app.post('/petition', function (request, response) {
    console.log(request.body);
//send data to server if all field are filled in
    if (request.body.signaturehidden && request.session.userId) {
        sign(request.body.signaturehidden, request.session.userId)
//get back id and turn it into cookie by attaching it to session.
            .then(function(sigId) {
                request.session.sigId = sigId;
                console.log('sigId set', sigId);
                response.redirect('/petition/signed');
            })
            .catch(function(err) {
                console.log('not clean');
                response.statusCode = 404;
            });
    }
    else {
        response.render('firstpagecontentERROR', {
            layout: 'basiclayout',
            css:'stylesheet.css'
        });
    }
});


//app.get('/login')
//login: check if email exists, compare password to make sure request.body.password hash matches the hased password
//.then doesMatch//if doesMatch//

//received data (submit) in databse: error, succes: create a row for the user
//cookies
//don't check for NOT cookieSet, because it would redirect them to /petition again, ust check for DO have cookieSet, then redirect to petition/signed.
app.get('/petition/signed', requireSignature, function(request, response) {
    console.log('in app.get /petition/signed');
    if (request.session.sigId && request.session.userId) {
        console.log('user has sigId and userId, run getSignatureId to show signature as an image');
        getSignatureId(request.session.userId)
            .then(function(signatureImage) {
                response.render('secondpagecontent', {
                    layout: 'basiclayout',
                    css:'stylesheet.css',
                    signatureImage: signatureImage
                });
            })
            .catch(function(err) {
                console.log('error in get route of petition/signed', err)
            });
    }
});


app.get('/petition/signers', requireSignature, function(request, response) {
    console.log('in app.get /petition/signers');
    if(request.session.userId) {
        getSigners()
            .then(function(signers) {
                console.log(signers);
                response.render('thirdpagecontent', {
                    layout: 'basiclayout',
                    css:'stylesheet.css',
                    signers: signers
                });
            })
            .catch(function(err) {
                console.log('error in post route of petition/signers', err)
            });
    }
    else {
        response.redirect('/register');
    }
});
//join tables
//

//promise, with resolve, reject in module
//then catch in this route
//response.render the contentpage (loopng through return of db query array of names), or placig a partial in the contenpage where i loop throught eh return db query, array ofnames + basiclayout


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
