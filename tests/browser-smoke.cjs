// 목록(LIST)과 옛 V1 화면 검사: 검색·분야 선택, 소개 창 초점 가두기·복원, 스크롤 복원, V1 전시실·로비 전환 취소
// 실행: 8765 포트로 서버를 켠 뒤  node tests/browser-smoke.cjs   (인터넷이 막힌 곳은 CDN_DIR 설정, README 참고)
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const route=require('./cdn-route.cjs');
const base=process.env.TEST_URL || 'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}});await route(context,process.env.CDN_DIR);
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 console.log('desktop');
 // 목록: 3D를 쓰지 않고 15명이 모두 보임
 await p.goto(base+'#list');await p.locator('.card').first().waitFor();
 assert.equal(await p.locator('.card').count(),15);assert.equal(await p.locator('#list canvas').count(),0,'목록은 3D 없이 떠야 함');
 assert.match(await p.locator('#total').textContent(),/총 인원 15명/);
 await p.locator('#field-filter [data-field="visual"]').click();assert.equal(await p.locator('.card').count(),5);
 await p.locator('#field-filter [data-field="uxui"]').click();assert.equal(await p.locator('.card').count(),8);
 await p.locator('#search').fill('박');assert.equal(await p.locator('.card').count(),3);
 await p.locator('.card').first().focus();await p.keyboard.press('Enter');
 assert.equal(await p.evaluate(()=>page),'list');assert.equal(await p.locator('#d-name').textContent(),'박재연');
 await p.locator('#d-prev').click();assert.equal(await p.locator('#d-name').textContent(),'박호성');
 for(let i=0;i<8;i++){await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.activeElement.closest('#detail')!==null));}
 // 소개를 닫으면 검색어·분야 선택·초점이 그대로
 await p.keyboard.press('Escape');assert.equal(await p.locator('#search').inputValue(),'박');
 assert.equal(await p.locator('#field-filter [data-field="uxui"]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('.card').count(),3);
 assert(await p.locator('.card').first().evaluate(el=>document.activeElement===el));
 // 목록 스크롤 위치도 그대로
 await p.locator('#search').fill('');await p.locator('#field-filter [data-field="all"]').click();
 await p.locator('.card').last().scrollIntoViewIfNeeded();const scroll=await p.locator('#list').evaluate(el=>el.scrollTop);assert(scroll>0);
 await p.locator('.card').last().focus();await p.keyboard.press('Enter');await p.keyboard.press('Escape');assert.equal(await p.locator('#list').evaluate(el=>el.scrollTop),scroll);
 // 포트폴리오 주소가 없는 학생
 await p.locator('#search').fill('김예일');await p.locator('.card').first().click();assert.equal(await p.locator('#d-portfolio').textContent(),'포트폴리오 준비 중');await p.keyboard.press('Escape');
 // 옛 V1 전시실(#gallery-1): 소개가 열려 있는 동안 배경이 멈춤
 await p.goto(base+'#gallery-1');await p.reload();await p.locator('#gallery.on').waitFor();
 await p.locator('.hot').last().focus();await p.keyboard.press('Enter');await p.locator('#d-next').click();assert.equal(await p.locator('#d-name').textContent(),'김예일');assert.equal(await p.evaluate(()=>room),0);
 const pose=await p.evaluate(()=>[gallery.cx,gallery.cy,gallery.z]);await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>[gallery.cx,gallery.cy,gallery.z]),pose);
 await p.keyboard.press('Escape');
 // 옛 V1 로비: 들어가는 도중 메뉴 Project를 누르면 전환이 취소되고 Project 방에 그대로 있음
 await p.evaluate(()=>go('lobby'));await p.waitForTimeout(1000);
 await p.locator('.frame-btn').first().click({force:true});await p.locator('[data-go="project"]').click();await p.waitForTimeout(1100);
 assert.equal(await p.evaluate(()=>page),'project');assert.equal(new URL(p.url()).hash,'#project');
 await p.evaluate(()=>go('lobby'));
 assert.deepEqual(await p.evaluate(()=>[lobby.frozen,lobby.el.style.transform,lobby.el.classList.contains('zooming')]),[false,'',false]);
 console.log('desktop passed');
 const mc=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await route(mc,process.env.CDN_DIR);
 const mobile=await mc.newPage();mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto(base+'#list');await mobile.locator('#list.on').waitFor();await mobile.locator('.card').first().click();await mobile.locator('#detail.on').waitFor();await mobile.keyboard.press('Escape');
 console.log('mobile passed');
 const reduced=await browser.newContext({reducedMotion:'reduce'});await route(reduced,process.env.CDN_DIR);
 const rp=await reduced.newPage();await rp.goto(base+'#lobby');await rp.mouse.move(1200,100);await rp.waitForTimeout(200);assert(await rp.evaluate(()=>lobby.ox === 0 && lobby.oy === 0));
 assert.deepEqual(errors,[]);console.log('PASS: list field filter/search, focus trap/restore, scroll restore, V1 gallery camera freeze, cancelled transitions, mobile list, reduced motion; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
