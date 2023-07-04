'use strict'

const puppeteer = require("puppeteer");
const fs = require("fs");

const escapePress = async () => {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', (data) => {
    process.stdin.setRawMode(false)

    const byteArray = [...data]
    if (byteArray.length > 0 && byteArray[0] === 3) {
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
  const browser = await puppeteer.launch({ userDataDir: 'session', headless: 'new' });
  const page = await browser.newPage();

  page
    .on('console', message =>
      console.log(`${message.type().substr(0, 3).toUpperCase()}: ${message.text()}`))
    .on('pageerror', ({ message }) => console.log(message))
    .on('requestfailed', request =>
      console.log(`${request.failure().errorText} ${request.url()}`))

  await page.goto('https://unearthedgame.net/');
  //await page.goto('http://localhost:20000/?headless=true');

  console.log("SYS:");
  console.log("SYS: -----------------------------------");
  console.log("SYS:     Press Escape to stop Server");
  console.log("SYS: -----------------------------------");
  console.log("SYS:");
  while (await escapePress() === 0) {
  };

  console.log("SYS: -----------------------------------");
  console.log("SYS:     Server Shutting Down");
  console.log("SYS: -----------------------------------");
  browser.close();
  process.exit(1);
})();
