# BEYOND THE FRAME — 2026 시각디자인과 졸업전시 웹사이트

한국폴리텍대학 정수캠퍼스 시각디자인과 2026 졸업작품 온라인 전시 페이지입니다.
React 프로젝트가 아니라서 `src`·`public`·`package.json`은 없습니다. 빌드 도구 없이 **HTML + CSS + JavaScript** 로만 만든 정적 사이트라서, 이 폴더를 그대로 GitHub Pages에 올리면 바로 배포됩니다.
CSS와 JavaScript는 **화면(방)별로 파일을 나눠** 두었습니다.

## 화면 흐름 (2026-11-14 새 기획) — Intro · About · Project · Designer

메뉴는 **Intro · About · Project · Designer** 네 개예요. 다른 학교 졸업전시처럼 "작품 보기"와 "사람 보기" 두 갈래로 단순하게 바꿨어요.

```
로딩 화면(Beyond the Frame 로고 + 동그란 로딩바, 처음 한 번) → Intro (나비 → 포스터 → 빛나는 입구) → [Project] 또는 [Designer]
   About: 왼쪽 포스터 + 오른쪽 전시 소개 글과 전시 개요
   Project 방: 글자 없이 작품 썸네일만 랜덤 순서로 떠다님(공: 들어오면 가운데에서 퍼져 나오고, 카드는 늘 화면을 똑바로 보고, 끌면 부드럽게 돌고 손을 떼면 미끄러지듯 더 돎) → 스크롤하면 부드럽게 도넛으로 바뀜, 도넛은 계속 돌고 카드는 도넛을 따라 휘어진 종이처럼 보임(카드를 누르면 작품 상세: 검은 화면, 왼쪽 글 · 오른쪽 그림 14장) → 만든 사람 이름 → Designer 방
   Designer: 어두운 전시실(가운데 화살표 팻말에서 왼쪽 = UX/UI · 웹, 오른쪽 = Visual. 벽 가득 비치는 색 빛(그라데이션)이 다르고 팻말 뒤에서 흐릿하게 섞임. data.js에서 designer: false면 빠짐) + 입체 받침대 앞면에 붙은 금속 설명판(이름·분야·한 줄 소개·"포트폴리오 보기", 누르면 포트폴리오 새 탭)
```

| 화면 | 주소 끝 | HTML (`index.html` 주석) | CSS | JavaScript | 숫자 고치는 곳 |
|---|---|---|---|---|---|
| Intro (오프닝) | (없음) | `⑧ V2 오프닝` | `css/opening.css` | `js/opening.js` | 맨 위 `OPENING` |
| About | `#about` | `⑫ About` | `css/about.css` | `js/about.js` | `js/data.js` 맨 아래 `ABOUT` (글, 개요 — 빈칸은 "확정 전") |
| Project 방 | `#project` | `⑩ Project 방` | `css/project.css` | `js/project.js` | 맨 위 `PROJECT` (그림 수, 카드 움직임) |
| Designer 방 | `#designer` | `⑪ Designer 방` | `css/designer.css` | `js/designer.js` | 맨 위 `DESIGNER` (휠 빠르기) |

예전 V2 화면(3D 로비 `#lobby3d`, 전시관 `#hall-uxui`·`#hall-visual`, 목록 `#list`)은 메뉴에서 뺐어요. 파일은 남아 있어서 주소로는 볼 수 있어요. 필요 없다고 정해지면 지워도 돼요.

**아직 임시인 것 (자료를 받으면 바꾸는 곳)** — 모두 `js/data.js`의 `STUDENTS`

- 작품: 학생마다 `work: { src: '대표 그림', title: '작품 제목', desc: '작품 설명', images: ['그림1', … '그림14'] }`. 비어 있으면 회색 임시 카드와 회색 그림 칸 14개가 나와요.
- 소개글: `desc` 칸. 표찰에 세 줄까지 나와요. 표찰은 한국어만 써요.
- 포트폴리오 주소: `portfolio` 칸. 비어 있으면 표찰에 "포트폴리오 준비 중"이 나와요 (지금 김예일·송예준).
- 분야 미정 1명(조민영, Designer에서 제외): `field`를 `'uxui'` 또는 `'visual'`로 적으면 분야 버튼에서 걸러져요.
- 오프닝 영상: 힉스필드 영상을 `assets/video/intro.webm`(+ `.mp4`)로 넣고 `js/opening.js`의 `OPENING.video`에 파일 이름을 적으면 영상이 대신 나와요.

**Designer 방의 석고상**은 3D 파일을 미리 찍어 둔 사진(`assets/images/busts/01~15.webp`, 배경 투명, 합계 0.4MB)이에요. 그래서 3D 없이 빠르게 열리고 휴대폰에서도 가벼워요.

**직접 확인하는 법**: `index.html`을 더블클릭하거나, 이 폴더에서 터미널에 `python -m http.server 8765`를 치고 브라우저에서 `http://localhost:8765/`를 열어요. 검사는 `node tests/v2-flow.cjs`(Intro · About · Project · Designer 흐름), `node tests/browser-smoke.cjs`(목록 · V1), `node tests/hall.cjs`(예전 전시관)예요.

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
| 화면별 모양·동작 | 위 **화면(방) ↔ 파일** 표의 해당 파일 |

JavaScript 파일들은 모듈(`import`)이 아니라 `index.html`에서 차례로 불러오는 일반 스크립트입니다. 앞 파일에서 만든 변수·함수를 뒤 파일에서 그대로 쓰므로 `<script>` 순서를 바꾸지 마세요.

주소 끝에 `#project`, `#designer` (예전 화면: `#lobby3d`, `#hall-uxui`, `#hall-visual`, `#list`)를 붙이면 오프닝 없이 해당 화면으로 바로 갑니다. (옛 V1 화면: `#intro`, `#lobby`, `#gallery-1` ~ `#gallery-3`)

## 석고상 파일 줄이기 (2026-11-13)

석고상 15개는 `assets/models/01.glb`~`15.glb`에 있어요. 원래는 면이 50만~100만 개라 너무 무거워서, **면 10만 개**로 줄였어요 (얼굴 확대 비교로 원본과 가장 비슷한 수). 01·02·04는 원래 가벼워서 그대로 뒀어요.

| | 예전 | 지금 |
|---|---|---|
| `.glb` 15개 합계 | 약 53MB | 약 14MB |
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

## 내 컴퓨터에서 실행하기

폴더 압축을 풀고 `index.html`을 **더블클릭해서 열면** 3D 석고상까지 나옵니다 (three.js와 글꼴을 인터넷에서 불러오므로 인터넷 연결은 필요).
3D 파일은 `assets/models/*.model.js` 하나만 쓰기 때문에 GitHub Pages에서도 같은 방식으로 동작하고, 별도의 로컬 서버가 필요 없습니다.

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
