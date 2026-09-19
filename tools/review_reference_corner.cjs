const {chromium}=require('playwright');
const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(root,'prototypes/v2.5-reference-corner.html')).href);
  await page.waitForFunction(()=>window.CornerReview?.getMetrics().ready,{},{timeout:30000});
  await page.waitForTimeout(2000);
  const position=await page.evaluate(()=>CornerReview.getMetrics().camera);
  await page.keyboard.down('KeyW');await page.waitForTimeout(350);await page.keyboard.up('KeyW');
  assert((await page.evaluate(()=>CornerReview.getMetrics().camera))[2]<position[2]-.1,'W moves forward');
  await page.selectOption('#view','hero');
  await page.click('#weapon');assert.equal(await page.evaluate(()=>CornerReview.getMetrics().bowVisible),false);
  await page.click('#weapon');assert.equal(await page.evaluate(()=>CornerReview.getMetrics().bowVisible),true);
  const before=await page.evaluate(()=>CornerReview.getMetrics());
  const original=await page.evaluate(()=>JSON.parse(JSON.stringify(CornerReview.ads)));
  for(let i=0;i<12;i++){
   await page.evaluate(i=>{CornerReview.updateAd('BILLBOARD_01',{headline:'TEST '+i});CornerReview.updateAd('VENDING_01',{headline:'SAMPLE '+i});},i);
   await page.waitForTimeout(30);
  }
  await page.evaluate(original=>{for(const [id,creative] of Object.entries(original))CornerReview.updateAd(id,creative);},original);
  await page.waitForTimeout(100);
  const after=await page.evaluate(()=>CornerReview.getMetrics());
  assert.equal(after.textures,before.textures,'Replacing ads does not accumulate textures');
  assert.equal(after.geometry,before.geometry,'Replacing ads does not accumulate geometry');
  for(const view of ['hero','shop','street']) {
   await page.selectOption('#view',view);await page.waitForTimeout(600);
   await page.screenshot({path:path.join(root,`docs/v2.5/corner-${view}.png`)});
  }
  await page.selectOption('#view','hero');await page.keyboard.down('KeyF');await page.waitForTimeout(700);
  assert((await page.evaluate(()=>CornerReview.getMetrics().charge))>.8,'F draws the string');
  await page.screenshot({path:path.join(root,'docs/v2.5/corner-draw.png')});await page.keyboard.up('KeyF');
  await page.waitForTimeout(500);assert((await page.evaluate(()=>CornerReview.getMetrics().charge))<.02,'Release resets the string');
  const metrics=await page.evaluate(()=>CornerReview.getMetrics());
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
  await page.screenshot({path:path.join(root,'docs/v2.5/corner-phone.png')});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(JSON.stringify({...metrics,frameTimes:metrics.frameTimes.length+' samples',errors},null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
