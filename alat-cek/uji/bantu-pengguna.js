// Alat bantu uji Chrome (BUKAN bagian aplikasi): meniru pengguna yang langsung mengisi kepala formulir Data Baru.
// Sejak PRD 5.3a, Data Baru dibuka kosong: Tanggal, aturan Nomor, dan beberapa pilihan harus diisi pengguna. Uji lama
// yang menguji hal lain (rincian, simpan, jurnal) memakai ini supaya tidak perlu mengisi kepala di setiap langkah.
// Cara kerja: setiap 30 ms, kalau aplikasi sudah selesai dimuat dan ada formulir Data Baru yang tampil, isian kepalanya yang
// MASIH KOSONG diisi seperti pengguna: Tanggal = hari ini, aturan Nomor = aturan pertama, dan pilihan khusus beberapa halaman.
// Isian yang sudah terisi tidak diubah. Bahwa Data Baru benar-benar dibuka kosong diuji terpisah (uji-chrome-formulir-bersih.js).
// Pemakaian di uji: await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") });
module.exports = `(function () {
  function isi(el, nilai) {
    if (!el || el.disabled || el.value !== "") { return; }
    el.value = nilai;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function pilihPertama(el) {
    if (!el || el.disabled || el.value !== "") { return; }
    var o = Array.prototype.find.call(el.options, function (x) { return x.value !== ""; });
    if (o) { isi(el, o.value); }
  }
  function isiKepala(halaman, form) {
    var hari = tanggalHariIni();
    form.querySelectorAll('input[type="date"][id$="-tanggal"], input[type="date"][id$="jatuh-tempo"]').forEach(function (el) { isi(el, hari); });
    form.querySelectorAll('select[id$="-aturan-nomor"]').forEach(function (el) {
      var saklar = document.getElementById(el.id.replace("-aturan-nomor", "-nomor-otomatis"));
      if (!saklar || saklar.checked) { pilihPertama(el); }
    });
    if (halaman.id === "isi-pgaji") {
      isi(document.getElementById("pgaji-tipe"), "bulanan");
      isi(document.getElementById("pgaji-bulan"), String(Number(hari.slice(5, 7))));
      isi(document.getElementById("pgaji-tahun"), hari.slice(0, 4));
    }
    if (halaman.id === "isi-donasi-catat") { isi(document.getElementById("dc-cara-bayar"), "Tunai"); }
    if (form.querySelector('input[name="pd-jenis"]') && !form.querySelector('input[name="pd-jenis"]:checked')) {
      var r = form.querySelector('input[name="pd-jenis"][value="ke-umum"]');
      r.checked = true;
      r.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  setInterval(function () {
    if (document.readyState !== "complete" || typeof gambarDashboard !== "function") { return; }   // aplikasi belum selesai dimuat
    try {
      document.querySelectorAll('[id^="isi-"]').forEach(function (halaman) {
        if (halaman.hidden) { return; }
        var tab = halaman.querySelector(".tab-dokumen .modul-tab.aktif .tab-judul");
        var form = halaman.querySelector(".modul-form");
        if (tab && tab.textContent === "Data Baru" && form && !form.hidden) { isiKepala(halaman, form); }
      });
    } catch (galat) { /* alat bantu uji tidak boleh mengganggu uji */ }
  }, 30);
})();`;
