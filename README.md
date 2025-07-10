# Duitr - Personal Finance Manager

![Duitr Logo](public/duitr-logo.svg)

**Duitr** adalah aplikasi manajemen keuangan pribadi yang modern dan intuitif, dibangun dengan teknologi web terdepan. Aplikasi ini membantu Anda melacak pengeluaran, mengelola anggaran, dan mencapai tujuan keuangan dengan mudah.

## 🚀 Fitur Utama

### 💰 Manajemen Transaksi
- **Pencatatan Pengeluaran**: Catat semua pengeluaran dengan kategori yang dapat disesuaikan
- **Pencatatan Pemasukan**: Kelola sumber pendapatan Anda
- **Transfer Antar Dompet**: Pindahkan dana antar dompet dengan mudah
- **Riwayat Transaksi**: Lihat semua transaksi dengan filter dan pencarian
- **Detail Transaksi**: Informasi lengkap setiap transaksi

### 📊 Dashboard & Analitik
- **Ringkasan Saldo**: Lihat total saldo dari semua dompet
- **Grafik Pengeluaran**: Visualisasi pengeluaran bulanan
- **Transaksi Terbaru**: Akses cepat ke transaksi terkini
- **Statistik Keuangan**: Analisis mendalam tentang pola keuangan

### 🎯 Manajemen Anggaran
- **Buat Anggaran**: Tetapkan anggaran untuk berbagai kategori
- **Pelacakan Progress**: Monitor pencapaian anggaran secara real-time
- **Peringatan Anggaran**: Notifikasi ketika mendekati batas anggaran
- **Daftar Keinginan**: Kelola item yang ingin dibeli
- **Manajemen Pinjaman**: Catat dan kelola pinjaman

### 💳 Manajemen Dompet
- **Multi-Dompet**: Kelola berbagai jenis dompet (kas, bank, e-wallet)
- **Saldo Real-time**: Pembaruan saldo otomatis
- **Kategori Dompet**: Organisasi dompet berdasarkan jenis

### 🌐 Fitur Tambahan
- **Multi-bahasa**: Dukungan Bahasa Indonesia dan Inggris
- **Mode Gelap/Terang**: Tema yang dapat disesuaikan
- **PWA (Progressive Web App)**: Dapat diinstal di perangkat mobile
- **Offline Support**: Bekerja tanpa koneksi internet
- **Export Data**: Ekspor data ke format Excel/CSV
- **Responsive Design**: Optimal di desktop dan mobile

## 🛠️ Teknologi yang Digunakan

### Frontend
- **React 18** - Library UI modern
- **TypeScript** - Type safety dan developer experience
- **Vite** - Build tool yang cepat
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Komponen UI yang dapat disesuaikan
- **Framer Motion** - Animasi yang smooth
- **React Router** - Routing aplikasi
- **React Hook Form** - Manajemen form yang efisien
- **Zod** - Validasi schema

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database relasional
- **Row Level Security** - Keamanan data tingkat baris

### State Management & Data Fetching
- **React Query (TanStack Query)** - Server state management
- **React Context** - Client state management

### Internationalization
- **i18next** - Framework internasionalisasi
- **react-i18next** - Integrasi React dengan i18next

### PWA & Performance
- **Vite PWA Plugin** - Progressive Web App capabilities
- **Service Worker** - Caching dan offline support
- **Web App Manifest** - Instalasi aplikasi

## 📱 Instalasi dan Setup

### Prasyarat
- Node.js (versi 18 atau lebih baru)
- npm atau yarn
- Akun Supabase

### Langkah Instalasi

1. **Clone repository**
```bash
git clone <repository-url>
cd duitr
```

2. **Install dependencies**
```bash
npm install
# atau
yarn install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit file `.env` dan tambahkan konfigurasi Supabase:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Setup database**
- Jalankan script SQL di folder `supabase/migrations/`
- Import schema dari `supabase_schema.sql`

5. **Jalankan aplikasi**
```bash
npm run dev
# atau
yarn dev
```

Aplikasi akan berjalan di `http://localhost:5173`

