# 포스터 느낌으로 꾸민 QR 만들기 → docs/qr/butterfly-qr-design-*.svg
# 사용: pip install segno pillow 한 뒤, 저장소 폴더에서  python tools/make-qr-design.py
# 주소를 바꾸려면 맨 아래 make(...)의 주소만 고치면 돼요. PNG는 SVG를 브라우저로 열어 캡처하거나 디자인 툴로 내보내기. 만든 뒤 꼭 폰으로 찍어서 확인
import segno, base64, io, sys
from PIL import Image
logo = Image.open('assets/images/logo.webp').convert('RGBA')
b = io.BytesIO(); logo.save(b, 'PNG'); LOGO = base64.b64encode(b.getvalue()).decode()
BUTTERFLY = '''<g fill="{c}">
<path d="M0,-6 C-6,-26 -30,-44 -46,-38 C-58,-33 -52,-12 -40,-2 C-30,6 -12,4 0,-2 Z"/>
<path d="M0,-6 C6,-26 30,-44 46,-38 C58,-33 52,-12 40,-2 C30,6 12,4 0,-2 Z"/>
<path d="M0,0 C-10,6 -30,10 -34,24 C-37,36 -24,42 -14,34 C-6,27 -2,14 0,4 Z" opacity=".85"/>
<path d="M0,0 C10,6 30,10 34,24 C37,36 24,42 14,34 C6,27 2,14 0,4 Z" opacity=".85"/>
<rect x="-2" y="-14" width="4" height="32" rx="2"/>
<path d="M-1,-13 C-4,-22 -9,-28 -13,-30" stroke="{c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M1,-13 C4,-22 9,-28 13,-30" stroke="{c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</g>'''
DOT, HOLE = 0.48, 7  # 점 크기(칸에 대한 비율), 가운데 나비 자리(칸 수). 이 값으로 QR 읽기 검사를 통과함
def make(url, name, label):
    q = segno.make(url, error='h'); M = [list(r) for r in q.matrix]; n = len(M)
    W, H = 1000, 1340; qs = 600; m = qs/n; ox = (W-qs)/2; oy = 170; pad = 4*m
    ink, gold = '#33241a', '#a77d43'
    cz = HOLE; c0 = (n-cz)//2
    def finder(r, c): return r < 7 and c < 7 or r < 7 and c >= n-7 or r >= n-7 and c < 7
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
      '<defs><radialGradient id="g" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#f8f0e2"/><stop offset="1" stop-color="#e6d6bb"/></radialGradient></defs>',
      f'<rect width="{W}" height="{H}" fill="url(#g)"/>',
      f'<rect x="28" y="28" width="{W-56}" height="{H-56}" fill="none" stroke="{gold}" stroke-width="2"/>',
      f'<rect x="40" y="40" width="{W-80}" height="{H-80}" fill="none" stroke="{gold}" stroke-width=".8" opacity=".7"/>',
      f'<text x="{W/2}" y="104" text-anchor="middle" font-family="Josefin Sans, Helvetica, Arial, sans-serif" font-size="22" letter-spacing="8" fill="{gold}">SCAN · MEET THE BUTTERFLY</text>',
      f'<rect x="{ox-pad:.1f}" y="{oy-pad:.1f}" width="{qs+2*pad:.1f}" height="{qs+2*pad:.1f}" rx="22" fill="#fdfaf3" stroke="{gold}" stroke-width="1.2"/>']
    for r in range(n):
        for c in range(n):
            if not M[r][c] or finder(r, c): continue
            if cz and c0 <= r < c0+cz and c0 <= c < c0+cz: continue
            out.append(f'<circle cx="{ox+(c+.5)*m:.2f}" cy="{oy+(r+.5)*m:.2f}" r="{m*DOT:.2f}" fill="{ink}"/>')
    for (r, c) in [(0, 0), (0, n-7), (n-7, 0)]:
        x, y = ox+c*m, oy+r*m
        out.append(f'<rect x="{x+m/2:.2f}" y="{y+m/2:.2f}" width="{6*m:.2f}" height="{6*m:.2f}" rx="{1.6*m:.2f}" fill="none" stroke="{ink}" stroke-width="{m:.2f}"/>')
        out.append(f'<rect x="{x+2*m:.2f}" y="{y+2*m:.2f}" width="{3*m:.2f}" height="{3*m:.2f}" rx="{.8*m:.2f}" fill="{ink}"/>')
    if cz:
        cx, cy = ox+(c0+cz/2)*m, oy+(c0+cz/2)*m
        out.append(f'<g transform="translate({cx:.1f},{cy+2:.1f}) scale({cz*m/112:.3f})">' + BUTTERFLY.format(c=gold) + '</g>')
    ly = oy+qs+pad+50
    out.append(f'<image x="{W/2-150}" y="{ly}" width="300" height="200" href="data:image/png;base64,{LOGO}" xlink:href="data:image/png;base64,{LOGO}"/>')
    out.append(f'<text x="{W/2}" y="{ly+262}" text-anchor="middle" font-family="Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif" font-size="30" fill="{ink}">QR을 찍고 나비를 만나 보세요</text>')
    out.append(f'<text x="{W/2}" y="{ly+306}" text-anchor="middle" font-family="Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif" font-size="20" fill="{gold}" letter-spacing="2">{label}</text>')
    out.append('</svg>')
    open('docs/qr/'+name + '.svg', 'w').write('\n'.join(out))
make('https://socutesubin-debug.github.io/2026_Polytech_Graduation_Website/butterfly.html', 'butterfly-qr-design-github', 'AR · 2026 GRADUATION EXHIBITION')
make('http://polyjungsudesign.com/butterfly.html', 'butterfly-qr-design-dothome', 'AR · 2026 GRADUATION EXHIBITION')
