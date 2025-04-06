# Panduan Setup Penyimpanan Avatar di Supabase

Dokumen ini berisi panduan lengkap untuk mengatur penyimpanan foto profil (avatar) di Supabase untuk aplikasi UrFinance.

## 1. Membuat Bucket Storage

1. Login ke dashboard Supabase Anda
2. Pergi ke bagian "Storage" di menu sidebar kiri
3. Klik tombol "New Bucket"
4. Isi informasi bucket:
   - **Name**: avatars
   - **Public bucket**: Centang opsi ini untuk memungkinkan akses publik 
   - **File size limit**: 10 MB (opsional)
   - **Allowed MIME types**: image/jpeg, image/png, image/gif, image/webp (opsional)
5. Klik "Create bucket" untuk membuat bucket

## 2. Mengatur Kebijakan Akses (Policies)

Setelah bucket dibuat, Anda perlu menambahkan kebijakan akses agar pengguna dapat mengupload dan melihat foto profil.

1. Masih di dashboard Supabase, pergi ke bagian "Storage"
2. Klik bucket "avatars" yang baru dibuat
3. Klik tab "Policies"

### Menambahkan Policy untuk SELECT (melihat foto profil)

1. Klik "Add Policies"
2. Pilih "SELECT" (Get)
3. Pilih "Kustom"
4. Isi form kebijakan:
   - **Policy name**: Public Access for Avatars
   - **Policy definition**: `bucket_id = 'avatars'` (semua orang dapat melihat foto profil)
5. Klik "Save Policy"

### Menambahkan Policy untuk INSERT (upload foto profil)

1. Klik "Add Policies"
2. Pilih "INSERT" (Insert)
3. Pilih "Kustom"
4. Isi form kebijakan:
   - **Policy name**: Users Can Upload Their Own Avatar
   - **Target roles**: authenticated
   - **Policy definition**: `bucket_id = 'avatars' AND auth.uid()::text = name`
5. Klik "Save Policy"

### Menambahkan Policy untuk UPDATE (mengubah foto profil)

1. Klik "Add Policies"
2. Pilih "UPDATE" (Update)
3. Pilih "Kustom"
4. Isi form kebijakan:
   - **Policy name**: Users Can Update Their Own Avatar
   - **Target roles**: authenticated
   - **Policy definition**: `bucket_id = 'avatars' AND auth.uid()::text = name`
5. Klik "Save Policy"

### Menambahkan Policy untuk DELETE (menghapus foto profil)

1. Klik "Add Policies"
2. Pilih "DELETE" (Delete)
3. Pilih "Kustom"
4. Isi form kebijakan:
   - **Policy name**: Users Can Delete Their Own Avatar
   - **Target roles**: authenticated
   - **Policy definition**: `bucket_id = 'avatars' AND auth.uid()::text = name`
5. Klik "Save Policy"

## 3. Menggunakan SQL Editor (Alternatif)

Sebagai alternatif untuk mengatur melalui UI, Anda dapat menggunakan SQL Editor di Supabase:

1. Pergi ke bagian "SQL Editor" di menu sidebar
2. Klik "New Query"
3. Copy dan paste SQL dari file `supabase_bucket_setup.sql` dan jalankan
4. Copy dan paste SQL dari file `supabase_avatar_policies.sql` dan jalankan

## 4. Menguji Setup

Setelah semua langkah di atas selesai:

1. Buka aplikasi UrFinance
2. Pergi ke halaman Settings → Account
3. Klik ikon kamera pada avatar untuk mengupload foto profil
4. Pilih file gambar dan verifikasi bahwa upload berhasil

## Catatan Penting

- Pastikan ukuran file tidak melebihi batas (sebaiknya di bawah 10MB)
- Format file yang didukung: JPG, PNG, GIF, WEBP
- Foto profil disimpan dengan nama file yang sama dengan UUID pengguna
- Jika masih muncul error, pastikan untuk memeriksa log di browser console

## Troubleshooting

Jika masih mengalami masalah:

1. **Error "Bucket not found"**: Pastikan bucket "avatars" telah dibuat dengan benar
2. **Error "Not authorized"**: Periksa kebijakan akses sudah sesuai
3. **Foto tidak tampil**: Pastikan bucket diatur sebagai publik
4. **Error lainnya**: Cek browser console untuk informasi error lebih detail

Semoga panduan ini membantu dalam mengatur penyimpanan avatar di aplikasi UrFinance! 