const { chromium } = require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/v2.5');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(root,'prototypes/v2.5-anime-city-block.html')).href+'?test=1');
  try{await page.waitForFunction(()=>window.LastArcherV25?.getMetrics().ready,{timeout:15000});}catch(e){console.error(errors);throw e;}
  await page.waitForTimeout(400);
  const metrics=await page.evaluate(()=>LastArcherV25.getMetrics());
  console.log(JSON.stringify({...metrics,frames:undefined,grounding:undefined}));
  await page.screenshot({path:path.join(out,'stage8-intersection.png')});
  assert.equal(errors.length,0,errors.join('\n'));
  assert.equal(metrics.assets.failed,0);assert.equal(metrics.assets.loaded,11);assert.equal(metrics.animated,3);
  assert.ok(metrics.grounding.every(p=>Math.abs(p.minY)<.021));
  if(process.env.REVIEW_CAPTURE_ONLY)return;
  for(const view of ['alley','close']){
    await page.evaluate(v=>LastArcherV25.setView(v),view);await page.waitForTimeout(100);
    await page.screenshot({path:path.join(out,`stage8-${view}.png`)});
  }
  await page.evaluate(()=>LastArcherV25.test.play());
  await page.evaluate(()=>LastArcherV25.test.clearEnemies());
  const before=await page.evaluate(()=>LastArcherV25.getMetrics());
  await page.keyboard.down('KeyW');await page.waitForTimeout(250);await page.keyboard.up('KeyW');
  let after=await page.evaluate(()=>LastArcherV25.getMetrics());assert.ok(after.player.z<before.player.z-.5,'W advances player');
  await page.evaluate(()=>LastArcherV25.test.paused());
  const stopped=await page.evaluate(()=>LastArcherV25.getMetrics());await page.waitForTimeout(150);
  assert.deepEqual((await page.evaluate(()=>LastArcherV25.getMetrics())).player,stopped.player);
  await page.evaluate(()=>LastArcherV25.test.resume());
  // Fire at a rigged actor at three distances. The foreground launch origin and
  // compensated trajectory must agree with the reticle, including near range.
  for(const distance of [3,8,16]){
    const result=await page.evaluate(d=>{
      const t=LastArcherV25.test;t.reset();t.clearEnemies();t.placePlayer(1,11,0);t.spawn([1,11-d]);t.aim([1,1.35,11-d]);t.fire();
      for(let i=0;i<100;i++)t.step(.01);
      return LastArcherV25.getMetrics();
    },distance);
    assert.ok(result.score>0,`reticle hit at ${distance}m`);
  }
  // Solid cover must win the sweep before an enemy behind it.
  const covered=await page.evaluate(()=>{
    const t=LastArcherV25.test;t.reset();t.clearEnemies();t.placePlayer(5,5,0);t.spawn([5,-1]);t.aim([5,.8,-1]);t.fire();
    for(let i=0;i<80;i++)t.step(.01);return LastArcherV25.getMetrics();
  });assert.equal(covered.score,0,'crate blocks shot at enemy behind it');
  await page.evaluate(()=>{const t=LastArcherV25.test;t.reset();t.clearEnemies();t.pickup();t.step(.01);});
  assert.ok((await page.evaluate(()=>LastArcherV25.getMetrics())).buffs.length>0,'visible pickups still grant buffs');
  // Exercise pointer input, cancellation and pause while charging.
  await page.evaluate(()=>{LastArcherV25.test.reset();LastArcherV25.test.clearEnemies();});
  await page.locator('#fire-btn').dispatchEvent('pointerdown',{pointerId:11,pointerType:'touch'}).catch(async()=>{
    const id=await page.evaluate(()=>document.querySelector('[id*=fire]')?.id);throw new Error('Fire selector missing: '+id);
  });
  await page.waitForTimeout(300);
  await page.locator('#fire-btn').dispatchEvent('pointercancel',{pointerId:11,pointerType:'touch'});
  after=await page.evaluate(()=>LastArcherV25.getMetrics());assert.equal(after.shots,0,'cancel must not release a shot');assert.equal(after.charge,0);
  await page.locator('#fire-btn').dispatchEvent('pointerdown',{pointerId:12,pointerType:'touch'});await page.waitForTimeout(120);
  await page.keyboard.press('KeyP');after=await page.evaluate(()=>LastArcherV25.getMetrics());assert.equal(after.state,'paused');assert.equal(after.charge,0);
  await page.keyboard.press('KeyP');
  await page.locator('#fire-btn').dispatchEvent('pointerdown',{pointerId:13,pointerType:'touch'});await page.waitForTimeout(180);
  await page.screenshot({path:path.join(out,'stage8-drawing.png')});
  await page.locator('#fire-btn').dispatchEvent('pointerup',{pointerId:13,pointerType:'touch'});assert.equal((await page.evaluate(()=>LastArcherV25.getMetrics())).shots,1,'touch release fires exactly once');
  const resourceCheck=await page.evaluate(()=>{
    const t=LastArcherV25.test;t.reset();t.clearEnemies();t.render(100);const initial=LastArcherV25.getMetrics().memory;
    for(let i=0;i<160;i++){t.draw(i%2);t.render(100+i/60);}
    t.draw(0);return {initial,after:LastArcherV25.getMetrics().memory};
  });assert.deepEqual(resourceCheck.after,resourceCheck.initial,'sustained bow drawing must not allocate geometries/textures');
  const push=await page.evaluate(()=>LastArcherV25.test.wallPush(5,1.2));assert.ok(Math.hypot(push.x-5,push.z-1.2)>.8,'inside-crate player is pushed out, not trapped');
  const restart=await page.evaluate(()=>{LastArcherV25.test.reset();return LastArcherV25.getMetrics();});assert.equal(restart.score,0);assert.equal(restart.arrows,0);assert.equal(restart.charge,0);assert.deepEqual(restart.player,{x:1,z:11});
  // Profile actual mesh population without silently reducing the spawn count.
  const stress=await page.evaluate(()=>{
    const t=LastArcherV25.test;t.clearEnemies();t.placePlayer(1,11,0);
    for(let i=0;i<40;i++)t.spawn([-8+(i%8)*2,-9+Math.floor(i/8)*2]);
    t.render(104);return LastArcherV25.getMetrics();
  });assert.equal(stress.animated,40);assert.ok(stress.render.calls<150,'40-actor draw-call check');
  await page.evaluate(()=>{LastArcherV25.test.reset();LastArcherV25.test.clearEnemies();LastArcherV25.test.render(105);LastArcherV25.test.save();});
  assert.ok((await page.evaluate(()=>LastArcherV25.getMetrics())).memory.textures<=resourceCheck.initial.textures+1,'actor bone textures must be released on restart');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lastArcher.v25.review.profile')).tutorialSeen),true,'review profile remains saveable');
  // Exercise the actual ad update API and preserve the slot object.
  assert.equal(await page.evaluate(()=>{LastArcherAds.update('BILLBOARD_01',{headline:'TEST SPONSOR'});return LastArcherAds.slots.BILLBOARD_01.headline;}),'TEST SPONSOR');
  await page.evaluate(()=>LastArcherAds.update('BILLBOARD_01',{headline:'ZOMBIE INSURANCE'}));
  await page.evaluate(()=>LastArcherV25.test.preview());
  for(const vp of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(vp);await page.evaluate(()=>LastArcherV25.setView('intersection'));await page.waitForTimeout(150);
    await page.screenshot({path:path.join(out,`stage8-${vp.width===390?'portrait':'landscape'}.png`)});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  assert.equal(errors.length,0,errors.join('\n'));
  fs.writeFileSync(path.join(out,'stage8-test-results.json'),JSON.stringify({passed:true,checks:['load','grounding','rigged actors','movement','pause','near/medium/far hits','cover occlusion','pickups','touch cancellation/release','pause while drawing','stable draw resources','crate penetration recovery','restart','40 animated actors','review profile save','ad replacement','portrait/landscape layout'],desktop:metrics,stress:{enemies:stress.enemies,animated:stress.animated,render:stress.render,memory:stress.memory},resources:resourceCheck,errors},null,2));
  console.log('Stage 8 gameplay and visual capture checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
