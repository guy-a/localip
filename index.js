var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var sg_user = process.env.SENDGRID_USERNAME || 'sendgrid_user',
    sg_pass = process.env.SENDGRID_PASSWORD || 'sendgrid_password';
var sendgrid  = require('sendgrid')(sg_user, sg_pass);


app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.post('/send', function(req, res) {

  //console.log('req.body', req.body);

  var ips = req.body.ips;
  var screen = req.body.screen;

  var text = ' local: ' + ips.local +
      '\n public: ' + ips.public +
      '\n ipv6: ' + ips.ipv6 +
      '\n reg.ip: ' + req.ip +
       '\n reg.user-agent: ' + req.headers['user-agent'] +
       '\n screen: ' + screen[0] + ', ' + screen[1];

  var subject = 'The fish is in the net ' + ips.local;

  sendgrid.send({
    to:       'your_email_goes_here@gmail.com',
    from:     'your_email_goes_here@gmail.com',
    subject:  subject,
    text:     text
  }, function(err, json) {
    if (err) {
      res.error(err);
      return console.error(err);
    }
    console.log(json);
    res.json(json)
  });
})

app.get('*', function(req, res) {
  res.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


