'use strict'

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const escapePress = async () => {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', (data) => {
    process.stdin.setRawMode(false)

    const byteArray = [...data]
    if (byteArray.length > 0 && byteArray[0] === 96) {
      resolve(1);
    } else if (data[0] === 27) {
      resolve(1);
    } else {
      resolve(0);
    }
  }))
}

fs.unlinkSync("session/SingletonLock");

(async () => {
  const browser = await puppeteer.launch({ 
    userDataDir: 'session', 
    headless: 'new',
    args: ['--allow-file-access-from-files', '--enable-local-file-accesses']
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setRequestInterception(true);
  page.on('console', (message) => {
    // ignore the audio context message the server, its just noise
    if (message.text().indexOf("The AudioContext was not allowed to start") >= 0) {
      return;
    }
    console.log(`${message.type().substr(0, 3).toUpperCase()}: ${message.text()}`)
  });

  page.on('request', async request => {
    const url = request.url();
    if (url.startsWith("https://modserver/")) {
      request.respond({
        content: "application/octet",
        body: fs.readFileSync("mods/switchblocks.zip"),
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      });
      return;
    }

    request.continue();
  });

  page.on('pageerror', ({ message }) => {
    console.log(message);
  });

  page.on('pageerrequestfailedror', ({ message }) => {
    console.log(`${request.failure().errorText} ${request.url()}`)
  });

  const prefix = "https://modserver/";
  const modList = [];

  for (const file of fs.readdirSync("mods")) {
    modList.push(prefix+file);
  }
  // await page.goto('http://unearthedgame.net/?headless=true&mods=' + encodeURIComponent(JSON.stringify(modList)));
  await page.goto('http://localhost:20000/?headless=true&mods=' + encodeURIComponent(JSON.stringify(modList)));

  console.log("SYS:");
  console.log("SYS: -----------------------------------");
  console.log("SYS:     Press Escape to stop Server");
  console.log("SYS: -----------------------------------");
  console.log("SYS:");
  while (await escapePress() === 0) {
  };

  console.log("SYS:");
  console.log("SYS: -----------------------------------");
  console.log("SYS:     Server Shutting Down");
  console.log("SYS: -----------------------------------");
  console.log("SYS:");
  browser.close();
  process.exit(1);
})();
