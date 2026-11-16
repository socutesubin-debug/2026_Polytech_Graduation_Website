# BEYOND THE FRAME — 2026 시각디자인과 졸업전시 웹사이트

한국폴리텍대학 정수캠퍼스 시각디자인과 2026 졸업작품 온라인 전시 페이지입니다.
React 프로젝트가 아니라서 `src`·`public`·`package.json`은 없습니다. 빌드 도구 없이 **HTML + CSS + JavaScript** 로만 만든 정적 사이트라서, 이 폴더를 그대로 GitHub Pages에 올리면 바로 배포됩니다.
CSS와 JavaScript는 **화면(방)별로 파일을 나눠** 두었습니다.

## 화면 흐름 (2026-11-14 새 기획) — Intro · About · Project · Designer

메뉴는 **Intro · About · Project · Designer** 네 개예요. 다른 학교 졸업전시처럼 "작품 보기"와 "사람 보기" 두 갈래로 단순하게 바꿨어요.

```
Intro (스크롤: 하늘의 나비 → 포스터 벽 → 나비가 포스터 속으로, 표면이 물처럼 일렁임 → 하얗게) → About
   배경음(`js/sound.js`, 파일 `assets/audio/bgm.mp3`): 화면 왼쪽 아래(휴대폰은 아래 가운데)의 작은 둥근 유리 버튼으로 켜고 끔. 늘 켜진 상태로 시작(버튼은 처음부터 켜진 모양, 끌 때만 누름). 열자마자 재생을 시도하고, 브라우저가 막으면 화면을 처음 누르거나 키를 누르는 순간 소리가 남(스크롤·휠은 브라우저가 누르기로 치지 않음). 켜져 있으면 막대가 소리에 맞춰 움직이며, 끄면 작게 줄어 멈춤(꺼도 다음 방문에는 다시 켜짐). Designer의 ← → 버튼도 같은 유리 모양. Intro 아래 안내 문구 "길잡이 나비를 따라 스크롤 해주세요". 건너뛰기 버튼은 없음(키보드 Esc·Enter로는 넘어감). Intro를 지나면 마우스 커서 대신 Intro와 같은 금빛 나비가 마우스를 따라다님(`js/cursor.js`, 숫자는 맨 위 `BF_CURSOR`): 움직이면 빛가루가 날리고, 누를 수 있는 곳 위에서는 조금 커짐. 마우스 없는 기기·움직임 줄이기·WebGL2가 안 되는 브라우저는 원래 커서. `index.html`의 js·css 주소 끝 `?v=날짜`는 브라우저가 예전 파일을 쓰지 않게 하는 버전 번호(파일을 고쳐 올릴 때 함께 바꿈)
   About (2026-11-15 시안): 왼쪽 = 천장에서 줄로 매달린 포스터(assets/images/about-poster.webp), 오른쪽 = 제목 두 줄 · 한국어 서문 · 영어 서문 · 일시 · 장소. 큰 화면은 시안의 줄바꿈 그대로, 좁은 화면은 포스터 위 · 글 아래
   Project 방: 글자 없이 작품 썸네일만 랜덤 순서로 떠다님(공: 들어오면 가운데에서 퍼져 나오고, 카드는 늘 화면을 똑바로 보고, 끌면 부드럽게 돌고 손을 떼면 미끄러지듯 더 돎) → 스크롤하면 부드럽게 도넛으로 바뀜, 도넛은 계속 돌고 카드는 도넛을 따라 휘어진 종이처럼 보임(카드를 누르면 작품 상세: 검은 화면, 왼쪽 글 · 오른쪽 그림. 그림이나 설명을 넣은 작품만 열림) → 만든 사람 이름 → Designer 방
   Designer: 밝은 미술관(Three.js). **배경은 깔끔하게(2026-11-16)**: 민 아이보리 벽 · 이음매 없는 밝은 바닥 · 석고상 위 은은한 조명만 (아치·3D 이정표·판넬·몰딩·빛줄기·먼지 없앰). **가운데 벽의 방향 사인에서 시작**: 가는 검정 글자 + 긴 화살표 선 "← UX/UI · WEB", "VISUAL DESIGN →"(HTML, 누르면 그 구역 첫 학생 앞으로, 높이는 `DG.way`), 그 아래 바닥에 조작 방법 한 줄(휴대폰은 '옆으로 밀어 보세요'). 사인은 ← → 버튼보다 높이 있어서 구역 첫 학생 앞에서도 버튼과 겹치지 않음. UX/UI 8명은 가운데에서 왼쪽으로, Visual 6명은 오른쪽으로 서고 양 끝은 옆벽으로 막힘. ← →로 넘기면 가운데 사인에서도 한 번 멈춤. 위아래 테두리가 있는 석고 받침대(석고상과 같은 빛깔, `DG.colors.stone`) 위에 석고상(투명 배경 사진을 판에 붙인 2.5D). 구역 제목은 '전체' 보기에서만 벽에 보임('전체' 보기는 코드(`dgZone('all')`)에만 남아 있고 지금 화면에는 여는 버튼이 없음). 가운데에 멈추면 사진이 3D 석고상으로 바뀌어 좌우로 천천히 돎(사진과 같은 색). 한 공간 안에 왼쪽 UX/UI · WEB 구역(벽에 옅은 블루그레이 빛), 오른쪽 VISUAL DESIGN 구역(옅은 피치·테라코타 빛). 좌우 버튼·← → 키·휠·손가락으로 밀기. **받침대 앞 이름표 = 이름 + '~디자이너'(js/data.js의 slogan)**, 판 없이 검정 글자와 가는 선만(황동 명판 없앰). **석고상이나 이름표를 누르면 그 학생 포트폴리오가 새 탭으로 열림**(포트폴리오가 없으면 눌리지 않음, 따로 있던 포트폴리오 버튼·소개 글은 없앰). 3D가 안 되면 같은 내용의 목록(주소에 ?dg=list로 미리 볼 수 있음)
```

