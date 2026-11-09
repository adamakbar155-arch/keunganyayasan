// Uji Target Donasi (D1.6) di Chrome asli. Pemakaian: node uji-chrome-target-donasi.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9385;
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
    // ===== D1.6 bagian 1: Target Donasi, formulir dan simpan (PRD 6.1) =====
    // Data contoh (bukan data asli): dua Program berjalan, satu Program Selesai
    await evalJs(`(function(){ localStorage.clear();
      localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'}]));
      localStorage.setItem('daftarProgram', JSON.stringify([{id:'p1',nama:'Beasiswa',divisiId:'d1',status:'aktif'},{id:'p2',nama:'Program Lama',divisiId:'d1',status:'selesai'},{id:'p3',nama:'Qurban',divisiId:'d1',status:'aktif'}]));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const hariIni = await evalJs("tanggalHariIni()");
    const isi = (id, nilai) => evalJs("(function(){var e=document.getElementById('" + id + "'); e.value=" + JSON.stringify(nilai) + "; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return true;})()");
    const galatTeks = (n) => evalJs("document.getElementById('galat-td-" + n + "').hidden ? '' : document.getElementById('galat-td-" + n + "').textContent");
    const bersihNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    const simpan = async () => { await bersihNotif(); await evalJs("document.getElementById('form-target-donasi').requestSubmit(); true"); await tunggu(400); };
    const dataTd = () => evalJs("localStorage.getItem('daftarTargetDonasi')||'[]'").then(JSON.parse);
    // 1) Buka dari popup Donasi
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Target Donasi"]'); await tunggu(500);
    catat("Popup Donasi > Target Donasi: tab 'Target Donasi' terbuka di Data Baru, kursor di Nama Target", await evalJs("!document.getElementById('isi-target-donasi').hidden && !document.getElementById('tab-target-donasi').hidden && document.activeElement.id==='td-nama'"));
    catat("Isian: Nama Target*, Program*, Periode* (mulai s/d selesai), Nilai Target*, Catatan", await evalJs("(function(){var t=document.getElementById('form-target-donasi').textContent; return /Nama Target/.test(t)&&/Program/.test(t)&&/Periode/.test(t)&&/s\\/d/.test(t)&&/Nilai Target/.test(t)&&/Catatan/.test(t) && document.querySelectorAll('#form-target-donasi .wajib').length===4;})()"));
    catat("Data Baru: tanggal mulai dan selesai kosong, Nilai kosong (PRD 5.3a)", await evalJs("document.getElementById('td-mulai').value==='' && document.getElementById('td-selesai').value==='' && document.getElementById('td-nilai').value===''"));
    catat("Kolom tanggal memakai kalender aplikasi; Program memakai kolom pilihan berlabel", await evalJs("!!document.querySelector('#isi-target-donasi .periode-td .grup-tanggal button, #isi-target-donasi .periode-td .grup-tanggal [class*=kalender]') && !!document.getElementById('td-program').closest('.baris-form').querySelector('.pemilih-opsi')"));
    const opsi = await evalJs("[...document.getElementById('td-program').options].map(function(o){return o.textContent;}).join('|')");
    catat("Pilihan Program hanya yang berjalan: Beasiswa dan Qurban (Program Lama yang Selesai tidak ada)", opsi === "Pilih Program...|Beasiswa|Qurban", opsi);
    // 2) Titik ribuan saat mengetik
    await klik("#td-nilai"); await kirim("Input.insertText", { text: "50000000" }); await tunggu(150);
    catat("Nilai Target diketik 50000000: langsung tampil 50.000.000", await evalJs("document.getElementById('td-nilai').value==='50.000.000'"), await evalJs("document.getElementById('td-nilai').value"));
    await isi("td-nilai", "");
    await foto("target-donasi-form.png");
    // 3) Pemeriksaan satu per satu
    await simpan();
    catat("Simpan tanpa Nama: ditolak 'Nama Target wajib diisi', kursor di Nama, tidak tersimpan", /Nama Target wajib diisi/.test(await galatTeks("nama")) && (await dataTd()).length === 0);
    await isi("td-nama", "Beasiswa 2026"); await simpan();
    catat("Tanpa Program: ditolak 'Program wajib dipilih'", /Program wajib dipilih/.test(await galatTeks("program")));
    await evalJs("(function(){var s=document.getElementById('td-program'); s.value='p1'; s.dispatchEvent(new Event('change')); return true;})()");
    await simpan();
    catat("Tanggal selesai kosong: ditolak 'wajib diisi', kursor di tanggal selesai", /tanggal selesai wajib diisi/.test(await galatTeks("periode")));
    await isi("td-mulai", "2026-12-31"); await isi("td-selesai", "2026-01-01"); await simpan();
    catat("Tanggal selesai sebelum tanggal mulai: ditolak", /tidak boleh sebelum tanggal mulai/.test(await galatTeks("periode")));
    await isi("td-mulai", "2026-01-01"); await isi("td-selesai", "2026-12-31"); await simpan();
    catat("Nilai kosong: ditolak 'Nilai Target wajib diisi dan lebih dari 0'", /Nilai Target wajib diisi dan lebih dari 0/.test(await galatTeks("nilai")) && (await dataTd()).length === 0);
    await isi("td-nilai", "50.000.000"); await isi("td-catatan", "  Untuk 100 santri  "); await simpan();
    const t1 = (await dataTd())[0] || {};
    catat("Simpan berhasil: tersimpan {nama, programId p1, mulai, selesai, nilai 50000000, catatan tanpa spasi tepi}", (await dataTd()).length === 1 && t1.nama === "Beasiswa 2026" && t1.programId === "p1" && t1.mulai === "2026-01-01" && t1.selesai === "2026-12-31" && t1.nilai === 50000000 && t1.catatan === "Untuk 100 santri", JSON.stringify(t1));
    catat("Notifikasi berhasil + Log 'Buat Target Donasi'", /Target Donasi telah berhasil disimpan/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Buat'&&x.tipe==='Target Donasi';})"));
    catat("Formulir kosong lagi untuk target berikutnya", await evalJs("document.getElementById('td-nama').value==='' && document.getElementById('td-program').value==='' && document.getElementById('td-mulai').value===''"));
    // 4) Program Selesai tidak bisa dipilih untuk target baru (walaupun dipaksa lewat kode)
    await evalJs(`(function(){ var s=document.getElementById('td-program'); var o=document.createElement('option'); o.value='p2'; o.textContent='Program Lama'; s.appendChild(o); s.value='p2'; return true; })()`);
    await isi("td-nama", "Coba Lama"); await isi("td-selesai", "2026-12-31"); await isi("td-nilai", "1000"); await simpan();
    catat("Target baru dengan Program yang sudah Selesai: ditolak 'sudah tidak berjalan'", /sudah tidak berjalan/.test(await galatTeks("program")) && (await dataTd()).length === 1);
    // 5) Daftar dan Status (Belum Mulai / Berjalan / Selesai)
    await evalJs(`(function(){ var a=JSON.parse(localStorage.getItem('daftarTargetDonasi'));
      a.push({id:'tl',nama:'Target Lalu',programId:'p2',mulai:'2020-01-01',selesai:'2020-12-31',nilai:1000,catatan:''});
      a.push({id:'tn',nama:'Target Nanti',programId:'p3',mulai:'2099-01-01',selesai:'2099-12-31',nilai:2500000,catatan:''});
      a.push({id:'tj',nama:'Kini <img src=x onerror=alert(1)>',programId:'p3',mulai:'2000-01-01',selesai:'2099-12-31',nilai:75000,catatan:''});
      localStorage.setItem('daftarTargetDonasi', JSON.stringify(a)); return true; })()`);
    await klik("#isi-target-donasi .tombol-daftar"); await tunggu(400);
    const kepala = await evalJs("[...document.querySelectorAll('#isi-target-donasi .tabel-daftar thead th')].map(function(th){return th.textContent.trim();}).filter(Boolean).join('|')");
    catat("Daftar: kolom Nama Target, Program, Periode, Status, Target, Terkumpul, Sisa, Capaian", /^Nama Target\|Program\|Periode\|Status\|Target\|Terkumpul\|Sisa\|Capaian/.test(kepala), kepala);
    // ===== D1.6 bagian 2: pilihan Tampilkan =====
    const filterTd = () => evalJs("[...document.querySelectorAll('#isi-target-donasi .pilih-filter')].map(function(s){return s.options[s.selectedIndex] ? s.options[s.selectedIndex].textContent : '';}).join('|')");
    const namaTampil = () => evalJs("[...document.querySelectorAll('#isi-target-donasi .tabel-daftar tbody tr')].map(function(tr){return tr.cells[0].textContent.trim();}).sort().join('|')");
    catat("Filter di atas daftar: Tampilkan (awal 'Yang masih berjalan'), Program, Status", (await filterTd()) === "Tampilkan: Yang masih berjalan|Program: Semua|Status: Semua", await filterTd());
    const awalTampil = await namaTampil();
    catat("Tampilkan 'Yang masih berjalan': Target Lalu (Program Selesai + periode lewat) tidak tampil; Beasiswa 2026, Kini, Target Nanti tampil", !/Target Lalu/.test(awalTampil) && /Beasiswa 2026/.test(awalTampil) && /Target Nanti/.test(awalTampil) && /Kini/.test(awalTampil), awalTampil);
    const pilihFilter = (i, nilai) => evalJs("(function(){var s=document.querySelectorAll('#isi-target-donasi .pilih-filter')[" + i + "]; s.value=" + JSON.stringify(nilai) + "; s.dispatchEvent(new Event('change')); return true;})()").then(() => tunggu(200));
    await pilihFilter(0, "");
    catat("Tampilkan 'Semua': keempat target tampil", (await namaTampil()).split("|").length === 4, await namaTampil());
    const baris = await evalJs("[...document.querySelectorAll('#isi-target-donasi .tabel-daftar tbody tr')].map(function(tr){return [...tr.cells].slice(0,5).map(function(td){return td.textContent.trim();}).join('|');})");
    const cari = (awal) => baris.find(b => b.startsWith(awal)) || "";
    catat("Baris Target Lalu: Program Lama (Selesai tetap tampil namanya), Periode '1 Jan 2020 - 31 Des 2020', Status Selesai, Target 1.000", cari("Target Lalu") === "Target Lalu|Program Lama|1 Jan 2020 - 31 Des 2020|Selesai|1.000", JSON.stringify(baris));
    catat("Baris Target Nanti: Status Belum Mulai, Target 2.500.000 rata kanan", cari("Target Nanti") === "Target Nanti|Qurban|1 Jan 2099 - 31 Des 2099|Belum Mulai|2.500.000" && await evalJs("(function(){var tr=[...document.querySelectorAll('#isi-target-donasi .tabel-daftar tbody tr')].find(function(t){return /Target Nanti/.test(t.textContent);}); return getComputedStyle(tr.cells[4]).textAlign==='right';})()"), JSON.stringify(baris));
    catat("Baris yang periodenya mencakup hari ini: Status Berjalan", /\|Berjalan\|75\.000$/.test(cari("Kini")), JSON.stringify(baris));
    catat("Nama berisi kode HTML tampil sebagai teks biasa (tidak dijalankan)", await evalJs("!document.querySelector('#isi-target-donasi .tabel-daftar tbody img')"));
    catat("Kolom Status berupa label berwarna (Berjalan biru, Selesai abu-abu, Belum Mulai kuning)", await evalJs("(function(){var w=function(t){var s=[...document.querySelectorAll('#isi-target-donasi .status-td')].find(function(x){return x.textContent===t;}); return s?getComputedStyle(s).backgroundColor:'';}; var a=w('Berjalan'),b=w('Selesai'),c=w('Belum Mulai'); return !!a&&!!b&&!!c&&a!==b&&b!==c&&a!==c;})()"));
    // Pilihan Tampilkan lain: Program sengaja diubah jadi Selesai -> targetnya ikut tersembunyi walaupun periodenya belum lewat
    await pilihFilter(0, "berjalan");
    await evalJs("(function(){var a=JSON.parse(localStorage.getItem('daftarProgram')); a.forEach(function(p){ if(p.id==='p3') p.status='selesai'; }); localStorage.setItem('daftarProgram', JSON.stringify(a)); modulProgram.ambil && true; saatTabDibuka['target-donasi'](); return true;})()"); await tunggu(200);
    const tampilQ = await namaTampil();
    catat("Program Qurban diubah Selesai: target Qurban (Kini, Target Nanti) ikut tersembunyi di 'Yang masih berjalan'; Beasiswa 2026 tetap", tampilQ === "Beasiswa 2026", tampilQ);
    await evalJs("(function(){var a=JSON.parse(localStorage.getItem('daftarProgram')); a.forEach(function(p){ if(p.id==='p3') p.status='aktif'; }); localStorage.setItem('daftarProgram', JSON.stringify(a)); saatTabDibuka['target-donasi'](); return true;})()"); await tunggu(200);
    await pilihFilter(0, "");
    // ===== D1.6 bagian 2: Terkumpul, Sisa, Capaian dari Pencatatan Donasi (per BARIS rincian, Program sama, dalam periode) =====
    await evalJs(`(function(){ localStorage.setItem('daftarDonasi', JSON.stringify([
        {id:'x1',nomor:'DN-1',tanggal:'2026-03-10',donaturId:'dn',total:40000000,rincian:[{nilai:30000000,programId:'p1'},{nilai:10000000,programId:'p3'}]},
        {id:'x2',nomor:'DN-2',tanggal:'2026-01-01',donaturId:'dn',total:2000000,rincian:[{nilai:2000000,programId:'p1'}]},
        {id:'x3',nomor:'DN-3',tanggal:'2026-12-31',donaturId:'dn',total:'500000',rincian:[{nilai:'500000',programId:'p1'}]},
        {id:'x4',nomor:'DN-4',tanggal:'2025-12-31',donaturId:'dn',total:9000000,rincian:[{nilai:9000000,programId:'p1'}]},
        {id:'x5',nomor:'DN-5',tanggal:'2027-01-01',donaturId:'dn',total:9000000,rincian:[{nilai:9000000,programId:'p1'}]},
        {id:'x6',nomor:'DN-6',tanggal:'2026-05-05',donaturId:'dn',total:7000,rincian:[{nilai:7000,programId:''}]},
        {id:'x7',nomor:'DN-7',tanggal:'2026-05-05',rincian:'rusak'}, null])); return true; })()`);
    await evalJs("saatTabDibuka['target-donasi'](); true"); await tunggu(300);
    const selTd = (nama) => evalJs("(function(){var tr=[...document.querySelectorAll('#isi-target-donasi .tabel-daftar tbody tr')].find(function(t){return t.cells[0].textContent.trim()===" + JSON.stringify(nama) + ";}); return tr ? [...tr.cells].slice(4).map(function(td){return td.textContent.trim();}).join('|') : '';})()");
    const sBea = await selTd("Beasiswa 2026");
    catat("Beasiswa 2026 (p1, 1 Jan - 31 Des 2026, target 50.000.000): Terkumpul 32.500.000 (baris p1 di 1 Jan, 10 Mar, 31 Des; tanggal di luar periode, baris Program lain, dan data rusak tidak ikut), Sisa 17.500.000, Capaian 65%", sBea === "50.000.000|32.500.000|17.500.000|65%", sBea);
    const sKini = await selTd("Kini <img src=x onerror=alert(1)>");
    catat("Kini (p3, target 75.000): Terkumpul 10.000.000 melebihi target -> Sisa 0, Capaian berhenti di 100% dengan ✓, Terkumpul tetap angka sebenarnya", sKini === "75.000|10.000.000|0|100% ✓", sKini);
    catat("Capaian tercapai berwarna hijau; yang belum biru; lebar bar sesuai persen (65% dan 100%)", await evalJs("(function(){var bar=[...document.querySelectorAll('#isi-target-donasi .capaian-td')]; var hijau=bar.filter(function(b){return b.classList.contains('tercapai');}); var w=function(b){return b.querySelector('.capaian-td-bar span').style.width;}; var bea=bar.find(function(b){return /65%/.test(b.textContent);}); return hijau.length===1 && /100%/.test(hijau[0].textContent) && w(hijau[0])==='100%' && !!bea && w(bea)==='65%' && getComputedStyle(hijau[0].querySelector('.capaian-td-bar span')).backgroundColor!==getComputedStyle(bea.querySelector('.capaian-td-bar span')).backgroundColor;})()"));
    catat("Target Nanti (2099): Terkumpul 0, Sisa = target, Capaian 0%", (await selTd("Target Nanti")) === "2.500.000|0|2.500.000|0%", await selTd("Target Nanti"));
    // Urutkan menurut Capaian (klik judul kolom): 0% paling atas
    await evalJs("(function(){var th=[...document.querySelectorAll('#isi-target-donasi .tabel-daftar thead th')].find(function(t){return /Capaian/.test(t.textContent);}); (th.querySelector('button')||th).click(); return true;})()"); await tunggu(200);
    const urutC = await evalJs("[...document.querySelectorAll('#isi-target-donasi .tabel-daftar tbody tr')].map(function(tr){return tr.cells[7].textContent.trim();}).join('|')");
    catat("Urut menurut Capaian: 0% ... 100% (bukan urutan teks '100' < '65')", /^0%\|0%\|65%\|100% ✓$/.test(urutC), urutC);
    // Filter Status dan Program
    await pilihFilter(2, "Belum Mulai");
    catat("Filter Status 'Belum Mulai': hanya Target Nanti", (await namaTampil()) === "Target Nanti", await namaTampil());
    await pilihFilter(2, ""); await pilihFilter(1, "Beasiswa");
    catat("Filter Program 'Beasiswa': hanya Beasiswa 2026", (await namaTampil()) === "Beasiswa 2026", await namaTampil());
    await pilihFilter(1, "");
    // Unduh CSV memakai teks kolom (Capaian '65%'), bukan isi gambar bar
    await evalJs("(function(){ window.__csv=null; var asli=window.unduhCsv; window.unduhCsv=function(n,b){ window.__csv=b; }; document.querySelector('#isi-target-donasi [data-alat=\"ekspor\"]').click(); window.unduhCsv=asli; return true; })()"); await tunggu(200);
    const csv = await evalJs("JSON.stringify(window.__csv)");
    catat("Unduh CSV: kolom Terkumpul, Sisa, Capaian berisi teks ('65%', bukan kode HTML)", /"Capaian"/.test(csv) && /"65%"/.test(csv) && !/<span|<div/.test(csv), (csv || "").slice(0, 200));
    // Donasi baru dicatat lalu tab dibuka lagi: Terkumpul ikut berubah
    await evalJs(`(function(){ var a=JSON.parse(localStorage.getItem('daftarDonasi')); a.push({id:'x8',nomor:'DN-8',tanggal:'2026-06-01',donaturId:'dn',total:17500000,rincian:[{nilai:17500000,programId:'p1'}]}); localStorage.setItem('daftarDonasi', JSON.stringify(a)); saatTabDibuka['target-donasi'](); return true; })()`); await tunggu(300);
    catat("Donasi baru 17.500.000 untuk Beasiswa: Beasiswa 2026 langsung tercapai (Terkumpul 50.000.000, Sisa 0, 100% ✓)", (await selTd("Beasiswa 2026")) === "50.000.000|50.000.000|0|100% ✓", await selTd("Beasiswa 2026"));
    await foto("target-donasi-daftar.png");
    // Data donasi rusak: daftar tetap tampil, Terkumpul 0
    await evalJs("localStorage.setItem('daftarDonasi','{rusak'); saatTabDibuka['target-donasi'](); true"); await tunggu(200);
    catat("Data Pencatatan Donasi rusak: daftar Target tetap tampil, Terkumpul 0, Capaian 0%", (await selTd("Beasiswa 2026")) === "50.000.000|0|50.000.000|0%", await selTd("Beasiswa 2026"));
    await evalJs("localStorage.removeItem('daftarDonasi'); true");
    // Program yang dipakai target tidak bisa dihapus di Master Data
    await bersihNotif();
    await evalJs("(function(){modulProgram.hapus(modulProgram.ambil().find(function(p){return p.id==='p3';})); return true;})()"); await tunggu(300);
    catat("Master Data: hapus Program Qurban (dipakai 2 Target Donasi) ditolak dengan pesan, tanpa konfirmasi", /sudah dipakai di 2 Target Donasi/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && !(await evalJs("dialogKonfirmasi.open")) && await evalJs("modulProgram.ambil().some(function(p){return p.id==='p3';})"));
    await bersihNotif();
    // 6) Ubah: target dengan Program yang sudah Selesai tetap bisa dibuka dan disimpan (Program lamanya tetap ada di pilihan)
    await evalJs("(function(){modulTargetDonasi.bukaUbah(modulTargetDonasi.ambil().find(function(t){return t.id==='tl';})); return true;})()"); await tunggu(300);
    catat("Buka Target Lalu: isian terisi, Program Lama tetap terpilih walaupun Selesai, Nilai 1.000", await evalJs("document.getElementById('td-nama').value==='Target Lalu' && document.getElementById('td-program').value==='p2' && document.getElementById('td-mulai').value==='2020-01-01' && document.getElementById('td-nilai').value==='1.000'"));
    await isi("td-nilai", "2.000"); await simpan();
    const tl = (await dataTd()).find(t => t.id === "tl") || {};
    catat("Ubah Nilai 1.000 -> 2.000: tersimpan di data yang sama, Program lama tetap; Log 'Ubah' mencatat nilai lama dan baru", tl.nilai === 2000 && tl.programId === "p2" && (await dataTd()).length === 4 && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){var s=JSON.stringify(x); return x.tindakan==='Ubah'&&x.tipe==='Target Donasi'&&s.indexOf('Rp 1.000')!==-1&&s.indexOf('Rp 2.000')!==-1;})"), JSON.stringify(tl));
    // 7) Hapus lewat konfirmasi
    await bersihNotif();
    await evalJs("(function(){modulTargetDonasi.hapus(modulTargetDonasi.ambil().find(function(t){return t.id==='tn';})); return true;})()"); await tunggu(300);
    catat("Hapus target: muncul popup konfirmasi", await evalJs("dialogKonfirmasi.open"));
    await evalJs("document.getElementById('ya-konfirmasi').click(); true"); await tunggu(400);
    catat("Ya, Hapus: Target Nanti terhapus, Log 'Hapus Target Donasi'", !(await dataTd()).some(t => t.id === "tn") && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Hapus'&&x.tipe==='Target Donasi'&&x.referensi==='Target Nanti';})"));
    // 8) Data rusak tidak membuat macet
    await evalJs("localStorage.setItem('daftarTargetDonasi','{rusak'); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Target Donasi"]'); await tunggu(400);
    await klik("#isi-target-donasi .tombol-daftar"); await tunggu(300);
    catat("Data Target Donasi rusak: halaman tetap terbuka, daftar kosong dengan pesan", /Belum ada target donasi/.test(await evalJs("document.getElementById('isi-target-donasi').textContent")));
    // 9) Lebar HP
    await klik("#isi-target-donasi .tombol-daftar"); await tunggu(300);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await tunggu(400);
    await foto("target-donasi-390.png");
    catat("Lebar HP 390: formulir Target Donasi tidak melebar keluar layar", await evalJs("document.getElementById('form-target-donasi').getBoundingClientRect().right <= 390"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
