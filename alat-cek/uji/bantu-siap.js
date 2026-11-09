// Alat bantu uji Chrome: sesudah halaman dimuat ulang, tunggu sampai aplikasi benar-benar siap (skrip terakhir,
// fitur/dashboard/dashboard.js, sudah berjalan), bukan menunggu waktu tetap. Waktu tetap kadang kurang saat komputer sibuk,
// sehingga uji gagal acak di tempat yang berbeda-beda.
// Pemakaian: const siapUji = require("./bantu-siap.js"); ... await kirim("Page.reload"); await siapUji(evalJs, tunggu);
module.exports = async function siapUji(evalJs, tunggu) {
  await tunggu(200);
  for (let i = 0; i < 150; i++) {
    try {
      if (await evalJs("document.readyState==='complete' && typeof gambarDashboard==='function'")) { break; }
    } catch (galat) { /* halaman masih berganti */ }
    await tunggu(100);
  }
  await tunggu(250);   // memberi waktu tampilan awal (dan alat bantu pengguna) selesai
};
