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

/* Project 방 작품 썸네일 (2026-11-15 받음) — 그림은 assets/images/works/학생번호.webp (16:9, 1600×900)
   title = 썸네일에 적힌 작품 이름. 이 표만 고치면 학생과 작품의 짝이 바뀌어요.
   작품이 둘 이상이면 [ {…}, {…} ] 처럼 목록으로 적어요 → Project 방에 카드가 그만큼 나옴 (예: 박수빈)
   desc = 상세 화면 왼쪽 설명 (빈 줄 = 문단 나눔), images = 상세 화면 오른쪽 그림들 (위에서부터 차례로)
   짝은 원본 파일 이름(다운로드/project_학생프로젝트썸네일/학생이름.png, V2·V3 = 같은 학생의 다음 작품)으로 확인함 (2026-11-15)
   상세 그림 원본: 다운로드/학생 프로젝트 내용/학생이름/학생이름_작품명1·2·3 → 숫자 순서대로 */
const WORKS = {
  '김예일': { src: 'assets/images/works/01.webp', title: '컬처패스' },
  '민하도': { src: "assets/images/works/02.webp", title: "flowny",
    desc: "‘Flower + Harmony’의 의미를 담은 플로니는 취향과 분위기에 맞는 꽃다발을 AI로 조합해 제안하는 온라인 꽃 쇼핑 플랫폼입니다.\n\n꽃을 선물하거나 공간을 꾸미고 싶을 때, 원하는 색감과 스타일을 선택하면 어울리는 꽃 조합을 쉽게 찾아볼 수 있도록 기획했습니다. 복잡한 선택 과정은 줄이고 꽃을 고르는 즐거움은 더하는 데 중점을 두었습니다.\n\n부드러운 파스텔 컬러와 꽃을 모티브로 한 로고를 활용해 친근하고 사랑스러운 브랜드 이미지를 표현했습니다. 직관적인 모바일 화면과 간결한 메뉴 구성으로 누구나 편리하게 꽃을 탐색하고 주문할 수 있도록 디자인했습니다.",
    images: ["assets/images/works/02/01.webp", "assets/images/works/02/02.webp", "assets/images/works/02/03.webp"] },
  '김준서': { src: "assets/images/works/03.webp", title: "SoundCloud Promotion Web",
    desc: "‘SoundCloud’는 아티스트와 리스너가 자유롭게 음악을 공유하고 새로운 사운드를 발견하는 플랫폼입니다. 수많은 음악 속에서 쉽게 지나칠 수 있는 숨겨진 아티스트의 가능성에 주목하며, 단순한 감상을 넘어 새로운 음악을 발견하고 취향을 확장하는 즐거움을 전달하고자 했습니다.\n\n브랜드의 상징적인 오렌지와 블랙 컬러를 활용해 음악의 에너지와 몰입감을 시각적으로 표현했습니다. 취향 기반 음악 추천과 참여형 프로모션, 다양한 인터랙티브 요소를 통해 음악의 발견부터 사용자 참여까지 자연스럽게 이어지는 새로운 음악 경험을 디자인했습니다.",
    images: ["assets/images/works/03/01.webp", "assets/images/works/03/02.webp", "assets/images/works/03/03.webp"] },
  '김우선': { src: 'assets/images/works/04.webp', title: '오늘의집 UI/UX 리디자인' },
  '김수연': { src: 'assets/images/works/05.webp', title: '우리 언제 만나?',
    desc: '모두의 시간을 하나로 연결하는 일정 조율 앱\n\n01. 작품 설명\n여러 사람과 약속을 잡을 때 발생하는 번거로운 일정 조율 과정을 간소화하기 위해 기획한 UI/UX 앱입니다. 공유 링크를 통해 각자의 가능한 날짜와 시간을 선택하면 공통으로 가능한 시간을 직관적으로 확인할 수 있으며, 누구나 쉽고 빠르게 약속을 정할 수 있도록 디자인하였습니다.\n\n02. 디자인 콘셉트\n블루와 화이트를 중심으로 밝고 친근한 분위기를 표현하였으며, 심플한 아이콘과 직관적인 레이아웃을 통해 사용자의 편의성을 높였습니다. 캘린더와 시간 선택 기능을 시각적으로 명확하게 구성하여 복잡한 일정 조율 과정도 쉽고 간편하게 이용할 수 있도록 설계하였습니다.\n\n03. 차별점\n개인의 일정 기록과 관리에 집중하는 기존 캘린더 앱과 달리, 여러 사람의 가능한 시간을 비교하고 공통 일정을 도출하는 데 중점을 두었습니다. 별도의 앱 설치 없이 공유 링크로 일정 조율에 참여할 수 있으며, 참여자별 가능 시간과 공통 시간을 시각화하여 불필요한 소통 과정을 줄이고 효율적으로 약속을 확정할 수 있도록 기획하였습니다.',
    images: ['assets/images/works/05/01.webp', 'assets/images/works/05/02.webp', 'assets/images/works/05/03.webp'] },
  '박재연': { src: 'assets/images/works/06.webp', title: '동방구' },
  '박호성': [                                                                              // 작품 3개 (ALIGNEX·캣팡·KT 멤버십) + 예전 썸네일 bmix studio. KT는 설명 파일이 깨져서 그림만
    { src: "assets/images/works/08.webp", title: "ALIGNEX",
      desc: "ALIGNEX는 혼자 운동하는 사람이 자신의 목표와 숙련도에 맞춰 운동을 계획하고, 동작을 확인하며, 꾸준히 이어갈 수 있도록 기획한 운동 서비스입니다. 운동을 처음 시작할 때는 어떤 종목을 골라야 할지 막막하고, 막상 시작한 뒤에는 자세가 올바른지나 중량과 횟수가 자신에게 적절한지 혼자 판단하기 어렵습니다. 이러한 문제에서 출발해 기획, UX/UI 디자인, 제품 디자인, 웹 디자인을 하나의 프로젝트로 연결했습니다.\n\n앱에서는 오늘의 운동과 일정을 확인하고, 추천 루틴을 바탕으로 종목과 세트 구성을 조정할 수 있도록 설계했습니다. 익숙하지 않은 동작은 운동 가이드에서 확인하고, 운동 중에는 세트 진행과 휴식 시간을 빠르게 살펴볼 수 있습니다. 사용자의 목표와 운동 기록을 바탕으로 루틴과 강도 조절을 돕는 EX AI Agent도 기능 콘셉트로 제안했습니다. 스마트워치 화면은 운동 중 휴대전화를 꺼내기 어려운 상황에 맞춰 현재 세트와 휴식 시간처럼 자주 확인하는 정보에 집중했습니다.\n\n웨어러블 제품은 운동 중의 신체 움직임과 근육 사용 신호를 살펴보는 EX Suit와, 수집된 신호를 앱으로 전달하는 EX Device로 구상했습니다. 앱과 제품의 관계가 처음 보는 사람에게도 쉽게 전달되도록 브랜드 웹사이트에서 서비스의 목적과 제품 구성을 소개했습니다. 운동을 준비하는 순간부터 몸의 움직임과 기록을 돌아보는 순간까지, 사용자가 다음 운동을 스스로 계획할 수 있는 흐름을 제안합니다.",
      images: ["assets/images/works/08/01.webp", "assets/images/works/08/02.webp", "assets/images/works/08/03.webp"] },
    { src: "assets/images/works/08-3.webp", title: "캣팡 (CATPANG) 리디자인",
      desc: "캣팡 리디자인은 고양이 용품을 탐색하고 구매하는 모바일 커머스의 화면과 브랜드 표현을 새롭게 구성한 프로젝트입니다. 고양이에게 맞는 제품을 고르려면 카테고리와 상품 정보, 구매 조건을 차례로 살펴보게 됩니다. 기존 화면에서는 여러 정보가 비슷한 비중으로 배치되어 필요한 항목을 찾거나 상품을 비교하는 과정이 복잡해질 수 있었습니다. 설문에서 드러난 상품 탐색과 가독성 문제를 바탕으로, 구매를 결정하는 데 필요한 정보가 화면에서 먼저 읽히도록 구성했습니다.\n\n상품을 찾는 단계에서는 카테고리와 필터를 쉽게 구분할 수 있도록 정리하고, 상품 상세와 결제 화면에서는 주요 정보와 버튼의 배치 및 시각적 위계를 조정했습니다. 텍스트의 크기와 굵기, 여백과 색상 대비에 기준을 두어 화면마다 정보가 달라져도 사용자가 읽고 조작하는 방식이 일관되도록 했습니다.\n\n브랜드 디자인에서는 기존의 고양이 실루엣을 둥근 발바닥 심볼로 바꾸고, 부드러운 핑크 계열과 둥근 타이포그래피로 캣팡의 친근한 인상을 표현했습니다. 발바닥 심볼은 앱 아이콘과 시작 화면에 적용해 작은 크기에서도 쉽게 알아볼 수 있도록 했습니다. 고양이 용품을 고르는 즐거움이 브랜드의 첫인상부터 실제 쇼핑 화면까지 이어지는 경험을 디자인했습니다.",
      images: ["assets/images/works/08-3/01.webp", "assets/images/works/08-3/02.webp", "assets/images/works/08-3/03.webp"] },
    { src: "assets/images/works/08-4.webp", title: "KT 멤버십 리디자인",
      images: ["assets/images/works/08-4/01.webp", "assets/images/works/08-4/02.webp", "assets/images/works/08-4/03.webp"] },
    { src: 'assets/images/works/08-2.webp', title: 'bmix studio' },
  ],
  '오수한': [                                                                              // 작품 2개
    { src: 'assets/images/works/09.webp', title: 'GTA Online Promotion Website' },
    { src: "assets/images/works/09-2.webp", title: "Bugs! UX/UI 리디자인",
      desc: "기존 벅스(Bugs!) 음악 스트리밍 앱에서 느껴지는 조작의 불편함과 복잡한 정보 구조를 개선하기 위해 진행한 UX/UI 리디자인 프로젝트입니다. 사용자가 음악을 탐색하고 감상하는 과정에서 겪을 수 있는 불편함을 분석하고, 직관적인 조작과 명확한 정보 전달을 중심으로 화면을 재구성하였습니다.\n\n한 손 조작을 고려해 주요 기능을 손이 닿기 쉬운 영역에 배치하고, 재생 정보와 핵심 버튼의 시각적 위계를 정리하였습니다. 이를 통해 음악 탐색부터 선택, 재생까지 자연스럽게 이어지는 사용자 흐름을 설계하고, 더욱 편리하고 몰입감 있는 음악 감상 경험을 제안하였습니다.",
      images: ["assets/images/works/09-2/01.webp", "assets/images/works/09-2/02.webp", "assets/images/works/09-2/03.webp"] },
  ],
  '조민영': null,                                                                         // 아직 썸네일 없음 → 회색 임시 카드
  '손예진': { src: 'assets/images/works/12.webp', title: 'Luckin Coffee Campaign' },
  '송예준': { src: 'assets/images/works/13.webp', title: '春夏秋冬' },
  '하태랑': { src: 'assets/images/works/15.webp', title: 'ONDO' },
  '박수빈': [                                                                              // 작품 2개
    { src: 'assets/images/works/07.webp', title: '프린트카페 (PRINT CAFE)' },
    { src: 'assets/images/works/07-2.webp', title: '다이소 뷰티 (Daiso Beauty) BX',
      desc: '‘다이소 뷰티’는 가성비 뷰티템을 발견하는 장소로 주목받는 다이소에서 출발한 가상의 뷰티 브랜드입니다. 합리적인 가격과 친근함을 바탕으로, 새로운 제품을 발견하고 취향을 시도하는 즐거움에 주목했습니다.\n\n사랑스럽고 생기 있는 시각 언어를 통해 소장하고 싶은 브랜드 이미지를 제안하고, 패키지부터 매장과 온라인까지 이어지는 뷰티 경험을 디자인했습니다.',
      images: ['assets/images/works/07-2/01.webp', 'assets/images/works/07-2/02.webp', 'assets/images/works/07-2/03.webp'] },
  ],
  '조예빈': { src: "assets/images/works/11.webp", title: "SQU'ARE LINE",
    desc: "스퀘어라인 제품 실루엣과 브랜드가 추구하는 무드가 먼저 눈에 들어오도록 공식 쇼핑몰을 리디자인했습니다. 설명은 간결하게 줄이고, 상품 사진에 커서를 올리면 모델 착용 컷으로 전환되는 인터렉션으로 가방 실착용 시의 크기와 스타일을 쉽게 볼 수 있도록 했습니다.\n\n스퀘어라인의 모든 가방을 실제로 탐색할 수 있으며, [Compare] 기능을 추가하여 고민이 되는 가방 두 가지의 사이즈, 가격, 디자인을 두고 비교할 수 있도록 소비자의 고민하는 과정을 도울 수 있도록 제작하였습니다.\n\n[SIZE LAB]에서는 휴대폰이나 노트북처럼 매일 들고 다니는 물건과 가방의 크기를 기기의 기종 별로 비교하며 개인의 일상에 맞는 제품을 택할 수 있습니다.",
    images: ["assets/images/works/11/01.webp", "assets/images/works/11/02.webp"] },
  '천승현': [                                                                              // FLUIDITY 썸네일은 사이트 표지라 뺌 (2026-11-17)
    { src: "assets/images/works/14-2.webp", title: "백금당 웹사이트 리디자인",
      desc: "따뜻하고 차분한 브랜드 감성을 담은 디저트 카페 웹사이트 리디자인\n\n01. 작품 설명\n백금당의 따뜻하고 차분한 브랜드 이미지를 바탕으로 기존 웹사이트를 리디자인한 프로젝트입니다. 브랜드 특유의 편안한 분위기를 온라인에서도 자연스럽게 경험할 수 있도록 구성했습니다. 단순히 정보를 전달하는 웹사이트를 넘어, 방문자가 백금당만의 감성과 브랜드 가치를 느낄 수 있도록 기획했습니다.\n\n02. 디자인 콘셉트\n베이지와 브라운 컬러를 중심으로 부드럽고 안정적인 분위기를 표현했습니다. 여백과 이미지 중심의 레이아웃을 통해 브랜드의 감성을 전달하고자 했습니다. 따뜻한 색감의 디저트 사진과 차분한 타이포그래피를 조화롭게 배치하여 편안하고 아늑한 분위기를 강조했습니다.\n\n03. 주요 특징\n브랜드 소개와 메뉴 탐색을 직관적으로 구성하고, 프로모션 콘텐츠를 통해 온라인과 오프라인을 연결하는 O2O 브랜드 경험을 제안했습니다. 특히 ‘추억 인화소’ 프로모션은 사용자가 소중한 사진을 업로드하고 백금당의 감성을 담은 콘텐츠로 경험할 수 있도록 기획했습니다. 메뉴별 이미지와 설명을 카드 형태로 정리해 정보의 가독성을 높였습니다.",
      images: ["assets/images/works/14-2/01.webp", "assets/images/works/14-2/02.webp", "assets/images/works/14-2/03.webp"] },
  ],
};

