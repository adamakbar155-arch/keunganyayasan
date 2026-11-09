// Uji Rekonsiliasi Bank di Chrome asli. Pemakaian: node uji-chrome-rekon.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9375;
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
      localStorage.setItem('daftarPembayaran', JSON.stringify([{id:'by1',nomor:'BKK-0001',nama:'BKK-0001',tanggal:'2026-10-05',kasId:'a1',kas:'110101 - Kas Kecil',noCek:'CK-01',penerima:'Toko A',catatan:'Beli ATK',rincian:[{id:'r1',akunId:'a4',kode:'610101',nama:'Beban Gaji',nilai:300000,divisiId:'d1',terikat:false}],total:300000}]));   // Divisi & Dana wajib (PRD 4.1, 5.1)
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
    // ===== Rekonsiliasi Bank (PRD 6.3) =====
    const kartu = () => evalJs("[...document.querySelectorAll('#rekonsiliasi-daftar .rekon-baris')].map(function(b){return b.querySelector('.rekon-kartu').textContent + '|' + b.querySelector('button').textContent;})");
    const tanda = () => evalJs("JSON.parse(localStorage.getItem('tandaRekonsiliasi')||'[]')");
    const notifTerakhir = () => evalJs("(function(){var n=document.querySelectorAll('.notifikasi'); return n.length ? n[n.length-1].textContent : '';})()");
    const tombolKartu = (i) => klik("#rekonsiliasi-daftar .rekon-baris:nth-child(" + i + ") button");
    // 1) Buka dari popup Kas & Bank
    await klik("#tombol-kas"); await tunggu(300);
    await klik('#panel-kas .kotak-menu[data-halaman="Rekonsiliasi Bank"]'); await tunggu(500);
    catat("Popup > Rekonsiliasi Bank: tab terbuka, tanggal bawaan awal bulan s/d hari ini, minta pilih Kas/Bank", await evalJs("!document.getElementById('isi-rekonsiliasi-bank').hidden && document.getElementById('rekonsiliasi-dari').value===tanggalHariIni().slice(0,8)+'01' && document.getElementById('rekonsiliasi-sampai').value===tanggalHariIni() && /Pilih Kas\\/Bank/.test(document.getElementById('petunjuk-rekonsiliasi').textContent)"));
    catat("Pilihan Kas/Bank hanya tingkat 3 (Kas Kecil, Bank BSI)", await evalJs("[...document.getElementById('rekonsiliasi-kas').options].map(function(o){return o.textContent;}).join('|')==='Pilih Kas/Bank...|110101 - Kas Kecil|110201 - Bank BSI'"));
    // 2) Kas Kecil, Oktober 2026
    await evalJs("(function(){document.getElementById('rekonsiliasi-dari').value='2026-10-01'; document.getElementById('rekonsiliasi-sampai').value='2026-10-31'; var k=document.getElementById('rekonsiliasi-kas'); k.value='a1'; k.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    let k = await kartu();
    catat("4 kartu transaksi Kas Kecil (jurnal akun lain tidak ikut), semua bertombol 'Ada di Rekening Koran'", k.length === 4 && k.every(x => /\|Ada di Rekening Koran$/.test(x)), JSON.stringify(k));
    catat("Kartu Pembayaran: tanggal, 'Pembayaran - Beban Gaji', 300.000 (Cr), keterangan, nomor + No Cek", k[0] === "5 Okt 2026Pembayaran - Beban Gaji300.000 (Cr)Beli ATKBKK-0001 - No Cek CK-01|Ada di Rekening Koran", k[0]);
    catat("Kartu Transfer: lawannya Bank BSI, 100.000 (Cr)", /^9 Okt 2026Transfer Bank - Bank BSI100\.000 \(Cr\)/.test(k[2]), k[2]);
    catat("Saldo 'Rp 1.250.000' per 31 Okt 2026 (sama dengan Histori Bank), '4 data belum cocok', tampilan kosong tersembunyi", await evalJs("document.getElementById('rekonsiliasi-saldo').textContent==='Rp 1.250.000' && document.getElementById('rekonsiliasi-saldo-baris').title==='Saldo per 31 Okt 2026' && document.getElementById('rekonsiliasi-belum').textContent==='4 data belum cocok' && document.getElementById('rekonsiliasi-kosong').hidden"));
    catat("Judul seperti Accurate: dua kotak sama lebar, garis atas merah muda dan biru, tombol sejajar di kolom Rekening Bank", await evalJs("(function(){var k=document.querySelector('.rekon-kotak-kiri'), n=document.querySelector('.rekon-kotak-kanan'); var a=k.getBoundingClientRect(), b=n.getBoundingClientRect(); var t=document.querySelector('#rekonsiliasi-daftar .rekon-baris .tombol').getBoundingClientRect(); return Math.abs(a.width-b.width)<2 && Math.abs(a.top-b.top)<1 && getComputedStyle(k).borderTopColor==='rgb(232, 67, 106)' && getComputedStyle(n).borderTopColor==='rgb(21, 101, 192)' && Math.abs(t.left-b.left)<2 && k.querySelector('.rekon-bilah #rekonsiliasi-saldo');})()"));
    await foto("rekonsiliasi-bank.png");
    // 3) Klik pertama: konfirmasi muncul; Batal tidak menandai
    await tombolKartu(1); await tunggu(300);
    catat("Klik pertama 'Ada di Rekening Koran': konfirmasi 'Apakah transaksi ini ada tercetak dalam rekening koran?'", await evalJs("document.getElementById('dialog-konfirmasi').open && document.getElementById('isi-konfirmasi').textContent==='Apakah transaksi ini ada tercetak dalam rekening koran?'"));
    await klik("#batal-konfirmasi"); await tunggu(300);
    catat("Batal: tidak ada yang ditandai, 4 kartu tetap", (await tanda()).length === 0 && (await kartu()).length === 4);
    await tombolKartu(1); await tunggu(300);
    catat("Setelah Batal, klik lagi: konfirmasi masih ditanyakan (belum pernah dijawab Ya)", await evalJs("document.getElementById('dialog-konfirmasi').open"));
    await klik("#ya-konfirmasi"); await tunggu(400);
    let td = await tanda();
    catat("Ya: Pembayaran ditandai (jurnal jb, akun a1, oleh pengguna aktif) dan hilang dari daftar; '3 data belum cocok'", td.length === 1 && td[0].jurnalId === "jb" && td[0].akunId === "a1" && !!td[0].ditandaiOleh && !!td[0].ditandaiPada && (await kartu()).length === 3 && await evalJs("document.getElementById('rekonsiliasi-belum').textContent==='3 data belum cocok'"), JSON.stringify(td));
    // 4) Klik berikutnya: langsung ditandai tanpa konfirmasi
    await tombolKartu(1); await tunggu(300);
    catat("Klik kedua (Penerimaan): langsung ditandai tanpa konfirmasi", !(await evalJs("document.getElementById('dialog-konfirmasi').open")) && (await tanda()).length === 2 && (await kartu()).length === 2);
    await tombolKartu(1); await tunggu(300);   // Transfer
    catat("Transfer juga ditandai; tinggal 1 kartu (Jurnal Umum)", (await tanda()).length === 3 && /JU-0001/.test((await kartu())[0]) && (await kartu()).length === 1);
    // Tampilan kosong (foto Accurate): rentang tanpa transaksi, dan semua sudah cocok
    const kosongTampil = () => evalJs("(function(){var k=document.getElementById('rekonsiliasi-kosong'); return !k.hidden && k.getBoundingClientRect().height>100 && k.textContent.trim()==='Tidak ada data mutasi kas/bank yang tersedia' && document.querySelectorAll('#rekonsiliasi-daftar .rekon-baris').length===0 && document.getElementById('petunjuk-rekonsiliasi').hidden;})()");
    await evalJs("(function(){document.getElementById('rekonsiliasi-dari').value='2026-12-01'; var s=document.getElementById('rekonsiliasi-sampai'); s.value='2026-12-31'; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    catat("Rentang tanpa transaksi: tampilan kosong 'Tidak ada data mutasi kas/bank yang tersedia', saldo tetap 'Rp 1.250.000', tanpa 'belum cocok'", (await kosongTampil()) && await evalJs("document.getElementById('rekonsiliasi-saldo').textContent==='Rp 1.250.000' && document.getElementById('rekonsiliasi-belum').textContent===''"));
    await foto("rekonsiliasi-kosong.png");
    await evalJs("(function(){document.getElementById('rekonsiliasi-dari').value='2026-10-01'; var s=document.getElementById('rekonsiliasi-sampai'); s.value='2026-10-09'; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    catat("Semua transaksi di rentang sudah cocok (1-9 Okt): tampilan kosong juga muncul", await kosongTampil());
    await evalJs("(function(){var s=document.getElementById('rekonsiliasi-sampai'); s.value='2026-10-31'; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(300);
    catat("Kembali ke rentang dengan kartu: tampilan kosong tersembunyi lagi", await evalJs("document.getElementById('rekonsiliasi-kosong').hidden") && (await kartu()).length === 1);
    // 5) Penjaga: transaksi yang sudah direkonsiliasi tidak bisa diubah atau dihapus
    await evalJs("bukaAsalJurnal(modulJurnal.ambil().find(function(j){return j.id==='jb';})); true"); await tunggu(500);
    await evalJs("document.getElementById('form-bayar').requestSubmit(); true"); await tunggu(400);
    catat("Ubah Pembayaran yang sudah cocok: ditolak dengan pesan 'sudah direkonsiliasi'", /sudah direkonsiliasi.*Batalkan dulu/.test(await evalJs("document.getElementById('bayar-pesan-galat').textContent")) && await evalJs("!document.getElementById('bayar-pesan-galat').hidden"));
    await evalJs("modulBayar.hapus(modulBayar.ambil()[0]); true"); await tunggu(300);
    catat("Hapus Pembayaran yang sudah cocok: ditolak (konfirmasi hapus tidak muncul)", /sudah direkonsiliasi/.test(await notifTerakhir()) && !(await evalJs("document.getElementById('dialog-konfirmasi').open")) && (await evalJs("modulBayar.ambil().length")) === 1);
    await evalJs("trxTerima.modul.hapus(trxTerima.modul.ambil()[0]); true"); await tunggu(300);
    catat("Hapus Penerimaan yang sudah cocok: ditolak", /Penerimaan "BKM-0001" sudah direkonsiliasi/.test(await notifTerakhir()) && (await evalJs("trxTerima.modul.ambil().length")) === 1, await notifTerakhir());
    await evalJs("bukaAsalJurnal(modulJurnal.ambil().find(function(j){return j.id==='jf';})); true"); await tunggu(500);
    await evalJs("document.getElementById('form-transfer').requestSubmit(); true"); await tunggu(400);
    catat("Ubah Transfer yang sudah cocok: ditolak", /Transfer "TF-0001" sudah direkonsiliasi/.test(await evalJs("document.getElementById('transfer-pesan-galat').textContent")));
    await evalJs("modulTransfer.hapus(modulTransfer.ambil()[0]); true"); await tunggu(300);
    catat("Hapus Transfer yang sudah cocok: ditolak", /sudah direkonsiliasi/.test(await notifTerakhir()) && (await evalJs("modulTransfer.ambil().length")) === 1);
    catat("Jurnal Umum yang belum cocok (JU-0001) tidak terkunci; yang dicocokkan dari Pembayaran ikut terkunci", await evalJs("galatSudahRekonsiliasi(modulJurnal.ambil().find(function(j){return j.id==='ju';}),'Jurnal')==='' && /sudah direkonsiliasi/.test(galatSudahRekonsiliasi(modulJurnal.ambil().find(function(j){return j.id==='jb';}),'Jurnal'))"));
    // 6) Tampilkan yang sudah cocok, lalu Batalkan. Notifikasi peringatan dari langkah 5 ditutup dulu supaya tidak menutupi centang.
    await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); bukaRekonsiliasiBank(); true"); await tunggu(400);
    await klik("#rekonsiliasi-tampil-cocok"); await tunggu(300);
    k = await kartu();
    catat("Centang 'Tampilkan yang sudah cocok': 4 kartu, 3 bertombol Batalkan", k.length === 4 && k.filter(x => /\|Batalkan$/.test(x)).length === 3, JSON.stringify(k));
    await tombolKartu(1); await tunggu(400);
    catat("Batalkan Pembayaran: tandanya hilang, kartunya kembali bertombol 'Ada di Rekening Koran', '2 data belum cocok'", !(await tanda()).some(x => x.jurnalId === "jb") && /Ada di Rekening Koran$/.test((await kartu())[0]) && await evalJs("document.getElementById('rekonsiliasi-belum').textContent==='2 data belum cocok'"));
    await evalJs("bukaAsalJurnal(modulJurnal.ambil().find(function(j){return j.id==='jb';})); true"); await tunggu(500);
    await evalJs("document.getElementById('form-bayar').requestSubmit(); true"); await tunggu(400);
    catat("Setelah dibatalkan, Pembayaran bisa diubah lagi (tersimpan, tidak ada pesan galat yang tampil)", await evalJs("document.getElementById('bayar-pesan-galat').hidden && !modulBayar.adaPerubahan()"), await evalJs("JSON.stringify({hidden:document.getElementById('bayar-pesan-galat').hidden, teks:document.getElementById('bayar-pesan-galat').textContent, id:modulBayar.idDiubah})"));
    // 7) Halaman dibuka lagi: konfirmasi ditanyakan lagi sekali
    await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); bukaRekonsiliasiBank(); true"); await tunggu(400);
    await klik("#rekonsiliasi-tampil-cocok"); await tunggu(300);
    await tombolKartu(1); await tunggu(300);
    catat("Halaman dibuka lagi: klik pertama kembali ditanyakan konfirmasi", await evalJs("document.getElementById('dialog-konfirmasi').open"));
    await klik("#ya-konfirmasi"); await tunggu(300);
    // 7b) Ceklis di Histori Bank (PRD 6.3): sekarang tercocok Penerimaan, Transfer, dan Pembayaran (langkah 7)
    await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); (function(){ bukaHistoriBank(); var d=document.getElementById('histori-bank-dari'); d.value='2026-10-01'; document.getElementById('histori-bank-sampai').value='2026-10-31'; var k=document.getElementById('histori-bank-kas'); k.value='a1'; k.dispatchEvent(new Event('change')); return true; })()"); await tunggu(400);
    const ceklisHistori = () => evalJs("[...document.querySelectorAll('#histori-bank-badan tr')].map(function(tr){ return tr.cells[1].textContent + ':' + !!tr.querySelector('.histori-ceklis'); }).join(',')");
    catat("Histori Bank: ceklis hijau hanya di transaksi yang sudah cocok (BKK, BKM, TF; bukan Saldo Awal dan JU)", (await ceklisHistori()) === ":false,BKK-0001:true,BKM-0001:true,TF-0001:true,JU-0001:false,:false", await ceklisHistori());
    await foto("histori-ceklis.png");
    await klik("#histori-bank-badan tr:nth-child(4) .histori-ceklis"); await tunggu(400);
    catat("Klik ceklis Transfer: konfirmasi Accurate muncul, tab Transfer TIDAK terbuka", await evalJs("document.getElementById('dialog-konfirmasi').open && document.getElementById('isi-konfirmasi').textContent==='Data sudah dicocokkan dengan Rekening Koran. Apakah data ini tidak cocok dengan rekening koran?' && !document.getElementById('isi-histori-bank').hidden"));
    await klik("#batal-konfirmasi"); await tunggu(300);
    catat("Batal: tanda Transfer tetap, ceklis tetap", (await tanda()).some(x => x.jurnalId === "jf") && /TF-0001:true/.test(await ceklisHistori()));
    await klik("#histori-bank-badan tr:nth-child(4) .histori-ceklis"); await tunggu(300);
    await klik("#ya-konfirmasi"); await tunggu(400);
    catat("Ya: tanda Transfer hilang, ceklisnya hilang, yang lain tetap", !(await tanda()).some(x => x.jurnalId === "jf") && (await ceklisHistori()) === ":false,BKK-0001:true,BKM-0001:true,TF-0001:false,JU-0001:false,:false", await ceklisHistori());
    await evalJs("bukaAsalJurnal(modulJurnal.ambil().find(function(j){return j.id==='jf';})); true"); await tunggu(500);
    await evalJs("document.getElementById('form-transfer').requestSubmit(); true"); await tunggu(400);
    catat("Setelah ceklis dibatalkan, Transfer bisa diubah lagi (tersimpan)", await evalJs("document.getElementById('transfer-pesan-galat').hidden && !modulTransfer.adaPerubahan()"));
    catat("Pesan penolakan menyebut kedua cara membatalkan", /Rekonsiliasi Bank, atau klik ceklisnya di Histori Bank/.test(await evalJs("galatSudahRekonsiliasi(modulJurnal.ambil().find(function(j){return j.id==='jt';}),'Penerimaan')")));
    // 8) Log, cadangan
    catat("Log Aktivitas mencatat 'Tandai cocok' dan 'Batalkan cocok'", await evalJs("(function(){var l=JSON.parse(localStorage.getItem('logAktivitas')||'[]'); return l.some(function(x){return x.tindakan==='Tandai cocok'&&x.tipe==='Rekonsiliasi Bank';}) && l.some(function(x){return x.tindakan==='Batalkan cocok'&&x.referensi==='BKK-0001';});})()"));
    catat("Tanda rekonsiliasi ikut Cadangan Data", await evalJs("jenisKunciCadangan.tandaRekonsiliasi==='daftar'"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