| 화면 | 주소 끝 | HTML (`index.html` 주석) | CSS | JavaScript | 숫자 고치는 곳 |
|---|---|---|---|---|---|
| Intro (스크롤 인트로) | (없음) | `⑧ Intro` | `css/opening.css`, `css/intro-scroll.css` | `js/opening.js`, `js/intro-scroll.js`, `js/butterfly-gl.js` | `js/intro-scroll.js` 맨 위 `CFG` (나비 크기, 카메라, 물결 세기) · 인트로만 보기: `intro-proto.html` |
| About | `#about` | `⑫ About` | `css/about.css` | `js/about.js` | `js/data.js` 맨 아래 `ABOUT` (제목 · 문단별 줄 · 일시/장소 — 빈칸은 "확정 전") |
| Project 방 | `#project` | `⑩ Project 방` | `css/project.css` | `js/project.js` | 맨 위 `PROJECT` (그림 수, 카드 움직임) |
| Designer | `#designer` | `⑪ Designer` | `css/designer.css` | `js/designer.js` | 맨 위 `DG` (간격·받침대 크기·화각·벽 색·색 진하기, `hub` 가운데 이정표에서 첫 학생까지 거리, `sign` 이정표·입구 아치 크기, `endGap` 양 끝 옆벽, `light` 빛줄기·먼지·마우스 밝기, `turn` 3D 돌기, `turnShade`·`turnGlow`·`turnMix` 3D 석고상 밝기·색 맞춤 — 사진과 같은 색이 되게 화면 색을 재서 맞춘 값, `colors.plaster` 석고상 색 기준) |

## 포스터 QR → 폰 AR 나비 페이지 (2026-11-16) — `butterfly.html`

포스터의 QR을 폰으로 찍으면 열리는 **폰 전용 AR 페이지**예요. 화면에는 나비와 아래 `웹사이트 구경하기` 버튼 하나만 있어요.

