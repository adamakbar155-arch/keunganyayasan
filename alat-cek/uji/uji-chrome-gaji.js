// Uji formulir Pencatatan Gaji di Chrome asli (skema A, PRD 3.3, 6.2): popup Rincian Karyawan dan hitungannya,
// pemeriksaan saat Simpan, simpan TANPA jurnal, ubah, karyawan dobel per periode, nomor kembar, hapus, dan karyawan yang
// sudah dipakai tidak bisa dihapus. Proses > Gaji dan pembayarannya diuji di uji-chrome-bayar-gaji.js.
// Pemakaian: node uji-chrome-gaji.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9369;
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
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    // Data contoh (bukan data asli)
    await evalJs(`(function(){ localStorage.clear();
      localStorage.setItem('daftarAkun', JSON.stringify([{id:'a1',kode:'110101',nama:'Kas Kecil',tipe:'kas-bank',saldoAwal:0},{id:'a4',kode:'610101',nama:'Beban Gaji',tipe:'beban',saldoAwal:0}]));
      localStorage.setItem('daftarPenomoran', JSON.stringify([{id:'g1',nama:'Pencatatan Gaji',pembukuan:'yayasan',tipe:'gaji',digit:4,komponen:[{jenis:'teks',nilai:'GJ-'},{jenis:'counter'}]}]));
      localStorage.setItem('daftarKaryawan', JSON.stringify([{id:'k1',nama:'Gunawan',nomor:'P-001',jabatan:'Ketua'},{id:'k2',nama:'Ani Lestari',nomor:'P-002',jabatan:'Guru'}]));
      localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'}]));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const ketik = (x) => kirim("Input.insertText", { text: x });
    const tombol = async (key, code, vk) => { await kirim("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk }); };
    const gajiTersimpan = () => evalJs("JSON.parse(localStorage.getItem('daftarPencatatanGaji')||'[]')");
    const galatTeks = () => evalJs("document.getElementById('pgaji-pesan-galat').hidden ? '' : document.getElementById('pgaji-pesan-galat').textContent");
    const isiKolom = (id, v) => evalJs("(function(){var e=document.getElementById('" + id + "'); e.value='" + v + "'; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return true;})()");
    const simpan = async () => { await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true"); await klik("#pgaji-simpan"); await tunggu(500); };
    // Kepala Pencatatan Gaji diisi seperti pengguna (Data Baru dibuka kosong, PRD 5.3a)
    const isiKepalaGaji = () => evalJs("(function(){var h=tanggalHariIni(); function isi(id,v){var e=document.getElementById(id); e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));} isi('pgaji-tipe','bulanan'); isi('pgaji-bulan',String(Number(h.slice(5,7)))); isi('pgaji-tahun',h.slice(0,4)); isi('pgaji-tanggal',h); isi('pgaji-jatuh-tempo',h); isi('pgaji-aturan-nomor','g1'); return true;})()");
    async function pilihKaryawan(kata) { await klik("#pgaji-cari-karyawan"); await ketik(kata); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(400); }

    // 1) Buka dari popup Buku Besar
    await klik("#tombol-buku-besar"); await tunggu(300);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Pencatatan Gaji"]'); await tunggu(500);
    catat("Pencatatan Gaji terbuka kosong (PRD 5.3a): Tipe, Bulan, Tahun, Tanggal, Jatuh Tempo, aturan nomor, Akun Beban belum terisi", await evalJs("!document.getElementById('isi-pgaji').hidden && ['pgaji-tipe','pgaji-bulan','pgaji-tahun','pgaji-tanggal','pgaji-jatuh-tempo','pgaji-aturan-nomor','pgaji-beban'].every(function(id){return document.getElementById(id).value==='';}) && document.getElementById('pgaji-contoh-nomor').textContent==='Pilih aturan penomoran.'"), await evalJs("JSON.stringify(['pgaji-tipe','pgaji-bulan','pgaji-tahun','pgaji-tanggal','pgaji-jatuh-tempo','pgaji-aturan-nomor','pgaji-beban'].map(function(id){return document.getElementById(id).value;}))"));
    await simpan();
    catat("Simpan formulir kosong: ditolak 'Tipe Pembayaran wajib dipilih', tidak tersimpan", /Tipe Pembayaran wajib dipilih/.test(await galatTeks()) && (await gajiTersimpan()).length === 0, await galatTeks());
    await isiKepalaGaji();
    catat("Kepala diisi: nomor berikutnya GJ-0001", await evalJs("document.getElementById('pgaji-contoh-nomor').textContent==='Nomor berikutnya: GJ-0001'"), await evalJs("document.getElementById('pgaji-contoh-nomor').textContent"));
    // 2) Simpan tanpa karyawan ditolak
    await simpan();
    catat("Simpan tanpa karyawan: ditolak 'Rincian Karyawan masih kosong', tidak tersimpan", /Rincian Karyawan masih kosong/.test(await galatTeks()) && (await gajiTersimpan()).length === 0, await galatTeks());
    // 3) Popup Rincian Karyawan dan hitungannya
    await pilihKaryawan("gun");
    catat("Pilih Gunawan: popup terbuka dengan nama dan [Ketua], kursor di Gaji Pokok, 6 komponen (4 pendapatan, 2 potongan)", await evalJs("document.getElementById('dialog-rincian-gaji').open && document.getElementById('rgaji-nama').textContent==='Gunawan' && document.getElementById('rgaji-jabatan').textContent==='[Ketua]' && document.activeElement.id==='rgaji-gajiPokok' && document.querySelectorAll('#rgaji-pendapatan input').length===4 && document.querySelectorAll('#rgaji-potongan input').length===2"));
    await ketik("3000000"); await klik("#rgaji-tunjJabatan"); await ketik("500000"); await klik("#rgaji-iuran"); await ketik("50000"); await tunggu(150);
    catat("Gaji dibayarkan dihitung langsung: 3.000.000 + 500.000 − 50.000 = 3.450.000", /3\.450\.000/.test(await evalJs("document.getElementById('rgaji-dibayarkan').value")), await evalJs("document.getElementById('rgaji-dibayarkan').value"));
    await foto("gaji-popup.png");
    await klik("#lanjut-rincian-gaji"); await tunggu(400);
    await pilihKaryawan("ani"); await ketik("2000000"); await tombol("Enter", "Enter", 13); await tunggu(400);
    catat("Dua baris karyawan di tabel; total dibayarkan 5.450.000", await evalJs("document.querySelectorAll('#pgaji-rincian tr.jurnal-baris-data').length===2 && /5\\.450\\.000/.test(document.getElementById('pgaji-total-bayar').textContent)"), await evalJs("document.getElementById('pgaji-total-bayar').textContent"));
    // 4) Potongan lebih besar dari pendapatan ditolak
    await klik("#pgaji-rincian tr.jurnal-baris-data:nth-child(2)"); await tunggu(400);
    await isiKolom("rgaji-pengurangan", "2500000"); await klik("#lanjut-rincian-gaji"); await tunggu(300);
    await simpan();
    catat("Ani: potongan 2.500.000 > pendapatan 2.000.000 -> Simpan ditolak 'kurang dari nol'", /Ani Lestari kurang dari nol/.test(await galatTeks()) && (await gajiTersimpan()).length === 0, await galatTeks());
    await klik("#pgaji-rincian tr.jurnal-baris-data:nth-child(2)"); await tunggu(400);
    await isiKolom("rgaji-pengurangan", "0"); await klik("#lanjut-rincian-gaji"); await tunggu(300);
    // 5) Akun Beban Gaji wajib
    await isiKolom("pgaji-beban", "");
    await simpan();
    catat("Akun Beban Gaji kosong: ditolak dan tab Info lainnya terbuka", /Akun Beban Gaji wajib dipilih/.test(await galatTeks()) && await evalJs("!document.getElementById('pgaji-panel-info').hidden"), await galatTeks());
    await isiKolom("pgaji-beban", "a4");
    // 6) Simpan: tersimpan tanpa jurnal
    await simpan();
    const g = await gajiTersimpan(), g0 = g[0] || {};
    catat("Simpan: GJ-0001 tersimpan (2 karyawan, bruto 5.500.000, potongan 50.000, dibayarkan 5.450.000, Beban Gaji a4)", g.length === 1 && g0.nomor === "GJ-0001" && g0.jumlahKaryawan === 2 && g0.totalBruto === 5500000 && g0.totalPotongan === 50000 && g0.totalDibayarkan === 5450000 && g0.akunBebanId === "a4", JSON.stringify({ n: g0.nomor, b: g0.totalBruto, p: g0.totalPotongan, d: g0.totalDibayarkan }));
    catat("Menyimpan gaji TIDAK membuat jurnal (jurnal dibuat saat dibayar lewat Pembayaran)", (await evalJs("JSON.parse(localStorage.getItem('daftarJurnal')||'[]').length")) === 0);
    catat("Log Aktivitas: Buat Pencatatan Gaji GJ-0001", await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(l){return l.tipe==='Pencatatan Gaji' && l.tindakan==='Buat' && l.referensi==='GJ-0001';})"));
    // 7) Karyawan yang sama di periode dan tipe yang sama ditolak
    await evalJs("modulPgaji.bukaBaruKosong(); if(document.getElementById('dialog-konfirmasi').open){document.getElementById('ya-konfirmasi').click();} true"); await tunggu(300); await isiKepalaGaji(); await tunggu(150);
    await pilihKaryawan("gun"); await ketik("1000000"); await tombol("Enter", "Enter", 13); await tunggu(400);
    await isiKolom("pgaji-beban", "a4");
    await simpan();
    catat("Gunawan dicatat lagi untuk periode dan tipe yang sama: ditolak 'sudah tercatat di Pencatatan Gaji GJ-0001'", /Gunawan sudah tercatat di Pencatatan Gaji GJ-0001/.test(await galatTeks()) && (await gajiTersimpan()).length === 1, await galatTeks());
    // 8) Ubah: nilai Gunawan jadi 3.100.000
    await evalJs("modulPgaji.bukaUbah(JSON.parse(localStorage.getItem('daftarPencatatanGaji'))[0]); true"); await tunggu(400);
    await klik("#pgaji-rincian tr.jurnal-baris-data"); await tunggu(400);
    await isiKolom("rgaji-gajiPokok", "3100000"); await klik("#lanjut-rincian-gaji"); await tunggu(300);
    await simpan();
    const gu = await gajiTersimpan();
    catat("Ubah gaji pokok Gunawan jadi 3.100.000: tetap 1 pencatatan, dibayarkan 5.550.000; Log 'Ubah'", gu.length === 1 && gu[0].totalDibayarkan === 5550000 && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(l){return l.tipe==='Pencatatan Gaji' && l.tindakan==='Ubah';})"), JSON.stringify(gu.map(x => x.totalDibayarkan)));
    // 9) Karyawan yang sudah dipakai tidak bisa dihapus di Master Data
    await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); modulKaryawan.hapus(modulKaryawan.ambil().find(function(k){return k.id==='k1';})); true"); await tunggu(300);
    catat("Master Data: hapus Karyawan Gunawan (sudah dipakai) ditolak 'sudah tercatat di 1 pencatatan gaji'", /sudah tercatat di 1 pencatatan gaji/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && !(await evalJs("dialogKonfirmasi.open")));
    // 10) Hapus pencatatan
    await evalJs("modulPgaji.hapus(JSON.parse(localStorage.getItem('daftarPencatatanGaji'))[0]); true"); await tunggu(300); await klik("#ya-konfirmasi"); await tunggu(400);
    catat("Hapus GJ-0001: pencatatan hilang; Log 'Hapus'", (await gajiTersimpan()).length === 0 && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(l){return l.tipe==='Pencatatan Gaji' && l.tindakan==='Hapus';})"));
    // 11) Data rusak
    await evalJs("localStorage.setItem('daftarPencatatanGaji','{rusak'); true"); await kirim("Page.reload");
    // Menunggu sampai aplikasi selesai dimuat (skrip terakhir dashboard.js), bukan waktu tetap
    for (let i = 0; i < 60; i++) { await tunggu(200); try { if (await evalJs("document.readyState==='complete' && typeof gambarDashboard==='function'")) { break; } } catch (e) { /* halaman masih berganti */ } }
    await klik("#tombol-buku-besar"); await tunggu(300); await klik('#panel-buku-besar .kotak-menu[data-halaman="Pencatatan Gaji"]'); await tunggu(400);
    await klik("#isi-pgaji .tombol-daftar"); await tunggu(300);
    catat("Data Pencatatan Gaji rusak: halaman dan daftar tetap terbuka", await evalJs("!document.getElementById('isi-pgaji').hidden"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
