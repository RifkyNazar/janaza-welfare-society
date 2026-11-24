import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { loadServerModule } from './load-server-module.mjs';

const image = await sharp({create:{width:800,height:1000,channels:3,background:'white'}}).png().toBuffer();
const photo = () => new File([image], '../../synthetic.png', {type:'image/png'});
const prepare = loadServerModule('lib/operational-member-photo.ts');
const form = (name='Synthetic member', file=photo()) => { const data=new FormData(); data.set('fullName',name); if(file)data.set('photo',file); return data; };
const redirect = url => {throw new Error('REDIRECT:'+url);};
function actions(model, permissions={requireAdmin:async()=>({user:{id:'1'}})}) {
  return loadServerModule('app/admin/(protected)/operational-team/actions.ts', {
    '@/lib/permissions': permissions, '@/lib/prisma':{prisma:{operationalTeamMember:model}},
    '@/lib/operational-member-photo':prepare,'next/cache':{revalidatePath(){}},'next/navigation':{redirect},
  });
}
const Image = ({src,alt,loading}) => React.createElement('img',{src,alt,loading});
const language = {T:({text})=>text, useTranslation:()=>({t:text=>text})};

test('member photos reject missing/oversized/unsupported/spoofed/malformed uploads and normalize valid bytes',async()=>{
  for(const file of [new File([],'empty.png',{type:'image/png'}),new File([Buffer.alloc(5*1024*1024+1)],'large.png',{type:'image/png'}),new File([image],'bad.svg',{type:'image/svg+xml'}),new File(['not png'],'bad.png',{type:'image/png'}),new File([image],'spoof.jpg',{type:'image/jpeg'})])await assert.rejects(prepare.prepareMemberPhoto(file));
  const bytes=await prepare.prepareMemberPhoto(photo());const meta=await sharp(bytes).metadata();
  assert.equal(meta.format,'webp');assert.equal(meta.width,600);assert.equal(meta.height,750);assert.equal(meta.exif,undefined);
});

test('all member mutations authorize before reading/writing records or preparing photos',async()=>{
  for(const [role,status] of [['ANONYMOUS',''],['EMPLOYEE','APPROVED'],['SUPERVISOR','APPROVED'],['ADMIN','PENDING'],['ADMIN','DISABLED']]){
    const permissions=loadServerModule('lib/permissions.ts',{'@/auth':{auth:async()=>role==='ANONYMOUS'?null:({user:{id:'9'}})},'@/lib/prisma':{prisma:{user:{findUnique:async()=>({role,status})}}},'next/navigation':{redirect}});
    const api=actions(new Proxy({}, {get(){throw new Error('Unauthorized member query');}}),permissions);
    const destination = { EMPLOYEE: '/employee', SUPERVISOR: '/supervisor' }[role] ?? '/admin/login';
    const denied = { message: `REDIRECT:${destination}` };
    await assert.rejects(api.saveOperationalMember(null,null,{},form()),denied);
    await assert.rejects(api.saveOperationalMember(1,0,{},form()),denied);
    await assert.rejects(api.deleteOperationalMember(1,0,{},new FormData()),denied);
  }
});

test('member save validates two required values and ignores submitted employee/private fields',async()=>{
  let data;
  const api=actions({create:async args=>{data=args.data;return{id:1};}});
  assert.ok((await api.saveOperationalMember(null,null,{},form(''))).error);
  assert.ok((await api.saveOperationalMember(null,null,{},form('Valid',null))).error);
  assert.ok((await api.saveOperationalMember(null,null,{},form('a'.repeat(151)))).error);
  const input=form();for(const key of ['position','role','phone','email','description'])input.set(key,'MUST_NOT_BE_STORED');
  assert.deepEqual(await api.saveOperationalMember(null,null,{},input), { success: 'Member added.', addedMember: { id: 1, fullName: input.get('fullName') } });
  assert.deepEqual(Object.keys(data).sort(),['fullName','photo']);assert.ok(data.photo instanceof Uint8Array);
});

test('member name edits retain required stored photo; replacements update bytes; stale writes fail',async()=>{
  let args;
  const api=actions({updateMany:async input=>{args=input;return{count:input.where.version===2?1:0};}});
  assert.ok((await api.saveOperationalMember(7,2,{},form('Edited',null))).success);
  assert.deepEqual(args.where,{id:7,version:2});assert.equal(args.data.photo,undefined);assert.deepEqual(args.data.version,{increment:1});
  assert.ok((await api.saveOperationalMember(7,2,{},form('Edited'))).success);assert.ok(args.data.photo instanceof Uint8Array);
  assert.match((await api.saveOperationalMember(7,1,{},form('Stale',null))).error,/changed/);
});

