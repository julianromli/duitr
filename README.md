# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/6305cbc4-c68a-4050-901f-8d9931f5828e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6305cbc4-c68a-4050-901f-8d9931f5828e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6305cbc4-c68a-4050-901f-8d9931f5828e) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

# Duitr - Your Personal Finance Manager

## Logo Customization

Duitr menggunakan sistem logo terpusat yang memudahkan untuk mengubah branding aplikasi. Berikut cara menggunakan sistem logo:

### Komponen Logo

Duitr memiliki dua komponen logo utama:

1. **Logo Dasar** (`src/components/ui/logo.tsx`): Komponen dasar yang mengambil SVG logo dari file utama.

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

2. **AppLogo** (`src/components/shared/Logo.tsx`): Komponen tingkat lebih tinggi untuk penggunaan dalam UI.

```tsx
import AppLogo from '@/components/shared/Logo';

// Logo dengan teks "Duitr"
<AppLogo size={32} withText={true} />

// Hanya logo tanpa teks
<AppLogo size={32} withText={false} />

// Logo dengan link ke halaman beranda
<AppLogo linkTo="/" />
```

### Kustomisasi Logo

Untuk mengubah logo di seluruh aplikasi:

1. Edit file `public/duitr-logo.svg` - ini adalah sumber master untuk logo.
2. Gunakan `public/logo-generator.html` untuk menghasilkan semua aset logo yang diperlukan.
3. Aset yang dihasilkan akan otomatis digunakan di seluruh aplikasi.

### Generator Logo

Untuk akses ke generator logo kunjungi `/logo-generator.html` di browser Anda.

### Favicon Customization

Duitr juga memiliki alat untuk menyesuaikan favicon dengan mudah:

1. Kunjungi `/favicon-customizer.html` di browser Anda
2. Ubah warna, ukuran, dan radius sudut favicon
3. Pratinjau perubahan dalam berbagai ukuran dan tampilan browser
4. Unduh atau perbarui favicon SVG

Favicon Duitr menggunakan format SVG modern yang didukung oleh sebagian besar browser terbaru, dengan fallback ke favicon.ico untuk browser lama. oke

### Caching Logo

Logo dan favicon di-cache oleh service worker untuk penggunaan offline. Jika Anda mengubah logo master atau favicon, pastikan untuk:

1. Memperbarui versi cache di `public/sw.js`
2. Mendeploykan semua aset logo yang baru
