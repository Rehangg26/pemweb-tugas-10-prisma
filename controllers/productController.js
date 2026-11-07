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

let products = [
  { id: 1, name: 'Buku', price: 15000 },
  { id: 2, name: 'Pulpen', price: 5000 },
];

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

function createProduct(req, res) {
  const { name, price } = req.body || {};

  if (typeof name !== 'string' || name.trim() === '' || typeof price !== 'number' || !Number.isFinite(price)) {
    return res.status(400).json({
      message: 'Nama produk harus berupa teks dan harga harus berupa angka',
    });
  }

  const id = products.reduce((largest, product) => Math.max(largest, product.id), 0) + 1;
  const newProduct = { id, name: name.trim(), price };

  products.push(newProduct);
  return res.status(201).json(newProduct);
}

module.exports = { getProducts, getProductById, createProduct };
