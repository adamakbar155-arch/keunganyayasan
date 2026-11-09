// Uji Histori Akun di Chrome asli. Pemakaian: node uji-chrome-histori-akun.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9376;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
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
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: PEMBUNGKUS_AKUN }); await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    await evalJs(`(function(){ localStorage.clear();
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
    // Data contoh (bukan data asli): Kas Kecil (a1) saldo awal 1.000.000; satu jurnal sebelum rentang (+200.000);
    // dalam rentang 2026-10-01..2026-10-31: Pembayaran 300.000 (No Cek CK-01), Penerimaan 500.000, Transfer keluar 100.000,
    // Jurnal Umum 50.000 keluar. Satu jurnal untuk akun lain (tidak boleh ikut).
    await evalJs(`(function(){
      var a=JSON.parse(localStorage.getItem('daftarAkun')); a.forEach(function(x){ if(x.id==='a1'){ x.saldoAwal=1000000; } });
      a.push({id:'a6',kode:'110201',nama:'Bank BSI',tipe:'kas-bank',saldoAwal:0}); localStorage.setItem('daftarAkun', JSON.stringify(a));
      localStorage.setItem('daftarPembayaran', JSON.stringify([{id:'by1',nomor:'BKK-0001',nama:'BKK-0001',tanggal:'2026-10-05',kasId:'a1',kas:'110101 - Kas Kecil',noCek:'CK-01',penerima:'Toko A',catatan:'Beli ATK',rincian:[{id:'r1',akunId:'a4',kode:'610101',nama:'Beban Gaji',nilai:300000}],total:300000}]));
      localStorage.setItem('daftarPenerimaan', JSON.stringify([{id:'tm1',nomor:'BKM-0001',nama:'BKM-0001',tanggal:'2026-10-07',kasId:'a1',kas:'110101 - Kas Kecil',noCek:'',pemberi:'Bapak B',catatan:'',rincian:[],total:500000}]));
      localStorage.setItem('daftarTransfer', JSON.stringify([{id:'tf1',nomor:'TF-0001',nama:'TF-0001',tanggal:'2026-10-09',dariId:'a1',dari:'110101 - Kas Kecil',keId:'a6',ke:'110201 - Bank BSI',nilai:100000,catatan:''}]));
      localStorage.setItem('daftarJurnal', JSON.stringify([
        {id:'j0',nomor:'JU-0000',nama:'JU-0000',tanggal:'2026-09-20',keterangan:'Sebelum rentang',rincian:[{akunId:'a1',kode:'110101',nama:'Kas Kecil',debit:200000,kredit:0},{akunId:'a4',kode:'610101',nama:'Beban Gaji',debit:0,kredit:200000}]},
        {id:'jb',nomor:'BKK-0001',nama:'BKK-0001',tanggal:'2026-10-05',dibuatPada:'2026-10-05T08:00:00',keterangan:'Beli ATK',sumber:{jenis:'pembayaran',id:'by1'},rincian:[{akunId:'a4',kode:'610101',nama:'Beban Gaji',debit:300000,kredit:0},{akunId:'a1',kode:'110101',nama:'Kas Kecil',debit:0,kredit:300000}]},
        {id:'jt',nomor:'BKM-0001',nama:'BKM-0001',tanggal:'2026-10-07',keterangan:'Penerimaan dari Bapak B',sumber:{jenis:'penerimaan',id:'tm1'},rincian:[{akunId:'a1',kode:'110101',nama:'Kas Kecil',debit:500000,kredit:0},{akunId:'a4',kode:'610101',nama:'Beban Gaji',debit:0,kredit:500000}]},
        {id:'jf',nomor:'TF-0001',nama:'TF-0001',tanggal:'2026-10-09',keterangan:'Transfer dari Kas ke Bank',sumber:{jenis:'transfer',id:'tf1'},rincian:[{akunId:'a6',kode:'110201',nama:'Bank BSI',debit:100000,kredit:0},{akunId:'a1',kode:'110101',nama:'Kas Kecil',debit:0,kredit:100000}]},
        {id:'ju',nomor:'JU-0001',nama:'JU-0001',tanggal:'2026-10-10',keterangan:'Jurnal biasa',rincian:[{akunId:'a4',kode:'610101',nama:'Beban Gaji',debit:50000,kredit:0},{akunId:'a1',kode:'110101',nama:'Kas Kecil',debit:0,kredit:50000}]},
        {id:'jx',nomor:'JU-0002',nama:'JU-0002',tanggal:'2026-10-11',keterangan:'Akun lain',rincian:[{akunId:'a6',kode:'110201',nama:'Bank BSI',debit:9000,kredit:0},{akunId:'a4',kode:'610101',nama:'Beban Gaji',debit:0,kredit:9000}]}]));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    // ===== Histori Akun (PRD 6.4): komponen bersama, tanpa No Cek dan ceklis =====
    await evalJs("localStorage.setItem('tandaRekonsiliasi', JSON.stringify([{id:'rk1',jurnalId:'jb',akunId:'a1',ditandaiOleh:'Uji',ditandaiPada:'2026-10-26T08:00:00'}])); true");
    const isiTabel = () => evalJs("[...document.querySelectorAll('#histori-akun-badan tr')].map(function(tr){return [...tr.cells].map(function(td){return td.textContent;}).join('|');})");
    const judulKolom = () => evalJs("[...document.querySelectorAll('#isi-histori-akun thead th')].map(function(th){return th.textContent.trim();}).join('|')");
    // 1) Buka dari popup Buku Besar
    await klik("#tombol-buku-besar"); await tunggu(300);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Histori Akun"]'); await tunggu(500);
    catat("Popup Buku Besar > Histori Akun: tab terbuka, tanggal bawaan awal bulan s/d hari ini, minta pilih Kas/Bank", await evalJs("!document.getElementById('isi-histori-akun').hidden && document.getElementById('histori-akun-dari').value===tanggalHariIni().slice(0,8)+'01' && document.getElementById('histori-akun-sampai').value===tanggalHariIni() && /Pilih Kas\\/Bank/.test(document.getElementById('petunjuk-histori-akun').textContent)"));
    catat("Pilihan akun hanya Kas & Bank tingkat 3 (Kas Kecil, Bank BSI)", await evalJs("[...document.getElementById('histori-akun-kas').options].map(function(o){return o.textContent;}).join('|')==='Pilih Kas/Bank...|110101 - Kas Kecil|110201 - Bank BSI'"));
    catat("Judul kolom seperti foto Accurate: tanpa No Cek dan tanpa kolom #", (await judulKolom()) === "Tanggal|No. Sumber #|Tipe Transaksi|Keterangan|Mutasi|Tipe|Saldo", await judulKolom());
    // 2) Kas Kecil, Oktober 2026
    await evalJs("(function(){document.getElementById('histori-akun-dari').value='2026-10-01'; document.getElementById('histori-akun-sampai').value='2026-10-31'; var k=document.getElementById('histori-akun-kas'); k.value='a1'; k.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    let b = await isiTabel();
    catat("Saldo Awal 1.200.000 di kolom Mutasi dan Saldo; 4 transaksi; Total 50.000 Dr (hitungan sama dengan Histori Bank)", b.length === 6 && b[0] === "||Saldo Awal|Saldo per 30 Sep 2026|1.200.000||1.200.000" && b[5] === "||Total|Total|50.000|Dr|", JSON.stringify(b));
    catat("Baris Pembayaran tanpa No Cek: 5 Okt 2026 | BKK-0001 | Pembayaran | Beli ATK | 300.000 merah | Cr | 900.000", b[1] === "5 Okt 2026|BKK-0001|Pembayaran|Beli ATK|300.000|Cr|900.000" && await evalJs("document.querySelectorAll('#histori-akun-badan tr')[1].cells[4].classList.contains('angka-negatif')"), b[1]);
    catat("Transaksi yang sudah direkonsiliasi tidak diberi ceklis di Histori Akun", await evalJs("document.querySelectorAll('#isi-histori-akun .histori-ceklis, #isi-histori-akun .histori-kol-cek').length===0"));
    await foto("histori-akun.png");
    // 3) Tombol ⇄ milik Histori Akun sendiri
    await klik("#histori-akun-ganti-tampilan"); await tunggu(300);
    b = await isiTabel();
    catat("⇄: Debit/Kredit (Pembayaran 0 | 300.000; Total 500.000 | 450.000)", /\|Debit\|Kredit\|Saldo$/.test(await judulKolom()) && b[1] === "5 Okt 2026|BKK-0001|Pembayaran|Beli ATK|0|300.000|900.000" && b[5] === "||Total|Total|500.000|450.000|", JSON.stringify([b[1], b[5]]));
    catat("Pilihan tampilan Histori Akun tersimpan terpisah dari Histori Bank", await evalJs("localStorage.getItem('tampilanHistori-histori-akun')==='debit-kredit' && localStorage.getItem('tampilanHistori-histori-bank')===null && document.getElementById('histori-bank-ganti-tampilan').getAttribute('aria-pressed')==='false'"));
    await foto("histori-akun-debit-kredit.png");
    // 4) Ekspor CSV tanpa kolom No Cek
    await evalJs("window.__csv=null; window.unduhTeks=function(n,isi,t){ window.__csv={n:n,isi:isi,t:t}; return true; }; document.getElementById('histori-akun-ekspor').click(); true"); await tunggu(300);
    const csv = await evalJs("window.__csv");
    catat("Ekspor: file histori-akun.csv, tanpa kolom No Cek, mengikuti tampilan Debit/Kredit", csv && csv.n === "histori-akun.csv" && csv.isi.split("\r\n")[0].replace(/^﻿/, "") === '"Tanggal";"No. Sumber";"Tipe Transaksi";"Keterangan";"Debit";"Kredit";"Saldo"' && /"BKK-0001";"Pembayaran";"Beli ATK";"0";"300000";"900000"/.test(csv.isi), csv && csv.isi.slice(0, 200));
    catat("Notifikasi unduhan menyebut Histori Akun", /Histori Akun telah diunduh/.test(await evalJs("(function(){var n=document.querySelectorAll('.notifikasi'); return n.length ? n[n.length-1].textContent : '';})()")));
    // 5) Klik baris membuka transaksi asal
    await evalJs("document.querySelectorAll('#histori-akun-badan tr')[1].click(); true"); await tunggu(500);
    catat("Klik baris Pembayaran: tab Pembayaran terbuka dengan BKK-0001", await evalJs("!document.getElementById('isi-bayar').hidden && modulBayar.idDiubah==='by1'"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