- 열자마자 뒤 카메라가 켜지고(허락 창), 그 위에 사이트 Intro와 같은 금빛 나비(`js/butterfly-gl.js`)가 내 주위 공간을 날아다녀요 (`js/butterfly-ar.js`, 숫자는 맨 위 `BF_AR`: 나비 크기 `span`, 거리 `dist`, 좌우로 돌아다니는 폭 `wander` 등)
- 폰 기울기 센서로 폰이 보는 방향을 알아내서, 폰을 돌려도 나비가 공간에 그대로 있어요. 가까우면 크게, 멀면 작게, 몸 방향도 3D. 화면 밖으로 나가면 가장자리에 금색 화살표. 톡 치면 가까이 와요
- **나비는 카메라가 보는 쪽을 따라와요** (`BF_AR.followCam`). 폰을 돌리면 잠깐 뒤처졌다가 다시 화면 안으로 날아와요
- **손바닥을 내밀면 나비가 손 위에 앉아요** (`js/butterfly-hand.js`, 숫자는 맨 위 `BF_HAND`). 구글 MediaPipe 손 인식(Apache-2.0)을 쓰고 파일은 `assets/vendor/mediapipe/`(약 26MB, 폰이 받는 건 그중 약 17MB). 커서 나비가 먼저 날고 난 뒤에 받아요. 준비되면 위에 "손바닥을 내밀면 나비가 앉아요"가 나와요. 주소 끝에 `?hand=0`을 붙이면 손 인식을 끔
- **움직일 때 별빛 반짝이** (`BF_AR.sparkle`·`sparkleIdle`·`sparkleSize`, 움직임 줄이기를 켠 폰은 끔)
- 버튼은 유리 느낌(글래스모피즘), 화살표 없음
- 아이폰: 동작 센서는 규칙상 '누른 뒤'에만 허락을 물을 수 있어서, 처음 한 번 화면을 톡 치면 물어봐요 (그 전에는 나비가 화면에 붙어 날아요)
- 카메라를 거절하면 어두운 배경 위의 나비, 3D(WebGL2)가 안 되면 메인 포스터 그림
- **카메라는 https 주소에서만 켜져요.** http(닷홈 기본 주소)로 들어오면 바로 GitHub Pages https 주소로 옮겨 가요 (`butterfly.html` 위쪽 `PAGE_HTTPS`). 닷홈에 SSL(https)을 켜면 그 주소를 바꾸면 돼요
- QR: 기본 QR `docs/qr/butterfly-qr.*`(닷홈 주소), 꾸민 QR `docs/qr/butterfly-qr-design-*.*` (다시 만들기: `python tools/make-qr-design.py`). GitHub Pages 주소 QR은 프로젝트 파일 `qr/butterfly-qr-plain.png`
- 확인: `npm start` 후 `http://localhost:8765/butterfly.html` (localhost는 http여도 카메라가 켜짐) · 검사 `node tests/butterfly-phone.cjs`

## 새 WebGL 인트로 미리보기 (2026-11-15) — `intro-webgl.html`

기존 인트로(`index.html`의 Intro, `intro-proto.html`)는 그대로 두고, **별도 페이지**에 하나의 3D 공간(하늘 · 미술관 외벽 · 포스터)으로 만든 새 인트로예요. 카메라만 움직여요: 하늘에서 나비 등장 → 나비가 오른쪽으로 나감 → 시선이 벽으로 내려옴 → 나비가 왼쪽에서 들어와 포스터 속으로. 나비는 기존 인트로와 같은 `js/butterfly-gl.js`를 쓰고, 나비가 지나가는 길을 따라 벽과 하늘에 물결이 번져요 (바닥 연못은 뺐어요).

| 무엇 | 파일 |
|---|---|
| 미리보기 페이지 | `intro-webgl.html` (끝에서 `전시 입장하기` → `goToExhibition()` 함수 하나만 바꾸면 실제 사이트로 연결) |
| **숫자 고치는 곳** (스크롤 길이, 구간, 카메라 경로, 나비 크기·날갯짓, 흡수 지점, 물결 세기) | `js/intro-webgl/config.js` |
| 공간(하늘·벽·바닥·포스터·물결) | `js/intro-webgl/world.js` |
| 나비 자세·흡수 점 (나비 그림은 `js/butterfly-gl.js`) | `js/intro-webgl/butterfly.js` |
| 스크롤·카메라·접근성·정리 | `js/intro-webgl/intro.js` |
| 모양 (이름은 모두 `iw-`로 시작) | `css/intro-webgl.css` |
| 포스터 원본 | `assets/images/intro-webgl/main-poster.webp` (프로젝트 파일 `storyboard/key-visual/main-poster.png` 613×926, 비율 그대로) |

