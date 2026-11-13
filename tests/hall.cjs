// V2 전시관(#hall-uxui, #hall-visual) 검사: 분야별 학생, 기둥 뒤 절반 보임에서 멈춤, 앞뒤 이동, 키보드, 학생 선택·닫기 후 제자리·초점,
// 큰 이름 글자, 움직임 줄이기, 3D 실패 대체 화면, 전시관별 내려받는 용량
// 실행: 8765 포트로 서버를 켠 뒤  node tests/hall.cjs   (인터넷이 막힌 곳은 CDN_DIR 설정, README 참고)
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const route=require('./cdn-route.cjs');
const base=process.env.TEST_URL || 'http://127.0.0.1:8765/';
const near=(a,b,e=0.02)=>Math.abs(a-b)<=e;
const MB=(n)=>(n/1048576).toFixed(1)+'MB';
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
 const sizes={};
 for(const id of ['hall-uxui','hall-visual']){
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});await route(ctx,process.env.CDN_DIR);
  const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'#'+id);
  await p.waitForSelector(`#${id}[data-loaded="1"]`,{state:'attached',timeout:120000});
  const info=await p.evaluate(id=>{const H=HALLS[id];return {field:H.T.field,names:H.students.map(s=>s.name),fields:H.students.map(s=>s.field),stops:H.stops,near:H.nearStops,half:H.halfStops};},id);
  // 0) 분야가 맞는 학생만, 분야 미정 학생은 빠짐
  assert(info.fields.every(f=>f===info.field),'다른 분야 학생이 섞이면 안 됨');
  for(const n of ['김준서','김우선','조민영','조예빈']) assert(!info.names.includes(n),'분야 미정 학생은 전시관에서 빠져야 함: '+n);
  assert.equal(info.stops.length,2+info.names.length*2-1,'멈춤 지점: 처음·끝 + 석고상 앞 + 절반 보임');
  const setScroll=(u)=>p.evaluate(([id,u])=>{const H=HALLS[id];H.root.scrollTop=u*hallScrollMax(H);},[id,u]);
  const settle=async()=>{await p.waitForFunction(id=>Math.abs(HALLS[id].progress-HALLS[id].target)<2e-4,id,{timeout:20000});await p.waitForTimeout(300);};
  const camXZ=()=>p.evaluate(id=>[HALLS[id].cam.position.x,HALLS[id].cam.position.z],id);

  // 1) 두 번째 석고상이 기둥 뒤에서 절반 보이는 곳에서 멈춤 + 첫 석고상 앞에서는 가려져 있음
  await setScroll(info.near[0]);await settle();
  const hidden=await p.evaluate(id=>{const H=HALLS[id];hallPose(H,H.toPath(H.progress));return hallVisible(H,H.busts[1]);},id);
  assert(hidden<0.2,'첫 석고상 앞에서는 두 번째가 기둥에 가려져야 함: '+hidden);
  await setScroll(info.half[1]);await settle();
  const ratio=await p.evaluate(id=>{const H=HALLS[id];hallPose(H,H.toPath(H.progress));return hallVisible(H,H.busts[1]);},id);
  assert(ratio>0.25&&ratio<0.75,'두 번째 석고상이 절반쯤 보여야 함: '+ratio);
  const here=await camXZ();await p.waitForTimeout(800);const still=await camXZ();
  assert(near(here[0],still[0],1e-3)&&near(here[1],still[1],1e-3),'스크롤을 멈추면 카메라도 멈춰야 함');
  // 서서히 드러남: 절반 보임 지점 앞뒤로 화면 높이의 1/4 이상 스크롤해야 다 드러남
  const span=await p.evaluate(id=>{const H=HALLS[id],b=H.busts[1];let a=null,z=null;for(let u=H.nearStops[0];u<=H.nearStops[1];u+=0.001){hallPose(H,H.toPath(u));const v=hallVisible(H,b);if(v>0.05&&a==null)a=u;if(v>0.95&&z==null)z=u;}return (z-a)*hallScrollMax(H)/H.root.clientHeight;},id);
  assert(span>0.25,'다음 석고상은 서서히 드러나야 함 (드러나는 데 필요한 스크롤 = 화면 '+span.toFixed(2)+'개)');
  console.log(id,'half reveal stop ok',ratio.toFixed(2),'reveal over',span.toFixed(2),'screens');

  // 2) 큰 이름 글자: 석고상 앞에서 그 학생 이름
  await setScroll(info.near[1]);await settle();await p.waitForTimeout(500);
  assert.equal(await p.locator(`#${id} .hall-type.on .ht-name`).textContent(),info.names[1]);
  console.log(id,'name type ok');

  // 3) 뒤로: 같은 길로 첫 석고상 앞
  await setScroll(info.near[0]);await settle();
  const back=await camXZ();const expect=await p.evaluate(([id,u])=>{const H=HALLS[id];const q=H.curve.getPointAt(H.toPath(u));return [q.x,q.z];},[id,info.near[0]]);
  assert(near(back[0],expect[0])&&near(back[1],expect[1]),'뒤로 가면 첫 번째 석고상 앞 위치 '+back+' vs '+expect);
  console.log(id,'backward ok');

  // 4) 키보드 ↓ → 다음 멈춤(절반 보임)
  await p.locator('#'+id).focus();await p.keyboard.press('ArrowDown');
  await p.waitForFunction(([id,s])=>Math.abs(HALLS[id].target-s)<0.003,[id,info.half[1]],{timeout:10000});await settle();
  console.log(id,'keyboard next ok');

  // 5) 학생 선택 → 소개 → 닫으면 같은 자리, 같은 초점
  await setScroll(info.near[0]);await settle();await p.waitForTimeout(300);
  const tag=p.locator(`#${id} .tr-tag.on`,{hasText:info.names[0]});await tag.focus();
  const before={top:await p.evaluate(id=>HALLS[id].root.scrollTop,id),cam:await camXZ()};
  await p.keyboard.press('Enter');await p.locator('#detail.on').waitFor();
  assert.equal(await p.locator('#d-name').textContent(),info.names[0]);
  assert.equal(await p.locator('#d-count').textContent(),`01 / ${String(info.names.length).padStart(2,'0')}`);
  await p.mouse.move(720,450);await p.mouse.wheel(0,900);await p.waitForTimeout(400);
  assert.equal(await p.evaluate(id=>HALLS[id].root.scrollTop,id),before.top,'소개가 열려 있는 동안 비행은 멈춤');
  await p.keyboard.press('Escape');await p.waitForTimeout(400);
  const after={top:await p.evaluate(id=>HALLS[id].root.scrollTop,id),cam:await camXZ()};
  assert.equal(after.top,before.top);assert(near(after.cam[0],before.cam[0],1e-3)&&near(after.cam[1],before.cam[1],1e-3),'소개를 닫으면 제자리');
  assert(await tag.evaluate(el=>document.activeElement===el),'닫은 뒤 초점이 이름표로 돌아와야 함');
  console.log(id,'select/close restore ok');

  sizes[id]=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/assets\/models\//.test(e.name)).reduce((n,e)=>n+(e.decodedBodySize||e.transferSize||0),0));
  assert.deepEqual(errors,[]);
  await ctx.close();
 }

 // 6) 움직임 줄이기: 부드럽게 따라가기·흔들림·둘러보기 없이 바로 그 자리
 const rctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});await route(rctx,process.env.CDN_DIR);
 const r=await rctx.newPage();await r.goto(base+'#hall-visual');await r.waitForSelector('#hall-visual[data-ready="1"]',{state:'attached',timeout:120000});
 await r.evaluate(()=>{const H=HALLS['hall-visual'];H.root.scrollTop=H.nearStops[1]*hallScrollMax(H);});await r.waitForTimeout(250);
 assert(await r.evaluate(()=>{const H=HALLS['hall-visual'];return Math.abs(H.progress-H.target)<1e-6;}),'움직임 줄이기면 바로 이동');
 await r.mouse.move(1200,200);await r.waitForTimeout(300);
 assert(await r.evaluate(()=>HALLS['hall-visual'].look.x===0),'움직임 줄이기면 마우스 둘러보기 꺼짐');
 console.log('reduced motion ok');
 await rctx.close();

 // 7) 3D 실패 → 전체 학생 보기 / 다시 시도
 const fctx=await browser.newContext();await route(fctx,process.env.CDN_DIR);
 const f=await fctx.newPage();await f.goto(base+'?fail3d#hall-uxui');await f.locator('#hall-uxui .tr-fail:not([hidden])').waitFor();await f.waitForTimeout(300);
 assert.equal(await f.evaluate(()=>document.activeElement.dataset.act),'retry');
 await f.locator('#hall-uxui [data-act="list"]').click();assert.equal(await f.evaluate(()=>page),'list');
 console.log('fallback ok');

 console.log('석고상 파일 용량:',Object.entries(sizes).map(([k,v])=>k+' '+MB(v)).join(', '));
 console.log('PASS: halls by field, half-reveal stop + gradual reveal, name type, backward, keyboard, select/close restore, reduced motion, 3D fallback; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