const STUDENTS = [
  { name: '김예일', field: 'uxui', slogan: '구조와 흐름을 꿰뚫어 불편을 편리로 바꾸는 경험 디자이너', desc: '', email: '', portfolio: 'https://03yeil-kim.github.io/' },
  { name: '민하도', field: 'visual', slogan: '아이디어를 시각화하는 디자이너', desc: '', email: '', portfolio: 'https://hadomin91-design.github.io/hadomin_design/' },
  { name: '김준서', field: 'visual', slogan: '상상한 것을 실현으로 바꾸는 디자이너', desc: '', email: '', portfolio: 'https://superjjun.github.io/portfolio/fashion/' },
  { name: '김우선', field: 'uxui', slogan: '경험을 디자인하고, 감각을 시각화하는 디자이너', desc: '', email: '', portfolio: 'https://kok62360.github.io/1_1028/' },
  { name: '김수연', field: 'visual', slogan: '상대의 이야기에 귀 기울이고, 원하는 방향을 함께 찾아가는 디자이너', desc: '', email: '', portfolio: 'https://kimssuyeon.github.io/battery-portfolio/' },
  { name: '박재연', field: 'uxui', slogan: '재미있게 끝까지 질리지 않는 디자이너', desc: '', email: '', portfolio: 'https://2501110072-dotcom.github.io/l01_interaction_2b/2501110072_ing_1' },
  { name: '박수빈', field: 'uxui', slogan: '떠오른 가능성을, 손에 닿는 경험으로.', desc: '', email: '', portfolio: 'https://vinportfolio-desk-flow.vercel.app' },
  { name: '박호성', field: 'uxui', slogan: '감에 의존하지 않고, 데이터를 바탕으로 개선하는 디자이너', desc: '', email: '', portfolio: 'https://hoseong-graduation-portfolio.qkrghtjd4820.chatgpt.site/' },
  { name: '오수한', field: 'uxui', slogan: '익숙함의 결을 따라, 변화를 섬세하게 빚는 디자이너', desc: '', email: '', portfolio: 'https://suhan998.github.io/Web-Portfolio/' },
  { name: '조민영', field: '', designer: false, slogan: '경험을 내일로 잇는 디자이너', desc: '', email: '', portfolio: 'https://ddmom.github.io/my_portfolio/' },
  { name: '조예빈', field: 'visual', slogan: '익숙한 것에서 낯선 매력을 발견하는 디자이너', desc: '', email: '', portfolio: 'https://yobinnie.github.io/exhibition_2026/' },
  { name: '손예진', field: 'uxui', slogan: '익숙한 것을 낯설게 듣고, 음악처럼 오래 남는 경험을 만드는 디자이너', desc: '', email: '', portfolio: 'https://pueon01-max.github.io/play-2/' },
  { name: '송예준', field: 'visual', slogan: '과거와 현재와 미래를 잇는 디자이너', desc: '', email: '', portfolio: 'https://yejun40.github.io/wepportfolio/' },
  { name: '천승현', field: 'uxui', slogan: '흐름에 맞춰 유연하게 변화하는 디자이너', desc: '', email: '', portfolio: 'https://cheon0903.github.io/fluidity-portfolio/' },
  { name: '하태랑', field: 'visual', slogan: '현실과 꿈의 모호한 경계를 시각화하는 디자이너', desc: '', email: '', portfolio: 'https://lalalatototo10-alt.github.io/graduation/' },
].map((s, i) => ({ ...s, works: [].concat(WORKS[s.name] || []), no: i + 1, room: Math.floor(i / 5), slot: i % 5 }));
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

