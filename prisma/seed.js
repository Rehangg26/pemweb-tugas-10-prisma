const prisma = require('../lib/prisma');

async function seed() {
  // Hanya mengisi database kosong; tidak menimpa produk yang sudah dibuat.
  if (await prisma.product.count() === 0) {
    await prisma.product.createMany({ data: [
      { name: 'Buku', price: 15000 },
      { name: 'Pulpen', price: 5000 },
    ] });
  }
  console.log('Seed selesai. Produk tersedia:', await prisma.product.count());
}

seed().catch(() => {
  console.error('Seed gagal. Periksa koneksi dan migration database.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
