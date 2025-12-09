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
