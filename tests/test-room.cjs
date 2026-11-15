// 시험 방(#test-room) 검사: 기둥 뒤 절반 보임에서 멈춤, 앞뒤 이동, 학생 선택, 소개 닫은 뒤 제자리·초점 복귀, 3D 실패 대체 화면
// 실행: 8765 포트로 서버를 켠 뒤  node tests/test-room.cjs
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const route=require('./cdn-route.cjs');
const base=process.env.TEST_URL || 'http://127.0.0.1:8765/';
const near=(a,b,e=0.02)=>Math.abs(a-b)<=e;
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});await route(ctx,process.env.CDN_DIR);
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'#test-room');
 await p.waitForSelector('#test-room[data-ready="1"]',{state:'attached',timeout:90000});
 const settle=async()=>{await p.waitForFunction(()=>Math.abs(TR.progress-TR.target)<1e-3,null,{timeout:20000});await p.waitForTimeout(300);};
 const camXZ=()=>p.evaluate(()=>[TR.cam.position.x,TR.cam.position.z]);
 const stops=await p.evaluate(()=>TR.stops);
 assert.equal(stops.length,6);

 // 1) 두 번째 석고상이 기둥 뒤에서 절반 보이는 지점까지 스크롤하고 손을 떼면 그 자리에 머문다
 await p.evaluate(s=>{tr.scrollTop=s*trScrollMax();},stops[2]);await settle();
 const ratio=await p.evaluate(()=>{trPose(TR.progress);return trVisible(TR.busts[1]);});
 assert(ratio>0.3&&ratio<0.7,'두 번째 석고상이 절반쯤 보여야 함: '+ratio);
 const here=await camXZ();await p.waitForTimeout(800);const still=await camXZ();
 assert(near(here[0],still[0],1e-3)&&near(here[1],still[1],1e-3),'스크롤을 멈추면 카메라도 멈춰야 함');
 console.log('half reveal stop ok', ratio.toFixed(2));

 // 2) 위로 스크롤하면 같은 길로 첫 번째 석고상 앞으로 돌아간다
 await p.evaluate(s=>{tr.scrollTop=s*trScrollMax();},stops[1]);await settle();
 const back=await camXZ();const expect=await p.evaluate(s=>{const q=TR.curve.getPointAt(s);return [q.x,q.z];},stops[1]);
 assert(near(back[0],expect[0])&&near(back[1],expect[1]),'뒤로 가면 첫 번째 석고상 앞 위치');
 assert(await p.locator('.tr-tag[data-i]').first().evaluate(el=>el.classList.contains('on')),'첫 번째 학생 이름표가 보여야 함');
 console.log('backward ok');

 // 3) 키보드 ↓ 로 다음 지점(절반 보임)으로
 await p.locator('#test-room').focus();await p.keyboard.press('ArrowDown');
 await p.waitForFunction(s=>Math.abs(TR.target-s)<0.003,stops[2],{timeout:10000});await settle();
 console.log('keyboard next ok');

 // 4) 학생 선택 → 소개 → 닫으면 같은 자리, 같은 초점
 const tag=p.locator('.tr-tag.on',{hasText:'민하도'});await tag.focus();
 const before={top:await p.evaluate(()=>tr.scrollTop),cam:await camXZ()};
 await p.keyboard.press('Enter');await p.locator('#detail.on').waitFor();
 assert.equal(await p.locator('#d-name').textContent(),'민하도');
 assert.equal(await p.locator('#d-room').textContent(),'Visual');
 await p.mouse.move(720,450);await p.mouse.wheel(0,900);await p.waitForTimeout(400); // 소개 위에서 스크롤해도 비행은 멈춰 있음
 assert.equal(await p.evaluate(()=>tr.scrollTop),before.top);
 await p.keyboard.press('Escape');await p.waitForTimeout(400);
 const after={top:await p.evaluate(()=>tr.scrollTop),cam:await camXZ()};
 assert.equal(after.top,before.top);assert(near(after.cam[0],before.cam[0],1e-3)&&near(after.cam[1],before.cam[1],1e-3),'소개를 닫으면 제자리');
 assert(await tag.evaluate(el=>document.activeElement===el),'닫은 뒤 초점이 이름표로 돌아와야 함');
 console.log('select/close restore ok');

 // 5) 3D 실패 → 전체 학생 보기 / 다시 시도
 const f=await ctx.newPage();await f.goto(base+'?fail3d#test-room');await f.locator('#tr-fail:not([hidden])').waitFor();await f.waitForTimeout(300);
 assert.equal(await f.evaluate(()=>document.activeElement.id),'tr-retry');
 await f.locator('#tr-to-list').click();assert.equal(await f.evaluate(()=>page),'list');
 console.log('fallback ok');

 assert.deepEqual(errors,[]);
 console.log('PASS: test room half-reveal stop, backward, keyboard, select/close restore, 3D fallback; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
