/* 내용 데이터: 이미지·3D 파일 경로, 학생 목록(이름·소개·포트폴리오), 화면 위 좌표 */
const ASSETS = {
  street: 'assets/images/street.jpg',
  arch: 'assets/images/arch-bg.jpg',
  frames: 'assets/images/frames.webp',
  ticket: 'assets/images/ticket.webp',
  torn: 'assets/images/ticket-torn.webp',
  poster: 'assets/images/poster.webp',

  m01: 'assets/models/01.glb', m02: 'assets/models/02.glb', m03: 'assets/models/03.glb',
  m04: 'assets/models/04.glb', m05: 'assets/models/05.glb', m06: 'assets/models/06.glb',
  m07: 'assets/models/07.glb', m08: 'assets/models/08.glb', m09: 'assets/models/09.glb',
  m10: 'assets/models/10.glb', m11: 'assets/models/11.glb', m12: 'assets/models/12.glb',
  m13: 'assets/models/13.glb', m14: 'assets/models/14.glb', m15: 'assets/models/15.glb',
};

/* 전시실 GALLERY 01~03: 전시실마다 배경(bg), 좌대 이미지(statues, 5개), 좌대 위 석고상 자리(slots, 왼쪽부터 5칸).
   slots: x·y = 석고상 발이 놓이는 좌대 윗면, h = 석고상 키, tag = 이름표 높이. 좌대 이미지를 바꾸면 slots도 같이 바꿔야 함.
   top = 좌대 이미지를 세로로 내리는 위치 (1전시실 좌대 이미지는 세로가 짧아서 바닥에 맞춤) */
const ROOM_ASSETS = [
  {
    bg: 'assets/images/gallery-1/bg.jpg', statues: 'assets/images/gallery-1/statues.webp', top: 533,
    slots: [
      { x: 252, y: 821, h: 320, tag: 911 }, { x: 764, y: 720, h: 150, tag: 810 }, { x: 1100, y: 642, h: 150, tag: 732 },
      { x: 1455, y: 542, h: 150, tag: 632 }, { x: 1847, y: 823, h: 234, tag: 913 },
    ],
  },
  {
    bg: 'assets/images/gallery-2/bg.jpg', statues: 'assets/images/gallery-2/statues.webp', top: 0,
    slots: [
      { x: 289, y: 533, h: 320, tag: 623 }, { x: 717, y: 540, h: 150, tag: 630 }, { x: 1037, y: 641, h: 150, tag: 731 },
      { x: 1493, y: 518, h: 150, tag: 608 }, { x: 1798, y: 681, h: 320, tag: 771 },
    ],
  },
  {
    bg: 'assets/images/gallery-3/bg.jpg', statues: 'assets/images/gallery-3/statues.webp', top: 0,
    slots: [
      { x: 157, y: 675, h: 168, tag: 765 }, { x: 745, y: 767, h: 150, tag: 857 }, { x: 952, y: 728, h: 150, tag: 818 },
      { x: 1310, y: 723, h: 150, tag: 813 }, { x: 1568, y: 769, h: 236, tag: 859 },
    ],
  },
];

const STUDENTS = [
  { name: '김예일', field: 'uxui', slogan: '구조와 흐름을 꿰뚫어 불편을 편리로 바꾸는 경험 디자이너', desc: '', email: '', portfolio: '' },
  { name: '민하도', field: 'visual', slogan: '아이디어를 시각화하는 디자이너', desc: '', email: '', portfolio: 'https://hadomin91-design.github.io/hadomin_design/' },
  { name: '김준서', field: 'visual', slogan: '상상한 것을 실현으로 바꾸는 디자이너', desc: '', email: '', portfolio: 'https://superijun.github.io/portfolio/' },
  { name: '김우선', field: 'uxui', slogan: '경험을 디자인하고, 감각을 시각화하는 디자이너', desc: '', email: '', portfolio: 'https://kok62360.github.io/1004/' },
  { name: '김수연', field: 'visual', slogan: '상대의 이야기에 귀 기울이고, 원하는 방향을 함께 찾아가는 디자이너', desc: '', email: '', portfolio: 'https://kimssuyeon.github.io/battery-portfolio/' },
  { name: '박재연', field: 'uxui', slogan: '재미있게 끝까지 질리지 않는 디자이너', desc: '', email: '', portfolio: 'https://2501110072-dotcom.github.io/l01_interaction_2b/2501110072_ing_1' },
  { name: '박수빈', field: 'uxui', slogan: '떠오른 가능성을, 손에 닿는 경험으로.', desc: '', email: '', portfolio: 'https://vinportfolio-desk-flow.vercel.app' },
  { name: '박호성', field: 'uxui', slogan: '감에 의존하지 않고, 데이터를 바탕으로 개선하는 디자이너', desc: '', email: '', portfolio: 'https://hoseong-graduation-portfolio.qkrghtjd4820.chatgpt.site/' },
  { name: '오수한', field: 'uxui', slogan: '익숙함의 결을 따라, 변화를 섬세하게 빚는 디자이너', desc: '', email: '', portfolio: 'https://suhan998.github.io/Web-Portfolio/' },
  { name: '조민영', field: '', designer: false, slogan: '경험을 내일로 잇는 디자이너', desc: '', email: '', portfolio: 'https://ddmom.github.io/my_portfolio/' },
  { name: '조예빈', field: 'visual', slogan: '익숙한 것에서 낯선 매력을 발견하는 디자이너', desc: '', email: '', portfolio: 'https://yobinnie.github.io/exhibition_2026/' },
  { name: '손예진', field: 'uxui', slogan: '익숙한 것을 낯설게 듣고, 음악처럼 오래 남는 경험을 만드는 디자이너', desc: '', email: '', portfolio: 'https://pueon01-max.github.io/play-2/' },
  { name: '송예준', field: 'visual', slogan: '과거와 현재와 미래를 잇는 디자이너', desc: '', email: '', portfolio: '' },
  { name: '천승현', field: 'uxui', slogan: '흐름에 맞춰 유연하게 변화하는 디자이너', desc: '', email: '', portfolio: 'https://cheon0903.github.io/fluidity-portfolio/' },
  { name: '하태랑', field: 'visual', slogan: '현실과 꿈의 모호한 경계를 시각화하는 디자이너', desc: '', email: '', portfolio: 'https://lalalatototo10-alt.github.io/graduation/' },
].map((s, i) => ({ ...s, work: null, no: i + 1, room: Math.floor(i / 5), slot: i % 5 }));
/* V2 공통 칸 (2026-11-11 추가)
   field: 'uxui' = UX/UI·웹 전시관, 'visual' = Visual 전시관, '' = 아직 확인 안 됨
   work: 특별전 대표 작품 { src, title, desc, credit } — 자료를 받으면 채움. 지금은 null
   desc(소개글 50~100자)는 나중에 한번에 받아서 채움. 지금은 비워 둠
   room·slot은 V1 GALLERY 01~03 화면이 아직 쓰고 있어서 남겨 둠 */
