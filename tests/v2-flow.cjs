// V2 전체 흐름 검사 (s4 슬로건은 아직 없음): 오프닝(s1~s3) → 로비(s5) → 전시관(s6) / 스페셜룸(s7) → 목록(s8)
// 건너뛰기, 키보드만으로 이동, 움직임 줄이기, 모바일 카드 로비, 3D 실패 시 카드 로비, 스페셜룸 랜덤·모아 보기·소개 창
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

 // 1) 오프닝: s1 → s2 → s3 순서로 넘어가고 [입장하기]가 나타남. 메뉴는 숨어 있고 건너뛰기는 항상 보임
 let p=await open();
 assert.equal(await state(p),'opening');assert.equal(await p.locator('#topbar.on').count(),0);
 await p.locator('#op-skip').waitFor({state:'visible'});
 assert.equal(await p.locator('#opening').getAttribute('data-shot'),'1');
 await p.waitForFunction(()=>document.querySelector('#opening').dataset.shot==='2',null,{timeout:8000});
 await p.waitForFunction(()=>document.querySelector('#opening').dataset.shot==='3',null,{timeout:8000});
 await p.locator('#op-copy.on').waitFor({timeout:6000});
 // 키보드: [입장하기]에 초점이 가 있고 Enter로 입장 → 로비
 assert(await p.locator('#op-enter').evaluate(el=>document.activeElement===el),'입장하기 버튼에 초점');
 await p.keyboard.press('Enter');
 await p.waitForFunction(()=>page==='lobby3d',null,{timeout:5000});
 assert.equal(new URL(p.url()).hash,'#lobby3d');assert.equal(await p.locator('#topbar.on').count(),1);
 console.log('opening → lobby ok');

 // 2) 로비: 입구 3개(버튼)와 학생 수, 3D 아치가 켜짐, 전체 학생 바로가기
 await p.waitForSelector('#lobby3d[data-ready="1"]',{timeout:60000});
 assert.equal(await p.locator('#lobby3d.is3d canvas').count(),1);
 assert.deepEqual(await p.locator('.lb-door b').allTextContents(),['UX/UI의 방','비주얼의 방','스페셜룸']);
 assert.equal(await p.locator('#lb-count-0').textContent(),'7명의 석고상');assert.equal(await p.locator('#lb-count-1').textContent(),'4명의 석고상');
 // 키보드로 가운데 방 고르기 → Visual 전시관으로 날아 들어감
 await p.locator('.lb-door[data-door="1"]').focus();await p.keyboard.press('Enter');
 await p.waitForFunction(()=>page==='hall-visual',null,{timeout:6000});
 await p.waitForFunction(()=>!lb.flying,null,{timeout:6000});
 console.log('lobby → hall ok');
 // 전시관에서 메뉴로 로비·목록·스페셜룸에 갈 수 있음
 await p.locator('.pill [data-go="lobby3d"]').click();assert.equal(await state(p),'lobby3d');
 await p.locator('#lb-all').click();assert.equal(await state(p),'list');
 await p.locator('.pill [data-go="hall-uxui"]').click();assert.equal(await state(p),'hall-uxui');
 await p.locator('.pill [data-go="special"]').click();assert.equal(await state(p),'special');assert.equal(new URL(p.url()).hash,'#special');

 // 3) 스페셜룸: 랜덤 작품, 연달아 같은 작품 없음, 15번 누르면 15명 모두 한 번씩
 const name=()=>p.locator('#sp-name').textContent();
 const seen=[await name()];
 for(let i=0;i<14;i++){await p.locator('#sp-next').click();seen.push(await name());}
 assert.equal(new Set(seen).size,15,'15번 안에 15명이 모두 나와야 함');
 for(let i=0;i<20;i++){const before=await name();await p.locator('#sp-next').click();assert.notEqual(await name(),before,'같은 작품이 연달아 나오면 안 됨');}
 // 방향키로도 바뀜
 const k0=await name();await p.locator('#special').focus();await p.keyboard.press('ArrowRight');assert.notEqual(await name(),k0);
 // 대표 작품이 아직 없어서 임시 카드
 assert.equal(await p.locator('#sp-work .sp-temp').count(),1);
 // SELECT → 학생 소개 창, 닫으면 같은 작품 + SELECT 버튼에 초점
 const cur=await name();await p.locator('#sp-select').focus();await p.keyboard.press('Enter');
 await p.locator('#detail.on').waitFor();assert.equal(await p.locator('#d-name').textContent(),cur);
 await p.keyboard.press('Escape');assert.equal(await name(),cur);assert(await p.locator('#sp-select').evaluate(el=>document.activeElement===el));
 // 모아 보기: 15장, 하나 고르면 액자에 걸림, Esc로 돌아옴
 await p.locator('#sp-all').click();assert.equal(await p.locator('.sp-card').count(),15);
 await p.keyboard.press('Escape');assert.equal(await p.locator('#sp-ring-wrap').isHidden(),true);
 await p.locator('#sp-all').click();await p.locator('.sp-card[data-i="6"]').focus();await p.keyboard.press('Enter');
 assert.equal(await name(),'박수빈');assert.equal(await p.locator('#sp-ring-wrap').isHidden(),true);
 console.log('special ok');

 // 4) 건너뛰기 → 바로 로비. 한 번 본 뒤에는 건너뛰기 버튼이 강조됨. BEYOND THE FRAME을 누르면 오프닝 다시 보기
 await p.goto(base);await p.reload();assert.equal(await state(p),'opening');
 assert.equal(await p.locator('#opening.seen').count(),1,'입장해 본 사람은 건너뛰기 강조');
 await p.locator('#op-skip').click();assert.equal(await state(p),'lobby3d');
 await p.locator('.pill [data-go="list"]').click();await p.locator('#brand').click();assert.equal(await state(p),'opening');
 await p.keyboard.press('Escape');assert.equal(await state(p),'lobby3d');
 console.log('skip ok');
 await p.context().close();

 // 5) 움직임 줄이기: 오프닝은 입구 그림 + [입장하기]가 바로 보이고, 로비에서 방을 고르면 비행 없이 바로 이동
 p=await open({reducedMotion:'reduce'});
 assert.equal(await p.locator('#opening').getAttribute('data-shot'),'3');await p.locator('#op-copy.on').waitFor({timeout:2000});
 await p.locator('#op-enter').click();await p.waitForFunction(()=>page==='lobby3d',null,{timeout:3000});
 await p.locator('.lb-door[data-door="2"]').click();await p.waitForFunction(()=>page==='special',null,{timeout:2000});
 await p.locator('#sp-all').click();assert.equal(await p.locator('#special.flat').count(),1,'움직임 줄이기: 도는 띠 대신 카드 묶음');
 console.log('reduced motion ok');
 await p.context().close();

 // 6) 모바일: 3D 로비 대신 아치 카드 3장 + 전체 학생 바로가기, 스페셜룸은 메뉴에서 바로
 p=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.locator('#op-skip').tap();assert.equal(await state(p),'lobby3d');
 assert.equal(await p.locator('#lobby3d.is3d').count(),0);assert.equal(await p.locator('#lobby3d canvas').count(),0,'모바일 로비는 3D를 불러오지 않음');
 assert.equal(await p.locator('.lb-door:visible').count(),3);
 await p.locator('#lb-all').tap();assert.equal(await state(p),'list');assert.equal(await p.locator('.card').count(),15);
 await p.locator('.pill [data-go="special"]').tap();assert.equal(await state(p),'special');
 await p.locator('.pill [data-go="lobby3d"]').tap();await p.locator('.lb-door[data-door="0"]').tap();assert.equal(await state(p),'hall-uxui');
 console.log('mobile ok');
 await p.context().close();

 // 7) 3D 실패(?fail3d): 로비는 카드로 바뀌어서 그대로 쓸 수 있고, 목록도 열림
 p=await open({},base+'?fail3d#lobby3d');
 assert.equal(await p.locator('#lobby3d').getAttribute('data-ready'),'cards');assert.equal(await p.locator('.lb-door:visible').count(),3);
 await p.locator('.lb-door[data-door="2"]').click();assert.equal(await state(p),'special');
 await p.locator('.pill [data-go="list"]').click();assert.equal(await p.locator('.card').count(),15);
 console.log('3D fallback ok');
 await p.context().close();

 assert.deepEqual(errors,[]);
 console.log('PASS: opening s1→s3 + enter, skip, replay, lobby doors (3D/keyboard/cards), special room random/ring/detail, reduced motion, mobile, 3D fallback; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
