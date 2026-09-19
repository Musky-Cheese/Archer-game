const {chromium}=require('playwright');
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/v2.5');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(root,'prototypes/v2.5-corner-playable.html')).href+'?test=1');
  await page.waitForFunction(()=>window.LastArcherCorner?.getMetrics().ready,{timeout:30000});await page.waitForTimeout(300);
  let m=await page.evaluate(()=>LastArcherCorner.getMetrics());assert.equal(m.assets.failed,0);assert.ok(m.assets.loaded>=13);assert.ok(m.solids>10);assert.equal(errors.length,0,errors.join('\n'));
  for(const view of ['mart','street']){await page.evaluate(v=>LastArcherCorner.setView(v),view);await page.waitForTimeout(120);await page.screenshot({path:path.join(out,'corner-playable-'+view+'.png')});}
  await page.evaluate(()=>LastArcherCorner.test.play());
  assert.ok((await page.locator('#district-panel').getAttribute('class')).includes('playing'),'enter district compacts the review panel');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#district-panel h2')).display),'none','enter district hides review copy');
  await page.evaluate(()=>{const t=LastArcherCorner.test;t.spawn([.2,5]);t.spawn([-2,1]);t.spawn([2,-4]);});
  await page.waitForTimeout(180);await page.screenshot({path:path.join(out,'corner-playable-hero.png')});
  const before=await page.evaluate(()=>LastArcherCorner.getMetrics());await page.keyboard.down('KeyW');await page.waitForTimeout(260);await page.keyboard.up('KeyW');
  m=await page.evaluate(()=>LastArcherCorner.getMetrics());assert.ok(Math.hypot(m.player.x-before.player.x,m.player.z-before.player.z)>.35,'movement changes player position');
  // Shots at a close, medium and far actor use the actual camera and projectile path.
  for(const z of [6,0,-8]){
   const result=await page.evaluate(z=>{const t=LastArcherCorner.test;t.reset();t.clearEnemies();t.placePlayer(.2,13.6,0);t.spawn([.2,z]);t.aim([.2,1.3,z]);t.fire();for(let i=0;i<130;i++)t.step(.01);return LastArcherCorner.getMetrics();},z);
   assert.ok(result.score>0,'arrow hits actor at z='+z);
  }
  await page.evaluate(()=>{const t=LastArcherCorner.test;t.reset();t.clearEnemies();t.pickup();t.step(.02);});assert.ok((await page.evaluate(()=>LastArcherCorner.getMetrics())).buffs.length>0,'pickups grant buffs');
  await page.evaluate(()=>{const t=LastArcherCorner.test;t.reset();t.clearEnemies();t.spawn([.2,13.2]);for(let i=0;i<600;i++)t.step(.01);});
  m=await page.evaluate(()=>LastArcherCorner.getMetrics());assert.ok(m.health<3,'enemy contact removes health');
  await page.evaluate(()=>{const t=LastArcherCorner.test;t.reset();t.clearEnemies();t.spawn([.2,13.3]);t.spawn([.2,13.25]);t.spawn([.2,13.2]);t.step(.02);return LastArcherCorner.getMetrics();}).then(m=>assert.equal(m.state,'over','three contacts end the run'));
  await page.locator('#btn-restart').click();await page.waitForTimeout(50);m=await page.evaluate(()=>LastArcherCorner.getMetrics());assert.equal(m.state,'play','restart resumes play');assert.equal(m.health,3,'restart restores health');
  await page.evaluate(()=>{const t=LastArcherCorner.test;t.reset();return LastArcherCorner.getMetrics();}).then(m=>{assert.equal(m.score,0);assert.equal(m.arrows,0);assert.equal(m.health,3);});
  await page.locator('#fire-btn').dispatchEvent('pointerdown',{pointerId:7,pointerType:'touch'});await page.waitForTimeout(180);await page.locator('#fire-btn').dispatchEvent('pointercancel',{pointerId:7,pointerType:'touch'});m=await page.evaluate(()=>LastArcherCorner.getMetrics());assert.equal(m.charge,0);
  const resources=await page.evaluate(()=>{const t=LastArcherCorner.test;t.reset();t.render(50);const before=LastArcherCorner.getMetrics().memory;for(let i=0;i<80;i++){t.draw(i%2);t.render(50+i/60);}t.draw(0);return {before,after:LastArcherCorner.getMetrics().memory};});assert.deepEqual(resources.after,resources.before,'drawing has stable resources');
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>LastArcherCorner.setView('corner'));await page.waitForTimeout(150);await page.screenshot({path:path.join(out,'corner-playable-phone.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(errors.length,0,errors.join('\n'));
  fs.writeFileSync(path.join(out,'corner-playable-test-results.json'),JSON.stringify({passed:true,checks:['asset load','movement','near medium far arrows','pickups','enemy damage','restart','touch cancel','stable draw resources','phone layout'],metrics:m,resources,errors},null,2));
  console.log('Playable corner checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
