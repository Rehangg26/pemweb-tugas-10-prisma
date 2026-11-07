let products = [
  { id: 1, name: 'Buku', price: 15000 },
  { id: 2, name: 'Pulpen', price: 5000 },
];

function getProducts(req, res) {
  return res.status(200).json(products);
}

function getProductById(req, res) {
  const id = Number(req.params.id);
  const product = products.find((item) => item.id === id);

  if (!product) {
    return res.status(404).json({ message: 'Produk tidak ditemukan' });
  }

  return res.status(200).json(product);
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
