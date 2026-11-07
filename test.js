require('dotenv').config({ quiet: true });
const test = require('node:test');
const assert = require('node:assert/strict');
const { fork, execFileSync } = require('node:child_process');
const { once } = require('node:events');

const connection = process.env.TEST_DATABASE_URL;
if (!connection) throw new Error('Isi TEST_DATABASE_URL untuk database pengujian terpisah.');
const url = new URL(connection);
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/products_test') {
  throw new Error('Pengujian hanya diizinkan pada database lokal products_test.');
}
process.env.DATABASE_URL = connection;
const prisma = require('./lib/prisma');
let child;
let baseUrl;
const ids = [];

async function start() {
  child = fork('./scripts/test-server.js', { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  const timeout = setTimeout(() => child.kill(), 15000);
  try {
    const result = await Promise.race([
      once(child, 'message'),
      once(child, 'exit').then(() => { throw new Error('Server uji berhenti sebelum siap'); }),
    ]);
    baseUrl = `http://127.0.0.1:${result[0].port}`;
  } finally { clearTimeout(timeout); }
}

async function stop() {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.send('shutdown');
  const timeout = setTimeout(() => child.kill(), 10000);
  try { await exited; } finally { clearTimeout(timeout); }
}

async function request(method, path, body) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test.before(async () => {
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    env: process.env, stdio: 'pipe',
  });
  await start();
});
test.after(async () => {
  await stop();
  // Hanya membersihkan ID yang dibuat oleh proses pengujian ini.
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test('CRUD PostgreSQL dan persistence', async (t) => {
  let product;
  await t.test('GET daftar produk: 200 dan array', async () => {
    const result = await request('GET', '/products');
    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.body));
  });
  await t.test('POST valid: 201, trim nama, harga angka', async () => {
    const result = await request('POST', '/products', { name: '  Produk Uji  ', price: 3000.25 });
    product = result.body;
    if (Number.isInteger(product.id)) ids.push(product.id);
    assert.equal(result.status, 201);
    assert.deepEqual(product, { id: product.id, name: 'Produk Uji', price: 3000.25 });
    assert.ok(product.id > 0);
    assert.equal(Number((await prisma.product.findUnique({ where: { id: product.id } })).price), 3000.25);
  });
  await t.test('GET detail dan daftar memuat hasil POST', async () => {
    assert.deepEqual(await request('GET', `/products/${product.id}`), { status: 200, body: product });
    assert.ok((await request('GET', '/products')).body.some(item => item.id === product.id));
  });
  await t.test('Restart proses Express mempertahankan produk', async () => {
    await stop();
    await start();
    assert.deepEqual(await request('GET', `/products/${product.id}`), { status: 200, body: product });
  });
  const invalidBodies = [
    undefined, null, [], {}, { name: '   ', price: 10 }, { name: 12, price: 10 },
    { name: 'a'.repeat(101), price: 10 }, { name: 'Uji', price: '100' },
    { name: 'Uji', price: -1 }, { name: 'Uji', price: 1.234 },
    { name: 'Uji', price: 10000000000 }, { name: 'Uji', price: 0.00000001 },
  ];
  for (const [index, body] of invalidBodies.entries()) {
    await t.test(`POST input tidak valid ${index + 1}: 400 tanpa perubahan DB`, async () => {
      const before = await prisma.product.count();
      assert.equal((await request('POST', '/products', body)).status, 400);
      assert.equal(await prisma.product.count(), before);
    });
  }
  await t.test('PUT valid: 200 dan database berubah', async () => {
    product = { id: product.id, name: 'Produk Diperbarui', price: 0 };
    assert.deepEqual(await request('PUT', '/products', product), { status: 200, body: product });
    const row = await prisma.product.findUnique({ where: { id: product.id } });
    assert.equal(row.name, product.name);
    assert.equal(Number(row.price), 0);
  });
  await t.test('Harga batas maksimum tetap presisi', async () => {
    const result = await request('PUT', '/products', { ...product, price: 9999999999.99 });
    assert.equal(result.status, 200);
    assert.equal(result.body.price, 9999999999.99);
    assert.equal((await request('PUT', '/products', product)).status, 200);
  });
  for (const id of [undefined, '1', 0, -1, 1.5, 2147483648]) {
    await t.test(`PUT id tidak valid ${String(id)}: 400`, async () => {
      assert.equal((await request('PUT', '/products', { id, name: 'Uji', price: 1 })).status, 400);
    });
  }
  await t.test('PUT harga tidak valid: 400 dan produk tetap', async () => {
    assert.equal((await request('PUT', '/products', { ...product, price: -2 })).status, 400);
    assert.deepEqual((await request('GET', `/products/${product.id}`)).body, product);
  });
  for (const method of ['GET', 'PUT', 'DELETE']) {
    await t.test(`${method} produk tidak ditemukan: 404`, async () => {
      const missing = 2147483647;
      assert.equal((await request(method, method === 'PUT' ? '/products' : `/products/${missing}`,
        method === 'PUT' ? { id: missing, name: 'Uji', price: 10 } : undefined)).status, 404);
    });
  }
  for (const id of ['abc', '0', '-1', '1.5', '2147483648', '1e2']) {
    await t.test(`GET/DELETE id tidak valid ${id}: 400`, async () => {
      for (const method of ['GET', 'DELETE']) assert.equal((await request(method, `/products/${id}`)).status, 400);
    });
  }
  await t.test('JSON rusak: 400 JSON', async () => {
    const response = await fetch(baseUrl + '/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"name":',
    });
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).message, 'string');
  });
  await t.test('DELETE valid: 200, baris hilang, GET selanjutnya 404', async () => {
    assert.equal((await request('DELETE', `/products/${product.id}`)).status, 200);
    assert.equal(await prisma.product.findUnique({ where: { id: product.id } }), null);
    assert.equal((await request('GET', `/products/${product.id}`)).status, 404);
  });
  await t.test('DELETE berulang: 404', async () => {
    assert.equal((await request('DELETE', `/products/${product.id}`)).status, 404);
  });
  await t.test('Endpoint tidak ada: 404 JSON', async () => {
    assert.equal((await request('GET', '/tidak-ada')).status, 404);
  });
});
