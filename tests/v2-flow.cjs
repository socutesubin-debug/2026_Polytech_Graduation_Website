// 새 기획(2026-11-14) 흐름 검사: 로딩 화면(로고 + 동그란 로딩바) → Intro(오프닝) → Project 방 / Designer 방
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

 // 0) 맨 처음: 로고 + 동그란 로딩바가 0 → 100% 차오른 뒤 사라지고 오프닝 시작
 let p=await open();
 assert.equal(await state(p),'opening');assert.equal(await p.locator('#topbar.on').count(),0);
 await p.locator('#op-load:not(.done)').waitFor({state:'visible'});assert.equal(await p.locator('#op-load .op-ring .op-load-logo').count(),1,'로고는 동그라미 로딩바 안에');assert.equal(await p.locator('#op-load .op-load-logo').getAttribute('alt'),'Beyond the Frame');
 assert(await p.locator('#op-load-bar').count()===1&&await p.evaluate(()=>op.shot===0),'로딩 중에는 오프닝이 아직 시작 안 함');
 await p.waitForFunction(()=>+document.querySelector('#op-load-num').textContent>=40&&+document.querySelector('#op-load-num').textContent<100,null,{timeout:6000});
 await p.locator('#op-load.done').waitFor({state:'attached',timeout:12000});assert.equal(await p.locator('#op-load-num').textContent(),'100');
 await p.waitForFunction(()=>op.shot===1,null,{timeout:2000});
 // 1) Intro: s1 → s2 → s3 다음 [Project] [Designer] 버튼. 메뉴는 숨어 있고 건너뛰기는 항상 보임
 await p.locator('#op-skip').waitFor({state:'visible'});
 await p.waitForFunction(()=>document.querySelector('#opening').dataset.shot==='3',null,{timeout:12000});
 await p.locator('#op-copy.on').waitFor({timeout:6000});
 assert.deepEqual(await p.locator('.op-enter').allTextContents(),['Project','Designer']);
 assert(await p.locator('#op-enter').evaluate(el=>document.activeElement===el),'Project 버튼에 초점');
 await p.locator('#op-enter-2').click();
 await p.waitForFunction(()=>page==='designer',null,{timeout:5000});
 assert.equal(new URL(p.url()).hash,'#designer');assert.equal(await p.locator('#topbar.on').count(),1);
 assert.deepEqual(await p.locator('.pill button').allTextContents(),['Intro','About','Project','Designer']);
 // 메뉴 Intro → 오프닝 다시 (로딩 화면 없이 바로), 건너뛰기(Esc) → Project 방
 await p.locator('.pill [data-go="opening"]').click();assert.equal(await state(p),'opening');assert.equal(await p.locator('#op-load.done').count(),1,'두 번째부터는 로딩 화면 없음');
 await p.keyboard.press('Escape');assert.equal(await state(p),'project');assert.equal(new URL(p.url()).hash,'#project');
 console.log('intro ok');

 // 1-2) About: 왼쪽 포스터, 오른쪽 전시 소개 글과 개요. 정해지지 않은 칸은 "확정 전"
 await p.locator('.pill [data-go="about"]').click();assert.equal(await state(p),'about');assert.equal(new URL(p.url()).hash,'#about');
 assert.match(await p.locator('#ab-poster').getAttribute('src'),/poster\.webp$/);assert.equal(await p.locator('#ab-title').textContent(),'프레임을 넘어, 우리를 만나다');
 assert(await p.locator('#ab-text p').count()>=2);assert(await p.locator('#ab-info .tbd').count()>=1);
 const [pl,cl]=await p.evaluate(()=>[document.querySelector('.ab-poster').getBoundingClientRect().left,document.querySelector('.ab-copy').getBoundingClientRect().left]);assert(pl<cl,'포스터가 왼쪽');
 await p.locator('.ab-go [data-to="project"]').click();assert.equal(await state(p),'project');
 console.log('about ok');

 // 2) Project 방: 글자 없이 작품 썸네일 15장만 랜덤 순서로 떠다님, 스크롤하면 도넛 → 작품 목록
 assert.equal(await p.locator('.pj-card').count(),15);
 assert.equal((await p.locator('#pj-hero').innerText()).trim(),'','첫 화면에 보이는 글자 없음');
 assert.equal(await p.locator('#pj-word, #pj-focus, #pj-down').count(),0);
 assert.deepEqual(await p.evaluate(()=>pj.cards.map(c=>c.s).sort((x,y)=>x-y)),[...Array(15).keys()],'15명 모두 한 장씩');
 const t0=await p.locator('.pj-strip').first().evaluate(el=>el.style.transform);await p.waitForTimeout(300);
 assert.notEqual(await p.locator('.pj-strip').first().evaluate(el=>el.style.transform),t0,'카드가 떠다님');
 // 스크롤하면 공 → 도넛: 카드들이 위아래로 덜 퍼짐
 const spread=()=>p.evaluate(()=>{const ys=[...document.querySelectorAll('.pj-strip:first-child')].map(el=>{const r=el.getBoundingClientRect();return r.top+r.height/2;});return Math.max(...ys)-Math.min(...ys);});
 // 들어오면 카드가 가운데에서 퍼져 나옴 → 다 퍼진 뒤: 카드는 공을 따라 기울지 않고 화면을 똑바로 봄 (가로:세로가 그대로 4:3), 앞 카드가 뒤 카드보다 큼
 assert(await p.evaluate(()=>pj.rev<1),'들어오면 카드가 퍼져 나오는 중');await p.waitForFunction(()=>pj.rev>=1,null,{timeout:8000});
 const boxes=await p.evaluate(()=>pj.cards.map(c=>{const rs=c.strips.map(el=>el.getBoundingClientRect());const w=Math.max(...rs.map(r=>r.right))-Math.min(...rs.map(r=>r.left)),h=Math.max(...rs.map(r=>r.bottom))-Math.min(...rs.map(r=>r.top));return {w,h};}));
 for(const b of boxes) assert(Math.abs(b.w/b.h-4/3)<0.2,'공일 때 카드는 화면을 똑바로 봄: '+(b.w/b.h).toFixed(2));
 const ws=boxes.map(b=>b.w);assert(Math.max(...ws)>Math.min(...ws)*1.6,'앞 카드는 크고 뒤 카드는 작음');
 // 끌면 공이 손을 따라 부드럽게 돌고, 손을 떼면 미끄러지듯 더 돎. 끌고 난 뒤에는 작품이 열리지 않음
 await p.mouse.move(600,450);await p.mouse.down();await p.mouse.move(820,430,{steps:6});
 assert(await p.evaluate(()=>pj.dy>15&&pj.hero.classList.contains('drag')),'끌면 돎');assert(await p.evaluate(()=>pj.dys<pj.dy),'부드럽게 늦게 따라옴');
 const d0=await p.evaluate(()=>pj.dy);await p.mouse.up();await p.waitForTimeout(300);
 assert(await p.evaluate(d0=>pj.dy>d0+1&&!pj.hero.classList.contains('drag'),d0),'손을 떼면 미끄러지듯 더 돎');
 assert.equal(await p.locator('#pj-detail').isHidden(),true,'끌고 난 뒤에는 작품이 열리지 않음');
 await p.mouse.move(5,450);await p.waitForFunction(()=>Math.abs(pj.dvy)<1,null,{timeout:8000});
 const sphere=await spread();
 await p.waitForTimeout(1000);await p.evaluate(()=>pjGotoCard(0));
 await p.waitForFunction(()=>Math.abs(pj.root.scrollTop/pj.root.clientHeight-pjCardAt(0))<0.01,null,{timeout:6000});
 await p.waitForFunction(()=>pj.us===pj.u,null,{timeout:6000});await p.waitForTimeout(300);assert(await spread()<sphere*0.75,'도넛은 공보다 납작함');
 // 도넛은 스크롤을 안 해도 저절로 계속 돌고, 카드는 휘어진 종이처럼 띠 여러 개로 되어 있고 살짝 물결침
 const a0=await p.evaluate(()=>pj.auto);await p.waitForTimeout(500);assert(await p.evaluate(a0=>pj.auto>a0+1,a0),'도넛이 계속 돎');
 assert.equal(await p.locator('.pj-card').first().locator('.pj-strip').count(),await p.evaluate(()=>pj.K));const c0=await p.evaluate(()=>pj.cards[0].strips[0].style.transform);await p.waitForTimeout(200);assert.notEqual(await p.evaluate(()=>pj.cards[0].strips[0].style.transform),c0,'종이가 살짝 물결침');
 // ← → 키 = 한 장만큼 스크롤
 await p.locator('#project').focus();const u0=await p.evaluate(()=>pj.root.scrollTop/pj.root.clientHeight);await p.keyboard.press('ArrowRight');
 await p.waitForFunction(u0=>Math.abs(pj.root.scrollTop/pj.root.clientHeight-(u0+PROJECT.perCard))<0.02,u0,{timeout:6000});
 // 빨리 스크롤해도 카드가 흩어지지 않음 (흩날림은 뺐음)
 assert.equal(await p.evaluate(()=>'sv' in pj),false);


 // 카드를 누르면 그 작품 상세, Enter 키 = 맨 앞 카드
 const j=await p.evaluate(()=>pj.frontIdx);const who3=await p.evaluate(j=>STUDENTS[pj.cards[j].s].name,j);
 await p.evaluate(j=>pj.cards[j].el.click(),j);await p.locator('#pj-detail.on').waitFor();assert.equal(await p.locator('#pj-d-who').textContent(),who3);
 await p.keyboard.press('Escape');await p.waitForTimeout(400);assert.equal(await p.locator('#pj-detail').isHidden(),true);
 await p.locator('#project').focus();await p.keyboard.press('Enter');await p.locator('#pj-detail.on').waitFor();
 assert(await p.evaluate(()=>pj.at===pj.cards[pj.frontIdx].s),'Enter = 맨 앞 카드');
 await p.keyboard.press('Escape');await p.waitForTimeout(400);
 // 끝까지 내려도 작품 목록은 없음
 assert.equal(await p.locator('#pj-list, #pj-grid, .pj-item').count(),0,'작품 목록 없음');
 await p.evaluate(()=>{pj.root.scrollTop=1e7;});await p.waitForTimeout(100);
 assert(await p.evaluate(()=>Math.abs(pj.root.scrollTop/pj.root.clientHeight-pjEndAt())<0.02),'스크롤 끝');
 // 작품 상세: 그림 14칸, ← → 이전/다음, Esc 닫기
 await p.evaluate(()=>pjOpen(6));await p.locator('#pj-detail.on').waitFor();
 assert.equal(await p.locator('.pj-shot').count(),14);
 assert.equal(await p.locator('#pj-d-who').textContent(),'박수빈');
 await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#pj-d-who').textContent(),'박호성');
 await p.keyboard.press('ArrowLeft');await p.keyboard.press('Escape');await p.waitForTimeout(400);
 assert.equal(await p.locator('#pj-detail').isHidden(),true);
 assert(await p.evaluate(()=>document.activeElement===pj.root),'닫으면 Project 방에 초점');
 // 만든 사람 → Designer 방의 그 석고상이 가운데 + 표찰에 초점
 await p.evaluate(()=>pjOpen(6));await p.locator('#pj-detail.on').waitFor();await p.locator('#pj-d-who').click();
 await p.waitForFunction(()=>page==='designer',null,{timeout:3000});await p.waitForTimeout(300);
 const centered=await p.evaluate(()=>{const li=document.querySelector('.dg-item[data-i="6"]').getBoundingClientRect();return Math.abs(li.left+li.width/2-innerWidth/2);});
 assert(centered<4,`박수빈 석고상이 가운데 (${centered}px)`);
 assert(await p.evaluate(()=>document.activeElement.closest('.dg-item')?.dataset.i==='6'),'박수빈 표찰에 초점');
 console.log('project ok');

 // 3) Designer 방: 석고상 15개 가로 한 줄, 표찰 = 포트폴리오 새 탭, 주소 없으면 준비 중
 assert.equal(await p.locator('.dg-item').count(),14);
 const plate=p.locator('.dg-item[data-i="6"] .dg-plate');
 assert.equal(await plate.getAttribute('href'),'https://vinportfolio-desk-flow.vercel.app');assert.equal(await plate.getAttribute('target'),'_blank');
 assert.equal(await p.locator('.dg-item[data-i="0"] a.dg-plate').count(),0);assert.match(await p.locator('.dg-item[data-i="0"] .dg-go').textContent(),/준비 중/);
 assert.equal(await p.locator('.dg-item[data-i="6"] .dg-name').textContent(),'박수빈');
 // 휠(위아래)을 굴리면 옆으로, ← → 키, 버튼
 await p.evaluate(()=>{dg.row.scrollLeft=0;});await p.mouse.move(720,450);
 await p.mouse.wheel(0,600);await p.waitForTimeout(300);const x1=await p.evaluate(()=>dg.row.scrollLeft);assert(x1>300,`휠로 옆으로 움직임 (${x1})`);
 await p.locator('#designer').focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(900);
 assert(await p.evaluate(()=>dg.row.scrollLeft)>x1,'→ 키로 다음 석고상');
 // 어두운 전시실: 가운데 화살표 팻말, 왼쪽 UX/UI(8명), 오른쪽 Visual(6명). 두 벽의 색 빛이 팻말 뒤에서 흐릿하게 섞임
 const order=await p.evaluate(()=>[...dg.row.children].map(li=>li.id==='dg-fork'?'fork':li.dataset.field||'sign'));
 assert.equal(order.indexOf('fork'),9,'갈림길 왼쪽에 UX/UI 표지 + 8명');assert(order.slice(1,9).every(f=>f==='uxui'));assert(order.slice(10,16).every(f=>f==='visual'));assert.equal(order.length,16,'분야 확인 중 표지는 없음');
 assert.equal(await p.locator('.dg-item').count(),14,'조민영은 Designer에서 빠짐');assert.equal(await p.locator('.dg-item[data-i="9"]').count(),0);
 assert.equal(await p.locator('#dg-fork .dg-post .dg-board').count(),2,'팻말에 화살표 판 두 개');assert.equal(await p.locator('#dg-amb-ux .dg-wall, #dg-amb-vi .dg-wall, .dg-seam').count(),3);
 const fx=()=>p.evaluate(()=>parseFloat(dg.root.style.getPropertyValue('--fx'))/innerWidth);
 assert.equal(await p.locator('.dg-head, #dg-count, #dg-filter, #designer h2').count(),0,'위쪽 제목·인원·버튼 글자 없음');
 await p.evaluate(()=>dgGo('fork'));await p.waitForFunction(()=>Math.abs(dg.fx-innerWidth/2)<4,null,{timeout:4000});
 assert(Math.abs(await fx()-0.5)<0.01,'팻말 앞에서는 흐린 경계가 화면 가운데');
 assert.match(await p.evaluate(()=>getComputedStyle($('#dg-amb-ux')).maskImage||getComputedStyle($('#dg-amb-ux')).webkitMaskImage),/linear-gradient/);
 const post=await p.evaluate(()=>{const a=$('#dg-fork .dg-post').getBoundingClientRect(),b=$('.dg-item .dg-stand').getBoundingClientRect();return Math.abs(a.bottom-b.bottom);});assert(post<3,'팻말 기둥이 받침대와 같은 바닥에 섬: '+post);
 await p.locator('#dg-fork [data-side="visual"]').click();await p.waitForFunction(()=>dg.side==='visual',null,{timeout:4000});await p.waitForTimeout(700);
 assert(await fx()<0.3,'Visual 쪽으로 가면 경계(팻말)는 왼쪽으로');assert.notEqual(await p.evaluate(()=>dg.root.style.getPropertyValue('--wx')),'0.0px','벽 빛이 같이 흘러감');
 await p.evaluate(()=>dgGo('uxui'));
 await p.waitForFunction(()=>dg.side==='uxui',null,{timeout:4000});await p.waitForTimeout(700);assert(await fx()>0.7,'UX/UI 쪽으로 가면 경계(팻말)는 오른쪽으로');
 // 설명판에는 포트폴리오 보기만 있고 (대표 작품 보기 버튼·번호·연도 줄은 없음), Project 방의 작품 상세는 따로 열어 봄
 assert.equal(await p.locator('.dg-work, .dg-no').count(),0,'대표 작품 보기 버튼·번호 줄 없음');
 assert.match(await p.locator('.dg-item[data-i="1"] .dg-go').textContent(),/포트폴리오 보기/);
 await p.evaluate(()=>{go('project');pjOpen(1,null);});await p.locator('#pj-detail.on').waitFor();
 assert.equal(await state(p),'project');assert.equal(await p.locator('#pj-d-who').textContent(),'민하도');
 // 상세: 검은 화면, 위 메뉴는 숨김, 오른쪽 위 X로 닫으면 메뉴가 다시 보임
 assert.equal(await p.locator('.topbar').isVisible(),false,'상세에서는 위 메뉴 숨김');assert.equal(await p.locator('#pj-d-mail').isHidden(),true,'메일이 없으면 안 보임');
 await p.locator('#pj-d-close').click();await p.waitForTimeout(400);assert.equal(await p.locator('#pj-detail').isHidden(),true);
 await p.locator('.pill [data-go="designer"]').click();await p.waitForFunction(()=>page==='designer',null,{timeout:3000});
 console.log('designer ok');
 await p.context().close();

 // 4) 움직임 줄이기: Intro는 버튼이 바로 보이고, 카드는 떠다니지 않음
 p=await open({reducedMotion:'reduce'});
 assert.equal(await p.locator('#opening').getAttribute('data-shot'),'3');await p.locator('#op-copy.on').waitFor({timeout:4000});
 await p.locator('#op-enter').click();await p.waitForFunction(()=>page==='project',null,{timeout:3000});
 assert.equal(await p.locator('#project.still').count(),1);
 const s0=await p.locator('.pj-strip').first().evaluate(el=>el.style.transform);await p.waitForTimeout(300);
 assert.equal(await p.locator('.pj-strip').first().evaluate(el=>el.style.transform),s0,'움직임 줄이기: 카드가 멈춰 있음');
 console.log('reduced motion ok');
 await p.context().close();

 // 5) 모바일: 메뉴 3개, Designer는 손가락으로 옆으로 넘김(한 명씩 딱 멈춤)
 p=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.locator('#op-load.done').waitFor({state:'attached',timeout:12000});await p.locator('#op-skip').tap();assert.equal(await state(p),'project');
 await p.locator('.pill [data-go="designer"]').tap();assert.equal(await state(p),'designer');
 assert.equal(await p.locator('.dg-row').evaluate(el=>getComputedStyle(el).scrollSnapType),'x mandatory');
 const w=await p.locator('.dg-item').first().evaluate(el=>el.getBoundingClientRect().width);assert(w>280&&w<320,`모바일 석고상 칸 너비 (${w})`);
 console.log('mobile ok');
 await p.context().close();

 assert.deepEqual(errors,[]);
 console.log('PASS: intro buttons + skip + menu, about (poster + text), project reveal + flat cards by depth + drag/glide → donut keeps spinning, curved paper cards (strips) (keys) → no list → detail (14 images) → designer, designer dark media-wall room (arrow signpost, UX/UI wall left / Visual wall right, blurred seam; wheel/keys/jump/portfolio plaque), reduced motion, mobile; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
