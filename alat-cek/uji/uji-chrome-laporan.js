// Uji menu Laporan (PRD 7, tugas I.1) di Chrome asli: buka dari ikon menu samping, kategori, kartu, label Accurate,
// kartu ringkasan/rincian, Impor hanya di Laporan Tersimpan, pencarian lintas kategori, layar HP, tutup dan buka lagi.
// Juga jendela Parameter Laporan (tugas I.1g-1): isi awal, pilih beberapa Divisi/Program, lepas label, cek tanggal,
// Tampilkan, isi kembali ke awal saat dibuka lagi, klik latar, layar HP.
// Pemakaian: node uji-chrome-laporan.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9389;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
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
    await tunggu(800);
    // Data contoh untuk Parameter Laporan: dua Divisi, satu Divisi bernama kode HTML, satu Program yang sudah Selesai
    await evalJs("localStorage.clear(); localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'},{id:'d2',nama:'Kesehatan'},{id:'d3',nama:'<img src=x onerror=alert(1)>'}])); localStorage.setItem('daftarProgram', JSON.stringify([{id:'p1',nama:'Beasiswa',divisiId:'d1',status:'selesai'}])); localStorage.setItem('dataYayasan', JSON.stringify({nama:'Yayasan Contoh <b>Peduli</b>'})); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const ketik = (x) => kirim("Input.insertText", { text: x });
    const notif = () => evalJs("document.getElementById('area-notifikasi').textContent");
    const bersihNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    const kartu = () => evalJs("[...document.querySelectorAll('#lap-isi .lap-kartu')].map(function(k){return k.querySelector('.lap-kartu-nama').textContent;})");
    const judulKelompok = () => evalJs("[...document.querySelectorAll('#lap-isi .lap-kelompok h3')].map(function(h){return h.textContent;})");
    const klikKategori = async (nama) => { const i = await evalJs("[...document.querySelectorAll('#lap-kategori .lap-kat')].findIndex(function(b){return b.textContent.trim()===" + JSON.stringify(nama) + ";})"); await klik("#lap-kategori .lap-kat:nth-child(" + (i + 1) + ")"); await tunggu(200); };

    // 1) Buka dari ikon Laporan di menu samping
    await klik("#tombol-laporan"); await tunggu(400);
    catat("Ikon Laporan: tab 'Laporan' terbuka dan tampil", await evalJs("!document.getElementById('tab-laporan').hidden && document.getElementById('tab-laporan').classList.contains('aktif') && !document.getElementById('isi-laporan').hidden"));
    const kat = await evalJs("[...document.querySelectorAll('#lap-kategori .lap-kat')].map(function(b){return b.textContent.trim();}).join('|')");
    catat("Kategori kiri berurutan: Laporan Tersimpan, Keuangan, Divisi & Program, Kas & Bank, Donasi, Buku Besar, Aset Tetap", kat === "Laporan Tersimpan|Keuangan|Divisi & Program|Kas & Bank|Donasi|Buku Besar|Aset Tetap", kat);
    catat("Awalnya di Laporan Tersimpan (seperti Accurate): kategori itu aktif, judul 'Laporan Tersimpan', tombol Impor tampil, pesan belum ada laporan tersimpan", await evalJs("document.querySelector('#lap-kategori .lap-kat.aktif').textContent.trim()==='Laporan Tersimpan' && document.getElementById('lap-judul').textContent==='Laporan Tersimpan' && !document.getElementById('lap-impor').hidden && /Belum ada laporan tersimpan/.test(document.getElementById('lap-isi').textContent)"));
    catat("Tombol Ekspor tampil bersama Impor di Laporan Tersimpan", await evalJs("!document.getElementById('lap-ekspor').hidden"));
    await foto("laporan-tersimpan.png");

    // 2) Keuangan: 4 laporan ISAK 35 dengan label nama Accurate
    await klikKategori("Keuangan");
    catat("Keuangan: judul 'Keuangan', Impor tersembunyi, kelompok 'Laporan Keuangan Yayasan (ISAK 35)'", await evalJs("document.getElementById('lap-judul').textContent==='Keuangan' && document.getElementById('lap-impor').hidden") && JSON.stringify(await judulKelompok()) === JSON.stringify(["Laporan Keuangan Yayasan (ISAK 35)"]), JSON.stringify(await judulKelompok()));
    const kk = await kartu();
    catat("5 kartu: Posisi Keuangan (Neraca), Penghasilan Komprehensif (Laba Rugi), Perubahan Aset Neto (Perubahan Modal), Arus Kas, Perbandingan Anggaran", JSON.stringify(kk) === JSON.stringify(["Laporan Posisi KeuanganNeraca", "Laporan Penghasilan KomprehensifLaba Rugi", "Laporan Perubahan Aset NetoPerubahan Modal", "Laporan Arus Kas", "Laporan Penghasilan (Perbandingan Anggaran)Laba Rugi (Perbandingan Anggaran)"]), JSON.stringify(kk));
    catat("Kartu Keuangan semuanya biru (ringkasan) dan dua kolom di layar lebar", await evalJs("[...document.querySelectorAll('#lap-isi .lap-kartu')].every(function(k){return k.classList.contains('ringkasan');}) && getComputedStyle(document.querySelector('.lap-kisi')).gridTemplateColumns.split(' ').length===2"));
    await bersihNotif(); await klik("#lap-isi .lap-kartu:nth-child(4)"); await tunggu(250);
    catat("Klik kartu Arus Kas: jendela Parameter tanpa Divisi dan Program (baris Kas/Bank tidak bertanda)", await evalJs("document.getElementById('dialog-parameter-laporan').open && document.getElementById('param-baris-divisi').hidden && document.getElementById('param-baris-program').hidden && !document.getElementById('param-kotak-centang').hidden"));
    await evalJs("document.getElementById('dialog-parameter-laporan').close(); true");
    await foto("laporan-keuangan.png");

    // 2b) Jendela Parameter Laporan (tugas I.1g-1): dibuka kartu Penghasilan Komprehensif
    const dlg = "document.getElementById('dialog-parameter-laporan')";
    const chipDivisi = () => evalJs("[...document.querySelectorAll('#param-divisi .chip-akun')].map(function(c){return c.querySelector('.chip-teks').textContent + (c.querySelector('.chip-hapus')?'×':'');})");
    const hariIni = await evalJs("tanggalHariIni()");
    await bersihNotif(); await klik("#lap-isi .lap-kartu:nth-child(2)"); await tunggu(300);
    catat("Klik kartu Penghasilan Komprehensif: jendela Parameter Laporan terbuka dengan nama laporannya", await evalJs(dlg + ".open && document.getElementById('param-nama-laporan').textContent==='Laporan Penghasilan Komprehensif'"));
    const awal = JSON.parse(await evalJs("JSON.stringify({dari:document.getElementById('param-dari').value, sampai:document.getElementById('param-sampai').value, dariTampil:document.getElementById('param-dari-tampil').value, total:document.getElementById('param-hanya-total').checked, induk:document.getElementById('param-akun-induk').checked, anak:document.getElementById('param-akun-anak').checked, chipProgram:document.querySelectorAll('#param-program .chip-akun').length})"));
    catat("Isi awal: tanggal 1 bulan ini s/d hari ini (kalender dd/mm/yyyy), Hanya Total tidak, Induk dan Anak ya, Program kosong", awal.dari === hariIni.slice(0, 8) + "01" && awal.sampai === hariIni && awal.dariTampil === "01/" + hariIni.slice(5, 7) + "/" + hariIni.slice(0, 4) && !awal.total && awal.induk && awal.anak && awal.chipProgram === 0, JSON.stringify(awal));
    catat("Divisi awalnya label 'Semua Divisi' tanpa tombol ×", JSON.stringify(await chipDivisi()) === JSON.stringify(["Semua Divisi"]), JSON.stringify(await chipDivisi()));
    await klik("#param-divisi-cari"); await tunggu(200);
    const pilihan = await evalJs("[...document.querySelectorAll('#param-divisi-daftar .jurnal-pilihan-akun')].map(function(l){return l.textContent;})");
    catat("Klik kolom Divisi: daftar berisi semua Divisi (nama berkode HTML tampil sebagai teks)", pilihan.length === 3 && pilihan.includes("Kesehatan") && pilihan.includes("<img src=x onerror=alert(1)>") && await evalJs("!document.querySelector('#param-divisi-daftar img')"), JSON.stringify(pilihan));
    const iKes = await evalJs("[...document.querySelectorAll('#param-divisi-daftar .jurnal-pilihan-akun')].findIndex(function(l){return l.textContent==='Kesehatan';})");
    await klik("#param-divisi-daftar .jurnal-pilihan-akun:nth-child(" + (iKes + 1) + ")"); await tunggu(200);
    await klik("#param-divisi-cari"); await tunggu(150); await ketik("pendi"); await tunggu(200);
    await kirim("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); await tunggu(200);
    catat("Pilih Kesehatan (klik) lalu Pendidikan (ketik + Enter): dua label dengan ×, 'Semua Divisi' hilang", JSON.stringify(await chipDivisi()) === JSON.stringify(["Kesehatan×", "Pendidikan×"]), JSON.stringify(await chipDivisi()));
    await klik("#param-divisi-cari"); await tunggu(200);
    catat("Divisi yang sudah dipilih tidak ditawarkan lagi", JSON.stringify(await evalJs("[...document.querySelectorAll('#param-divisi-daftar .jurnal-pilihan-akun')].map(function(l){return l.textContent;})")) === JSON.stringify(["<img src=x onerror=alert(1)>"]));
    // Esc menutup daftar Divisi dulu (daftar yang terbuka menutupi kolom Program di bawahnya)
    await kirim("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await tunggu(150);
    catat("Esc di kolom Divisi: hanya daftar pilihan yang menutup, jendela tetap terbuka", await evalJs("document.getElementById('param-divisi-daftar').hidden && " + dlg + ".open"));
    await klik("#param-program-cari"); await tunggu(200);
    catat("Program: semua Program ditawarkan, termasuk yang sudah Selesai", JSON.stringify(await evalJs("[...document.querySelectorAll('#param-program-daftar .jurnal-pilihan-akun')].map(function(l){return l.textContent;})")) === JSON.stringify(["Beasiswa"]));
    await klik("#param-program-daftar .jurnal-pilihan-akun"); await tunggu(150);
    await klik("#param-divisi .chip-akun .chip-hapus"); await tunggu(200);
    catat("Klik × pada label Kesehatan: tinggal Pendidikan", JSON.stringify(await chipDivisi()) === JSON.stringify(["Pendidikan×"]), JSON.stringify(await chipDivisi()));
    // Tanggal Dari sesudah s/d: ditolak dengan pesan, jendela tetap terbuka
    await evalJs("(function(){var d=document.getElementById('param-dari'); d.value='2026-12-31'; d.dispatchEvent(new Event('change')); return true;})()");
    await klik("#tampilkan-parameter-laporan"); await tunggu(200);
    catat("Tanggal Dari sesudah s/d: pesan 'Tanggal Dari tidak boleh sesudah tanggal s/d.', jendela tetap terbuka", await evalJs(dlg + ".open && !document.getElementById('galat-param-tanggal').hidden && document.getElementById('galat-param-tanggal').textContent==='Tanggal Dari tidak boleh sesudah tanggal s/d.'"));
    await evalJs("(function(){var d=document.getElementById('param-dari'); d.value='2026-10-01'; d.dispatchEvent(new Event('change')); return true;})()");
    catat("Tanggal dibetulkan: pesan salah hilang", await evalJs("document.getElementById('galat-param-tanggal').hidden"));
    await foto("laporan-parameter.png");
    await bersihNotif(); await klik("#tampilkan-parameter-laporan"); await tunggu(300);
    // 2c) Kertas hasil laporan (tugas I.1g-2)
    const kertas = JSON.parse(await evalJs("JSON.stringify({tab:!document.getElementById('tab-hasil-laporan').hidden && !document.getElementById('isi-hasil-laporan').hidden, judulTab:document.getElementById('judul-tab-hasil-laporan').textContent, yys:document.getElementById('lap-k-yayasan').textContent, judul:document.getElementById('lap-k-judul').textContent, periode:document.getElementById('lap-k-periode').textContent, mata:document.querySelector('.lap-k-mata').textContent, filter:document.getElementById('lap-k-filter').textContent, kaki:document.getElementById('lap-k-dicetak').textContent, isi:document.getElementById('lap-k-isi').textContent, adaB:!!document.querySelector('#lap-kertas b')})"));
    catat("Tampilkan: jendela tertutup, tab hasil bernama laporannya terbuka", await evalJs("!" + dlg + ".open") && kertas.tab && kertas.judulTab === "Laporan Penghasilan Komprehensif per Divisi", JSON.stringify(kertas));
    catat("Kepala kertas: nama yayasan (kode HTML tampil sebagai teks), judul, 'Untuk periode 1 Okt 2026 sampai <hari ini>', '(Dinyatakan dalam Rupiah)'", kertas.yys === "Yayasan Contoh <b>Peduli</b>" && !kertas.adaB && kertas.judul === "Laporan Penghasilan Komprehensif per Divisi" && kertas.periode === "Untuk periode 1 Okt 2026 sampai " + await evalJs("formatTanggal(tanggalHariIni())") && kertas.mata === "(Dinyatakan dalam Rupiah)", JSON.stringify(kertas));
    catat("Keterangan filter: 'Divisi: Pendidikan · Program: Beasiswa'; kaki 'Dicetak <tanggal>, <jam>'", kertas.filter === "Divisi: Pendidikan · Program: Beasiswa" && /^Dicetak \d{1,2} \w{3} \d{4}, \d{2}\.\d{2}$/.test(kertas.kaki), kertas.filter + " | " + kertas.kaki);
    catat("Tanpa jurnal: isi kertas berupa pesan ramah 'Belum ada transaksi ...' (angka laporan diuji di uji-chrome-penghasilan.js)", /^Belum ada transaksi penerimaan atau beban/.test(kertas.isi), kertas.isi);
    const gayaK = JSON.parse(await evalJs("JSON.stringify((function(){var k=document.getElementById('lap-kertas'), s=getComputedStyle(k), sb=getComputedStyle(k,'::before'); return {latar:s.backgroundColor, garis:s.borderTopColor, tebal:s.borderTopWidth, oranye:sb.backgroundColor, judulWarna:getComputedStyle(document.getElementById('lap-k-judul')).color, tengah:getComputedStyle(document.querySelector('.lap-k-kepala')).textAlign};})())"));
    catat("Gaya kertas: putih, garis atas biru tua 4px dengan potongan oranye, judul biru tua, kepala di tengah", gayaK.latar === "rgb(255, 255, 255)" && gayaK.garis === "rgb(11, 42, 91)" && gayaK.tebal === "4px" && gayaK.oranye === "rgb(245, 166, 35)" && gayaK.judulWarna === "rgb(11, 42, 91)" && gayaK.tengah === "center", JSON.stringify(gayaK));
    await foto("laporan-kertas.png");
    // Cetak: PDF dibuat aplikasi, dibaca langsung dari berkasnya
    const bacaPdfLaporan = async () => Buffer.from(await evalJs("susunPdfLaporan().blob().arrayBuffer().then(function(b){var u=new Uint8Array(b),s=''; for(var i=0;i<u.length;i++){s+=String.fromCharCode(u[i]);} return btoa(s);})"), "base64");
    const pdf = await bacaPdfLaporan();
    fs.writeFileSync(path.join(folderPng, "laporan-cetak.pdf"), pdf);
    const jmlHalaman = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
    catat("Cetak: 1 halaman A4, tanpa halaman kosong", jmlHalaman === 1 && /MediaBox \[0 0 595\.\d+ 841\.\d+\]/.test(pdf.toString("latin1")), jmlHalaman + " halaman");
    // Ubah Parameter: jendela terbuka lagi dengan isian yang sedang dipakai
    await klik("#lap-ubah-parameter"); await tunggu(300);
    catat("Ubah Parameter: jendela Parameter terbuka dengan isian sebelumnya (1 Okt 2026, Pendidikan, Beasiswa)", await evalJs(dlg + ".open && document.getElementById('param-dari').value==='2026-10-01' && document.querySelectorAll('#param-program .chip-akun').length===1") && JSON.stringify(await chipDivisi()) === JSON.stringify(["Pendidikan×"]));
    await klik("#param-divisi .chip-akun .chip-hapus"); await tunggu(150);
    await klik("#tampilkan-parameter-laporan"); await tunggu(300);
    catat("Tampilkan lagi: kertas digambar ulang dengan filter baru (Semua Divisi)", await evalJs("document.getElementById('lap-k-filter').textContent") === "Divisi: Semua Divisi · Program: Beasiswa", await evalJs("document.getElementById('lap-k-filter').textContent"));
    // 2d) Pohon akun bertingkat dan tabel laporan (tugas I.1g-3), dengan akun rekaan
    catat("angkaLaporan: 0 -> '-', minus dalam kurung, ribuan bertitik", JSON.stringify(await evalJs("[angkaLaporan(0), angkaLaporan(-0), angkaLaporan(1234567), angkaLaporan(-1500000), angkaLaporan('rusak')]")) === JSON.stringify(["-", "-", "1.234.567", "(1.500.000)", "-"]));
    const siapPohon = "var AK=[null,{id:'a1',kode:'4101',nama:'Donasi',tipe:'pendapatan',indukId:''},{id:'a2',kode:'410101',nama:'Donasi Pendidikan',tipe:'pendapatan',indukId:'a1'},{id:'a3',kode:'410102',nama:'Donasi Umum',tipe:'pendapatan',indukId:'a1'},{id:'a4',kode:'410103',nama:'Donasi Kosong',tipe:'pendapatan',indukId:'a1'},{id:'a5',kode:'7101',nama:'Pendapatan Lain',tipe:'pendapatan-lain',indukId:''},{id:'a6',kode:'710101',nama:'Jasa <b>Giro</b>',tipe:'pendapatan-lain',indukId:'a5'},{id:'a7',kode:'4102',nama:'Hibah',tipe:'pendapatan',indukId:''},{id:'a8',kode:'410201',nama:'Hibah Kosong',tipe:'pendapatan',indukId:'a7'},{id:'b1',kode:'5101',nama:'Beban',tipe:'beban',indukId:''},{id:'c1',kode:'4199',nama:'Putar A',tipe:'pendapatan',indukId:'c2'},{id:'c2',kode:'4198',nama:'Putar B',tipe:'pendapatan',indukId:'c1'}]; var NI={a2:[25000000,0],a3:[0,8750000],a6:[0,125000],b1:[5,5]}; function susun(p){return susunBarisAkun({akun:AK, masuk:function(a){return a.tipe==='pendapatan'||a.tipe==='pendapatan-lain';}, nilai:function(id){return NI[id]||[];}, kolom:2, param:p});} function teks(h){return h.baris.map(function(b){return b.jenis+'|'+b.nama+'|'+b.tingkat+'|'+(b.nilai?b.nilai.join(','):'');});}";
    const mode = JSON.parse(await evalJs("(function(){" + siapPohon + " return JSON.stringify({lengkap:teks(susun({akunInduk:true,akunAnak:true})), total:susun({akunInduk:true,akunAnak:true}).total, induk:teks(susun({akunInduk:true,akunAnak:false})), anak:teks(susun({akunInduk:false,akunAnak:true})), hanyaTotal:teks(susun({hanyaTotal:true,akunInduk:true,akunAnak:true})), duaMati:teks(susun({akunInduk:false,akunAnak:false})), totalHT:susun({hanyaTotal:true}).total});})()"));
    catat("Induk + Anak: judul induk, anak menjorok, 'Jumlah <induk>' hanya untuk isi 2 baris atau lebih (Donasi ya, Pendapatan Lain tidak); akun 0 (Donasi Kosong, Hibah) disembunyikan; induk berputar (data rusak) dilewati", JSON.stringify(mode.lengkap) === JSON.stringify(["judul|Donasi|0|", "akun|Donasi Pendidikan|1|25000000,0", "akun|Donasi Umum|1|0,8750000", "jumlah|Jumlah Donasi|0|25000000,8750000", "judul|Pendapatan Lain|0|", "akun|Jasa <b>Giro</b>|1|0,125000"]) && JSON.stringify(mode.total) === "[25000000,8875000]", JSON.stringify(mode.lengkap) + " total " + JSON.stringify(mode.total));
    catat("Hanya Induk: satu baris per induk teratas berisi jumlahnya", JSON.stringify(mode.induk) === JSON.stringify(["akun|Donasi|0|25000000,8750000", "akun|Pendapatan Lain|0|0,125000"]), JSON.stringify(mode.induk));
    catat("Hanya Anak: akun paling bawah saja, tanpa judul dan Jumlah", JSON.stringify(mode.anak) === JSON.stringify(["akun|Donasi Pendidikan|0|25000000,0", "akun|Donasi Umum|0|0,8750000", "akun|Jasa <b>Giro</b>|0|0,125000"]), JSON.stringify(mode.anak));
    catat("Hanya Tampilkan Total, atau Induk dan Anak mati: tanpa baris akun, total bagian tetap dihitung", mode.hanyaTotal.length === 0 && mode.duaMati.length === 0 && JSON.stringify(mode.totalHT) === "[25000000,8875000]");
    // Gambar di kertas: bagian, baris akun, total bagian, dan baris akhir
    await evalJs("(function(){" + siapPohon + " var h=susun({akunInduk:true,akunAnak:true}); var baris=[{jenis:'bagian',nama:'PENERIMAAN'}].concat(h.baris).concat([{jenis:'total',nama:'Jumlah Penerimaan',nilai:h.total},{jenis:'akhir',nama:'SURPLUS (DEFISIT)',nilai:[-1500000,h.total[1]]}]); tampilkanLaporan({nama:'Uji Tabel', gambar:function(){return {isi:buatTabelLaporan({kolom:['Dengan pembatasan','Tanpa pembatasan'], baris:baris})};}}, {dari:'2026-10-01',sampai:'2026-10-31',divisi:[],program:[],akun:[]}); return true;})()"); await tunggu(300);
    const tb = JSON.parse(await evalJs("JSON.stringify((function(){var t=document.querySelector('#lap-k-isi .lap-tabel'); var r=[...t.tBodies[0].rows]; function sel(i,j){return r[i].cells[j];} function cs(e){return getComputedStyle(e);} return {judul:[...t.tHead.rows[0].cells].map(function(c){return c.textContent;}), sel:r.map(function(x){return [...x.cells].map(function(c){return c.textContent;}).join('|');}), adaB:!!t.querySelector('b'), jorokAnak:parseInt(cs(sel(2,0)).paddingLeft), jorokJudul:parseInt(cs(sel(1,0)).paddingLeft), garisJumlah:cs(sel(4,1)).borderTopStyle+' '+cs(sel(4,1)).borderTopWidth, garisTotal:cs(sel(7,1)).borderTopColor, dobel:cs(sel(8,1)).borderBottomStyle, kanan:cs(sel(2,1)).textAlign};})())"));
    catat("Tabel: kolom Keterangan + 2 kolom angka; angka '-' untuk 0 dan kurung untuk minus; nama berkode HTML tampil sebagai teks", JSON.stringify(tb.judul) === JSON.stringify(["Keterangan", "Dengan pembatasan", "Tanpa pembatasan"]) && tb.sel[2] === "Donasi Pendidikan|25.000.000|-" && tb.sel[8] === "SURPLUS (DEFISIT)|(1.500.000)|8.875.000" && tb.sel.includes("Jasa <b>Giro</b>|-|125.000") && !tb.adaB, JSON.stringify(tb.sel));
    catat("Garis akuntansi: anak lebih menjorok dari induk, angka rata kanan, garis tipis di atas Jumlah, garis tegas di atas total, garis dobel di bawah baris akhir", tb.jorokAnak > tb.jorokJudul && tb.kanan === "right" && tb.garisJumlah === "solid 1px" && tb.garisTotal === "rgb(17, 24, 39)" && tb.dobel === "double", JSON.stringify(tb));
    await foto("laporan-tabel.png");
    fs.writeFileSync(path.join(folderPng, "laporan-tabel.pdf"), await bacaPdfLaporan());
    await klik('[data-tutup="hasil-laporan"]'); await tunggu(250);
    await klik("#tombol-laporan"); await tunggu(300);
    await bersihNotif(); await klik("#lap-isi .lap-kartu:nth-child(1)"); await tunggu(300);
    catat("Buka lagi (kartu Posisi Keuangan): isi kembali ke awal (Semua Divisi, Program kosong)", await evalJs(dlg + ".open && document.getElementById('param-nama-laporan').textContent==='Laporan Posisi Keuangan' && document.querySelectorAll('#param-program .chip-akun').length===0") && JSON.stringify(await chipDivisi()) === JSON.stringify(["Semua Divisi"]));
    await evalJs("(function(){var d=document.getElementById('param-dari'); d.value='2026-10-15'; d.dispatchEvent(new Event('change')); return true;})()");
    await klik("#tampilkan-parameter-laporan"); await tunggu(300);
    catat("Laporan Posisi Keuangan: kepala menulis 'Per <tanggal s/d>' (tanggal Dari tidak dipakai)", await evalJs("document.getElementById('lap-k-periode').textContent") === "Per " + await evalJs("formatTanggal(tanggalHariIni())"), await evalJs("document.getElementById('lap-k-periode').textContent"));
    await klik('[data-tutup="hasil-laporan"]'); await tunggu(250);
    await klik("#tombol-laporan"); await tunggu(300);
    await klik("#lap-isi .lap-kartu:nth-child(1)"); await tunggu(300);
    await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: 8, y: 450, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: 8, y: 450, button: "left", clickCount: 1 }); await tunggu(200);
    catat("Klik latar gelap: jendela tertutup tanpa menampilkan apa pun", await evalJs("!" + dlg + ".open && document.getElementById('tab-hasil-laporan').hidden"));

    // 3) Kategori lain: isi dan jenis kartu
    const harap = { "Divisi & Program": ["Laporan Penghasilan per DivisiLaba Rugi Departemen", "Laporan Penghasilan per ProgramLaba Rugi Proyek", "Laporan Penghasilan per Divisi (Perbandingan Anggaran)Laba Rugi Departemen (Perbandingan Anggaran)", "Laporan Penghasilan per Program (Perbandingan Anggaran)Laba Rugi Proyek (Perbandingan Anggaran)", "Laporan Donasi per Program", "Sisa Dana per Program", "Rincian Pengeluaran", "Bukti Pengeluaran per Divisi dan Program"], "Kas & Bank": ["Daftar Kas dan Bank", "Rincian Beban Pembayaran"], "Donasi": ["Penerimaan Donasi per Divisi", "Rincian per Donasi", "Rincian Donasi per Donatur"], "Buku Besar": ["Neraca Saldo", "Buku Besar per Akun", "Jurnal tanpa Lampiran"] };
    for (const [nama, daftar] of Object.entries(harap)) {
      await klikKategori(nama);
      const isi = await kartu();
      catat("Kategori " + nama + ": " + daftar.join(", "), JSON.stringify(isi) === JSON.stringify(daftar), JSON.stringify(isi));
    }
    catat("Laporan rincian (Neraca Saldo biru; Buku Besar per Akun dan Jurnal tanpa Lampiran ungu)", await evalJs("(function(){var k=[...document.querySelectorAll('#lap-isi .lap-kartu')]; return k[0].classList.contains('ringkasan') && k[1].classList.contains('rincian') && k[2].classList.contains('rincian') && getComputedStyle(k[1].querySelector('.lap-kartu-ikon')).color!==getComputedStyle(k[0].querySelector('.lap-kartu-ikon')).color;})()"));

    // 4) Pencarian lintas kategori
    // Notifikasi "belum tersedia" (pojok kanan atas) bisa menutupi kotak Cari selama 4 detik, jadi dibersihkan dulu
    await bersihNotif(); await klik("#lap-cari"); await tunggu(150); await ketik("kas"); await tunggu(250);
    const hk = await judulKelompok(), hc = await kartu();
    catat("Cari 'kas' (dari kategori Buku Besar): judul 'Hasil pencarian', hasil dari semua kategori yang cocok", await evalJs("document.getElementById('lap-judul').textContent==='Hasil pencarian'") && hk.includes("Keuangan") && hk.includes("Kas & Bank") && hc.includes("Laporan Arus Kas") && hc.includes("Daftar Kas dan Bank"), JSON.stringify({ hk, hc }));
    catat("Kata yang cocok disorot (mark)", await evalJs("[...document.querySelectorAll('#lap-isi mark')].some(function(m){return m.textContent.toLowerCase()==='kas';})"));
    await evalJs("(function(){var c=document.getElementById('lap-cari'); c.value='<b>zzz</b>'; c.dispatchEvent(new Event('input')); return true;})()"); await tunggu(150);
    catat("Cari yang tidak ada (berisi kode HTML): pesan 'Tidak ada laporan yang cocok' tampil sebagai teks biasa", /Tidak ada laporan yang cocok dengan "<b>zzz<\/b>"\./.test(await evalJs("document.getElementById('lap-isi').textContent")) && await evalJs("!document.querySelector('#lap-isi b')"));
    await klikKategori("Donasi");
    catat("Pindah kategori: kotak Cari dikosongkan, isi kategori Donasi tampil", await evalJs("document.getElementById('lap-cari').value===''") && (await kartu()).length === 3);

    // 5) Tutup lalu buka lagi
    await klik('[data-tutup="laporan"]'); await tunggu(250);
    catat("Tutup tab Laporan: kembali ke Dashboard", await evalJs("document.getElementById('tab-laporan').hidden && !document.getElementById('isi-dashboard').hidden"));
    await klik("#tombol-laporan"); await tunggu(300);
    catat("Buka lagi: tab Laporan tampil di kategori terakhir (Donasi)", await evalJs("!document.getElementById('isi-laporan').hidden && document.querySelector('#lap-kategori .lap-kat.aktif').textContent.trim()==='Donasi'"));

    // 6) Layar HP
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(300);
    await klikKategori("Keuangan");
    const hp = JSON.parse(await evalJs("JSON.stringify({kolom:getComputedStyle(document.querySelector('.lap-kisi')).gridTemplateColumns.split(' ').length, katBaris:getComputedStyle(document.getElementById('lap-kategori')).flexDirection, panelKanan:Math.round(document.querySelector('.lap-panel').getBoundingClientRect().right), layar:window.innerWidth})"));
    catat("Lebar 390: kartu satu kolom, kategori berbaris ke samping, panel tidak keluar layar", hp.kolom === 1 && hp.katBaris === "row" && hp.panelKanan <= hp.layar, JSON.stringify(hp));
    catat("Lebar 390: kategori aktif (Keuangan) digeser masuk ke layar, tidak terpotong", await evalJs("(function(){var n=document.getElementById('lap-kategori'), a=n.querySelector('.lap-kat.aktif'); var rn=n.getBoundingClientRect(), ra=a.getBoundingClientRect(); return ra.left>=rn.left-1 && ra.right<=rn.right+1;})()"));
    await foto("laporan-hp.png");
    await klik("#lap-isi .lap-kartu:nth-child(2)"); await tunggu(300);
    const dHp = JSON.parse(await evalJs("JSON.stringify((function(){var r=document.getElementById('dialog-parameter-laporan').getBoundingClientRect(); return {kiri:Math.round(r.left), kanan:Math.round(r.right), layar:window.innerWidth};})())"));
    catat("Lebar 390: jendela Parameter Laporan muat di layar", dHp.kiri >= 0 && dHp.kanan <= dHp.layar, JSON.stringify(dHp));
    await foto("laporan-parameter-hp.png");
    await evalJs("document.getElementById('dialog-parameter-laporan').close(); true");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
