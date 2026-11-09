// Alat bantu uji (BUKAN bagian aplikasi): uji otomatis "sudah masuk" sebagai pengguna uji, karena sejak J.25 aplikasi
// pindah ke layar Masuk kalau belum masuk (umum/sesi.js). Pengguna uji ditambahkan ke daftar pengguna kalau belum ada,
// lalu sesinya dipasang. Namanya "Pengguna", sama dengan nama bawaan sebelum ada login, supaya harapan uji lama tetap.
// Kata sandinya sengaja tidak bisa dipakai masuk (hash palsu): pengguna uji hanya ada di dalam uji.
//   jsdom : new JSDOM(html, { ..., beforeParse: require("./bantu-sesi.js").pasang })
//   Chrome: await require("./bantu-sesi.js").masukChrome(kirim, alamatIndex)  (sesudah Page.enable)
const SKRIP = `(function () {
  try {
    var uji = { id: "u-uji", nama: "Pengguna", username: "pengguna-uji", kontak: "", peran: "finance-yayasan",
                pembukuan: ["yayasan", "sekolah", "unit-usaha"], nonAktif: false, wajibGantiSandi: false,
                sandi: { garam: "00", hash: "00", iterasi: 1 } };
    var daftar;
    try { daftar = JSON.parse(localStorage.getItem("daftarPengguna") || "[]"); } catch (e) { daftar = null; }
    if (Array.isArray(daftar) && !daftar.some(function (p) { return p && p.id === "u-uji"; })) {
      daftar.push(uji);
      localStorage.setItem("daftarPengguna", JSON.stringify(daftar));
    }
    // Sesi lama yang sudah ada (misalnya uji peran Pengawas) dibiarkan; kalau belum ada, masuk sebagai pengguna uji
    if (!sessionStorage.getItem("sesiMasuk")) {
      sessionStorage.setItem("sesiMasuk", JSON.stringify({ penggunaId: "u-uji", nama: "Pengguna", peran: "finance-yayasan",
        pembukuan: ["yayasan", "sekolah", "unit-usaha"], terakhirAktif: Date.now(), baruMasuk: false }));
    } else {
      var s = JSON.parse(sessionStorage.getItem("sesiMasuk")); s.terakhirAktif = Date.now();
      sessionStorage.setItem("sesiMasuk", JSON.stringify(s));
    }
  } catch (galat) { /* alat bantu uji tidak boleh mengganggu uji */ }
})();`;

module.exports = {
  SKRIP,
  // jsdom: dipasang sebelum skrip halaman berjalan
  pasang(w) { w.eval(SKRIP); },
  // Chrome: dipasang untuk setiap muat halaman berikutnya, lalu index.html dibuka ulang (pemuatan pertama sudah pindah ke login.html)
  async masukChrome(kirim, url) {
    await kirim("Page.addScriptToEvaluateOnNewDocument", { source: SKRIP });
    await kirim("Page.navigate", { url });
    await new Promise(r => setTimeout(r, 600));
  }
};
