/* About (#about) — 전시 소개. 왼쪽 천장에 매달린 포스터, 오른쪽 제목 · 서문(한국어/영어) · 일시 · 장소
   글과 정보는 js/data.js 맨 아래 ABOUT에서 고치면 됩니다 (빈칸이면 "확정 전"으로 보임) */
const ab = { root: $('#about'), built: false };
function abBuild() {
  if (ab.built) return; ab.built = true;
  const A = ABOUT;
  $('#ab-poster').src = A.poster;
  $('#ab-title').innerHTML = A.title.map((t) => `<span class="ln">${t}</span>`).join(' ');
  // 문단마다 줄을 <span class="ln">으로 감쌈: 큰 화면에서는 시안처럼 줄마다 끊고, 좁은 화면에서는 이어서 흐름
  $('#ab-text').innerHTML = A.text.map((p) =>
    `<p${p.en ? ' class="en" lang="en"' : ''}>${p.lines.map((l) => `<span class="ln">${l}</span>`).join(' ')}</p>`).join('');
  $('#ab-info').innerHTML = A.info.map(([k, v]) => `<div><dt>${k}</dt><dd${v ? '' : ' class="tbd"'}>${v || '확정 전'}</dd></div>`).join('');
}
function enterAbout() { abBuild(); }
