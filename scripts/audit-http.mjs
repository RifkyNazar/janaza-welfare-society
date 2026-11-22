import fs from 'node:fs';
const base=process.env.JWS_QA_BASE_URL ?? 'http://localhost:3100';
const manifest=JSON.parse(fs.readFileSync('.next/server/app-paths-manifest.json','utf8'));
const routes=[...new Set(Object.keys(manifest).filter(p=>p.endsWith('/page')).map(p=>p.replace(/\([^/]+\)\//g,'').replace(/\/page$/,'')||'/'))].filter(p=>!p.includes('[')&&!p.startsWith('/_'));
const links=new Set();
let failures=0;
for(const route of routes){
  const response=await fetch(base+route,{redirect:'manual'});
  const html=await response.text();
  const protectedRoute=/^\/(admin|employee|supervisor)(\/|$)/.test(route)&&route!='/admin/login';
  const expected=protectedRoute?[302,303,307,308]:[200];
  if(!expected.includes(response.status)) failures++;
  console.log(route,response.status,response.headers.get('location')?.split('?')[0]||'',expected.includes(response.status)?'PASS':'FAIL');
  if(!protectedRoute)for(const match of html.matchAll(/href="(\/[^"?#]*)[^\"]*"/g))if(!match[1].startsWith('/_next/'))links.add(match[1]);
}
for(const link of links){if(routes.includes(link))continue; const response=await fetch(base+link,{redirect:'manual'});if(response.status>=400)failures++;console.log('discovered link',link,response.status);}
for(const route of ['/task-photos/1','/donation-receipts/1','/admin-media/hero/1','/public-media/invalid/1','/operation-photos/invalid','/operations/invalid','/advertisements/invalid','/vehicle-images/invalid','/profile-photos/invalid']){const r=await fetch(base+route,{redirect:'manual'});console.log('boundary',route,r.status);if(r.status>=500)failures++;}
for(const origin of ['https://example.invalid',base]){const r=await fetch(base+'/api/push-subscriptions',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}',redirect:'manual'});console.log('push anonymous',origin===base?'same-origin':'cross-origin',r.status);}
console.log('route count',routes.length,'link count',links.size,'unexpected results',failures);
process.exitCode=failures?1:0;
