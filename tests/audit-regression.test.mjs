import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare } from 'bcryptjs';
import { loadServerModule } from './load-server-module.mjs';

const valid = {fullName:'Synthetic audit', employeeCode:'AUDIT_TEST',position:'Audit',phone:'0770000000',email:'audit@example.invalid',password:'Synthetic-password-123',confirmPassword:'Synthetic-password-123',confirmation:'on'};
function form(values={}) { const data=new FormData();for(const [k,v] of Object.entries({...valid,...values}))if(v!==null)data.set(k,v);return data; }
function registration(create) {
  class KnownError extends Error {code='P2002';}
  return {KnownError, actions:loadServerModule('app/actions/auth.ts',{
    'next-auth':{AuthError:class extends Error{}},'next/navigation':{redirect:()=>{throw new Error('AUDIT_REDIRECT');}},
    '@/generated/prisma/client':{Prisma:{PrismaClientKnownRequestError:KnownError}},'@/auth':{signIn:async()=>{}},
    '@/lib/prisma':{prisma:{$transaction:async callback=>callback({user:{create}})}},
    '@/lib/notifications':{notifyAdminsOfEmployeeRegistration:async()=>{}},'@/lib/rate-limit':{consumeRateLimit:async()=>({allowed:true})},
  })};
}
test('registration rejects missing fields, invalid email/phone/ID, short and mismatching passwords before writes',async()=>{
  const {actions}=registration(()=>{throw new Error('unexpected write');});
  for(const values of [{fullName:''},{email:'invalid'},{phone:'abc'},{employeeCode:'!'},{password:'short'},{confirmPassword:'different-password'}])assert.ok((await actions.registerEmployee({},form(values))).error);
});
test('registration unique constraint returns reported error without password values',async()=>{
  let failure;const {actions,KnownError}=registration(()=>{throw failure;});failure=new KnownError();
  const result=await actions.registerEmployee({},form());assert.equal(result.error,'Unable to complete registration with those details.');assert.equal(result.values.password,undefined);assert.equal(result.values.confirmPassword,undefined);
});
test('registration hashes at cost 12 and creates private pending employee without trusting submitted role',async()=>{
  const {actions}=registration(async({data})=>{assert.equal(data.role,'EMPLOYEE');assert.equal(data.status,'PENDING');assert.equal(data.employeeProfile.create.isPublicProfile,false);assert.match(data.passwordHash,/^\$2[aby]\$12\$/);assert.ok(await compare(valid.password,data.passwordHash));return {id:1,email:valid.email,createdAt:new Date()};});
  await assert.rejects(actions.registerEmployee({},form({role:'ADMIN',status:'APPROVED'})),/AUDIT_REDIRECT/);
});
test('server registration rejects omitted confirmation',async()=>{
  const {actions}=registration(async()=>({id:1,email:valid.email,createdAt:new Date()}));
  assert.ok((await actions.registerEmployee({},form({confirmation:null}))).error);
});
test('password confirmation compares exact values',async()=>{
  const {actions}=registration(async()=>({id:1,email:valid.email,createdAt:new Date()}));
  assert.ok((await actions.registerEmployee({},form({confirmPassword:` ${valid.password} `}))).error);
});
test('registration rejects passwords beyond the bcrypt byte limit',async()=>{
  const password = 'é'.repeat(37); const {actions}=registration(()=>{throw new Error('unexpected write');}); assert.ok((await actions.registerEmployee({},form({password,confirmPassword:password}))).error);
});
test('disabled account is rejected even when JWT session says approved',async()=>{
  const actions=loadServerModule('lib/permissions.ts',{'@/auth':{auth:async()=>({user:{id:'1',role:'ADMIN',status:'APPROVED'}})},'@/lib/prisma':{prisma:{user:{findUnique:async()=>({role:'ADMIN',status:'DISABLED'})}}},'next/navigation':{redirect:()=>{throw new Error('DENIED');}}});
  await assert.rejects(actions.requireAdmin(),/DENIED/);
});
test('private task photo query scopes employee identity; another owner yields 404 without file read',async()=>{
  const route=loadServerModule('app/task-photos/[id]/route.ts',{'@/auth':{auth:async()=>({user:{id:'1'}})},'@/lib/prisma':{prisma:{user:{findUnique:async()=>({role:'EMPLOYEE',status:'APPROVED',employeeProfile:{id:7}})},taskPhoto:{findFirst:async({where})=>{assert.equal(where.taskAssignment.is.employeeId,7);return null;}}}},'@/lib/task-photo-storage':{readStoredTaskPhoto:()=>{throw new Error('private read');}}});
  assert.equal((await route.GET(new Request('http://localhost/task-photos/99'),{params:Promise.resolve({id:'99'})})).status,404);
});
test('supervisors and employees without profiles cannot query private task photos', async () => {
  for (const role of ['SUPERVISOR', 'EMPLOYEE']) {
    const route = loadServerModule('app/task-photos/[id]/route.ts', {
      '@/auth': { auth: async () => ({ user: { id: '1' } }) },
      '@/lib/prisma': { prisma: {
        user: { findUnique: async () => ({ role, status: 'APPROVED', employeeProfile: null }) },
        taskPhoto: { findFirst: async () => { throw new Error('unexpected private query'); } },
      } },
      '@/lib/task-photo-storage': {},
    });
    const response = await route.GET(new Request('http://localhost/task-photos/99'), {
      params: Promise.resolve({ id: '99' }),
    });
    assert.equal(response.status, 404);
  }
});
test('push subscription rejects unapproved provider endpoints',async()=>{
  let stored=false;const endpoint=loadServerModule('lib/push-endpoint.ts');const route=loadServerModule('app/api/push-subscriptions/route.ts',{'@/auth':{auth:async()=>({user:{id:'1'}})},'@/generated/prisma/client':{Prisma:{}},'@/lib/push-endpoint':endpoint,'@/lib/prisma':{prisma:{user:{findFirst:async()=>({id:1})},staffPushSubscription:{updateMany:async()=>({count:0}),create:async()=>{stored=true;}}}}});
  const request=new Request('http://localhost/api/push-subscriptions',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:JSON.stringify({endpoint:'https://127.0.0.1/push',keys:{p256dh:'test',auth:'test'}})});
  assert.equal((await route.POST(request)).status,400);assert.equal(stored,false); assert.ok(endpoint.isAllowedPushEndpoint('https://fcm.googleapis.com/push'));
});
