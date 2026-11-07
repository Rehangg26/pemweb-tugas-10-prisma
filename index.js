const express = require('express');
const productRoutes = require('./routes/productRoutes');
const prisma = require('./lib/prisma');

const app = express();

app.use(express.json());
app.use('/products', productRoutes);
app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Body harus berupa JSON yang valid' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Body terlalu besar' });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ message: 'Produk tidak ditemukan' });
  }
  console.error('Request gagal:', error.code || error.name);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`Server berjalan pada http://127.0.0.1:${port}`);
  });
  let closing = false;
  function shutdown() {
    if (closing) return;
    closing = true;
    server.close(async () => {
      await prisma.$disconnect();
      process.exit();
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  server.on('error', () => {
    console.error('Server gagal dijalankan. Periksa PORT.');
    process.exitCode = 1;
  });
}

module.exports = app;
