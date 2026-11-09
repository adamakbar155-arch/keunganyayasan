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
    const isiTabel = () => evalJs("[...document.querySelectorAll('#histori-bank-badan tr')].map(function(tr){return [...tr.cells].slice(0,8).map(function(td){return td.textContent;}).join('|');})");
    catat("Kolom terakhir '#' (ceklis rekonsiliasi) ada di judul tabel", await evalJs("document.querySelector('#isi-histori-bank thead th:last-child').classList.contains('histori-kol-cek')"));
    // 1) Buka dari popup Kas & Bank
    await klik("#tombol-kas"); await tunggu(300);
    await klik('#panel-kas .kotak-menu[data-halaman="Histori Bank"]'); await tunggu(500);
    catat("Popup > Histori Bank: tab terbuka, tanggal bawaan awal bulan s/d hari ini, minta pilih Kas/Bank", await evalJs("!document.getElementById('isi-histori-bank').hidden && document.getElementById('histori-bank-dari').value===tanggalHariIni().slice(0,8)+'01' && document.getElementById('histori-bank-sampai').value===tanggalHariIni() && /Pilih Kas\\/Bank/.test(document.getElementById('petunjuk-histori-bank').textContent)"));
    catat("Pilihan Kas/Bank hanya tingkat 3 (Kas Kecil, Bank BSI)", await evalJs("[...document.getElementById('histori-bank-kas').options].map(function(o){return o.textContent;}).join('|')==='Pilih Kas/Bank...|110101 - Kas Kecil|110201 - Bank BSI'"), await evalJs("[...document.getElementById('histori-bank-kas').options].map(function(o){return o.textContent;}).join('|')"));
    // 2) Pilih Kas Kecil, rentang Oktober 2026
    await evalJs("(function(){document.getElementById('histori-bank-dari').value='2026-10-01'; document.getElementById('histori-bank-sampai').value='2026-10-31'; var k=document.getElementById('histori-bank-kas'); k.value='a1'; k.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    const baris = await isiTabel();
    catat("Baris pertama: Saldo Awal 'Saldo per 30 Sep 2026' = 1.000.000 + 200.000 = 1.200.000, tampil juga di kolom Mutasi (seperti Accurate)", baris[0] === "|||Saldo Awal|Saldo per 30 Sep 2026|1.200.000||1.200.000", baris[0]);
    catat("4 transaksi Kas Kecil berurutan tanggal (jurnal akun lain tidak ikut) + baris Total", baris.length === 6, JSON.stringify(baris));
    catat("Baris Total: mutasi bersih 500.000 - 450.000 = 50.000 Dr (Saldo Awal 1.200.000 + 50.000 = saldo akhir 1.250.000), tebal, tidak merah", baris[5] === "|||Total|Total|50.000|Dr|" && await evalJs("(function(){var r=document.querySelector('#histori-bank-badan tr:last-child'); return r.classList.contains('histori-total') && !r.cells[5].classList.contains('angka-negatif') && !r.querySelector('.histori-ceklis');})()"), baris[5]);
    catat("Pembayaran: BKK-0001, No Cek CK-01, Tipe 'Pembayaran', Keterangan 'Beli ATK', 300.000 Cr, saldo 900.000", baris[1] === "5 Okt 2026|BKK-0001|CK-01|Pembayaran|Beli ATK|300.000|Cr|900.000", baris[1]);
    catat("Penerimaan 500.000 Dr -> saldo 1.400.000; Transfer 100.000 Cr -> 1.300.000; Jurnal Umum 50.000 Cr -> 1.250.000", baris[2] === "7 Okt 2026|BKM-0001||Penerimaan|Penerimaan dari Bapak B|500.000|Dr|1.400.000" && baris[3] === "9 Okt 2026|TF-0001||Transfer Bank|Transfer dari Kas ke Bank|100.000|Cr|1.300.000" && baris[4] === "10 Okt 2026|JU-0001||Jurnal Umum|Jurnal biasa|50.000|Cr|1.250.000", JSON.stringify(baris.slice(2)));
    catat("Mutasi uang keluar (Cr) merah, uang masuk (Dr) tidak", await evalJs("(function(){var r=document.querySelectorAll('#histori-bank-badan tr'); return r[1].cells[5].classList.contains('angka-negatif') && !r[2].cells[5].classList.contains('angka-negatif');})()"));
    catat("Saldo akhir sama dengan saldo di Akun Perkiraan (1.250.000)", await evalJs("petaAkun().total['a1']===1250000"), await evalJs("String(petaAkun().total['a1'])"));
    await foto("histori-bank.png");
    // 2b) Tombol ⇄: Mutasi + Tipe <-> Debit + Kredit (PRD 6.3 tambahan)
    const judulKolom = () => evalJs("[...document.querySelectorAll('#isi-histori-bank thead th')].map(function(th){return th.textContent.trim();}).join('|')");
    catat("Tombol ⇄ ada di ujung kanan baris atas; bawaan tampilan Mutasi", await evalJs("(function(){var b=document.getElementById('histori-bank-ganti-tampilan'), e=document.getElementById('histori-bank-ekspor'); return b.getAttribute('aria-pressed')==='false' && b.getBoundingClientRect().left > e.getBoundingClientRect().right + 100;})()") && /\|Mutasi\|Tipe\|/.test(await judulKolom()), await judulKolom());
    await klik("#histori-bank-ganti-tampilan"); await tunggu(300);
    let bdk = await isiTabel();
    catat("Klik ⇄: judul kolom Debit dan Kredit (rata kanan), tombol tertekan", /\|Debit\|Kredit\|Saldo\|/.test(await judulKolom()) && await evalJs("document.querySelectorAll('#isi-histori-bank th[data-kolom-nilai]')[1].classList.contains('sel-kanan') && document.getElementById('histori-bank-ganti-tampilan').getAttribute('aria-pressed')==='true'"), await judulKolom());
    catat("Debit/Kredit: Saldo Awal kosong di Debit dan Kredit; Pembayaran 0 | 300.000; Penerimaan 500.000 | 0; tanpa warna merah", bdk[0] === "|||Saldo Awal|Saldo per 30 Sep 2026|||1.200.000" && bdk[1] === "5 Okt 2026|BKK-0001|CK-01|Pembayaran|Beli ATK|0|300.000|900.000" && bdk[2] === "7 Okt 2026|BKM-0001||Penerimaan|Penerimaan dari Bapak B|500.000|0|1.400.000" && await evalJs("document.querySelectorAll('#histori-bank-badan .angka-negatif').length===0"), JSON.stringify(bdk.slice(0, 3)));
    catat("Debit/Kredit: Total = jumlah Debit 500.000 dan jumlah Kredit 450.000", bdk[5] === "|||Total|Total|500.000|450.000|", bdk[5]);
    await foto("histori-debit-kredit.png");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await evalJs("(function(){ bukaHistoriBank(); document.getElementById('histori-bank-dari').value='2026-10-01'; document.getElementById('histori-bank-sampai').value='2026-10-31'; var k=document.getElementById('histori-bank-kas'); k.value='a1'; k.dispatchEvent(new Event('change')); return true; })()"); await tunggu(400);
    catat("Halaman dimuat ulang: tampilan Debit/Kredit masih diingat", /\|Debit\|Kredit\|/.test(await judulKolom()) && (await isiTabel())[5] === "|||Total|Total|500.000|450.000|");
    await evalJs("window.__csv=null; window.unduhTeks=function(n,isi,t){ window.__csv={n:n,isi:isi,t:t}; return true; }; document.getElementById('histori-bank-ekspor').click(); true"); await tunggu(300);
    const csvDk = await evalJs("window.__csv");
    catat("Ekspor CSV mengikuti tampilan: judul Debit;Kredit, Pembayaran 0;300000, Total 500000;450000", csvDk && /"Debit";"Kredit";"Saldo"/.test(csvDk.isi) && /"Beli ATK";"0";"300000";"900000"/.test(csvDk.isi) && /"Total";"Total";"500000";"450000";""/.test(csvDk.isi), csvDk && csvDk.isi.slice(0, 120));
    await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");   // notifikasi unduhan menutupi tombol ⇄
    await klik("#histori-bank-ganti-tampilan"); await tunggu(300);
    catat("Klik ⇄ lagi: kembali ke Mutasi + Tipe (Pembayaran 300.000 Cr merah)", /\|Mutasi\|Tipe\|/.test(await judulKolom()) && (await isiTabel())[1] === "5 Okt 2026|BKK-0001|CK-01|Pembayaran|Beli ATK|300.000|Cr|900.000" && await evalJs("localStorage.getItem('tampilanHistori-histori-bank')==='mutasi'"));
    // 3) Klik baris membuka transaksi asal
    await evalJs("document.querySelectorAll('#histori-bank-badan tr')[1].click(); true"); await tunggu(500);
    catat("Klik baris Pembayaran: tab Pembayaran terbuka dengan BKK-0001 (No Cek CK-01)", await evalJs("!document.getElementById('isi-bayar').hidden && modulBayar.idDiubah==='by1' && document.getElementById('bayar-no-cek').value==='CK-01'"));
    await evalJs("bukaHistoriBank(); true"); await tunggu(400);
    await evalJs("document.querySelectorAll('#histori-bank-badan tr')[4].click(); true"); await tunggu(500);
    catat("Klik baris Jurnal Umum: tab Jurnal Umum terbuka dengan JU-0001", await evalJs("!document.getElementById('isi-jurnal').hidden && modulJurnal.idDiubah==='ju'"));
    await evalJs("bukaHistoriBank(); true"); await tunggu(400);
    await evalJs("document.querySelectorAll('#histori-bank-badan tr')[3].click(); true"); await tunggu(500);
    catat("Klik baris Transfer: tab Transfer Bank terbuka dengan TF-0001", await evalJs("!document.getElementById('isi-transfer').hidden && modulTransfer.idDiubah==='tf1'"));
    // 4) Rentang terbalik dan rentang kosong
    await evalJs("bukaHistoriBank(); (function(){var d=document.getElementById('histori-bank-dari'); d.value='2026-11-30'; d.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    catat("Tanggal dari sesudah sampai: pesan, tabel kosong", /tidak boleh sesudah/.test(await evalJs("document.getElementById('petunjuk-histori-bank').textContent")) && (await isiTabel()).length === 0);
    await evalJs("(function(){var d=document.getElementById('histori-bank-dari'); d.value='2026-12-01'; var s=document.getElementById('histori-bank-sampai'); s.value='2026-12-31'; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    await evalJs("(function(){var d=document.getElementById('histori-bank-dari'); d.value='2026-10-09'; var s=document.getElementById('histori-bank-sampai'); s.value='2026-10-10'; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    catat("Rentang 9-10 Okt (hanya uang keluar): Total 150.000 Cr berwarna merah", (await isiTabel())[3] === "|||Total|Total|150.000|Cr|" && await evalJs("document.querySelector('#histori-bank-badan tr:last-child').cells[5].classList.contains('angka-negatif')"), (await isiTabel())[3]);
    await evalJs("(function(){var d=document.getElementById('histori-bank-dari'); d.value='2026-12-01'; var s=document.getElementById('histori-bank-sampai'); s.value='2026-12-31'; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    catat("Rentang tanpa transaksi: hanya Saldo Awal (1.250.000), tanpa baris Total, + pesan 'Tidak ada transaksi'", (await isiTabel()).length === 1 && /1\.250\.000/.test((await isiTabel())[0]) && /Tidak ada transaksi/.test(await evalJs("document.getElementById('petunjuk-histori-bank').textContent")));
    // 5) Ekspor CSV memakai alat bersama
    await evalJs("window.__csv=null; var asli=window.unduhTeks; window.unduhTeks=function(n,isi,t){ window.__csv={n:n,isi:isi,t:t}; return true; }; true");
    await evalJs("(function(){var d=document.getElementById('histori-bank-dari'); d.value='2026-10-01'; var s=document.getElementById('histori-bank-sampai'); s.value='2026-10-31'; s.dispatchEvent(new Event('change')); document.getElementById('histori-bank-ekspor').click(); return true;})()"); await tunggu(300);
    const csv = await evalJs("window.__csv");
    catat("Ekspor: file histori-bank.csv berisi judul, Saldo Awal, 4 transaksi, dan Total 50000 Dr", csv && csv.n === "histori-bank.csv" && /text\/csv/.test(csv.t) && csv.isi.split("\r\n").length === 7 && /"BKK-0001";"CK-01"/.test(csv.isi) && /"Total";"Total";"50000";"Dr";""$/.test(csv.isi.split("\r\n")[6]), csv && csv.isi.split("\r\n").slice(-2).join(" || "));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
