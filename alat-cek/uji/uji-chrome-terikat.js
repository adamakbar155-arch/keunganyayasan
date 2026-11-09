// Uji centang Terikat (D0.3) di Chrome asli. Pemakaian: node uji-chrome-terikat.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9377;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
const bersihNotifUji = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
const danaUji = (p) => evalJs("(function(){var t=document.getElementById('" + p + "-terikat'), n=document.getElementById('" + p + "-tidak-terikat'); if(t&&n&&!t.checked&&!n.checked){n.checked=true;} var d=document.getElementById('" + p + "-divisi'); if(d&&d.value===''){var o=[].slice.call(d.options).find(function(x){return x.value;}); if(o){d.value=o.value; d.dispatchEvent(new Event('change',{bubbles:true}));}} return true;})()");   // Dana belum dipilih -> Tidak Terikat (arti lama, PRD 4.1); Divisi kosong -> divisi pertama (wajib, PRD 5.1)
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
const PEMBUNGKUS_AKUN = `(function(){
  // KHUSUS UJI: akun paling atas dibungkus Akar Uji > Grup Uji, supaya akun lama menjadi tingkat 3 (aturan baru pilihan akun).
  function bungkus(teks){ try { var a = JSON.parse(teks || "[]"); if (!Array.isArray(a)) return teks;
    a.forEach(function(x){ if (!x.indukId && x.id !== "uji-akar") x.indukId = "uji-g"; if (x.id === "uji-g") x.indukId = "uji-akar"; });
    if (!a.some(function(x){ return x.id === "uji-akar"; })) a.push({ id: "uji-akar", kode: "9", nama: "Akar Uji", tipe: "aset-lain", indukId: "", saldoAwal: 0 });
    if (!a.some(function(x){ return x.id === "uji-g"; })) a.push({ id: "uji-g", kode: "91", nama: "Grup Uji", tipe: "aset-lain", indukId: "uji-akar", saldoAwal: 0 });
    var akar = a.find(function(x){ return x.id === "uji-akar"; }); akar.indukId = "";
    return JSON.stringify(a); } catch (e) { return teks; } }
  var asli = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { return asli.call(this, k, k === "daftarAkun" ? bungkus(v) : v); };
  try { var ada = localStorage.getItem("daftarAkun"); if (ada) asli.call(localStorage, "daftarAkun", bungkus(ada)); } catch (e) {}
})();`;
(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) {} }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") }); /* pengguna mengisi kepala Data Baru (PRD 5.3a) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: PEMBUNGKUS_AKUN }); await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    await evalJs(`(function(){ localStorage.clear(); /* uji fitur lain: kas boleh minus dengan peringatan (aturan Ditolak diuji di uji-kas-minus.js) */ localStorage.setItem('pembatasanYayasan', JSON.stringify({kasMinus:'peringatan'}));
      localStorage.setItem('daftarAkun', JSON.stringify([{id:'a1',kode:'110101',nama:'Kas Kecil',tipe:'kas-bank',saldoAwal:0},{id:'a3',kode:'210101',nama:'Utang Gaji',tipe:'liabilitas-pendek',saldoAwal:0},{id:'a4',kode:'610101',nama:'Beban Gaji',tipe:'beban',saldoAwal:0}]));
      localStorage.setItem('daftarPenomoran', JSON.stringify([{id:'g1',nama:'Pencatatan Gaji',pembukuan:'yayasan',tipe:'gaji',digit:4,komponen:[{jenis:'teks',nilai:'GJ-'},{jenis:'counter'}]}]));
      localStorage.setItem('daftarKaryawan', JSON.stringify([{id:'k1',nama:'Gunawan',nomor:'P-001',jabatan:'Ketua'},{id:'k2',nama:'Ani Lestari',nomor:'P-002',jabatan:'Guru'}]));
      localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'},{id:'d2',nama:'Umum'}]));
      localStorage.setItem('daftarProgram', JSON.stringify([{id:'p1',nama:'Donasi Gaji Guru',divisiId:'d1',sifat:'terikat',status:'aktif'}]));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const ketik = (x) => kirim("Input.insertText", { text: x });
    const tombol = async (key, code, vk) => { await kirim("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk }); };

    const nilai = (id) => evalJs("document.getElementById('" + id + "').value");
    const gajiTersimpan = () => evalJs("JSON.parse(localStorage.getItem('daftarPencatatanGaji')||'[]')");
    const jurnalTersimpan = () => evalJs("JSON.parse(localStorage.getItem('daftarJurnal')||'[]')");
    const galatTeks = () => evalJs("document.getElementById('pgaji-pesan-galat').hidden ? '' : document.getElementById('pgaji-pesan-galat').textContent");
    async function tambahKaryawan(kata, angka) {
      await klik("#pgaji-cari-karyawan"); await ketik(kata); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(400);
      await ketik(angka[0]);
      if (angka[1]) { await klik("#rgaji-iuran"); await ketik(angka[1]); }
      await klik("#lanjut-rincian-gaji"); await tunggu(400);
    }
    // ===== D0.3: centang Terikat (PRD 4.1, Keputusan 9) =====
    // Data contoh: aturan penomoran Pembayaran (BKK-) dan Jurnal Umum (JU-)
    await evalJs("localStorage.setItem('daftarPenomoran', JSON.stringify([{id:'nb',nama:'Pembayaran',pembukuan:'yayasan',tipe:'pembayaran',digit:4,komponen:[{jenis:'teks',nilai:'BKK-'},{jenis:'counter'}]},{id:'nj',nama:'Jurnal Umum',pembukuan:'yayasan',tipe:'jurnal',digit:4,komponen:[{jenis:'teks',nilai:'JU-'},{jenis:'counter'}]}])); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const bersihNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    // 1) Pembayaran: baris pertama, centang Terikat
    await evalJs("bukaPembayaranBaru(); (function(){if(document.activeElement){document.activeElement.blur();} var k=document.getElementById('bayar-kas'); k.value='a1'; k.dispatchEvent(new Event('change')); return true;})()"); await tunggu(400);
    await klik("#bayar-cari-akun"); await ketik("beban gaji"); await tunggu(250); await tombol("Enter", "Enter", 13); await tunggu(400);
    await ketik("400000");
    await klik('[data-rbayar-tab="info"]'); await tunggu(150);
    catat("Popup Rincian Pembayaran, tab Info lainnya: ada centang 'Terikat' (awal tidak dicentang), di antara Program dan Catatan", await evalJs("(function(){var c=document.getElementById('rbayar-terikat'); if(!c) return false; var urut=[...document.querySelectorAll('#rbayar-panel-info select, #rbayar-panel-info input, #rbayar-panel-info textarea')].map(function(x){return x.id;}); return !c.checked && urut.indexOf('rbayar-program') < urut.indexOf('rbayar-terikat') && urut.indexOf('rbayar-terikat') < urut.indexOf('rbayar-catatan') && /Terikat/.test(c.closest('label').textContent);})()"));
    await klik("#rbayar-terikat"); await tunggu(100);
    await foto("terikat-bayar-popup.png");
    await danaUji("rbayar"); await klik("#lanjut-rincian-bayar"); await tunggu(400);
    // 2) Baris kedua mengikuti centang baris terakhir
    await klik("#bayar-cari-akun"); await ketik("utang"); await tunggu(250); await tombol("Enter", "Enter", 13); await tunggu(400);
    catat("Baris berikutnya mengikuti centang Terikat baris terakhir (sudah tercentang)", await evalJs("document.getElementById('rbayar-terikat').checked"));
    await ketik("100000");
    await klik('[data-rbayar-tab="info"]'); await tunggu(150);
    await klik("#rbayar-terikat"); await tunggu(100);   // dilepas: baris ini tidak terikat
    await danaUji("rbayar"); await klik("#lanjut-rincian-bayar"); await tunggu(400);
    // 3) Buka lagi baris pertama: centangnya sesuai isinya sendiri
    await klik("#bayar-rincian tr.jurnal-baris-data"); await tunggu(300);
    catat("Klik baris pertama: centang Terikat tetap sesuai isinya (dicentang)", await evalJs("document.getElementById('rbayar-terikat').checked"));
    await danaUji("rbayar"); await klik("#lanjut-rincian-bayar"); await tunggu(300);
    await bersihNotif(); await klik("#bayar-simpan"); await tunggu(600);
    const by = await evalJs("JSON.parse(localStorage.getItem('daftarPembayaran')||'[]')");
    const jb = (await evalJs("JSON.parse(localStorage.getItem('daftarJurnal')||'[]')")).find(j => j.sumber && j.sumber.jenis === "pembayaran") || { rincian: [] };
    catat("Pembayaran tersimpan: baris Beban Gaji terikat=true, baris Utang Gaji terikat=false", by.length === 1 && by[0].rincian[0].terikat === true && by[0].rincian[1].terikat === false, JSON.stringify(by.map(b => b.rincian.map(r => r.nama + ":" + r.terikat))));
    catat("Jurnal otomatis: Beban Gaji terikat=true, Utang Gaji terikat=false, sisi Kas/Bank tidak terikat", jb.rincian.length === 3 && jb.rincian[0].terikat === true && jb.rincian[1].terikat === false && jb.rincian[2].akunId === "a1" && jb.rincian[2].terikat !== true, JSON.stringify(jb.rincian.map(r => r.nama + ":" + r.terikat)));
    // 4) Pembayaran gaji (Proses > Gaji membuat baris gaji): baris itu tidak terikat sampai dicentang
    catat("Baris gaji dari Proses dibuat tidak terikat (bisa dicentang di Info lainnya)", await evalJs("(function(){ bukaPembayaranGaji({id:'g1',nomor:'GJ-0001',periode:'Oktober 2026',akunBebanId:'a4'}, bacaDaftarAkun().find(function(a){return a.id==='a4';}), 500000); if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} return trxBayar.baris()[0].terikat===false; })()"));   // Data Baru berisi isian: ditanya dulu, dijawab Ya (PRD 6.10)
    // 5) Penerimaan: tidak punya centang Terikat
    catat("Penerimaan: popup baris TIDAK punya centang Terikat (Keputusan 9)", await evalJs("!document.getElementById('rterima-terikat') && !!document.getElementById('rterima-program')"));
    // 6) Jurnal Umum: popup Detail Akun punya centang yang sama
    await evalJs("bukaJurnalBaru(); true"); await tunggu(400);
    await klik("#jurnal-cari-akun"); await ketik("beban gaji"); await tunggu(250); await tombol("Enter", "Enter", 13); await tunggu(300);
    await ketik("250000");
    await klik('#dialog-detail-akun [data-detail-tab="info"]'); await tunggu(150);
    catat("Jurnal Umum, popup Detail Akun tab Info Lainnya: ada centang 'Terikat' (awal tidak dicentang)", await evalJs("!!document.getElementById('detail-terikat') && !document.getElementById('detail-terikat').checked"));
    await klik("#detail-terikat"); await tunggu(100);
    await foto("terikat-jurnal-popup.png");
    await danaUji("detail"); await klik("#lanjut-detail-akun"); await tunggu(400);
    await klik("#jurnal-cari-akun"); await ketik("kas kecil"); await tunggu(250); await tombol("Enter", "Enter", 13); await tunggu(300);
    catat("Jurnal Umum: baris berikutnya mengikuti centang Terikat baris terakhir", await evalJs("document.getElementById('detail-terikat').checked"));
    await klik('input[name="detail-sisi"][value="kredit"]'); await danaUji("detail"); await klik("#detail-nilai"); await ketik("250000");
    await klik('#dialog-detail-akun [data-detail-tab="info"]'); await tunggu(150);
    await klik("#detail-terikat"); await tunggu(100);   // sisi Kas dilepas
    await danaUji("detail"); await klik("#lanjut-detail-akun"); await tunggu(400);
    await bersihNotif(); await klik("#jurnal-simpan"); await tunggu(600);
    const ju = (await evalJs("JSON.parse(localStorage.getItem('daftarJurnal')||'[]')")).find(j => !j.sumber) || { rincian: [] };
    catat("Jurnal Umum tersimpan: Beban Gaji terikat=true, Kas Kecil terikat=false", ju.rincian.length === 2 && ju.rincian[0].terikat === true && ju.rincian[1].terikat === false, JSON.stringify(ju.rincian.map(r => r.nama + ":" + r.terikat)));
    // ===== D0.4: Dana wajib dipilih, Terikat / Tidak Terikat (PRD 4.1) =====
    const galatJu = () => evalJs("document.getElementById('area-notifikasi').textContent");   // peringatan baris: notifikasi pojok kanan (PRD 5.1)
    catat("Popup Detail Akun: bagian Dana punya dua centang (Terikat, Tidak Terikat) berdampingan", await evalJs("(function(){var t=document.getElementById('detail-terikat'), n=document.getElementById('detail-tidak-terikat'); return !!t && !!n && /Tidak Terikat/.test(n.parentElement.textContent) && Math.abs(t.getBoundingClientRect().top - n.getBoundingClientRect().top) < 4 || (!!t && !!n && t.closest('.pilihan-dana')===n.closest('.pilihan-dana'));})()"));
    await evalJs("modulJurnal.bukaBaru(); true"); await tunggu(300);
    // Baris pertama: Dana belum dipilih; dua centang saling melepas
    await evalJs("bukaDetailAkunJurnal(bacaDaftarAkun().find(function(a){return a.id==='a4';}), null); true"); await tunggu(200);
    catat("Baris pertama (Beban Gaji): Dana belum dipilih (kedua centang kosong)", await evalJs("!document.getElementById('detail-terikat').checked && !document.getElementById('detail-tidak-terikat').checked"));
    await klik("#dialog-detail-akun [data-detail-tab='info']"); await tunggu(100);
    await klik("#detail-terikat"); await tunggu(80); await klik("#detail-tidak-terikat"); await tunggu(80);
    catat("Mencentang Tidak Terikat melepas Terikat (hanya satu yang bisa dicentang)", await evalJs("!document.getElementById('detail-terikat').checked && document.getElementById('detail-tidak-terikat').checked"));
    await klik("#detail-tidak-terikat"); await tunggu(80);   // dilepas lagi: belum dipilih
    await evalJs("document.querySelector('input[name=\"detail-sisi\"][value=\"debit\"]').checked=true; document.getElementById('detail-nilai').value='300.000'; document.getElementById('detail-divisi').value='d1'; true");
    // Peringatan sedini mungkin (PRD 5.1): Lanjut langsung ditolak, popup tetap terbuka di tab Info Lainnya
    await bersihNotifUji(); await klik("#lanjut-detail-akun"); await tunggu(300);
    catat("Lanjut dengan Dana belum dipilih: ditolak saat itu juga (notifikasi pojok kanan), popup tetap terbuka di tab Info Lainnya, baris belum masuk", /Pilih Terikat atau Tidak Terikat/.test(await galatJu()) && await evalJs("dialogDetailAkun.open && !document.getElementById('detail-panel-info').hidden && barisJurnal.length===0"), await galatJu());
    catat("Notifikasi peringatan terlihat DI ATAS popup (tidak tertutup lapisan gelap popup)", await evalJs("(function(){var n=document.querySelector('#area-notifikasi .notifikasi'); var r=n.getBoundingClientRect(); var e=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return !!e && n.contains(e);})()"));
    await klik("#area-notifikasi .notifikasi button"); await tunggu(400);
    catat("Tombol × notifikasi bisa diklik: notifikasi tertutup, popup tetap terbuka (isian tidak hilang)", await evalJs("document.querySelectorAll('#area-notifikasi .notifikasi').length===0 && dialogDetailAkun.open && document.getElementById('detail-nilai').value==='300.000'"));
    await evalJs("(function(){document.getElementById('detail-terikat').checked=true; document.getElementById('detail-divisi').value=''; return true;})()");
    await bersihNotifUji(); await klik("#lanjut-detail-akun"); await tunggu(300);
    catat("Lanjut dengan Divisi kosong: ditolak 'Divisi wajib dipilih', popup tetap terbuka", /Divisi wajib dipilih/.test(await galatJu()) && await evalJs("dialogDetailAkun.open && barisJurnal.length===0"), await galatJu());
    await evalJs("document.getElementById('detail-divisi').value='d1'; true");
    await bersihNotifUji(); await klik("#lanjut-detail-akun"); await tunggu(300);
    catat("Divisi dan Dana sudah diisi: Lanjut berhasil, baris masuk (Terikat, Divisi d1)", await evalJs("!dialogDetailAkun.open && barisJurnal.length===1 && barisJurnal[0].terikat===true && barisJurnal[0].divisiId==='d1'"));
    await evalJs("bukaDetailAkunJurnal(bacaDaftarAkun().find(function(a){return a.id==='a1';}), null); document.querySelector('input[name=\"detail-sisi\"][value=\"kredit\"]').checked=true; document.getElementById('detail-nilai').value='300.000'; document.getElementById('detail-divisi').value=''; document.getElementById('detail-terikat').checked=false; document.getElementById('detail-tidak-terikat').checked=false; true"); await tunggu(150);
    await bersihNotifUji(); await klik("#lanjut-detail-akun"); await tunggu(300);
    catat("Baris Kas Kecil (Kas & Bank) tanpa Divisi dan tanpa Dana: Lanjut tetap boleh (tidak wajib)", await evalJs("!dialogDetailAkun.open && barisJurnal.length===2") && !/wajib|Pilih Terikat/.test(await galatJu()));
    // Pemeriksaan kedua saat Simpan (untuk baris yang tidak masuk lewat popup)
    await evalJs("barisJurnal[0].terikat = null; true");
    const jumlahJu = () => evalJs("JSON.parse(localStorage.getItem('daftarJurnal')||'[]').length");
    const juSebelum = await jumlahJu();
    await bersihNotifUji(); await klik("#jurnal-simpan"); await tunggu(400);
    catat("Simpan Jurnal Umum dengan baris Beban Gaji belum dipilih Dana: ditolak, pesan menyebut barisnya", /Baris 610101 Beban Gaji belum dipilih Terikat atau Tidak Terikat/.test(await galatJu()) && (await jumlahJu()) === juSebelum, (await galatJu()) + " | baris=" + JSON.stringify(await evalJs("barisJurnal.map(function(b){return b.nama+\":\"+b.terikat+\":\"+b.debit+\"/\"+b.kredit;})")) + " | status=" + (await evalJs("document.getElementById('jurnal-status').textContent")) + " disabled=" + (await evalJs("document.getElementById('jurnal-simpan').disabled")));
    // Divisi wajib (PRD 5.1): Dana sudah dipilih tetapi Divisi dikosongkan -> ditolak dengan notifikasi
    await evalJs("barisJurnal[0].terikat = true; barisJurnal[0].divisiId = ''; true");
    await bersihNotifUji(); await klik("#jurnal-simpan"); await tunggu(400);
    catat("Divisi wajib: baris Beban Gaji tanpa Divisi ditolak dengan notifikasi pojok kanan 'belum diisi Divisi'", /Baris 610101 Beban Gaji belum diisi Divisi/.test(await galatJu()) && await evalJs("!!document.querySelector('#area-notifikasi .notifikasi-peringatan')") && (await jumlahJu()) === juSebelum, await galatJu());
    catat("Popup Detail Akun: pilihan Divisi kosong bertulisan 'Pilih Divisi...'", await evalJs("document.getElementById('detail-divisi').options[0].textContent==='Pilih Divisi...'"));
    await evalJs("barisJurnal[0].divisiId = 'd1'; true");
    await bersihNotifUji();
    await klik("#jurnal-simpan"); await tunggu(400);
    const juBaru = (await evalJs("JSON.parse(localStorage.getItem('daftarJurnal'))")).slice(-1)[0] || {};
    catat("Baris Kas Kecil (Kas & Bank) tidak wajib dipilih: setelah Beban Gaji dipilih Terikat, jurnal tersimpan", (await jumlahJu()) === juSebelum + 1 && juBaru.rincian[0].terikat === true && juBaru.rincian.length === 2, JSON.stringify((juBaru.rincian || []).map(r => r.nama + ":" + r.terikat)));
    // Data lama tanpa pilihan Dana dianggap Tidak Terikat
    await evalJs("(function(){var d=JSON.parse(localStorage.getItem('daftarJurnal')); d.push({id:'jlama',nomor:'JU-LAMA',nama:'JU-LAMA',tanggal:'2026-10-01',rincian:[{id:'x1',akunId:'a4',kode:'610101',nama:'Beban Gaji',debit:1000,kredit:0,divisiId:'d1'},{id:'x2',akunId:'a1',kode:'110101',nama:'Kas Kecil',debit:0,kredit:1000}]}); localStorage.setItem('daftarJurnal', JSON.stringify(d)); modulJurnal.bukaUbah(d.slice(-1)[0]); return true;})()"); await tunggu(300);
    catat("Jurnal lama (baris tanpa tanda Dana) dibuka: barisnya dianggap Tidak Terikat", await evalJs("barisJurnal[0].terikat===false && barisJurnal[1].terikat===false"));
    await bersihNotifUji(); await klik("#jurnal-simpan"); await tunggu(400);
    catat("Jurnal lama bisa disimpan ulang tanpa memilih lagi", /berhasil disimpan/.test(await galatJu()) && !/belum/.test(await galatJu()) && (await evalJs("JSON.parse(localStorage.getItem('daftarJurnal')).find(function(j){return j.id==='jlama';}).rincian[0].terikat===false")));
    // Pembayaran: aturan yang sama
    await evalJs("trxBayar.bukaBaru(); true"); await tunggu(300);
    await evalJs("(function(){var s=document.getElementById('bayar-kas'); s.value='a1'; s.dispatchEvent(new Event('change',{bubbles:true})); trxBayar.aturBaris([{id:'rb1',akunId:'a4',kode:'610101',nama:'Beban Gaji',nilai:5000,divisiId:'d1',programId:'',terikat:null,catatan:''}]); return true;})()"); await tunggu(200);
    await bersihNotifUji(); await evalJs("document.getElementById('form-bayar').requestSubmit(); true"); await tunggu(400);
    catat("Simpan Pembayaran dengan baris belum dipilih Dana: ditolak dengan pesan yang sama", /Baris 610101 Beban Gaji belum dipilih Terikat atau Tidak Terikat/.test(await evalJs("document.getElementById('area-notifikasi').textContent")));
    // Penerimaan: Divisi juga wajib (sifat terikat dilihat dari Divisinya), tanpa bagian Dana
    await evalJs("trxTerima.bukaBaru(); true"); await tunggu(300);
    await evalJs("(function(){var s=document.getElementById('terima-kas'); s.value='a1'; s.dispatchEvent(new Event('change',{bubbles:true})); trxTerima.aturBaris([{id:'rt1',akunId:'a3',kode:'210101',nama:'Utang Gaji',nilai:7000,divisiId:'',programId:'',terikat:false,catatan:''}]); return true;})()"); await tunggu(200);
    await bersihNotifUji(); await evalJs("document.getElementById('form-terima').requestSubmit(); true"); await tunggu(400);
    catat("Penerimaan: baris tanpa Divisi ditolak dengan notifikasi 'belum diisi Divisi'", /Baris 210101 Utang Gaji belum diisi Divisi/.test(await evalJs("document.getElementById('area-notifikasi').textContent")));
    await evalJs("(function(){trxTerima.baris()[0].divisiId='d1'; var s=document.getElementById('terima-nomor-otomatis'); s.checked=false; s.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('terima-nomor').value='BKM-UJI-1'; return true;})()");
    await bersihNotifUji(); await evalJs("document.getElementById('form-terima').requestSubmit(); true"); await tunggu(400);
    catat("Penerimaan dengan Divisi: tersimpan (tanpa diminta memilih Dana)", (await evalJs("JSON.parse(localStorage.getItem('daftarPenerimaan')||'[]').length")) === 1, await evalJs("document.getElementById('area-notifikasi').textContent + ' | ' + (document.getElementById('terima-pesan-galat').hidden?'':document.getElementById('terima-pesan-galat').textContent)"));
    catat("Popup baris Pembayaran: dua centang Dana; Penerimaan tetap tanpa bagian Dana", await evalJs("!!document.getElementById('rbayar-terikat') && !!document.getElementById('rbayar-tidak-terikat') && !document.getElementById('rterima-terikat') && !document.getElementById('rterima-tidak-terikat')"));
    // 7) Data rusak: terikat bukan true dibaca tidak terikat
    catat("Data rusak (terikat: 'ya') dan baris pertama: Dana belum dipilih (null), wajib dipilih", await evalJs("isianAwalDariBarisTerakhir([{divisiId:'',programId:'',terikat:'ya'}]).terikat===null && isianAwalDariBarisTerakhir([]).terikat===null"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();