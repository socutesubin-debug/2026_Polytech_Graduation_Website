// Designer(밝은 미술관) 검사: 학생 14명·구역 순서, 분야 메뉴 이동, 좌우 버튼·키·휠·끌기, 이름표가 석고상에 붙어 있는지(움직이는 중에도),
// 석고상 누르기 = 학생 상세 → 닫으면 이름표로 초점 복귀, 포트폴리오 새 탭, 전체 보기, 화면을 떠나면 3D 정리, 3D가 안 되면 목록, 움직임 줄이기, 모바일
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

 // 1) 데스크톱: 처음엔 UX/UI 첫 학생 앞. 14명, UX/UI 8명 → Visual 6명, 조민영 없음
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
 assert.deepEqual(await p.locator('#dg-tabs button').allTextContents(),['전체','UX/UI · WEB','VISUAL DESIGN']);
 assert.equal(await p.locator('#dg-tabs [aria-pressed="true"]').textContent(),'UX/UI · WEB');
 assert(Math.abs(await centerOf(p,0))<3,'첫 학생이 가운데');
 assert(await drift(p)<1.5,'멈춰 있을 때 이름표가 받침대 가운데');
 // 이름표에는 이름·분야, 아래에는 짧은 소개 + 포트폴리오(새 탭) 또는 준비 중
 assert.equal(await p.locator('.dg-cap[data-i="6"] .dg-name').textContent(),'박수빈');
 const pf=p.locator('.dg-cap[data-i="6"] a.dg-go');assert.equal(await pf.getAttribute('href'),'https://vinportfolio-desk-flow.vercel.app');assert.equal(await pf.getAttribute('target'),'_blank');
 assert.equal(await p.locator('.dg-cap[data-i="0"] a.dg-go').count(),0);assert.match(await p.locator('.dg-cap[data-i="0"] .dg-go').textContent(),/준비 중/);
 assert.equal(await p.locator('.dg-fork, .dg-plate, .dg-amb, .dg-work, #designer img').count(),0,'팻말·금속 표찰·대표작 이미지 없음');
 console.log('desktop layout ok');

 // 2) VISUAL DESIGN 메뉴 → Visual 첫 학생(민하도)으로 부드럽게 이동. 이동 중에도 이름표가 석고상을 따라감
 await p.locator('#dg-tabs [data-zone="visual"]').click();
 await p.waitForTimeout(250);
 assert(await p.evaluate(()=>Math.abs(dg.x-dg.tx)>0.05),'순간이동이 아니라 미끄러지듯 이동');
 const dMove=await drift(p);assert(dMove<1.5,`이동 중 이름표 어긋남 ${dMove.toFixed(2)}px`);
 await ready(p);
 assert.equal(await p.evaluate(()=>dg.people[dg.at].s.name),'민하도');assert.equal(await p.locator('#dg-tabs [aria-pressed="true"]').textContent(),'VISUAL DESIGN');
 assert(Math.abs(await centerOf(p,1))<3,'민하도가 가운데');
 await p.locator('#dg-tabs [data-zone="uxui"]').click();await ready(p);assert.equal(await p.evaluate(()=>dg.people[dg.at].s.field),'uxui');
 console.log('zone tabs ok');

 // 3) 좌우 버튼, ← → 키, 휠(멈추면 가장 가까운 학생에게 정렬), 마우스로 끌기
 await p.locator('#dg-next').click();await ready(p);assert.equal(await p.evaluate(()=>dg.at),1);
 await p.locator('#designer').focus();await p.keyboard.press('ArrowRight');await ready(p);assert.equal(await p.evaluate(()=>dg.at),2);
 await p.keyboard.press('ArrowLeft');await ready(p);assert.equal(await p.evaluate(()=>dg.at),1);
 await p.mouse.move(720,400);await p.mouse.wheel(0,700);await p.waitForTimeout(400);await ready(p);
 const w=await p.evaluate(()=>({at:dg.at,snap:Math.abs(dg.x-dg.people[dg.at].x)}));assert(w.at>1&&w.snap<1e-3,'휠로 이동 후 학생에게 정렬 '+JSON.stringify(w));
 const at0=w.at;await p.mouse.move(900,350);await p.mouse.down();await p.mouse.move(600,350,{steps:8});await p.mouse.up();await ready(p);
 assert.equal(await p.evaluate(()=>dg.at),at0+1,'왼쪽으로 끌면 다음 학생');
 assert(Math.abs(await centerOf(p,await p.evaluate(()=>dg.people[dg.at].i)))<3,'끌기 후 가운데 정렬');
 console.log('nav ok');

 // 4) 석고상 누르기 → 학생 상세(기존 화면). 닫으면 그 학생 이름표로 초점이 돌아옴. ← →는 Designer 순서
 await p.evaluate(()=>dgGoTo(6,true));await ready(p);
 const pt=await p.evaluate(()=>{const G=dg.gl,v=new G.THREE.Vector3(dg.people[6].x,DG.ped.h+DG.bustH*0.55,DG.pedZ).project(G.cam);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight];});
 await p.mouse.click(pt[0],pt[1]);await p.locator('#detail.on').waitFor();
 assert.equal(await p.locator('#d-name').textContent(),await p.evaluate(()=>dg.people[6].s.name));
 await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#d-name').textContent(),await p.evaluate(()=>dg.people[7].s.name),'상세의 다음 = Designer 줄의 다음 학생');
 await p.keyboard.press('Escape');await p.waitForTimeout(200);
 assert(await p.evaluate(()=>document.activeElement.closest('.dg-cap')?.dataset.k==='6'),'닫으면 이름표로 초점');
 // 이름표 버튼(키보드)으로도 상세가 열림
 await p.keyboard.press('Enter');await p.locator('#detail.on').waitFor();await p.keyboard.press('Escape');
 // Tab으로 다른 학생 이름표에 가면 카메라가 그 학생으로 이동
 await p.evaluate(()=>document.querySelector('.dg-cap[data-k="9"] .dg-plaque').focus());await ready(p);assert.equal(await p.evaluate(()=>dg.at),9);
 console.log('detail ok');

 // 5) 전체: 뒤로 물러나 14명이 모두 보이고 이름만 작게. 다시 → 누르면 학생 앞으로
 await p.locator('#dg-tabs [data-zone="all"]').click();await ready(p);
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
 await p.locator('#dg-tabs [data-zone="visual"]').click();await p.waitForTimeout(80);
 assert(await p.evaluate(()=>Math.abs(dg.x-dg.tx)<1e-3&&dg.people[dg.at].s.field==='visual'),'움직임 줄이기: 바로 이동');
 console.log('reduced motion ok');
 await p.context().close();

 // 9) 모바일: 한 명씩 크게. 옆 사람 소개는 숨김, 손가락으로 밀면 다음 학생, 전체 = 목록 → 이름 누르면 그 학생 앞으로
 p=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await ready(p);
 assert.equal(await p.locator('#designer.is-portrait').count(),1);
 const vis=await p.evaluate(()=>dg.caps.filter(el=>{const r=el.querySelector('.dg-plaque').getBoundingClientRect();return r.right>0&&r.left<innerWidth;}).length);assert.equal(vis,1,'모바일에서는 한 명만');
 const big=await p.evaluate(()=>{const G=dg.gl,a=new G.THREE.Vector3(0,DG.ped.h,DG.pedZ).project(G.cam),b=new G.THREE.Vector3(0,DG.ped.h+DG.bustH,DG.pedZ).project(G.cam);return (a.y-b.y)/-2*innerHeight;});
 assert(big>250,`모바일 석고상 높이 ${big.toFixed(0)}px`);
 const swipe=async(x0,x1)=>p.evaluate(([x0,x1])=>{const el=document.querySelector('#dg-stage'),ev=(t,x)=>el.dispatchEvent(new PointerEvent(t,{pointerId:7,pointerType:'touch',clientX:x,clientY:400,bubbles:true,isPrimary:true}));
   ev('pointerdown',x0);for(let k=1;k<=6;k++)ev('pointermove',x0+(x1-x0)*k/6);ev('pointerup',x1);},[x0,x1]);
 await swipe(300,120);await ready(p);assert.equal(await p.evaluate(()=>dg.at),1,'왼쪽으로 밀면 다음 학생');
 await swipe(100,300);await ready(p);assert.equal(await p.evaluate(()=>dg.at),0,'오른쪽으로 밀면 이전 학생');
 await p.locator('#dg-tabs [data-zone="all"]').tap();await p.locator('#dg-list').waitFor();assert.equal(await p.locator('.dg-list li').count(),14);
 await p.locator('.dg-list-name[data-i="6"]').tap();await ready(p);
 assert.equal(await p.locator('#dg-list').isHidden(),true);assert.equal(await p.evaluate(()=>dg.people[dg.at].i),6);
 console.log('mobile ok');
 await p.context().close();

 assert.deepEqual(errors,[]);
 console.log('PASS: designer bright museum — 14 students in two zones, zone tabs glide, buttons/keys/wheel/drag snap, labels stay on busts while moving, bust → detail → focus back, overview, dispose on leave, fallback list, reduced motion, mobile swipe + list; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
