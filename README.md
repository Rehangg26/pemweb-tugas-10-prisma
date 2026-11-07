# API Daftar Produk - Tugas Minggu 10

Kelanjutan API Express.js minggu ke-9 dari ZIP tugas sebelumnya. Penyimpanan array diganti dengan **PostgreSQL melalui Prisma 7**, lalu ditambahkan PUT dan DELETE. Bentuk produk tetap `{ id, name, price }`, dengan `price` berupa angka pada JSON.

Repository: [Rehangg26/pemweb-tugas-10-prisma](https://github.com/Rehangg26/pemweb-tugas-10-prisma)

## Menjalankan di lokal

Memerlukan Node.js 22.12+ (diuji dengan Node.js 24.16.0). Jalankan dari folder proyek:

```powershell
npm ci
Copy-Item .env.example .env
npm run db:generate
npm run db:local
```

Biarkan terminal database berjalan. Script `db:local` menjalankan PostgreSQL asli yang dibundel sebagai dependensi development, hanya pada `127.0.0.1:54329`. Script ini membuat database `products` dan `products_test` serta menyimpan data di `.postgres/`, tanpa memasang Windows service.

Pada terminal kedua:

```powershell
npm run db:deploy
npm run db:seed
npm start
```

API tersedia di `http://127.0.0.1:3000/products`. Seed menambahkan Buku dan Pulpen hanya jika tabel kosong. Restart Express atau proses database tidak menghapus isi tabel. Hentikan masing-masing proses dengan Ctrl+C.

Nilai password di `.env.example` hanya untuk database latihan lokal. Untuk database lain, sesuaikan `DATABASE_URL`. `.env`, direktori database, dan `node_modules` tidak masuk Git.

### Alternatif Docker

Jika Docker tersedia, gunakan `docker compose up -d db` sebagai pengganti `npm run db:local`. Jangan jalankan keduanya pada port yang sama. Untuk pengujian, buat database terpisah terlebih dahulu:

```bash
docker compose exec db createdb -U postgres products_test
```

## Endpoint

| Method | Endpoint | Body | Hasil sukses |
|---|---|---|---|
| GET | `/products` | - | `200`, array seluruh produk, urut ID |
| GET | `/products/:id` | - | `200`, satu produk |
| POST | `/products` | `name`, `price` | `201`, produk dengan ID otomatis |
| PUT | `/products` | `id`, `name`, `price` | `200`, produk yang diperbarui |
| DELETE | `/products/:id` | - | `200`, pesan dan ID yang dihapus |

Body POST:

```json
{ "name": "Spidol", "price": 12000 }
```

Body PUT menggunakan **ID di body**, sesuai instruksi tugas. Ganti ID contoh dengan ID dari hasil POST:

```json
{ "id": 3, "name": "Spidol Updated", "price": 15000 }
```

Validasi:

- `name`: teks tidak kosong setelah trim, maksimal 100 karakter.
- `price`: angka JSON dari 0 sampai 9999999999.99, maksimal dua angka desimal. Nilai string, negatif, dan pecahan lebih dari dua digit ditolak.
- `id`: bilangan bulat positif, maksimal 2147483647; ID pada body PUT wajib bertipe angka.
- Input tidak valid atau JSON rusak menghasilkan `400`. Produk atau endpoint yang tidak ditemukan menghasilkan `404`. Kesalahan internal menghasilkan `500` dengan pesan umum.
- Validasi dilakukan sebelum penulisan. Kegagalan update/delete karena baris tidak ditemukan ditangani sebagai `404`.

PostgreSQL menyimpan harga sebagai `DECIMAL(12,2)`, bukan floating point. Response dikonversi kembali menjadi angka agar sesuai kontrak API minggu ke-9. Constraint database juga menolak nama kosong dan harga negatif.

## Pengujian dan evidence

```bash
npm test
npm run db:studio
```

Prisma Studio tersedia di `http://localhost:5555`. Pengujian menggunakan `TEST_DATABASE_URL` dari `.env`, yang wajib menunjuk ke database lokal bernama `products_test`. Migration diterapkan otomatis ke database uji. Tes hanya membersihkan ID yang dibuatnya sendiri.

Hasil: **39 pemeriksaan lulus**, termasuk CRUD, validasi, batas harga, ID salah/tidak ditemukan, JSON rusak, serta penyimpanan setelah restart proses Express. Tidak ada database mock.

- [Laporan evidence PDF](docs/laporan-evidence.pdf)
- [Laporan evidence Markdown](docs/laporan-evidence.md)
- [Screenshot asli Postman dan Prisma Studio](docs/evidence/)
- [Log hasil pengujian](docs/test-results.txt)
- [Collection Postman](postman/products.postman_collection.json)

Import collection ke Postman, lalu jalankan request secara berurutan. Request POST menyimpan ID baru ke collection variable `productId`; PUT dan DELETE memakai ID tersebut.

## Struktur proyek

```text
index.js                       Konfigurasi Express dan error handler
routes/productRoutes.js        Pemetaan method dan URL
controllers/productController.js  Validasi dan operasi Prisma
lib/prisma.js                  Prisma Client + adapter PostgreSQL
prisma/schema.prisma           Model Product
prisma/migrations/             Riwayat perubahan tabel
prisma/seed.js                 Data awal untuk database kosong
scripts/local-db.mjs           PostgreSQL development lokal
test.js                        Tes integrasi HTTP + database
docs/                          Laporan dan screenshot evidence
postman/                       Collection pengujian manual
```

## Migration dan commit

Gunakan `npm run db:migrate -- --name nama_perubahan` untuk mengembangkan schema, lalu `npm run db:generate`. Gunakan `npm run db:deploy` untuk menerapkan migration yang sudah disimpan di repository. Jangan menghapus riwayat migration yang telah diterapkan. Jika perubahan berhasil perlu dibatalkan, buat migration baru yang membaliknya; penghapusan kolom tidak memulihkan data lama.

Commit menggunakan format `type(tugas-10): deskripsi`. Setup database, fitur GET, POST, PUT, DELETE, pengujian, dan dokumentasi dipisahkan. Commit pertama `chore(tugas-9)` menyimpan sumber tugas sebelumnya agar perubahan minggu ke-10 dapat dibandingkan.

Referensi implementasi: [Prisma PostgreSQL](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql) dan [konfigurasi Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7).
