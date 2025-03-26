# Panduan Integrasi Avatar di Supabase untuk UrFinance

Dokumen ini berisi panduan langkah demi langkah untuk mengintegrasikan fitur foto profil (avatar) dengan penyimpanan Supabase.

## Langkah 1: Persiapan Supabase

### Membuat Bucket Storage

1. Login ke dashboard Supabase Anda
2. Pergi ke bagian **Storage** di menu sidebar kiri
3. Klik tombol **New Bucket**
4. Isi informasi bucket:
   - **Name**: `avatars` (pastikan huruf kecil semua dan tanpa spasi)
   - **Public bucket**: Centang opsi ini untuk memungkinkan akses publik 
   - **File size limit**: 5 MB (opsional)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp` (opsional)
5. Klik **Create bucket** untuk membuat bucket

### Mengatur Kebijakan Akses (Policies)

Setelah bucket dibuat, Anda perlu menambahkan 4 kebijakan akses:

#### 1. Kebijakan SELECT (Untuk Melihat Foto Profil)

1. Klik bucket **avatars** yang baru dibuat
2. Klik tab **Policies**
3. Klik **New Policy**
4. Pilih **SELECT** dari opsi yang tersedia
5. Isi formulir:
   - **Policy name**: `Public Access for Avatars`
   - **Policy definition**: `bucket_id = 'avatars'`
   - **Target roles**: `Public`
6. Klik **Save Policy**

#### 2. Kebijakan INSERT (Untuk Mengunggah Foto Profil)

1. Klik **New Policy**
2. Pilih **INSERT** dari opsi yang tersedia
3. Isi formulir:
   - **Policy name**: `Users Can Upload Their Own Avatar`
   - **Policy definition**: `bucket_id = 'avatars' AND auth.uid()::text = name`
   - **Target roles**: `Authenticated`
4. Klik **Save Policy**

#### 3. Kebijakan UPDATE (Untuk Memperbarui Foto Profil)

1. Klik **New Policy**
2. Pilih **UPDATE** dari opsi yang tersedia
3. Isi formulir:
   - **Policy name**: `Users Can Update Their Own Avatar`
   - **Policy definition**: `bucket_id = 'avatars' AND auth.uid()::text = name`
   - **Target roles**: `Authenticated`
4. Klik **Save Policy**

#### 4. Kebijakan DELETE (Untuk Menghapus Foto Profil)

1. Klik **New Policy**
2. Pilih **DELETE** dari opsi yang tersedia
3. Isi formulir:
   - **Policy name**: `Users Can Delete Their Own Avatar`
   - **Policy definition**: `bucket_id = 'avatars' AND auth.uid()::text = name`
   - **Target roles**: `Authenticated`
4. Klik **Save Policy**

### Menggunakan SQL Editor (Alternatif)

Sebagai alternatif untuk mengatur melalui UI, Anda dapat menggunakan SQL Editor:

1. Pergi ke bagian **SQL Editor** di menu sidebar
2. Klik **New Query**
3. Copy dan paste SQL berikut dan jalankan:

```sql
-- 1. CREATE BUCKET IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'avatars'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatars', 
            'avatars', 
            TRUE, 
            5242880, -- 5MB
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
        );
    ELSE
        UPDATE storage.buckets
        SET 
            public = TRUE,
            file_size_limit = 5242880,
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
        WHERE name = 'avatars';
    END IF;
END
$$;

-- 2. DELETE EXISTING POLICIES IF ANY
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access for Avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users Can Upload Their Own Avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users Can Update Their Own Avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users Can Delete Their Own Avatar" ON storage.objects;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error removing existing policies: %', SQLERRM;
END
$$;

-- 3. CREATE NEW POLICIES
-- Policy for PUBLIC READ access
CREATE POLICY "Public Access for Avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
);

-- Policy for AUTHENTICATED INSERT
CREATE POLICY "Users Can Upload Their Own Avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = name
);

