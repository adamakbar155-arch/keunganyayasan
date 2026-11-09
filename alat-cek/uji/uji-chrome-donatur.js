// Uji Donatur (D1.4) di Chrome asli. Pemakaian: node uji-chrome-donatur.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9381;
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
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    // ===== D1.4 bagian 1: tampilan Donatur (PRD 6.1) =====
    // Data contoh (bukan data asli)
    await evalJs(`(function(){ localStorage.clear();
      localStorage.setItem('daftarDonatur', JSON.stringify([
        {id:'dn1',idDonatur:'D.00001',nama:'Budi Contoh',kategori:'Perorangan',telepon:'021-111',hp:'0811-1',wa:'0812-1',email:'budi@contoh.id',jalan:'Jl. Contoh 1',kota:'Kota Uji',catatan:'Rutin',nonAktif:false},
        {id:'dn2',idDonatur:'D.00002',nama:'Yayasan Uji',kategori:'Lembaga',telepon:'021-222',hp:'0811-2',wa:'',email:'',jalan:'',kota:'',catatan:'',nonAktif:true},
        {id:'dn3',idDonatur:'D.00003',nama:'Cici Uji',kategori:'',telepon:'021-333',hp:'',wa:'',email:'',jalan:'',kota:'',catatan:'',nonAktif:false},
        {id:'dn4',idDonatur:'D.00004',nama:'<img src=x onerror=alert(1)>',kategori:'Perorangan',telepon:'',hp:'',wa:'',email:'',jalan:'',kota:'',catatan:'',nonAktif:false},
        {id:'dnh',idDonatur:'D.00000',nama:'Hamba Allah',kategori:'',telepon:'',hp:'',wa:'',email:'',jalan:'',kota:'',catatan:'',nonAktif:false,bawaan:true}]));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    // 1) Buka dari popup Donasi
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Donatur"]'); await tunggu(500);
    catat("Popup Donasi > Donatur: tab 'Donatur' terbuka di formulir Data Baru, tab kecil Umum aktif, kursor di Nama", await evalJs("!document.getElementById('isi-donatur').hidden && !document.getElementById('tab-donatur').hidden && !document.getElementById('sub-dn-umum').hidden && document.getElementById('sub-dn-lainnya').hidden && document.activeElement.id==='dn-nama'"));
    catat("Tab Umum dua kolom: Info Umum (Nama*, ID Donatur*, Kategori, No. Telepon, Handphone, No. WhatsApp, Email) dan Info Lainnya (Alamat, Kota); tanpa Faximili/Website/Mata Uang", await evalJs("(function(){var t=document.getElementById('sub-dn-umum').textContent; return /Info Umum/.test(t)&&/Info Lainnya/.test(t)&&/ID Donatur/.test(t)&&/Kategori/.test(t)&&/No\\. Telepon/.test(t)&&/Handphone/.test(t)&&/No\\. WhatsApp/.test(t)&&/Email/.test(t)&&/Alamat/.test(t)&&/Kota/.test(t)&&!/Faximili|Website|Mata Uang|Provinsi|Negara/.test(t) && !!document.querySelector('#sub-dn-umum .dua-kolom');})()"));
    catat("Data Baru: saklar ID Otomatis menyala, kolom ID terkunci berisi ID berikutnya D.00005 (sesudah D.00004)", await evalJs("document.getElementById('dn-id-otomatis').checked && document.getElementById('dn-id').readOnly && document.getElementById('dn-id').value==='D.00005'"));
    await foto("donatur-form.png");
    // 2) Saklar ID
    await klik("#dn-id-otomatis"); await tunggu(200);
    catat("Saklar dimatikan: kolom ID bisa diketik dan mendapat kursor, isinya D.00005 dibiarkan untuk diubah", await evalJs("!document.getElementById('dn-id').readOnly && document.activeElement.id==='dn-id' && document.getElementById('dn-id').value==='D.00005'"));
    await klik("#dn-id-otomatis"); await tunggu(200);
    catat("Saklar dinyalakan lagi: kolom ID terkunci lagi", await evalJs("document.getElementById('dn-id').readOnly"));
    catat("Kategori: pilihan dari kategori yang sudah dipakai (Lembaga, Perorangan), tetap bisa diketik baru", (await evalJs("[...document.querySelectorAll('#dn-daftar-kategori option')].map(function(o){return o.value;}).join('|')")) === "Lembaga|Perorangan" && await evalJs("!document.getElementById('dn-kategori').readOnly"));
    // 3) Tab Lainnya
    await klik("#isi-donatur [data-subtab='dn-lainnya']"); await tunggu(200);
    catat("Tab Lainnya: Catatan dan kotak Non Aktif", await evalJs("!document.getElementById('sub-dn-lainnya').hidden && !!document.getElementById('dn-catatan') && document.getElementById('dn-nonaktif').type==='checkbox'"));
    // 4) Simpan tanpa Nama ditolak (simpan berhasil diuji sesudah daftar, supaya isi daftar di langkah 5 tetap 4 data)
    const bersihNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    const simpan = async () => { await bersihNotif(); await evalJs("document.getElementById('form-donatur').requestSubmit(); true"); await tunggu(400); };
    const isi = (id, nilai) => evalJs("(function(){var e=document.getElementById('" + id + "'); e.value=" + JSON.stringify(nilai) + "; e.dispatchEvent(new Event('input')); return true;})()");
    const galatTeks = (n) => evalJs("document.getElementById('galat-dn-" + n + "').hidden ? '' : document.getElementById('galat-dn-" + n + "').textContent");
    const jumlahDn = () => evalJs("JSON.parse(localStorage.getItem('daftarDonatur')).length");
    await simpan();
    catat("Simpan tanpa Nama: ditolak 'Nama wajib diisi', pindah ke tab Umum, data tidak berubah", /Nama wajib diisi/.test(await galatTeks("nama")) && await evalJs("!document.getElementById('sub-dn-umum').hidden") && (await jumlahDn()) === 5);
    // 5) Daftar
    await klik("#isi-donatur .tombol-daftar"); await tunggu(400);
    const kepala = await evalJs("[...document.querySelectorAll('#isi-donatur .tabel-daftar thead th')].map(function(th){return th.textContent.trim();}).filter(Boolean).join('|')");
    catat("Daftar: kolom Nama, ID Donatur, Kontak Utama, Kategori, Total Donasi", /^Nama\|ID Donatur\|Kontak Utama\|Kategori\|Total Donasi/.test(kepala), kepala);
    const baris = await evalJs("[...document.querySelectorAll('#isi-donatur .tabel-daftar tbody tr')].map(function(tr){return [...tr.cells].slice(0,5).map(function(td){return td.textContent.trim();}).join('|');})");
    const cariBaris = (awal) => baris.find(b => b.startsWith(awal)) || "";
    catat("Kontak Utama: WhatsApp dulu (Budi 0812-1), kalau kosong Handphone (Yayasan 0811-2), kalau kosong Telepon (Cici 021-333)", /^Budi Contoh\|D\.00001\|0812-1\|Perorangan\|/.test(cariBaris("Budi")) && /^Yayasan Uji\|D\.00002\|0811-2\|Lembaga\|/.test(cariBaris("Yayasan")) && /^Cici Uji\|D\.00003\|021-333\|\|/.test(cariBaris("Cici")), JSON.stringify(baris));
    catat("Total Donasi Rp 0 untuk semua donatur (belum ada Pencatatan Donasi), rata kanan", baris.every(b => /\|Rp\s?0$/.test(b)) && await evalJs("getComputedStyle(document.querySelector('#isi-donatur .tabel-daftar tbody tr').cells[4]).textAlign==='right'"), JSON.stringify(baris));
    catat("Tanpa filter di atas daftar (pilihan Tahun di tab Riwayat Donasi formulir tidak dihitung)", await evalJs("[...document.querySelectorAll('#isi-donatur .pilih-filter')].every(function(s){return !!s.closest('.modul-form');})"));
    catat("Nama berisi kode HTML tampil sebagai teks biasa (tidak dijalankan)", await evalJs("!document.querySelector('#isi-donatur .tabel-daftar tbody img') && [...document.querySelectorAll('#isi-donatur .tabel-daftar tbody td')].some(function(td){return td.textContent==='<img src=x onerror=alert(1)>';})"));
    await foto("donatur-daftar.png");
    // 6) Klik baris: formulir berisi data lama
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dn1';})); return true;})()"); await tunggu(400);
    catat("Buka Budi Contoh: semua isian terisi, saklar ID mati dengan ID lama D.00001, mulai di tab Umum", await evalJs("(function(){var v=function(i){return document.getElementById(i).value;}; return v('dn-nama')==='Budi Contoh'&&v('dn-id')==='D.00001'&&!document.getElementById('dn-id-otomatis').checked&&v('dn-kategori')==='Perorangan'&&v('dn-telepon')==='021-111'&&v('dn-hp')==='0811-1'&&v('dn-wa')==='0812-1'&&v('dn-email')==='budi@contoh.id'&&v('dn-jalan')==='Jl. Contoh 1'&&v('dn-kota')==='Kota Uji'&&v('dn-catatan')==='Rutin'&&!document.getElementById('dn-nonaktif').checked&&!document.getElementById('sub-dn-umum').hidden;})()"));
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dn2';})); return true;})()"); await tunggu(300);
    catat("Buka Yayasan Uji: kotak Non Aktif tercentang", await evalJs("document.getElementById('dn-nonaktif').checked"));
    // ===== D1.4 bagian 2: simpan dan ubah =====
    const dnNama = (nama) => evalJs("JSON.stringify(JSON.parse(localStorage.getItem('daftarDonatur')).filter(function(d){return d.nama===" + JSON.stringify(nama) + ";}))").then(JSON.parse);
    const dnId = (id) => evalJs("JSON.stringify(JSON.parse(localStorage.getItem('daftarDonatur')).find(function(d){return d.id==='" + id + "';}))||'null'").then(JSON.parse);
    // a) Data Baru, nama sama dengan donatur lain, ID otomatis
    await evalJs("modulDonatur.bukaBaru(); true"); await tunggu(300);
    await isi("dn-nama", "Budi Contoh"); await isi("dn-kategori", "Perorangan"); await isi("dn-telepon", " 021-555 "); await isi("dn-hp", "0811-5"); await isi("dn-wa", "0812-5"); await isi("dn-email", "budi2@contoh.id"); await isi("dn-jalan", "Jl. Uji 5"); await isi("dn-kota", "Kota Dua"); await isi("dn-catatan", "Baru"); await evalJs("document.getElementById('dn-nonaktif').checked=true; true");
    await simpan();
    const budi = await dnNama("Budi Contoh");
    const baru = budi.find(d => d.idDonatur === "D.00005") || {};
    catat("Simpan Data Baru bernama sama dengan donatur lain: boleh; ID otomatis D.00005; semua isian tersimpan (spasi di tepi dibuang)", budi.length === 2 && baru.kategori === "Perorangan" && baru.telepon === "021-555" && baru.hp === "0811-5" && baru.wa === "0812-5" && baru.email === "budi2@contoh.id" && baru.jalan === "Jl. Uji 5" && baru.kota === "Kota Dua" && baru.catatan === "Baru" && baru.nonAktif === true && (await jumlahDn()) === 6, JSON.stringify(baru));
    catat("Notifikasi berhasil + Log 'Buat Donatur Budi Contoh'", /Donatur telah berhasil disimpan/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Buat'&&x.tipe==='Donatur'&&x.referensi==='Budi Contoh';})"));
    catat("Formulir kosong lagi, ID otomatis berikutnya D.00006", await evalJs("document.getElementById('dn-nama').value==='' && document.getElementById('dn-id').value==='D.00006' && document.getElementById('dn-id-otomatis').checked && !document.getElementById('dn-nonaktif').checked"));
    // b) ID diketik sendiri: kosong dan kembar ditolak
    await isi("dn-nama", "Dedi Uji"); await klik("#dn-id-otomatis"); await tunggu(150); await isi("dn-id", "  "); await simpan();
    catat("Saklar mati, ID kosong: ditolak 'ID Donatur wajib diisi'", /ID Donatur wajib diisi/.test(await galatTeks("id")) && (await jumlahDn()) === 6);
    await isi("dn-id", "d.00001"); await simpan();
    catat("ID kembar dengan donatur lain (huruf kecil d.00001 = D.00001): ditolak 'sudah dipakai'", /ID Donatur sudah dipakai/.test(await galatTeks("id")) && (await jumlahDn()) === 6);
    // c) ID diketik sendiri D.00100: tersimpan, ID otomatis berikutnya melompat ke D.00101
    await isi("dn-id", "D.00100"); await simpan();
    catat("ID ketikan sendiri D.00100 tersimpan; ID otomatis berikutnya D.00101 (tidak bertabrakan)", (await dnNama("Dedi Uji")).some(d => d.idDonatur === "D.00100") && await evalJs("document.getElementById('dn-id').value==='D.00101' && document.getElementById('dn-id-otomatis').checked"));
    // d) Ubah: ganti nama, ID lama tetap (tidak dianggap kembar dengan dirinya sendiri)
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dn1';})); return true;})()"); await tunggu(300);
    await isi("dn-nama", "Budi Contoh Benar"); await simpan();
    const dn1 = await dnId("dn1");
    catat("Ubah nama Budi Contoh -> Budi Contoh Benar: tersimpan di data yang sama (id dn1, ID D.00001), jumlah tetap 7", dn1.nama === "Budi Contoh Benar" && dn1.idDonatur === "D.00001" && dn1.wa === "0812-1" && (await jumlahDn()) === 7, JSON.stringify(dn1));
    catat("Log 'Ubah Donatur' mencatat nama lama dan nama baru", await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){var t=JSON.stringify(x); return x.tindakan==='Ubah'&&x.tipe==='Donatur'&&t.indexOf('Budi Contoh Benar')!==-1&&t.indexOf('\"Budi Contoh\"')!==-1;})"), await evalJs("JSON.stringify(JSON.parse(localStorage.getItem('logAktivitas')||'[]').filter(function(x){return x.tindakan==='Ubah';}).slice(-1))"));
    // e) Ubah ID ke ID donatur lain ditolak
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dn3';})); return true;})()"); await tunggu(300);
    await isi("dn-id", "D.00002"); await simpan();
    catat("Ubah ID Cici menjadi D.00002 (milik Yayasan Uji): ditolak, data tetap", /ID Donatur sudah dipakai/.test(await galatTeks("id")) && (await dnId("dn3")).idDonatur === "D.00003");
    // f) Penyimpanan gagal: pesan gagal, data tidak berubah
    const sblmGagal = await evalJs("localStorage.getItem('daftarDonatur')");
    await evalJs("window.__setAsli = Storage.prototype.setItem; Storage.prototype.setItem = function(k){ if (k==='daftarDonatur') { throw new Error('penuh'); } return window.__setAsli.apply(this, arguments); }; true");
    await isi("dn-id", "D.00003"); await isi("dn-nama", "Cici Gagal"); await simpan();
    await evalJs("Storage.prototype.setItem = window.__setAsli; true");
    catat("Penyimpanan browser gagal: muncul pesan gagal, data donatur tidak berubah", /Gagal/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && (await evalJs("localStorage.getItem('daftarDonatur')")) === sblmGagal);
    await bersihNotif();
    // ===== D1.4 bagian 3: Hamba Allah dan hapus =====
    const hapusDn = (id) => evalJs("(function(){modulDonatur.hapus(modulDonatur.ambil().find(function(d){return d.id==='" + id + "';})); return true;})()").then(() => tunggu(300));
    await hapusDn("dnh");
    catat("Hapus Hamba Allah: ditolak dengan alasan 'donatur bawaan', tanpa popup konfirmasi, data tetap", /donatur bawaan.*tidak bisa dihapus/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && !(await evalJs("dialogKonfirmasi.open")) && (await jumlahDn()) === 7);
    await bersihNotif();
    // Hamba Allah diubah (misalnya diberi catatan): tanda bawaan tetap ada
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dnh';})); return true;})()"); await tunggu(300);
    await isi("dn-catatan", "Kotak amal tanpa nama"); await simpan();
    const dnh = await dnId("dnh");
    catat("Hamba Allah diubah (catatan): tersimpan dan tetap bertanda bawaan", dnh.catatan === "Kotak amal tanpa nama" && dnh.bawaan === true, JSON.stringify(dnh));
    // Kunci nama dan Non Aktif Hamba Allah (Temuan 25)
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dnh';})); return true;})()"); await tunggu(300);
    catat("Buka Hamba Allah: kolom Nama terkunci dan kotak Non Aktif tidak bisa dicentang; kolom lain tetap bisa diisi", await evalJs("document.getElementById('dn-nama').readOnly && document.getElementById('dn-nonaktif').disabled && !document.getElementById('dn-hp').readOnly && !document.getElementById('dn-catatan').readOnly"));
    await bersihNotif();
    await evalJs("(function(){document.getElementById('dn-nama').value='Ahmad Contoh'; document.getElementById('dn-nonaktif').checked=true; return true;})()");
    await isi("dn-hp", "0811-9"); await simpan();
    const dnhKunci = await dnId("dnh");
    catat("Isian Nama/Non Aktif dipaksa berubah lewat cara lain: tetap tersimpan 'Hamba Allah' dan aktif; HP baru tersimpan", dnhKunci.nama === "Hamba Allah" && dnhKunci.nonAktif === false && dnhKunci.hp === "0811-9" && dnhKunci.bawaan === true, JSON.stringify(dnhKunci));
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dn2';})); return true;})()"); await tunggu(300);
    catat("Donatur biasa (Yayasan Uji): Nama dan Non Aktif tidak terkunci", await evalJs("!document.getElementById('dn-nama').readOnly && !document.getElementById('dn-nonaktif').disabled"));
    await evalJs("modulDonatur.bukaBaru(); true"); await tunggu(200);
    catat("Data Baru sesudah membuka Hamba Allah: Nama dan Non Aktif tidak terkunci lagi", await evalJs("!document.getElementById('dn-nama').readOnly && !document.getElementById('dn-nonaktif').disabled"));
    await bersihNotif(); await hapusDn("dnh");
    catat("Sesudah diubah, Hamba Allah tetap tidak bisa dihapus", /donatur bawaan/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && (await jumlahDn()) === 7);
    // Donatur biasa: konfirmasi; Batal = tetap ada; Ya, Hapus = terhapus + Log
    await bersihNotif(); await hapusDn("dn3");
    catat("Hapus Cici Uji: muncul popup konfirmasi", await evalJs("dialogKonfirmasi.open"));
    await evalJs("document.getElementById('batal-konfirmasi').click(); true"); await tunggu(200);
    catat("Batal: Cici Uji tetap ada", (await jumlahDn()) === 7 && !!(await dnId("dn3")));
    await hapusDn("dn3"); await evalJs("document.getElementById('ya-konfirmasi').click(); true"); await tunggu(400);
    catat("Ya, Hapus: Cici Uji terhapus, notifikasi 'Donatur telah dihapus', Log 'Hapus Donatur Cici Uji'", (await jumlahDn()) === 6 && !(await dnId("dn3")) && /Donatur telah dihapus/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Hapus'&&x.tipe==='Donatur'&&x.referensi==='Cici Uji';})"));
    await bersihNotif();
    // ===== D1.5 bagian 4: Total Donasi dan tolak hapus donatur yang sudah berdonasi =====
    // Budi (dn1) berdonasi dua kali, Yayasan (dn2) belum pernah; satu donasi rusak (tanpa donaturId) dilewati
    await evalJs("localStorage.setItem('daftarDonasi', JSON.stringify([{id:'x1',nomor:'DN-1',donaturId:'dn1',total:150000},{id:'x2',nomor:'DN-2',donaturId:'dn1',total:'50000'},{id:'x3',nomor:'DN-3',total:999},null])); true");
    await evalJs("saatTabDibuka.donatur(); true"); await tunggu(300);
    const totalDn = (nama) => evalJs("(function(){var tr=[...document.querySelectorAll('#isi-donatur .tabel-daftar tbody tr')].find(function(t){return t.cells[0].textContent.trim()===" + JSON.stringify(nama) + ";}); return tr ? tr.cells[4].textContent.trim() : '';})()");
    const tBudi = await totalDn("Budi Contoh Benar"), tYay = await totalDn("Yayasan Uji");
    catat("Total Donasi: Budi Contoh Benar (dn1) Rp 200.000 (dua donasi dijumlah), Yayasan Rp 0; donasi rusak dilewati", /Rp\s?200\.000$/.test(tBudi) && /Rp\s?0$/.test(tYay), tBudi + " / " + tYay);
    await hapusDn("dn1");
    catat("Hapus Budi (sudah berdonasi): ditolak 'sudah dipakai di 2 Pencatatan Donasi', tanpa konfirmasi, data tetap", /sudah dipakai di 2 Pencatatan Donasi/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && !(await evalJs("dialogKonfirmasi.open")) && !!(await dnId("dn1")));
    await bersihNotif();
    // ===== D1.5 bagian 4b: tab Riwayat Donasi =====
    // Y = tahun ini di browser. Budi (dn1): 2 donasi tahun ini (satu dengan Nama Donasi sangat panjang + kode HTML), 1 tahun lalu.
    await evalJs(`(function(){ var Y=new Date().getFullYear(); var panjang='Infaq Pembangunan Masjid Jami Al Ikhlas Tahap Kedua Bagian Atap dan Menara';
      localStorage.setItem('daftarDonasi', JSON.stringify([
        {id:'r1',nomor:'DN-0001',tanggal:Y+'-03-01',donaturId:'dn1',kas:'110101 - Kas Kecil',total:100000,rincian:[{nama:'Zakat',nilai:100000}]},
        {id:'r2',nomor:'DN-0002',tanggal:Y+'-10-05',donaturId:'dn1',kas:'110201 - Bank BSI',total:250000,rincian:[{nama:panjang,nilai:200000},{nama:'<img src=x onerror=alert(1)>',nilai:50000}]},
        {id:'r3',nomor:'DN-0003',tanggal:(Y-1)+'-12-31',donaturId:'dn1',kas:'110101 - Kas Kecil',total:75000,rincian:[{nama:'Wakaf',nilai:75000}]},
        {id:'r4',nomor:'DN-0004',tanggal:Y+'-01-01',donaturId:'dn4',kas:'110101 - Kas Kecil',total:1,rincian:[]}])); return true; })()`);
    await evalJs("saatTabDibuka.donatur(); true"); await tunggu(200);
    const tahunIni = await evalJs("String(new Date().getFullYear())");
    const riwayat = () => evalJs("JSON.stringify({tahun:[...document.getElementById('dn-riwayat-tahun').options].map(function(o){return o.textContent;}), pilih:document.getElementById('dn-riwayat-tahun').value, baris:[...document.querySelectorAll('#dn-riwayat-isi tr')].map(function(tr){return [...tr.cells].map(function(td){return td.textContent;}).join('|');}), total:document.getElementById('dn-riwayat-total').hidden?'':document.getElementById('dn-riwayat-total').textContent, kosong:document.getElementById('dn-riwayat-kosong').hidden?'':document.getElementById('dn-riwayat-kosong').textContent, tabel:!document.querySelector('#sub-dn-riwayat .riwayat-dn-gulir').hidden, alat:!document.querySelector('#sub-dn-riwayat .riwayat-dn-alat').hidden})").then(JSON.parse);
    catat("Formulir Donatur punya tiga tab: Umum, Lainnya, Riwayat Donasi", await evalJs("[...document.querySelectorAll('#isi-donatur .sub-tab')].map(function(b){return b.textContent.trim();}).join('|')==='Umum|Lainnya|Riwayat Donasi'"));
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dn1';})); return true;})()"); await tunggu(300);
    catat("Membuka donatur tetap mulai di tab Umum", await evalJs("!document.getElementById('sub-dn-umum').hidden && document.getElementById('sub-dn-riwayat').hidden"));
    await klik("#isi-donatur [data-subtab='dn-riwayat']"); await tunggu(200);
    let rw = await riwayat();
    catat("Riwayat Budi: pilihan Tahun [tahun ini, tahun lalu, Semua], awalnya tahun ini", JSON.stringify(rw.tahun) === JSON.stringify([tahunIni, String(tahunIni - 1), "Semua"]) && rw.pilih === tahunIni, JSON.stringify(rw.tahun) + " " + rw.pilih);
    catat("Tahun ini: 2 donasi, terbaru di atas (DN-0002 lalu DN-0001), kolom Tanggal|No Bukti|Nama Donasi|Kas/Bank|Nilai", rw.baris.length === 2 && /^0?5 Okt \d{4}\|DN-0002\|Infaq Pembangunan.*, <img src=x onerror=alert\(1\)>\|110201 - Bank BSI\|250\.000$/.test(rw.baris[0]) && /^0?1 Mar \d{4}\|DN-0001\|Zakat\|110101 - Kas Kecil\|100\.000$/.test(rw.baris[1]), JSON.stringify(rw.baris));
    catat("Total di bawah: 'Total <tahun> (2 donasi): Rp 350.000'", new RegExp("^Total " + tahunIni + " \\(2 donasi\\): Rp\\s?350\\.000$").test(rw.total), rw.total);
    catat("Nama Donasi berisi kode HTML tampil sebagai teks (tidak dijalankan)", await evalJs("!document.querySelector('#dn-riwayat-isi img')"));
    catat("Nama Donasi panjang: satu baris dipotong '…' (text-overflow ellipsis), nama lengkap di title", await evalJs("(function(){var td=document.querySelector('#dn-riwayat-isi tr td.riwayat-dn-nama'); var g=getComputedStyle(td); return g.textOverflow==='ellipsis' && g.whiteSpace==='nowrap' && td.scrollWidth>td.clientWidth && /Menara, <img/.test(td.title);})()"));
    catat("Hanya untuk dilihat: baris tidak bisa diklik (kursor biasa, bukan tangan)", await evalJs("getComputedStyle(document.querySelector('#dn-riwayat-isi tr')).cursor!=='pointer'"));
    await foto("donatur-riwayat.png");
    await evalJs("(function(){var s=document.getElementById('dn-riwayat-tahun'); s.value=''; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(150);
    rw = await riwayat();
    catat("Pilih Semua: 3 donasi (tahun lalu ikut, paling bawah), Total semua tahun Rp 425.000 = Total Donasi di daftar", rw.baris.length === 3 && /DN-0003/.test(rw.baris[2]) && /^Total semua tahun \(3 donasi\): Rp\s?425\.000$/.test(rw.total), JSON.stringify(rw));
    await evalJs("(function(){var s=document.getElementById('dn-riwayat-tahun'); s.value='" + (tahunIni - 1) + "'; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(150);
    rw = await riwayat();
    catat("Pilih tahun lalu: 1 donasi (DN-0003, Wakaf), Total Rp 75.000", rw.baris.length === 1 && /DN-0003\|Wakaf/.test(rw.baris[0]) && /\(1 donasi\): Rp\s?75\.000$/.test(rw.total), JSON.stringify(rw));
    // Donatur tanpa donasi dan Data Baru
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dn2';})); return true;})()"); await tunggu(300);
    rw = await riwayat();
    catat("Donatur tanpa donasi (Yayasan): 'Belum ada donasi dari donatur ini.', tabel, Total, dan pilihan Tahun tidak tampil; pilihan kembali ke tahun ini", rw.kosong === "Belum ada donasi dari donatur ini." && !rw.tabel && rw.total === "" && !rw.alat && rw.pilih === tahunIni, JSON.stringify(rw));
    await evalJs("modulDonatur.bukaBaru(); true"); await tunggu(300);
    rw = await riwayat();
    catat("Data Baru: 'Belum ada donasi dari donatur ini.'", rw.kosong === "Belum ada donasi dari donatur ini." && rw.baris.length === 0, JSON.stringify(rw));
    // Donasi yang banyak: 80 donasi tahun ini -> kotak tabel bergulir ke bawah, judul kolom tetap
    await evalJs(`(function(){ var Y=new Date().getFullYear(); var a=[]; for(var i=1;i<=80;i++){ a.push({id:'m'+i,nomor:'DN-M'+String(i).padStart(3,'0'),tanggal:Y+'-01-'+String((i%28)+1).padStart(2,'0'),donaturId:'dn1',kas:'110101 - Kas Kecil',total:1000,rincian:[{nama:'Infaq',nilai:1000}]}); } localStorage.setItem('daftarDonasi', JSON.stringify(a)); return true; })()`);
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dn1';})); document.querySelector(\"#isi-donatur [data-subtab='dn-riwayat']\").click(); return true;})()"); await tunggu(300);
    const gulir = JSON.parse(await evalJs("(function(){var b=document.querySelector('#sub-dn-riwayat .riwayat-dn-gulir'); var th=b.querySelector('thead th'); b.scrollTop=500; var atas=th.getBoundingClientRect().top-b.getBoundingClientRect().top; return JSON.stringify({baris:document.querySelectorAll('#dn-riwayat-isi tr').length, tinggi:b.clientHeight, isi:b.scrollHeight, digulir:b.scrollTop, judulDiAtas:Math.abs(atas)<=2, total:document.getElementById('dn-riwayat-total').textContent});})()"));
    catat("80 donasi: kotak tabel paling tinggi 360px dan bisa digulir ke bawah; judul kolom tetap di atas saat digulir; Total (80 donasi) Rp 80.000", gulir.baris === 80 && gulir.tinggi <= 360 && gulir.isi > gulir.tinggi && gulir.digulir > 0 && gulir.judulDiAtas && /\(80 donasi\): Rp\s?80\.000$/.test(gulir.total), JSON.stringify(gulir));
    await foto("donatur-riwayat-banyak.png");
    // Data donasi rusak: daftar Donatur tetap tampil, Total Rp 0
    await evalJs("localStorage.setItem('daftarDonasi','{rusak'); saatTabDibuka.donatur(); true"); await tunggu(300);
    catat("Data Pencatatan Donasi rusak: daftar Donatur tetap tampil, Total Budi Rp 0", /Rp\s?0$/.test(await totalDn("Budi Contoh Benar")));
    await evalJs("(function(){modulDonatur.bukaUbah(modulDonatur.ambil().find(function(d){return d.id==='dn1';})); return true;})()"); await tunggu(300);
    catat("Data Pencatatan Donasi rusak: Riwayat Donasi Budi menampilkan 'Belum ada donasi', tidak macet", (await riwayat()).kosong === "Belum ada donasi dari donatur ini.");
    await evalJs("localStorage.removeItem('daftarDonasi'); true");
    // Penyimpanan kosong: Hamba Allah dibuat otomatis sekali saja
    await evalJs("localStorage.removeItem('daftarDonatur'); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const dnKosong = await evalJs("localStorage.getItem('daftarDonatur')").then(JSON.parse);
    catat("Belum ada data donatur: 'Hamba Allah' dibuat otomatis (ID D.00001, bertanda bawaan)", Array.isArray(dnKosong) && dnKosong.length === 1 && dnKosong[0].nama === "Hamba Allah" && dnKosong[0].idDonatur === "D.00001" && dnKosong[0].bawaan === true, JSON.stringify(dnKosong));
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Donatur"]'); await tunggu(400);
    catat("Muat ulang dan buka tab Donatur lagi: Hamba Allah tidak dibuat dua kali; ID Data Baru berikutnya D.00002", (await jumlahDn()) === 1 && (await evalJs("document.getElementById('dn-id').value")) === "D.00002");
    // 7) Data rusak tidak membuat macet
    await evalJs("localStorage.setItem('daftarDonatur','{rusak'); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Donatur"]'); await tunggu(400);
    await klik("#isi-donatur .tombol-daftar"); await tunggu(300);
    catat("Data Donatur rusak di penyimpanan: halaman tetap terbuka, daftar kosong dengan pesan", /Belum ada donatur/.test(await evalJs("document.getElementById('isi-donatur').textContent")));
    catat("Data rusak tidak ditimpa oleh pembuatan Hamba Allah otomatis (masih bisa dipulihkan)", (await evalJs("localStorage.getItem('daftarDonatur')")) === "{rusak");
    // 8) Lebar HP
    await klik("#isi-donatur .tombol-daftar"); await tunggu(300);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await tunggu(400);
    await foto("donatur-390.png");
    catat("Lebar HP 390: formulir Donatur tidak melebar keluar layar (dua kolom turun jadi satu)", await evalJs("document.getElementById('form-donatur').getBoundingClientRect().right <= 390"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
