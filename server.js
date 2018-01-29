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
var getUserId = require('./moduleDatabaseQueries.js').getUserId;
var getHashedpw = require('./moduleDatabaseQueries.js').getHashedpw;
var editYourProfile = require('./moduleDatabaseQueries.js').editYourProfile;
var getUserProfile = require('./moduleDatabaseQueries.js').getUserProfile;
var unsign = require('./moduleDatabaseQueries.js').unsign;

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

//REGISTER___________________________________________________________
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
                        request.session.email = request.body.email;
                        console.log('user id created')
                        return response.redirect('/petition/');
                    })
                    .catch(function(err) {
                        console.log('error setting id, first, last to the session', err)
                    })
            }).catch(function(err) {
                console.log('error after hashing password' , err)
            });
    }
    else {
        console.log('user already has userId, redirect to /petition');
        response.redirect('/petition');
    }
});


//LOGIN____________________________________________________________________
//app.get('/login')
//login: check if email exists, compare password to make sure request.body.password hash matches the hased password
//.then doesMatch//if doesMatch//

//const q = 'SELECT * FROM petition WHERE email is $1'
//const params = [email]
//db query(q, params).then(results => checkPassword)
app.get('/login', function(request, response) {
    console.log('in app.get /login');
    if (request.session.userId) {
        console.log('user has userId, redirect to /petition')
        return response.redirect('/petition');
    }
    if (request.session.sigId) {
        console.log('user has sigId, redirect to /petition/signed')
        return response.redirect('petition/signed');
    }
    else {
        response.render('login', {
            layout: 'basiclayout',
            css: 'stylesheet.css'
        })
    }
});


app.post('/login', function(request, response) {
    console.log('in app.post /login');
    //hashPassword
    getHashedpw(request.body.email)
        .then(function(hashedPasswordFromDatabase) {
            console.log('this is hashedPasswordFromDatabase', hashedPasswordFromDatabase.hashedpassword);
            checkPassword(request.body.password, hashedPasswordFromDatabase.hashedpassword)
                .then(function(doesMatch){
                    if(doesMatch) {
                        getUserId(request.body.email)
                            .then(function(userId) {
                                request.session.userId = userId;
                                return response.redirect('/petition');
                            })
                            .catch(function(err) {
                                console.log('failed to set userId to session', err);
                            });
                    }
                })
                .catch(function(err) {
                    console.log(err)
                });
        })
        .catch(function(doesNotMatch){
            if(doesNotMatch) {
                response.render('loginERROR', {
                    layout: 'basiclayout',
                    css: 'stylesheet.css'
                });
            }
        });
    //get userid from the table and set userid for the session: function getuserId().then(function(userId) {request.session.userId = userId})

});


//SIGN_____________________________________________________________________
//set signature Id
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
            });

        }
    }
    else {
        response.redirect('/register');
    }
});


app.post('/petition', function (request, response) {
    console.log('in app.post /petition');
    // console.log(request.body);
//send data to server if all field are filled in
    if (request.body.signaturehidden && request.session.userId) {
        sign(request.body.signaturehidden, request.session.userId)
//get back id and turn it into cookie by attaching it to session.
            .then(function(sigId) {
                request.session.sigId = sigId;
                console.log('sigId set');
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


//SIGNED__________________________________________________________________
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


//1 SIGNERS_________________________________________________________________
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


//2 EDIT PROFILE___________________________________________________
app.get('/petition/profile', function(request, response) {
    console.log('in app.get /profile');
    if (!request.session.userId) {
        console.log('user does not have userId');
        return response.redirect('/register');
    }
    else {
        getUserProfile(request.session.userId)
            .then(function(userprofile) {
                console.log('update successful', 'userprofile: ', userprofile);
                response.render('editprofile', {
                    layout: 'basiclayout',
                    css: 'stylesheet',
                    first: request.session.first,
                    last: request.session.last,
                    email: request.session.email,
                    userprofile: userprofile
                    //city, age, favorite website? db query to select all information and fill them in in the fields
                });
            })
            .catch(function(err) {
                console.log('update unsuccessful');
                response.render('editprofileERROR', {
                    layout: 'basiclayout',
                    css: 'stylesheet',
                });
            });
    }
});


app.post('/petition/profile', requireLogIn, function(request, response) {
    console.log('in app.post /profile');
    editYourProfile(request.body.city, request.body.age, request.body.website, request.session.userId)
        .then(function(userprofile) {
            console.log('edityourprofile, profile successfully updated', userprofile);
            return response.redirect('/petition/profile')
        })
        .catch(function(err) {
            console.log('editing profile did not work', err);
        });
});


app.post('/petition/unsign', requireLogIn, requireSignature, function(request, response) {
    console.log('in app.post /petition/unsign');
    unsign(request.session.userId)
        .then(function(unsigned) {
            console.log('unsigned');
            return response.render('firstpagecontentUNSIGNED', {
                layout: 'basiclayout',
                css: 'stylesheet'
            });
        })
        .catch(function(stillsigned) {
            console.log('not unsigned');
        });
});

//3 UNSIGN_________________________________________________________
//NOTES____________________________________________________________
//promise, with resolve, reject in module
//then catch in this route
//response.render the contentpage (loopng through return of db query ARRAY of names), or placig a partial in the contenpage where i loop throught eh return db query, array ofnames + basiclayout


//FUNCTIONS______________________________________________________


//if !request.cookies.signed, redirect
function requireSignature(request, response, next) {
    if (!request.session.sigId) {
        console.log('in requireSignature, user does not have sigId, redirect to /petition');
        response.redirect('/petition');
    }
    else {
        next();
    }
}
function requireLogIn(request, response, next) {
    if (!request.session.userId) {
        console.log('in requireLogIn, user does not have userId, redirect to /register');
        response.redirect('/register');
    }
    else {
        next();
    }
}
