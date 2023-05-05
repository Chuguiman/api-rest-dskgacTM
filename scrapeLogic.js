const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();

const scrapeLogic = async (numexpdb, prefijo, codepais, ngac, res) => {

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--disable-notifications", 
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  try {
    const anocr = numexpdb.substring(0, 4);
    const expcr = numexpdb.substring(5);
    const preexpcr = String(expcr).padStart(9, "0");
    const prenumber = prefijo + anocr + preexpcr;

    const exp = codepais + prenumber;
    const url = "https://www.tmdn.org/tmview/api/trademark/detail/" + exp;
    console.log(url);

    const page = await browser.newPage();
    await page.goto(url);

    const allResultsSelector = "body";

    await page.waitForSelector(allResultsSelector, {
      visible: true,
    });

    const resultsSelector = 'pre[style="word-wrap: break-word; white-space: pre-wrap;"]';
    await page.waitForSelector(resultsSelector);

    const textoHtml = await page.evaluate((resultsSelector) => {
      const contentHtml = Array.from(document.querySelectorAll(resultsSelector));
      return contentHtml.map((content) => {
        const contenido = content.textContent.trim();
        return contenido;
      });
    }, resultsSelector);

    let resJSON = JSON.parse(textoHtml);
    const urlImagen = resJSON.tradeMark.markImageURI;

    if (urlImagen) {
      var viewSource = await page.goto(urlImagen);
    
      const allResultsSelector2 = "body";
      await page.waitForSelector(allResultsSelector2, {
        visible: true,
      });
    
      const resultsSelector2 = "img";
      await page.waitForSelector(resultsSelector2);
    
      const imgFolderPath = `exps/${codepais}/${ngac}/imgs/`;
      const imgFilePath = `${imgFolderPath}${exp}.jpeg`;
    
      if (!fs.existsSync(imgFolderPath)) {
        fs.mkdirSync(imgFolderPath, { recursive: true });
      }
    
      fs.writeFile(imgFilePath, await viewSource.buffer(), function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("The image file was saved!");
      });
    }

    console.log("\n ⚡️⚡️ Descarga exitosa ⚡️⚡️");

    await browser.close();

    const carpeta = "exps/" + codepais + "/" + ngac + "/";
    const nameFileJson = carpeta + exp + ".json";

    // Crear la carpeta si no existe
    fs.mkdirSync(carpeta, { recursive: true });

    fs.writeFileSync(nameFileJson, JSON.stringify(resJSON));
    res.send(`JSON guardado como: ${nameFileJson}`);
  } catch (e) {
    console.error(e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeLogic };
