// Uji Pencatatan Gaji di Chrome asli. Pemakaian: node uji-chrome-gaji.js <chrome.exe> <menu.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9364;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
const danaUji = (p) => evalJs("(function(){var t=document.getElementById('" + p + "-terikat'), n=document.getElementById('" + p + "-tidak-terikat'); if(t&&n&&!t.checked&&!n.checked){n.checked=true;} var d=document.getElementById('" + p + "-divisi'); if(d&&d.value===''){var o=[].slice.call(d.options).find(function(x){return x.value;}); if(o){d.value=o.value; d.dispatchEvent(new Event('change',{bubbles:true}));}} return true;})()");   // Dana belum dipilih -> Tidak Terikat (arti lama, PRD 4.1); Divisi kosong -> divisi pertama (wajib, PRD 5.1)
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
    // Kepala Pencatatan Gaji diisi seperti pengguna (Data Baru dibuka kosong, PRD 5.3a)
    const isiKepalaGaji = () => evalJs("(function(){var h=tanggalHariIni(); function isi(id,v){var e=document.getElementById(id); e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));} isi('pgaji-tipe','bulanan'); isi('pgaji-bulan',String(Number(h.slice(5,7)))); isi('pgaji-tahun',h.slice(0,4)); isi('pgaji-tanggal',h); isi('pgaji-jatuh-tempo',h); isi('pgaji-aturan-nomor','g1'); return true;})()");
    async function tambahKaryawan(kata, angka) {
      await klik("#pgaji-cari-karyawan"); await ketik(kata); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(400);
      await ketik(angka[0]);
      if (angka[1]) { await klik("#rgaji-iuran"); await ketik(angka[1]); }
      await klik("#lanjut-rincian-gaji"); await tunggu(400);
    }
    // Tambahan data: aturan penomoran Pembayaran
    await evalJs("(function(){var p=JSON.parse(localStorage.getItem('daftarPenomoran')||'[]'); p.push({id:'nb',nama:'Pembayaran',pembukuan:'yayasan',tipe:'pembayaran',digit:4,komponen:[{jenis:'teks',nilai:'BKK-'},{jenis:'counter'}]}); localStorage.setItem('daftarPenomoran', JSON.stringify(p)); return true;})()");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-buku-besar"); await tunggu(300);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Pencatatan Gaji"]'); await tunggu(500);
    const bersihNotif = () => evalJs("document.getElementById('area-notifikasi').textContent=''; true");
    const statusForm = () => evalJs("document.getElementById('pgaji-status').value");
    const galatBayar = () => evalJs("document.getElementById('bayar-pesan-galat').hidden ? '' : document.getElementById('bayar-pesan-galat').textContent");
    const pembayaran = () => evalJs("JSON.parse(localStorage.getItem('daftarPembayaran')||'[]')");
    async function aturBaris(nilai, divisi) {
      // Kursor dilepas dulu: pemilih yang sedang difokus mengembalikan pilihan lamanya saat ditinggal tanpa memilih
      await evalJs("(function(){if(document.activeElement){document.activeElement.blur();} var k=document.getElementById('bayar-kas'); k.value='a1'; k.dispatchEvent(new Event('change')); return true;})()");
      await klik("#bayar-rincian tr.jurnal-baris-data"); await tunggu(300);
      await evalJs("(function(){var n=document.getElementById('rbayar-nilai'); n.value='" + nilai + "'; n.dispatchEvent(new Event('input')); var d=document.getElementById('rbayar-divisi'); d.value='" + divisi + "'; d.dispatchEvent(new Event('change')); return true;})()");
      await danaUji("rbayar"); await klik("#lanjut-rincian-bayar"); await tunggu(300);
    }
    async function prosesGaji() {
      // Notifikasi (misalnya peringatan kas minus mode peringatan) dibersihkan dulu supaya tidak menutupi tombol Proses
      await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
      await evalJs("modulPgaji.bukaUbah(JSON.parse(localStorage.getItem('daftarPencatatanGaji'))[0]); tampilkanTab('pgaji'); true"); await tunggu(400);
      await klik("#pgaji-proses"); await tunggu(200); await klik("#pgaji-proses-gaji"); await tunggu(500); await evalJs("if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(300);
    }

    // 1) Catat gaji 4.950.000 lalu Proses
    await isiKepalaGaji(); await tunggu(150);
    await tambahKaryawan("gun", ["3000000", "50000"]);
    await tambahKaryawan("ani", ["2000000"]);
    await evalJs("(function(){var b=document.getElementById('pgaji-beban'); b.value='a4'; return true;})()");
    await bersihNotif(); await klik("#pgaji-proses"); await tunggu(200); await klik("#pgaji-proses-gaji"); await tunggu(600); await evalJs("if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(300);
    const g = (await gajiTersimpan())[0] || {};
    catat("Proses: gaji GJ-0001 (4.950.000) tersimpan, Pembayaran terbuka dengan baris 4.950.000", g.totalDibayarkan === 4950000 && await evalJs("!document.getElementById('isi-bayar').hidden && trxBayar.baris().length===1 && trxBayar.baris()[0].nilai===4950000"));
    // 2) Bayar sebagian 3.000.000 dari Kas Kecil untuk Divisi Pendidikan
    await aturBaris("3000000", "d1");
    await bersihNotif(); await klik("#bayar-simpan"); await tunggu(600);
    const by1 = await pembayaran(), j1 = (await jurnalTersimpan()).find(j => j.sumber && j.sumber.jenis === "pembayaran") || {};
    catat("Bayar 3.000.000: Pembayaran BKK-0001 tersimpan, baris tertaut ke gaji", by1.length === 1 && by1[0].nomor === "BKK-0001" && by1[0].rincian[0].gajiId === g.id && by1[0].total === 3000000, await galatBayar());
    catat("Jurnal: Debit 610101 Beban Gaji 3.000.000 [Divisi d1], Kredit 110101 Kas Kecil 3.000.000", j1.rincian && j1.rincian[0].kode === "610101" && j1.rincian[0].debit === 3000000 && j1.rincian[0].divisiId === "d1" && j1.rincian[1].kode === "110101" && j1.rincian[1].kredit === 3000000, JSON.stringify(j1.rincian && j1.rincian.map(r => r.kode + ":" + r.debit + "/" + r.kredit + ":" + r.divisiId)));
    await prosesGaji();
    catat("Kembali ke gaji: Status 'Sebagian (sisa Rp 1.950.000)'; Proses membuka Pembayaran baru berisi SISA 1.950.000", await evalJs("trxBayar.baris().length===1 && trxBayar.baris()[0].nilai===1950000 && modulBayar.idDiubah===null"), await evalJs("JSON.stringify(trxBayar.baris().map(function(b){return b.nilai;}))"));
    // 3) Bayar berlebih ditolak
    await aturBaris("2000000", "d2");
    await bersihNotif(); await klik("#bayar-simpan"); await tunggu(400);
    catat("Bayar 2.000.000 (lebih dari sisa): ditolak 'melebihi sisa ... (sisa Rp 1.950.000)', tidak tersimpan", /melebihi sisa yang belum dibayar \(sisa Rp 1\.950\.000\)/.test(await galatBayar()) && (await pembayaran()).length === 1, await galatBayar());
    // 4) Bayar sisa dari Divisi lain: Lunas
    await aturBaris("1950000", "d2");
    await bersihNotif(); await klik("#bayar-simpan"); await tunggu(600);
    catat("Bayar sisa 1.950.000 (Divisi d2): tersimpan sebagai BKK-0002", (await pembayaran()).length === 2 && (await pembayaran())[1].nomor === "BKK-0002", await galatBayar());
    await evalJs("modulPgaji.bukaUbah(JSON.parse(localStorage.getItem('daftarPencatatanGaji'))[0]); tampilkanTab('pgaji'); true"); await tunggu(400);
    catat("Gaji: Status 'Lunas', Proses abu-abu", (await statusForm()) === "Lunas" && await evalJs("document.getElementById('pgaji-proses').disabled"), await statusForm());
    catat("Saldo: Beban Gaji 4.950.000, Kas Kecil -4.950.000 (beban tercatat saat bayar, per Divisi)", await evalJs("petaAkun().total['a4']===4950000 && petaAkun().total['a1']===-4950000"), await evalJs("JSON.stringify([petaAkun().total['a4'], petaAkun().total['a1']])"));
    catat("Jurnal gaji per Divisi: d1 3.000.000 dan d2 1.950.000", await evalJs("(function(){var j=JSON.parse(localStorage.getItem('daftarJurnal')); var d={}; j.forEach(function(x){ x.rincian.forEach(function(r){ if(r.kode==='610101'){ d[r.divisiId]=(d[r.divisiId]||0)+r.debit; } }); }); return d.d1===3000000 && d.d2===1950000;})()"));
    // 5) Hapus pembayaran kedua: kembali Sebagian
    await evalJs("modulBayar.hapus(JSON.parse(localStorage.getItem('daftarPembayaran'))[1]); true"); await tunggu(300); await klik("#ya-konfirmasi"); await tunggu(400);
    await evalJs("modulPgaji.bukaUbah(JSON.parse(localStorage.getItem('daftarPencatatanGaji'))[0]); tampilkanTab('pgaji'); true"); await tunggu(400);
    catat("Pembayaran kedua dihapus: gaji kembali 'Sebagian (sisa Rp 1.950.000)', jurnalnya ikut hilang", (await statusForm()) === "Sebagian (sisa Rp 1.950.000)" && (await jurnalTersimpan()).filter(j => j.sumber && j.sumber.jenis === "pembayaran").length === 1, await statusForm());
    await foto("bayar-gaji-sebagian.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
