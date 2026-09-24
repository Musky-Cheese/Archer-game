/* Capture a real browser screenshot of the V2.7 comparison preview. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const preview = path.join(root, 'prototypes', 'v2.7-bow-compare.html');
const output = path.join(root, 'docs', 'v2.7-bow-comparison.png');

(async()=>{
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const errors=[]; page.on('pageerror', error=>errors.push(error.message));
    await page.goto(pathToFileURL(preview).href);
    await page.waitForFunction(()=>window.V27BowCompare?.ready===true,{timeout:30000});
    await page.screenshot({path:output});
    if(errors.length) throw new Error(errors.join('\n'));
    console.log(output);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
