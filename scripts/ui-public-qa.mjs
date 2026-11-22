// Read-only checks against the locally running production build. No form is submitted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadServerModule } from '../tests/load-server-module.mjs';
const base = process.env.JWS_QA_BASE_URL ?? 'http://localhost:3100';
const copy = loadServerModule('app/design-preview/emerald-sanctuary/preview-copy.ts');
const { translate } = loadServerModule('lib/i18n.ts');
const { leadershipTeam } = loadServerModule('lib/leadership-team.ts');
for (const locale of ['en', 'ta']) {
  for (const path of ['/', '/about', '/services', '/vehicles', '/team', '/operations', '/contact', '/request-service', '/track-request', '/support', '/employee-access', '/employee-access/login', '/employee-access/register', '/employee-access/register/success', '/admin/login']) {
    const response = await fetch(base + path, { headers: { cookie: 'jws-language=' + locale } });
    assert.equal(response.status, 200, path);
    const body = await response.text();
    assert.ok(body.includes('lang="' + locale + '"'), path + ' locale');
    assert.ok(body.includes('aria-label="தமிழ் / English"'), path + ' language selector');
    if (path !== '/admin/login') for (const destination of ['/employee-access/login', '/admin/login', '/supervisor']) assert.ok(body.includes('href="' + destination + '"'), path + ' staff routes');
    if (path === '/') {
      assert.ok(body.includes(copy.quranVerse));
      assert.ok(body.includes('lang="ar" dir="rtl"'));
      assert.ok(body.includes(copy.quranTranslation));
      assert.ok(body.includes(copy.previewCopy(locale).request));
      assert.ok(body.includes('fleetShowcase'));
      assert.ok(body.indexOf('fleetShowcase') > body.indexOf('heroActions'));
      assert.ok(!body.includes('/task-photos/'));
    }
    if (path === '/team') for (const member of leadershipTeam) assert.ok(body.includes('id="leader-' + member.position.toLowerCase() + '"'));
    // Contact fields intentionally appear only after category/service selection.
    if (path === '/request-service') {
      const categoryGroup = body.match(/<fieldset[^>]*><legend[\s\S]*?<\/fieldset>/)?.[0];
      assert.ok(categoryGroup, 'service category fieldset and legend');
      assert.equal([...categoryGroup.matchAll(/aria-pressed="false"/g)].length, 2);
    }
    if (path === '/track-request') for (const name of ['requestCode', 'mobileNumber']) assert.ok(body.includes('name="' + name + '"'));
    const localizedLabels = {
      '/support': ['Bank Transfer Details', 'Submit Transfer Confirmation'],
      '/employee-access': ['Employee Login', 'Employee Registration'],
      '/employee-access/login': ['Staff Login'],
      '/admin/login': ['Admin Login'],
    };
    for (const label of localizedLabels[path] ?? []) {
      const translated = translate(locale, label);
      if (locale === 'ta') assert.notEqual(translated, label);
      assert.ok(body.includes('>' + translated + '<'), path + ' ' + label);
    }
    console.log(locale, path, 'PASS: status, language, staff destinations and applicable content assertions');
  }
}
for (const name of ['vehicle-01.png', 'vehicle-02.png']) {
  const response = await fetch(base + '/_next/image?url=' + encodeURIComponent('/images/jws/vehicles/' + name) + '&w=640&q=75', { headers: { accept: 'image/webp' } });
  assert.equal(response.status, 200);
  const data = Buffer.from(await response.arrayBuffer());
  assert.ok(response.headers.get('content-type')?.startsWith('image/'));
  console.log(name, 'original bytes', fs.statSync('public/images/jws/vehicles/' + name).size, '640px optimized bytes', data.length, response.headers.get('content-type'));
}
console.log('Public HTTP QA passed. No browser interaction or viewport layout measurement was performed.');
