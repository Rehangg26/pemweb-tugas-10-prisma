# API Daftar Produk

API sederhana menggunakan Express.js. Data produk disimpan dalam array di memori, tanpa database.

## Menjalankan aplikasi

```bash
npm install
npm start
```

Server berjalan di `http://localhost:3000` secara default. Port dapat diubah melalui environment variable `PORT`.

## Endpoint

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/products` | Mengambil semua produk |
| GET | `/products/:id` | Mengambil produk berdasarkan ID |
| POST | `/products` | Menambahkan produk baru |

Jika ID tidak ditemukan, server mengembalikan status `404` dan pesan JSON. POST menerima body JSON dengan properti `name` berupa teks dan `price` berupa angka. Produk yang berhasil dibuat menerima ID baru dan response berstatus `201`.

Contoh body POST:

```json
{
  "name": "Pensil",
  "price": 3000
}
```

## Pengujian

```bash
npm test
```

Pengujian mencakup daftar produk, detail produk, ID yang tidak ditemukan, pembuatan produk, dan validasi input POST.
