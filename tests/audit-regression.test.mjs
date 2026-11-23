import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadServerModule } from './load-server-module.mjs';

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
