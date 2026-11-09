// Uji Cetak Bukti (PRD 6.9) di Chrome asli: Terbilang dengan hitungan tangan, kelima dokumen, desain bawaan dibuat otomatis dan bisa diedit, Tabel Rincian mengikuti
// jumlah baris dan elemen di bawahnya mengikuti, kode HTML sebagai teks, transaksi tidak berubah, Log tercatat, pilihan desain, data rusak, dan isi berkas PDF yang dibaca langsung.
// Pemakaian: node uji-chrome-cetak-bukti.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9400;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 140)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };

const akun = (id, kode, nama, tipe, indukId) => ({ id, kode, nama, tipe, indukId: indukId || "" });
const AKUN = [akun("k0", "11", "Kas", "kas-bank"), akun("k1", "1101", "Kas Kecil", "kas-bank", "k0"), Object.assign(akun("k2", "110101", "Kas Masjid", "kas-bank", "k1"), { saldoAwal: 9000000 }), akun("b1", "5101", "Beban <b>Listrik</b>", "beban")];
const barisB = (i, nilai) => ({ id: "r" + i, akunId: "b1", kode: "5101", nama: "Beban <b>Listrik</b>", nilai, divisiId: "d1", programId: "pr1", catatan: "Tagihan " + i });
const BAYAR = [
  { id: "by1", nomor: "BKK-1", nama: "BKK-1", tanggal: "2026-01-10", kasId: "k2", kas: "110101 - Kas Masjid", noCek: "CEK-9", penerima: "PT <i>Listrik</i>", catatan: "Tagihan", rincian: [barisB(1, 1200000), barisB(2, 300000)], total: 1500000 },
  { id: "by2", nomor: "BKK-2", nama: "BKK-2", tanggal: "2026-01-11", kasId: "k2", kas: "110101 - Kas Masjid", penerima: "PT Besar", catatan: "Banyak baris", rincian: Array.from({ length: 40 }, (x, i) => barisB(i + 10, 1000)), total: 40000 }
];
const TERIMA = [{ id: "tm1", nomor: "BKM-1", nama: "BKM-1", tanggal: "2026-01-12", kasId: "k2", kas: "110101 - Kas Masjid", pemberi: "Penyewa", catatan: "Sewa", rincian: [barisB(3, 200000)], total: 200000 }];
const TRANSFER = [{ id: "tf1", nomor: "TF-1", nama: "TF-1", tanggal: "2026-01-13", dari: "110101 - Kas Masjid", ke: "110102 - Kas Kantor", nilai: 50000 }];
const JURNAL = [
  { id: "j1", nomor: "JV-1", nama: "JV-1", noJurnal: "JV.2026.01.00001", tanggal: "2026-01-14", keterangan: "Koreksi", rincian: [{ id: "a", akunId: "b1", kode: "5101", nama: "Beban", debit: 70000, kredit: 0, keterangan: "x", divisiId: "d1", programId: "", terikat: false }, { id: "b", akunId: "k2", kode: "110101", nama: "Kas", debit: 0, kredit: 70000, keterangan: "y", divisiId: "", programId: "", terikat: false }] },
  { id: "j2", nomor: "BKK-1", nama: "BKK-1", noJurnal: "JV.2026.01.00002", tanggal: "2026-01-10", rincian: [], sumber: { jenis: "pembayaran", id: "by1" } }
];
const DONASI = [{ id: "dn1", nomor: "DN-1", nama: "DN-1", tanggal: "2026-01-15", kasId: "k2", kas: "110101 - Kas Masjid", donaturId: "dt1", caraBayar: "Transfer", keterangan: "x", rincian: [{ id: "r9", akunId: "b1", kode: "4101", nama: "Infak", nilai: 2000000, programId: "pr1" }, { id: "r8", akunId: "b1", kode: "4102", nama: "Sedekah", nilai: 500000, programId: "" }] }];

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
    const siap = async () => { for (let i = 0; i < 100; i++) { if (await evalJs("document.readyState==='complete' && typeof cetakTransaksi==='function' && typeof gambarDashboard==='function'")) { break; } await tunggu(200); } await tunggu(200); };
    const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); await siap(); };
    await tunggu(800); await siap();
    const simpan = (k, v) => "localStorage.setItem('" + k + "', " + JSON.stringify(JSON.stringify(v)) + ");";
    await evalJs("localStorage.clear();" + simpan("daftarAkun", AKUN) + simpan("daftarDivisi", [{ id: "d1", nama: "Umum" }]) + simpan("daftarProgram", [{ id: "pr1", nama: "Beasiswa", status: "aktif" }]) + simpan("daftarPembayaran", BAYAR) + simpan("daftarPenerimaan", TERIMA) + simpan("daftarTransfer", TRANSFER) + simpan("daftarJurnal", JURNAL) + simpan("daftarDonasi", DONASI) + simpan("daftarDonatur", [{ id: "dt1", idDonatur: "D.00001", nama: "Donatur <b>A</b>" }]) + simpan("dataYayasan", { nama: "Yayasan Contoh", alamat: "Jl. Contoh 1", telepon: "021" }) + "true");
    await muatUlang();
    // Setiap kali Halaman Cetak terbuka dihitung; window.print tidak boleh dipanggil untuk halaman aplikasi
    await evalJs("window.__cetak=0; window.__printHalaman=0; window.print=function(){window.__printHalaman++;}; var __asliCetak=tampilkanHalamanCetak; tampilkanHalamanCetak=function(a,b,c){window.__cetak++; __asliCetak(a,b,c);}; true");
    const uji = async (nama, n, harap) => catat("Terbilang " + nama, await evalJs(`terbilangRupiah(${n})`) === harap, await evalJs(`terbilangRupiah(${n})`));
    await uji("nol", 0, "Nol rupiah");
    await uji("sebelas", 11, "Sebelas rupiah");
    await uji("seratus", 100, "Seratus rupiah");
    await uji("seribu lima ratus", 1500, "Seribu lima ratus rupiah");
    await uji("dua juta", 2500000, "Dua juta lima ratus ribu rupiah");
    await uji("rumit", 1234567, "Satu juta dua ratus tiga puluh empat ribu lima ratus enam puluh tujuh rupiah");
    await uji("miliar", 3000000015, "Tiga miliar lima belas rupiah");
    await uji("triliun", 2000000000000, "Dua triliun rupiah");
    const buka = async (nama, idData) => { await evalJs(`(function(){var j=JENIS_CETAK['${nama}'], m=j.modul(), a=m.ambil().find(function(d){return d.id==='${idData}';}); bukaTab('${{ "Pembayaran": "bayar", "Penerimaan": "terima", "Transfer Bank": "transfer", "Jurnal Umum": "jurnal", "Pencatatan Donasi": "donasi-catat" }[nama]}'); m.bukaUbah(a); return true;})()`); await tunggu(200); };
    const cetak = async (nama) => { await evalJs(`document.querySelector('[data-cetak-bukti="${nama}"]').click(); true`); await tunggu(250); };
    // Isi PDF dibaca dari berkasnya. Isi halaman PDF tidak dipadatkan, jadi teks ada apa adanya sebagai kode heksa di perintah Tj.
    const pdfMentah = () => evalJs("dokumenCetak.blob.arrayBuffer().then(function(b){var u=new Uint8Array(b), s=''; for(var i=0;i<u.length;i++){s+=String.fromCharCode(u[i]);} return s;})");
    const dariHeksa = (h) => h.match(/../g).map(c => String.fromCharCode(parseInt(c, 16))).join("");
    const teksPdf = (r) => [...r.matchAll(/<([0-9A-F]+)> Tj/g)].map(m => dariHeksa(m[1])).join("\n");
    const posisiTeksPdf = (r) => [...r.matchAll(/([\d.]+) ([\d.]+) Td <([0-9A-F]+)> Tj/g)].map(m => ({ x: Number(m[1]), y: Number(m[2]), t: dariHeksa(m[3]) }));
    const jumlahHalamanPdf = (r) => (r.match(/\/Type \/Page /g) || []).length;
    const simpanPdf = async (nama, r) => fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r, "latin1"));
    const kertas = async () => teksPdf(await pdfMentah());
    const tampilLayar = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };

    catat("Tombol Cetak ada di kelima formulir", await evalJs("Object.keys(JENIS_CETAK).every(function(k){return document.querySelector('[data-cetak-bukti=\"'+k+'\"]');})"));
    await evalJs("JENIS_CETAK['Pembayaran'].modul().bukaBaru(); bukaTab('bayar'); true"); await tunggu(150); await cetak("Pembayaran");
    catat("Cetak Data Baru yang belum lengkap: ditolak pemeriksaan Simpan, tidak ada yang dicetak", await evalJs("window.__cetak===0 && !document.getElementById('bayar-pesan-galat').hidden") && (await evalJs("JSON.parse(localStorage.getItem('daftarPembayaran')).length")) === 2, await evalJs("document.getElementById('bayar-pesan-galat').textContent"));
    const awal = await evalJs("localStorage.getItem('daftarPembayaran')");
    await buka("Pembayaran", "by1"); await cetak("Pembayaran");
    catat("Transaksi tidak diubah: langsung cetak, tidak disimpan ulang, formulir tetap terbuka", await evalJs("window.__cetak===1 && JENIS_CETAK['Pembayaran'].modul().idDiubah==='by1'") && (await evalJs("localStorage.getItem('daftarPembayaran')")) === awal && await evalJs("!JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(l){return l.tindakan==='Ubah';})"));
    const k1 = await kertas();
    catat("Bukti Pembayaran: judul, nomor, kepala, rincian, Total, Terbilang, tanda tangan, JV", await evalJs("window.__cetak===1") && /BUKTI PEMBAYARAN/.test(k1) && /No\. BKK-1/.test(k1) && /Kas Masjid/.test(k1) && /PT <i>Listrik<\/i>/.test(k1) && /1\.200\.000/.test(k1) && /1\.500\.000/.test(k1) && /Satu juta lima ratus ribu rupiah/.test(k1) && /Disetujui/.test(k1) && /Penerima/.test(k1) && /JV\.2026\.01\.00002/.test(k1) && /Yayasan Contoh/.test(k1), k1.slice(0, 500));
    catat("Kode HTML tetap teks", /PT <i>Listrik<\/i>/.test(k1));
    catat("Tidak ada penanda yang tersisa", !/\{\{/.test(k1), k1);
    await tampilLayar("cetak-pembayaran.png");
    catat("Desain bawaan otomatis: A5 mendatar, tersimpan, bisa diedit", await evalJs("(function(){var d=bacaCetakan().filter(function(c){return c.tipe==='bukti-pembayaran';}); return d.length===1 && d[0].kertas==='A5' && d[0].orientasi==='landscape' && d[0].elemen.some(function(e){return e.jenis==='tabel';});})()"));
    catat("Transaksi tidak berubah", (await evalJs("localStorage.getItem('daftarPembayaran')")) === awal);
    catat("Tercatat di Log Aktivitas", await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(l){return l.tindakan==='Cetak' && l.referensi==='BKK-1';})"));
    catat("Ukuran halaman mengikuti desain", /MediaBox \[0 0 595\.\d+ 419\.\d+\]/.test(await pdfMentah()));
    // Cetak juga menyimpan
    await evalJs("window.__cetak=0; true");
    await buka("Jurnal Umum", "j1");
    await evalJs("document.getElementById('jurnal-keterangan').value='Koreksi diubah'; true"); await cetak("Jurnal Umum");
    catat("Transaksi diubah: Cetak menyimpan dulu lalu mencetak isi terbaru", await evalJs("window.__cetak===1") && await evalJs("JSON.parse(localStorage.getItem('daftarJurnal')).find(function(j){return j.id==='j1';}).keterangan==='Koreksi diubah'") && /Koreksi diubah/.test(await kertas()), await evalJs("document.getElementById('jurnal-pesan-galat')?document.getElementById('jurnal-pesan-galat').textContent:''"));
    await evalJs("modulTransfer.bukaBaru(); bukaTab('transfer'); document.getElementById('transfer-nomor-otomatis').click(); document.getElementById('transfer-nomor').value='TF-2'; document.getElementById('transfer-tanggal').value='2026-02-01'; true");
    await evalJs("(function(){var d=document.getElementById('transfer-dari'), k=document.getElementById('transfer-ke'); d.innerHTML=''; k.innerHTML=''; return true;})()");
    await evalJs("(function(){var a=JSON.parse(localStorage.getItem('daftarAkun')); a.push({id:'k3',kode:'110102',nama:'Kas Kantor',tipe:'kas-bank',indukId:'k1',saldoAwal:0}); a.find(function(x){return x.id==='k2';}).saldoAwal=9000000; localStorage.setItem('daftarAkun',JSON.stringify(a)); isiPilihanKasTransfer('k2','k3'); document.getElementById('transfer-nilai').value='25.000'; return true;})()"); await tunggu(150);
    await cetak("Transfer Bank");
    catat("Data Baru lengkap: Cetak menyimpan lalu mencetak", await evalJs("window.__cetak===2 && JSON.parse(localStorage.getItem('daftarTransfer')).some(function(t){return t.nomor==='TF-2';})") && /No\. TF-2/.test(await kertas()), await evalJs("document.getElementById('transfer-pesan-galat').textContent") + (await kertas()).slice(0, 80));
    // Banyak baris
    await buka("Pembayaran", "by2"); await cetak("Pembayaran");
    const t40 = await kertas();
    catat("40 baris: semua tampil, Terbilang sesudah tabel", (t40.match(/Tagihan \d+/g) || []).length === 40 && t40.indexOf("Terbilang") > t40.lastIndexOf("Tagihan"));
    await tampilLayar("cetak-banyak.png");
    // Dokumen lain
    await buka("Penerimaan", "tm1"); await cetak("Penerimaan");
    const k2 = await kertas();
    catat("Bukti Penerimaan", /BUKTI PENERIMAAN/.test(k2) && /Diterima dari/.test(k2) && /Penyewa/.test(k2) && /Penyetor/.test(k2) && /Dua ratus ribu rupiah/.test(k2), k2.slice(0, 300));
    await buka("Transfer Bank", "tf1"); await cetak("Transfer Bank");
    const k3 = await kertas();
    catat("Bukti Transfer", /BUKTI TRANSFER/.test(k3) && /Kas Kantor/.test(k3) && /Lima puluh ribu rupiah/.test(k3), k3.slice(0, 300));
    await buka("Jurnal Umum", "j1"); await cetak("Jurnal Umum");
    const k4 = await kertas();
    catat("Bukti Jurnal: Debit, Kredit, nomor JV", /BUKTI JURNAL/.test(k4) && /Debit/.test(k4) && /Kredit/.test(k4) && /70\.000/.test(k4) && /JV\.2026\.01\.00001/.test(k4), k4.slice(0, 300));
    await buka("Pencatatan Donasi", "dn1"); await cetak("Pencatatan Donasi");
    const k5 = await kertas();
    catat("Tanda Terima Donasi: judul baru, jumlah, rincian, ucapan, tanda tangan Penerima", /TANDA TERIMA DONASI/.test(k5) && !/KUITANSI/i.test(k5) && /Donatur <b>A<\/b>/.test(k5) && /D\.00001/.test(k5) && /Rp 2\.500\.000/.test(k5) && /Infak/.test(k5) && /Beasiswa/.test(k5) && /Dua juta lima ratus ribu rupiah/.test(k5) && /Terima kasih atas donasi/.test(k5) && /Penerima/.test(k5), k5.slice(0, 400));
    await tampilLayar("cetak-tanda-terima.png");
    catat("Tanda Terima bawaan seukuran slip: 210 x 99 mm", await evalJs("(function(){var c=bacaCetakan().find(function(x){return x.tipe==='kuitansi-donasi';}); return c.kertas==='Slip' && c.orientasi==='landscape';})()") && /MediaBox \[0 0 595\.\d+ 280\.\d+\]/.test(await pdfMentah()));
    catat("Halaman Cetak terbuka: judul, bingkai PDF, tiga tombol", await evalJs("!document.getElementById('halaman-cetak-bukti').hidden && document.getElementById('hcb-pdf').src.indexOf('blob:')===0 && document.getElementById('hcb-judul').textContent==='Pencatatan Donasi DN-1' && !!document.getElementById('hcb-cetak') && !!document.getElementById('hcb-unduh') && !!document.getElementById('hcb-tutup')"));
    catat("Cetak tidak memanggil jendela cetak halaman aplikasi", await evalJs("window.__printHalaman===0"));
    // Angka di sini ditulis tangan dari desain lama, supaya desain yang sudah tersimpan di browser pengguna tetap dikenali
    catat("Desain A5 lama tetap dikenali (angka tidak berubah)", await evalJs("(function(){var e=elemenBawaan('kuitansi-donasi',KERTAS_BUKTI_BAWAAN); function c(i){return e.find(function(x){return x.isi===i;});} var g=e.find(function(x){return x.jenis==='garis';}); return [c('{{nama_yayasan}}').y,c('{{nama_yayasan}}').h,c('{{alamat}}\\n{{telepon}}').y,c('{{alamat}}\\n{{telepon}}').h,c('{{judul}}').h,c('No. {{nomor}}').y,c('No. {{nomor}}').h,g.y,c('Jumlah donasi').y,c('Jumlah donasi').h,c('{{jumlah}}').y,c('{{jumlah}}').h].join(',');})()") === "8,6,14,8,7,15,5,23.5,40.6,6,39.2,8.5");
    // Desain A4 dan A5 bawaan dipindah ke Slip; yang sudah diedit tidak disentuh; hanya sekali per browser
    await evalJs("(function(){var d=bacaCetakan().filter(function(c){return c.tipe!=='kuitansi-donasi';}); function baru(id,p){var x=Object.assign({id:id,nama:id,tipe:'kuitansi-donasi',html:''},JSON.parse(JSON.stringify(p))); x.elemen=elemenBawaan('kuitansi-donasi',x); return x;} var a4=baru('a4',kertasAwalCetakan), a5=baru('a5',KERTAS_BUKTI_BAWAAN), kosong=baru('kosong',kertasAwalCetakan), edit=baru('edit',KERTAS_BUKTI_BAWAAN); kosong.elemen=[]; edit.elemen[1].x=99; d.push(a4,a5,kosong,edit); modulCetakan.simpan(d); localStorage.removeItem(KUNCI_TANDA_TERIMA_SLIP); perbaruiTandaTerimaLama(); return true;})()");
    catat("Desain A4, A5, dan kosong pindah ke Slip; yang sudah diedit tidak disentuh", await evalJs("(function(){function k(i){return bacaCetakan().find(function(c){return c.id===i;}).kertas;} return k('a4')==='Slip' && k('a5')==='Slip' && k('kosong')==='Slip' && k('edit')==='A5';})()"));
    await evalJs("(function(){var d=bacaCetakan(); d.find(function(c){return c.id==='edit';}).kertas='A4'; d.find(function(c){return c.id==='edit';}).elemen=[]; modulCetakan.simpan(d); perbaruiTandaTerimaLama(); return true;})()");
    catat("Pemindahan hanya sekali per browser", await evalJs("bacaCetakan().find(function(c){return c.id==='edit';}).kertas==='A4'"));
    await evalJs("(function(){modulCetakan.simpan(bacaCetakan().filter(function(c){return c.tipe!=='kuitansi-donasi'||c.id==='a4';})); return true;})()");
    catat("Tipe di Desain Cetakan memakai nama baru", await evalJs("tipeCetakan['kuitansi-donasi']==='Tanda Terima Donasi' && !!tipeCetakan['bukti-pembayaran']"));
    // Hasil edit dipakai saat cetak
    await evalJs("(function(){var d=bacaCetakan(), c=d.find(function(x){return x.tipe==='kuitansi-donasi';}); c.elemen.forEach(function(e){if(e.jenis==='teks'&&(e.isi||'').indexOf('Terima kasih')===0){e.isi='Jazakumullah khairan';}}); modulCetakan.simpan(d); return true;})()");
    await cetak("Pencatatan Donasi");
    catat("Hasil edit desain dipakai saat mencetak", /Jazakumullah khairan/.test(await kertas()));
    // Pilihan desain
    await evalJs("(function(){var d=bacaCetakan(), c=d.find(function(x){return x.tipe==='kuitansi-donasi';}); var b=JSON.parse(JSON.stringify(c)); b.id='c2'; b.nama='Desain <b>Kedua</b>'; d.push(b); modulCetakan.simpan(d); return true;})()");
    const sebelum = await evalJs("window.__cetak");
    await cetak("Pencatatan Donasi");
    catat("Dua desain: muncul pilihan, kode HTML sebagai teks", await evalJs("document.getElementById('dialog-pilih-desain').open && document.querySelectorAll('#daftar-pilih-desain button').length===2 && !document.querySelector('#daftar-pilih-desain b')") && await evalJs("window.__cetak") === sebelum);
    await evalJs("document.querySelectorAll('#daftar-pilih-desain button')[1].click(); true"); await tunggu(200);
    catat("Memilih desain lalu mencetak", await evalJs("window.__cetak") === sebelum + 1 && await evalJs("!document.getElementById('dialog-pilih-desain').open"));
    // Editor
    await evalJs("bukaCetakanBaru(); modulCetakan.tampilkan('daftar'); bukaEditorCetakan(bacaCetakan().find(function(x){return x.tipe==='bukti-pembayaran';})); true"); await tunggu(300);
    catat("Editor membuka desain bawaan dengan Tabel Rincian", await evalJs("!!document.querySelector('#ec-halaman .el-tabel .tabel-cetak') && document.querySelector('#ec-halaman .tabel-cetak').textContent.indexOf('Akun')!==-1"));
    await evalJs("document.querySelector('[data-tambah=\"tabel\"]').click(); true"); await tunggu(150);
    catat("Tombol Tabel menambah elemen; panel Huruf tampil", await evalJs("document.querySelectorAll('#ec-halaman .el-tabel').length===2 && !document.getElementById('ec-gaya-teks').hidden"));
    await evalJs("document.getElementById('ec-tutup').click(); true"); await tunggu(150);
    await evalJs("var y=document.getElementById('ya-konfirmasi'); if(document.getElementById('dialog-konfirmasi').open){y.click();} true"); await tunggu(200);
    // Data rusak
    await evalJs("localStorage.setItem('daftarCetakan', JSON.stringify([null,{id:'c',tipe:'bukti-pembayaran',kertas:'Aneh',elemen:[null,5,{id:'e',jenis:'hilang'}]}])); (function(){var d=JSON.parse(localStorage.getItem('daftarPembayaran')); d.push({id:'rusak',nomor:5,rincian:'x',total:'y'}); localStorage.setItem('daftarPembayaran',JSON.stringify(d)); return true;})()");
    await muatUlang();
    await evalJs("window.__cetak=0; true");
    await buka("Pembayaran", "rusak"); await cetak("Pembayaran");
    catat("Data rusak tidak membuat macet", galat.length === 0, JSON.stringify(galat));
    // PDF sungguhan
    // PDF sungguhan: ukuran kertas dan jumlah halaman dibaca dari berkasnya
    await evalJs("localStorage.removeItem('daftarCetakan'); true");
    await buka("Pembayaran", "by1"); await cetak("Pembayaran");
    const r1 = await pdfMentah();
    catat("PDF Pembayaran: satu halaman, A5 mendatar", jumlahHalamanPdf(r1) === 1 && /MediaBox \[0 0 595\.\d+ 419\.\d+\]/.test(r1), (r1.match(/MediaBox \[[^\]]*\]/) || [""])[0]);
    await simpanPdf("cetak-pembayaran.pdf", r1);
    await buka("Pencatatan Donasi", "dn1"); await cetak("Pencatatan Donasi");
    const r3 = await pdfMentah();
    catat("PDF Tanda Terima: satu halaman 210 x 99 mm", jumlahHalamanPdf(r3) === 1 && /MediaBox \[0 0 595\.\d+ 280\.\d+\]/.test(r3), (r3.match(/MediaBox \[[^\]]*\]/) || [""])[0]);
    await simpanPdf("cetak-tanda-terima.pdf", r3);
    // Terbilang naik mengikuti jumlah baris: jaraknya dari baris terakhir kecil, tidak ada ruang kosong di tengah
    const t3 = posisiTeksPdf(r3), bBaris = t3.find(x => x.t === "Sedekah"), bTerbilang = t3.find(x => x.t.startsWith("Terbilang"));
    catat("Terbilang tepat di bawah rincian", bBaris && bTerbilang && (bBaris.y - bTerbilang.y) / 2.835 < 12, JSON.stringify([bBaris, bTerbilang]));
    catat("Semua teks di dalam kertas slip", t3.every(x => x.x >= 0 && x.x < 595.3 && x.y > 0 && x.y < 280.7), JSON.stringify(t3.filter(x => !(x.y > 0 && x.y < 280.7))));
    await buka("Pembayaran", "by2"); await cetak("Pembayaran");
    const r2 = await pdfMentah(), t2 = teksPdf(r2);
    catat("PDF 40 baris: berlanjut ke halaman berikutnya, semua baris ada, judul kolom diulang", jumlahHalamanPdf(r2) >= 2 && (t2.match(/Tagihan \d+/g) || []).length === 40 && (t2.match(/^Akun$/gm) || []).length >= 2, String(jumlahHalamanPdf(r2)));
    catat("PDF 40 baris: Terbilang sesudah baris terakhir", t2.indexOf("Terbilang") > t2.lastIndexOf("Tagihan"));
    await simpanPdf("cetak-banyak.pdf", r2);
    // Tombol Halaman Cetak
    await evalJs("document.getElementById('hcb-cetak').click(); true");
    catat("Chrome tidak mengizinkan cetak dari tombol: petunjuk ikon printer disorot", await evalJs("document.getElementById('hcb-petunjuk').classList.contains('hcb-sorot')"));
    await evalJs("window.__unduh=null; window.__unduhAsli=unduhTeks; unduhTeks=function(n,i,t){window.__unduh=[n,i.size,t]; return true;}; document.getElementById('hcb-unduh').click(); true");
    catat("Unduh PDF: nama berkas aman, tipe PDF", (await evalJs("JSON.stringify(window.__unduh)")).startsWith('["Pembayaran BKK-2.pdf",') && /application\/pdf/.test(await evalJs("JSON.stringify(window.__unduh)")), await evalJs("JSON.stringify(window.__unduh)"));
    await evalJs("unduhTeks=window.__unduhAsli; true");
    await evalJs("document.getElementById('hcb-tutup').click(); true"); await tunggu(150);
    catat("Tutup: halaman tertutup, PDF dilepas, formulir tetap terbuka", await evalJs("document.getElementById('halaman-cetak-bukti').hidden && dokumenCetak===null && !document.body.classList.contains('editor-terbuka') && JENIS_CETAK['Pembayaran'].modul().idDiubah==='by2'"));
    // Logo dan huruf Arab
    await evalJs("(function(){var k=document.createElement('canvas'); k.width=40; k.height=20; var a=k.getContext('2d'); a.fillStyle='#d00'; a.fillRect(0,0,40,20); var y=JSON.parse(localStorage.getItem('dataYayasan')); y.logo=k.toDataURL('image/png'); localStorage.setItem('dataYayasan',JSON.stringify(y)); var d=JSON.parse(localStorage.getItem('daftarDonatur')); d[0].nama='\\u0623\\u062d\\u0645\\u062f'; localStorage.setItem('daftarDonatur',JSON.stringify(d)); return true;})()");
    await buka("Pencatatan Donasi", "dn1"); await cetak("Pencatatan Donasi"); await tunggu(300);
    const r4 = await pdfMentah();
    catat("Logo ikut di PDF sebagai JPEG", /\/DCTDecode/.test(r4) && /\/G0 Do/.test(r4));
    catat("Huruf Arab ditulis tanda tanya, PDF tetap jadi", /\?\?\?\?/.test(teksPdf(r4)), teksPdf(r4).slice(0, 200));
    // PDF utuh: tabel posisi menunjuk objek yang benar
    catat("Tabel posisi PDF benar", await evalJs("(function(){return true;})()") && (() => { const x = Number(/startxref\n(\d+)/.exec(r4)[1]); const baris = r4.slice(x).split("\n"); const n = Number(baris[1].split(" ")[1]); for (let i = 1; i < n; i++) { const p = Number(baris[2 + i].slice(0, 10)); if (!r4.startsWith(i + " 0 obj", p)) { return false; } } return true; })());
    // Cetak daftar: PDF berisi semua baris yang tampil, memakai Halaman Cetak yang sama
    await evalJs("document.getElementById('hcb-tutup').click(); window.__printHalaman=0; window.print=function(){window.__printHalaman++;}; bukaTab('jurnal'); modulJurnal.gambarTabel(); modulJurnal.tampilkan('daftar'); true"); await tunggu(200);
    await evalJs("[...document.querySelectorAll('[data-alat=\"cetak\"]')].find(function(b){return b.offsetParent;}).click(); true"); await tunggu(200);
    const rd = await pdfMentah(), td = teksPdf(rd);
    catat("Cetak daftar: judul, baris, nomor halaman, tanpa jendela browser", /^Daftar /.test(td) && /Halaman 1 dari 1/.test(td) && /JV-1/.test(td) && await evalJs("window.__printHalaman===0 && !document.getElementById('halaman-cetak-bukti').hidden"), td.slice(0, 200));
    await evalJs("document.getElementById('hcb-tutup').click(); true");
    // Banyak kolom memakai kertas mendatar; banyak baris berlanjut ke halaman berikutnya
    const rdk = await evalJs("susunPdfDaftar('Uji',['A','B','C','D','E','F'],Array.from({length:120},function(x,i){return ['a'+i,'b','c','d','e','1.000'];})).blob().arrayBuffer().then(function(b){var u=new Uint8Array(b),s=''; for(var i=0;i<u.length;i++){s+=String.fromCharCode(u[i]);} return s;})");
    catat("Daftar 6 kolom 120 baris: A4 mendatar, beberapa halaman, judul kolom diulang", /MediaBox \[0 0 841\.\d+ 595\.\d+\]/.test(rdk) && jumlahHalamanPdf(rdk) >= 2 && (teksPdf(rdk).match(/^F$/gm) || []).length === jumlahHalamanPdf(rdk) && /a119/.test(teksPdf(rdk)), String(jumlahHalamanPdf(rdk)));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack + "\nGalat halaman: " + JSON.stringify(galat)); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
