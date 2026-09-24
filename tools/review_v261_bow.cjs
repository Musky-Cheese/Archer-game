const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/v2.6.1');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(pathToFileURL(path.join(root,'prototypes/v2.6.1-bow-study.html')).href+'?test=1');await page.waitForFunction(()=>window.BowStudy&&LastArcherV26.getMetrics().ready,null,{timeout:30000});await page.waitForTimeout(300);
 await page.evaluate(()=>document.getElementById('district-panel').classList.add('playing'));
 for(const pose of ['ready','half','draw','release']){await page.evaluate(p=>BowStudy.setPose(p),pose);await page.waitForTimeout(100);await page.screenshot({path:path.join(out,pose+'.png')});}
 console.log(JSON.stringify({errors,render:await page.evaluate(()=>LastArcherV26.getMetrics().render)}));assert.deepEqual(errors,[]);
 await page.evaluate(()=>BowStudy.setPose('ready'));await page.waitForTimeout(60);
 const assets=await page.evaluate(()=>BowStudy.exportAssets());fs.writeFileSync(path.join(out,'asset-geometry.json'),JSON.stringify(assets));console.log(JSON.stringify(assets.map(a=>({name:a.name,triangles:a.meshes.reduce((s,m)=>s+m.p.length/9,0)}))));
 if(process.argv.includes('--visual-only'))return;
 const checks=[];
 for(const pose of ['ready','half','draw']){await page.evaluate(p=>BowStudy.setPose(p),pose);await page.waitForTimeout(60);const m=await page.evaluate(()=>BowStudy.metrics());for(let i=0;i<3;i++)assert.ok(Math.abs(m.string[3+i]-m.nock[i])<1e-6);assert.ok(m.arrowVisible);checks.push(pose+': nock attached to string');}
 await page.evaluate(()=>BowStudy.setPose('release'));await page.waitForTimeout(50);assert.equal((await page.evaluate(()=>BowStudy.metrics())).arrowVisible,false);checks.push('release hides launched arrow');
 await page.evaluate(()=>{BowStudy.setPose(null);LastArcherV26.test.play();LastArcherV26.test.clearEnemies();});
 await page.locator('#fire-btn').dispatchEvent('pointerdown',{pointerId:8,pointerType:'touch'});await page.waitForTimeout(350);assert.ok((await page.evaluate(()=>BowStudy.metrics())).pull>.10);await page.locator('#fire-btn').dispatchEvent('pointerup',{pointerId:8,pointerType:'touch'});await page.waitForTimeout(20);assert.ok((await page.evaluate(()=>LastArcherV26.getMetrics())).arrows>0);checks.push('real fire button draws and shoots');
 for(const z of [6,0,-8]){const m=await page.evaluate(z=>{const t=LastArcherV26.test;t.reset();t.clearEnemies();t.placePlayer(.2,13.6,0);t.spawn([.2,z]);t.aim([.2,1.3,z]);t.fire();for(let i=0;i<130;i++)t.step(.01);return LastArcherV26.getMetrics();},z);assert.ok(m.score>0);}checks.push('existing aiming hits near/middle/far targets');
 const mem=await page.evaluate(()=>{const t=LastArcherV26.test;t.reset();t.render(40);const before=LastArcherV26.getMetrics().memory;for(let i=0;i<120;i++){t.draw(i%2);t.render(40+i/60);}t.draw(0);return {before,after:LastArcherV26.getMetrics().memory};});assert.deepEqual(mem.before,mem.after);checks.push('no geometry/texture growth while posing');
 await page.evaluate(()=>{LastArcherV26.test.preview();BowStudy.setPose('draw');});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);await page.screenshot({path:path.join(out,'phone-draw.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks.push('portrait draw pose and layout');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'test-results.json'),JSON.stringify({passed:true,checks,mem,errors},null,2));console.log(JSON.stringify({passed:true,checks}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
