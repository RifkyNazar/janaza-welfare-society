// Real MariaDB integration, with synthetic member data only and an unconditional rollback.
import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { loadServerModule } from '../tests/load-server-module.mjs';

nextEnv.loadEnvConfig(process.cwd());
const { prisma } = await import('../lib/prisma.ts');
const marker = new Error('ROLLBACK_MEMBER_TEST');
const before = await prisma.operationalTeamMember.count();
try {
  await prisma.$transaction(async tx => {
    const permissions = { requireAdmin: async () => ({user:{id:'1'}}) };
    const api = loadServerModule('app/admin/(protected)/operational-team/actions.ts', {
      '@/lib/prisma':{prisma:tx}, '@/lib/permissions':permissions,
      '@/lib/operational-member-photo':loadServerModule('lib/operational-member-photo.ts'),
      'next/cache':{revalidatePath(){}},'next/navigation':{redirect:url=>{throw new Error('REDIRECT:'+url);}},
    });
    const route = loadServerModule('app/team-member-photos/[id]/route.ts', {'@/lib/prisma':{prisma:tx}});
    const bytes = await sharp({create:{width:20,height:24,channels:3,background:'white'}}).png().toBuffer();
    const data = new FormData();const name='Rollback-only '+randomUUID();data.set('fullName',name);data.set('photo',new File([bytes],'synthetic.png',{type:'image/png'}));
    assert.ok((await api.saveOperationalMember(null,null,{},data)).success);
    const created = await tx.operationalTeamMember.findFirstOrThrow({where:{fullName:name}});
    assert.equal((await sharp(created.photo).metadata()).format,'webp');
    const get=()=>route.GET(new Request('http://localhost/team-member-photos/'+created.id),{params:Promise.resolve({id:String(created.id)})});
    assert.equal((await get()).status,200);
    const renamed=new FormData();renamed.set('fullName',name+' edited');
    assert.ok((await api.saveOperationalMember(created.id,0,{},renamed)).success);
    const edited=await tx.operationalTeamMember.findUniqueOrThrow({where:{id:created.id}});
    assert.deepEqual(edited.photo,created.photo);assert.equal(edited.version,1);
    assert.match((await api.saveOperationalMember(created.id,0,{},renamed)).error,/changed/);
    const replacement=await sharp({create:{width:20,height:24,channels:3,background:'red'}}).png().toBuffer();
    renamed.set('photo',new File([replacement],'replacement.png',{type:'image/png'}));
    assert.ok((await api.saveOperationalMember(created.id,1,{},renamed)).success);
    const replaced=await tx.operationalTeamMember.findUniqueOrThrow({where:{id:created.id}});
    assert.notDeepEqual(replaced.photo,created.photo);assert.equal(replaced.version,2);
    assert.match((await api.deleteOperationalMember(created.id,2,{},new FormData())).error,/Confirm/);
    const confirmation=new FormData();confirmation.set('confirmation','DELETE');
    assert.match((await api.deleteOperationalMember(created.id,1,{},confirmation)).error,/changed/);
    await assert.rejects(api.deleteOperationalMember(created.id,2,{},confirmation),/REDIRECT:\/admin\/operational-team\?deleted=1/);
    assert.equal((await get()).status,404);
    console.log('PASS: real database create, encoded photo read, name-only edit, photo replacement, stale-write protection, confirmed delete, and photo 404');
    throw marker;
  }, {timeout:20000});
} catch(error) {
  if(error!==marker) { console.log('FAIL:',error.code||error.name);process.exitCode=1; }
} finally {
  const after=await prisma.operationalTeamMember.count();
  assert.equal(after,before);
  console.log('PASS: transaction rolled back; member count unchanged; no committed test rows');
  await prisma.$disconnect();
}
