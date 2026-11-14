// 새 기획(2026-11-14) 흐름 검사: Intro(오프닝) → Project 방 / Designer 방
// Intro 끝의 [Project] [Designer] 버튼, 건너뛰기, 메뉴 3개, Project 첫 화면(떠다니는 카드) → 작품 목록 → 작품 상세(그림 14칸) → 만든 사람 → Designer 석고상,
// Designer 가로 한 줄(휠·화살표·키보드), 표찰 = 포트폴리오 새 탭, 분야 고르기, 움직임 줄이기, 모바일
// 실행: 8765 포트로 서버를 켠 뒤  node tests/v2-flow.cjs   (인터넷이 막힌 곳은 CDN_DIR 설정, README 참고)
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const route=require('./cdn-route.cjs');
const base=process.env.TEST_URL || 'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
 const errors=[];
 const open=async(opts={},url=base)=>{const ctx=await browser.newContext({viewport:{width:1440,height:900},...opts});await route(ctx,process.env.CDN_DIR);const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);return p;};
 const state=(p)=>p.evaluate(()=>page);

 // 1) Intro: s1 → s2 → s3 다음 [Project] [Designer] 버튼. 메뉴는 숨어 있고 건너뛰기는 항상 보임
 let p=await open();
 assert.equal(await state(p),'opening');assert.equal(await p.locator('#topbar.on').count(),0);
 await p.locator('#op-skip').waitFor({state:'visible'});
 await p.waitForFunction(()=>document.querySelector('#opening').dataset.shot==='3',null,{timeout:12000});
 await p.locator('#op-copy.on').waitFor({timeout:6000});
 assert.deepEqual(await p.locator('.op-enter').allTextContents(),['Project','Designer']);
 assert(await p.locator('#op-enter').evaluate(el=>document.activeElement===el),'Project 버튼에 초점');
 await p.locator('#op-enter-2').click();
 await p.waitForFunction(()=>page==='designer',null,{timeout:5000});
 assert.equal(new URL(p.url()).hash,'#designer');assert.equal(await p.locator('#topbar.on').count(),1);
 assert.deepEqual(await p.locator('.pill button').allTextContents(),['Intro','Project','Designer']);
 // 메뉴 Intro → 오프닝 다시, 건너뛰기(Esc) → Project 방
 await p.locator('.pill [data-go="opening"]').click();assert.equal(await state(p),'opening');
 await p.keyboard.press('Escape');assert.equal(await state(p),'project');assert.equal(new URL(p.url()).hash,'#project');
 console.log('intro ok');

 // 2) Project 방: 떠다니는 카드 15장 + 큰 글자, 스크롤하면 작품 목록, 분야 고르기
 assert.equal(await p.locator('.pj-card').count(),15);assert.equal(await p.locator('#pj-word').textContent(),'Project');
 const t0=await p.locator('.pj-card').first().evaluate(el=>el.style.transform);await p.waitForTimeout(300);
 assert.notEqual(await p.locator('.pj-card').first().evaluate(el=>el.style.transform),t0,'카드가 떠다님');
 await p.waitForTimeout(1000);await p.locator('#pj-down').click({force:true});await p.waitForFunction(()=>document.querySelector('#project').scrollTop>=innerHeight-2,null,{timeout:5000});
 assert.equal(await p.locator('.pj-item:visible').count(),15);assert.equal(await p.locator('#pj-count').textContent(),'15개의 작품');
 await p.locator('#pj-filter [data-field="visual"]').click();assert.equal(await p.locator('.pj-item:visible').count(),4);
 await p.locator('#pj-filter [data-field="uxui"]').click();assert.equal(await p.locator('.pj-item:visible').count(),7);
 await p.locator('#pj-filter [data-field="all"]').click();assert.equal(await p.locator('.pj-item:visible').count(),15);
 // 작품 상세: 그림 14칸, ← → 이전/다음, Esc 닫으면 누른 카드에 초점
 await p.locator('.pj-item').nth(6).click();await p.locator('#pj-detail.on').waitFor();
 assert.match(await p.locator('#pj-d-no').textContent(),/^07 \/ 15/);assert.equal(await p.locator('.pj-shot').count(),14);
 assert.equal(await p.locator('#pj-d-who').textContent(),'박수빈 →');
 await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#pj-d-who').textContent(),'박호성 →');
 await p.keyboard.press('ArrowLeft');await p.keyboard.press('Escape');await p.waitForTimeout(400);
 assert.equal(await p.locator('#pj-detail').isHidden(),true);
 assert(await p.locator('.pj-item').nth(6).evaluate(el=>document.activeElement===el),'닫으면 누른 작품에 초점');
 // 만든 사람 → Designer 방의 그 석고상이 가운데 + 표찰에 초점
 await p.locator('.pj-item').nth(6).click();await p.locator('#pj-detail.on').waitFor();await p.locator('#pj-d-who').click();
 await p.waitForFunction(()=>page==='designer',null,{timeout:3000});await p.waitForTimeout(300);
 const centered=await p.evaluate(()=>{const li=document.querySelector('.dg-item[data-i="6"]').getBoundingClientRect();return Math.abs(li.left+li.width/2-innerWidth/2);});
 assert(centered<4,`박수빈 석고상이 가운데 (${centered}px)`);
 assert(await p.evaluate(()=>document.activeElement.closest('.dg-item')?.dataset.i==='6'),'박수빈 표찰에 초점');
 console.log('project ok');

 // 3) Designer 방: 석고상 15개 가로 한 줄, 표찰 = 포트폴리오 새 탭, 주소 없으면 준비 중
 assert.equal(await p.locator('.dg-item').count(),15);
 const plate=p.locator('.dg-item[data-i="6"] .dg-plate');
 assert.equal(await plate.getAttribute('href'),'https://vinportfolio-desk-flow.vercel.app');assert.equal(await plate.getAttribute('target'),'_blank');
 assert.equal(await p.locator('.dg-item[data-i="0"] a.dg-plate').count(),0);assert.match(await p.locator('.dg-item[data-i="0"] .dg-go').textContent(),/준비 중/);
 assert.equal(await p.locator('.dg-item[data-i="6"] .dg-name').textContent(),'박수빈');
 // 휠(위아래)을 굴리면 옆으로, ← → 키, 버튼
 await p.evaluate(()=>{dg.row.scrollLeft=0;});await p.mouse.move(720,450);
 await p.mouse.wheel(0,600);await p.waitForTimeout(300);const x1=await p.evaluate(()=>dg.row.scrollLeft);assert(x1>300,`휠로 옆으로 움직임 (${x1})`);
 await p.locator('#designer').focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(900);
 assert(await p.evaluate(()=>dg.row.scrollLeft)>x1,'→ 키로 다음 석고상');
 await p.locator('#dg-filter [data-field="visual"]').click();assert.equal(await p.locator('.dg-item:visible').count(),4);assert.equal(await p.locator('#dg-count').textContent(),'4명의 디자이너');
 await p.locator('#dg-filter [data-field="all"]').click();
 // [대표 작품 보기] → Project 방의 그 작품 상세
 await p.locator('.dg-item[data-i="1"] .dg-work').click();await p.locator('#pj-detail.on').waitFor();
 assert.equal(await state(p),'project');assert.equal(await p.locator('#pj-d-who').textContent(),'민하도 →');
 await p.locator('.pill [data-go="designer"]').click();assert.equal(await p.locator('#pj-detail').evaluate(el=>el.classList.contains('on')),false,'다른 방으로 가면 상세가 닫힘');
 console.log('designer ok');
 await p.context().close();

 // 4) 움직임 줄이기: Intro는 버튼이 바로 보이고, 카드는 떠다니지 않음
 p=await open({reducedMotion:'reduce'});
 assert.equal(await p.locator('#opening').getAttribute('data-shot'),'3');await p.locator('#op-copy.on').waitFor({timeout:2000});
 await p.locator('#op-enter').click();await p.waitForFunction(()=>page==='project',null,{timeout:3000});
 assert.equal(await p.locator('#project.still').count(),1);
 const s0=await p.locator('.pj-card').first().evaluate(el=>el.style.transform);await p.waitForTimeout(300);
 assert.equal(await p.locator('.pj-card').first().evaluate(el=>el.style.transform),s0,'움직임 줄이기: 카드가 멈춰 있음');
 console.log('reduced motion ok');
 await p.context().close();

 // 5) 모바일: 메뉴 3개, Designer는 손가락으로 옆으로 넘김(한 명씩 딱 멈춤)
 p=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.locator('#op-skip').tap();assert.equal(await state(p),'project');
 await p.locator('.pill [data-go="designer"]').tap();assert.equal(await state(p),'designer');
 assert.equal(await p.locator('.dg-row').evaluate(el=>getComputedStyle(el).scrollSnapType),'x mandatory');
 const w=await p.locator('.dg-item').first().evaluate(el=>el.getBoundingClientRect().width);assert(w>280&&w<320,`모바일 석고상 칸 너비 (${w})`);
 console.log('mobile ok');
 await p.context().close();

 assert.deepEqual(errors,[]);
 console.log('PASS: intro buttons + skip + menu, project floating cards → list → detail (14 images) → designer, designer row (wheel/keys/filter/portfolio plaque), reduced motion, mobile; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
