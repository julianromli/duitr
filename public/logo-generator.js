/**
 * Duitr Logo Generator
 * 
 * Script untuk menghasilkan semua versi logo dari satu file SVG master
 * 
 * Cara penggunaan:
 * 1. Edit file duitr-logo.svg untuk mengubah logo utama
 * 2. Jalankan script ini untuk menghasilkan semua versi yang diperlukan
 * 3. Semua logo dan icon akan diperbarui secara otomatis
 */

(function() {
  // Utility untuk mendapatkan warna background dan warna teks dari SVG asli
  function extractColors(svgString) {
    const bgColorMatch = svgString.match(/rect.*?fill="(.*?)"/);
    const textColorMatch = svgString.match(/text.*?fill="(.*?)"/);
    
    return {
      backgroundColor: bgColorMatch ? bgColorMatch[1] : '#C6FE1E',
      textColor: textColorMatch ? textColorMatch[1] : '#000000'
    };
  }
  
  // Fungsi untuk menghasilkan logo PWA dalam berbagai ukuran
  function generatePWAIcons(svgString, colors) {
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    const iconTemplate = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="SIZE" height="SIZE">
        <rect width="100" height="100" rx="28" fill="${colors.backgroundColor}" />
        <text x="50" y="68" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="60" fill="${colors.textColor}">D</text>
      </svg>
    `;
    
    // Untuk setiap ukuran, hasilkan file SVG dan simpan
    sizes.forEach(size => {
      const iconSvg = iconTemplate.replace(/SIZE/g, size);
      saveToFile(`pwa-icons/icon-${size}x${size}.svg`, iconSvg);
      
      // Juga hasilkan PNG jika diperlukan 
      // Catatan: Konversi ke PNG memerlukan library tambahan pada server
      console.log(`Icon ${size}x${size} dibuat`);
    });
    
    // Hasilkan juga icon maskable
    const maskableIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">
        <rect width="100" height="100" fill="${colors.backgroundColor}" />
        <text x="50" y="68" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="60" fill="${colors.textColor}">D</text>
      </svg>
    `;
    saveToFile('pwa-icons/maskable-icon.svg', maskableIcon);
    
    // Hasilkan apple-touch-icon
    const appleTouchIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="180" height="180">
        <rect width="100" height="100" rx="28" fill="${colors.backgroundColor}" />
        <text x="50" y="68" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="60" fill="${colors.textColor}">D</text>
      </svg>
    `;
    saveToFile('pwa-icons/apple-touch-icon.svg', appleTouchIcon);
  }
  
  // Fungsi untuk menghasilkan favicon
  function generateFavicon(svgString, colors) {
    const faviconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32">
        <rect width="100" height="100" rx="28" fill="${colors.backgroundColor}" />
        <text x="50" y="68" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="60" fill="${colors.textColor}">D</text>
      </svg>
    `;
    saveToFile('favicon.svg', faviconSvg);
    console.log('Favicon dibuat');
  }
  
  // Fungsi untuk menghasilkan logo aplikasi
  function generateAppLogo(svgString, colors) {
    // Simpan logo aplikasi utama (sama dengan master SVG)
    saveToFile('app-logo.svg', svgString);
    console.log('Logo aplikasi dibuat');
  }
  
  // Fungsi untuk menyimpan file (hanya sebagai placeholder, perlu implementasi sebenarnya pada server)
  function saveToFile(filename, content) {
    // Di browser ini hanya placeholder, perlu implementasi server-side
    console.log(`Menyimpan ${filename}`);
    
    // Buat link download jika dijalankan di browser
    if (typeof document !== 'undefined') {
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(content));
      downloadLink.setAttribute('download', filename);
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }
  
  // Fungsi utama
  function generateAllLogos(svgString) {
    try {
      // Ekstrak warna dari SVG yang diberikan
      const colors = extractColors(svgString);
      
      // Hasilkan semua versi logo
      generatePWAIcons(svgString, colors);
      generateFavicon(svgString, colors);
      generateAppLogo(svgString, colors);
      
      console.log('Semua logo berhasil dibuat!');
      console.log('Warna yang digunakan:', colors);
      alert('Semua ikon telah dihasilkan dan diunduh sebagai file SVG.');
    } catch (error) {
      console.error('Error saat menghasilkan logo:', error);
      alert('Terjadi kesalahan saat menghasilkan logo. Periksa konsol untuk detail.');
    }
  }
  
  // Expose fungsi ke global scope untuk digunakan di UI
  window.duitrLogo = {
    generateAllLogos,
    // Fungsi tambahan untuk memperbarui elemen tertentu
    updatePageLogos: function() {
      fetch('/duitr-logo.svg')
        .then(response => response.text())
        .then(svgString => {
          // Perbarui logo yang ada di halaman
          const logoElements = document.querySelectorAll('.duitr-logo');
          logoElements.forEach(el => {
            el.innerHTML = svgString;
          });
          console.log(`${logoElements.length} logo diperbarui di halaman`);
        });
    }
  };
  
  // Auto-run jika parameter autorun=true di URL
  if (typeof window !== 'undefined' && window.location.search.includes('autorun=true')) {
    document.addEventListener('DOMContentLoaded', () => {
      fetch('/duitr-logo.svg')
        .then(response => response.text())
        .then(svgString => {
          generateAllLogos(svgString);
        });
    });
  }
})(); 