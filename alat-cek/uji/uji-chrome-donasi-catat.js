// Uji Pencatatan Donasi (D1.5) di Chrome asli. Pemakaian: node uji-chrome-donasi-catat.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9383;
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
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") }); /* pengguna mengisi kepala Data Baru (PRD 5.3a) */ await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    // ===== D1.5 bagian 1: tampilan Pencatatan Donasi (PRD 6.1) =====
    // Data contoh (bukan data asli): akun Kas tingkat 3, akun donasi, donatur, divisi, program, dua donasi tersimpan
    await evalJs(`(function(){ localStorage.clear();
      localStorage.setItem('daftarAkun', JSON.stringify([
        {id:'k0',kode:'1101',nama:'Kas',tipe:'kas-bank',indukId:'',saldoAwal:0},
        {id:'k1',kode:'110101',nama:'Kas Kecil',tipe:'kas-bank',indukId:'k0',saldoAwal:0},
        {id:'kas1',kode:'11010101',nama:'Kas Kecil Uji',tipe:'kas-bank',indukId:'k1',saldoAwal:0},
        {id:'kas2',kode:'11010102',nama:'Bank Uji',tipe:'kas-bank',indukId:'k1',saldoAwal:0},
        {id:'p0',kode:'4101',nama:'Pendapatan',tipe:'pendapatan',indukId:'',saldoAwal:0},
        {id:'p1',kode:'410101',nama:'Donasi',tipe:'pendapatan',indukId:'p0',saldoAwal:0},
        {id:'ad1',kode:'41010101',nama:'Infaq Umum',tipe:'pendapatan',indukId:'p1',saldoAwal:0},
        {id:'ad2',kode:'41010102',nama:'Wakaf Uji',tipe:'pendapatan',indukId:'p1',saldoAwal:0},
        {id:'ad3',kode:'41010103',nama:'Zakat Belum',tipe:'pendapatan',indukId:'p1',saldoAwal:0}]));
      localStorage.setItem('daftarKategoriDonasi', JSON.stringify([
        {id:'kd1',nama:'Infaq Umum',indukId:'p1',akunId:'ad1',kode:'41010101',kelompok:'',catatan:''},
        {id:'kd2',nama:'Wakaf Uji',indukId:'p1',akunId:'ad2',kode:'41010102',kelompok:'',catatan:''},
        {id:'kd3',nama:'Zakat Belum',indukId:'p1',akunId:'ad3',kode:'41010103',kelompok:'',catatan:''}]));
      localStorage.setItem('akunPerkiraanYayasan', JSON.stringify({donasiTerikat:['41010102'],donasiTidakTerikat:['41010101']}));
      localStorage.setItem('daftarDonatur', JSON.stringify([
        {id:'dn1',idDonatur:'D.00001',nama:'Hamba Allah',bawaan:true},
        {id:'dn2',idDonatur:'D.00002',nama:'Budi Contoh'},
        {id:'dn3',idDonatur:'D.00003',nama:'Cici Nonaktif',nonAktif:true}]));
      localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'},{id:'d2',nama:'Dakwah'}]));
      localStorage.setItem('daftarProgram', JSON.stringify([{id:'pr1',nama:'Beasiswa',divisiId:'d2',status:'aktif'}]));
      localStorage.setItem('daftarDonasi', JSON.stringify([
        {id:'dc1',nomor:'DN-001',nama:'DN-001',tanggal:'2026-10-20',donaturId:'dn2',kasId:'kas1',kas:'11010101 - Kas Kecil Uji',caraBayar:'Transfer',keterangan:'Untuk renovasi',
         rincian:[{id:'r1',kategoriId:'kd1',akunId:'ad1',kode:'41010101',nama:'Infaq Umum',nilai:150000,divisiId:'d1',programId:'',keterangan:''},
                  {id:'r2',kategoriId:'kd2',akunId:'ad2',kode:'41010102',nama:'Wakaf Uji',nilai:50000,divisiId:'d1',programId:'',keterangan:''}],total:200000},
        {id:'dc2',nomor:'DN-002',nama:'DN-002',tanggal:'2026-09-05',donaturId:'dn1',kasId:'kas2',kas:'11010102 - Bank Uji',caraBayar:'Tunai',keterangan:'<b>tebal</b>',
         rincian:[{id:'r3',kategoriId:'kd1',akunId:'ad1',kode:'41010101',nama:'Infaq Umum',nilai:900,divisiId:'d1',programId:'',keterangan:''}],total:900}]));
      localStorage.setItem('daftarJurnal', JSON.stringify([{id:'j1',nomor:'DN-001',tanggal:'2026-10-20',sumber:{jenis:'donasi',id:'dc1'},rincian:[{akunId:'kas1',debit:200000,kredit:0},{akunId:'ad1',debit:0,kredit:150000},{akunId:'ad2',debit:0,kredit:50000}]}]));
      localStorage.setItem('daftarPenomoran', JSON.stringify([
        {id:'pn1',nama:'Donasi Umum',pembukuan:'yayasan',tipe:'donasi',digit:3,kasId:'',komponen:[{jenis:'teks',nilai:'DU-'},{jenis:'counter'}]},
        {id:'pn2',nama:'Donasi Bank',pembukuan:'yayasan',tipe:'donasi',digit:3,kasId:'kas2',komponen:[{jenis:'teks',nilai:'DB-'},{jenis:'counter'}]}]));
      localStorage.setItem('tandaRekonsiliasi', JSON.stringify([{id:'t1',jurnalId:'j1',akunId:'kas1'}]));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    // 1) Buka dari popup Donasi
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Pencatatan Donasi"]'); await tunggu(500);
    catat("Popup Donasi > Pencatatan Donasi: tab terbuka di formulir Data Baru, kursor di Donatur", await evalJs("!document.getElementById('isi-donasi-catat').hidden && !document.getElementById('tab-donasi-catat').hidden && document.activeElement.id==='dc-cari-donatur'"));
    catat("Bagian atas kiri: Donatur*, Kas/Bank*, Nilai Pembayaran; kanan: No Bukti* (saklar Otomatis), Tanggal* (hari ini); tanpa 'Setor ke'", await evalJs("(function(){var kol=document.querySelectorAll('#form-donasi-catat .jurnal-kepala-kolom'); var kiri=[...kol[0].querySelectorAll('.jurnal-baris > label')].map(function(l){return l.textContent.replace('*','').trim();}).join('|'); var kanan=[...kol[1].querySelectorAll('.jurnal-baris > label')].map(function(l){return l.textContent.replace('*','').trim();}).join('|'); return kiri==='Donatur|Kas/Bank|Nilai Pembayaran' && kanan==='No Bukti #|Tanggal' && !/Setor ke/.test(document.getElementById('isi-donasi-catat').textContent) && document.getElementById('dc-tanggal').value===tanggalHariIni() && document.getElementById('dc-nomor-otomatis').checked;})()"));
    catat("Nilai Pembayaran hanya dibaca, awalnya 0", await evalJs("document.getElementById('dc-nilai-bayar').readOnly && document.getElementById('dc-nilai-bayar').value==='0'"));
    // Kotak tanggal tampil di kolom kanan (kolom tanggal asli disembunyikan oleh kalender aplikasi)
    catat("Kalender Tanggal tampil di sebelah kanan (sejajar No Bukti), Kas/Bank di kiri di bawah Donatur", await evalJs("(function(){var tg=document.querySelector('#dc-tanggal').parentElement.getBoundingClientRect(), nb=document.getElementById('dc-nomor-otomatis').getBoundingClientRect(), ks=document.getElementById('dc-kas-cari').getBoundingClientRect(), dn=document.getElementById('dc-cari-donatur').getBoundingClientRect(); return tg.left > ks.right && Math.abs(tg.left - nb.left) < 40 && ks.top > dn.bottom && Math.abs(ks.left - dn.left) < 5;})()"));
    const opsiKas = await evalJs("[...document.getElementById('dc-kas').options].map(function(o){return o.textContent;}).join('|')");
    catat("Kas/Bank: hanya Kas & Bank tingkat 3 (Kas Kecil Uji, Bank Uji)", /Kas Kecil Uji/.test(opsiKas) && /Bank Uji/.test(opsiKas) && !/\b110101\b/.test(opsiKas), opsiKas);
    catat("Rincian: kolom cari Kategori Donasi; tabel Kode, Nama Donasi, Nilai; kosong 'Belum ada data'; Total Rp 0", await evalJs("(function(){var th=[...document.querySelectorAll('#dc-panel-rincian thead th')].map(function(x){return x.textContent.trim();}).filter(Boolean).join('|'); return th==='Urutan|Kode|Nama Donasi|Nilai|Hapus baris' && /Kategori Donasi/.test(document.getElementById('dc-cari-kategori').placeholder) && /Belum ada data/.test(document.getElementById('dc-rincian').textContent) && /Rp\\s?0/.test(document.getElementById('dc-total').textContent);})()"));
    await foto("donasi-catat-form.png");
    // 2) Tab "i" Info lainnya
    await klik("#isi-donasi-catat [data-dc-tab='info']"); await tunggu(200);
    catat("Tab 'i' Info lainnya: Cara Bayar (Silakan Pilih, Tunai, Transfer, QRIS; diisi pengguna Tunai), Keterangan, Terekonsiliasi 'Belum'", await evalJs("!document.getElementById('dc-panel-info').hidden && document.getElementById('dc-panel-rincian').hidden && [...document.getElementById('dc-cara-bayar').options].map(function(o){return o.value;}).join('|')==='|Tunai|Transfer|QRIS' && document.getElementById('dc-cara-bayar').value==='Tunai' && !!document.getElementById('dc-keterangan') && document.getElementById('dc-rekonsiliasi').textContent==='Belum'"));
    catat("Tanpa VOID, No Cek, dan Cetak biasa; tombol Lampiran ada (J.21, PRD 5.4)", await evalJs("!/VOID|No Cek/.test(document.getElementById('isi-donasi-catat').textContent) && !document.querySelector('#isi-donasi-catat [aria-label=\"Cetak\"]') && !!document.getElementById('dc-tombol-lampiran')"));
    await foto("donasi-catat-info.png");
    // 3) Popup baris (HTML siap, dibuka di bagian 2)
    catat("Popup Rincian Donasi tersedia: tab Rincian Donasi (Kode, Nama Donasi, Nilai*) dan Info lainnya (Divisi*, Program, Keterangan)", await evalJs("(function(){var d=document.getElementById('dialog-rincian-donasi-catat'); var t=d.textContent; return !!d && /Rincian Donasi/.test(t)&&/Nama Donasi/.test(t)&&/Nilai/.test(t)&&/Divisi/.test(t)&&/Program/.test(t)&&/Keterangan/.test(t) && !/Penangguhan|Kuantitas|Diskon|Penjual/.test(t);})()"));
    // ===== D1.5 bagian 2: pilihan dan baris =====
    const ketik = (x) => kirim("Input.insertText", { text: x });
    const tombol = async (key, code, vk) => { await kirim("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk }); };
    await klik("#isi-donasi-catat [data-dc-tab='rincian']"); await tunggu(150);
    const daftarTampil = (id) => evalJs("document.getElementById('" + id + "').hidden ? '(tertutup)' : [...document.querySelectorAll('#" + id + " li')].map(function(li){return li.textContent.trim();}).join('|')");
    const nilai = (id) => evalJs("document.getElementById('" + id + "').value");
    const bersihNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    const chipDn = () => evalJs("(function(){var c=document.querySelector('#dc-cari-donatur ~ .chip-di-kolom .chip-teks'); return c ? c.textContent : '';})()");
    // a) Donatur: hanya yang aktif
    await klik("#dc-cari-donatur"); await tunggu(250);
    catat("Klik kolom Donatur: daftar berisi donatur aktif (Budi Contoh, Hamba Allah) dengan ID-nya; Cici Nonaktif tidak muncul", (await daftarTampil("dc-daftar-donatur")) === "Budi ContohD.00002|Hamba AllahD.00001", await daftarTampil("dc-daftar-donatur"));
    await ketik("bud"); await tunggu(200);
    await tombol("Enter", "Enter", 13); await tunggu(200);
    catat("Ketik 'bud' + Enter: Budi Contoh terpilih (id dn2 tersimpan), tampil sebagai label '[D.00002] Budi Contoh' di dalam kolom", (await nilai("dc-donatur")) === "dn2" && (await chipDn()) === "[D.00002] Budi Contoh" && (await nilai("dc-cari-donatur")) === "");
    await foto("donasi-catat-chip.png");
    catat("Label berada di dalam kolom Donatur (sebelah kiri), teks yang diketik tidak tertutup label", await evalJs("(function(){var k=document.getElementById('dc-cari-donatur'), c=document.querySelector('#dc-cari-donatur ~ .chip-di-kolom'); var rk=k.getBoundingClientRect(), rc=c.getBoundingClientRect(); return rc.left>=rk.left && rc.right<=rk.right && rc.top>=rk.top && rc.bottom<=rk.bottom && parseFloat(getComputedStyle(k).paddingLeft) >= rc.width;})()"));
    await ketik("x"); await tunggu(150);
    catat("Mengetik di kolom: pilihan lama dilepas (id dikosongkan, label hilang)", (await nilai("dc-donatur")) === "" && (await chipDn()) === "");
    // b) Donatur baru langsung dari formulir
    await evalJs("(function(){var k=document.getElementById('dc-cari-donatur'); k.value=''; k.dispatchEvent(new Event('input')); return true;})()");
    await ketik("Marsono Uji"); await tunggu(250);
    catat("Nama belum ada: 'Tidak ditemukan data yang cocok' + tombol 'Simpan \"Marsono Uji\" sebagai data baru?'", (await daftarTampil("dc-daftar-donatur")) === 'Tidak ditemukan data yang cocok|Simpan "Marsono Uji" sebagai data baru?', await daftarTampil("dc-daftar-donatur"));
    await foto("donasi-catat-donatur-baru.png");
    await bersihNotif();
    await klik("#dc-daftar-donatur button"); await tunggu(300);
    const baruDn = (await evalJs("JSON.parse(localStorage.getItem('daftarDonatur'))")).find(d => d.nama === "Marsono Uji") || {};
    catat("Klik tombol: donatur 'Marsono Uji' tersimpan di Donatur (ID otomatis D.00004, aktif) dan langsung terpilih", baruDn.idDonatur === "D.00004" && baruDn.nonAktif === false && (await nilai("dc-donatur")) === baruDn.id && (await chipDn()) === "[D.00004] Marsono Uji", JSON.stringify(baruDn));
    catat("Notifikasi 'telah disimpan sebagai data baru' + Log 'Buat Donatur Marsono Uji (dari Pencatatan Donasi)'", /Marsono Uji.*telah disimpan sebagai data baru/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Buat'&&x.tipe==='Donatur'&&x.referensi==='Marsono Uji (dari Pencatatan Donasi)';})"));
    catat("Donatur baru muncul di daftar halaman Donatur", /Marsono Uji/.test(await evalJs("document.querySelector('#isi-donatur .tabel-daftar tbody').textContent")));
    // Enter juga menyimpan donatur baru; nama berisi kode HTML disimpan sebagai teks
    await evalJs("(function(){var k=document.getElementById('dc-cari-donatur'); k.focus(); k.value=''; k.dispatchEvent(new Event('input')); return true;})()");
    await ketik("<i>Dedi</i>"); await tunggu(200);
    catat("Tombol data baru menampilkan kode HTML sebagai teks", await evalJs("!document.querySelector('#dc-daftar-donatur i') && /<i>Dedi<\\/i>/.test(document.querySelector('#dc-daftar-donatur button').textContent)"));
    await tombol("Enter", "Enter", 13); await tunggu(300);
    catat("Enter saat tidak ada yang cocok: donatur baru tersimpan dan terpilih (D.00005)", (await evalJs("JSON.parse(localStorage.getItem('daftarDonatur')).some(function(d){return d.nama==='<i>Dedi</i>'&&d.idDonatur==='D.00005';})")) && (await chipDn()) === "[D.00005] <i>Dedi</i>" && !(await evalJs("!!document.querySelector('#dc-cari-donatur ~ .chip-di-kolom i')")));
    // Nama mirip (bagian dari nama lain) tetap bisa jadi donatur baru: "Budi" saat sudah ada "Budi Contoh" (kasus "Andi"/"Fandi")
    await evalJs("(function(){var k=document.getElementById('dc-cari-donatur'); k.focus(); return true;})()");
    await ketik("Budi"); await tunggu(250);
    catat("Ketik 'Budi' saat ada 'Budi Contoh': hasil mirip tampil DAN tombol 'Simpan \"Budi\" sebagai data baru?' di bawahnya", (await daftarTampil("dc-daftar-donatur")) === 'Budi ContohD.00002|Simpan "Budi" sebagai data baru?', await daftarTampil("dc-daftar-donatur"));
    await tombol("Enter", "Enter", 13); await tunggu(250);
    catat("Enter memilih hasil yang disorot (Budi Contoh), tidak membuat data baru", (await nilai("dc-donatur")) === "dn2" && (await evalJs("JSON.parse(localStorage.getItem('daftarDonatur')).filter(function(d){return d.nama==='Budi';}).length")) === 0);
    await bersihNotif();
    await ketik("Budi"); await tunggu(250); await klik("#dc-daftar-donatur .tombol-data-baru"); await tunggu(300);
    catat("Klik tombol: donatur 'Budi' tersimpan (D.00006) dan terpilih", (await evalJs("JSON.parse(localStorage.getItem('daftarDonatur')).some(function(d){return d.nama==='Budi'&&d.idDonatur==='D.00006';})")) && (await chipDn()) === "[D.00006] Budi");
    await evalJs("(function(){var k=document.getElementById('dc-cari-donatur'); k.focus(); return true;})()");
    await ketik("budi contoh"); await tunggu(250);
    catat("Nama sama persis (huruf kecil 'budi contoh'): tombol data baru tidak muncul", !(await evalJs("!!document.querySelector('#dc-daftar-donatur .tombol-data-baru')")) && /Budi Contoh/.test(await daftarTampil("dc-daftar-donatur")));
    await tombol("Enter", "Enter", 13); await tunggu(250);
    // Tombol × pada label
    await klik("#dc-cari-donatur ~ .chip-di-kolom .chip-hapus"); await tunggu(250);
    catat("Klik × pada label: pilihan dilepas (id kosong, label hilang), kursor di kolom Donatur", (await nilai("dc-donatur")) === "" && (await chipDn()) === "" && (await evalJs("document.activeElement.id")) === "dc-cari-donatur");
    await tombol("Escape", "Escape", 27);
    await bersihNotif();
    await bersihNotif();
    // c0) Pengaman urutan isian (PRD 5.1): Kategori Donasi baru bisa dicari setelah Donatur, Kas/Bank, Tanggal terisi
    await klik("#dc-cari-kategori"); await tunggu(250);
    catat("Klik cari Kategori Donasi sebelum Donatur dipilih: daftar tidak terbuka, peringatan 'Pilih Donatur dulu sebelum memilih Kategori Donasi.', kursor ke Donatur", await evalJs("document.getElementById('dc-daftar-kategori').hidden && document.activeElement.id==='dc-cari-donatur'") && /Pilih Donatur dulu sebelum memilih Kategori Donasi\./.test(await evalJs("document.getElementById('area-notifikasi').textContent")), await evalJs("document.activeElement.id"));
    await tombol("Escape", "Escape", 27); await bersihNotif();
    await evalJs("(function(){pilihDonaturDc(bacaDonatur().find(function(d){return d.id==='dn2';})); return true;})()");
    await tunggu(1100);   // peringatan yang sama tidak diulang dalam 1 detik
    await evalJs("document.getElementById('dc-cari-kategori').blur(); true"); await klik("#dc-cari-kategori"); await tunggu(250);
    catat("Donatur sudah, Kas/Bank belum: peringatan 'Pilih Kas/Bank dulu', daftar tetap tertutup", await evalJs("document.getElementById('dc-daftar-kategori').hidden") && /Pilih Kas\/Bank dulu sebelum memilih Kategori Donasi\./.test(await evalJs("document.getElementById('area-notifikasi').textContent")));
    await tombol("Escape", "Escape", 27); await bersihNotif();
    await evalJs("(function(){var s=document.getElementById('dc-kas'); s.value='kas1'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;})()"); await tunggu(150);
    // c) Kategori Donasi: hanya yang sudah diatur Terikat/Tidak Terikat
    await evalJs("document.getElementById('dc-cari-kategori').blur(); true");
    await klik("#dc-cari-kategori"); await tunggu(250);
    catat("Klik cari Kategori Donasi: Infaq Umum (Tidak Terikat) dan Wakaf Uji (Terikat); 'Zakat Belum' (belum diatur) tidak muncul", (await daftarTampil("dc-daftar-kategori")) === "Infaq Umum41010101Tidak Terikat|Wakaf Uji41010102Terikat", await daftarTampil("dc-daftar-kategori"));
    await ketik("infaq"); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(350);
    catat("Pilih Infaq Umum: popup Rincian Donasi terbuka (Kode 41010101, Nama Infaq Umum, kursor di Nilai, Hapus tersembunyi)", await evalJs("dialogRincianDc.open && document.getElementById('rdc-kode').textContent==='41010101' && document.getElementById('rdc-nama').value==='Infaq Umum' && document.activeElement.id==='rdc-nilai' && document.getElementById('hapus-rincian-donasi-catat').hidden"));
    await klik("#lanjut-rincian-donasi-catat"); await tunggu(200);
    catat("Lanjut tanpa Nilai: ditolak 'Nilai wajib diisi dan lebih dari 0'", /Nilai wajib diisi/.test(await evalJs("document.getElementById('galat-rdc-nilai').hidden ? '' : document.getElementById('galat-rdc-nilai').textContent")) && await evalJs("dialogRincianDc.open"));
    await ketik("150000"); await klik("#lanjut-rincian-donasi-catat"); await tunggu(200);
    catat("Lanjut tanpa Divisi: ditolak dengan notifikasi pojok kanan 'Divisi wajib dipilih', pindah ke tab Info lainnya", /Divisi wajib dipilih/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && await evalJs("!document.getElementById('rdc-panel-info').hidden && dialogRincianDc.open"));
    await evalJs("(function(){var p=document.getElementById('rdc-program'); p.value='pr1'; p.dispatchEvent(new Event('change')); return true;})()");
    catat("Pilih Program Beasiswa saat Divisi kosong: Divisi diusulkan dari Program (Dakwah)", (await nilai("rdc-divisi")) === "d2");
    await evalJs("document.getElementById('rdc-keterangan').value='Titipan'; true");
    await klik("#lanjut-rincian-donasi-catat"); await tunggu(350);
    const barisTabel = () => evalJs("[...document.querySelectorAll('#dc-rincian tr.jurnal-baris-data')].map(function(tr){return [...tr.cells].slice(1,4).map(function(td){return td.textContent.trim();}).join('|');})");
    catat("Lanjut: popup tertutup, baris '41010101 | Infaq Umum | 150.000' masuk; Total dan Nilai Pembayaran 150.000; judul '1 Rincian Donasi'", !(await evalJs("dialogRincianDc.open")) && JSON.stringify(await barisTabel()) === '["41010101|Infaq Umum|150.000"]' && /150\.000/.test(await evalJs("document.getElementById('dc-total').textContent")) && (await nilai("dc-nilai-bayar")) === "150.000" && (await evalJs("document.getElementById('dc-jumlah').textContent")) === "1 ");
    catat("Baris menyimpan kategori, akun, Divisi, Program, Keterangan", await evalJs("(function(){var b=barisDc[0]; return b.kategoriId==='kd1'&&b.akunId==='ad1'&&b.divisiId==='d2'&&b.programId==='pr1'&&b.keterangan==='Titipan'&&b.nilai===150000;})()"));
    // d) Baris kedua mengikuti Divisi dan Program baris terakhir
    await tunggu(200);
    await klik("#dc-cari-kategori"); await tunggu(200); await ketik("wakaf"); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(350);
    catat("Baris baru (Wakaf Uji): Divisi dan Program mengikuti baris terakhir (Dakwah, Beasiswa); Keterangan kosong", (await nilai("rdc-divisi")) === "d2" && (await nilai("rdc-program")) === "pr1" && (await nilai("rdc-keterangan")) === "");
    await ketik("50000"); await tombol("Enter", "Enter", 13); await tunggu(350);
    catat("Enter di Nilai = Lanjut: 2 baris, Total dan Nilai Pembayaran 200.000", (await barisTabel()).length === 2 && (await nilai("dc-nilai-bayar")) === "200.000" && /200\.000/.test(await evalJs("document.getElementById('dc-total').textContent")));
    // e) Ubah dan hapus baris
    await klik("#dc-rincian tr.jurnal-baris-data:nth-child(1) td.jurnal-sel-angka"); await tunggu(350);
    catat("Klik baris Infaq Umum: popup berisi nilai 150.000, Divisi/Program/Keterangan baris itu, tombol Hapus tampil", await evalJs("dialogRincianDc.open && document.getElementById('rdc-nilai').value==='150.000' && document.getElementById('rdc-divisi').value==='d2' && document.getElementById('rdc-keterangan').value==='Titipan' && !document.getElementById('hapus-rincian-donasi-catat').hidden"));
    await evalJs("(function(){var k=document.getElementById('rdc-nilai'); k.value='100.000'; return true;})()"); await klik("#lanjut-rincian-donasi-catat"); await tunggu(300);
    catat("Ubah nilai jadi 100.000: Total dan Nilai Pembayaran 150.000", (await nilai("dc-nilai-bayar")) === "150.000" && JSON.stringify(await barisTabel()) === '["41010101|Infaq Umum|100.000","41010102|Wakaf Uji|50.000"]');
    await klik("#dc-rincian tr.jurnal-baris-data:nth-child(2) td.jurnal-sel-angka"); await tunggu(300);
    await klik("#hapus-rincian-donasi-catat"); await tunggu(300);
    catat("Hapus di popup: baris Wakaf Uji hilang, Total 100.000", JSON.stringify(await barisTabel()) === '["41010101|Infaq Umum|100.000"]' && (await nilai("dc-nilai-bayar")) === "100.000");
    await klik("#dc-rincian tr.jurnal-baris-data .jurnal-hapus-baris"); await tunggu(250);
    catat("Tombol X di baris: baris terhapus tanpa membuka popup; tabel 'Belum ada data', Total 0", !(await evalJs("dialogRincianDc.open")) && (await barisTabel()).length === 0 && (await nilai("dc-nilai-bayar")) === "0");
    // f) Esc menutup popup tanpa menambah baris
    await klik("#dc-cari-kategori"); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(300);
    await ketik("5000"); await tombol("Escape", "Escape", 27); await tunggu(300);
    catat("Esc di popup: popup tertutup, tidak ada baris yang ditambah", !(await evalJs("dialogRincianDc.open")) && (await barisTabel()).length === 0);
    // f2) Titik ribuan langsung saat mengetik (PRD 5.1)
    await klik("#dc-cari-kategori"); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(300);
    for (const c of "1500000") { await ketik(c); }
    await tunggu(100);
    catat("Mengetik 1500000 angka demi angka di Nilai: langsung tampil 1.500.000, kursor di ujung", (await nilai("rdc-nilai")) === "1.500.000" && (await evalJs("document.getElementById('rdc-nilai').selectionStart")) === 9, await nilai("rdc-nilai"));
    await evalJs("document.getElementById('rdc-nilai').setSelectionRange(3,3); true"); await ketik("2"); await tunggu(100);
    catat("Menyisipkan 2 sesudah '1.5': jadi 15.200.000 dan kursor tetap sesudah angka 2 (tidak loncat ke ujung)", (await nilai("rdc-nilai")) === "15.200.000" && (await evalJs("document.getElementById('rdc-nilai').selectionStart")) === 4, (await nilai("rdc-nilai")) + " @" + (await evalJs("document.getElementById('rdc-nilai').selectionStart")));
    await ketik("a,"); await tunggu(100);
    catat("Huruf dan koma diabaikan (tetap 15.200.000)", (await nilai("rdc-nilai")) === "15.200.000");
    await evalJs("(function(){var p=JSON.parse(localStorage.getItem('formatYayasan')||'{}'); p.desimal=2; p.mode='selalu'; localStorage.setItem('formatYayasan', JSON.stringify(p)); var k=document.getElementById('rdc-nilai'); k.value=''; k.dispatchEvent(new Event('input')); return true;})()");
    for (const c of "2500") { await ketik(c); }
    catat("Preferensi desimal 2 dinyalakan: kolom nominal tetap angka bulat 2.500 (tanpa ,00)", (await nilai("rdc-nilai")) === "2.500", await nilai("rdc-nilai"));
    // Temuan 26: baris lama dibuka saat desimal dinyalakan -> tampil 150.000 (bukan 150.000,00) dan Lanjut tidak mengubah nilainya
    await tombol("Escape", "Escape", 27); await tunggu(200);
    await evalJs("(function(){barisDc=[{id:'rx',kategoriId:'kd1',akunId:'ad1',kode:'41010101',nama:'Infaq Umum',nilai:150000,divisiId:'d1',programId:'',keterangan:''}]; gambarRincianDc(); return true;})()");
    await klik("#dc-rincian tr.jurnal-baris-data td.jurnal-sel-angka"); await tunggu(300);
    catat("Temuan 26: desimal 2 dinyalakan, baris lama Rp 150.000 dibuka: kolom Nilai '150.000' (tanpa ,00)", (await nilai("rdc-nilai")) === "150.000", await nilai("rdc-nilai"));
    await klik("#lanjut-rincian-donasi-catat"); await tunggu(250);
    catat("Temuan 26: Lanjut tanpa mengubah apa pun: nilai tetap 150.000 (tidak jadi 15.000.000)", (await evalJs("barisDc[0].nilai")) === 150000, String(await evalJs("barisDc[0].nilai")));
    await evalJs("(function(){barisDc=[]; gambarRincianDc(); return true;})()");
    await klik("#dc-cari-kategori"); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(300);
    await evalJs("localStorage.removeItem('formatYayasan'); true");
    await tombol("Escape", "Escape", 27); await tunggu(250);
    // g) Data Baru: formulir bersih lagi
    await evalJs("modulDonasiCatat.bukaBaruKosong(); if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(300);
    catat("Data Baru: Donatur kosong (tanpa label), rincian kosong, Nilai Pembayaran 0", (await nilai("dc-donatur")) === "" && (await nilai("dc-cari-donatur")) === "" && (await chipDn()) === "" && (await barisTabel()).length === 0 && (await nilai("dc-nilai-bayar")) === "0");
    await foto("donasi-catat-bagian2.png");
    // ===== Sisipan: kotak pilihan berlabel (umum/pemilih-opsi.js, PRD 5.1) =====
    const chipKas = () => evalJs("(function(){var c=document.querySelector('#dc-kas-cari ~ .chip-di-kolom .chip-teks'); return c ? c.textContent : '';})()");
    catat("Kotak pilihan asli tersembunyi, diganti kolom cari berlabel (Kas/Bank, aturan No Bukti, Cara Bayar, Divisi/Program popup)", await evalJs("['dc-kas','dc-aturan-nomor','dc-cara-bayar','rdc-divisi','rdc-program'].every(function(i){return document.getElementById(i).style.display==='none' && !!document.getElementById(i+'-cari');})"));
    catat("Kas/Bank belum dipilih: tanpa label, petunjuk 'Pilih Kas/Bank...'; label 'Kas/Bank' mengarah ke kolom yang terlihat", (await chipKas()) === "" && (await evalJs("document.getElementById('dc-kas-cari').placeholder")) === "Pilih Kas/Bank..." && (await evalJs("document.querySelector('label[for=\"dc-kas-cari\"]').textContent.indexOf('Kas/Bank')===0")));
    await klik("#dc-kas-cari"); await tunggu(250);
    catat("Klik kolom Kas/Bank: daftar pilihan terbuka (tanpa pilihan kosong)", (await daftarTampil("dc-kas-opsi")) === "11010101 - Kas Kecil Uji|11010102 - Bank Uji", await daftarTampil("dc-kas-opsi"));
    await ketik("bank"); await tunggu(200);
    catat("Ketik 'bank': daftar tersaring jadi Bank Uji saja", (await daftarTampil("dc-kas-opsi")) === "11010102 - Bank Uji");
    await evalJs("window.__ubahKas=0; document.getElementById('dc-kas').addEventListener('change', function(){ window.__ubahKas++; }); true");
    await tombol("Enter", "Enter", 13); await tunggu(250);
    catat("Enter: Bank Uji terpilih di kotak asli (value kas2, peristiwa change sekali), label '[11010102] Bank Uji' dengan ×", (await nilai("dc-kas")) === "kas2" && (await evalJs("window.__ubahKas")) === 1 && (await chipKas()) === "[11010102] Bank Uji" && (await evalJs("!!document.querySelector('#dc-kas-cari ~ .chip-di-kolom .chip-hapus')")));
    await klik("#dc-kas-cari"); await tunggu(150); await ketik("kas kecil"); await tunggu(150);
    await evalJs("document.getElementById('dc-kas-cari').blur(); true"); await tunggu(150);
    catat("Mengetik lalu meninggalkan kolom tanpa memilih: pilihan lama tetap (Bank Uji), label kembali", (await nilai("dc-kas")) === "kas2" && (await chipKas()) === "[11010102] Bank Uji" && (await nilai("dc-kas-cari")) === "");
    await evalJs("document.getElementById('dc-kas').value='kas1'; true"); await tunggu(100);
    catat("Kode fitur mengisi .value: label ikut berganti ke '[11010101] Kas Kecil Uji'", (await chipKas()) === "[11010101] Kas Kecil Uji");
    await klik("#dc-kas-cari ~ .chip-di-kolom .chip-hapus"); await tunggu(200);
    catat("Klik ×: kembali ke pilihan kosong (value ''), petunjuk tampil lagi", (await nilai("dc-kas")) === "" && (await chipKas()) === "" && (await evalJs("document.getElementById('dc-kas-cari').placeholder")) === "Pilih Kas/Bank...");
    await tombol("Escape", "Escape", 27);
    catat("Cara Bayar punya pilihan kosong 'Silakan Pilih' (PRD 5.3a): label 'Tunai' dengan ×", await evalJs("(function(){var c=document.querySelector('#dc-cara-bayar-cari ~ .chip-di-kolom'); return !!c && c.querySelector('.chip-teks').textContent==='Tunai' && !!c.querySelector('.chip-hapus');})()"));
    await evalJs("document.getElementById('dc-kas').disabled=true; true");
    catat("Kotak asli dinonaktifkan oleh kode: kolom yang terlihat ikut nonaktif", await evalJs("document.getElementById('dc-kas-cari').disabled"));
    await evalJs("document.getElementById('dc-kas').disabled=false; true");
    catat("Filter daftar tidak diubah (tetap kotak pilihan biasa)", await evalJs("[...document.querySelectorAll('.pilih-filter')].every(function(s){return s.style.display!=='none' && !document.getElementById((s.id||'x')+'-cari');})"));
    await evalJs("modulDonasiCatat.bukaBaruKosong(); if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(200);
    // ===== D1.5 bagian 3: simpan, ubah, hapus + jurnal otomatis =====
    const simpanDc = async () => { await bersihNotif(); await evalJs("document.getElementById('form-donasi-catat').requestSubmit(); true"); await tunggu(400); };
    const galatDc = () => evalJs("document.getElementById('dc-pesan-galat').hidden ? '' : document.getElementById('dc-pesan-galat').textContent");
    const donasiTersimpan = () => evalJs("JSON.parse(localStorage.getItem('daftarDonasi')||'[]')");
    const jurnalDonasi = (id) => evalJs("JSON.stringify(JSON.parse(localStorage.getItem('daftarJurnal')||'[]').filter(function(j){return j.sumber&&j.sumber.jenis==='donasi'&&j.sumber.id==='" + id + "';}))").then(JSON.parse);
    const pilihKasUji = (id) => evalJs("(function(){var s=document.getElementById('dc-kas'); s.value='" + id + "'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;})()");
    const tambahBarisUji = async (kata, angka, divisi) => {
      await klik("#dc-cari-kategori"); await tunggu(200); await ketik(kata); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(300);
      await ketik(angka);
      if (divisi) { await evalJs("(function(){var s=document.getElementById('rdc-divisi'); s.value='" + divisi + "'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;})()"); }
      await klik("#lanjut-rincian-donasi-catat"); await tunggu(300);
    };
    await evalJs("modulDonasiCatat.bukaBaruKosong(); if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(300);
    await simpanDc();
    catat("Simpan kosong: ditolak 'Donatur wajib dipilih', tidak ada data baru", /Donatur wajib dipilih/.test(await galatDc()) && (await donasiTersimpan()).length === 2);
    await klik("#dc-cari-donatur"); await tunggu(200); await ketik("budi contoh"); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(200);
    await simpanDc();
    catat("Tanpa Kas/Bank: ditolak 'Kas/Bank wajib dipilih'", /Kas\/Bank wajib dipilih/.test(await galatDc()));
    await pilihKasUji("kas2"); await tunggu(150);
    catat("Pilih Kas/Bank 'Bank Uji': aturan No Bukti yang tertaut ke Bank Uji (Donasi Bank) terpilih otomatis, contoh DB-001", (await nilai("dc-aturan-nomor")) === "pn2" && /DB-001/.test(await evalJs("document.getElementById('dc-contoh-nomor').textContent")), await evalJs("document.getElementById('dc-contoh-nomor').textContent"));
    await simpanDc();
    catat("Tanpa rincian: ditolak 'Rincian Donasi masih kosong'", /Rincian Donasi masih kosong/.test(await galatDc()));
    await tambahBarisUji("infaq", "150000", "d1");
    await tambahBarisUji("wakaf", "50000", "");
    await evalJs("(function(){var s=document.getElementById('dc-cara-bayar'); s.value='QRIS'; s.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('dc-keterangan').value='Titip doa'; return true;})()");
    await simpanDc();
    const semuaDn = await donasiTersimpan();
    const baruDc = semuaDn.find(d => d.nomor === "DB-001") || {};
    catat("Simpan berhasil: donasi DB-001 tersimpan (donatur lewat id dn2, Kas Bank Uji, QRIS, keterangan, 2 baris, total 200.000)", semuaDn.length === 3 && baruDc.donaturId === "dn2" && baruDc.kasId === "kas2" && baruDc.caraBayar === "QRIS" && baruDc.keterangan === "Titip doa" && baruDc.rincian.length === 2 && baruDc.total === 200000, JSON.stringify(baruDc));
    catat("Notifikasi berhasil + Log 'Buat Pencatatan Donasi DB-001'; formulir kosong lagi (No Bukti berikutnya)", /berhasil disimpan/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Buat'&&x.tipe==='Pencatatan Donasi'&&x.referensi==='DB-001';})") && (await nilai("dc-donatur")) === "" && (await evalJs("barisDc.length")) === 0);
    const jd = await jurnalDonasi(baruDc.id);
    const r = (jd[0] || {}).rincian || [];
    catat("Jurnal otomatis: satu jurnal bernomor DB-001; Debit Bank Uji 200.000; Kredit Infaq Umum 150.000 dan Wakaf Uji 50.000", jd.length === 1 && jd[0].nomor === "DB-001" && r.length === 3 && r[0].akunId === "kas2" && r[0].debit === 200000 && r[1].akunId === "ad1" && r[1].kredit === 150000 && r[2].akunId === "ad2" && r[2].kredit === 50000, JSON.stringify(jd));
    catat("Baris jurnal membawa Divisi; terikat menurut Preferensi (Infaq Umum = tidak terikat, Wakaf Uji = terikat); keterangan baris atau keterangan bukti", r[1].divisiId === "d1" && r[2].divisiId === "d1" && r[1].terikat === false && r[2].terikat === true && r[1].keterangan === "Titip doa", JSON.stringify(r));
    catat("Asal jurnal dikenali sebagai 'Pencatatan Donasi' (untuk Histori Bank dan pesan ubah lewat halaman asal)", (await evalJs("asalJurnalOtomatis(JSON.parse(localStorage.getItem('daftarJurnal')).find(function(j){return j.nomor==='DB-001';}))")) === "Pencatatan Donasi");
    catat("Pencatatan Donasi tampil di daftar dengan nama donatur, Kas/Bank, QRIS, kategori digabung, nilai 200.000", /DB-001.*Budi Contoh.*11010102 - Bank Uji.*QRIS.*Infaq Umum, Wakaf Uji.*Titip doa.*200\.000/.test(await evalJs("[...document.querySelectorAll('#isi-donasi-catat .tabel-daftar tbody tr')].map(function(tr){return tr.textContent;}).join('\\n')")));
    // No Bukti diketik sendiri: kembar ditolak
    await klik("#dc-cari-donatur"); await tunggu(200); await ketik("hamba"); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(200);
    await pilihKasUji("kas1"); await tambahBarisUji("infaq", "1000", "d2");
    await klik("#dc-nomor-otomatis"); await tunggu(150);
    catat("Otomatis dimatikan: kotak aturan penomoran tersembunyi, kolom ketik No Bukti terlihat dan cukup lebar", await evalJs("(function(){var w=document.getElementById('dc-aturan-nomor-cari').parentElement, k=document.getElementById('dc-nomor'); return w.hidden && w.getBoundingClientRect().width===0 && !k.hidden && k.getBoundingClientRect().width > 150;})()"), await evalJs("document.getElementById('dc-nomor').getBoundingClientRect().width + ' / aturan tersembunyi=' + document.getElementById('dc-aturan-nomor-cari').parentElement.hidden"));
    await klik("#dc-nomor"); await ketik("DN-KETIK");
    catat("Nomor bisa diketik langsung di kolomnya", (await nilai("dc-nomor")) === "DN-KETIK");
    // Semua formulir bernomor (memakai alat bersama yang sama): saklar mati -> aturan tersembunyi, kolom ketik muncul; nyala lagi -> kebalikannya
    const formNomor = await evalJs(`(function(){ return ["jurnal","bayar","terima","transfer","pgaji","dc"].map(function(p){
        var s=document.getElementById(p+'-nomor-otomatis'), w=document.getElementById(p+'-aturan-nomor-cari').parentElement, k=document.getElementById(p+'-nomor');
        var awal=s.checked; s.checked=false; s.dispatchEvent(new Event('change',{bubbles:true}));
        return {p:p, s:s, w:w, k:k, awal:awal};
      }).length; })()`);
    await tunggu(100);
    const hasilNomor = await evalJs(`(function(){ return ["jurnal","bayar","terima","transfer","pgaji","dc"].map(function(p){
        var w=document.getElementById(p+'-aturan-nomor-cari').parentElement, k=document.getElementById(p+'-nomor');
        var mati = w.hidden && !k.hidden;
        var s=document.getElementById(p+'-nomor-otomatis'); s.checked=true; s.dispatchEvent(new Event('change',{bubbles:true}));
        return p + ':' + mati;
      }).join('|'); })()`);
    await tunggu(100);
    const hasilNyala = await evalJs(`["jurnal","bayar","terima","transfer","pgaji","dc"].map(function(p){ return p + ':' + (!document.getElementById(p+'-aturan-nomor-cari').parentElement.hidden && document.getElementById(p+'-nomor').hidden); }).join('|')`);
    catat("Semua formulir bernomor (Jurnal Umum, Pembayaran, Penerimaan, Transfer, Pencatatan Gaji, Pencatatan Donasi): saklar mati = aturan tersembunyi & kolom ketik muncul; nyala = kebalikannya", formNomor === 6 && !/false/.test(hasilNomor) && !/false/.test(hasilNyala), hasilNomor + " || " + hasilNyala);
    await klik("#dc-nomor-otomatis"); await tunggu(150);    await evalJs("(function(){var k=document.getElementById('dc-nomor'); k.value='dn-001'; k.dispatchEvent(new Event('input')); return true;})()");
    await simpanDc();
    catat("No Bukti diketik 'dn-001' (kembar dengan DN-001, huruf besar-kecil sama): ditolak 'sudah dipakai'", /No Bukti "dn-001" sudah dipakai/.test(await galatDc()) && (await donasiTersimpan()).length === 3);
    await evalJs("(function(){var k=document.getElementById('dc-nomor'); k.value='DN-777'; k.dispatchEvent(new Event('input')); return true;})()");
    await simpanDc();
    const dn777 = (await donasiTersimpan()).find(d => d.nomor === "DN-777") || {};
    catat("No Bukti 'DN-777' diketik sendiri: tersimpan (Hamba Allah, Kas Kecil Uji, Tunai)", dn777.donaturId === "dn1" && dn777.kasId === "kas1" && dn777.caraBayar === "Tunai" && dn777.total === 1000, JSON.stringify(dn777));
    // Ubah: nilai baris diganti -> jurnal ikut berubah, tetap satu jurnal
    await evalJs("(function(){modulDonasiCatat.bukaUbah(modulDonasiCatat.ambil().find(function(d){return d.nomor==='DB-001';})); return true;})()"); await tunggu(400);
    await klik("#dc-rincian tr.jurnal-baris-data:nth-child(1) td.jurnal-sel-angka"); await tunggu(300);
    await evalJs("(function(){var k=document.getElementById('rdc-nilai'); k.value='175.000'; return true;})()"); await klik("#lanjut-rincian-donasi-catat"); await tunggu(300);
    await simpanDc();
    const ubahDc = (await donasiTersimpan()).find(d => d.nomor === "DB-001") || {};
    const jdUbah = await jurnalDonasi(ubahDc.id);
    catat("Ubah DB-001 (Infaq 175.000): total 225.000; tetap satu jurnal, Debit 225.000, Kredit Infaq 175.000; jumlah donasi tetap", ubahDc.total === 225000 && jdUbah.length === 1 && jdUbah[0].rincian[0].debit === 225000 && jdUbah[0].rincian[1].kredit === 175000 && (await donasiTersimpan()).length === 4, JSON.stringify(jdUbah));
    catat("Log 'Ubah Pencatatan Donasi' mencatat Nilai lama -> baru", await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){var t=JSON.stringify(x); return x.tindakan==='Ubah'&&x.tipe==='Pencatatan Donasi'&&t.indexOf('225.000')!==-1&&t.indexOf('200.000')!==-1;})"));
    // Donasi yang sudah direkonsiliasi (DN-001): ubah dan hapus ditolak
    await evalJs("(function(){modulDonasiCatat.bukaUbah(modulDonasiCatat.ambil().find(function(d){return d.id==='dc1';})); return true;})()"); await tunggu(400);
    await simpanDc();
    catat("Ubah DN-001 yang sudah direkonsiliasi: ditolak 'sudah direkonsiliasi ... Batalkan dulu'", /sudah direkonsiliasi/.test(await galatDc()));
    await evalJs("modulDonasiCatat.hapus(modulDonasiCatat.ambil().find(function(d){return d.id==='dc1';})); true"); await tunggu(300);
    catat("Hapus DN-001 yang sudah direkonsiliasi: ditolak tanpa popup konfirmasi", /sudah direkonsiliasi/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && !(await evalJs("dialogKonfirmasi.open")) && (await donasiTersimpan()).length === 4);
    // Donatur Non Aktif tidak boleh untuk donasi baru
    await evalJs("modulDonasiCatat.bukaBaruKosong(); if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(300);
    await evalJs("(function(){document.getElementById('dc-donatur').value='dn3'; return true;})()");
    await pilihKasUji("kas1"); await tambahBarisUji("infaq", "5000", "d1");
    await simpanDc();
    catat("Donatur Non Aktif (Cici) dipaksa lewat kode: ditolak 'sudah Non Aktif'", /sudah Non Aktif/.test(await galatDc()) && (await donasiTersimpan()).length === 4);
    // Hapus donasi biasa: konfirmasi, lalu donasi dan jurnalnya hilang
    await bersihNotif();
    await evalJs("modulDonasiCatat.hapus(modulDonasiCatat.ambil().find(function(d){return d.nomor==='DN-777';})); true"); await tunggu(300);
    await evalJs("document.getElementById('ya-konfirmasi').click(); true"); await tunggu(400);
    catat("Hapus DN-777: donasi dan jurnal otomatisnya terhapus, Log 'Hapus Pencatatan Donasi'", !(await donasiTersimpan()).some(d => d.nomor === "DN-777") && (await jurnalDonasi(dn777.id)).length === 0 && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Hapus'&&x.tipe==='Pencatatan Donasi'&&x.referensi==='DN-777';})"));
    await bersihNotif(); await evalJs("modulDonasiCatat.bukaBaruKosong(); if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(200);    await evalJs("(function(){var p=document.querySelector('#area-notifikasi'); return true;})()");
    await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    // 5) Daftar
    await klik("#isi-donasi-catat .tombol-daftar"); await tunggu(400);
    const kepala = await evalJs("[...document.querySelectorAll('#isi-donasi-catat .tabel-daftar thead th')].map(function(th){return th.textContent.trim();}).filter(Boolean).join('|')");
    catat("Daftar: kolom Nomor, Tanggal, Donatur, Kas/Bank, Cara Bayar, Kategori Donasi, Keterangan, Nilai", /^Nomor #\|Tanggal\|Donatur\|Kas\/Bank\|Cara Bayar\|Kategori Donasi\|Keterangan\|Nilai/.test(kepala), kepala);
    const baris = await evalJs("[...document.querySelectorAll('#isi-donasi-catat .tabel-daftar tbody tr')].map(function(tr){return [...tr.cells].slice(0,8).map(function(td){return td.textContent.trim();}).join('|');})");
    catat("Isi daftar (terbaru di atas): nama donatur diambil lewat id; Kategori Donasi digabung; Nilai berformat", JSON.stringify(baris.filter(b => b.startsWith("DN-"))) === JSON.stringify(["DN-001|20 Okt 2026|Budi Contoh|11010101 - Kas Kecil Uji|Transfer|Infaq Umum, Wakaf Uji|Untuk renovasi|200.000", "DN-002|5 Sep 2026|Hamba Allah|11010102 - Bank Uji|Tunai|Infaq Umum|<b>tebal</b>|900"]), JSON.stringify(baris));
    catat("Keterangan berisi kode HTML tampil sebagai teks biasa", await evalJs("!document.querySelector('#isi-donasi-catat .tabel-daftar tbody b')"));
    catat("Filter: Tanggal, Cara Bayar, Kas/Bank", await evalJs("[...document.querySelectorAll('#isi-donasi-catat .pilih-filter')].map(function(s){return s.getAttribute('aria-label');}).join('|')==='Filter Tanggal|Filter Cara Bayar|Filter Kas/Bank'"));
    await evalJs("(function(){var s=document.querySelectorAll('#isi-donasi-catat .pilih-filter')[1]; s.value='Tunai'; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(200);
    catat("Filter Cara Bayar 'Tunai': hanya DN-002", (await evalJs("[...document.querySelectorAll('#isi-donasi-catat .tabel-daftar tbody tr')].map(function(tr){return tr.cells[0].textContent.trim();}).join('|')")) === "DN-002");
    await evalJs("(function(){var s=document.querySelectorAll('#isi-donasi-catat .pilih-filter')[1]; s.value=''; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(200);
    // Urut Nilai: 900 < 200.000 (angka, bukan teks)
    await evalJs("(function(){var th=[...document.querySelectorAll('#isi-donasi-catat .tabel-daftar thead th')].find(function(x){return x.textContent.trim().indexOf('Nilai')===0;}); th.querySelector('button.urut').click(); return true;})()"); await tunggu(200);
    const urutNilai1 = await evalJs("[...document.querySelectorAll('#isi-donasi-catat .tabel-daftar tbody tr')].map(function(tr){return tr.cells[0].textContent.trim();}).join('|') + ' ' + document.querySelector('#isi-donasi-catat .tabel-daftar thead').textContent.replace(/\\s+/g,' ')");
    await evalJs("(function(){var th=[...document.querySelectorAll('#isi-donasi-catat .tabel-daftar thead th')].find(function(x){return x.textContent.trim().indexOf('Nilai')===0;}); th.querySelector('button.urut').click(); return true;})()"); await tunggu(200);
    const urutNilai2 = await evalJs("[...document.querySelectorAll('#isi-donasi-catat .tabel-daftar tbody tr')].map(function(tr){return tr.cells[0].textContent.trim();}).join('|') + ' ' + document.querySelector('#isi-donasi-catat .tabel-daftar thead').textContent.replace(/\\s+/g,' ')");
    // Naik (▲): 900 dulu lalu 200.000 (angka, bukan teks; sebagai teks "200000" < "900"). Turun (▼): kebalikannya.
    // Klik pertama = naik (arah 1), klik kedua = turun
    catat("Urut kolom Nilai dibandingkan sebagai angka: naik = DN-002 (900), DN-001 (200.000), DB-001 (225.000); turun = kebalikannya", urutNilai1.startsWith("DN-002|DN-001|DB-001") && urutNilai2.startsWith("DB-001|DN-001|DN-002"), urutNilai1 + " || " + urutNilai2);
    await foto("donasi-catat-daftar.png");
    // 6) Buka donasi tersimpan
    await evalJs("(function(){modulDonasiCatat.bukaUbah(modulDonasiCatat.ambil().find(function(d){return d.id==='dc1';})); return true;})()"); await tunggu(400);
    catat("Buka DN-001: Donatur label '[D.00002] Budi Contoh' (id dn2), tanggal, nomor, Kas/Bank Kas Kecil Uji, mulai di tab Rincian", await evalJs("document.querySelector('#dc-cari-donatur ~ .chip-di-kolom .chip-teks').textContent==='[D.00002] Budi Contoh' && document.getElementById('dc-donatur').value==='dn2' && document.getElementById('dc-tanggal').value==='2026-10-20' && document.getElementById('dc-nomor').value==='DN-001' && document.getElementById('dc-kas').value==='kas1' && !document.getElementById('dc-panel-rincian').hidden"));
    const rincian = await evalJs("[...document.querySelectorAll('#dc-rincian tr')].map(function(tr){return [...tr.cells].slice(1,4).map(function(td){return td.textContent.trim();}).join('|');})");
    catat("Rincian DN-001: 2 baris (Kode, Nama Donasi, Nilai), judul '2 Rincian Donasi', Total Rp 200.000 dan Nilai Pembayaran 200.000", JSON.stringify(rincian) === JSON.stringify(["41010101|Infaq Umum|150.000", "41010102|Wakaf Uji|50.000"]) && (await evalJs("document.getElementById('dc-jumlah').textContent")) === "2 " && /200\.000/.test(await evalJs("document.getElementById('dc-total').textContent")) && (await evalJs("document.getElementById('dc-nilai-bayar').value")) === "200.000", JSON.stringify(rincian));
    catat("Tab 'i' DN-001: Cara Bayar Transfer, Keterangan, Terekonsiliasi 'Sudah' (jurnalnya bertanda cocok)", await evalJs("document.getElementById('dc-cara-bayar').value==='Transfer' && document.getElementById('dc-keterangan').value==='Untuk renovasi' && document.getElementById('dc-rekonsiliasi').textContent==='Sudah'"));
    await evalJs("(function(){modulDonasiCatat.bukaUbah(modulDonasiCatat.ambil().find(function(d){return d.id==='dc2';})); return true;})()"); await tunggu(300);
    catat("Buka DN-002: Terekonsiliasi 'Belum', Cara Bayar Tunai", await evalJs("document.getElementById('dc-rekonsiliasi').textContent==='Belum' && document.getElementById('dc-cara-bayar').value==='Tunai'"));
    // 7) Ganti nama donatur di Donatur -> ikut berubah di daftar donasi (disimpan lewat id)
    await evalJs("(function(){var d=JSON.parse(localStorage.getItem('daftarDonatur')); d[1].nama='Budi Contoh Benar'; localStorage.setItem('daftarDonatur', JSON.stringify(d)); modulDonasiCatat.gambarTabel(); return true;})()"); await tunggu(200);
    catat("Nama donatur diganti di Donatur: daftar donasi langsung menampilkan nama baru", /Budi Contoh Benar/.test(await evalJs("document.querySelector('#isi-donasi-catat .tabel-daftar tbody').textContent")));
    // 8) Data rusak
    await evalJs("localStorage.setItem('daftarDonasi','{rusak'); localStorage.setItem('daftarDonatur','[null,5]'); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Pencatatan Donasi"]'); await tunggu(400);
    await klik("#isi-donasi-catat .tombol-daftar"); await tunggu(300);
    catat("Data donasi rusak di penyimpanan: halaman tetap terbuka, daftar kosong dengan pesan", /Belum ada donasi/.test(await evalJs("document.getElementById('isi-donasi-catat').textContent")));
    // 9) Lebar HP
    await klik("#isi-donasi-catat .tombol-daftar"); await tunggu(300);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await tunggu(400);
    await foto("donasi-catat-390.png");
    catat("Lebar HP 390: formulir Pencatatan Donasi tidak melebar keluar layar", await evalJs("document.getElementById('form-donasi-catat').getBoundingClientRect().right <= 390"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
