const prisma = require('../lib/prisma');

// Harga tetap berupa angka pada response seperti API minggu ke-9.
function toProduct(product) {
  return { id: product.id, name: product.name, price: Number(product.price) };
}

function parseId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isInteger(id) && id <= 2147483647 ? id : null;
}

function validateProduct(body) {
  const { name, price } = body || {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return 'Nama produk harus berupa teks, tidak kosong, dan maksimal 100 karakter';
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 9999999999.99) {
    return 'Harga harus berupa angka antara 0 dan 9999999999.99';
  }
  if (Number(price.toFixed(2)) !== price) {
    return 'Harga maksimal memiliki 2 angka di belakang koma';
  }
  return null;
}

async function getProducts(req, res) {
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  return res.status(200).json(products.map(toProduct));
}

async function getProductById(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: 'ID harus bilangan bulat positif hingga 2147483647' });
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    return res.status(404).json({ message: 'Produk tidak ditemukan' });
  }

  return res.status(200).json(toProduct(product));
}

async function createProduct(req, res) {
  const message = validateProduct(req.body);
  if (message) return res.status(400).json({ message });
  const { name, price } = req.body;
  const product = await prisma.product.create({ data: { name: name.trim(), price } });
  return res.status(201).json(toProduct(product));
}

async function updateProduct(req, res) {
  const id = req.body?.id;
  if (typeof id !== 'number' || parseId(id) === null) {
    return res.status(400).json({ message: 'ID pada body harus berupa angka bulat positif hingga 2147483647' });
  }
  const message = validateProduct(req.body);
  if (message) return res.status(400).json({ message });
  const { name, price } = req.body;
  const product = await prisma.product.update({ where: { id }, data: { name: name.trim(), price } });
  return res.status(200).json(toProduct(product));
}

async function deleteProduct(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: 'ID harus bilangan bulat positif hingga 2147483647' });
  await prisma.product.delete({ where: { id } });
  return res.status(200).json({ message: 'Produk berhasil dihapus', id });
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
