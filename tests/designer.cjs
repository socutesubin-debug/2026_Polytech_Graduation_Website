// Designer(밝은 미술관) 검사: 가운데 안내판에서 시작(왼쪽 UX/UI 8명, 오른쪽 Visual 6명), 안내판 화살표·분야 메뉴 이동,
// 좌우 버튼·키·휠·끌기(안내판도 멈추는 자리), 이름표가 석고상에 붙어 있는지(움직이는 중에도),
// 석고상·이름표 누르기 = 포트폴리오 새 탭, 깔끔한 배경(3D 안내판·아치 없음, 벽 사인), 이름표 = 이름 + '~디자이너',
// 전체 보기, 화면을 떠나면 3D 정리, 3D가 안 되면 목록, 움직임 줄이기, 모바일
// 실행: 8765 포트로 서버를 켠 뒤  node tests/designer.cjs   (인터넷이 막힌 곳은 CDN_DIR 설정, README 참고)
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const route=require('./cdn-route.cjs');
const base=process.env.TEST_URL || 'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
 const errors=[];
 const open=async(opts={},url=base+'#designer')=>{const ctx=await browser.newContext({viewport:{width:1440,height:900},...opts});await route(ctx,process.env.CDN_DIR);const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);return p;};
 const ready=(p)=>p.waitForFunction(()=>dg.gl&&dg.gl.busts.every(b=>b.loaded)&&Math.abs(dg.x-dg.tx)<1e-3&&Math.abs(dg.zoom-dg.tzoom)<1e-3,null,{timeout:15000});
 // 이름표(HTML)의 가운데와, 같은 프레임의 카메라로 계산한 석고상 자리의 차이 (px). 보이는 이름표만
 const drift=(p)=>p.evaluate(()=>new Promise(res=>requestAnimationFrame(()=>{const G=dg.gl,v=new G.THREE.Vector3();let worst=0;
   dg.caps.forEach((el,k)=>{if(el.classList.contains('off'))return;const r=el.querySelector('.dg-plaque').getBoundingClientRect();if(r.right<0||r.left>innerWidth)return;
     v.set(dg.people[k].x,0,DG.pedZ+DG.ped.d/2).project(G.cam);const x=(v.x+1)/2*innerWidth;worst=Math.max(worst,Math.abs(r.left+r.width/2-x));});res(worst);})));
 const centerOf=(p,i)=>p.evaluate(i=>{const r=document.querySelector(`.dg-cap[data-i="${i}"] .dg-plaque`).getBoundingClientRect();return r.left+r.width/2-innerWidth/2;},i);

 // 1) 데스크톱: 처음엔 가운데 안내판 앞. 14명, UX/UI 8명은 왼쪽(x<0) · Visual 6명은 오른쪽(x>0), 조민영 없음
 let p=await open();await ready(p);
 // 마우스 깊이감: 아주 조금만 (화면 끝에 마우스를 둬도 카메라는 수 cm만 움직임). 정렬 검사 동안은 끔
 await p.mouse.move(1430,890);await p.waitForTimeout(1500);
 const [par,lim]=await p.evaluate(()=>[Math.abs(dg.gl.cam.position.x-dg.x),DG.parallax]);assert(par>0.01&&par<=lim+1e-6,`마우스 깊이감 ${par}`);
 await p.evaluate(()=>{DG.parallax=0;dg.dirty=true;});await p.waitForTimeout(1500);
 assert.equal(await p.locator('#dg-stage canvas').count(),1,'3D 캔버스 하나');
 const people=await p.evaluate(()=>dg.people.map(q=>[q.s.name,q.s.field]));
 assert.equal(people.length,14);assert(!people.some(q=>q[0]==='조민영'));
 assert.deepEqual(people.slice(0,8).map(q=>q[1]),Array(8).fill('uxui'));assert.deepEqual(people.slice(8).map(q=>q[1]),Array(6).fill('visual'));
 assert.deepEqual(people.filter(q=>q[1]==='uxui').map(q=>q[0]).sort(),['김예일','김우선','박수빈','박재연','박호성','손예진','오수한','천승현'].sort());
 assert.deepEqual(people.filter(q=>q[1]==='visual').map(q=>q[0]).sort(),['김수연','김준서','민하도','송예준','조예빈','하태랑'].sort());
 assert(await p.evaluate(()=>dg.people.every(q=>q.s.field==='uxui'?q.x<0:q.x>0)),'UX/UI는 왼쪽, Visual은 오른쪽');
 assert.equal(await p.locator('#dg-tabs, .dg-lintel').count(),0,'위 분야 메뉴·아치 위 글자 없음 (안내판이 대신함)');
 assert(await p.evaluate(()=>dg.hubOn&&Math.abs(dg.x)<1e-3),'처음엔 가운데 안내판 앞');
 assert(await p.locator('.dg-hubcap:not(.off)').isVisible(),'안내판 아래 조작 안내');
 assert.match(await p.locator('.dg-hubcap').innerText(),/^← → 키, 마우스 휠로 둘러보세요$/,'안내는 조작 방법 한 줄');
 // 안내판 화살표 판은 ← → 버튼과 겹치지 않음 (모든 멈추는 자리에서)
 for(let si=0;si<await p.evaluate(()=>dg.stops.length);si++){await p.evaluate(si=>dgGoStop(si,true),si);await ready(p);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const ov=await p.evaluate(()=>{const R=e=>e.getBoundingClientRect();return dg.signHits.filter(e=>!e.classList.contains('off')).some(a=>['#dg-prev','#dg-next'].map(s=>$(s)).filter(b=>!b.disabled).some(b=>{const x=R(a),y=R(b);return x.left<y.right&&y.left<x.right&&x.top<y.bottom&&y.top<x.bottom;}));});
   assert(!ov,`안내판 판과 버튼이 겹침 (멈추는 자리 ${si})`);}
 await p.evaluate(()=>dgGoStop(dg.hubSi,true));await ready(p);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 assert.match(await p.locator('#dg-now').textContent(),/안내판/);
 assert.equal(await p.locator('.dg-sign-hit:not(.off)').count(),2,'안내판 화살표 두 개');
 assert(await drift(p)<1.5,'멈춰 있을 때 이름표가 받침대 가운데');
 // 안내판 화살표를 누르면 그 구역 첫 학생(가운데에서 가장 가까운 학생) 앞으로, 다시 가운데로
 await p.locator('.dg-sign-hit[data-zone="uxui"]').click();await ready(p);
 assert.deepEqual(await p.evaluate(()=>[dg.people[dg.at].s.field,dg.hubOn,dg.people[dg.at].x===-DG.hub]),['uxui',false,true]);
 await p.evaluate(()=>dgGoStop(dg.hubSi,true));await ready(p);
 // 깔끔한 배경: 3D 안내판·아치·빛줄기·먼지 없음, 가운데 벽에 방향 사인 두 줄
 assert(await p.evaluate(()=>!dg.gl.signArms&&!dg.gl.dust&&!('beams' in dg.gl)&&!DG.sign),'3D 안내판·빛줄기·먼지 없음');
 assert.deepEqual(await p.locator('.dg-way span').allTextContents(),['UX/UI · WEB','VISUAL DESIGN']);
 // 이름표 = 이름 + '~디자이너'(슬로건), 아래 소개 글·포트폴리오 버튼 없음. 이름표 = 포트폴리오 링크(새 탭), 없으면 링크 아님
 assert.equal(await p.locator('.dg-cap[data-i="6"] .dg-name').textContent(),'박수빈');
 assert.equal(await p.locator('.dg-cap').count(),await p.locator('.dg-cap .dg-slogan').count(),'모든 이름표에 슬로건');
 assert.match(await p.locator('.dg-cap[data-i="0"] .dg-slogan').textContent(),/디자이너$/);
 assert.equal(await p.locator('.dg-info, .dg-go').count(),0,'아래 소개·포트폴리오 버튼 없음');
 const pf=p.locator('.dg-cap[data-i="6"] a.dg-plaque');assert.equal(await pf.getAttribute('href'),'https://vin-portfolio-swart.vercel.app/');assert.equal(await pf.getAttribute('target'),'_blank');
 assert.equal(await p.locator('.dg-cap a.dg-plaque').count(),await p.evaluate(()=>dg.people.filter(q=>q.s.portfolio).length),'포트폴리오가 있는 학생만 링크 (2026-11-16: 14명 모두 있음)');
 assert.equal(await p.locator('.dg-fork, .dg-plate, .dg-amb, .dg-work, #designer img').count(),0,'예전 장식·대표작 이미지 없음');
 console.log('desktop layout ok');

 // 2) 안내판 VISUAL DESIGN 판 → Visual 첫 학생(민하도)으로 부드럽게 이동. 이동 중에도 이름표가 석고상을 따라감
 await p.locator('.dg-sign-hit[data-zone="visual"]').click();
 await p.waitForTimeout(250);
 assert(await p.evaluate(()=>Math.abs(dg.x-dg.tx)>0.05),'순간이동이 아니라 미끄러지듯 이동');
 const dMove=await drift(p);assert(dMove<1.5,`이동 중 이름표 어긋남 ${dMove.toFixed(2)}px`);
 await ready(p);
 assert.equal(await p.evaluate(()=>dg.people[dg.at].s.name),'민하도');
 assert(Math.abs(await centerOf(p,1))<3,'민하도가 가운데');
 await p.evaluate(()=>dgGoStop(dg.hubSi,true));await ready(p);
 await p.locator('.dg-sign-hit[data-zone="uxui"]').click();await ready(p);assert.equal(await p.evaluate(()=>dg.people[dg.at].s.field),'uxui');
 console.log('zone tabs ok');

 // 3) 좌우 버튼, ← → 키, 휠(멈추면 가장 가까운 자리에 정렬), 마우스로 끌기. UX/UI 첫 학생 ↔ 안내판 ↔ Visual 첫 학생
 const stop=()=>p.evaluate(()=>({si:dg.si,hub:dg.hubOn,name:dg.hubOn?'':dg.people[dg.at].s.name}));
 assert.equal((await stop()).name,'김예일','UX/UI 메뉴 → 가운데에서 가장 가까운 UX/UI 학생');
 await p.locator('#dg-next').click();await ready(p);assert((await stop()).hub,'김예일 → 오른쪽 = 안내판');
 await p.locator('#designer').focus();await p.keyboard.press('ArrowRight');await ready(p);assert.equal((await stop()).name,'민하도','안내판 → 오른쪽 = Visual 첫 학생');
 await p.keyboard.press('ArrowLeft');await ready(p);assert((await stop()).hub,'← = 다시 안내판');
 await p.mouse.move(720,400);await p.mouse.wheel(0,700);await p.waitForTimeout(400);await ready(p);
 const w=await p.evaluate(()=>({si:dg.si,hubSi:dg.hubSi,snap:Math.abs(dg.x-dg.stops[dg.si].x)}));assert(w.si>w.hubSi&&w.snap<1e-3,'휠로 이동 후 학생에게 정렬 '+JSON.stringify(w));
 // 끌고 잠깐 멈춘 뒤 놓기 (던지지 않음) → 한 칸
 const si0=w.si;await p.mouse.move(900,350);await p.mouse.down();await p.mouse.move(600,350,{steps:8});await p.waitForTimeout(150);await p.mouse.up();await ready(p);
 assert.equal(await p.evaluate(()=>dg.si),si0+1,'왼쪽으로 끌면 다음 학생');
 assert(Math.abs(await centerOf(p,await p.evaluate(()=>dg.people[dg.at].i)))<3,'끌기 후 가운데 정렬');
 console.log('nav ok');

 // 4) 석고상 누르기 → 그 학생 포트폴리오가 새 탭으로 (학생 상세 화면은 열리지 않음). 이름표(키보드 Enter)도 같음
 await p.context().route(/^https:\/\/(?!cdn\.)[^/]+\.(app|io|site)\//,r=>r.fulfill({contentType:'text/html',body:'portfolio'})); // 바깥 사이트는 실제로 열지 않음
 const kp=await p.evaluate(()=>dg.people.findIndex(q=>q.s.portfolio));
 await p.evaluate(k=>dgGoTo(k,true),kp);await ready(p);
 const pt=await p.evaluate(k=>{const G=dg.gl,v=new G.THREE.Vector3(dg.people[k].x,DG.ped.h+DG.bustH*0.55,DG.pedZ).project(G.cam);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight];},kp);
 const url=await p.evaluate(k=>dg.people[k].s.portfolio,kp);
 let [pop]=await Promise.all([p.context().waitForEvent('page'),p.mouse.click(pt[0],pt[1])]);await pop.waitForLoadState();
 assert.equal(pop.url().replace(/\/$/,''),url.replace(/\/$/,''),'석고상 누르기 = 포트폴리오 새 탭');await pop.close();
 assert.equal(await p.locator('#detail.on').count(),0,'학생 상세는 열리지 않음');
 await p.locator(`.dg-cap[data-k="${kp}"] .dg-plaque`).focus();
 [pop]=await Promise.all([p.context().waitForEvent('page'),p.keyboard.press('Enter')]);await pop.waitForLoadState();
 assert.equal(pop.url().replace(/\/$/,''),url.replace(/\/$/,''),'이름표 Enter = 포트폴리오 새 탭');await pop.close();
 // 포트폴리오가 없는 학생의 석고상은 눌러도 새 탭 없음
 const ke=await p.evaluate(()=>dg.people.findIndex(q=>!q.s.portfolio));
 if(ke>=0){await p.evaluate(k=>dgGoTo(k,true),ke);await ready(p);
  const pe=await p.evaluate(k=>{const G=dg.gl,v=new G.THREE.Vector3(dg.people[k].x,DG.ped.h+DG.bustH*0.55,DG.pedZ).project(G.cam);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight];},ke);
  const pages0=p.context().pages().length;await p.mouse.click(pe[0],pe[1]);await p.waitForTimeout(300);assert.equal(p.context().pages().length,pages0,'포트폴리오 없음: 새 탭 없음');}
 // Tab으로 다른 학생 이름표에 가면 카메라가 그 학생으로 이동
 await p.evaluate(()=>document.querySelector('.dg-cap[data-k="9"] .dg-plaque').focus());await ready(p);assert.equal(await p.evaluate(()=>dg.at),9);
 console.log('detail ok');

 // 5) 전체: 뒤로 물러나 14명이 모두 보이고 이름만 작게. 다시 → 누르면 학생 앞으로
 await p.evaluate(()=>dgZone('all'));await ready(p); // 화면에는 버튼이 없음 (위 메뉴 삭제). 기능만 검사
 assert.equal(await p.locator('#designer.is-far').count(),1);
 const inView=await p.evaluate(()=>dg.caps.filter(el=>{const r=el.querySelector('.dg-plaque').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}).length);
 assert.equal(inView,14,'전체 보기에서 14명 모두 화면 안');
 await p.screenshot({path:process.env.SHOT_DIR?process.env.SHOT_DIR+'/designer-all.png':'/dev/null'}).catch(()=>{});
 await p.locator('#dg-next').click();await ready(p);assert.equal(await p.locator('#designer.is-far').count(),0);
 console.log('overview ok');

 // 6) 다른 화면으로 가면 3D를 멈추고 정리, 돌아오면 같은 학생 앞에서 다시 만듦
 const before=await p.evaluate(()=>dg.at);
 await p.locator('.pill [data-go="about"]').click();
 assert(await p.evaluate(()=>dg.gl===null&&!document.querySelector('#dg-stage canvas')&&dg.raf===0),'떠나면 정리');
 await p.locator('.pill [data-go="designer"]').click();await ready(p);
 assert.equal(await p.evaluate(()=>dg.at),before);assert.equal(await p.locator('#dg-stage canvas').count(),1);
 console.log('dispose ok');
 await p.context().close();

 // 7) 3D가 안 될 때(?dg=list): 같은 데이터로 만든 목록 14명
 p=await open({},base+'?dg=list#designer');await p.locator('#dg-list').waitFor();
 assert.equal(await p.locator('.dg-list li').count(),14);assert.equal(await p.locator('#dg-stage canvas').count(),0);
 await p.locator('.dg-list-name').first().click();await p.locator('#detail.on').waitFor();
 console.log('fallback list ok');
 await p.context().close();

 // 8) 움직임 줄이기: 메뉴를 누르면 바로 도착
 p=await open({reducedMotion:'reduce'});await ready(p);
 await p.locator('.dg-sign-hit[data-zone="visual"]').click();await p.waitForTimeout(80);
 assert(await p.evaluate(()=>Math.abs(dg.x-dg.tx)<1e-3&&dg.people[dg.at].s.field==='visual'),'움직임 줄이기: 바로 이동');
 console.log('reduced motion ok');
 await p.context().close();

 // 9) 모바일: 안내판에서 시작, 한 명씩 크게. 옆 사람 소개는 숨김, 손가락으로 밀면 다음 자리, 전체 = 목록 → 이름 누르면 그 학생 앞으로
 p=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await ready(p);
 assert.equal(await p.locator('#designer.is-portrait').count(),1);
 assert(await p.evaluate(()=>dg.hubOn),'모바일도 안내판에서 시작');
 const visible=()=>p.evaluate(()=>dg.caps.filter(el=>{const r=el.querySelector('.dg-plaque').getBoundingClientRect();return r.right>0&&r.left<innerWidth;}).length);
 const big=await p.evaluate(()=>{const G=dg.gl,a=new G.THREE.Vector3(0,DG.ped.h,DG.pedZ).project(G.cam),b=new G.THREE.Vector3(0,DG.ped.h+DG.bustH,DG.pedZ).project(G.cam);return (a.y-b.y)/-2*innerHeight;});
 assert(big>250,`모바일 석고상 높이 ${big.toFixed(0)}px`);
 const swipe=async(x0,x1)=>p.evaluate(([x0,x1])=>{const el=document.querySelector('#dg-stage'),ev=(t,x)=>el.dispatchEvent(new PointerEvent(t,{pointerId:7,pointerType:'touch',clientX:x,clientY:400,bubbles:true,isPrimary:true}));
   ev('pointerdown',x0);for(let k=1;k<=6;k++)ev('pointermove',x0+(x1-x0)*k/6);ev('pointerup',x1);},[x0,x1]);
 await swipe(300,120);await ready(p);assert.equal(await p.evaluate(()=>dg.hubOn?'':dg.people[dg.at].s.name),'민하도','왼쪽으로 밀면 오른쪽 구역 첫 학생');
 assert.equal(await visible(),1,'모바일에서는 한 명만');
 await swipe(100,300);await ready(p);assert(await p.evaluate(()=>dg.hubOn),'오른쪽으로 밀면 다시 안내판');
 await p.evaluate(()=>dgZone('all'));await p.locator('#dg-list').waitFor();assert.equal(await p.locator('.dg-list li').count(),14);
 await p.locator('.dg-list-name[data-i="6"]').tap();await ready(p);
 assert.equal(await p.locator('#dg-list').isHidden(),true);assert.equal(await p.evaluate(()=>dg.people[dg.at].i),6);
 console.log('mobile ok');
 await p.context().close();

 assert.deepEqual(errors,[]);
 console.log('PASS: designer bright museum — starts at the centre signpost (UX/UI left, Visual right), sign arrows, 14 students in two zones, zone tabs glide, buttons/keys/wheel/drag snap, labels stay on busts while moving, bust → detail → focus back, overview, dispose on leave, fallback list, reduced motion, mobile swipe + list; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