## 🏗️ Struktur Proyek

```
src/
├── components/          # Komponen React
│   ├── app/            # Komponen aplikasi utama
│   ├── auth/           # Komponen autentikasi
│   ├── budget/         # Komponen anggaran
│   ├── dashboard/      # Komponen dashboard
│   ├── layout/         # Komponen layout
│   ├── shared/         # Komponen yang dibagikan
│   ├── transactions/   # Komponen transaksi
│   ├── ui/            # Komponen UI dasar
│   └── wallets/       # Komponen dompet
├── context/            # React Context providers
├── hooks/             # Custom React hooks
├── lib/               # Utilities dan konfigurasi
├── pages/             # Komponen halaman
├── services/          # Service layer
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🎨 Kustomisasi

### Logo dan Branding

Duitr menggunakan sistem logo terpusat yang memudahkan kustomisasi:

1. **Logo Dasar** (`src/components/ui/logo.tsx`)
```tsx
import Logo from '@/components/ui/logo';

// Penggunaan dasar
<Logo size={32} variant="default" />

// Dengan warna kustom
<Logo size={48} bgColor="#ff0000" color="#ffffff" />

// Variasi bentuk
<Logo size={32} variant="square" />
<Logo size={32} variant="circle" />
<Logo size={32} variant="text-only" />
```

2. **AppLogo** (`src/components/shared/Logo.tsx`)
```tsx
import AppLogo from '@/components/shared/Logo';

// Logo dengan teks
<AppLogo size={32} withText={true} />

// Hanya logo
<AppLogo size={32} withText={false} />

// Logo dengan link
<AppLogo linkTo="/" />
```

### Mengubah Logo
1. Edit file `public/duitr-logo.svg`
2. Gunakan `public/logo-generator.html` untuk generate aset
3. Kunjungi `/logo-generator.html` di browser

### Favicon Customization
1. Kunjungi `/favicon-customizer.html`
2. Sesuaikan warna, ukuran, dan radius
3. Preview dan download favicon baru

## 🚀 Build dan Deploy

### Development Build
```bash
npm run build:dev
```

### Production Build
```bash
npm run build
```

### PWA Build
```bash
npm run build:pwa
```

### Deploy ke Vercel
```bash
npm run vercel:deploy
```

## 📊 Database Schema

Aplikasi menggunakan Supabase dengan schema berikut:

- **users** - Data pengguna
- **wallets** - Dompet pengguna
- **categories** - Kategori transaksi
- **transactions** - Transaksi keuangan
- **budgets** - Anggaran pengguna
- **want_to_buy** - Daftar keinginan
- **pinjaman** - Data pinjaman

## 🔒 Keamanan

- **Row Level Security (RLS)** - Data pengguna terisolasi
- **JWT Authentication** - Autentikasi yang aman
- **Environment Variables** - Konfigurasi sensitif tersembunyi
- **Input Validation** - Validasi data dengan Zod

## 🌍 Internationalization

Aplikasi mendukung multi-bahasa:
- Bahasa Indonesia (default)
- English

File terjemahan tersimpan di `src/locales/`

## 📱 PWA Features

- **Installable** - Dapat diinstal di perangkat
- **Offline Support** - Bekerja tanpa internet
- **Push Notifications** - Notifikasi (coming soon)
- **Background Sync** - Sinkronisasi data otomatis
- **App Shortcuts** - Shortcut ke fitur utama

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Project ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 📞 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:
- Buat issue di GitHub repository
- Hubungi tim developer

## 🔄 Changelog

### v1.0.0
- ✅ Manajemen transaksi lengkap
- ✅ Dashboard dengan analitik
- ✅ Sistem anggaran
- ✅ Multi-dompet
- ✅ PWA support
- ✅ Multi-bahasa
- ✅ Export data

---

**Duitr** - Kelola keuangan Anda dengan mudah dan efisien! 💰✨
