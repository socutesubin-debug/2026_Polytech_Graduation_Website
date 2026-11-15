/* About (#about) — 전시 소개. 왼쪽 포스터, 오른쪽 전시 서문과 전시 개요
   글과 정보는 js/data.js 맨 아래 ABOUT에서 고치면 됩니다 (빈칸이면 "확정 전"으로 보임) */
const ab = { root: $('#about'), built: false };
function abBuild() {
  if (ab.built) return; ab.built = true;
  const A = ABOUT;
  $('#ab-poster').src = A.poster;
  $('#ab-title').textContent = A.title;
  $('#ab-sub').textContent = A.sub;
  $('#ab-text').innerHTML = A.text.map((t) => `<p>${t}</p>`).join('') + (A.sign ? `<p class="ab-sign">${A.sign}</p>` : '');
  $('#ab-info').innerHTML = A.info.map(([k, v]) => `<div><dt>${k}</dt><dd${v ? '' : ' class="tbd"'}>${v || '확정 전'}</dd></div>`).join('');
}
function enterAbout() { abBuild(); }
$$('#about [data-to]').forEach((b) => b.addEventListener('click', () => go(b.dataset.to)));
