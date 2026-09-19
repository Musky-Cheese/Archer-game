const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  const file = path.resolve(__dirname, 'v2.5-render-lab.html');
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const lab = window.LastArcherRendererLab;
    return lab && lab.getMetrics().assets.loaded === 12;
  }, { timeout: 30000 });
  await page.waitForTimeout(500);

  const baseline = await page.evaluate(() => window.LastArcherRendererLab.getMetrics());
  if (baseline.preset !== 'baseline' || baseline.assets.failed !== 0 || baseline.grounding.some(item => !item.ok)) {
    throw new Error(`Baseline validation failed: ${JSON.stringify(baseline)}`);
  }
  await page.screenshot({ path: path.resolve(__dirname, 'v2.5-render-lab-baseline.png') });

  await page.click('[data-preset="anime"]');
  await page.waitForTimeout(600);
  const celWithoutOutlines = await page.evaluate(() => window.LastArcherRendererLab.getMetrics());
  if (celWithoutOutlines.preset !== 'anime' || celWithoutOutlines.render.calls < 1 || celWithoutOutlines.frameSamples.length < 1) {
    throw new Error(`Clean cel validation failed: ${JSON.stringify(celWithoutOutlines)}`);
  }
  await page.click('#lab-outline');
  await page.waitForTimeout(1000);
  const anime = await page.evaluate(() => window.LastArcherRendererLab.getMetrics());
  if (anime.preset !== 'anime' || anime.render.calls < 1 || anime.render.triangles < 1 || anime.frameSamples.length < 1) {
    throw new Error(`Anime validation failed: ${JSON.stringify(anime)}`);
  }
  await page.screenshot({ path: path.resolve(__dirname, 'v2.5-render-lab-anime.png') });

  await page.click('[data-preset="night"]');
  await page.selectOption('#lab-view', 'alley');
  await page.waitForTimeout(700);
  const night = await page.evaluate(() => window.LastArcherRendererLab.getMetrics());
  if (night.preset !== 'night' || night.grounding.some(item => !item.ok)) {
    throw new Error(`Dark-night validation failed: ${JSON.stringify(night)}`);
  }
  await page.screenshot({ path: path.resolve(__dirname, 'v2.5-render-lab-night.png') });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const mobileLayout = await page.evaluate(() => ({
    panelVisible: !!document.getElementById('renderer-lab') && getComputedStyle(document.getElementById('renderer-lab')).display !== 'none',
    panelWidth: document.getElementById('renderer-lab').getBoundingClientRect().width,
    viewportWidth: innerWidth,
  }));
  if (!mobileLayout.panelVisible || mobileLayout.panelWidth > mobileLayout.viewportWidth) {
    throw new Error(`Mobile layout validation failed: ${JSON.stringify(mobileLayout)}`);
  }
  await page.screenshot({ path: path.resolve(__dirname, 'v2.5-render-lab-mobile-layout.png') });

  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ baseline, celWithoutOutlines, anime, night, mobileLayout }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
