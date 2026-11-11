// 인터넷(CDN)이 막힌 곳에서 검사할 때만 씀: CDN_DIR 폴더에 npm으로 받은 three@0.160.0, gsap@3.12.5를 풀어 두면 그 파일을 대신 줌
const fs=require('fs'),path=require('path');
module.exports=async function(ctx,dir){if(!dir)return;
 await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)$/,(r)=>{const m=r.request().url().match(/three@0\.160\.0\/(.*)$/);r.fulfill({path:path.join(dir,'three-0.160.0/package',m[1]),contentType:'text/javascript',headers:{'access-control-allow-origin':'*'}})});
 await ctx.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/3\.12\.5\/(.*)$/,(r)=>{const m=r.request().url().match(/3\.12\.5\/(.*)$/);r.fulfill({path:path.join(dir,'gsap-3.12.5/package/dist',m[1]),contentType:'text/javascript'})});
 await ctx.route(/fonts\.(googleapis|gstatic)\.com/,(r)=>r.fulfill({body:'',contentType:'text/css'}));
};