- 확인용 주소 끝 옵션: `?p=0.6`(그 진행률에서 멈춤), `?debug=1`(진행률·fps 표시), `?reduced=1`(움직임 줄이기)
- 검사: `node tests/intro-webgl.cjs` (화면 캡처, 나비가 화면 밖으로 나가는지, 빠른 스크롤 전진·후진, 키보드, 정리)
- 더블클릭(file://)으로 열면 포스터는 `main-poster.data.js`(글자로 담은 사본)를 써요. 3D 라이브러리는 인터넷(CDN)에서 받아요.

예전 V2 화면(3D 로비 `#lobby3d`, 전시관 `#hall-uxui`·`#hall-visual`, 목록 `#list`)은 메뉴에서 뺐어요. 파일은 남아 있어서 주소로는 볼 수 있어요. 필요 없다고 정해지면 지워도 돼요.

**아직 임시인 것 (자료를 받으면 바꾸는 곳)** — 모두 `js/data.js`의 `STUDENTS`

- 작품: 학생마다 `work: { src: '대표 그림', title: '작품 제목', desc: '작품 설명', images: ['그림1', … '그림14'] }`. 대표 그림(`src`)이 없는 작품은 Project에 카드가 나오지 않아요(넣으면 자동으로 생김). `images`나 `desc`를 넣지 않은 작품은 카드를 눌러도 상세가 열리지 않아요(하나만 넣으면 그것만 보여 줌).
- 소개글: `desc` 칸. 표찰에 세 줄까지 나와요. 표찰은 한국어만 써요.
- 포트폴리오 주소: `portfolio` 칸. 비어 있으면 표찰에 "포트폴리오 준비 중"이 나와요 (지금 김예일·송예준).
- 분야 미정 1명(조민영, Designer에서 제외): `field`를 `'uxui'` 또는 `'visual'`로 적으면 분야 버튼에서 걸러져요.

**Designer의 석고상**은 3D 파일을 미리 찍어 둔 사진(`assets/images/busts/01~15.webp`, 배경 투명)이에요. 그래서 3D 없이 빠르게 열리고 휴대폰에서도 가벼워요. 02~15는 960×1120(합계 약 0.75MB), 01(조민영, 예전 석고상)만 480×560이에요. 석고상 바닥이 사진 아래 끝에 닿도록 맞춰 두었어요.

**직접 확인하는 법**: `index.html`을 더블클릭하거나, 이 폴더에서 터미널에 `python -m http.server 8765`를 치고 브라우저에서 `http://localhost:8765/`를 열어요. 검사는 `node tests/v2-flow.cjs`(Intro · About · Project · Designer 흐름), `node tests/designer.cjs`(Designer 미술관), `node tests/browser-smoke.cjs`(목록 · V1), `node tests/hall.cjs`(예전 전시관)예요.

옛 V1 화면(티켓 인트로, 액자 로비, 그림 전시실)은 지우지 않았어요. 주소 끝에 `#intro`, `#lobby`, `#gallery-1`~`#gallery-3`을 붙이면 볼 수 있어요. 아래 표는 그 V1 화면 설명이에요.

## 화면(방) ↔ 파일

| 화면 | HTML (`index.html` 안 주석 표시) | CSS | JavaScript |
|---|---|---|---|
| ①② 인트로 (티켓 → 길거리 포스터 → 금색 액자 → 와장창) | `① 인트로`, `② 인트로` | `css/intro.css` | `js/intro.js` |
| ③ 로비 (액자 3개 = 전시실 입구) | `③ 로비` | `css/lobby.css` | `js/lobby.js` |
| ④ 전시실 GALLERY 01~03 (석고상) | `④ 전시실` | `css/gallery.css` | `js/gallery.js` |
| 학생 상세 팝업 (석고상을 누르면 열림) | `학생 상세 팝업` | `css/detail.css` | `js/detail.js` |
| ⑤ 작가 목록 LIST | `⑤ 작가 목록` | `css/list.css` | `js/list.js` |
| 공통 (상단 메뉴, 화면 전환, 안내 문구) | `공통` | `css/common.css` | `js/screens.js`, `js/common.js` |

## 폴더 구조

```
beyond-the-frame/
├── index.html            # 페이지 구조 (HTML) — 화면마다 <!-- ① 인트로 --> 같은 주석으로 구분
├── css/
│   ├── common.css        # 공통: 색·글꼴 변수, 화면 전환, 상단 메뉴, 움직이는 배경 무대
│   ├── intro.css         # ①② 인트로
│   ├── lobby.css         # ③ 로비
│   ├── gallery.css       # ④ 전시실
│   ├── detail.css        # 학생 상세 팝업
│   └── list.css          # ⑤ 작가 목록
├── js/                   # index.html 아래쪽에서 이 순서대로 불러옴
│   ├── data.js           # 내용 데이터: 학생 목록·이미지/3D 파일 경로·화면 좌표
│   ├── common.js         # 공통 도구: 짧은 함수, 석고상 그림, 움직이는 배경 무대, 먼지 효과
│   ├── screens.js        # 화면 전환과 상단 메뉴, 주소(#lobby 등) 관리
│   ├── models3d.js       # 3D 공통: three.js 불러오기, .glb 읽기, 조명
│   ├── intro.js          # ①② 인트로
│   ├── lobby.js          # ③ 로비
│   ├── gallery.js        # ④ 전시실 (전시실 바꾸기, 석고상 배치·회전)
│   ├── detail.js         # 학생 상세 팝업
│   ├── list.js           # ⑤ 작가 목록
│   └── main.js           # 시작: 메뉴·키보드, 매 프레임 그리기, 첫 화면 정하기 (맨 마지막에 불러와야 함)
├── assets/
│   ├── images/           # 배경·포스터·티켓 이미지
│   │   ├── street.jpg        인트로 길거리 배경
│   │   ├── poster.webp       길거리 포스터
│   │   ├── ticket.png        티켓
│   │   ├── ticket-torn.png   뜯긴 티켓
│   │   ├── arch-bg.jpg       로비 배경
│   │   ├── frames.webp       로비 액자
│   │   ├── gallery-1/        전시실 1: bg.jpg(배경) + statues.webp(좌대 5개)
│   │   ├── gallery-2/        전시실 2: bg.jpg(배경) + statues.webp(좌대 5개)
│   │   └── gallery-3/        전시실 3: bg.jpg(배경) + statues.webp(좌대 5개)
│   └── models/           # 학생별 석고상 3D 파일 (용량을 줄인 버전)
│       └── 01.model.js ~ 15.model.js   3D 파일(.glb)을 글자(base64)로 담은 파일. 더블클릭(file://)과 GitHub Pages 모두 이 파일을 읽음
├── .nojekyll             # GitHub Pages가 파일을 그대로 쓰도록 하는 빈 파일
└── README.md
```

### 3D 파일 번호 ↔ 학생

| 번호 | 이름 | 번호 | 이름 | 번호 | 이름 |
|---|---|---|---|---|---|
| 01 | 조민영 | 06 | 박호성 | 11 | 조예빈 |
| 02 | 민하도 | 07 | 김예일 | 12 | 송예준 |
| 03 | 천승현 | 08 | 오수한 | 13 | 김준서 |
| 04 | 박재연 | 09 | 박수빈 | 14 | 손예진 |
| 05 | 김수연 | 10 | 김우선 | 15 | 하태랑 |

(파일 이름에 한글이 있으면 서버에 따라 주소가 깨질 수 있어서 번호로만 저장했습니다.)

## 외부 링크 (CDN)

설치할 것은 없고, 아래 두 가지를 인터넷에서 불러옵니다.

- 글꼴: Google Fonts — Noto Sans KR, Noto Serif KR (`index.html` 9번째 줄)
- 3D: [three.js 0.160.0](https://cdn.jsdelivr.net/npm/three@0.160.0/) — jsDelivr CDN (`index.html`의 `importmap`)

## 내용 수정하는 곳

| 바꾸고 싶은 것 | 위치 |
|---|---|
| 학생 이름 / 작품 설명 / 포트폴리오 링크 | `js/data.js`의 `STUDENTS` 목록 (`portfolio: ''` 칸에 주소 넣기) |
| 이미지·3D 파일 경로 | `js/data.js` 맨 위 `ASSETS` |
| 인트로 방식 | `js/screens.js`의 `INTRO_MODE` — `'combo'`(티켓→포스터→액자, 현재), `'ticket'`, `'frame'` |
| 색·글꼴 | `css/common.css` 맨 위 `:root` 변수 |
| 상단 메뉴 (왼쪽 로고, 오른쪽 글자 메뉴) | 로고 그림 `assets/images/logo.webp`, 모양 `css/common.css`의 `.topbar` · `.brand` · `.pill` |
| 화면별 모양·동작 | 위 **화면(방) ↔ 파일** 표의 해당 파일 |

JavaScript 파일들은 모듈(`import`)이 아니라 `index.html`에서 차례로 불러오는 일반 스크립트입니다. 앞 파일에서 만든 변수·함수를 뒤 파일에서 그대로 쓰므로 `<script>` 순서를 바꾸지 마세요.

주소 끝에 `#project`, `#designer` (예전 화면: `#lobby3d`, `#hall-uxui`, `#hall-visual`, `#list`)를 붙이면 오프닝 없이 해당 화면으로 바로 갑니다. (옛 V1 화면: `#intro`, `#lobby`, `#gallery-1` ~ `#gallery-3`)

## 학생 석고상 통일 (2026-11-15)

학생 14명(조민영 제외, 01번은 예전 석고상 그대로)의 석고상을 **같은 재질·조명·카메라**로 다시 만들었어요. 학생마다 색, 배경, 받침대가 제각각이던 그림을 하나의 전시처럼 맞추려는 목적이에요.

1. 학생 석고상 그림 → **Hyper3D Rodin**(Gen-2.5-High, 반사 빼기 켬)으로 3D(.glb) 만들기
2. `tools/bust-export.py`(Blender): 따뜻한 베이지 석고색 `IVORY (0.74, 0.66, 0.54)`을 3D 색 그림에 입히고, 거칠기·금속 그림을 빼요. `cut`을 주면 받침대 아래 네모 받침을 잘라요.
3. 아래 '석고상 파일 줄이기'와 같은 방법으로 면 10만 개로 줄이고 압축해요. 이번에는 색 그림도 `--texture-compress webp --texture-size 1024`로 줄였어요.
4. `tools/bust-render.py`(Blender): 같은 석고색, 같은 조명, 85mm 정면 카메라로 960×1120 투명 사진을 찍어요. 그다음 석고상 바닥을 사진 아래 끝에 맞춰 webp로 저장해요.

학생마다 원래 무늬를 남기는 정도(`tex_mix`)가 달라요. 기본은 1.0이고, 아래 학생만 따로 맞췄어요.
- 박재연 0.5: 선글라스가 새까맣게 나와서 줄임
- 박호성·오수한·천승현 0.7 + `cut`: 진한 갈색 머리를 줄이고, 네모 받침을 잘라냄

```
blender --factory-startup -b -P tools/bust-export.py -- 원본.glb 석고.glb 1.0 [cut]
blender --factory-startup -b -P tools/bust-render.py -- 원본.glb 사진.png 1.0 [cut]
```

`--factory-startup`을 꼭 넣어 주세요. 설치된 Blender 추가 기능이 시작할 때 오류를 낼 수 있어요.

## 석고상 파일 줄이기 (2026-11-13)

석고상 15개는 `assets/models/01.glb`~`15.glb`에 있어요. 원래는 면이 50만~100만 개라 너무 무거워서, **면 10만 개**로 줄였어요 (얼굴 확대 비교로 원본과 가장 비슷한 수). 01·02·04는 원래 가벼워서 그대로 뒀어요.

| | 예전 | 지금 |
|---|---|---|
| `.glb` 15개 합계 | 약 53MB | 약 15MB (2026-11-15 새 석고상) |
| `.model.js` 15개 합계 | 약 28MB | 약 19MB |

- 웹 서버(닷홈, `python -m http.server`)에서는 `.glb`를 바로 받아요. 더블클릭(file://)으로 열 때만 `.model.js`를 읽어요 (`js/models3d.js`의 `readGLB`).
- 원본(줄이기 전) 파일은 git 기록에 남아 있어요: `git show 6074be9:assets/models/03.glb > 03-원본.glb`

새 석고상을 넣거나 다시 줄일 때 (Node.js 필요, 작업 폴더 밖에서):

```
npm i @gltf-transform/cli@4.5.1
node tools/simplify-bust.mjs 원본.glb 줄인.glb 100000 0.01 1
npx gltf-transform optimize 줄인.glb assets/models/03.glb --compress meshopt --texture-compress false --simplify false
```

그다음 `.model.js`도 다시 만들어요 (PowerShell):

```
$b=[Convert]::ToBase64String([IO.File]::ReadAllBytes("assets/models/03.glb"))
"GLB_DATA['assets/models/03.glb'] = 'data:model/gltf-binary;base64,$b';" | Set-Content assets/models/03.model.js -NoNewline
```

## 다른 컴퓨터에서 이어서 작업하기

필요한 것: **Git**, **Node.js**(18 이상), 인터넷. (Python은 없어도 됨)

```bash
# 1. 내려받기 (작업 브랜치)
git clone -b claude/project-thread-1ym3nr https://github.com/socutesubin-debug/2026_Polytech_Graduation_Website.git
cd 2026_Polytech_Graduation_Website

# 2. 작업 도구 설치 (처음 한 번만: 테스트용 브라우저 Playwright)
npm run setup

# 3. 사이트 보기 → 브라우저에서 http://localhost:8765/
npm start
```

| 하고 싶은 일 | 명령 |
|---|---|
| 사이트 보기 (파일을 고치면 새로고침만 하면 반영) | `npm start` |
| 검사 (Intro · About · Project · Designer 전체 + Designer 자세히) | 다른 터미널에서 `npm test` (먼저 `npm start`가 켜져 있어야 함) |
| 닷홈에 올릴 폴더 만들기 | `npm run upload` → `dist/dothome_upload` |

이미 내려받은 컴퓨터에서 다시 시작할 때는 `git pull`로 최신 내용을 받은 뒤 `npm start`.
Claude Code로 이어서 할 때 필요한 작업 맥락(진행 방식, 규칙, 배포 방법, 남은 일)은 저장소의 **`CLAUDE.md`**에 적어 두었어요 (Claude Code가 자동으로 읽음).

석고상 원본 3D 파일(Hyper3D가 만든 .glb, 학생마다 약 28MB, 합계 413MB)은 너무 커서 저장소에 없어요. 원래 작업 컴퓨터의 `다운로드\학생 석고상 얼굴\3d`에만 있으니, **석고상을 새로 만들 때만** USB·클라우드로 옮겨 쓰면 돼요. 사이트에 쓰는 줄인 파일(`assets/models`, `assets/images/busts`)과 생성 기록(`tools/bust-generations.tsv`)은 저장소에 있어요.

## 내 컴퓨터에서 실행하기

`npm start`로 켜고 `http://localhost:8765/`로 보는 것을 권해요 (위 표). Python이 있으면 `python -m http.server 8765`도 됩니다.
`index.html`을 **더블클릭해서 열면**(`file://`) 브라우저가 내 컴퓨터의 그림을 3D 화면에 올리지 못하게 막아서 **Designer 석고상이 보이지 않고**, 배경음 막대도 실제 소리 대신 비슷한 움직임으로 대신 움직여요. 닷홈 같은 웹 서버에서는 문제없어요.

## 닷홈에 올리기 (실제 사이트)

닷홈 유료 호스팅에 **알드라이브(FTP)**로 올려요.

1. `npm run upload` → `dist/dothome_upload` 폴더가 생김 (사이트에 실제로 쓰는 파일만, 약 21MB. 테스트·도구·안 쓰는 이미지·더블클릭용 예비 파일은 뺌)
2. 닷홈 **마이닷홈 → 호스팅 관리**에서 FTP 주소(보통 `아이디.dothome.co.kr`)·아이디·비밀번호 확인
3. 알드라이브 → 새 접속: 프로토콜 **FTP**, 포트 **21** (안 되면 SFTP·22) → 연결
4. 오른쪽(서버)에서 **`html` 폴더**로 들어가고, 왼쪽에서 `dist/dothome_upload` **안의** `index.html`, `butterfly.html`, `css`, `js`, `assets`를 골라 끌어다 놓기 → **모두 덮어쓰기** (폴더째 올리면 주소가 바뀌니 내용물만)
5. `http://아이디.dothome.co.kr`에서 확인 (예전 화면이면 Ctrl+F5)

js·css를 고쳐서 다시 올릴 때는 `index.html`의 `?v=날짜` 버전 번호도 바꿔 두면 방문자 브라우저가 예전 파일을 쓰지 않아요. 바뀐 파일만 덮어써도 되지만, 헷갈리면 1번부터 다시 해서 통째로 덮어쓰면 됩니다.

## GitHub Pages 배포

1. 이 폴더 **안의 내용 전체**(index.html, css, js, assets, .nojekyll, README.md)를 저장소 최상위에 올립니다.
2. 저장소 **Settings → Pages → Build and deployment** 에서 Source: *Deploy from a branch*, Branch: `main` / `/ (root)` 선택 후 Save.
3. 1~2분 뒤 `https://<아이디>.github.io/<저장소이름>/` 에서 확인합니다.

모든 경로가 상대 경로라서 저장소 이름이 무엇이든 그대로 동작합니다.

## 브라우저 지원

최신 Chrome, Edge, Safari, Firefox (데스크톱·모바일). `importmap`을 쓰기 때문에 아주 오래된 브라우저에서는 3D가 나오지 않습니다.

## 관람 동작 안정화 (2026-11-04)

- LIST에서 학생을 선택하면 목록 위에 프로필이 열립니다. 닫으면 검색어·전시실 필터·스크롤·선택 카드 초점이 유지됩니다.
- Gallery 프로필의 이전/다음은 같은 전시실 안에서, LIST 프로필은 현재 검색·필터 결과 안에서 순환합니다.
- 로비/전시실 전환 도중 메뉴로 이동해도 취소된 전환이 뒤늦게 화면을 바꾸지 않습니다.
- 모바일 기본 진입은 LIST입니다. 명시적인 #lobby, #gallery-1 등의 주소는 계속 우선합니다.
- 3D 목록 썸네일은 화면 근처부터 순차 로딩하며 프로필과 별도 렌더러를 사용합니다.
- 포트폴리오 주소가 없는 학생은 ‘포트폴리오 준비 중’으로 표시합니다. 미제출 소개·주소는 임의로 작성하지 않았습니다.

### 브라우저 회귀 검사

로컬 HTTP 서버를 8765 포트에서 실행한 후 Playwright가 설치된 환경에서 `node tests/browser-smoke.cjs`를 실행합니다. 필요하면 `TEST_URL`로 서버 주소, `CHROME_PATH`로 Chrome 실행 파일 경로를 지정할 수 있습니다. 검사 대상은 목록 검색·필터, 프로필 순환과 복귀, 초점 유지, 전환 취소, 모바일 기본 진입, 동작 줄이기입니다.

## V2 시험 방 (2026-11-11)

주소 끝에 `#test-room`을 붙이면 V2의 첫 실험 공간이 열립니다. 기존 인트로·로비·GALLERY·LIST 화면은 그대로입니다.

- 기둥 1개와 3D 석고상 3개(박재연·민하도·조민영, 임시 배치)가 있는 밝은 돌 회색 방입니다.
- 스크롤을 내리면 나비의 눈높이로 곡선 길을 따라 앞으로, 올리면 같은 길로 뒤로 날아갑니다. 손을 멈추면 그 자리에 머뭅니다.
- 화면 아래 `이전 / 다음` 버튼이나 키보드 ↑ ↓ 로 멈춤 지점(첫 석고상 → 두 번째 석고상이 기둥 뒤에서 절반 보이는 곳 → 두 번째 → 세 번째 → 끝)으로 이동합니다.
- 이름표나 석고상을 누르면 비행이 멈추고 학생 소개가 열립니다. 닫으면 같은 자리와 같은 이름표로 돌아옵니다.
- 3D를 못 불러오면 `전체 학생 보기 / 다시 시도` 버튼이 나옵니다. 주소에 `?fail3d`를 붙이면 이 화면을 일부러 볼 수 있습니다 (`index.html?fail3d#test-room`).

| 바꾸고 싶은 것 | 위치 |
|---|---|
| 비행 길, 석고상·기둥 위치, 시험용 학생 | `js/test-room.js` 맨 위 `TR_LAYOUT` |
| 시험 방 글자·버튼 모양 | `css/test-room.css` |
| 학생 분야 (`field`: `uxui` / `visual` / 빈칸) | `js/data.js`의 `STUDENTS` |

스크롤 연결에는 GSAP ScrollTrigger 3.12.5(cdnjs)를 씁니다. 인터넷이 끊겨 GSAP을 못 불러와도 시험 방은 직접 스크롤 값을 계산해서 움직입니다.

검사: 8765 포트로 서버를 켠 뒤 `node tests/test-room.cjs`. 기둥 뒤 절반 보임에서 멈춤, 뒤로 가기, 키보드 이동, 소개 닫은 뒤 제자리·초점 복귀, 3D 실패 화면을 확인합니다.

## V2 전시관: UX/UI · Visual (2026-11-12)

시험 방에서 확인한 동작을 그대로 키운 진짜 전시관입니다. 방향은 스토리보드 s6 추천안 "버전 1의 밝은 돌 공간 + 버전 2의 큰 이름 글자와 선"입니다 (`docs/storyboard/README.md`).

- 주소 끝 `#hall-uxui` = GALLERY 01 UX/UI · 웹 전시관 (7명), `#hall-visual` = GALLERY 02 Visual 전시관 (4명)
- 학생은 `js/data.js`의 `field` 값으로 자동으로 나뉩니다. 분야가 빈 학생은 전시관에서 빠지고 목록에만 보입니다. 분야를 채우면 바로 전시관에 들어갑니다.
- 석고상은 왼쪽·오른쪽 번갈아 서 있고, 두 번째부터는 앞에 기둥이 있습니다. 기둥 옆을 지날 때는 스크롤이 일부러 느려져서 다음 석고상이 서서히 드러납니다.
- 석고상 앞에 멈추면 학생 이름이 큰 글자와 선으로 떠오릅니다. 멈춘 자리에서 마우스를 움직이면 시점이 ±5도 살짝 돌아갑니다 (터치·움직임 줄이기에서는 꺼짐).
- UX/UI관은 오른쪽 창으로 들어오는 조금 따뜻한 빛, Visual관은 격자 천장에서 내려오는 조금 차가운 빛입니다.
- 석고상 3D 파일은 전시관에 들어갈 때 길 순서대로 2개씩 불러옵니다. 실제 내려받는 양: UX/UI관 약 15.9MB, Visual관 약 6.3MB (목표 10~20MB 안).
- 아직 상단 메뉴의 GALLERY 01·02는 V1 화면으로 갑니다. 메뉴와 로비 연결은 다음 단계(로비)에서 바꿉니다.

| 바꾸고 싶은 것 | 위치 |
|---|---|
| 석고상 간격, 기둥 위치, 눈높이, 큰 글자가 보이는 범위, 둘러보기 각도 | `js/hall.js` 맨 위 `HALL_LAYOUT` |
| 전시관 색, 빛 색과 방향, 제목 | `js/hall.js` 맨 위 `HALL_THEMES` |
| 큰 이름 글자·선 모양 | `css/hall.css` |

검사: 8765 포트로 서버를 켠 뒤 `node tests/hall.cjs`. 두 전시관 모두에서 분야별 학생, 기둥 뒤 절반 보임 멈춤과 서서히 드러남, 큰 이름 글자, 뒤로 가기, 키보드, 소개 닫은 뒤 제자리·초점, 움직임 줄이기, 3D 실패 화면을 확인하고 석고상 파일 용량을 알려 줍니다.