const FIELD_LABEL = { uxui: 'UX/UI · 웹', visual: 'Visual' };

const MODELS = {
  '조민영': ASSETS.m01, '민하도': ASSETS.m02, '천승현': ASSETS.m03, '박재연': ASSETS.m04, '김수연': ASSETS.m05,
  '박호성': ASSETS.m06, '김예일': ASSETS.m07, '오수한': ASSETS.m08, '박수빈': ASSETS.m09, '김우선': ASSETS.m10,
  '조예빈': ASSETS.m11, '송예준': ASSETS.m12, '김준서': ASSETS.m13, '손예진': ASSETS.m14, '하태랑': ASSETS.m15,
};

const FRAMES = [
  { inner: [377, 399, 346, 252], outer: [344, 368, 412, 315] },
  { inner: [847, 351, 304, 325], outer: [811, 308, 378, 406] },
  { inner: [1276, 402, 336, 245], outer: [1244, 368, 401, 315] },
];

const GALLERY_SPOTS = [[255, 250, 330, 420], [720, 300, 260, 380], [1052, 330, 260, 360], [1478, 290, 260, 400], [1850, 250, 320, 420]];
const LOBBY_SPOTS = [[550, 360, 380, 380], [1000, 330, 380, 420], [1446, 360, 380, 380]];

/* About(전시 소개) 화면의 글과 정보 — js/about.js가 읽음
   text = 전시 서문 문단들, info = [항목, 내용] (내용을 ''로 두면 "확정 전"으로 보임)
   서문은 "전시 소개서" 문서(2026-11-14 초안)에서 가져옴. 예전 구성(나비·전시관·목록)을 설명하던 두 문단은 뺌 */
const ABOUT = {
  poster: ASSETS.poster,
  title: '프레임을 넘어, 우리를 만나다',
  sub: '2026 한국폴리텍대학 정수캠퍼스 시각디자인과 졸업전시',
  text: [
    '우리는 늘 프레임 속에서 작업해 왔습니다. 모니터 화면, 아트보드, 종이 한 장의 테두리 안에서 생각을 그리고 지우고 다시 그렸습니다. 그래서 더욱 궁금해졌습니다. 그 프레임 바깥에 서 있는 우리는 어떤 사람일까요. 이번 전시는 테두리를 한 걸음 넘어, 작품을 만든 한 사람 한 사람을 만나는 자리입니다.',
    '이 전시에는 UX/UI·웹과 Visual, 두 분야의 열다섯 디자이너가 참여합니다. 화면 속 경험을 설계한 사람도, 한 장의 이미지에 생각을 담은 사람도 있습니다. 서로 다른 방식으로 작업해 왔지만, 우리는 모두 보는 사람에게 닿는 디자인을 고민해 왔습니다.',
  ],
  sign: '2026 한국폴리텍대학 정수캠퍼스 시각디자인과 졸업예정자 일동',
  info: [
    ['주최', '한국폴리텍대학 정수캠퍼스 시각디자인과'],
    ['기간', ''],
    ['장소', ''],
    ['참여 디자이너', '15명 (UX/UI · 웹, Visual)'],
    ['지도 교수', ''],
  ],
};
