# CLAUDE.md — 작업 맥락 (다른 컴퓨터에서 이어서 작업할 때 Claude Code가 먼저 읽는 파일)

2026 한국폴리텍 시각디자인과 졸업전시 웹사이트 **BEYOND THE FRAME**. 빌드 과정 없이 `index.html` + `css/` + `js/` + `assets/`가 그대로 사이트.
자세한 구조·화면 설명·숫자 바꾸는 곳은 **README.md**에 있음 (먼저 읽기).

## 사용자와 일하는 방식
- 사용자는 디자인 전공 학생. **한국어로**, 쉬운 말로 설명. 개발 용어는 풀어서.
- 사용자는 화면 캡처에 빨간 표시를 해서 요청하는 경우가 많음. 표시가 애매하면 짐작하지 말고 짧게 물어보기.
- 바꾼 뒤에는 직접 확인할 수 있는 링크(`http://localhost:8765/#designer` 등)를 같이 알려 주기.
- **커밋·푸시는 사용자가 요청할 때만.** 커밋 메시지는 영어 요약 + 바꾼 내용 목록.
- 작업 브랜치 `claude/project-thread-1ym3nr` → GitHub에서 PR로 `main`에 병합 (gh CLI 없음 → compare 링크를 알려 줌:
  https://github.com/socutesubin-debug/2026_Polytech_Graduation_Website/compare/main...claude/project-thread-1ym3nr?expand=1)

## 명령
- `npm run setup` (처음 한 번) · `npm start` (http://localhost:8765, 캐시 끔) · `npm test` (서버를 켠 상태에서) · `npm run upload` (닷홈 업로드 폴더 → `dist/dothome_upload`)
- 검사는 `tests/v2-flow.cjs`(전체 흐름), `tests/designer.cjs`(Designer 자세히)가 핵심. 화면을 바꾸면 둘 다 통과시키고, 동작이 바뀌면 검사도 같이 고침.
  나머지 `tests/*.cjs`(hall, test-room, browser-smoke, intro-webgl)는 예전 화면용.
- 화면 확인은 Playwright로 스크린샷을 찍어서 직접 보기 (WebGL 화면은 `--use-angle=swiftshader`로 띄우면 안정적).

## 규칙
- **js·css를 고치면 `index.html`의 `?v=날짜+글자`(예: `?v=20261117b`)를 올리기.** 안 올리면 브라우저·닷홈 방문자가 예전 파일을 씀.
- 숫자 설정은 각 파일 맨 위 객체에 모아 둠: `DG`(js/designer.js), `PROJECT`(js/project.js), `SOUND`(js/sound.js), `BF_CURSOR`(js/cursor.js), `CFG`(js/intro-scroll.js). 새 숫자도 여기에 이름과 한국어 설명을 붙여 추가.
- 코드 주석·README는 **쉬운 한국어**로 (사용자가 직접 읽고 고침). 기능을 바꾸면 README의 해당 설명도 고치기.
- 학생·작품 데이터는 `js/data.js` 한 곳: `STUDENTS`(이름·분야·슬로건·포트폴리오), `WORKS`(작품 썸네일 `src`·제목·`desc`·`images`).
  - Project 카드는 썸네일(`src`)이 있는 작품만 생김. 상세는 `images`나 `desc`가 있는 작품만 열림.
  - 포트폴리오 링크 출처: `다운로드\학생 석고상 얼굴\웹 포트폴리오 링크\2026학년도 졸업작품 경진대회 출품 목록_시각디자인(261028).xlsx`. **단, 박수빈은 엑셀이 예전 주소라 `https://vinportfolio-desk-flow.vercel.app` 유지.**
- 큰 그림은 WebP로 바꿔서 넣기 (작품 상세 그림은 `assets/images/works/학생번호/01.webp…`).

## 배포 (실제 사이트)
- **닷홈 유료 호스팅**, **알드라이브(FTP)**로 `html` 폴더에 올림. `npm run upload`로 만든 폴더의 **내용물**을 올림 (자세한 순서: README "닷홈에 올리기").
- `index.html`을 더블클릭(file://)하면 Designer 석고상이 안 보이는 게 정상 (브라우저 보안). 확인은 항상 서버로.

## 석고상 (Designer)
- 사진 `assets/images/busts/NN.webp` + 가운데 학생은 잠시 뒤 3D `assets/models/NN.glb`로 바뀌어 돎. 3D 색은 사진과 같은 석고색이 되도록 화면 색을 재서 맞춘 값(`DG.turnShade/turnGlow/turnMix`).
- 만드는 법(Hyper3D Rodin → Blender `tools/bust-render.py`·`tools/bust-export.py`)은 README "학생 석고상 통일". 생성 기록 `tools/bust-generations.tsv`.
- 원본 .glb(413MB)는 저장소 밖: 원래 컴퓨터 `다운로드\학생 석고상 얼굴\3d`.

## 지금 상태 / 남은 일 (2026-11-17)
- Intro: 스크롤 인트로, 건너뛰기 버튼 없음, 안내 "길잡이 나비를 따라 스크롤 해주세요". Intro 다음부터 마우스 커서 = 금빛 나비.
- 배경음: 늘 켜진 상태로 시작, 버튼(왼쪽 아래)은 끌 때만. 브라우저 규칙상 첫 클릭·키 입력 전에는 소리가 안 날 수 있음.
- Designer: 깔끔한 벽, 가운데 벽 방향 사인, 이름표 = 이름 + 슬로건, 석고상·이름표 누르면 포트폴리오 새 탭. 위 분야 메뉴 없음('전체 보기'는 코드 `dgZone('all')`에만 있음).
- Project: 작품 상세가 있는 것(2026-11-17) = 민하도, 김준서, 김수연, 박수빈 다이소, 박호성 ALIGNEX·캣팡·KT 멤버십, 오수한 Bugs!, 조예빈, 천승현 백금당. 원본 = `다운로드\학생 석고상 얼굴\학생프로젝트\학생이름\`.
  - 박호성 폴더는 파일 이름과 내용이 한 칸씩 밀려 있었음(내용으로 짝 맞춤). KT 멤버십 설명 글은 깨져서 없음 → 받으면 `desc` 추가.
  - 새 작품 카드 썸네일(08-3, 08-4, 09-2, 14-2)은 상세 첫 그림을 16:9로 잘라 만든 임시. 박호성 bmix studio·오수한 GTA 카드는 그대로 둠(상세 없음). 천승현 FLUIDITY 썸네일은 사용자 요청으로 지움.
  - 아직 자료 없는 학생: 김예일, 김우선, 박재연, 손예진, 송예준, 하태랑, 조민영.
- 조민영: 분야 미정이라 Designer에서 빠짐(`designer: false`), 석고상 없음.
