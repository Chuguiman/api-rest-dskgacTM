const puppeteer = require("puppeteer");
require("dotenv").config();
const fs = require("fs");

const prefijo = 50;
const codepais = "CR"; //Codigo de Pais
const ngac = "2022-79"; //Numero de Gaceta

const scrapeLogic = async (numexpdb, res) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
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

      fs.writeFile("./exps/" + exp + ".jpeg", await viewSource.buffer(), function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("The file was saved!");
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
