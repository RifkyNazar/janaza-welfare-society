import { createRequire } from 'node:module';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const mariadb = require('mariadb');
let db;
try {
  const url = new URL(process.env.DATABASE_URL);
  db = await mariadb.createConnection({host:url.hostname, port:Number(url.port||3306), user:decodeURIComponent(url.username), password:decodeURIComponent(url.password), database:url.pathname.slice(1), connectTimeout:5000, bigIntAsNumber:true});
  console.log('CONNECT PASS');
  console.log('configuration', JSON.stringify({databaseLocal:['localhost','127.0.0.1','::1'].includes(url.hostname), authSecretPresent:!!process.env.AUTH_SECRET, authSecretAtLeast32Characters:(process.env.AUTH_SECRET||'').length>=32}));
  const queries = {
    tables: 'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()',
    indexes: "SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('User','EmployeeProfile','TaskAssignment')",
    migrations: 'SELECT migration_name, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back FROM _prisma_migrations',
    integrity: 'SELECT (SELECT COUNT(*) FROM EmployeeProfile p LEFT JOIN User u ON u.id=p.userId WHERE u.id IS NULL) AS orphan_profiles, (SELECT COUNT(*) FROM TaskAssignment WHERE isActive=1 AND (activeRequestId IS NULL OR activeRequestId<>requestId)) AS inconsistent_active_tasks, (SELECT COUNT(*) FROM (SELECT phone FROM EmployeeProfile GROUP BY phone HAVING COUNT(*)>1) d) AS duplicate_phone_groups',
    database: 'SELECT VERSION() AS version, @@lower_case_table_names AS case_mode',
    engines: 'SELECT DISTINCT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()',
    fieldLimits: "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND ((TABLE_NAME='EmployeeProfile' AND COLUMN_NAME='duty') OR (TABLE_NAME='ServiceRequest' AND COLUMN_NAME='note'))",
  };
  for (const [name, sql] of Object.entries(queries)) {
    try { console.log(name, JSON.stringify(await db.query(sql))); }
    catch(e) { console.log(name, 'FAIL', e.code); }
  }
  const schema=fs.readFileSync('prisma/schema.prisma','utf8');
  const modelNames=[...schema.matchAll(/model (\w+) \{/g)].map(m=>m[1]);
  const columns=await db.query('SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()');
  const missing=[];
  for(const model of schema.matchAll(/model (\w+) \{([^}]+)\}/g))for(const field of model[2].matchAll(/^\s*(\w+)\s+(\w+)(\?|\[\])?/gm)){
    if(modelNames.includes(field[2])||field[3]==='[]')continue;
    if(!columns.some(c=>c.TABLE_NAME.toLowerCase()===model[1].toLowerCase()&&c.COLUMN_NAME===field[1]))missing.push(`${model[1]}.${field[1]}`);
  }
  console.log('missing scalar columns',JSON.stringify(missing));
  const migrations=await db.query('SELECT migration_name, checksum FROM _prisma_migrations');
  const drift=[];
  for(const row of migrations){const file=`prisma/migrations/${row.migration_name}/migration.sql`;if(!fs.existsSync(file)){drift.push({migration:row.migration_name,missing:true});continue;}const bytes=fs.readFileSync(file);if(createHash('sha256').update(bytes).digest('hex')!==row.checksum){const content=bytes.toString('utf8');const variants=[content.replace(/\r\n/g,'\n'),content.replace(/\r?\n/g,'\r\n')];drift.push({migration:row.migration_name,lineEndingVariantMatches:variants.some(v=>createHash('sha256').update(v).digest('hex')===row.checksum)});}}
  console.log('migration checksum differences',JSON.stringify(drift));
} catch(e) { console.log('CONNECT FAIL', e.code || e.name); process.exitCode=1; }
finally { await db?.end(); }
