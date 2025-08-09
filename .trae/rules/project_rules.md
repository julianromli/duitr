## Duitr Project Rules

1. **Coding Standards**
   - Semua kode frontend wajib menggunakan TypeScript.
   - Berikan komentar minimal di setiap fungsi utama dan komponen kompleks.
   - Struktur folder wajib mengikuti pola di README (src/components, src/context, dsb).

2. **UI/UX**
   - Seluruh komponen UI WAJIB memakai Shadcn UI sebagai basis, kecuali kebutuhan custom logic.
   - Styling hanya dengan Tailwind CSS (jangan gunakan CSS framework atau utility lain).
   - Animasi harus memakai Framer Motion dan smooth.

3. **API & Library Usage**
   - **Tidak boleh gunakan API deprecated—sebelum menulis kode, wajib cek dan refer doks library via Context7.**
   - Seluruh implementasi React, Next.js, Supabase, dsb selalu mengikuti versi & API terbaru.
   - Jika API/library berubah versi, update dokumen dan refactor file terkait.

4. **Internationalization**
   - Semua string aplikasi WAJIB memakai i18next, terdaftar di file translation.
   - Setiap update/fitur baru ikut update translation keys.
   - Dilarang menulis hardcoded text (baik Indonesia maupun Inggris) di komponen.

5. **SEO & Accessibility**
   - Setiap halaman wajib dilengkapi meta tag: title, description, canonical, dan og:image.
   - Ikon dan favicon selalu dikustom melalui guideline di /favicon-customizer.html.
   - Semua button/navigasi wajib ada aria-label dan tab-index.

6. **Data & Backend**
   - Akses data hanya lewat Supabase, backend tidak boleh menyimpan secret atau sensitive key di frontend.
   - Row Level Security dan JWT WAJIB aktif sebelum production build.

7. **State Management**
   - Server state selalu pakai React Query (Tanstack).
   - Client state harus via Context Provider, dilarang memakai Redux/MobX.

8. **Testing & Quality**
   - Komponen utama dan service layer WAJIB ada unit test (Jest/Vitest).
   - Validasi input hanya lewat Zod (no manual validation).
   - Jangan deploy production sebelum semua test lintas bahasa dan device lolos.

9. **PWA & Performance**
   - Selalu update manifest dan service worker.
   - Offline/cache mode WAJIB aktif di dashboard utama.

10. **Branding & Customization**
    - Logo dan favicon update hanya di public/ dan memakai tools project (logo-generator, favicon-customizer).
    - Data social proof dan CTA landing page wajib update sesuai user aktif.

11. **Contributing & Docs**
    - Ikuti urutan README untuk setup dan workflow.
    - Setiap PR wajib ada changelog dan screenshot jika berpengaruh ke UI.
    - Semua penjelasan AI feature/insight di translation dan docs selalu update.

12. **Security**
    - Tidak boleh commit environment variable (.env) ke repo publik.
    - Semua input dari user divalidasi lewat Zod.
    - Tidak boleh echo field sensitive di output/error.

13. **Deployment**
    - Build/dev/deploy hanya lewat npm script resmi.
    - Selalu update log build di release notes setiap rilis.