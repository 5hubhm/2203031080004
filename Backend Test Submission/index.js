import express from 'express';

const app = express();
app.use(express.json());

let urls = [];

app.post('/shorten', (req, res) => {

  const url = req.body.url;
  const shortcode = req.body.shortcode;
  const validity = req.body.validity;

  if(!url || !shortcode){
    res.json({error: "url and shortcode both are required"});
  }
  urls[url] = shortcode;
  console.log(urls)
  res.status(201).json({ "shortenLink": `http://localhost:3000/${shortcode}`});
});

app.get('/shorturls/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const url = Object.keys(urls).find(key => urls[key] === shortcode);
  console.log(url)
  if (url) {
    const uurl = `http://localhost:3000/${url}`;
    res.status(200).json({ "originalUrl": uurl });
  } else {
    res.status(404).json({ error: "URL not found" });
  }
});

app.listen(3000, () => console.log('App running at http://localhost:3000'));
