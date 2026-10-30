import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const code = await readFile(new URL('../canonical.js', import.meta.url), 'utf8');
function run(href) {
  let redirected;
  let loaded;
  vm.runInNewContext(code, {
    URL,
    location: {href, replace: value => {redirected = value;}},
    document: {addEventListener: (_, fn) => {loaded = fn;}}
  });
  return {redirected, loaded};
}

test('old studio addresses forward to Railway with route and query intact', () => {
  for (const suffix of ['', '/', '/index.html']) {
    const result = run('https://jesteele0309.github.io/finer-things-art-cafe/innerworld' + suffix + '?view=art#collection');
    assert.equal(result.redirected, 'https://innerworld-web-production.up.railway.app/?view=art#collection');
  }
});

test('existing sign-in callbacks and private invitation links retain their fragment', () => {
  for (const hash of ['#access_token=test-only&refresh_token=test-only&type=magiclink', '#between-invite/' + 'a'.repeat(48)]) {
    assert.equal(run('https://jesteele0309.github.io/finer-things-art-cafe/innerworld/' + hash).redirected,
      'https://innerworld-web-production.up.railway.app/' + hash);
  }
});

test('redirect destination cannot be overridden by a URL parameter', () => {
  assert.equal(new URL(run('https://jesteele0309.github.io/finer-things-art-cafe/innerworld/?redirect=https://example.com').redirected).origin,
    'https://innerworld-web-production.up.railway.app');
});

test('recovery mode keeps the old collection accessible without forwarding', () => {
  const result = run('https://jesteele0309.github.io/finer-things-art-cafe/innerworld/?local=1');
  assert.equal(result.redirected, undefined);
  assert.equal(typeof result.loaded, 'function');
});

test('Railway, development, and unrelated pages never redirect', () => {
  for (const href of ['https://innerworld-web-production.up.railway.app/', 'http://localhost:3000/',
    'https://jesteele0309.github.io/finer-things-art-cafe/', 'https://jesteele0309.github.io/finer-things-art-cafe/innerworld-other/']) {
    assert.equal(run(href).redirected, undefined);
  }
});