-- Policy for AUTHENTICATED UPDATE
CREATE POLICY "Users Can Update Their Own Avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = name
);

-- Policy for AUTHENTICATED DELETE
CREATE POLICY "Users Can Delete Their Own Avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = name
);
```

## Langkah 2: Verifikasi Setup

Setelah menerapkan semua kebijakan, pastikan bahwa:

1. Bucket **avatars** terdaftar di bagian Storage Supabase
2. Bucket ditandai sebagai **Public**
3. 4 kebijakan terlihat di tab **Policies**:
   - `Public Access for Avatars` (SELECT)
   - `Users Can Upload Their Own Avatar` (INSERT)
   - `Users Can Update Their Own Avatar` (UPDATE)
   - `Users Can Delete Their Own Avatar` (DELETE)

## Langkah 3: Ujicoba Aplikasi

1. Restart server aplikasi dengan `npm run dev`
2. Login ke aplikasi UrFinance
3. Buka halaman **Settings**
4. Klik ikon kamera pada avatar untuk mengunggah foto profil
5. Pilih file gambar yang valid (JPG, PNG, WEBP, atau GIF)
6. Verifikasi bahwa foto profil berhasil diunggah dan ditampilkan

## Troubleshooting

### Error: "Bucket not found"

**Penyebab**: Bucket 'avatars' belum dibuat atau memiliki nama yang berbeda.

**Solusi**:
- Pastikan Anda telah membuat bucket dengan nama persis "avatars" (semua huruf kecil)
- Periksa apakah ada typo dalam nama bucket di kode atau di Supabase

### Error: "Not authorized"

**Penyebab**: Kebijakan akses belum diatur dengan benar.

**Solusi**:
- Pastikan semua 4 kebijakan akses telah dibuat
- Verifikasi bahwa kondisi kebijakan persis sama dengan yang diberikan di panduan ini
- Periksa peran target (public untuk SELECT, authenticated untuk lainnya)

### Error: "Failed to get public URL"

**Penyebab**: Bucket tidak diatur sebagai publik atau file tidak ada.

**Solusi**:
- Pastikan bucket diatur sebagai publik
- Periksa apakah file berhasil diunggah (lihat tab Contents di bucket)

### Foto Profil Tidak Muncul

**Penyebab**: Masalah cache browser atau file tidak terlihat.

**Solusi**:
- Hard refresh browser (Ctrl+F5 atau Cmd+Shift+R)
- Periksa apakah file terlihat di tab Contents bucket 'avatars'
- Periksa URL gambar di developer tools (F12 -> Elements)

### Error Lainnya

Untuk error lain, periksa konsol browser (F12 -> Console) untuk pesan error yang lebih spesifik. Error yang umum meliputi:

- **CORS Error**: Pastikan domain aplikasi Anda diizinkan di pengaturan API Supabase
- **Size Limit Error**: Pastikan gambar tidak melebihi batas ukuran bucket (default: 5MB)
- **Rate Limit Error**: Terlalu banyak permintaan dalam waktu singkat, coba lagi nanti

## Tips Tambahan

1. **Nama File**: Aplikasi menyimpan avatar dengan nama file yang sama dengan UUID pengguna
2. **Caching**: Aplikasi menambahkan timestamp ke URL gambar untuk mencegah caching
3. **Retry Logic**: Aplikasi mencoba memuat gambar hingga 3 kali jika gagal pertama kali
4. **Fallback**: Jika gambar gagal dimuat, aplikasi akan menampilkan avatar dengan inisial

## Kesimpulan

Dengan mengikuti panduan ini, Anda telah berhasil mengintegrasikan fitur foto profil di aplikasi UrFinance menggunakan Supabase Storage. Pengguna sekarang dapat mengunggah, memperbarui, dan menghapus foto profil mereka, dan foto akan tersedia di seluruh aplikasi. 