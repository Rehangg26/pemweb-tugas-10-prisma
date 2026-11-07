const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('./index');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test('GET /products mengembalikan daftar produk awal', async () => {
  const response = await fetch(`${baseUrl}/products`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(data, [
    { id: 1, name: 'Buku', price: 15000 },
    { id: 2, name: 'Pulpen', price: 5000 },
  ]);
});

test('GET /products/1 mengembalikan detail Buku', async () => {
  const response = await fetch(`${baseUrl}/products/1`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(data, { id: 1, name: 'Buku', price: 15000 });
});

test('GET /products/999 mengembalikan 404 jika produk tidak ditemukan', async () => {
  const response = await fetch(`${baseUrl}/products/999`);
  const data = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(data, { message: 'Produk tidak ditemukan' });
});

test('POST /products menambahkan produk dan memberi status 201', async () => {
  const response = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Pensil', price: 3000 }),
  });
  const data = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(data, { id: 3, name: 'Pensil', price: 3000 });
});

test('POST /products menolak data yang tidak valid', async () => {
  const response = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', price: 'murah' }),
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(typeof data.message, 'string');
});
