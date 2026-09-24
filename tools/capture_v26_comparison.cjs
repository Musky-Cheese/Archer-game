const {chromium}=require('playwright'),path=require('node:path'),{pathToFileURL}=require('node:url'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const root=path.resolve(__dirname,'..');await page.goto(pathToFileURL(path.join(root,'docs/v2.6/comparison.html')).href);
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 await page.screenshot({path:path.join(root,'docs/v2.6/comparison.png'),clip:{x:0,y:0,width:1600,height:650}});
 await page.getByRole('button',{name:'Full draw'}).click();assert.ok((await page.locator('#detail').getAttribute('src')).endsWith('hero-draw.png'));
 assert.deepEqual(errors,[]);console.log('Comparison images load and view selector works.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