/* About(전시 소개) 화면의 글과 정보 — js/about.js가 읽음 (2026-11-15 시안대로)
   title = 제목 줄들, text = 문단들(문단 하나 = 줄 목록. 큰 화면에서는 이 줄 그대로, 좁은 화면에서는 이어서 흐름),
   <b>…</b> = 굵은 글씨, en: true = 영어 문단, info = [항목, 내용] (내용을 ''로 두면 "확정 전"으로 보임) */
const ABOUT = {
  poster: 'assets/images/about-poster.webp',
  title: ['2026 한국폴리텍대학 정수캠퍼스 시각디자인 졸업전시', '프레임을 넘어 우리를 만나다 | Beyond the Frame'],
  text: [
    { lines: [
      '우리는 늘 프레임 속에서 작업해 왔습니다. 모니터 화면, 아트보드, 종이 한 장의 테두리 안에서',
      '생각을 그리고 지우고 다시 그렸습니다. 그래서 더욱 궁금해졌습니다.',
      '<b>그 프레임 바깥에 서 있는 우리는 어떤 사람일까요?</b>',
      '이번 전시는 테두리를 한 걸음 넘어, 작품을 만든 한 사람 한 사람을 만나는 자리입니다.',
    ] },
    { lines: [
      '이 전시에는 디지털과 비주얼, 두 분야의 디자이너가 참여합니다.',
      '화면 속 경험을 설계한 사람도, 한 장의 이미지에 생각을 담은 사람도 있습니다.',
      '서로 다른 방식으로 작업해 왔지만, 우리는 모두 보는 사람에게 닿는 디자인을 고민해 왔습니다.',
    ] },
    { en: true, lines: [
      'We have always worked within frames. Within the boundaries of monitor screens,',
      'artboards, and sheets of paper, we have drawn, erased, and redrawn our ideas.',
      'And somewhere along the way, we began to wonder: <b>Who are we beyond those frames?</b>',
      'This exhibition is an invitation to step beyond the boundaries and meet the individuals',
      'behind the work, one by one.',
      'This exhibition brings together designers from two fields: Digital Design and Visual Design.',
      'Some create experiences within digital screens, while others express their ideas through a',
      'single image. Though we have worked in different ways,',
      'we all share the same purpose: to create designs that connect with people.',
    ] },
  ],
  info: [
    ['일시', '2026. 11.17-11.18. &nbsp;AM 10:00 - 18:00'],
    ['장소', '서울특별시 용산구 보광로 73, 제 3공학관 2층'],
  ],
};
