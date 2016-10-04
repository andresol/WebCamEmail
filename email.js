var fs = require('fs'),
    request = require('request'),
    nodemailer = require('nodemailer'),
    express = require('express'),
    bodyParser = require('body-parser'),
    uuid = requi re('node-uuid'),
    http = require('http');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var sid = uuid.v4(),
    gmailUser = '',
    gmailPass = '',
    fromEmail = "",
    toEmail = "",
    passwordWebCam = '',
    camHost = "";

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: gmailUser,
        pass: gmailPass
    }
});

var mailOptions = {
    from: fromEmail,
    to: toEmail, // list of receivers
    subject: 'RingeKlokka',
    text: 'Ringeklokka',
    html: 'Bilde: <img src="cid:' + sid + '"/>',
    attachments: [{
            filename: 'email.jpg',
            path: '/opt/email/email.jpg',
            cid: sid //same cid value as in the html img src
        }]
        // html body
};
var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
        if (err) {
            console.log(err);
            return;
        }
        request({
                url: uri,
                user: 'admin',
                pass: passwordWebCam
            })
            .pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};


app.post('/', function(req, res) {
    sid = uuid.v4();
    http.get({
        host: camHost,
        path: '/web/cgi-bin/hi3510/param.cgi?cmd=snap'
    }, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(d) {
            console.log(d);
            var rePattern = new RegExp(/var path=\"(.*)\"/);
            var arrMatches = d.match(rePattern);
            if (arrMatches == null || arrMatches.length != 2) {
                return;
            }
            var url = "http://" + camHost + arrMatches[1];

            download(url, '/opt/email/email.jpg', function() {
                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);

                });
            });
        });
    });
    res.send('OK');
});
app.listen(process.env.PORT || 4733);
