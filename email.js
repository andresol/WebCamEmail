var fs = require('fs'),
    request = require('request'),
    nodemailer = require('nodemailer'),
    express = require('express'),
    bodyParser = require('body-parser'),
    uuid = require('node-uuid'), MjpegConsumer = require("mjpeg-consumer"),
    FileOnWrite = require("file-on-write");

var writer = new FileOnWrite({
    path: './email',
    ext: '.jpg'
});

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var sid = uuid.v4(),
    fromEmail = "andre@sollie.info",
    toEmail = "andre@sollie.info";

var transporter = nodemailer.createTransport({
    host: 'smtp.altibox.no',
    port: 25,
    secure: false // use SSL
});

var mailOptions = {
    from: fromEmail,
    to: toEmail, // list of receivers
    subject: 'RingeKlokka',
    text: 'Ringeklokka',
    html: 'Bilde: <img src="cid:' + sid + '"/>',
    attachments: [{
            filename: 'email.jpg',
            path: 'email.jpg',
            cid: sid //same cid value as in the html img src
        }]
        // html body
};

var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var sendReq = request.get(url).auth('admin', '', false);

    // verify response code
    sendReq.on('response', function(response) {
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }
    });

    // check for request errors
    sendReq.on('error', function (err) {
        fs.unlink(dest);
        return cb(err.message);
    });

    sendReq.pipe(file);

    file.on('finish', function() {
        file.close(cb);  // close() is async, call cb after close completes.
    });

    file.on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        return cb(err.message);
    });
};

app.post('/', function(req, res) {

    var url = 'http://192.168.1.236/mjpeg/snap.cgi?chn=0';
    download(url, 'email.jpg', function() {
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);

        });
    });
    res.send('OK');
});
app.listen(process.env.PORT || 4733);
