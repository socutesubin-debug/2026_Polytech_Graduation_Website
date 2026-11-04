const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.TEST_URL || 'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 console.log('desktop');
 await p.goto(base+'#list');await p.locator('.card').first().waitFor();
 await p.locator('#gallery-filter').selectOption('1');assert.equal(await p.locator('.card').count(),5);
 await p.locator('#search').fill('박');assert.equal(await p.locator('.card').count(),3);
 await p.locator('.card').first().focus();await p.keyboard.press('Enter');
 assert.equal(await p.evaluate(()=>page),'list');assert.equal(await p.locator('#d-name').textContent(),'박재연');
 await p.locator('#d-prev').click();assert.equal(await p.locator('#d-name').textContent(),'박호성');
 for(let i=0;i<8;i++){await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.activeElement.closest('#detail')!==null));}
 await p.keyboard.press('Escape');assert.equal(await p.locator('#search').inputValue(),'박');assert.equal(await p.locator('#gallery-filter').inputValue(),'1');assert(await p.locator('.card').first().evaluate(el=>document.activeElement===el));
 // The list scroll and card survive opening/closing the overlay.
 await p.locator('#search').fill('');await p.locator('#gallery-filter').selectOption('-1');
 await p.locator('.card').last().scrollIntoViewIfNeeded();const scroll=await p.locator('#list').evaluate(el=>el.scrollTop);
 await p.locator('.card').last().focus();await p.keyboard.press('Enter');await p.keyboard.press('Escape');assert.equal(await p.locator('#list').evaluate(el=>el.scrollTop),scroll);
 await p.locator('.pill [data-room="0"]').first().click();await p.locator('#gallery.on').waitFor();
 await p.locator('.hot').last().focus();await p.keyboard.press('Enter');await p.locator('#d-next').click();assert.equal(await p.locator('#d-name').textContent(),'김예일');assert.equal(await p.evaluate(()=>room),0);
 const pose=await p.evaluate(()=>[gallery.cx,gallery.cy,gallery.z]);await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>[gallery.cx,gallery.cy,gallery.z]),pose);
 assert.equal(await p.locator('#d-portfolio').textContent(),'포트폴리오 준비 중');await p.keyboard.press('Escape');
 await p.locator('[data-go="lobby"]').click();await p.waitForTimeout(1000);
 await p.locator('.frame-btn').first().click({force:true});await p.locator('[data-go="list"]').click();await p.waitForTimeout(1100);await p.locator('[data-go="lobby"]').click();
 assert.deepEqual(await p.evaluate(()=>[lobby.frozen,lobby.el.style.transform,lobby.el.classList.contains('zooming')]),[false,'',false]);
 // Room transition cancelled by LIST must not later replace the list route/hash.
 await p.locator('.pill [data-room="0"]').first().click();await p.locator('.pill [data-room="1"]').first().click();await p.locator('[data-go="list"]').click();await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>page),'list');assert.equal(new URL(p.url()).hash,'#list');

 console.log('desktop passed');
 const mc=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mobile=await mc.newPage();await mobile.goto(base);await mobile.locator('#list.on').waitFor();await mobile.locator('.card').first().click();await mobile.locator('#detail.on').waitFor();await mobile.keyboard.press('Escape');
 console.log('mobile passed');
 const reduced=await browser.newContext({reducedMotion:'reduce'});const rp=await reduced.newPage();await rp.goto(base+'#lobby');await rp.mouse.move(1200,100);await rp.waitForTimeout(200);assert(await rp.evaluate(()=>lobby.ox === 0 && lobby.oy === 0));
 assert.deepEqual(errors,[]);console.log('PASS: list filter/search/scope, focus trap/restore, scroll restore, gallery wrap/camera freeze, cancelled transitions, mobile entry, reduced motion; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
