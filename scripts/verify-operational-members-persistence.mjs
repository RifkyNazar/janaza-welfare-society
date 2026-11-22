// Creates one explicitly disposable member, verifies committed persistence/public
// delivery, then deletes only that exact member. No existing record is modified.
import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadServerModule } from '../tests/load-server-module.mjs';

nextEnv.loadEnvConfig(process.cwd());
const { prisma } = await import('../lib/prisma.ts');
const { PrismaClient } = await import('../generated/prisma/client.ts');
const { PrismaMariaDb } = await import('@prisma/adapter-mariadb');
const base='http://localhost:3000';
const label='JWS QA TEST '+randomUUID();
let fixtureId=null;
const before=await prisma.operationalTeamMember.count();
const admin=await prisma.user.findFirst({where:{role:'ADMIN',status:'APPROVED'},select:{id:true}});
if(!admin){await prisma.$disconnect();throw new Error('No approved admin available for authorization verification');}
const permissions=loadServerModule('lib/permissions.ts',{
  '@/auth':{auth:async()=>({user:{id:String(admin.id)}})},
  '@/lib/prisma':{prisma},'next/navigation':{redirect:url=>{throw new Error('REDIRECT:'+url);}},
});
const photo=loadServerModule('lib/operational-member-photo.ts');
const actions=loadServerModule('app/admin/(protected)/operational-team/actions.ts',{
  '@/lib/prisma':{prisma},'@/lib/permissions':permissions,'@/lib/operational-member-photo':photo,
  'next/cache':{revalidatePath(){}},'next/navigation':{redirect:url=>{throw new Error('REDIRECT:'+url);}},
});
const newConnection=()=>new PrismaClient({adapter:new PrismaMariaDb(process.env.DATABASE_URL)});
const input=(name,file)=>{const data=new FormData();data.set('fullName',name);if(file)data.set('photo',file);return data;};
async function checkPublic(name,expectedPhoto){
  const preceding=await prisma.operationalTeamMember.count({where:{OR:[{fullName:{lt:name}},{fullName:name,id:{lt:fixtureId}}]}});
  const response=await fetch(base+'/team?membersPage='+(Math.floor(preceding/60)+1),{headers:{cookie:'jws-language=en'}});
  const html=await response.text();assert.equal(response.status,200);assert.ok(html.includes(name));assert.ok(html.includes('/team-member-photos/'+fixtureId));
  const image=await fetch(base+'/team-member-photos/'+fixtureId);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/webp');assert.deepEqual(Buffer.from(await image.arrayBuffer()),Buffer.from(expectedPhoto));
}
try{
  const white=await sharp({create:{width:24,height:30,channels:3,background:'white'}}).png().toBuffer();
  const file=new File([white],'synthetic.png',{type:'image/png'});
  assert.equal((await actions.saveOperationalMember(null,null,{},input(label,file))).success,'Member added.');
  const created=await prisma.operationalTeamMember.findFirstOrThrow({where:{fullName:label}});fixtureId=created.id;
  const separate=newConnection();
  try{const saved=await separate.operationalTeamMember.findUniqueOrThrow({where:{id:fixtureId}});assert.equal(saved.fullName,label);assert.deepEqual(saved.photo,created.photo);}finally{await separate.$disconnect();}
  console.log('PASS: approved-admin guard, committed name/photo-only create, persistence on a separate database connection');
  const page=loadServerModule('app/admin/(protected)/operational-team/page.tsx',{
    '@/lib/prisma':{prisma},'@/lib/permissions':permissions,'@/lib/member-pagination':loadServerModule('lib/member-pagination.ts'),
    'next/link':({href,children,...props})=>React.createElement('a',{href,...props},children),
    'next/image':({src,alt})=>React.createElement('img',{src,alt}),
    '@/components/admin/operational-member-form':{OperationalMemberForm:()=>null,DeleteOperationalMember:()=>null},
  }).default;
  const preceding=await prisma.operationalTeamMember.count({where:{fullName:{lt:label}}});
  assert.ok(renderToStaticMarkup(await page({searchParams:Promise.resolve({page:String(Math.floor(preceding/24)+1)})})).includes(label));
  console.log('PASS: actual admin page count/list queries render through the real approved-account guard (session context supplied by test)');
  await checkPublic(label,created.photo);console.log('PASS: committed member name/photo delivered by the running public website');
  const renamed=label+' edited';assert.ok((await actions.saveOperationalMember(fixtureId,0,{},input(renamed))).success);
  const verifyEdit=newConnection();
  try{const row=await verifyEdit.operationalTeamMember.findUniqueOrThrow({where:{id:fixtureId}});assert.equal(row.fullName,renamed);assert.deepEqual(row.photo,created.photo);}finally{await verifyEdit.$disconnect();}
  const red=await sharp({create:{width:24,height:30,channels:3,background:'red'}}).png().toBuffer();
  assert.ok((await actions.saveOperationalMember(fixtureId,1,{},input(renamed,new File([red],'replacement.png',{type:'image/png'})))).success);
  const changed=await prisma.operationalTeamMember.findUniqueOrThrow({where:{id:fixtureId}});assert.notDeepEqual(changed.photo,created.photo);await checkPublic(renamed,changed.photo);
  console.log('PASS: committed edit retains photo; replacement changes bytes and is visible publicly');
  const confirmation=new FormData();confirmation.set('confirmation','DELETE');
  await assert.rejects(actions.deleteOperationalMember(fixtureId,changed.version,{},confirmation),/REDIRECT:\/admin\/operational-team\?deleted=1/);
  assert.equal(await prisma.operationalTeamMember.findUnique({where:{id:fixtureId}}),null);
  assert.equal((await fetch(base+'/team-member-photos/'+fixtureId)).status,404);
  const publicPage=await (await fetch(base+'/team')).text();assert.ok(!publicPage.includes(renamed));
  console.log('PASS: confirmed deletion persists and public photo returns 404');
}finally{
  // Cleanup is restricted to the ID and unique label created by this invocation.
  if(fixtureId!==null)await prisma.operationalTeamMember.deleteMany({where:{id:fixtureId,fullName:{in:[label,label+' edited']}}});
  else await prisma.operationalTeamMember.deleteMany({where:{fullName:label}});
  assert.equal(await prisma.operationalTeamMember.count(),before);
  await prisma.$disconnect();
  console.log('PASS: disposable fixture removed; original member count restored');
}
