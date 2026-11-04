# BEYOND THE FRAME — 2026 시각디자인과 졸업전시 웹사이트

한국폴리텍대학 정수캠퍼스 시각디자인과 2026 졸업작품 온라인 전시 페이지입니다.
React 프로젝트가 아니라서 `src`·`public`·`package.json`은 없습니다. 빌드 도구 없이 **HTML + CSS + JavaScript** 로만 만든 정적 사이트라서, 이 폴더를 그대로 GitHub Pages에 올리면 바로 배포됩니다.
CSS와 JavaScript는 **화면(방)별로 파일을 나눠** 두었습니다.

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

주소 끝에 `#lobby`, `#list`, `#gallery-1` ~ `#gallery-3` 를 붙이면 인트로 없이 해당 화면으로 바로 갑니다.

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
