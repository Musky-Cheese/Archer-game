const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const failures = [];
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') failures.push(`console: ${message.text()}`); });
  const file = path.resolve(__dirname, '..', 'prototypes', 'v2.5-anime-city-block.html');
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  try { await page.waitForFunction(() => {
    const status = window.LastArcherV25 && window.LastArcherV25.assetStatus;
    return status && status.requested > 0 && status.loaded + status.failed === status.requested;
  }, null, { timeout: 15000 }); } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      city: window.LastArcherV25 && window.LastArcherV25.assetStatus,
      title: document.title,
      body: document.body.innerText.slice(0, 500),
    }));
    console.error(JSON.stringify({ diagnostic, failures }, null, 2));
    throw error;
  }
  await page.waitForTimeout(500);
  const metrics = await page.evaluate(() => window.LastArcherV25.getMetrics());
  if (metrics.assets.failed || failures.length) console.error(JSON.stringify({ metrics, failures }, null, 2));
  assert.equal(metrics.assets.failed, 0, 'all embedded GLBs should load');
  assert.ok(metrics.assets.loaded >= 20, 'city should instantiate the complete block');
  assert.ok(metrics.assets.colliders >= 15, 'city should provide gameplay collision surfaces');
  assert.ok(metrics.assets.shamblers === 3, 'city should preview three anime shamblers');
  assert.equal(metrics.bowAttached, true, 'camera-following bow should be present');
  assert.ok(metrics.render.triangles > 0, 'Three.js should render the city');
  assert.equal(failures.length, 0, failures.join('\n'));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'docs', 'v2.5', 'city-block-preview.png') });
  console.log(JSON.stringify(metrics));
  await browser.close();
})().catch(error => { console.error(error.stack || error); process.exit(1); });
