const {chromium}=require('playwright');
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/v2.6');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(root,'prototypes/v2.6-hero-slice.html')).href+'?test=1');
  await page.waitForFunction(()=>window.LastArcherV26?.getMetrics().ready,null,{timeout:30000});await page.waitForTimeout(500);
  const initial=await page.evaluate(()=>LastArcherV26.getMetrics());console.log(JSON.stringify({initial,errors}));
  assert.equal(errors.length,0,errors.join('\n'));
  for(const view of ['corner','mart','enemy']){await page.evaluate(v=>LastArcherV26.setView(v),view);await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'hero-'+view+'.png')});}
  await page.evaluate(()=>{LastArcherV26.setView('corner');LastArcherV26.test.draw(1);});await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'hero-draw.png')});
  if(process.argv.includes('--visual-only'))return;
  const checks=[];
  const assetAudit=await page.evaluate(()=>LastArcherV26.test.assetAudit());assert.deepEqual(assetAudit.animations,['Idle','Walk','Attack','Death']);assert.ok(assetAudit.deathBounds.max[1]<.65,'fallen model rests below standing height');assert.ok(assetAudit.deathBounds.min[1]>-.15,'death does not bury the character');checks.push('exported rig has four clips and grounded death pose');
  await page.evaluate(()=>LastArcherV26.test.play());assert.equal(await page.evaluate(()=>LastArcherV26.getMetrics().state),'play');
  const before=await page.evaluate(()=>LastArcherV26.getMetrics().player);await page.keyboard.down('KeyW');await page.waitForTimeout(350);await page.keyboard.up('KeyW');
  const after=await page.evaluate(()=>LastArcherV26.getMetrics().player);assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.35);checks.push('keyboard movement');
  // Hold movement into the actual shop facade; pushing cannot enter the shell.
  await page.evaluate(()=>{const t=LastArcherV26.test;t.reset();t.clearEnemies();t.placePlayer(-7,1.3,0);});await page.keyboard.down('KeyW');await page.waitForTimeout(700);await page.keyboard.up('KeyW');
  assert.ok((await page.evaluate(()=>LastArcherV26.getMetrics().player)).z>=.27);checks.push('movement collision with shop');
  for(const z of [6,0,-8]){
   const m=await page.evaluate(z=>{const t=LastArcherV26.test;t.reset();t.clearEnemies();t.placePlayer(.2,13.6,0);t.spawn([.2,z]);t.aim([.2,1.3,z]);t.fire();for(let i=0;i<130;i++)t.step(.01);return LastArcherV26.getMetrics();},z);
   assert.ok(m.score>0,'arrow hits at '+z);
  }checks.push('aiming and near/medium/far arrow hits');
  const occluded=await page.evaluate(()=>{const t=LastArcherV26.test;t.reset();t.clearEnemies();t.placePlayer(-8,3,0);t.spawn([-8,-4]);t.aim([-8,1.3,-4]);t.fire();for(let i=0;i<100;i++)t.step(.01);return LastArcherV26.getMetrics();});assert.equal(occluded.score,0);checks.push('walls block arrows');
  const wave=await page.evaluate(()=>{const t=LastArcherV26.test;t.reset();t.clearEnemies();t.placePlayer(0,12,0);for(let kill=0;kill<9;kill++){t.spawn([0,5]);t.aim([0,1.3,5]);t.fire();for(let i=0;i<50;i++)t.step(.01);}return LastArcherV26.getMetrics();});assert.equal(wave.wave,2);checks.push('nine actual projectile kills advance wave');
  const death=await page.evaluate(()=>{const t=LastArcherV26.test;t.render(10);t.render(10.05);return t.snapshot().death;});assert.ok(death.length>0);await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'hero-death.png')});checks.push('death animation rendered');
  const pickups=await page.evaluate(()=>LastArcherV26.test.snapshot().pickups);assert.equal(pickups.length,8);assert.ok(pickups.every(p=>!p.blocked),'all pickups are outside solids');
  const buff=await page.evaluate(()=>{const t=LastArcherV26.test;t.reset();t.clearEnemies();t.placePlayer(-3.4,3,0);return t.snapshot();});
  await page.keyboard.down('KeyW');await page.waitForTimeout(450);await page.keyboard.up('KeyW');assert.ok((await page.evaluate(()=>LastArcherV26.getMetrics())).buffs.length>0);checks.push('pickup reached by walking grants buff');
  const approach=await page.evaluate(()=>{const t=LastArcherV26.test;t.reset();t.clearEnemies();t.placePlayer(0,0,0);t.spawn([0,-28]);for(let i=0;i<500;i++)t.step(.01);return t.snapshot().actors;});assert.ok(approach[0].z>-22&&approach[0].z<-10,'distant enemy approaches without teleporting');checks.push('street spawn approaches continuously');
  const damage=await page.evaluate(()=>{const t=LastArcherV26.test;t.reset();t.clearEnemies();t.spawn([.2,13.2]);t.step(.02);return LastArcherV26.getMetrics();});assert.equal(damage.health,2);checks.push('enemy contact damages player');
  const over=await page.evaluate(()=>{const t=LastArcherV26.test;t.spawn([.2,13.2]);t.spawn([.2,13.2]);t.step(.02);return LastArcherV26.getMetrics();});assert.equal(over.state,'over');
  await page.locator('#btn-restart').click();const reset=await page.evaluate(()=>LastArcherV26.getMetrics());assert.equal(reset.state,'play');assert.equal(reset.health,3);assert.equal(reset.score,0);assert.equal(reset.wave,1);assert.equal(reset.arrows,0);checks.push('death and restart restore run');
  await page.evaluate(()=>LastArcherV26.test.paused());const pausedBefore=await page.evaluate(()=>LastArcherV26.getMetrics().player);await page.keyboard.down('KeyW');await page.waitForTimeout(180);await page.keyboard.up('KeyW');assert.deepEqual(await page.evaluate(()=>LastArcherV26.getMetrics().player),pausedBefore);await page.evaluate(()=>LastArcherV26.test.resume());checks.push('pause stops movement');
  await page.locator('#fire-btn').dispatchEvent('pointerdown',{pointerId:7,pointerType:'touch'});await page.waitForTimeout(160);await page.locator('#fire-btn').dispatchEvent('pointercancel',{pointerId:7,pointerType:'touch'});assert.equal((await page.evaluate(()=>LastArcherV26.getMetrics())).charge,0);checks.push('touch draw cancellation');
  const resources=await page.evaluate(()=>{const t=LastArcherV26.test;t.reset();t.render(50);const before=LastArcherV26.getMetrics().memory;for(let i=0;i<120;i++){t.draw(i%2);t.render(50+i/60);}t.draw(0);return {before,after:LastArcherV26.getMetrics().memory};});assert.deepEqual(resources.before,resources.after);checks.push('stable resources during draw/release');
  await page.evaluate(()=>{LastArcherV26.test.preview();document.getElementById('district-panel').classList.add('playing');});await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'hero-gameplay.png')});
  await page.setViewportSize({width:1536,height:634});await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'hero-wide.png')});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'hero-phone.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks.push('portrait layout');
  assert.equal(errors.length,0,errors.join('\n'));
  fs.writeFileSync(path.join(out,'test-results.json'),JSON.stringify({passed:true,checks,initial,resources,assetAudit,errors},null,2));console.log(JSON.stringify({passed:true,checks,assetAudit}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
