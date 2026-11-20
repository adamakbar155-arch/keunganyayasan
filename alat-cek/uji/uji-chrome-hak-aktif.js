// Penerapan hak Akses Grup, langkah 1 (J.31, PRD 6.14): menu dan halaman mengikuti centang Aktif, di Chrome asli.
// Operator tanpa grup hanya Dashboard; Operator bergrup hanya menu yang Aktif; Laporan per kategori; semua halaman terdaftar.
// Pemakaian: node uji-chrome-hak-aktif.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9409;
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
// Ikon menu samping yang tampil
const ikonTampil = () => evalJs("JSON.stringify([...document.querySelectorAll('.menu-samping .menu-item')].filter(function(a){return getComputedStyle(a).display!=='none';}).map(function(a){return a.id;}))").then(JSON.parse);
// Kotak yang tampil di satu popup
const kotakTampil = (panel) => evalJs("JSON.stringify([...document.querySelectorAll('#" + panel + " .kotak-menu')].filter(function(a){return getComputedStyle(a).display!=='none';}).map(function(a){return a.dataset.halaman;}))").then(JSON.parse);
const masukSebagai = (idPengguna, baru) => evalJs("sessionStorage.setItem('sesiMasuk', JSON.stringify({ penggunaId: '" + idPengguna + "', nama: 'Uji', terakhirAktif: Date.now(), baruMasuk: " + (baru ? "true" : "false") + " })); true");
const bukaTabUji = (nama) => evalJs("bukaTab('" + nama + "'); !document.getElementById('isi-" + nama + "').hidden");

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
    // Data rekaan: satu grup (Divisi, Jurnal Umum, Transaksi Favorit, laporan Keuangan dan Laporan Tersimpan), dua Operator,
    // dan dua laporan tersimpan (Keuangan dan Kas & Bank)
    await evalJs(`localStorage.clear();
      localStorage.setItem("daftarAksesGrup", JSON.stringify([{ id: "ag-1", nama: "Staf", pembatasan: "preferensi",
        hak: { divisi: ["aktif"], jurnal: ["aktif", "buat"], favorit: ["aktif"], "laporan-keuangan": ["aktif"], "laporan-tersimpan": ["aktif"] } }]));
      localStorage.setItem("daftarPengguna", JSON.stringify([
        { id: "u-tanpa", nama: "Tanpa Grup", username: "tanpa", kontak: "", jenisAkses: "operator", nonAktif: false, sandi: { garam: "00", hash: "00", iterasi: 1 } },
        { id: "u-staf", nama: "Staf Satu", username: "staf", kontak: "", jenisAkses: "operator", aksesGrupId: "ag-1", nonAktif: false, sandi: { garam: "00", hash: "00", iterasi: 1 } }
      ]));
      localStorage.setItem("daftarLaporanTersimpan", JSON.stringify([
        { id: "lt-1", nama: "Neraca Bulanan", laporanId: "posisi-keuangan", param: { dari: "2026-11-01", sampai: "2026-11-20" } },
        { id: "lt-2", nama: "Kas Bulanan", laporanId: "daftar-kas-bank", param: { dari: "2026-11-01", sampai: "2026-11-20" } }
      ])); true`);
    await muatUlang();

    // 1) Administrator: semua ikon, dan setiap halaman aplikasi terdaftar di daftar menu Hak Akses
    catat("Administrator: 7 ikon menu samping tampil", (await ikonTampil()).length === 7);
    const tanpaDaftar = await evalJs("JSON.stringify(daftarTab.filter(function(n){return n!=='dashboard' && n!=='laporan' && n!=='hasil-laporan' && HALAMAN_ADMINISTRATOR.indexOf(n)===-1 && !MENU_HAK[n];}))");
    catat("Setiap halaman aplikasi ada di daftar menu Hak Akses (tidak ada yang terlewat)", tanpaDaftar === "[]", tanpaDaftar);
    const kotakTanpaKunci = await evalJs("JSON.stringify([...document.querySelectorAll('.kotak-menu[data-halaman]')].map(function(k){return k.dataset.halaman;}).filter(function(n){return !KUNCI_MENU_DARI_NAMA[n] && ['Pengguna','Akses Grup','Preferensi','Cadangan Data'].indexOf(n)===-1;}))");
    catat("Setiap kotak menu punya pasangan di daftar menu Hak Akses", kotakTanpaKunci === "[]", kotakTanpaKunci);

    // 2) Operator tanpa grup: hanya Dashboard, diberi tahu saat masuk
    await masukSebagai("u-tanpa", true); await muatUlang();
    catat("Operator tanpa grup: pemberitahuan 'belum punya Akses Grup' saat masuk", (await pesanNotif()).indexOf("belum punya Akses Grup") !== -1);
    catat("Operator tanpa grup: tidak ada ikon menu samping", (await ikonTampil()).length === 0, JSON.stringify(await ikonTampil()));
    await bersihkanNotif();
    catat("Operator tanpa grup: halaman Divisi ditolak dengan pesan", !(await bukaTabUji("divisi")) && (await pesanNotif()).indexOf("tidak mencakup halaman ini") !== -1);
    catat("Operator tanpa grup: Laporan ditolak, Dashboard tetap", !(await bukaTabUji("laporan")) && !(await evalJs("document.getElementById('isi-dashboard').hidden")));
    await foto("hak-tanpa-grup.png");

    // 3) Operator bergrup: hanya menu yang dicentang Aktif
    await masukSebagai("u-staf", false); await muatUlang();
    const ikon = await ikonTampil();
    catat("Operator bergrup: ikon Pengaturan, Master Data, Buku Besar, Laporan tampil; Donasi, Kas, Aset tidak",
      JSON.stringify(ikon.slice().sort()) === JSON.stringify(["tombol-buku-besar", "tombol-laporan", "tombol-master", "tombol-pengaturan"]), JSON.stringify(ikon));
    await evalJs("document.getElementById('tombol-master').click(); true"); await tunggu(200);
    catat("Popup Master Data hanya berisi Divisi", JSON.stringify(await kotakTampil("panel-master")) === JSON.stringify(["Divisi"]), JSON.stringify(await kotakTampil("panel-master")));
    await foto("hak-popup-master.png");
    await evalJs("document.querySelector('#panel-master .kotak-menu[data-halaman=\"Divisi\"]').click(); true"); await tunggu(250);
    catat("Klik Divisi membuka halaman Divisi", await evalJs("!document.getElementById('isi-divisi').hidden"));
    await evalJs("document.getElementById('tombol-pengaturan').click(); true"); await tunggu(200);
    catat("Popup Pengaturan hanya berisi Transaksi Favorit", JSON.stringify(await kotakTampil("panel-pengaturan")) === JSON.stringify(["Transaksi Favorit"]), JSON.stringify(await kotakTampil("panel-pengaturan")));
    await evalJs("document.getElementById('panel-pengaturan').close(); true");
    await bersihkanNotif();
    catat("Halaman Program (tidak dicentang) ditolak", !(await bukaTabUji("program")) && (await pesanNotif()).indexOf("tidak mencakup") !== -1);
    catat("Halaman Jurnal Umum (dicentang) terbuka", await bukaTabUji("jurnal"));

    // 4) Laporan: hanya kategori yang dicentang, Laporan Tersimpan disaring menurut kategori asalnya
    await evalJs("document.getElementById('tombol-laporan').click(); true"); await tunggu(250);
    const kat = await evalJs("JSON.stringify([...document.querySelectorAll('#lap-kategori .lap-kat')].map(function(b){return b.textContent.trim();}))");
    catat("Laporan: hanya kategori Laporan Tersimpan dan Keuangan", kat === JSON.stringify(["Laporan Tersimpan", "Keuangan"]), kat);
    const kartu = await evalJs("JSON.stringify([...document.querySelectorAll('#lap-isi .lap-kartu-nama')].map(function(k){return k.firstChild.textContent;}))");
    catat("Laporan Tersimpan: hanya Neraca Bulanan (kategori Keuangan), Kas Bulanan disembunyikan", kartu === JSON.stringify(["Neraca Bulanan"]), kartu);
    await evalJs("var c=document.getElementById('lap-cari'); c.value='kas'; c.dispatchEvent(new Event('input',{bubbles:true})); true");
    catat("Cari 'kas' tidak menampilkan laporan dari kategori Kas & Bank", await evalJs("![...document.querySelectorAll('#lap-isi .lap-kelompok h3')].some(function(h){return h.textContent==='Kas & Bank';})"));
    await evalJs("var c=document.getElementById('lap-cari'); c.value=''; c.dispatchEvent(new Event('input',{bubbles:true})); true");
    await foto("hak-laporan.png");
    await bersihkanNotif();
    await evalJs("bukaLaporan(cariLaporanDaftar('daftar-kas-bank').lap); true"); await tunggu(150);
    catat("Laporan di luar hak (Daftar Kas dan Bank, dari Dashboard/lainnya) ditolak tanpa membuka Parameter",
      (await pesanNotif()).indexOf("tidak mencakup laporan ini") !== -1 && !(await evalJs("document.getElementById('dialog-parameter-laporan').open")));

    // 5) Hak diubah Administrator: berlaku tanpa masuk ulang
    await evalJs(`var g=JSON.parse(localStorage.getItem("daftarAksesGrup")); g[0].hak = { donatur: ["aktif"] }; localStorage.setItem("daftarAksesGrup", JSON.stringify(g)); terapkanHakMenu(); true`);
    const ikon2 = await ikonTampil();
    catat("Sesudah hak diubah: hanya ikon Donasi", JSON.stringify(ikon2) === JSON.stringify(["tombol-donasi"]), JSON.stringify(ikon2));
    catat("Sesudah hak diubah: Divisi ditolak, Donatur terbuka", !(await bukaTabUji("divisi")) && await bukaTabUji("donatur"));

    // 6) Akun Administrator tetap bebas
    await masukSebagai("u-uji", false); await muatUlang();
    catat("Administrator: Program dan Preferensi terbuka, semua ikon tampil", await bukaTabUji("program") && await bukaTabUji("preferensi") && (await ikonTampil()).length === 7);

    catat("Tidak ada galat skrip", galat.length === 0, galat.join(" | "));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
