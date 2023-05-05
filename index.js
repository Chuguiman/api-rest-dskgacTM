const express = require("express");
const { scrapeLogic } = require("./scrapeLogic");
const app = express();

const PORT = process.env.PORT || 4000;

app.get("/scrape/:numexpdb", (req, res) => {
  const numexpdb = req.params.numexpdb;

  const prefijo = 50;
  const codepais = "CR"; 
  const ngac = "2022-79"; 

  scrapeLogic(numexpdb, prefijo, codepais, ngac, res);
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
