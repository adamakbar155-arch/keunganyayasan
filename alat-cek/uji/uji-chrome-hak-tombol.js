// Penerapan hak Akses Grup, langkah 2 (J.31, PRD 6.14): tombol Data Baru / Simpan / Hapus dan pintasan mengikuti hak Buat, Ubah,
// Hapus; penjaga tombol Simpan (juga requestSubmit), penjaga Hapus, pengaman kedua modul.simpan, dan penjaga khusus (Laporan
// Tersimpan, Rekonsiliasi Bank, Desain Cetakan, Transaksi Favorit), di Chrome asli.
// Pemakaian: node uji-chrome-hak-tombol.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9412;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description) + " <<< " + e.slice(0, 160)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(!!ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); };
const pesanNotif = () => evalJs("[...document.querySelectorAll('.notifikasi p')].map(function(p){return p.textContent;}).join(' | ')");
const bersihkanNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
// Elemen pertama yang cocok di halaman, terlihat atau tidak
const terlihat = (sel) => evalJs("(function(){var e=[...document.querySelectorAll(" + JSON.stringify(sel) + ")].filter(function(x){return x.getClientRects().length>0;}); return e.length>0;})()");
const masukSebagai = (idPengguna) => evalJs("sessionStorage.setItem('sesiMasuk', JSON.stringify({ penggunaId: '" + idPengguna + "', nama: 'Uji', terakhirAktif: Date.now(), baruMasuk: false })); true");
const daftar = (kunci) => evalJs("localStorage.getItem('" + kunci + "')").then(t => JSON.parse(t || "[]"));

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    const galat = [];
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/"));
    // Data rekaan. Grup Staf: Divisi hanya Buat; Program hanya Ubah + Hapus; Kategori Donasi Buat (menyimpan akun ikutan);
    // Laporan Keuangan + Laporan Tersimpan hanya Aktif; Rekonsiliasi Bank dan Desain Cetakan hanya Aktif; Jurnal Umum Buat.
    // Divisi Lama dan Program Lama dibuat Operator itu sendiri (tanpa hak Lihat, data buatan orang lain tidak bisa dibuka; langkah 3).
    await evalJs(`localStorage.clear();
      localStorage.setItem("daftarAksesGrup", JSON.stringify([{ id: "ag-1", nama: "Staf", pembatasan: "preferensi", hak: {
        divisi: ["aktif", "buat"], program: ["aktif", "ubah", "hapus"], "kategori-donasi": ["aktif", "buat"], jurnal: ["aktif", "buat"],
        "laporan-keuangan": ["aktif"], "laporan-tersimpan": ["aktif"], "rekonsiliasi-bank": ["aktif"], cetakan: ["aktif"] } }]));
      localStorage.setItem("daftarPengguna", JSON.stringify([
        { id: "u-staf", nama: "Staf Satu", username: "staf", kontak: "", jenisAkses: "operator", aksesGrupId: "ag-1", nonAktif: false, sandi: { garam: "00", hash: "00", iterasi: 1 } }
      ]));
      localStorage.setItem("daftarDivisi", JSON.stringify([{ id: "d-lama", nama: "Divisi Lama", keterangan: "", dibuatOlehId: "u-staf" }]));
      localStorage.setItem("daftarProgram", JSON.stringify([{ id: "p-lama", nama: "Program Lama", divisiId: "d-lama", status: "aktif", keterangan: "", dibuatOlehId: "u-staf" }]));
      true`);
    await muatUlang();
    await masukSebagai("u-staf"); await muatUlang();

    // 1) Divisi: hanya Buat
    await evalJs("bukaDivisiBaru(); true"); await tunggu(250);
    catat("Divisi (Buat): formulir Data Baru terbuka, tombol Simpan tampil", await evalJs("!document.getElementById('isi-divisi').hidden && document.getElementById('isi-divisi').dataset.mode==='baru'") && await terlihat("#isi-divisi .tombol-simpan-besar"));
    await evalJs("document.getElementById('divisi-nama').value='Divisi Baru'; document.getElementById('form-divisi').requestSubmit(); true"); await tunggu(250);
    catat("Divisi (Buat): data baru tersimpan", (await daftar("daftarDivisi")).some(d => d.nama === "Divisi Baru"));
    await evalJs("modulDivisi.bukaUbah(modulDivisi.ambil().find(function(d){return d.id==='d-lama';})); true"); await tunggu(250);
    catat("Divisi (tanpa Ubah/Hapus): data lama dibuka, tombol Simpan dan Hapus tidak tampil", await evalJs("document.getElementById('isi-divisi').dataset.mode==='ubah'") && !(await terlihat("#isi-divisi .tombol-simpan-besar")) && !(await terlihat("#isi-divisi [data-aksi='hapus']")));
    await foto("hak-divisi-ubah.png");
    await bersihkanNotif();
    await evalJs("document.getElementById('divisi-nama').value='Diubah Paksa'; document.getElementById('form-divisi').requestSubmit(); true"); await tunggu(250);
    catat("Divisi: simpan paksa data lama (requestSubmit/Ctrl+S) ditolak dengan pesan, data tetap", (await pesanNotif()).indexOf("tidak mengizinkan mengubah data") !== -1 && (await daftar("daftarDivisi")).some(d => d.id === "d-lama" && d.nama === "Divisi Lama"));
    await bersihkanNotif();
    await evalJs("modulDivisi.hapus(modulDivisi.ambil().find(function(d){return d.id==='d-lama';})); true"); await tunggu(150);
    catat("Divisi: hapus lewat kode ditolak dengan pesan, tanpa konfirmasi", (await pesanNotif()).indexOf("tidak mengizinkan menghapus data") !== -1 && !(await evalJs("document.getElementById('dialog-konfirmasi').open")));

    // 2) Program: Ubah + Hapus, tanpa Buat
    await bersihkanNotif();
    await evalJs("bukaProgramBaru(); true"); await tunggu(250);
    catat("Program (tanpa Buat): dari menu langsung ke Daftar, tombol + dan tab Data Baru tidak ada", await evalJs("!document.getElementById('isi-program').hidden") && !(await terlihat("#isi-program [data-alat='baru']")) && !(await terlihat("#isi-program .modul-tab[data-kunci='baru']")) && await terlihat("#isi-program .tabel-daftar"));
    catat("Program: membuka dari menu tidak memunculkan pesan penolakan", (await pesanNotif()) === "");
    await foto("hak-program-daftar.png");
    await evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', code: 'KeyN', altKey: true, bubbles: true })); true"); await tunggu(200);
    catat("Program: pintasan Alt+N ditolak dengan pesan, formulir tidak terbuka", (await pesanNotif()).indexOf("tidak mengizinkan membuat data baru") !== -1 && await evalJs("document.querySelector('#isi-program .modul-form').hidden"));
    await evalJs("modulProgram.bukaUbah(modulProgram.ambil()[0]); true"); await tunggu(250);
    catat("Program (Ubah + Hapus): data lama dibuka, Simpan dan Hapus tampil", await terlihat("#isi-program .tombol-simpan-besar") && await terlihat("#isi-program [data-aksi='hapus']"));
    await evalJs("document.getElementById('program-keterangan').value='diubah staf'; document.getElementById('form-program').requestSubmit(); true"); await tunggu(250);
    catat("Program: perubahan tersimpan", (await daftar("daftarProgram"))[0].keterangan === "diubah staf");

    // 3) Kategori Donasi (Buat): penyimpanan ikutan (akun pendapatan) tetap boleh
    await evalJs("bukaKategoriDonasiBaru(); true"); await tunggu(250);
    await evalJs("document.getElementById('kd-nama').value='Infaq Uji'; var s=document.getElementById('kd-induk'); s.value=[...s.options].find(function(o){return o.value;}).value; s.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('form-kategori-donasi').requestSubmit(); true"); await tunggu(300);
    catat("Kategori Donasi (Buat): kategori dan akun ikutannya tersimpan", (await daftar("daftarKategoriDonasi")).some(k => k.nama === "Infaq Uji") && (await daftar("daftarAkun")).some(a => a.nama === "Infaq Uji"));

    // 4) Pengaman kedua: menyimpan dari halaman tanpa hak tulis (Dashboard) ditolak
    await evalJs("tutupTab('kategori-donasi'); true"); await tunggu(150); await bersihkanNotif();
    const sebelum = JSON.stringify(await daftar("daftarDivisi"));
    const simpanLangsung = await evalJs("modulDivisi.simpan([])");
    catat("Pengaman kedua: modul.simpan dari Dashboard ditolak, data tetap", simpanLangsung === false && JSON.stringify(await daftar("daftarDivisi")) === sebelum && (await pesanNotif()).indexOf("tidak mengizinkan menyimpan") !== -1);

    // 5) Penjaga khusus
    catat("Laporan Tersimpan (hanya Aktif): simpan dan hapus lewat kode ditolak", !(await evalJs("simpanDaftarLaporanTersimpan([], 'buat')")) && !(await evalJs("simpanDaftarLaporanTersimpan([], 'hapus')")));
    catat("Laporan Tersimpan: tombol Simpan Laporan disembunyikan", await evalJs("getComputedStyle(document.getElementById('lap-simpan')).display==='none'"));
    catat("Rekonsiliasi Bank (tanpa Ubah): menyimpan tanda ditolak", !(await evalJs("simpanTandaRekonsiliasi([])")));
    catat("Desain Cetakan (tanpa Ubah): tombol Simpan editor disembunyikan", await evalJs("getComputedStyle(document.getElementById('ec-simpan')).display==='none'"));
    await evalJs("bukaJurnalBaru(); true"); await tunggu(250);
    catat("Jurnal Umum (Buat, tanpa hak Transaksi Favorit): tombol Favorit tidak tampil", !(await terlihat("#isi-jurnal [data-favorit-ambil]")) && !(await terlihat("#isi-jurnal [data-favorit-lain]")));
    await foto("hak-jurnal-baru.png");

    // 6) Administrator: semua tombol kembali
    await masukSebagai("u-uji"); await muatUlang();
    await evalJs("modulDivisi.bukaUbah(modulDivisi.ambil().find(function(d){return d.id==='d-lama';})); bukaTab('divisi'); true"); await tunggu(250);
    catat("Administrator: Simpan dan Hapus tampil di data lama Divisi; tidak ada data-tanpa-hak", await terlihat("#isi-divisi .tombol-simpan-besar") && await terlihat("#isi-divisi [data-aksi='hapus']") && await evalJs("document.body.dataset.tanpaHak===''"));

    catat("Tidak ada galat skrip", galat.length === 0, galat.join(" | "));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
