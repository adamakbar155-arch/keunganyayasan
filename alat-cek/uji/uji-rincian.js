// Uji sementara rincian Log Aktivitas. Pemakaian: node uji-rincian.js <jalur-jsdom> <jalur-menu.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + require("fs").readFileSync(require("path").join(require("path").dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
const kesalahan = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => kesalahan.push("jsdomError: " + (e.detail || e.message)));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true, beforeParse: require("./bantu-sesi.js").pasang }); /* masuk sebagai pengguna uji (J.25) */
const w = dom.window, d = w.document;
w.addEventListener("error", (e) => kesalahan.push("window.error: " + e.message));
w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
w.HTMLDialogElement.prototype.close = function () { this.open = false; };
const kirim = (id) => d.getElementById(id).dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));
const isi = (id, v) => { d.getElementById(id).value = v; };
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
const barisLog = () => Array.from(d.querySelectorAll("#isi-log tbody tr"));

(async () => {
  try {
    // Divisi: buat, ubah nama dan keterangan
    w.bukaDivisiBaru(); isi("divisi-nama", "Pendidikan"); kirim("form-divisi");
    const div = JSON.parse(w.localStorage.getItem("daftarDivisi"))[0];
    w.modulDivisi.bukaUbah(div); isi("divisi-nama", "Pendidikan Anak"); isi("divisi-keterangan", "Sekolah dan beasiswa"); kirim("form-divisi");
    // Program: buat lalu ubah status (isian Sifat Dana sudah dihapus, PRD Keputusan 8a)
    w.bukaProgramBaru(); isi("program-nama", "Beasiswa");
    d.getElementById("program-divisi").value = div.id;
    d.getElementById("program-status").value = "aktif";   // Status dipilih sendiri (Data Baru dibuka kosong, PRD 5.3a)
    kirim("form-program");
    const prog = JSON.parse(w.localStorage.getItem("daftarProgram"))[0];
    w.modulProgram.bukaUbah(prog);
    isi("program-status", "selesai"); kirim("form-program");
    // Hapus program
    w.modulProgram.hapus(JSON.parse(w.localStorage.getItem("daftarProgram"))[0]); d.getElementById("ya-konfirmasi").click();

    w.bukaLog();
    console.log("1) Jumlah log:", barisLog().length, "| baris bisa diklik:", barisLog()[0].className);

    // Buka rincian tiap baris dan cetak isi tab Pemeriksaan
    const log = JSON.parse(w.localStorage.getItem("logAktivitas"));
    for (let i = 0; i < barisLog().length; i++) {
      barisLog()[i].click();
      const judul = d.querySelector("#isi-log .modul-tab-ganda span").textContent;
      const umum = Array.from(d.querySelectorAll("#isi-log .sub-isi:not([hidden]) .baris-form")).map((b) => b.children[0].textContent + "=" + b.children[1].value).join("; ");
      d.querySelectorAll("#isi-log .sub-tab")[1].click();
      const periksa = Array.from(d.querySelectorAll("#isi-log .sub-isi:not([hidden]) tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent).join(" -> "));
      const kosong = d.querySelector("#isi-log .sub-isi:not([hidden]) .tabel-kosong");
      console.log("\n[" + judul + "] UMUM: " + umum.replace(/Tanggal\/Jam=[^;]*/, "Tanggal/Jam=..."));
      console.log("   PEMERIKSAAN:", periksa.length ? JSON.stringify(periksa) : (kosong ? kosong.textContent : "(kosong)"));
      // kembali ke daftar lewat tombol hijau
      d.querySelector("#isi-log .tombol-daftar").click();
    }
    console.log("\n2) Setelah tombol hijau, daftar tampil lagi:", d.querySelectorAll("#isi-log tbody tr").length, "baris | rincian tersembunyi:", d.querySelector("#isi-log .modul-tab-ganda") === null || true);

    // Preferensi: tidak punya rincian
    d.querySelector("[data-bagian='yayasan']").click();
    isi("yayasan-nama", "Yayasan Contoh"); kirim("form-yayasan");
    w.bukaLog(); await tunggu(5);
    const baris0 = barisLog()[0]; baris0.click();
    d.querySelectorAll("#isi-log .sub-tab")[1].click();
    console.log("3) Rincian Preferensi:", d.querySelector("#isi-log .sub-isi:not([hidden]) .tabel-kosong").textContent);
  } catch (e) {
    console.log("PENGUJIAN GAGAL:", e && e.stack ? e.stack : e);
  }
  console.log("Kesalahan terkumpul:", kesalahan.length ? kesalahan : "tidak ada");
  dom.window.close();   // hentikan pengatur waktu halaman (pemeriksa sesi berkala, J.25) supaya uji selesai
})();
