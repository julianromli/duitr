# Panduan Penggunaan Duitr

Panduan lengkap untuk menggunakan aplikasi Duitr - Personal Finance Manager.

## 📋 Daftar Isi

1. [Memulai](#memulai)
2. [Dashboard](#dashboard)
3. [Manajemen Transaksi](#manajemen-transaksi)
4. [Manajemen Dompet](#manajemen-dompet)
5. [Anggaran](#anggaran)
6. [Statistik](#statistik)
7. [Pengaturan](#pengaturan)
8. [Tips dan Trik](#tips-dan-trik)

## 🚀 Memulai

### Registrasi Akun

1. **Buka aplikasi Duitr** di browser atau install sebagai PWA
2. **Klik "Daftar"** di halaman login
3. **Isi form registrasi**:
   - Email yang valid
   - Password yang kuat (minimal 8 karakter)
   - Konfirmasi password
4. **Verifikasi email** melalui link yang dikirim ke email Anda
5. **Login** dengan kredensial yang telah dibuat

### Setup Awal

Setelah login pertama kali:

1. **Pilih bahasa** (Indonesia/English)
2. **Pilih tema** (Gelap/Terang)
3. **Buat dompet pertama** Anda
4. **Setup kategori** transaksi (opsional, sudah ada default)

## 🏠 Dashboard

Dashboard adalah halaman utama yang menampilkan ringkasan keuangan Anda.

### Komponen Dashboard

#### 1. Ringkasan Saldo
- **Total Saldo**: Jumlah semua saldo dari seluruh dompet
- **Saldo per Dompet**: Breakdown saldo masing-masing dompet
- **Perubahan Bulanan**: Persentase perubahan dari bulan sebelumnya

#### 2. Grafik Pengeluaran
- **Grafik Bulanan**: Visualisasi pengeluaran per bulan
- **Grafik Kategori**: Breakdown pengeluaran per kategori
- **Trend Analysis**: Analisis tren pengeluaran

#### 3. Transaksi Terbaru
- **5 Transaksi Terakhir**: Akses cepat ke transaksi terbaru
- **Quick Actions**: Tombol cepat untuk tambah transaksi

#### 4. Quick Actions
- **Tambah Pengeluaran**: Shortcut untuk mencatat pengeluaran
- **Tambah Pemasukan**: Shortcut untuk mencatat pemasukan
- **Transfer**: Shortcut untuk transfer antar dompet

## 💰 Manajemen Transaksi

### Menambah Transaksi

#### Pengeluaran
1. **Klik "Tambah Pengeluaran"** di dashboard atau navbar
2. **Isi form**:
   - **Jumlah**: Nominal pengeluaran
   - **Kategori**: Pilih kategori yang sesuai
   - **Dompet**: Pilih dompet sumber dana
   - **Tanggal**: Tanggal transaksi (default hari ini)
   - **Catatan**: Deskripsi opsional
3. **Klik "Simpan"**

#### Pemasukan
1. **Klik "Tambah Pemasukan"** di dashboard atau navbar
2. **Isi form**:
   - **Jumlah**: Nominal pemasukan
   - **Kategori**: Pilih kategori pemasukan
   - **Dompet**: Pilih dompet tujuan
   - **Tanggal**: Tanggal transaksi
   - **Catatan**: Deskripsi opsional
3. **Klik "Simpan"**

#### Transfer Antar Dompet
1. **Klik "Transfer"** di dashboard atau navbar
2. **Isi form**:
   - **Jumlah**: Nominal transfer
   - **Dari Dompet**: Dompet sumber
   - **Ke Dompet**: Dompet tujuan
   - **Tanggal**: Tanggal transfer
   - **Catatan**: Deskripsi opsional
3. **Klik "Transfer"**

### Melihat Riwayat Transaksi

1. **Buka halaman "Transaksi"** dari navbar
2. **Filter transaksi**:
   - **Berdasarkan tanggal**: Pilih rentang tanggal
   - **Berdasarkan kategori**: Filter kategori tertentu
   - **Berdasarkan dompet**: Filter dompet tertentu
   - **Berdasarkan jenis**: Pengeluaran/Pemasukan/Transfer
3. **Pencarian**: Gunakan kotak pencarian untuk cari transaksi spesifik

### Mengedit/Menghapus Transaksi

1. **Klik transaksi** yang ingin diedit dari daftar
2. **Pilih aksi**:
   - **Edit**: Ubah detail transaksi
   - **Hapus**: Hapus transaksi (konfirmasi diperlukan)

## 💳 Manajemen Dompet

### Membuat Dompet Baru

1. **Buka halaman "Dompet"** dari navbar
2. **Klik "Tambah Dompet"**
3. **Isi form**:
   - **Nama Dompet**: Nama yang mudah diingat
   - **Jenis**: Kas, Bank, E-Wallet, dll.
   - **Saldo Awal**: Saldo saat ini (opsional)
   - **Warna**: Pilih warna untuk identifikasi
   - **Icon**: Pilih icon yang sesuai
4. **Klik "Simpan"**

### Mengelola Dompet

#### Melihat Detail Dompet
- **Saldo Terkini**: Saldo real-time
- **Riwayat Transaksi**: Semua transaksi dari dompet ini
- **Statistik**: Analisis pengeluaran/pemasukan

#### Mengedit Dompet
1. **Klik icon edit** di dompet yang ingin diubah
2. **Ubah informasi** yang diperlukan
3. **Klik "Simpan"**

#### Menghapus Dompet
⚠️ **Perhatian**: Menghapus dompet akan menghapus semua transaksi terkait!

1. **Klik icon hapus** di dompet
2. **Konfirmasi penghapusan**
3. **Ketik nama dompet** untuk konfirmasi

## 🎯 Anggaran

### Membuat Anggaran

1. **Buka halaman "Anggaran"** dari navbar
2. **Klik "Buat Anggaran Baru"**
3. **Isi form**:
   - **Nama Anggaran**: Nama yang deskriptif
   - **Kategori**: Pilih kategori untuk anggaran
   - **Jumlah**: Target anggaran bulanan
   - **Periode**: Bulan dan tahun
4. **Klik "Simpan"**

### Monitoring Anggaran

#### Progress Bar
- **Hijau**: Masih dalam batas aman (< 70%)
- **Kuning**: Mendekati batas (70-90%)
- **Merah**: Melebihi anggaran (> 100%)

#### Notifikasi Anggaran
Aplikasi akan memberikan notifikasi ketika:
- Mencapai 70% dari anggaran
- Mencapai 90% dari anggaran
- Melebihi 100% anggaran

### Daftar Keinginan (Want to Buy)

1. **Buka tab "Daftar Keinginan"** di halaman Anggaran
2. **Klik "Tambah Item"**
3. **Isi informasi**:
   - **Nama Item**: Barang yang ingin dibeli
   - **Harga**: Estimasi harga
   - **Prioritas**: Tinggi/Sedang/Rendah
   - **Target Tanggal**: Kapan ingin membeli
4. **Track progress** menabung untuk item tersebut

### Manajemen Pinjaman

1. **Buka tab "Pinjaman"** di halaman Anggaran
2. **Klik "Tambah Pinjaman"**
3. **Isi detail**:
   - **Nama**: Nama pemberi/penerima pinjaman
   - **Jumlah**: Nominal pinjaman
   - **Jenis**: Meminjam/Dipinjam
   - **Tanggal**: Tanggal pinjaman
   - **Jatuh Tempo**: Tanggal pengembalian
4. **Update status** ketika pinjaman dikembalikan

## 📊 Statistik

Halaman statistik memberikan analisis mendalam tentang pola keuangan Anda.

### Jenis Analisis

#### 1. Analisis Bulanan
- **Pengeluaran per bulan**: Trend pengeluaran bulanan
- **Pemasukan per bulan**: Trend pemasukan bulanan
- **Net Income**: Selisih pemasukan dan pengeluaran

#### 2. Analisis Kategori
- **Top Categories**: Kategori dengan pengeluaran terbesar
- **Category Trends**: Trend pengeluaran per kategori
- **Budget vs Actual**: Perbandingan anggaran dengan realisasi

#### 3. Analisis Dompet
- **Wallet Performance**: Performa masing-masing dompet
- **Balance History**: Riwayat saldo dompet
- **Usage Frequency**: Frekuensi penggunaan dompet

### Export Data

1. **Klik "Export"** di halaman Statistik
2. **Pilih format**:
   - **Excel (.xlsx)**: Untuk analisis lanjutan
   - **CSV**: Untuk import ke aplikasi lain
3. **Pilih periode**: Rentang tanggal data
4. **Download file**

## ⚙️ Pengaturan

### Pengaturan Akun

#### Profil
- **Nama**: Ubah nama tampilan
- **Email**: Ubah alamat email
- **Avatar**: Upload foto profil

#### Keamanan
- **Ubah Password**: Ganti password akun
- **Two-Factor Authentication**: Aktifkan 2FA (coming soon)
- **Login History**: Lihat riwayat login

### Pengaturan Aplikasi

#### Tampilan
- **Tema**: Pilih tema gelap/terang
- **Bahasa**: Pilih bahasa interface
- **Currency**: Pilih mata uang default

#### Notifikasi
- **Push Notifications**: Aktifkan notifikasi push
- **Email Notifications**: Notifikasi via email
- **Budget Alerts**: Peringatan anggaran

#### Data & Privacy
- **Export Data**: Download semua data Anda
- **Delete Account**: Hapus akun dan semua data
- **Privacy Settings**: Pengaturan privasi

## 💡 Tips dan Trik

### Produktivitas

1. **Gunakan Quick Actions**: Manfaatkan shortcut di dashboard untuk input cepat
2. **Set Budget Realistis**: Buat anggaran yang achievable berdasarkan data historis
3. **Review Rutin**: Lakukan review mingguan untuk track progress
4. **Kategorisasi Konsisten**: Gunakan kategori yang konsisten untuk analisis yang akurat

### Organisasi Data

1. **Naming Convention**: Gunakan nama yang konsisten untuk dompet dan kategori
2. **Regular Backup**: Export data secara berkala sebagai backup
3. **Clean Up**: Hapus transaksi duplikat atau tidak relevan
4. **Tag System**: Gunakan catatan untuk menambah context pada transaksi

### Analisis Keuangan

1. **Monthly Review**: Analisis pengeluaran bulanan untuk identifikasi pola
2. **Category Analysis**: Fokus pada kategori dengan pengeluaran terbesar
3. **Trend Watching**: Perhatikan trend jangka panjang, bukan fluktuasi harian
4. **Goal Setting**: Set target finansial yang spesifik dan measurable

### PWA Features

1. **Install App**: Install Duitr sebagai PWA untuk akses yang lebih cepat
2. **Offline Mode**: Gunakan aplikasi bahkan tanpa koneksi internet
3. **Home Screen**: Tambahkan shortcut ke home screen untuk akses cepat
4. **App Shortcuts**: Gunakan shortcut aplikasi untuk aksi cepat

## 🆘 Troubleshooting

### Masalah Umum

#### Data Tidak Sinkron
1. **Refresh halaman** atau restart aplikasi
2. **Cek koneksi internet**
3. **Logout dan login kembali**

#### Aplikasi Lambat
1. **Clear browser cache**
2. **Update browser** ke versi terbaru
3. **Tutup tab browser** yang tidak perlu

#### Tidak Bisa Login
1. **Reset password** jika lupa
2. **Cek email** untuk verifikasi akun
3. **Coba browser** yang berbeda

### Kontak Support

Jika masalah masih berlanjut:
- **Email**: support@duitr.app
- **GitHub Issues**: Buat issue di repository
- **Documentation**: Cek dokumentasi terbaru

---

**Selamat menggunakan Duitr!** 🎉

Semoga panduan ini membantu Anda mengelola keuangan dengan lebih baik. Jangan ragu untuk memberikan feedback atau saran untuk perbaikan aplikasi.