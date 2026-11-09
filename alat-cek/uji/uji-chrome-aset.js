// Uji Aset Tetap (PRD 6.6) di Chrome asli, dengan hitungan tangan:
// Mobil 120.000.000, umur 5 tahun = 2.000.000 per bulan. Tanah tidak disusutkan. Printer lama 7.000.000, umur 1 tahun, sudah disusutkan
// 6.000.000: 583.334 per bulan dibulatkan ke atas, jadi berhenti pas pada sisa. Jurnal seimbang, tidak dobel, nomor JV ikut, Lepas Aset dijual.
// Pemakaian: node uji-chrome-aset.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9397;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 140)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };

const akun = (id, kode, nama, tipe, indukId) => ({ id, kode, nama, tipe, indukId: indukId || "" });
const AKUN = [
  akun("k0", "11", "Kas & Bank", "kas-bank"), akun("k1", "1101", "Kas Kecil", "kas-bank", "k0"), akun("k2", "110101", "Kas Masjid", "kas-bank", "k1"),
  akun("a0", "12", "Aset Tetap", "aset-tetap"), akun("a1", "1201", "Kendaraan", "aset-tetap", "a0"), akun("a2", "1202", "Tanah", "aset-tetap", "a0"),
  akun("u0", "13", "Akumulasi", "akumulasi-penyusutan"), akun("u1", "1301", "Akumulasi Kendaraan", "akumulasi-penyusutan", "u0"),
  akun("b0", "51", "Beban", "beban"), akun("b1", "5101", "Beban Penyusutan", "beban", "b0"),
  akun("l0", "81", "Lainnya", "beban-lain"), akun("l1", "8101", "Rugi Pelepasan Aset", "beban-lain", "l0"),
  akun("p0", "71", "Pendapatan Lain", "pendapatan-lain"), akun("p1", "7101", "Untung Pelepasan Aset", "pendapatan-lain", "p0")
];
const baris = (akunId, debit, kredit) => ({ id: "r" + akunId, akunId, debit, kredit, divisiId: "", programId: "" });
const JURNAL = [{ id: "j1", nomor: "BKK-1", tanggal: "2026-01-10", rincian: [baris("a1", 127000000, 0), baris("k2", 0, 127000000)], sumber: { jenis: "pembayaran", id: "x" } }];

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
    const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); for (let i = 0; i < 100; i++) { if (await evalJs("document.readyState==='complete' && typeof bukaLepasAsetBaru==='function' && typeof gambarAsetDilepas==='function'")) { break; } await tunggu(200); } await tunggu(200); };
    await tunggu(800);
    await evalJs("localStorage.clear(); localStorage.setItem('daftarAkun', " + JSON.stringify(JSON.stringify(AKUN)) + "); localStorage.setItem('daftarJurnal', " + JSON.stringify(JSON.stringify(JURNAL)) + "); true");
    await muatUlang();
    const atur = (id, nilai) => evalJs(`(function(){var e=document.getElementById('${id}'); e.value=${JSON.stringify(nilai)}; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return true;})()`);
    const centang = (id, v) => evalJs(`(function(){var e=document.getElementById('${id}'); if(e.checked!==${v}){e.click();} return true;})()`);
    const simpan = async (id) => { await evalJs(`document.getElementById('${id}').click(); true`); await tunggu(250); };
    const teks = (id) => evalJs(`document.getElementById('${id}').textContent`);
    const galatDi = (id) => evalJs(`document.getElementById('${id}').hidden ? '' : document.getElementById('${id}').textContent`);
    const data = (kunci) => evalJs(`JSON.parse(localStorage.getItem('${kunci}')||'[]')`);
    const seimbang = (j) => { const d = j.rincian.reduce((n, r) => n + r.debit, 0), k = j.rincian.reduce((n, r) => n + r.kredit, 0); return d === k && d > 0; };

    // Popup
    await klik("#tombol-aset"); await tunggu(300);
    catat("Ikon Aset Tetap membuka popup empat kotak", await evalJs("[...document.querySelectorAll('#panel-aset .kotak-label-menu')].map(function(x){return x.textContent;}).join('|')==='Aset Tetap|Kategori Aset|Proses Penyusutan|Lepas Aset'"));
    await foto("aset-popup.png");
    await klik('#panel-aset .kotak-menu[data-halaman="Kategori Aset"]'); await tunggu(350);
    // Kategori
    await simpan("kat-aset-simpan");
    catat("Kategori: Nama wajib", /Nama wajib/.test(await galatDi("kat-aset-pesan-galat")));
    await atur("kat-aset-nama", "Kendaraan");
    await simpan("kat-aset-simpan");
    catat("Kategori: Akun Aset wajib", /Akun Aset wajib/.test(await galatDi("kat-aset-pesan-galat")));
    catat("Pilihan akun menurut tipe, akun induk tidak ikut", await evalJs("[...document.getElementById('kat-aset-akun').options].map(function(o){return o.value;}).filter(Boolean).join()==='a1,a2' && [...document.getElementById('kat-aset-akumulasi').options].map(function(o){return o.value;}).filter(Boolean).join()==='u1' && [...document.getElementById('kat-aset-beban').options].map(function(o){return o.value;}).filter(Boolean).join()==='b1,l1'"));
    await atur("kat-aset-akun", "a1"); await atur("kat-aset-akumulasi", "u1"); await atur("kat-aset-beban", "b1"); await atur("kat-aset-umur", "5");
    await foto("aset-kategori.png");
    await simpan("kat-aset-simpan");
    await atur("kat-aset-nama", "Tanah"); await centang("kat-aset-tidak", true); await atur("kat-aset-akun", "a2");
    catat("Tidak disusutkan: isian akumulasi, beban, umur disembunyikan", await evalJs("[...document.querySelectorAll('#isi-kategori-aset .kat-aset-susut')].every(function(b){return b.hidden;})"));
    await simpan("kat-aset-simpan");
    catat("Dua kategori tersimpan", (await data("daftarKategoriAset")).length === 2);
    const idKat = await evalJs("(function(){var o={}; bacaKategoriAset().forEach(function(k){o[k.nama]=k.id;}); return o;})()");
    catat("Akun yang dipakai kategori tidak bisa dihapus", await evalJs("tempatAkunDipakai('1201')") === "Jurnal Umum" && await evalJs("tempatAkunDipakai('1301')") === "Kategori Aset");

    // Aset
    await evalJs("bukaAsetTetapBaru(); true"); await tunggu(300);
    catat("Kode otomatis AT-00001", await evalJs("document.getElementById('aset-kode').value==='AT-00001' && document.getElementById('aset-kode').readOnly"));
    await simpan("aset-simpan");
    catat("Aset: Nama wajib", /Nama wajib/.test(await galatDi("aset-pesan-galat")));
    await atur("aset-nama", "Mobil <b>Operasional</b>"); await atur("aset-tanggal-beli", "2026-01-15"); await atur("aset-tanggal-pakai", "2026-01-01");
    await simpan("aset-simpan");
    catat("Tanggal Pakai sebelum Tanggal Beli ditolak", /sebelum Tanggal Beli/.test(await galatDi("aset-pesan-galat")));
    await atur("aset-tanggal-pakai", "2026-02-01");
    await atur("aset-kategori", idKat.Kendaraan); await tunggu(120);
    catat("Pilih kategori mengisi umur", await evalJs("document.getElementById('aset-umur').value==='5'"));
    await atur("aset-nilai", "120.000.000"); await tunggu(120);
    catat("Ringkasan: 2.000.000 per bulan, Nilai Buku 120.000.000", await teks("aset-per-bulan") === "Rp 2.000.000" && await teks("aset-nilai-buku") === "Rp 120.000.000", await teks("aset-per-bulan"));
    await atur("aset-lokasi", "Kantor Pusat");
    await foto("aset-form.png");
    await simpan("aset-simpan");
    const jurnalAwal = (await data("daftarJurnal")).length;
    catat("Aset tersimpan dan TIDAK membuat jurnal", (await data("daftarAsetTetap")).length === 1 && jurnalAwal === 1);
    catat("Aset tersimpan tanpa Divisi dan Program", await evalJs("!('divisiId' in bacaAsetTetap()[0]) && !('programId' in bacaAsetTetap()[0])"));
    await atur("aset-nama", "Printer Lama"); await atur("aset-tanggal-beli", "2025-01-01"); await atur("aset-tanggal-pakai", "2025-01-01"); await atur("aset-kategori", idKat.Kendaraan); await tunggu(100);
    await atur("aset-nilai", "7.000.000"); await atur("aset-umur", "1"); await atur("aset-sudah", "9.000.000");
    await simpan("aset-simpan");
    catat("Sudah disusutkan melebihi nilai ditolak", /tidak boleh melebihi/.test(await galatDi("aset-pesan-galat")));
    await atur("aset-sudah", "6.000.000"); await simpan("aset-simpan");
    await atur("aset-nama", "Tanah Sekolah"); await atur("aset-tanggal-beli", "2026-01-05"); await atur("aset-tanggal-pakai", "2026-01-05"); await atur("aset-kategori", idKat.Tanah); await tunggu(100);
    await atur("aset-nilai", "200.000.000"); await simpan("aset-simpan");
    const aset = await data("daftarAsetTetap");
    catat("Tiga aset, kode berurutan, tanah tanpa umur", aset.map(a => a.kode).join() === "AT-00001,AT-00002,AT-00003" && aset[2].tidakDisusutkan === true && aset[2].umurBulan === 0, JSON.stringify(aset.map(a => a.kode)));
    await evalJs("modulAsetTetap.tampilkan('daftar'); modulAsetTetap.gambarTabel(); true"); await tunggu(250);
    const cocok1 = await evalJs("document.querySelector('.aset-cocok').textContent");
    catat("Cek kecocokan: daftar 327 juta, saldo akun 127 juta, peringatan tampil", /Rp 327\.000\.000 berbeda dengan saldo akun aset Rp 127\.000\.000/.test(cocok1) && await evalJs("document.querySelector('.aset-cocok').classList.contains('aset-beda')"), cocok1);
    await foto("aset-daftar.png");
    await evalJs("(function(){var d=modulJurnal.ambil(); d.push({id:'j2',nomor:'BKK-2',tanggal:'2026-01-05',rincian:[{id:'r1',akunId:'a2',debit:200000000,kredit:0},{id:'r2',akunId:'k2',debit:0,kredit:200000000}]}); modulJurnal.simpan(d); modulAsetTetap.gambarTabel(); return true;})()"); await tunggu(150);
    const cocok2 = await evalJs("document.querySelector('.aset-cocok').textContent");
    catat("Sesudah pembelian dicatat: Cocok", /Cocok\.$/.test(cocok2) && await evalJs("!document.querySelector('.aset-cocok').classList.contains('aset-beda')"), cocok2);

    // Penyusutan
    await evalJs("bukaPenyusutanBaru(); true"); await tunggu(300);
    await atur("pny-tahun", "2026"); await atur("pny-bulan", "2"); await tunggu(200);
    const rinc = () => evalJs("[...document.querySelectorAll('#pny-rincian tr')].map(function(x){return [...x.cells].map(function(c){return c.textContent;}).join('|');})");
    const r1 = await rinc();
    catat("Februari: mobil 2.000.000, printer sisa 583.334 lalu, tanah tidak ikut, nama kode HTML sebagai teks", r1.length === 2 && r1[0] === "AT-00001|Mobil <b>Operasional</b>|2.000.000" && r1[1] === "AT-00002|Printer Lama|583.334" && await evalJs("!document.querySelector('#pny-rincian b')"), JSON.stringify(r1));
    await foto("aset-penyusutan.png");
    await simpan("pny-simpan");
    let j = (await data("daftarJurnal")).filter(x => x.sumber && x.sumber.jenis === "penyusutan");
    catat("Satu jurnal akhir bulan, seimbang, tanpa Divisi dan Program, bernomor JV", j.length === 1 && j[0].tanggal === "2026-02-28" && j[0].nomor === "PNY.2026.02" && seimbang(j[0]) && j[0].rincian.every(r => !r.divisiId && !r.programId) && /^JV\.2026\.02\.\d{5}$/.test(j[0].noJurnal), JSON.stringify(j[0]));
    catat("Debit Beban, Kredit Akumulasi 2.583.334", j[0].rincian.find(r => r.akunId === "b1").debit === 2583334 && j[0].rincian.find(r => r.akunId === "u1").kredit === 2583334);
    await atur("pny-tahun", "2026"); await atur("pny-bulan", "2");
    await evalJs("pilihBulanPny.disabled=false; kolomTahunPny.disabled=false; true"); await simpan("pny-simpan");
    catat("Bulan yang sudah diproses ditolak", /sudah diproses/.test(await galatDi("pny-pesan-galat")), await galatDi("pny-pesan-galat"));
    await atur("pny-bulan", "5"); await simpan("pny-simpan");
    catat("Melompati bulan ditolak", /harus Maret 2026/.test(await galatDi("pny-pesan-galat")), await galatDi("pny-pesan-galat"));
    await evalJs("modulPenyusutan.bukaBaruKosong(); if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(150);
    catat("Proses berikutnya otomatis Maret dan bulannya dikunci", await evalJs("pilihBulanPny.value==='3' && pilihBulanPny.disabled"));
    await simpan("pny-simpan");
    await evalJs("modulPenyusutan.bukaBaruKosong(); if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(150);
    const r3 = await rinc();
    catat("Printer berhenti saat habis; hanya mobil di April", r3.length === 1 && /Mobil/.test(r3[0]), JSON.stringify(r3));
    catat("Printer pas habis di sisa: total penyusutan 7.000.000", await evalJs("penyusutanSampai(bacaAsetTetap()[1])") === 7000000 && await evalJs("statusAset(bacaAsetTetap()[1])") === "Habis disusutkan", await evalJs("penyusutanSampai(bacaAsetTetap()[1])"));
    // Aset terkunci
    await evalJs("modulAsetTetap.bukaUbah(bacaAsetTetap()[0]); bukaTab('aset-tetap'); true"); await tunggu(200);
    catat("Aset yang sudah disusutkan: nilai dan umur dikunci", await evalJs("document.getElementById('aset-nilai').disabled && document.getElementById('aset-umur').disabled"));
    await evalJs("document.getElementById('aset-tanggal-pakai').value='2026-06-01'; document.getElementById('aset-lokasi').value='Garasi'; true");
    await simpan("aset-simpan");
    catat("Ubah Lokasi tersimpan; tanggal pakai tetap", await evalJs("bacaAsetTetap()[0].lokasi==='Garasi' && bacaAsetTetap()[0].tanggalPakai==='2026-02-01'"));
    await evalJs("modulAsetTetap.hapus(bacaAsetTetap()[0]); true"); await tunggu(150);
    catat("Aset yang sudah disusutkan tidak bisa dihapus", (await data("daftarAsetTetap")).length === 3 && await evalJs("!document.getElementById('dialog-konfirmasi').open"));
    await evalJs("modulPenyusutan.hapus(modulPenyusutan.ambil().find(function(p){return p.bulan==='2026-02';})); true"); await tunggu(150);
    catat("Proses bukan bulan terakhir tidak bisa dibatalkan", (await data("daftarPenyusutan")).length === 2 && await evalJs("!document.getElementById('dialog-konfirmasi').open"));
    await evalJs("modulPenyusutan.hapus(modulPenyusutan.ambil().find(function(p){return p.bulan==='2026-03';})); true"); await tunggu(200);
    await klik("#ya-konfirmasi"); await tunggu(300);
    catat("Batalkan bulan terakhir: proses dan jurnalnya hilang", (await data("daftarPenyusutan")).length === 1 && (await data("daftarJurnal")).filter(x => x.sumber && x.sumber.jenis === "penyusutan").length === 1);

    // Lepas Aset: mobil 120.000.000, disusutkan 2.000.000, buku 118.000.000, dijual 130.000.000 = untung 12.000.000
    await evalJs("bukaLepasAsetBaru(); true"); await tunggu(300);
    await atur("lepas-aset", aset[0].id); await tunggu(100);
    catat("Lepas: Nilai Buku 118.000.000", await teks("lepas-buku") === "Rp 118.000.000", await teks("lepas-buku"));
    catat("Lepas Data Baru: Alasan 'Silakan Pilih' (PRD 5.3a)", await evalJs("document.getElementById('lepas-alasan').value") === "");
    await atur("lepas-alasan", "Dijual");
    await atur("lepas-tanggal", "2026-01-20"); await atur("lepas-nilai", "130.000.000"); await tunggu(100);
    await simpan("lepas-simpan");
    catat("Tanggal sebelum penyusutan terakhir ditolak", /penyusutan terakhir/.test(await galatDi("lepas-pesan-galat")), await galatDi("lepas-pesan-galat"));
    await atur("lepas-tanggal", "2026-03-10");
    await simpan("lepas-simpan");
    catat("Dijual: Kas/Bank wajib", /Kas\/Bank wajib/.test(await galatDi("lepas-pesan-galat")), await galatDi("lepas-pesan-galat"));
    await atur("lepas-kas", "k2");
    await simpan("lepas-simpan");
    catat("Ada selisih: Akun Untung/Rugi wajib", /Untung\/Rugi wajib/.test(await galatDi("lepas-pesan-galat")), await galatDi("lepas-pesan-galat"));
    await atur("lepas-akun", "p1"); await tunggu(100);
    await foto("aset-lepas.png");
    catat("Ringkasan Untung 12.000.000", await teks("lepas-judul-selisih") === "Untung" && await teks("lepas-selisih") === "Rp 12.000.000", await teks("lepas-selisih"));
    await simpan("lepas-simpan");
    j = (await data("daftarJurnal")).filter(x => x.sumber && x.sumber.jenis === "lepas-aset");
    const rj = j[0] ? j[0].rincian : [];
    catat("Jurnal seimbang: Debit Akumulasi dan Kas, Kredit Aset dan Untung", j.length === 1 && seimbang(j[0]) && rj.find(r => r.akunId === "u1").debit === 2000000 && rj.find(r => r.akunId === "k2").debit === 130000000 && rj.find(r => r.akunId === "a1").kredit === 120000000 && rj.find(r => r.akunId === "p1").kredit === 12000000 && /^JV\.2026\.03\./.test(j[0].noJurnal), JSON.stringify(j[0]));
    catat("Status Dilepas; penyusutan berikutnya tidak memuat aset itu; tidak ada lagi di pilihan", await evalJs("statusAset(bacaAsetTetap()[0])") === "Dilepas" && await evalJs("!barisPenyusutanBulan('2026-03').some(function(b){return b.kode==='AT-00001';})"));
    catat("Cek kecocokan tetap cocok sesudah dilepas", await evalJs("(function(){var h=cekKecocokanAset(); return h.daftar===207000000 && h.saldo===207000000;})()"), await evalJs("JSON.stringify(cekKecocokanAset())"));
    await evalJs("modulPenyusutan.hapus(modulPenyusutan.ambil()[0]); true"); await tunggu(150);
    catat("Proses yang memuat aset dilepas tidak bisa dibatalkan", (await data("daftarPenyusutan")).length === 1);

    // Laporan
    const bukaLap = (idLap, param) => evalJs(`(function(){var h=null; DAFTAR_LAPORAN.forEach(function(k){(k.kelompok||[]).forEach(function(g){g.laporan.forEach(function(l){if(l.id==='${idLap}'){h=l;}});});}); tampilkanLaporan(h, Object.assign({divisi:[],program:[],akun:[],hanyaTotal:false,akunInduk:true,akunAnak:true}, ${JSON.stringify(param)})); return true;})()`);
    const barisLap = () => evalJs("[...document.querySelectorAll('#lap-k-isi tr')].map(function(x){return [...x.cells].map(function(c){return c.textContent;}).join('|');})");
    await bukaLap("daftar-aset-tetap", { dari: "2026-01-01", sampai: "2026-02-28" }); await tunggu(250);
    const l1 = await barisLap();
    catat("Daftar Aset per 28 Feb: mobil masih ada, kelompok kategori, Total", l1.some(x => x.startsWith("AT-00001|Mobil <b>Operasional</b>|15 Jan 2026|120.000.000|2.000.000|118.000.000")) && l1.some(x => x === "Tanah") && l1.includes("Total|327.000.000|8.583.334|318.416.666"), JSON.stringify(l1));
    await foto("aset-laporan.png");
    await bukaLap("daftar-aset-tetap", { dari: "2026-01-01", sampai: "2026-03-31" }); await tunggu(250);
    catat("Daftar Aset per 31 Mar: mobil sudah keluar", !(await barisLap()).some(x => x.includes("AT-00001")));
    await bukaLap("penyusutan-aset-tetap", { dari: "2026-02-01", sampai: "2026-02-28" }); await tunggu(250);
    const l2 = await barisLap();
    catat("Laporan Penyusutan: 2.583.334", l2.includes("Total|2.583.334"), JSON.stringify(l2));
    await bukaLap("aset-dilepas", { dari: "2026-03-01", sampai: "2026-03-31" }); await tunggu(250);
    const l3 = await barisLap();
    catat("Aset yang Dilepas: Dijual, untung 12.000.000", l3.some(x => x.includes("Dijual|120.000.000|2.000.000|118.000.000|130.000.000|12.000.000")), JSON.stringify(l3));
    // Batalkan Lepas
    await evalJs("bukaTab('lepas-aset'); modulLepasAset.hapus(modulLepasAset.ambil()[0]); true"); await tunggu(200);
    await klik("#ya-konfirmasi"); await tunggu(300);
    catat("Batalkan Lepas: aset aktif lagi, jurnalnya hilang", await evalJs("statusAset(bacaAsetTetap()[0])") === "Aktif" && (await data("daftarJurnal")).filter(x => x.sumber && x.sumber.jenis === "lepas-aset").length === 0);
    catat("Kedua daftar ikut Cadangan Data", await evalJs("['daftarAsetTetap','daftarKategoriAset','daftarPenyusutan','daftarLepasAset'].every(function(k){return jenisKunciCadangan[k]==='daftar';})"));
    // Data rusak
    await evalJs("localStorage.setItem('daftarAsetTetap', JSON.stringify([null,5,{id:'r1',nilai:'x',umurBulan:'y',tanggalPakai:7},{id:'r2',kategoriId:'hilang',nilai:1000,umurBulan:0}])); localStorage.setItem('daftarPenyusutan', JSON.stringify([null,{id:'p',bulan:9,rincian:'rusak'}])); localStorage.setItem('daftarLepasAset', JSON.stringify([5,{id:'l',asetId:null}])); localStorage.setItem('daftarKategoriAset','{rusak'); true");
    await muatUlang();
    await evalJs("bukaAsetTetapBaru(); modulAsetTetap.tampilkan('daftar'); modulAsetTetap.gambarTabel(); bukaPenyusutanBaru(); modulPenyusutan.tampilkan('daftar'); modulPenyusutan.gambarTabel(); bukaLepasAsetBaru(); modulLepasAset.tampilkan('daftar'); modulLepasAset.gambarTabel(); bukaKategoriAsetBaru(); true"); await tunggu(300);
    await bukaLap("daftar-aset-tetap", { dari: "2026-01-01", sampai: "2026-12-31" }); await bukaLap("penyusutan-aset-tetap", { dari: "2026-01-01", sampai: "2026-12-31" }); await bukaLap("aset-dilepas", { dari: "2026-01-01", sampai: "2026-12-31" }); await tunggu(200);
    catat("Data rusak tidak membuat macet", galat.length === 0, JSON.stringify(galat));
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(300);
    await evalJs("bukaAsetTetapBaru(); true"); await tunggu(250);
    catat("Lebar 390: formulir Aset di dalam layar", await evalJs("document.getElementById('form-aset-tetap').getBoundingClientRect().right<=window.innerWidth"));
    await foto("aset-hp.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack + "\nGalat halaman: " + JSON.stringify(galat)); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