test('deletion requires explicit confirmation and current version; only the member table is touched',async()=>{
  let deletes=0;const api=actions({deleteMany:async({where})=>{deletes++;assert.equal(where.id,7);return{count:where.version===2?1:0};}});
  assert.match((await api.deleteOperationalMember(7,2,{},new FormData())).error,/Confirm/);assert.equal(deletes,0);
  const data=new FormData();data.set('confirmation','DELETE');
  assert.match((await api.deleteOperationalMember(7,1,{},data)).error,/changed/);
  await assert.rejects(api.deleteOperationalMember(7,2,{},data),/REDIRECT:\/admin\/operational-team\?deleted=1/);
});

test('admin editor exposes exactly fullName and photo, with existing photo satisfying required edit state',()=>{
  const {OperationalMemberForm,DeleteOperationalMember}=loadServerModule('components/admin/operational-member-form.tsx',{
    "@/components/use-form-submission": { useFormSubmission: () => ({ showFeedback: true, onSubmit() {} }) },
    react:{...React,useActionState:()=>[{},()=>{},false]},'next/image':Image,
    'next/link':({href,children})=>React.createElement('a',{href},children),
    '@/components/public-language':{ T:({text})=>text, useTranslation:()=>({ t:text=>text }) },
    '@/lib/image-upload-limits':loadServerModule('lib/image-upload-limits.ts'),
    '@/app/admin/(protected)/operational-team/actions':{saveOperationalMember(){},deleteOperationalMember(){}},
  });
  for(const member of [undefined,{id:7,fullName:'Synthetic',version:0}]){
    const html=renderToStaticMarkup(React.createElement(OperationalMemberForm,{member}));
    const inputs=[...html.matchAll(/<input\b[^>]*>/g)].map(m=>m[0]);assert.equal(inputs.length,2);
    assert.ok(inputs[0].includes('name="fullName"')&&inputs[0].includes('required'));
    assert.ok(inputs[1].includes('name="photo"'));assert.equal(inputs[1].includes('required'),!member);
  }
  const previousWindow=globalThis.window;let prevented=false;
  globalThis.window={confirm:()=>false};
  try{DeleteOperationalMember({member:{id:7,fullName:'Synthetic',version:0}}).props.onSubmit({preventDefault(){prevented=true;}});assert.equal(prevented,true);}
  finally{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;}
});

test('public grid supports 60 compact entries and renders only photos/names despite extra input properties',()=>{
  const {OperationalMembersGrid}=loadServerModule('components/operational-members-grid.tsx',{'next/image':Image});
  const members=Array.from({length:60},(_,id)=>({id:id+1,fullName:'Synthetic '+id,position:'PRIVATE_POSITION',phone:'PRIVATE_PHONE',email:'PRIVATE_EMAIL',description:'PRIVATE_DESCRIPTION'}));
  const html=renderToStaticMarkup(React.createElement(OperationalMembersGrid,{members}));
  assert.equal((html.match(/<article/g)||[]).length,60);assert.equal((html.match(/<img/g)||[]).length,60);
  assert.ok(html.includes('grid-cols-3'));assert.equal((html.match(/loading="lazy"/g)||[]).length,60);assert.ok(!html.includes('PRIVATE_'));
});

test('public team page queries separate paginated members and leaves leadership separate',async()=>{
  const {default:Team}=loadServerModule('app/(public)/team/page.tsx',{
    '@/components/public-language':language,'next/link':({href,children})=>React.createElement('a',{href},children),
    '@/components/leadership-card':{LeadershipCard:()=>null},'@/components/page-hero':{PageHero:()=>null},
    '@/lib/leadership-team':{leadershipTeam:[]},'@/components/operational-members-grid':{OperationalMembersGrid:()=>null},
    '@/lib/member-pagination':loadServerModule('lib/member-pagination.ts'),
    '@/lib/prisma':{prisma:{operationalTeamMember:{count:async()=>65,findMany:async query=>{assert.deepEqual(query.select,{id:true,fullName:true});assert.equal(query.take,60);assert.equal(query.skip,60);return[{id:65,fullName:'Synthetic'}];}}}},
  });
  const html=renderToStaticMarkup(await Team({searchParams:Promise.resolve({membersPage:'2'})}));
  assert.ok(html.includes('id="administration-team"'));assert.ok(html.includes('id="operational-team"'));assert.ok(html.includes('membersPage=1'));
});

test('member-photo endpoint cannot access employee/task images and deletion returns 404',async()=>{
  let exists=true,queries=0;const bytes=await prepare.prepareMemberPhoto(photo());
  const route=loadServerModule('app/team-member-photos/[id]/route.ts',{'@/lib/prisma':{prisma:{operationalTeamMember:{findUnique:async({where,select})=>{queries++;assert.deepEqual(where,{id:7});assert.deepEqual(select,{photo:true});return exists?{photo:bytes}:null;}}}}});
  const get=id=>route.GET(new Request('http://localhost/team-member-photos/'+id),{params:Promise.resolve({id})});
  for(const id of ['0','-1','../task-photos','9007199254740992'])assert.equal((await get(id)).status,404);
  assert.equal(queries,0);const response=await get('7');assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');assert.equal(response.headers.get('cache-control'),'no-store');
  exists=false;assert.equal((await get('7')).status,404);
});
