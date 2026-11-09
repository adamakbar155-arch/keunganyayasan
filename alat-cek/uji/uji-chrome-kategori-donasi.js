// Uji Kategori Donasi (D1.3) di Chrome asli, TANPA pembungkus akun. Pemakaian: node uji-chrome-kategori-donasi.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9379;
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
    // ===== D1.3 bagian 1: tampilan Kategori Donasi (PRD 6.1) =====
    // Data contoh (bukan data asli): bagan pendapatan 3 tingkat, satu akun beban, dua Kategori Donasi yang sudah ada
    await evalJs(`(function(){ localStorage.clear();
      localStorage.setItem('daftarAkun', JSON.stringify([
        {id:'i1',kode:'4101',nama:'Pendapatan',tipe:'pendapatan',indukId:'',saldoAwal:0},
        {id:'i2',kode:'410101',nama:'Donasi',tipe:'pendapatan',indukId:'i1',saldoAwal:0},
        {id:'a1',kode:'41010101',nama:'Infaq Umum',tipe:'pendapatan',indukId:'i2',saldoAwal:0},
        {id:'a2',kode:'41010102',nama:'Zakat Fitrah',tipe:'pendapatan',indukId:'i2',saldoAwal:0},
        {id:'b1',kode:'5101',nama:'Beban',tipe:'beban',indukId:'',saldoAwal:0}]));
      localStorage.setItem('daftarKategoriDonasi', JSON.stringify([
        {id:'kd1',nama:'Infaq Umum',indukId:'i2',akunId:'a1',kode:'41010101',kelompok:'Infaq',catatan:'Kotak amal'},
        {id:'kd2',nama:'Zakat Fitrah',indukId:'i2',akunId:'a2',kode:'41010102',kelompok:'Zakat',catatan:''}]));
      localStorage.setItem('akunPerkiraanYayasan', JSON.stringify({donasiTerikat:[],donasiTidakTerikat:['41010101']}));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    // 1) Buka dari popup Donasi
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Kategori Donasi"]'); await tunggu(500);
    catat("Popup Donasi > Kategori Donasi: tab 'Kategori Donasi' terbuka di formulir Data Baru, tab kecil Umum aktif, kursor di Nama Donasi", await evalJs("!document.getElementById('isi-kategori-donasi').hidden && !document.getElementById('tab-kategori-donasi').hidden && !document.getElementById('sub-kd-umum').hidden && document.getElementById('sub-kd-lainnya').hidden && document.activeElement.id==='kd-nama'"));
    catat("Tab Umum: Nama Donasi*, Sub dari*, Kode Donasi (terkunci), Kelompok; tanpa Jenis Barang/Satuan", await evalJs("(function(){var t=document.getElementById('sub-kd-umum').textContent; return /Nama Donasi/.test(t) && /Sub dari/.test(t) && /Kode Donasi/.test(t) && /Kelompok/.test(t) && !/Satuan|Jenis Barang/.test(t) && document.getElementById('kd-kode').readOnly;})()"));
    await foto("kategori-donasi-form.png");
    // 2) Pilihan Sub dari
    const opsiInduk = await evalJs("[...document.getElementById('kd-induk').options].map(function(o){return o.textContent;}).join('|')");
    catat("Sub dari: hanya akun Pendapatan tingkat 1-2 (4101, 410101); akun Kategori Donasi dan akun Beban tidak muncul", opsiInduk === "Pilih akun induk...|4101 Pendapatan|- 410101 Donasi", opsiInduk);
    await evalJs("(function(){var s=document.getElementById('kd-induk'); s.value='i2'; s.dispatchEvent(new Event('change')); return true;})()");
    catat("Pilih induk 410101: Kode Donasi otomatis 41010103 (sesudah 41010101 dan 41010102)", await evalJs("document.getElementById('kd-kode').value") === "41010103", await evalJs("document.getElementById('kd-kode').value"));
    await evalJs("(function(){var s=document.getElementById('kd-induk'); s.value='i1'; s.dispatchEvent(new Event('change')); return true;})()");
    catat("Ganti induk ke 4101: Kode Donasi ikut berubah jadi 410102", await evalJs("document.getElementById('kd-kode').value") === "410102");
    catat("Kelompok: pilihan dari kelompok yang sudah dipakai (Infaq, Zakat), tetap bisa diketik baru", await evalJs("[...document.querySelectorAll('#kd-daftar-kelompok option')].map(function(o){return o.value;}).join('|')") === "Infaq|Zakat" && await evalJs("document.getElementById('kd-kelompok').getAttribute('list')==='kd-daftar-kelompok' && !document.getElementById('kd-kelompok').readOnly"));
    // 3) Tab Lainnya
    await klik("#isi-kategori-donasi [data-subtab='kd-lainnya']"); await tunggu(200);
    catat("Klik tab Lainnya: isian Catatan tampil, tab Umum tersembunyi", await evalJs("!document.getElementById('sub-kd-lainnya').hidden && document.getElementById('sub-kd-umum').hidden && !!document.getElementById('kd-catatan')"));
    // 4) Simpan (bagian 2): pemeriksaan isian
    const bersihNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    const isi = (id, nilai) => evalJs("(function(){var e=document.getElementById('" + id + "'); e.value=" + JSON.stringify(nilai) + "; e.dispatchEvent(new Event('" + (id === 'kd-induk' ? 'change' : 'input') + "')); return true;})()");
    const simpan = async () => { await bersihNotif(); await evalJs("document.getElementById('form-kategori-donasi').requestSubmit(); true"); await tunggu(400); };
    const jumlahAkun = () => evalJs("JSON.parse(localStorage.getItem('daftarAkun')).length");
    const jumlahKd = () => evalJs("JSON.parse(localStorage.getItem('daftarKategoriDonasi')).length");
    await simpan();
    catat("Simpan tanpa Nama: ditolak 'Nama Donasi wajib diisi', pindah ke tab Umum", /Nama Donasi wajib diisi/.test(await evalJs("document.getElementById('galat-kd-nama').textContent")) && await evalJs("!document.getElementById('galat-kd-nama').hidden && !document.getElementById('sub-kd-umum').hidden"));
    await isi("kd-nama", "infaq umum"); await simpan();
    catat("Nama kembar dengan kategori lain (huruf besar/kecil tidak dibedakan): ditolak", /sudah dipakai kategori lain/.test(await evalJs("document.getElementById('galat-kd-nama').textContent")));
    await isi("kd-nama", "Donasi Masjid"); await isi("kd-induk", ""); await simpan();
    catat("Tanpa Sub dari: ditolak 'Pilih akun induknya'", /Pilih akun induknya/.test(await evalJs("document.getElementById('galat-kd-induk').textContent")) && (await jumlahKd()) === 2 && (await jumlahAkun()) === 5);
    // Simpan berhasil
    await isi("kd-induk", "i2"); await isi("kd-kelompok", "Wakaf"); await isi("kd-catatan", "Untuk renovasi"); await simpan();
    const kdBaru = (await evalJs("JSON.parse(localStorage.getItem('daftarKategoriDonasi'))")).find(k => k.nama === "Donasi Masjid") || {};
    const akunBaru = (await evalJs("JSON.parse(localStorage.getItem('daftarAkun'))")).find(a => a.kode === "41010103") || {};
    catat("Simpan berhasil: Kategori Donasi 'Donasi Masjid' (induk i2, kode 41010103, kelompok Wakaf, catatan) tersimpan + notifikasi", kdBaru.indukId === "i2" && kdBaru.kode === "41010103" && kdBaru.kelompok === "Wakaf" && kdBaru.catatan === "Untuk renovasi" && /Kategori Donasi telah berhasil disimpan/.test(await evalJs("document.getElementById('area-notifikasi').textContent")), JSON.stringify(kdBaru));
    catat("Akun pendapatan otomatis dibuat: 41010103 'Donasi Masjid', sub dari 410101, bertanda milik kategori itu, terhubung lewat akunId", akunBaru.nama === "Donasi Masjid" && akunBaru.tipe === "pendapatan" && akunBaru.indukId === "i2" && akunBaru.kategoriDonasiId === kdBaru.id && kdBaru.akunId === akunBaru.id && akunBaru.saldoAwal === 0, JSON.stringify(akunBaru));
    catat("Akun baru tampil di Akun Perkiraan (petaAkun: tingkat 3 di bawah 410101)", await evalJs("(function(){var p=petaAkun(); var a=p.semua.find(function(x){return x.kode==='41010103';}); return !!a && p.dalam[a.id]===2;})()"));
    catat("Formulir kosong lagi, siap Data Baru berikutnya; kelompok baru 'Wakaf' masuk pilihan Kelompok", await evalJs("document.getElementById('kd-nama').value==='' && document.getElementById('kd-induk').value==='' && document.getElementById('kd-kode').value===''") && /Wakaf/.test(await evalJs("[...document.querySelectorAll('#kd-daftar-kelompok option')].map(function(o){return o.value;}).join('|')")));
    catat("Log Aktivitas: 'Buat Kategori Donasi Donasi Masjid' dan 'Buat Akun Perkiraan 41010103 Donasi Masjid (dari Kategori Donasi)'", await evalJs("(function(){var l=JSON.parse(localStorage.getItem('logAktivitas')||'[]'); return l.some(function(x){return x.tindakan==='Buat'&&x.tipe==='Kategori Donasi'&&x.referensi==='Donasi Masjid';}) && l.some(function(x){return x.tipe==='Akun Perkiraan'&&/41010103 Donasi Masjid \\(dari Kategori Donasi\\)/.test(x.referensi);});})()"));
    // Induk tingkat 1: akun hasil di tingkat 2, lalu akun itu tidak ditawarkan sebagai induk
    await isi("kd-nama", "Donasi Sekolah"); await isi("kd-induk", "i1"); await simpan();
    const opsiSesudah = await evalJs("[...document.getElementById('kd-induk').options].map(function(o){return o.textContent;}).join('|')");
    catat("Induk 4101: akun 410102 'Donasi Sekolah' dibuat; akun milik kategori itu TIDAK ditawarkan sebagai Sub dari", (await evalJs("JSON.parse(localStorage.getItem('daftarAkun')).some(function(a){return a.kode==='410102'&&a.nama==='Donasi Sekolah';})")) && opsiSesudah === "Pilih akun induk...|4101 Pendapatan|- 410101 Donasi", opsiSesudah);
    // Gagal menyimpan kategori: akun yang baru dibuat dibatalkan
    const akunSebelum = await evalJs("localStorage.getItem('daftarAkun')");
    await evalJs("window.__simpanAsli = modulKategoriDonasi.simpan; modulKategoriDonasi.simpan = function(){ return false; }; true");
    await isi("kd-nama", "Uji Gagal"); await isi("kd-induk", "i2"); await simpan();
    await evalJs("modulKategoriDonasi.simpan = window.__simpanAsli; true");
    catat("Kategori gagal disimpan: daftar akun dikembalikan persis seperti semula (tidak ada akun yatim)", (await evalJs("localStorage.getItem('daftarAkun')")) === akunSebelum && (await jumlahKd()) === 4);
    await isi("kd-nama", ""); await isi("kd-induk", "");
    await bersihNotif();
    // 5) Daftar
    await klik("#isi-kategori-donasi .tombol-daftar"); await tunggu(400);
    const kepala = await evalJs("[...document.querySelectorAll('#isi-kategori-donasi .tabel-daftar thead th')].map(function(th){return th.textContent.trim();}).filter(Boolean).join('|')");
    catat("Daftar: kolom Nama Donasi, Kode, Kelompok, Terikat / Tidak Terikat", /^Nama Donasi\|Kode\|Kelompok\|Terikat \/ Tidak Terikat/.test(kepala), kepala);
    const baris = await evalJs("[...document.querySelectorAll('#isi-kategori-donasi .tabel-daftar tbody tr')].map(function(tr){return [...tr.cells].slice(0,4).map(function(td){return td.textContent.trim();}).join('|');})");
    catat("Isi daftar (urut nama): dua kategori baru + Infaq Umum = Tidak Terikat (ada di Preferensi), lainnya Belum diatur", JSON.stringify(baris) === JSON.stringify(["Donasi Masjid|41010103|Wakaf|Belum diatur", "Donasi Sekolah|410102||Belum diatur", "Infaq Umum|41010101|Infaq|Tidak Terikat", "Zakat Fitrah|41010102|Zakat|Belum diatur"]), JSON.stringify(baris));
    catat("Filter Kelompok dan Terikat / Tidak Terikat ada di atas daftar", await evalJs("(function(){var f=[...document.querySelectorAll('#isi-kategori-donasi .pilih-filter')].map(function(s){return s.getAttribute('aria-label');}); return f.join('|')==='Filter Kelompok|Filter Terikat / Tidak Terikat';})()"));
    await evalJs("(function(){var s=document.querySelectorAll('#isi-kategori-donasi .pilih-filter')[1]; s.value='Belum diatur'; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(200);
    catat("Filter 'Belum diatur': Donasi Masjid, Donasi Sekolah, Zakat Fitrah (tanpa Infaq Umum)", (await evalJs("[...document.querySelectorAll('#isi-kategori-donasi .tabel-daftar tbody tr')].map(function(tr){return tr.cells[0].textContent.trim();}).join('|')")) === "Donasi Masjid|Donasi Sekolah|Zakat Fitrah");
    await evalJs("(function(){var s=document.querySelectorAll('#isi-kategori-donasi .pilih-filter')[1]; s.value=''; s.dispatchEvent(new Event('change')); return true;})()"); await tunggu(200);
    await foto("kategori-donasi-daftar.png");
    // 6) Klik baris: formulir berisi data lama, kode tetap
    await klik("#isi-kategori-donasi .tabel-daftar tbody tr:nth-child(3)"); await tunggu(400);
    catat("Klik baris Infaq Umum: formulir berisi nama, induk 410101, kode tetap 41010101, kelompok Infaq, catatan; mulai di tab Umum", await evalJs("document.getElementById('kd-nama').value==='Infaq Umum' && document.getElementById('kd-induk').value==='i2' && document.getElementById('kd-kode').value==='41010101' && document.getElementById('kd-kelompok').value==='Infaq' && document.getElementById('kd-catatan').value==='Kotak amal' && !document.getElementById('sub-kd-umum').hidden"));
    // ===== D1.3 bagian 3b: ubah kategori ikut ke akun =====
    const akunId = (id) => evalJs("JSON.stringify(JSON.parse(localStorage.getItem('daftarAkun')).find(function(a){return a.id==='" + id + "';}))").then(JSON.parse);
    const kdId = (id) => evalJs("JSON.stringify(JSON.parse(localStorage.getItem('daftarKategoriDonasi')).find(function(k){return k.id==='" + id + "';}))").then(JSON.parse);
    const bukaKd = (nama) => evalJs("(function(){modulKategoriDonasi.bukaUbah(modulKategoriDonasi.ambil().find(function(k){return k.nama===" + JSON.stringify(nama) + ";})); return true;})()").then(() => tunggu(300));
    // a) Ganti nama + kelompok (induk tetap): akun ikut berganti nama, kode tetap
    await isi("kd-nama", "Infaq Jumat"); await isi("kd-kelompok", "Infaq Rutin"); await simpan();
    const a1 = await akunId("a1"), k1 = await kdId("kd1");
    catat("Ubah nama Infaq Umum -> Infaq Jumat: kategori tersimpan (kelompok baru, kode tetap 41010101), jumlah kategori tetap 4", k1.nama === "Infaq Jumat" && k1.kelompok === "Infaq Rutin" && k1.kode === "41010101" && (await jumlahKd()) === 4, JSON.stringify(k1));
    catat("Akun 41010101 ikut berganti nama jadi Infaq Jumat; induk dan kode tetap; Kelompok tidak disalin ke akun", a1.nama === "Infaq Jumat" && a1.kode === "41010101" && a1.indukId === "i2" && a1.kelompok === undefined, JSON.stringify(a1));
    catat("Notifikasi berhasil + Log 'Ubah Akun Perkiraan 41010101 Infaq Jumat (dari Kategori Donasi)'", /Kategori Donasi telah berhasil/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Ubah'&&x.tipe==='Akun Perkiraan'&&/41010101 Infaq Jumat \\(dari Kategori Donasi\\)/.test(x.referensi);})"));
    // b) Akun sudah dipakai (ada di Preferensi): Sub dari tidak boleh diganti
    await bersihNotif(); await bukaKd("Infaq Jumat"); await isi("kd-induk", "i1");
    const akunSblmTolak = await evalJs("localStorage.getItem('daftarAkun')"), kdSblmTolak = await evalJs("localStorage.getItem('daftarKategoriDonasi')");
    await simpan();
    catat("Ganti Sub dari pada akun yang sudah dipakai (Preferensi): ditolak dengan alasan, akun dan kategori tidak berubah", /Sub dari tidak bisa diganti.*Preferensi/.test(await evalJs("document.getElementById('galat-kd-induk').hidden ? '' : document.getElementById('galat-kd-induk').textContent")) && (await evalJs("localStorage.getItem('daftarAkun')")) === akunSblmTolak && (await evalJs("localStorage.getItem('daftarKategoriDonasi')")) === kdSblmTolak, await evalJs("document.getElementById('galat-kd-induk').textContent"));
    // c) Akun belum dipakai: Sub dari boleh diganti, kode ikut berganti
    await bersihNotif(); await bukaKd("Zakat Fitrah"); await isi("kd-induk", "i1");
    catat("Pilih induk 4101 saat mengubah Zakat Fitrah: Kode Donasi di formulir jadi 410103", await evalJs("document.getElementById('kd-kode').value") === "410103", await evalJs("document.getElementById('kd-kode').value"));
    await simpan();
    const a2 = await akunId("a2"), k2 = await kdId("kd2");
    catat("Simpan: kategori dan akun a2 pindah ke induk 4101 dengan kode 410103 (keduanya sama)", a2.indukId === "i1" && a2.kode === "410103" && k2.indukId === "i1" && k2.kode === "410103", JSON.stringify([a2, k2]));
    // d) Nama kembar dengan kategori lain ditolak; nama sendiri boleh
    await bersihNotif(); await bukaKd("Zakat Fitrah"); await isi("kd-nama", "donasi masjid"); await simpan();
    catat("Ubah nama jadi nama kategori lain: ditolak 'sudah dipakai kategori lain'", /sudah dipakai kategori lain/.test(await evalJs("document.getElementById('galat-kd-nama').hidden ? '' : document.getElementById('galat-kd-nama').textContent")));
    // e) Hanya Catatan berubah: daftar akun tidak disimpan ulang
    await bersihNotif(); await bukaKd("Donasi Masjid");
    const akunSblmCatatan = await evalJs("localStorage.getItem('daftarAkun')");
    await isi("kd-catatan", "Renovasi atap"); await simpan();
    catat("Ubah Catatan saja: catatan kategori tersimpan, daftar akun tidak berubah sama sekali", (await evalJs("JSON.parse(localStorage.getItem('daftarKategoriDonasi')).find(function(k){return k.nama==='Donasi Masjid';}).catatan")) === "Renovasi atap" && (await evalJs("localStorage.getItem('daftarAkun')")) === akunSblmCatatan);
    // f) Gagal menyimpan kategori saat mengubah: akun dikembalikan
    await bersihNotif(); await bukaKd("Zakat Fitrah");
    const akunSblmGagal = await evalJs("localStorage.getItem('daftarAkun')");
    await evalJs("window.__simpanAsli = modulKategoriDonasi.simpan; modulKategoriDonasi.simpan = function(){ return false; }; true");
    await isi("kd-nama", "Zakat Mal"); await simpan();
    await evalJs("modulKategoriDonasi.simpan = window.__simpanAsli; true");
    catat("Kategori gagal disimpan saat mengubah: nama akun dikembalikan seperti semula", (await evalJs("localStorage.getItem('daftarAkun')")) === akunSblmGagal);
    // g) Data rusak: akun kategori hilang -> ditolak dengan pesan, tidak macet
    await bersihNotif();
    await evalJs("(function(){var d=JSON.parse(localStorage.getItem('daftarKategoriDonasi')); d.push({id:'kdx',nama:'Yatim',indukId:'i2',akunId:'hilang',kode:'41010199',kelompok:'',catatan:''}); localStorage.setItem('daftarKategoriDonasi', JSON.stringify(d)); return true;})()");
    await bukaKd("Yatim"); await isi("kd-induk", "i2"); await simpan();
    catat("Akun kategori sudah hilang (data rusak): simpan ditolak dengan pesan 'tidak ditemukan', tidak macet", /tidak ditemukan/.test(await evalJs("document.getElementById('area-notifikasi').textContent")));
    await evalJs("(function(){localStorage.setItem('daftarKategoriDonasi', JSON.stringify(JSON.parse(localStorage.getItem('daftarKategoriDonasi')).filter(function(k){return k.id!=='kdx';}))); modulKategoriDonasi.bukaBaru(); return true;})()");
    // ===== D1.3 bagian 3a: akun milik Kategori Donasi terkunci di Akun Perkiraan =====
    await bersihNotif();
    const akunSblmKunci = await evalJs("localStorage.getItem('daftarAkun')");
    await evalJs("bukaAkunBaru(); modulAkun.bukaUbah(modulAkun.ambil().find(function(a){return a.id==='a1';})); true"); await tunggu(400);
    await evalJs("document.getElementById('form-akun').requestSubmit(); true"); await tunggu(300);
    catat("Akun Perkiraan: Simpan akun 41010101 (milik Kategori Donasi) ditolak dengan pesan arahan ke Kategori Donasi, data tidak berubah", /dibuat oleh Kategori Donasi/.test(await evalJs("document.getElementById('galat-akun-nama').hidden ? '' : document.getElementById('galat-akun-nama').textContent")) && (await evalJs("localStorage.getItem('daftarAkun')")) === akunSblmKunci);
    await evalJs("modulAkun.hapus(modulAkun.ambil().find(function(a){return a.id==='a1';})); true"); await tunggu(300);
    catat("Akun Perkiraan: Hapus akun itu ditolak dengan pesan yang sama, tanpa popup konfirmasi", /dibuat oleh Kategori Donasi/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && (await evalJs("localStorage.getItem('daftarAkun')")) === akunSblmKunci);
    await bersihNotif();
    await evalJs("bukaAkunBaru(); var t=document.getElementById('akun-tipe'); t.value='pendapatan'; t.dispatchEvent(new Event('change')); true"); await tunggu(200);
    const calonAkun = await evalJs("calonIndukAkun.map(function(a){return a.kode;}).join('|')");
    catat("Akun baru bertipe Pendapatan: akun milik Kategori Donasi (41010101, 410102) tidak ditawarkan sebagai induk", calonAkun === "4101|410101", calonAkun);
    // Kategori hilang (data rusak): akunnya tidak terkunci selamanya
    catat("Kalau kategorinya sudah tidak ada, akun tidak dianggap terkunci", await evalJs("!akunMilikKategoriDonasi({id:'tidak-ada'}) && !akunMilikKategoriDonasi(null)"));
    // ===== D1.3 bagian 3c: hapus kategori ikut ke akun dan Preferensi =====
    const hapusKd = (nama) => evalJs("(function(){modulKategoriDonasi.hapus(modulKategoriDonasi.ambil().find(function(k){return k.nama===" + JSON.stringify(nama) + ";})); return true;})()").then(() => tunggu(300));
    const dialogTerbuka = () => evalJs("dialogKonfirmasi.open");
    const adaAkunKode = (kode) => evalJs("JSON.parse(localStorage.getItem('daftarAkun')).some(function(a){return a.kode==='" + kode + "';})");
    // a) Akun sudah ada di jurnal: ditolak, tanpa konfirmasi
    await bersihNotif();
    await evalJs("(function(){var a=JSON.parse(localStorage.getItem('daftarAkun')).find(function(x){return x.kode==='41010103';}); localStorage.setItem('daftarJurnal', JSON.stringify([{id:'j1',nomor:'JU-1',tanggal:'2026-10-27',rincian:[{akunId:a.id,debit:0,kredit:1000},{akunId:'b1',debit:1000,kredit:0}]}])); return true;})()");
    await hapusKd("Donasi Masjid");
    catat("Hapus Donasi Masjid (akunnya ada di jurnal): ditolak 'tidak bisa dihapus ... Jurnal Umum', tanpa popup konfirmasi, data tetap", /tidak bisa dihapus karena akunnya sudah dipakai di Jurnal Umum/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && !(await dialogTerbuka()) && (await jumlahKd()) === 4 && await adaAkunKode("41010103"), await evalJs("document.getElementById('area-notifikasi').textContent"));
    // b) Akun hanya di Preferensi: konfirmasi, lalu kategori + akun terhapus, kode keluar dari Preferensi (tersimpan dan salinan kerja)
    await bersihNotif();
    await evalJs("(function(){var p=JSON.parse(localStorage.getItem('akunPerkiraanYayasan')); p.pendapatanLain=['41010101','5101']; localStorage.setItem('akunPerkiraanYayasan', JSON.stringify(p)); pilihanAkun.pendapatanLain=['41010101','5101']; pilihanAkun.donasiTidakTerikat=['41010101']; return true;})()");
    await hapusKd("Infaq Jumat");
    catat("Hapus Infaq Jumat (akun hanya di Preferensi): muncul popup konfirmasi", await dialogTerbuka());
    await evalJs("document.getElementById('ya-konfirmasi').click(); true"); await tunggu(400);
    catat("Ya, Hapus: kategori Infaq Jumat dan akun 41010101 terhapus; notifikasi 'telah dihapus'", (await jumlahKd()) === 3 && !(await adaAkunKode("41010101")) && /Kategori Donasi telah dihapus/.test(await evalJs("document.getElementById('area-notifikasi').textContent")));
    const pref = await evalJs("localStorage.getItem('akunPerkiraanYayasan')").then(JSON.parse);
    catat("Kode 41010101 keluar dari semua kolom Preferensi; kode lain (5101) tetap", pref.donasiTidakTerikat.indexOf("41010101") === -1 && JSON.stringify(pref.pendapatanLain) === '["5101"]', JSON.stringify(pref));
    catat("Salinan kerja halaman Preferensi ikut bersih (Simpan Preferensi tidak memasukkan kode itu lagi)", await evalJs("pilihanAkun.donasiTidakTerikat.indexOf('41010101')===-1 && JSON.stringify(pilihanAkun.pendapatanLain)==='[\"5101\"]'"));
    catat("Log: 'Hapus Kategori Donasi', 'Hapus Akun Perkiraan 41010101 Infaq Jumat (dari Kategori Donasi)', 'Ubah Preferensi'", await evalJs("(function(){var l=JSON.parse(localStorage.getItem('logAktivitas')||'[]'); return l.some(function(x){return x.tindakan==='Hapus'&&x.tipe==='Kategori Donasi'&&x.referensi==='Infaq Jumat';}) && l.some(function(x){return x.tindakan==='Hapus'&&x.tipe==='Akun Perkiraan'&&/41010101 Infaq Jumat \\(dari Kategori Donasi\\)/.test(x.referensi);}) && l.some(function(x){return x.tipe==='Preferensi'&&/41010101 dikeluarkan/.test(x.referensi);});})()"));
    // c) Batal di popup: tidak ada yang terhapus
    await bersihNotif(); await hapusKd("Zakat Fitrah");
    await evalJs("document.getElementById('batal-konfirmasi').click(); true"); await tunggu(200);
    catat("Batal di popup konfirmasi: Zakat Fitrah dan akunnya tetap ada", (await jumlahKd()) === 3 && await adaAkunKode("410103"));
    // d) Data rusak: akun kategori hilang -> kategori tetap bisa dihapus, tidak macet
    await evalJs("(function(){var d=JSON.parse(localStorage.getItem('daftarKategoriDonasi')); d.push({id:'kdx',nama:'Yatim',indukId:'i2',akunId:'hilang',kode:'41010199',kelompok:'',catatan:''}); localStorage.setItem('daftarKategoriDonasi', JSON.stringify(d)); return true;})()");
    const akunSblmYatim = await evalJs("localStorage.getItem('daftarAkun')");
    await hapusKd("Yatim"); await evalJs("document.getElementById('ya-konfirmasi').click(); true"); await tunggu(300);
    catat("Kategori yang akunnya sudah hilang: tetap bisa dihapus, daftar akun tidak berubah", (await jumlahKd()) === 3 && (await evalJs("localStorage.getItem('daftarAkun')")) === akunSblmYatim);
    await bersihNotif(); await evalJs("modulKategoriDonasi.bukaBaru(); true");
    // 7) Lebar HP
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await tunggu(400);
    await foto("kategori-donasi-390.png");
    catat("Lebar HP 390: formulir Kategori Donasi tidak melebar keluar layar", await evalJs("document.getElementById('form-kategori-donasi').getBoundingClientRect().right <= 390"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
