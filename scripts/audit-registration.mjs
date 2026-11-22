import nextEnv from '@next/env';
import { randomUUID } from 'node:crypto';
import { loadServerModule } from '../tests/load-server-module.mjs';

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const { prisma } = await import('../lib/prisma.ts');
  const { Prisma } = await import('../generated/prisma/client.ts');
  const existing = await prisma.user.findFirst({select:{email:true, employeeProfile:{select:{employeeCode:true,phone:true}}},where:{employeeProfile:{isNot:null}}});
  const before = await Promise.all([prisma.user.count(), prisma.employeeProfile.count(), prisma.serviceRequest.count()]);
  const marker = new Error('AUDIT_ROLLBACK');
  try {
    for (const scenario of ['unique', 'duplicate-email', 'duplicate-code', 'duplicate-phone', 'oversized-duty', 'oversized-request-note']) {
      if (!existing && scenario !== 'unique') { console.log(scenario, 'NOT VERIFIED: no existing profile'); continue; }
      let outcome = '';
      try {
        await prisma.$transaction(async tx => {
          if (scenario === 'oversized-duty' || scenario === 'oversized-request-note') {
            try {
              if (scenario === 'oversized-duty') {
                const row=await tx.user.create({data:{email:`audit-${randomUUID()}@example.invalid`,passwordHash:'non-login audit transaction',employeeProfile:{create:{employeeCode:`AUDIT_${randomUUID().replaceAll('-','')}`,fullName:'Audit',phone:'0770000000',position:'Audit',duty:'x'.repeat(192)}}},select:{employeeProfile:{select:{duty:true}}}});
                outcome=`ACCEPTED_INPUT_192_STORED_${row.employeeProfile.duty.length}`;
              } else {
                const row=await tx.serviceRequest.create({data:{requestCode:`AUDIT_${randomUUID()}`,requesterName:'Audit',mobileNumber:'0770000000',serviceType:'Audit',requiredDate:new Date(),placeType:'OTHER',address:'Audit',area:'Audit',note:'x'.repeat(192)},select:{note:true}});
                outcome=`ACCEPTED_INPUT_192_STORED_${row.note.length}`;
              }
            } catch(e) { outcome=`DATABASE_REJECTED_${e.code || e.name}`; }
            throw marker;
          }
          const actions = loadServerModule('app/actions/auth.ts', {
            'next-auth': {AuthError:class extends Error{}},
            'next/navigation': {redirect:()=>{outcome='SUCCESS_REDIRECT';throw marker;}},
            '@/generated/prisma/client': {Prisma},
            '@/auth': {signIn:async()=>{}},
            '@/lib/prisma': {prisma:{$transaction:async callback => callback({user:{create:async args=>{
              try { return await tx.user.create(args); }
              catch(e) { console.log(scenario, 'database error', e.code); throw e; }
            }}})}},
            '@/lib/notifications': {notifyAdminsOfEmployeeRegistration:async()=>{}},
            '@/lib/rate-limit': {consumeRateLimit:async()=>({allowed:true})},
          });
          const nonce=randomUUID().replaceAll('-','');
          const data=new FormData();
          for (const [key,value] of Object.entries({fullName:'Audit rollback only', employeeCode:scenario==='duplicate-code'?existing.employeeProfile.employeeCode:`AUDIT_${nonce}`, position:'Audit',phone:scenario==='duplicate-phone'?existing.employeeProfile.phone:'0770000000', email:scenario==='duplicate-email'?existing.email:`audit-${nonce}@example.invalid`,password:`Audit-${nonce}`,confirmPassword:`Audit-${nonce}`,confirmation:'on'})) data.set(key,value);
          const result=await actions.registerEmployee({},data);
          outcome=result.error || 'UNEXPECTED';
          throw marker;
        });
      } catch(e) { if(e!==marker) { console.log(scenario,'UNEXPECTED ERROR',e.code || e.name); continue; } }
      console.log(scenario,outcome,'(transaction rolled back; notifications disabled)');
    }
    const after=await Promise.all([prisma.user.count(),prisma.employeeProfile.count(),prisma.serviceRequest.count()]);
    console.log('row counts unchanged',JSON.stringify(before)===JSON.stringify(after));
  } finally { await prisma.$disconnect(); }
}
main().catch(e=>{console.log('AUDIT FAILED',e.code||e.name);process.exitCode=1;});

