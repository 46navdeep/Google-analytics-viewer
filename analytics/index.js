var express = require('express');
var Session = require('express-session');
var google = require('googleapis');
var bodyParser = require('body-parser');
var analytics = google.analytics('v3');
var OAuth2 = google.auth.OAuth2;
const ClientId =
  '656474374626-0n27ji281fvhjq6kda38heeilruk5erh.apps.googleusercontent.com';
const ClientSecret = 'Ww8o3Muzb9gVfiMlL2L89IS2';
const RedirectionUrl = 'http://localhost:8083/oauth2callback';

var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  Session({
    secret: 'raysources-secret-19890913007',
    resave: true,
    saveUninitialized: true
  })
);

function getOAuthClient() {
  return new OAuth2(ClientId, ClientSecret, RedirectionUrl);
}

function getAuthUrl() {
  var oauth2Client = getOAuthClient();
  var scopes = ['https://www.googleapis.com/auth/analytics.readonly'];

  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  return url;
}

app.use('/oauth2Callback', function(req, res) {
  var oauth2Client = getOAuthClient();
  var session = req.session;
  var code = req.query.code;
  oauth2Client.getToken(code, function(err, tokens) {
    console.log('tokens : ', tokens);
    if (!err) {
      oauth2Client.credentials = tokens;
      // res.redirect('/');
      session['tokens'] = tokens;
      res.send(`
                <html>
                <body>
                    <h3>Login successful!!</h3>
                    <br>
                    <a href='/details'>See Views</a>
                <body>
                <html>
            `);
    } else {
      res.send(`
                <html>
                <body>
                    <h3>Login failed!!</h3>
                </body>
                </html>
            `);
    }
  });
});

app.use('/details', function(req, res) {
  var oauth2Client = getOAuthClient();
  oauth2Client.credentials = req.session['tokens'];

  var p = new Promise(function(resolve, reject) {
    analytics.management.profiles.list(
      { accountId: '~all', webPropertyId: '~all', auth: oauth2Client },
      function(err, response) {
        // console.log('response : ', response);
        resolve(response || err);
      }
    );
  }).then(function(data) {
    var views = [];
    for (var i = 0; i < data.items.length; i++) {
      views.push({
        name: data.items[i].name,
        id: data.items[i].id,
        accountId: data.items[i].accountId,
        webPropertyId: data.items[i].webPropertyId
      });
    }
    // var nm = names.toString();
    console.log(data);
    res.render('pages/accounts', { posts: views,
    info:data });
    // res.send(data);
  });
});

app.use('/reports', function(req, res) {
  var oauth2Client = getOAuthClient();
  oauth2Client.credentials = req.session['tokens'];

  // if (localStorage.getItem('ID')) {
  // var obj = JSON.parse(localStorage.getItem('ob'));
  console.log(req.body.Id);
  var p = new Promise(function(resolve, reject) {
    analytics.data.ga.get(
      {
        ids: 'ga:' + req.body.Id,
        'start-date': '7daysAgo',
        'end-date': 'yesterday',
        metrics: 'ga:sessions,ga:pageviews,ga:sessionsPerUser',
        auth: oauth2Client
      },
      function(err, response) {
        //console.log('response : ', response);
        // console.log('error : ', err);
        resolve(response || err);
      }
    );
  }).then(function(data) {
     res.send(data);
     res.end();
  });

});

app.use('/', function(req, res) {
  var url = getAuthUrl();
  res.send(`
        <html>
        <body>
<h1>Authenticate using Google</h1>
<div align='centre'>
        <a href=${url}><button background-color='#f44336'>Login</button></a>
</div>
        </body>
        </html>
    `);
});

app.listen(8083);
