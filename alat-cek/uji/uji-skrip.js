// Skrip uji sementara: memuat menu.html di jsdom lalu menjalankan alur Divisi -> Program.
// Pemakaian: node uji-skrip.js <jalur-jsdom> <jalur-menu.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + require("fs").readFileSync(require("path").join(require("path").dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");

const kesalahan = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => kesalahan.push("jsdomError: " + (e.detail || e.message)));
vc.on("error", (e) => kesalahan.push("console.error: " + e));

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true, beforeParse: require("./bantu-sesi.js").pasang }); /* masuk sebagai pengguna uji (J.25) */
const w = dom.window;
w.addEventListener("error", (e) => kesalahan.push("window.error: " + e.message));
w.confirm = () => true;
w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
w.HTMLDialogElement.prototype.close = function () { this.open = false; };

function kirimSubmit(idForm) {
  const f = w.document.getElementById(idForm);
  f.dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));
}
function opsiDivisi() {
  return Array.from(w.document.getElementById("program-divisi").options).map((o) => o.textContent);
}

try {
  console.log("1) Muat halaman, error awal:", kesalahan.length ? kesalahan : "tidak ada");

  w.bukaDivisiBaru();
  w.document.getElementById("divisi-nama").value = "Pendidikan";
  kirimSubmit("form-divisi");
  console.log("2) localStorage daftarDivisi:", w.localStorage.getItem("daftarDivisi"));

  w.bukaProgramBaru();
  console.log("3) Pilihan divisi di form Program:", JSON.stringify(opsiDivisi()));
  console.log("   Baris Divisi tersembunyi?", w.document.getElementById("baris-program-divisi").hidden);

  // Tambah divisi lagi saat tab Program sudah terbuka, lalu klik tombol segarkan di daftar Program
  w.bukaDivisiBaru();
  w.document.getElementById("divisi-nama").value = "Sosial";
  kirimSubmit("form-divisi");
  // Kembali ke tab Program dengan KLIK TAB (bukan dari Master Data), seperti yang dilakukan pengguna
  w.document.querySelector("#tab-program .tab-judul").click();
  console.log("4) Pilihan divisi setelah menambah 'Sosial' lalu klik tab Program:", JSON.stringify(opsiDivisi()));

  // Simpan satu program lalu coba segarkan
  w.document.getElementById("program-nama").value = "Beasiswa";
  w.document.getElementById("program-divisi").selectedIndex = 1;
  kirimSubmit("form-program");   // isian Sifat Dana sudah dihapus (PRD Keputusan 8a)
  console.log("5) localStorage daftarProgram:", w.localStorage.getItem("daftarProgram"));

  const segarkan = w.document.querySelector("#isi-program [data-alat='segarkan']");
  console.log("6) Tombol segarkan ada?", !!segarkan);
  w.document.querySelector("#isi-program .tombol-daftar").click();
  segarkan.click();
  console.log("   Jumlah data di daftar Program:", w.document.querySelector("#isi-program [data-jumlah]").textContent);
  console.log("   Baris tabel Program:", w.document.querySelectorAll("#isi-program tbody tr").length);
} catch (e) {
  console.log("PENGUJIAN GAGAL:", e && e.stack ? e.stack : e);
}
console.log("Kesalahan terkumpul:", kesalahan.length ? kesalahan : "tidak ada");
dom.window.close();   // hentikan pengatur waktu halaman (pemeriksa sesi berkala, J.25) supaya uji selesai
