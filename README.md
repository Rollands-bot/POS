# ScooterLink POS

Aplikasi Point of Sale (POS) modern berbasis web yang dibangun dengan React + Vite dan Supabase.

## 🎨 Brand Identity

- **Nama**: ScooterLink
- **Warna Utama**: Kuning Gradient Putih (Yellow 400 - White)
- **Typography**: Plus Jakarta Sans (Clean & Modern)

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL, Auth, Edge RPC)
- **Icons**: Lucide React
- **Deployment**: Vercel Ready

## 🚀 Fitur Utama

### 1. 👥 Authentication & User Role
- Login Email/Password.
- **RBAC (Role-Based Access Control)**: 
  - Admin (Full Akses)
  - Kasir (Hanya Transaksi)
  - Gudang (Kelola Stok)
- Protected Routes & Auto Redirect.

### 2. 📊 Dashboard
- Ringkasan penjualan harian.
- Grafik performa toko.
- **Low Stock Alert**: Notifikasi stok menipis (< 5).

### 3. 📦 Manajemen Produk & Stok
- CRUD Produk (Support SKU, Barcode, Kategori).
- **History Stok**: Stok otomatis bertambah saat restock dan berkurang saat transaksi.

### 4. 🛒 Point of Sale (Kasir)
- **Pencarian Cepat**: Search by Nama, SKU, atau Barcode.
- **Keyboard Shortcuts**:
  - `F2`: Fokus Cari Produk
  - `F4`: Bayar / Checkout
  - `Esc`: Batalkan / Reset
- **Support Pelanggan**: Pilih pelanggan saat transaksi.
- **Pembayaran**: Tunai & QRIS.

### 5. 🚚 Modul Supplier & Pembelian (Restock)
- Database Supplier.
- Input Pembelian Barang (Restock) dengan No. PO.
- Otomatis update Harga Beli rata-rata/terakhir.

### 6. 👤 Modul Pelanggan (CRM)
- Database Pelanggan (Nama, No HP, Plat Nomor).
- Riwayat total belanja pelanggan.

### 7. 📈 Laporan
- Laporan Penjualan Harian.
- Barang Terlaris.
- Performa Keuangan.

## ⚙️ Cara Install & Setup (Local)

### 1. Persiapan Supabase

Buat project baru di [Supabase](https://supabase.com).

Buka **SQL Editor** di dashboard Supabase dan jalankan script yang ada di file `supabase_schema.sql` di root project ini. Script ini telah diperbarui untuk mendukung semua modul di atas.

### 2. Clone & Install Dependencies

```bash
git clone <repo_url>
cd scooter-link
npm install
```

### 3. Konfigurasi Environment

Duplikasi `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi variabel dengan kredensial Supabase Anda:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Buka `http://localhost:5173`.

---

## ☁️ Cara Deploy ke Vercel

1. Push kode ke GitHub.
2. Buka dashboard [Vercel](https://vercel.com) -> **Add New Project**.
3. Import repository GitHub tadi.
4. Di bagian **Environment Variables**, masukkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Klik **Deploy**.

## 📦 Struktur Database (Supabase)

- `products`: Data barang (stok, harga jual, harga beli).
- `transactions`: Header transaksi penjualan.
- `suppliers`: Data pemasok.
- `purchases`: Header pembelian (restock).
- `purchase_items`: Detail barang yang dibeli.
- `customers`: Data pelanggan.
- `profiles`: Role user (admin/kasir).
- `settings`: Konfigurasi toko.
