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
 assert.equal(await p.locator('#op-skip').count(),0,'건너뛰기 버튼 없음');
 await p.locator('#op-stage .is-hint').waitFor({state:'visible'});assert.equal((await p.locator('#op-stage .is-hint').textContent()).trim(),'길잡이 나비를 따라 스크롤 해주세요');
 assert.equal(await p.evaluate(()=>document.body.classList.contains('bf-cursor')),false,'Intro에서는 원래 커서');
 // 스크롤 인트로: 끝까지 내리면 하얗게 밝아진 뒤 About으로 넘어감
 assert.equal(await p.locator('#op-stage .is-gl').count(),1);
 await p.locator('#opening').evaluate(el=>el.scrollTo(0,el.scrollHeight));
 await p.waitForFunction(()=>page==='about',null,{timeout:8000});
 assert.equal(new URL(p.url()).hash,'#about');assert.equal(await p.locator('#topbar.on').count(),1);
 assert.equal(await p.evaluate(()=>document.body.classList.contains('bf-cursor')),true,'Intro 다음부터 나비 커서');
 // 나비 커서(js/cursor.js): Intro와 같은 나비를 그리는 캔버스가 켜지고 원래 커서는 숨김. 마우스를 움직이면 나비가 보임
 assert.equal(await p.evaluate(()=>document.body.classList.contains('bf-gl')&&getComputedStyle(document.body).cursor),'none');
 await p.mouse.move(400,400);await p.mouse.move(520,430,{steps:5});await p.waitForFunction(()=>+document.querySelector('.bf-cursor-gl').style.opacity>0.9,null,{timeout:4000});
 assert.equal(await p.locator('.bf-cursor-gl').evaluate(el=>getComputedStyle(el).pointerEvents),'none','나비 캔버스는 누르기를 막지 않음');
 assert.deepEqual(await p.locator('.pill button').allTextContents(),['Intro','About','Project','Designer']);
 // 메뉴 Intro → 오프닝 다시, 건너뛰기(Esc) → Project 방
 await p.locator('.pill [data-go="opening"]').click();assert.equal(await state(p),'opening');
 await p.keyboard.press('Escape');assert.equal(await state(p),'about');assert.equal(new URL(p.url()).hash,'#about');
 console.log('intro ok');

 // 1-2) About: 왼쪽 포스터, 오른쪽 전시 소개 글과 개요. 정해지지 않은 칸은 "확정 전"
 await p.locator('.pill [data-go="about"]').click();assert.equal(await state(p),'about');assert.equal(new URL(p.url()).hash,'#about');
 assert.match(await p.locator('#ab-poster').getAttribute('src'),/about-poster\.webp$/);assert.match(await p.locator('#ab-title').textContent(),/프레임을 넘어 우리를 만나다/);
 assert.equal(await p.locator('#ab-text p').count(),3,'한국어 두 문단 + 영어 한 문단');assert.equal(await p.locator('#ab-text b').count(),2,'굵은 질문 두 줄');
 assert.deepEqual(await p.locator('#ab-info dt').allTextContents(),['일시','장소']);
 const [pl,cl,pt,pr,cr]=await p.evaluate(()=>{const a=document.querySelector('.ab-poster').getBoundingClientRect(),c=document.querySelector('.ab-copy').getBoundingClientRect();return [a.left,c.left,a.top,a.right,c.right]});
 assert(pl<cl&&pr<cl,'포스터가 왼쪽, 글과 겹치지 않음');assert(Math.abs(pt)<2,'포스터 줄이 화면 맨 위에서 시작');assert(cr<=p.viewportSize().width+1,'글이 화면 안');
 await p.locator('.pill [data-go="project"]').click();assert.equal(await state(p),'project');
 console.log('about ok');

 // 2) Project 방: 글자 없이 작품 썸네일(작품마다 한 장)만 랜덤 순서로 떠다님, 스크롤하면 도넛 → 작품 목록
 assert.equal(await p.locator('.pj-card').count(),await p.evaluate(()=>PJ_ITEMS.length));assert(await p.evaluate(()=>PJ_ITEMS.length>=STUDENTS.length),'학생마다 카드 한 장 이상');
 assert.equal((await p.locator('#pj-hero').innerText()).trim(),'','첫 화면에 보이는 글자 없음');
 assert.equal(await p.locator('#pj-word, #pj-focus, #pj-down').count(),0);
 assert.deepEqual(await p.evaluate(()=>pj.cards.map(c=>c.s).sort((x,y)=>x-y)),await p.evaluate(()=>[...Array(PJ_ITEMS.length).keys()]),'작품 모두 한 장씩');
 const t0=await p.locator('.pj-strip').first().evaluate(el=>el.style.transform);await p.waitForTimeout(300);
 assert.notEqual(await p.locator('.pj-strip').first().evaluate(el=>el.style.transform),t0,'카드가 떠다님');
 // 스크롤하면 공 → 도넛: 카드들이 위아래로 덜 퍼짐
 const spread=()=>p.evaluate(()=>{const ys=[...document.querySelectorAll('.pj-strip:first-child')].map(el=>{const r=el.getBoundingClientRect();return r.top+r.height/2;});return Math.max(...ys)-Math.min(...ys);});
 // 들어오면 카드가 가운데에서 퍼져 나옴 → 다 퍼진 뒤: 카드는 공을 따라 기울지 않고 화면을 똑바로 봄 (가로:세로가 그대로 4:3), 앞 카드가 뒤 카드보다 큼
 assert(await p.evaluate(()=>pj.rev<1),'들어오면 카드가 퍼져 나오는 중');await p.waitForFunction(()=>pj.rev>=1,null,{timeout:8000});
 const boxes=await p.evaluate(()=>pj.cards.map(c=>{const rs=c.strips.map(el=>el.getBoundingClientRect());const w=Math.max(...rs.map(r=>r.right))-Math.min(...rs.map(r=>r.left)),h=Math.max(...rs.map(r=>r.bottom))-Math.min(...rs.map(r=>r.top));return {w,h};}));
 for(const b of boxes) assert(Math.abs(b.w/b.h-16/9)<0.25,'공일 때 카드는 화면을 똑바로 봄: '+(b.w/b.h).toFixed(2));
 const ws=boxes.map(b=>b.w);assert(Math.max(...ws)>Math.min(...ws)*1.6,'앞 카드는 크고 뒤 카드는 작음');
 // 끌면 공이 손을 따라 부드럽게 돌고, 손을 떼면 미끄러지듯 더 돎. 끌고 난 뒤에는 작품이 열리지 않음
 // (놓기 직전 0.09초 안의 움직임으로 미끄러짐을 정하므로, 끄는 동안의 상태는 '놓는 순간'에 페이지 안에서 적어 두고 움직임 → 놓기를 바로 이어서 함)
 await p.evaluate(()=>{window.__st=null;addEventListener('pointerup',()=>{window.__st={turn:pj.dy>15&&pj.hero.classList.contains('drag'),soft:pj.dys<pj.dy,d0:pj.dy};},{capture:true,once:true});});
 await p.mouse.move(600,450);await p.mouse.down();await p.mouse.move(820,430,{steps:6});await p.mouse.up();
 const st=await p.evaluate(()=>window.__st);assert(st.turn,'끌면 돎');assert(st.soft,'부드럽게 늦게 따라옴');const d0=st.d0;await p.waitForTimeout(300);
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


 // 그림·설명을 넣은 작품만 상세가 열림 (지금은 김수연 우리 언제 만나?, 박수빈 다이소 뷰티). 없는 작품은 눌러도 열리지 않음
 assert.deepEqual(await p.evaluate(()=>PJ_ITEMS.map((it,i)=>pjHasDetail(it)?i:-1).filter(i=>i>=0)),[4,7],'상세가 있는 작품');
 assert.equal(await p.locator('.pj-card.no-detail').count(),await p.evaluate(()=>PJ_ITEMS.length-2));
 const jn=await p.evaluate(()=>pj.cards.findIndex(c=>c.s===0));await p.evaluate(j=>pj.cards[j].el.click(),jn);await p.waitForTimeout(400);
 assert.equal(await p.locator('#pj-detail').isHidden(),true,'자료 없는 작품: 상세 안 열림');
 // 카드를 누르면 그 작품 상세, Enter 키 = 맨 앞 카드
 const j=await p.evaluate(()=>pj.cards.findIndex(c=>c.s===7));
 await p.evaluate(j=>pj.cards[j].el.click(),j);await p.locator('#pj-detail.on').waitFor();assert.match(await p.locator('#pj-d-title').textContent(),/다이소/);
 await p.keyboard.press('Escape');await p.waitForTimeout(400);assert.equal(await p.locator('#pj-detail').isHidden(),true);
 await p.evaluate(j=>pjScrollToU(pjCardAt(j),true),j);await p.waitForFunction(j=>pj.frontIdx===j,j,{timeout:8000});await p.locator('#project').focus();await p.keyboard.press('Enter');await p.locator('#pj-detail.on').waitFor();
 assert(await p.evaluate(()=>pj.at===7),'Enter = 맨 앞 카드');
 await p.keyboard.press('Escape');await p.waitForTimeout(400);
 // 끝까지 내려도 작품 목록은 없음
 assert.equal(await p.locator('#pj-list, #pj-grid, .pj-item').count(),0,'작품 목록 없음');
 await p.evaluate(()=>{pj.root.scrollTop=1e7;});await p.waitForTimeout(100);
 assert(await p.evaluate(()=>Math.abs(pj.root.scrollTop/pj.root.clientHeight-pjEndAt())<0.02),'스크롤 끝');
 // 작품 상세: 넣은 그림만(임시 칸 없음), ← → 이전/다음(자료 없는 작품은 건너뜀), Esc 닫기
 assert.equal(await p.evaluate(()=>pjOpen(6)),false,'박수빈 프린트카페(자료 없음)는 열리지 않음');
 await p.evaluate(()=>pjOpen(7));await p.locator('#pj-detail.on').waitFor();
 assert.equal(await p.locator('#pj-d-who').textContent(),'박수빈');
 assert.match(await p.locator('#pj-d-title').textContent(),/다이소/);assert.equal(await p.locator('#pj-d-images img').count(),3);assert.equal(await p.locator('.pj-shot').count(),3);
 assert.match(await p.locator('#pj-d-desc').textContent(),/가상의 뷰티 브랜드/);
 await p.keyboard.press('ArrowRight');assert.match(await p.locator('#pj-d-title').textContent(),/우리 언제 만나/,'→: 자료 없는 작품은 건너뛰고 다음 자료 있는 작품으로');
 assert.equal(await p.locator('#pj-d-who').textContent(),'김수연');assert.equal(await p.locator('#pj-d-images img').count(),3);
 await p.keyboard.press('ArrowLeft');assert.match(await p.locator('#pj-d-title').textContent(),/다이소/);await p.keyboard.press('Escape');await p.waitForTimeout(400);
 assert.equal(await p.locator('#pj-detail').isHidden(),true);
 assert(await p.evaluate(()=>document.activeElement===pj.root),'닫으면 Project 방에 초점');
 // 만든 사람 → Designer 방의 그 석고상이 가운데 + 표찰에 초점
 await p.evaluate(()=>pjOpen(7));await p.locator('#pj-detail.on').waitFor();await p.locator('#pj-d-who').click();
 await p.waitForFunction(()=>page==='designer',null,{timeout:3000});await p.waitForTimeout(300);
 await p.waitForFunction(()=>dg.gl&&dg.people[dg.at].i===6&&Math.abs(dg.x-dg.tx)<1e-3,null,{timeout:8000});await p.waitForTimeout(200);
 const centered=await p.evaluate(()=>{const r=document.querySelector('.dg-cap[data-i="6"] .dg-plaque').getBoundingClientRect();return Math.abs(r.left+r.width/2-innerWidth/2);});
 assert(centered<4,`박수빈 석고상이 가운데 (${centered}px)`);
 assert(await p.evaluate(()=>document.activeElement.closest('.dg-cap')?.dataset.i==='6'),'박수빈 이름표에 초점');
 console.log('project ok');

 // 3) Designer: 밝은 미술관 (자세한 검사는 tests/designer.cjs). 14명, 이름표 = 학생 소개, 포트폴리오는 새 탭
 assert.equal(await p.locator('.dg-cap').count(),14);assert.equal(await p.locator('.dg-cap[data-i="9"]').count(),0,'조민영은 Designer에서 빠짐');
 assert.equal(await p.locator('.dg-cap[data-i="6"] a.dg-plaque').getAttribute('href'),'https://vin-portfolio-swart.vercel.app/'); // 이름표 = 포트폴리오 링크
 assert.equal(await p.locator('.dg-fork, .dg-plate, .dg-amb, .dg-seam, .dg-work').count(),0,'옛 팻말·금속 표찰·어두운 벽 없음');
 await p.evaluate(()=>{go('project');pjOpen(7,null);});await p.locator('#pj-detail.on').waitFor();
 assert.equal(await state(p),'project');assert.equal(await p.locator('#pj-d-who').textContent(),'박수빈');
 // 상세: 검은 화면, 위 메뉴는 숨김, 오른쪽 위 X로 닫으면 메뉴가 다시 보임
 assert.equal(await p.locator('.topbar').isVisible(),false,'상세에서는 위 메뉴 숨김');assert.equal(await p.locator('#pj-d-mail').isHidden(),true,'메일이 없으면 안 보임');
 await p.locator('#pj-d-close').click();await p.waitForTimeout(400);assert.equal(await p.locator('#pj-detail').isHidden(),true);
 await p.locator('.pill [data-go="designer"]').click();await p.waitForFunction(()=>page==='designer',null,{timeout:3000});
 console.log('designer ok');
 await p.context().close();

 // 4) 움직임 줄이기: Intro는 버튼이 바로 보이고, 카드는 떠다니지 않음
 p=await open({reducedMotion:'reduce'});
 await p.locator('#opening').focus();await p.keyboard.press('Escape');await p.locator('.pill [data-go="project"]').click();
 await p.waitForFunction(()=>page==='project',null,{timeout:3000});
 assert.equal(await p.locator('#project.still').count(),1);
 const s0=await p.locator('.pj-strip').first().evaluate(el=>el.style.transform);await p.waitForTimeout(300);
 assert.equal(await p.locator('.pj-strip').first().evaluate(el=>el.style.transform),s0,'움직임 줄이기: 카드가 멈춰 있음');
 console.log('reduced motion ok');
 await p.context().close();

 // 5) 모바일: 메뉴 3개, Designer는 손가락으로 옆으로 넘김(한 명씩 딱 멈춤)
 p=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.locator('#opening').evaluate(el=>el.scrollTo(0,el.scrollHeight));await p.waitForFunction(()=>page==='about',null,{timeout:8000});
 await p.locator('.pill [data-go="designer"]').tap();assert.equal(await state(p),'designer');
 await p.waitForFunction(()=>dg.gl&&dg.root.classList.contains('is-portrait'),null,{timeout:8000});
 console.log('mobile ok');
 await p.context().close();

 assert.deepEqual(errors,[]);
 console.log('PASS: intro buttons + skip + menu, about (poster + text), project reveal + flat cards by depth + drag/glide → donut keeps spinning, curved paper cards (strips) (keys) → no list → detail (14 images) → designer, designer bright museum (tests/designer.cjs), reduced motion, mobile; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
