// Uji Transaksi Favorit (PRD 6.8) di Chrome asli: simpan lewat Lainnya, ambil lewat tombol Ambil di keempat formulir, tanggal dan nomor baru, transaksi asli
// tidak berubah, jurnal baru hanya saat Simpan, Pembayaran gaji ditolak, akun terhapus tertahan pemeriksaan Simpan, halaman daftar, data rusak.
// Pemakaian: node uji-chrome-favorit.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9399;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 140)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };

const akun = (id, kode, nama, tipe, indukId) => ({ id, kode, nama, tipe, indukId: indukId || "" });
const AKUN = [
  akun("k0", "11", "Kas & Bank", "kas-bank"), akun("k1", "1101", "Kas Kecil", "kas-bank", "k0"), Object.assign(akun("k2", "110101", "Kas Masjid", "kas-bank", "k1"), { saldoAwal: 10000000 }),
  akun("p0", "41", "Pendapatan", "pendapatan"), akun("p1", "4101", "Donasi Umum", "pendapatan", "p0"),
  akun("b0", "51", "Beban", "beban"), akun("b1", "5101", "Beban Listrik", "beban", "b0"), akun("b2", "5102", "Beban Air", "beban", "b0")
];
const baris = (idB, akunId, kode, nama, nilai, ekstra) => Object.assign({ id: idB, akunId, kode, nama, nilai, divisiId: "d1", programId: "", terikat: false, catatan: "Rutin" }, ekstra || {});
const BAYAR = [
  { id: "by1", nomor: "BKK-1", nama: "BKK-1", tanggal: "2026-01-10", kasId: "k2", kas: "110101 - Kas Masjid", noCek: "CEK-9", penerima: "PLN", catatan: "Tagihan <b>listrik</b>", rincian: [baris("r1", "b1", "5101", "Beban Listrik", 750000)], total: 750000 },
  { id: "by2", nomor: "BKK-2", nama: "BKK-2", tanggal: "2026-01-11", kasId: "k2", kas: "110101 - Kas Masjid", penerima: "", catatan: "Gaji", rincian: [baris("r2", "b1", "5101", "Beban Listrik", 100, { gajiId: "g1" })], total: 100 }
];
const TERIMA = [{ id: "tm1", nomor: "BKM-1", nama: "BKM-1", tanggal: "2026-01-12", kasId: "k2", kas: "110101 - Kas Masjid", pemberi: "Sewa", catatan: "Sewa aula", rincian: [baris("r3", "p1", "4101", "Donasi Umum", 200000)], total: 200000 }];
const JURNAL = [{ id: "j1", nomor: "JV-1", nama: "JV-1", tanggal: "2026-01-13", keterangan: "Koreksi rutin", rincian: [{ id: "r4", akunId: "b2", kode: "5102", nama: "Beban Air", debit: 50000, kredit: 0, divisiId: "d1", programId: "" }, { id: "r5", akunId: "k2", kode: "110101", nama: "Kas Masjid", debit: 0, kredit: 50000, divisiId: "", programId: "" }] }];
const DONASI = [{ id: "dn1", nomor: "DN-1", nama: "DN-1", tanggal: "2026-01-14", kasId: "k2", kas: "110101 - Kas Masjid", donaturId: "dt1", caraBayar: "Transfer", keterangan: "Donatur tetap", rincian: [baris("r6", "p1", "4101", "Donasi Umum", 300000)], total: 300000 }];

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") { const x = d.params.exceptionDetails; galat.push(x.exception ? x.exception.description : x.text + " " + (x.url || "") + ":" + x.lineNumber); } if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    const siap = async () => { for (let i = 0; i < 100; i++) { if (await evalJs("document.readyState==='complete' && typeof gambarDashboard==='function'")) { break; } await tunggu(200); } await tunggu(200); };
    const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); await siap(); };
    await tunggu(800); await siap();
    const simpan = (k, v) => "localStorage.setItem('" + k + "', " + JSON.stringify(JSON.stringify(v)) + ");";
    const kunciBayar = await evalJs("(function(){var h=[]; Object.keys(asalJurnal).forEach(function(k){h.push(k);}); return h.join();})()");
    await evalJs("localStorage.clear();" + simpan("daftarAkun", AKUN) + simpan("daftarDivisi", [{ id: "d1", nama: "Umum" }]) + simpan("daftarPembayaran", BAYAR) + simpan("daftarPenerimaan", TERIMA) + simpan("daftarJurnal", JURNAL) + simpan("daftarDonasi", DONASI) + simpan("daftarDonatur", [{ id: "dt1", idDonatur: "D.00001", nama: "Donatur A" }]) + "true");
    await muatUlang();
    const hari = await evalJs("tanggalHariIni()");
    const data = (k) => evalJs(`JSON.parse(localStorage.getItem('${k}')||'[]')`);
    const notif = () => evalJs("document.body.textContent");
    const asal = (tipe) => `TIPE_FAVORIT['${tipe}']()`;
    const buka = async (tipe, idData) => { await evalJs(`(function(){var a=${asal(tipe)}; bukaTab(a.tab); a.modul.bukaUbah(a.modul.ambil().find(function(d){return d.id==='${idData}';})); return true;})()`); await tunggu(200); };
    const baru = async (tipe) => { await evalJs(`(function(){var a=${asal(tipe)}; bukaTab(a.tab); a.modul.bukaBaru(); return true;})()`); await tunggu(200); };
    const lain = async (tipe) => { await evalJs(`(function(){var t=[...document.querySelectorAll('[data-favorit-lain="${tipe}"]')][0]; t.click(); return true;})()`); await tunggu(100); };
    const tambah = async (tipe, nama) => {
      await lain(tipe); await evalJs("document.getElementById('menu-tambah-favorit').click(); true"); await tunggu(150);
      if (nama !== undefined) { await evalJs(`document.getElementById('favorit-nama').value=${JSON.stringify(nama)}; document.getElementById('simpan-favorit').click(); true`); await tunggu(200); }
    };
    const ambil = async (tipe, nama) => {
      await evalJs(`document.querySelector('[data-favorit-ambil="${tipe}"]').click(); true`); await tunggu(150);
      await evalJs(`[...document.querySelectorAll('#daftar-ambil-favorit button')].find(function(b){return b.textContent.indexOf(${JSON.stringify(nama)})!==-1;}).click(); true`); await tunggu(250);
    };

    catat("Keempat formulir terdaftar", await evalJs("Object.keys(TIPE_FAVORIT).every(function(k){var a=TIPE_FAVORIT[k](); return a&&a.modul;})"), kunciBayar);
    catat("Tombol Ambil dan Lainnya ada di keempat formulir", await evalJs("Object.keys(TIPE_FAVORIT).every(function(k){return document.querySelector('[data-favorit-ambil=\"'+k+'\"]') && document.querySelector('[data-favorit-lain=\"'+k+'\"]');})"));
    // Data Baru
    await baru("Pembayaran"); await tambah("Pembayaran");
    catat("Data Baru tidak bisa dijadikan favorit", /Simpan transaksi dulu/.test(await notif()) && await evalJs("!document.getElementById('dialog-favorit').open"));
    // Gaji
    await buka("Pembayaran", "by2"); await tambah("Pembayaran");
    catat("Pembayaran gaji ditolak", /tidak bisa dijadikan favorit/.test(await notif()) && await evalJs("!document.getElementById('dialog-favorit').open"));
    // Simpan
    await buka("Pembayaran", "by1"); await lain("Pembayaran");
    catat("Tombol Lainnya membuka menu Tambah ke Favorit", await evalJs("!document.getElementById('menu-lainnya').hidden"));
    await foto("favorit-menu.png");
    await evalJs("document.body.click(); true"); await tunggu(80);
    catat("Klik di luar menutup menu", await evalJs("document.getElementById('menu-lainnya').hidden"));
    await tambah("Pembayaran");
    catat("Popup terisi dari Catatan", await evalJs("document.getElementById('dialog-favorit').open && document.getElementById('favorit-nama').value==='Tagihan <b>listrik</b>'"));
    await foto("favorit-tambah.png");
    await evalJs("document.getElementById('favorit-nama').value=''; document.getElementById('simpan-favorit').click(); true"); await tunggu(120);
    catat("Nama wajib", await evalJs("!document.getElementById('galat-favorit-nama').hidden && document.getElementById('dialog-favorit').open"));
    await evalJs("document.getElementById('favorit-nama').value='Listrik <b>bulanan</b>'; document.getElementById('simpan-favorit').click(); true"); await tunggu(250);
    const fav = await data("daftarFavorit");
    catat("Favorit tersimpan tanpa tanggal, nomor, id, No Cek; nilai dan akun ikut", fav.length === 1 && fav[0].tipe === "Pembayaran" && fav[0].total === 750000 && !("tanggal" in fav[0].isi) && !("nomor" in fav[0].isi) && !("id" in fav[0].isi) && !("noCek" in fav[0].isi) && fav[0].isi.rincian[0].akunId === "b1", JSON.stringify(fav[0]));
    await tambah("Pembayaran", "listrik <b>BULANAN</b>");
    catat("Nama sama dalam satu tipe ditolak", /sudah dipakai/.test(await evalJs("document.getElementById('galat-favorit-nama').textContent")) && (await data("daftarFavorit")).length === 1);
    await evalJs("document.getElementById('tutup-dialog-favorit').click(); true");
    // Ambil saat mengubah
    await evalJs("document.querySelector('[data-favorit-ambil=\"Pembayaran\"]').click(); true"); await tunggu(120);
    catat("Ambil saat mengubah transaksi ditolak", /Ambil hanya untuk Data Baru/.test(await notif()) && await evalJs("!document.getElementById('dialog-ambil-favorit').open"));
    // Ambil
    const jurnalAwal = (await data("daftarJurnal")).length;
    await baru("Pembayaran");
    await evalJs("document.querySelector('[data-favorit-ambil=\"Pembayaran\"]').click(); true"); await tunggu(150);
    catat("Daftar Ambil: kode HTML sebagai teks", await evalJs("document.getElementById('daftar-ambil-favorit').textContent.indexOf('Listrik <b>bulanan</b>')!==-1 && !document.querySelector('#daftar-ambil-favorit b')"));
    await foto("favorit-ambil.png");
    await evalJs("document.getElementById('tutup-ambil-favorit').click(); true");
    await ambil("Pembayaran", "Listrik");
    catat("Terisi: akun, nilai, Kas, Catatan; tanggal hari ini; No Cek kosong; Data Baru", await evalJs(`document.getElementById('bayar-tanggal').value==='${hari}' && document.getElementById('bayar-kas').value==='k2' && document.getElementById('bayar-catatan').value==='Tagihan <b>listrik</b>' && document.getElementById('bayar-no-cek').value==='' && document.getElementById('bayar-rincian').textContent.indexOf('750.000')!==-1 && ${asal("Pembayaran")}.modul.idDiubah===null`), await evalJs("document.getElementById('bayar-rincian').textContent"));
    catat("Belum ada yang tersimpan sebelum Simpan", (await data("daftarPembayaran")).length === 2 && (await data("daftarJurnal")).length === jurnalAwal);
    await foto("favorit-terisi.png");
    await evalJs("document.getElementById('bayar-nomor-otomatis').click(); document.getElementById('bayar-nomor').value='BKK-3'; true");
    await evalJs("document.getElementById('bayar-simpan').click(); true"); await tunggu(400);
    const bayar = await data("daftarPembayaran");
    const baruB = bayar.find(b => b.nomor === "BKK-3");
    catat("Simpan: transaksi baru, baris id baru, jurnal baru", bayar.length === 3 && baruB && baruB.total === 750000 && baruB.tanggal === hari && baruB.rincian[0].id !== "r1" && (await data("daftarJurnal")).length === jurnalAwal + 1, await evalJs("document.getElementById('bayar-pesan-galat').textContent"));
    catat("Transaksi asli tidak berubah", JSON.stringify(bayar.find(b => b.id === "by1")) === JSON.stringify(BAYAR[0]));
    // Formulir lain
    await buka("Penerimaan", "tm1"); await tambah("Penerimaan", "Sewa aula");
    await baru("Penerimaan"); await ambil("Penerimaan", "Sewa aula");
    catat("Penerimaan: terisi", await evalJs(`document.getElementById('terima-rincian').textContent.indexOf('200.000')!==-1 && document.getElementById('terima-pemberi').value==='Sewa' && ${asal("Penerimaan")}.modul.idDiubah===null`));
    await buka("Jurnal Umum", "j1"); await tambah("Jurnal Umum", "Koreksi");
    await baru("Jurnal Umum"); await ambil("Jurnal Umum", "Koreksi");
    catat("Jurnal Umum: dua baris, tanggal hari ini, Data Baru, nomor otomatis", await evalJs(`document.querySelectorAll('#jurnal-rincian .jurnal-baris-data').length===2 && document.getElementById('jurnal-tanggal').value==='${hari}' && modulJurnal.idDiubah===null && document.getElementById('jurnal-nomor').value===''`), await evalJs("document.getElementById('jurnal-rincian').textContent.slice(0,120)"));
    await buka("Pencatatan Donasi", "dn1"); await tambah("Pencatatan Donasi", "Donatur tetap");
    await baru("Pencatatan Donasi"); await ambil("Pencatatan Donasi", "Donatur tetap");
    catat("Pencatatan Donasi: donatur, cara bayar, nilai", await evalJs("document.getElementById('dc-donatur').value==='dt1' && document.getElementById('dc-cara-bayar').value==='Transfer' && document.getElementById('dc-rincian').textContent.indexOf('300.000')!==-1"), await evalJs("document.getElementById('dc-donatur').value"));
    await evalJs("document.querySelector('[data-favorit-ambil=\"Pencatatan Donasi\"]'); modulDonasiCatat.bukaBaru(); true"); await tunggu(120);
    // Akun terhapus
    await evalJs("(function(){var a=JSON.parse(localStorage.getItem('daftarAkun')).filter(function(x){return x.id!=='b1';}); localStorage.setItem('daftarAkun', JSON.stringify(a)); return true;})()");
    await baru("Pembayaran"); await ambil("Pembayaran", "Listrik");
    await evalJs("document.getElementById('bayar-nomor-otomatis').checked||document.getElementById('bayar-nomor-otomatis').click(); document.getElementById('bayar-nomor-otomatis').click(); document.getElementById('bayar-nomor').value='BKK-4'; document.getElementById('bayar-simpan').click(); true"); await tunggu(300);
    catat("Akun sudah dihapus: Simpan ditolak", /sudah tidak ada/.test(await evalJs("document.getElementById('bayar-pesan-galat').textContent")) && (await data("daftarPembayaran")).length === 3, await evalJs("document.getElementById('bayar-pesan-galat').textContent"));
    // Halaman daftar
    await evalJs("document.getElementById('tombol-pengaturan').click(); document.querySelector('#panel-pengaturan .kotak-menu[data-halaman=\"Transaksi Favorit\"]').click(); true"); await tunggu(300);
    catat("Kotak di popup Pengaturan membuka daftar: 4 favorit", await evalJs("!document.getElementById('isi-favorit').hidden && document.querySelector('#isi-favorit [data-jumlah]').textContent==='4'"));
    await foto("favorit-daftar.png");
    await evalJs("[...document.querySelectorAll('#isi-favorit tbody tr')].find(function(x){return x.textContent.indexOf('Sewa aula')!==-1;}).click(); true"); await tunggu(150);
    catat("Klik baris: popup Ubah dengan Hapus dan Pakai", await evalJs("document.getElementById('dialog-favorit').open && !document.getElementById('hapus-favorit').hidden && !document.getElementById('pakai-favorit').hidden"));
    await evalJs("document.getElementById('favorit-nama').value='Sewa aula baru'; document.getElementById('simpan-favorit').click(); true"); await tunggu(200);
    catat("Ganti nama tersimpan", (await data("daftarFavorit")).some(f => f.nama === "Sewa aula baru"));
    await evalJs("[...document.querySelectorAll('#isi-favorit tbody tr')].find(function(x){return x.textContent.indexOf('Sewa aula baru')!==-1;}).click(); true"); await tunggu(150);
    await evalJs("document.getElementById('pakai-favorit').click(); true"); await tunggu(300);
    catat("Tombol Pakai membuka formulirnya", await evalJs("!document.getElementById('isi-terima').hidden && document.getElementById('terima-rincian').textContent.indexOf('200.000')!==-1"));
    await evalJs("bukaFavorit(); [...document.querySelectorAll('#isi-favorit tbody tr')].find(function(x){return x.textContent.indexOf('Sewa aula baru')!==-1;}).click(); true"); await tunggu(150);
    await evalJs("document.getElementById('hapus-favorit').click(); true"); await tunggu(200);
    await evalJs("document.getElementById('ya-konfirmasi').click(); true"); await tunggu(250);
    catat("Hapus favorit: transaksi aslinya tetap", (await data("daftarFavorit")).length === 3 && (await data("daftarPenerimaan")).some(b => b.id === "tm1"));
    catat("Ikut Cadangan Data", await evalJs("jenisKunciCadangan.daftarFavorit==='daftar'"));
    // Data rusak
    await evalJs("localStorage.setItem('daftarFavorit', JSON.stringify([null,5,{id:'r1'},{id:'r2',nama:'Rusak',tipe:'Pembayaran',isi:'x'},{id:'r3',nama:'Aneh',tipe:'constructor',isi:{}},{id:'r4',nama:'Kosong',tipe:'Pembayaran'}])); true");
    await muatUlang();
    await evalJs("bukaFavorit(); modulFavorit.gambarTabel(); pakaiFavorit(modulFavorit.ambil()[1]); pakaiFavorit(modulFavorit.ambil()[2]); pakaiFavorit(modulFavorit.ambil()[0]); true"); await tunggu(250);
    await baru("Pembayaran");
    await evalJs("document.querySelector('[data-favorit-ambil=\"Pembayaran\"]').click(); document.getElementById('tutup-ambil-favorit').click(); true"); await tunggu(120);
    catat("Data rusak tidak membuat macet", galat.length === 0, JSON.stringify(galat));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack + "\nGalat halaman: " + JSON.stringify(galat)); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
