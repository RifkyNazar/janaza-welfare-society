import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadServerModule } from './load-server-module.mjs';

test('Prisma HMR cache replaces pre-generation clients, reuses current clients and refreshes on generation/connection changes', async () => {
  const keys=['prisma','prismaConstructor','prismaDatabaseUrl'];
  const previous=keys.map(key=>Object.getOwnPropertyDescriptor(globalThis,key));
  const environment={DATABASE_URL:process.env.DATABASE_URL,NODE_ENV:process.env.NODE_ENV};
  let closed=0,constructed=0;
  class CurrentClient {
    operationalTeamMember={count:async()=>0};
    constructor({adapter}) {assert.ok(adapter);constructed++;}
    async $disconnect(){closed++;}
  }
  class GeneratedAgain extends CurrentClient {}
  class Adapter {constructor(url){assert.equal(url,process.env.DATABASE_URL);}}
  const load=Client=>loadServerModule('lib/prisma.ts',{'@prisma/adapter-mariadb':{PrismaMariaDb:Adapter},'@/generated/prisma/client':{PrismaClient:Client}}).prisma;
  try {
    process.env.DATABASE_URL='mysql://synthetic:synthetic@localhost/test_only';process.env.NODE_ENV='development';
    // Same shape as the actual pre-model singleton: the new delegate is absent.
    const legacy={$disconnect:async()=>{closed++;}};
    globalThis.prisma=legacy;delete globalThis.prismaConstructor;delete globalThis.prismaDatabaseUrl;
    assert.throws(()=>legacy.operationalTeamMember.count(),/Cannot read properties of undefined/);
    const first=load(CurrentClient);assert.notEqual(first,legacy);assert.equal(await first.operationalTeamMember.count(),0);
    assert.equal(load(CurrentClient),first);assert.equal(constructed,1);assert.equal(closed,1);
    const regenerated=load(GeneratedAgain);assert.notEqual(regenerated,first);assert.equal(closed,2);
    process.env.DATABASE_URL='mysql://synthetic:synthetic@localhost/other_test_only';
    const reconfigured=load(GeneratedAgain);assert.notEqual(reconfigured,regenerated);assert.equal(closed,3);
    process.env.NODE_ENV='production';
    const production=load(GeneratedAgain);assert.notEqual(production,reconfigured);
    assert.equal(globalThis.prisma,reconfigured);assert.equal(closed,3);
  } finally {
    keys.forEach((key,index)=>{if(previous[index])Object.defineProperty(globalThis,key,previous[index]);else delete globalThis[key];});
    for(const [key,value] of Object.entries(environment)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  }
});
