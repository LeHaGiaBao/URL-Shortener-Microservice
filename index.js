require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const validator = require('validator');
const app = express();

const port = process.env.PORT || 3000;

const urls = [];

app.use(cors());

app.use(bodyParser.urlencoded({ entended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/shorturl", async (req, res) => {
  try {
    var url = (req.body.url || '').toLowerCase();

    if(!validator.isURL(url)){
      return res.json({error: 'invalid url'})
    }
    
    var exists = checkIfExists(url);

    if (exists.status) {
      return res.json({ original_url: url, short_url: exists.short_url });
    }

    var shortUrl = shorterUrl();
    var saved = {
      original_url: url,
      short_url: shortUrl
    };

    urls.push(saved);

    return res.json({ original_url: url, short_url: shortUrl });
  } catch (e) {
    console.log('err', e)
  }
});

app.get("/api/shorturl/:shortUrl", function(req, res) {
  var redirectPromise = redirectToOriginalUrl(req.params.shortUrl);
  redirectPromise.then(function(original_url) {
    return res.redirect(original_url);
  });
  redirectPromise.catch(function(reason) {
    return res.json({ error: "invalid URL" });
  });
});

function redirectToOriginalUrl(short_url) {
  return new Promise(function(resolve, reject) {
    const url = urls.find(u => u.short_url === short_url);

    if (!url) return reject('Not found');

    return resolve(url.original_url);
  });
}

function checkIfExists(original_url) {
  const url = urls.find(u => u.original_url === original_url);

  if (!url) return { status: false };

  return { status: true, short_url: url.short_url }
}

function shorterUrl() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
