// Uji Pemindahan Dana (D1.7) di Chrome asli. Pemakaian: node uji-chrome-pemindahan-dana.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9387;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
const tombol = async (key, code, kode) => { await kirim("Input.dispatchKeyEvent", { type: "rawKeyDown", key, code, windowsVirtualKeyCode: kode }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: kode }); };
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
    // ===== D1.7 bagian 2 (rancangan baru 2026-10-29): Pemindahan Dana hanya ke Dana Umum, uangnya ikut pindah =====
    // Data contoh (bukan data asli). Kas bertingkat 3 (Aset > Kas & Bank > Kas ...), supaya muncul di pilihan Kas/Bank.
    // Ramadhan (Selesai, Divisi Sosial): pendapatan 2.000.000 (10 Mar), beban 500.000 (20 Mar) -> sisa 1.500.000
    await evalJs(`(function(){ localStorage.clear();
      localStorage.setItem('daftarAkun', JSON.stringify([
        {id:'i1',kode:'11',nama:'Aset Lancar',tipe:'kas-bank',indukId:'',saldoAwal:0},
        {id:'i2',kode:'1101',nama:'Kas & Bank',tipe:'kas-bank',indukId:'i1',saldoAwal:0},
        {id:'k1',kode:'110101',nama:'Kas Divisi Sosial',tipe:'kas-bank',indukId:'i2',saldoAwal:0},
        {id:'k2',kode:'110102',nama:'Kas Dana Umum',tipe:'kas-bank',indukId:'i2',saldoAwal:0},
        {id:'p1a',kode:'410101',nama:'Donasi',tipe:'pendapatan',indukId:'',saldoAwal:0},
        {id:'b1a',kode:'610101',nama:'Beban Kegiatan',tipe:'beban',indukId:'',saldoAwal:0},
        {id:'m1',kode:'310101',nama:'Aset Neto Tidak Terikat',tipe:'modal',indukId:'',saldoAwal:0},
        {id:'m2',kode:'310102',nama:'Aset Neto Terikat',tipe:'modal',indukId:'',saldoAwal:0}]));
      localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'},{id:'d2',nama:'Sosial'}]));
      localStorage.setItem('daftarProgram', JSON.stringify([
        {id:'pr1',nama:'Ramadhan 1447 H',divisiId:'d2',status:'selesai'},
        {id:'pr2',nama:'Beasiswa',divisiId:'d1',status:'aktif'},
        {id:'pr5',nama:'<img src=x onerror=alert(1)>',divisiId:'d1',status:'aktif'}]));
      localStorage.setItem('daftarJurnal', JSON.stringify([
        {id:'j1',nomor:'J-1',tanggal:'2026-03-10',keterangan:'',rincian:[{akunId:'k1',debit:2000000,kredit:0},{akunId:'p1a',debit:0,kredit:2000000,programId:'pr1',divisiId:'d2'}]},
        {id:'j2',nomor:'J-2',tanggal:'2026-03-20',keterangan:'',rincian:[{akunId:'b1a',debit:500000,kredit:0,programId:'pr1',divisiId:'d2'},{akunId:'k1',debit:0,kredit:500000}]}]));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const bersihNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    const ubahNilai = (id, nilai) => evalJs("(function(){var e=document.getElementById('" + id + "'); e.value=" + JSON.stringify(nilai) + "; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return true;})()");
    const sisaTeks = () => evalJs("document.getElementById('pd-sisa').hidden ? '' : document.getElementById('pd-sisa').textContent");
    const opsiTujuan = async () => { await evalJs("(function(){var k=document.getElementById('pd-cari-tujuan'); k.value=''; k.focus(); k.click(); return true;})()"); await tunggu(150); return evalJs("[...document.querySelectorAll('#pd-daftar-tujuan .jurnal-pilihan-akun .jurnal-pilihan-nama')].map(function(e){return e.textContent;}).join('|')"); };
    const klikTujuan = async (nama) => { await opsiTujuan(); const i = await evalJs("[...document.querySelectorAll('#pd-daftar-tujuan .jurnal-pilihan-akun')].findIndex(function(li){return li.querySelector('.jurnal-pilihan-nama').textContent===" + JSON.stringify(nama) + ";})"); await klik("#pd-daftar-tujuan .jurnal-pilihan-akun:nth-child(" + (i + 1) + ")"); await tunggu(250); };
    const barisTabel = () => evalJs("[...document.querySelectorAll('#pd-rincian tr.jurnal-baris-data')].map(function(tr){return [...tr.cells].slice(1,4).map(function(td){return td.textContent.trim();}).join('|');})");
    const popupBuka = () => evalJs("document.getElementById('dialog-tujuan-pemindahan').open");
    // 1) Buka dari popup Donasi; susunan bagian atas yang dirapikan
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Pemindahan Dana"]'); await tunggu(500);
    catat("Popup Donasi > Pemindahan Dana: tab 'Pemindahan Dana' terbuka di Data Baru", await evalJs("!document.getElementById('isi-pemindahan-dana').hidden && !document.getElementById('tab-pemindahan-dana').hidden"));
    const susunan = await evalJs("JSON.stringify([...document.querySelectorAll('#isi-pemindahan-dana .kepala-pd .jurnal-kepala-kolom')].map(function(k){return [...k.querySelectorAll(':scope > .jurnal-baris > label')].map(function(l){return l.textContent.replace('*','').trim();});}))");
    catat("Bagian atas dalam satu kotak: kiri Jenis, Dari Program, Ambil dari, Nilai Pemindahan; kanan No Bukti #, Tanggal", susunan === JSON.stringify([["Jenis", "Dari Program", "Ambil dari", "Nilai Pemindahan"], ["No Bukti #", "Tanggal"]]) && await evalJs("getComputedStyle(document.querySelector('#isi-pemindahan-dana .kepala-pd')).borderTopStyle==='solid'"), susunan);
    catat("Rapi: label kiri dan kanan sama lebar (150px) dan sejajar; kolom isian kiri sama lebar", await evalJs("(function(){var l=[...document.querySelectorAll('#isi-pemindahan-dana .kepala-pd .jurnal-baris > label')]; var lebar=l.map(function(x){return Math.round(x.getBoundingClientRect().width);}); var kiri=[...document.querySelectorAll('#isi-pemindahan-dana .kepala-pd .jurnal-kepala-kolom')[0].querySelectorAll(':scope > .jurnal-baris > :nth-child(2)')].map(function(x){return Math.round(x.getBoundingClientRect().width);}); return lebar.every(function(w){return w===150;}) && kiri.every(function(w){return w===kiri[0];});})()"), await evalJs("JSON.stringify([...document.querySelectorAll('#isi-pemindahan-dana .kepala-pd .jurnal-kepala-kolom')[0].querySelectorAll(':scope > .jurnal-baris > :nth-child(2)')].map(function(x){return Math.round(x.getBoundingClientRect().width);}))"));
    catat("Nilai Pemindahan hanya dibaca dan awalnya 0; Tanggal hari ini; No Bukti Otomatis; Total Rp 0", await evalJs("document.getElementById('pd-nilai').readOnly && document.getElementById('pd-nilai').value==='0' && document.getElementById('pd-tanggal').value===tanggalHariIni() && document.getElementById('pd-nomor-otomatis').checked && document.getElementById('pd-total').textContent==='Rp 0'"));
    const opsiDari = await evalJs("[...document.getElementById('pd-dari').options].map(function(o){return o.textContent;}).join('|')");
    catat("Pilihan Dari Program: semua Program, yang Selesai bertanda '(Selesai)'", opsiDari === "Pilih Program...|Ramadhan 1447 H (Selesai)|Beasiswa|<img src=x onerror=alert(1)>", opsiDari);
    const opsiKas = await evalJs("[...document.getElementById('pd-kas-asal').options].map(function(o){return o.textContent;}).join('|')");
    catat("Pilihan Ambil dari: akun Kas & Bank tingkat 3", /Kas Divisi Sosial/.test(opsiKas) && /Kas Dana Umum/.test(opsiKas) && !/Aset Lancar|Kas & Bank\b(?! Kas)/.test(opsiKas.replace(/Pilih Kas\/Bank\.\.\./, "")), opsiKas);
    catat("Tab 'i' berisi Alasan dan tersembunyi saat formulir dibuka (mulai di tab Tujuan)", await evalJs("!!document.getElementById('pd-alasan').closest('#pd-panel-info') && document.getElementById('pd-panel-info').hidden && !document.getElementById('pd-panel-tujuan').hidden"));
    // 2) Pengaman urutan isian (PRD 5.1): kolom cari tujuan tidak terbuka sebelum isian atas terisi
    const cobaBukaTujuan = async () => { await bersihNotif(); await evalJs("document.getElementById('pd-cari-tujuan').blur(); true"); await klik("#pd-cari-tujuan"); await tunggu(200); };
    await cobaBukaTujuan();
    catat("Klik kolom cari tujuan sebelum Dari Program dipilih: daftar tidak terbuka, peringatan 'Pilih Dari Program dulu sebelum memilih tujuan.', kursor pindah ke Dari Program", await evalJs("document.getElementById('pd-daftar-tujuan').hidden && !document.getElementById('dialog-tujuan-pemindahan').open") && /Pilih Dari Program dulu sebelum memilih tujuan\./.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && /pd-dari/.test(await evalJs("document.activeElement.id")), await evalJs("document.activeElement.id"));
    await ubahNilai("pd-dari", "pr1"); await tunggu(1100); await cobaBukaTujuan();   // peringatan yang sama tidak diulang dalam 1 detik
    catat("Dari Program terisi, Ambil dari belum: peringatan 'Pilih Ambil dari dulu', daftar tetap tertutup", await evalJs("document.getElementById('pd-daftar-tujuan').hidden") && /Pilih Ambil dari dulu sebelum memilih tujuan\./.test(await evalJs("document.getElementById('area-notifikasi').textContent")));
    await ubahNilai("pd-dari", ""); await tombol("Escape", "Escape", 27); await tunggu(100); await bersihNotif();
    // 3) Pilih Program asal dan Ambil dari: sisa dana tampil per tanggal
    await ubahNilai("pd-tanggal", "2026-10-29");
    await ubahNilai("pd-dari", "pr1"); await tunggu(150);
    catat("Pilih Ramadhan (Selesai): 'Sisa yang bisa dipindah mulai 29 Okt 2026: Rp 1.500.000'", /^Sisa yang bisa dipindah mulai 29 Okt 2026: Rp\s?1\.500\.000$/.test(await sisaTeks()), await sisaTeks());
    await ubahNilai("pd-tanggal", "2026-03-15"); await tunggu(150);
    catat("Tanggal 15 Mar 2026 (sebelum beban 20 Mar): sisa yang bisa dipindah tetap Rp 1.500.000 (sisa terendah ke depan, Temuan 28)", /mulai 15 Mar 2026: Rp\s?1\.500\.000$/.test(await sisaTeks()), await sisaTeks());
    await ubahNilai("pd-tanggal", "2026-10-29"); await tunggu(150);
    await ubahNilai("pd-kas-asal", "k1");
    // 4) Tujuan: pilihan Kas/Bank, popup, Semua sisa
    const ot = await opsiTujuan();
    catat("Kolom cari tujuan berisi pilihan Kas/Bank (Kas Divisi Sosial, Kas Dana Umum)", ot === "Kas Divisi Sosial|Kas Dana Umum", ot);
    await tombol("Escape", "Escape", 27); await tunggu(100);
    await klikTujuan("Kas Dana Umum");
    catat("Pilih Kas Dana Umum: popup terbuka; Ke 'Dana Umum' dan Kas/Bank '[110102] Kas Dana Umum' hanya dibaca; kursor di Nilai", await popupBuka() && await evalJs("document.getElementById('tpd-ke').value==='Dana Umum' && document.getElementById('baris-tpd-divisi').hidden && document.getElementById('tpd-kas').value==='[110102] Kas Dana Umum' && document.getElementById('tpd-ke').readOnly && document.getElementById('tpd-kas').readOnly && document.activeElement.id==='tpd-nilai' && document.getElementById('hapus-tujuan-pemindahan').hidden"));
    await klik("#lanjut-tujuan-pemindahan"); await tunggu(150);
    catat("Lanjut dengan Nilai kosong: ditolak 'Nilai wajib diisi', popup tetap", await popupBuka() && await evalJs("/Nilai wajib diisi/.test(document.getElementById('galat-tpd-nilai').textContent) && !document.getElementById('galat-tpd-nilai').hidden"));
    await klik("#tpd-semua-sisa"); await tunggu(150);
    catat("Klik Semua sisa: Nilai terisi seluruh sisa 1.500.000, pesan salah hilang", await evalJs("document.getElementById('tpd-nilai').value==='1.500.000' && document.getElementById('galat-tpd-nilai').hidden"));
    await foto("pemindahan-dana-popup.png");
    await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    catat("Lanjut: satu baris 'Dana Umum (milik yayasan) | [110102] Kas Dana Umum | 1.500.000'", !(await popupBuka()) && JSON.stringify(await barisTabel()) === JSON.stringify(["Dana Umummilik yayasan|[110102] Kas Dana Umum|1.500.000"]), JSON.stringify(await barisTabel()));
    catat("Nilai Pemindahan di atas muncul 1.500.000, Total Rp 1.500.000", await evalJs("document.getElementById('pd-nilai').value==='1.500.000' && document.getElementById('pd-total').textContent==='Rp 1.500.000'"));
    await foto("pemindahan-dana-form.png");
    // 5) Ubah nilai lewat klik baris (sebagian), lalu ganti Kas/Bank tujuan
    await klik("#pd-rincian tr.jurnal-baris-data"); await tunggu(250);
    catat("Klik baris: popup terbuka untuk mengubah, Nilai 1.500.000, tombol Hapus tampil", await popupBuka() && await evalJs("document.getElementById('tpd-nilai').value==='1.500.000' && !document.getElementById('hapus-tujuan-pemindahan').hidden"));
    await ubahNilai("tpd-nilai", "800000"); await tombol("Enter", "Enter", 13); await tunggu(250);
    catat("Ubah jadi 800.000 (Enter = Lanjut): tetap satu baris, Nilai Pemindahan 800.000", JSON.stringify(await barisTabel()) === JSON.stringify(["Dana Umummilik yayasan|[110102] Kas Dana Umum|800.000"]) && await evalJs("document.getElementById('pd-nilai').value==='800.000'"), JSON.stringify(await barisTabel()));
    await klikTujuan("Kas Divisi Sosial");
    catat("Memilih Kas/Bank lain: popup membawa nilai 800.000", await popupBuka() && await evalJs("document.getElementById('tpd-kas').value==='[110101] Kas Divisi Sosial' && document.getElementById('tpd-nilai').value==='800.000'"));
    await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    catat("Lanjut: tujuan diganti (tetap satu baris) ke Kas Divisi Sosial", JSON.stringify(await barisTabel()) === JSON.stringify(["Dana Umummilik yayasan|[110101] Kas Divisi Sosial|800.000"]), JSON.stringify(await barisTabel()));
    await klik("#pd-rincian tr.jurnal-baris-data .jurnal-hapus-baris"); await tunggu(200);
    catat("Tombol ✕: tujuan terhapus, tabel 'Belum ada data', Nilai Pemindahan 0, Total Rp 0", (await barisTabel()).length === 0 && await evalJs("/Belum ada data/.test(document.getElementById('pd-rincian').textContent) && document.getElementById('pd-nilai').value==='0' && document.getElementById('pd-total').textContent==='Rp 0'"));
    // 6) Tab i: Alasan
    await klik('#isi-pemindahan-dana [data-pd-tab="info"]'); await tunggu(150);
    catat("Klik tab 'i': panel Info lainnya dengan Alasan tampil, tabel tujuan tersembunyi", await evalJs("!document.getElementById('pd-panel-info').hidden && document.getElementById('pd-panel-tujuan').hidden"));
    await klik('#isi-pemindahan-dana [data-pd-tab="tujuan"]'); await tunggu(150);
    // ===== D1.7 bagian 3: simpan, ubah, hapus, dan jurnal otomatis =====
    const simpanPd = async () => { await bersihNotif(); await evalJs("document.getElementById('form-pemindahan-dana').requestSubmit(); true"); await tunggu(350); };
    const galatPd = () => evalJs("document.getElementById('pd-pesan-galat').hidden ? '' : document.getElementById('pd-pesan-galat').textContent");
    const notifPd = () => evalJs("document.getElementById('area-notifikasi').textContent");
    const jumlahPd = () => evalJs("JSON.parse(localStorage.getItem('daftarPemindahanDana')||'[]').length");
    const jurnalPd = () => evalJs("JSON.stringify(JSON.parse(localStorage.getItem('daftarJurnal')).filter(function(j){return j.sumber && j.sumber.jenis==='pemindahan';}))").then(JSON.parse);
    // Nomor diketik sendiri (belum ada aturan penomoran Pemindahan Dana)
    const nomorManual = async (nomor) => { if (await evalJs("document.getElementById('pd-nomor-otomatis').checked")) { await klik("#pd-nomor-otomatis"); await tunggu(150); } await ubahNilai("pd-nomor", nomor); };
    await nomorManual("PD-0001");
    await simpanPd();
    catat("Simpan tanpa tujuan: ditolak 'Tujuan masih kosong', tidak tersimpan", /Tujuan masih kosong/.test(await galatPd()) && (await jumlahPd()) === 0, await galatPd());
    await klikTujuan("Kas Dana Umum"); await klik("#tpd-semua-sisa"); await tunggu(100); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await simpanPd();
    catat("Tanpa Alasan: ditolak 'Alasan wajib diisi', tab 'i' terbuka sendiri dan kursor di Alasan", /Alasan wajib diisi/.test(await galatPd()) && await evalJs("!document.getElementById('pd-panel-info').hidden && document.activeElement.id==='pd-alasan'") && (await jumlahPd()) === 0, await galatPd());
    await ubahNilai("pd-alasan", "  Kegiatan Ramadhan selesai, sisa ke Dana Umum  ");
    await simpanPd();
    catat("Akun Aset Neto belum dipilih di Preferensi: ditolak dengan pesan yang menunjuk ke Preferensi, Akun Perkiraan, tab Aset Neto", /Preferensi, Akun Perkiraan, tab Aset Neto/.test(await galatPd()) && (await jumlahPd()) === 0, await galatPd());
    await evalJs("localStorage.setItem('akunPerkiraanYayasan', JSON.stringify({asetNetoTerikat:['310102'], asetNetoTidakTerikat:['310101']})); true");
    // Melebihi sisa dana: ditolak lewat notifikasi pojok kanan
    await klik('#isi-pemindahan-dana [data-pd-tab="tujuan"]'); await tunggu(150);
    await klik("#pd-rincian tr.jurnal-baris-data"); await tunggu(250); await ubahNilai("tpd-nilai", "2000000"); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await simpanPd();
    catat("Nilai 2.000.000 melebihi sisa 1.500.000: ditolak lewat notifikasi 'melebihi sisa yang bisa dipindah dari dana Program \"Ramadhan 1447 H\" mulai 29 Okt 2026, yaitu Rp 1.500.000', tidak tersimpan", /Rp\s?2\.000\.000 melebihi sisa yang bisa dipindah dari dana Program "Ramadhan 1447 H" mulai 29 Okt 2026, yaitu Rp\s?1\.500\.000/.test(await notifPd()) && (await jumlahPd()) === 0, await notifPd());
    await klik("#pd-rincian tr.jurnal-baris-data"); await tunggu(250); await klik("#tpd-semua-sisa"); await tunggu(100); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await simpanPd();
    const d1 = await evalJs("JSON.stringify(JSON.parse(localStorage.getItem('daftarPemindahanDana'))[0]||{})").then(JSON.parse);
    catat("Simpan berhasil: tersimpan {nomor PD-0001, tanggal, dariProgramId pr1, kasAsal k1, kasTujuan k2 (dengan nama), nilai 1.500.000, alasan tanpa spasi tepi}", (await jumlahPd()) === 1 && d1.nomor === "PD-0001" && d1.tanggal === "2026-10-29" && d1.dariProgramId === "pr1" && d1.kasAsalId === "k1" && d1.kasAsal === "110101 - Kas Divisi Sosial" && d1.kasTujuanId === "k2" && d1.kasTujuan === "110102 - Kas Dana Umum" && d1.nilai === 1500000 && d1.alasan === "Kegiatan Ramadhan selesai, sisa ke Dana Umum", JSON.stringify(d1));
    catat("Notifikasi berhasil + Log 'Buat Pemindahan Dana PD-0001'", /Pemindahan Dana telah berhasil disimpan/.test(await notifPd()) && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Buat'&&x.tipe==='Pemindahan Dana'&&x.referensi==='PD-0001';})"));
    let jr = await jurnalPd();
    const barisJr = (j) => j.rincian.map(r => [r.akunId, r.debit, r.kredit, r.programId || "", r.divisiId || ""].join(":")).join(" | ");
    catat("Jurnal otomatis: Debit Aset Neto Terikat [Ramadhan, Sosial] / Kredit Aset Neto Tidak Terikat [tanpa Program, tanpa Divisi = Dana Umum] / Debit Kas Dana Umum / Kredit Kas Divisi Sosial, masing-masing 1.500.000; nomor dan tanggal sama", jr.length === 1 && barisJr(jr[0]) === "m2:1500000:0:pr1:d2 | m1:0:1500000:: | k2:1500000:0:: | k1:0:1500000::" && jr[0].nomor === "PD-0001" && jr[0].tanggal === "2026-10-29", jr.length ? barisJr(jr[0]) : "tidak ada jurnal");
    catat("Sesudah disimpan: sisa dana Ramadhan per 29 Okt 2026 jadi 0", (await evalJs("sisaDanaProgram('pr1','2026-10-29')")) === 0, await evalJs("sisaDanaProgram('pr1','2026-10-29')"));
    catat("Formulir kosong lagi untuk pemindahan berikutnya (tujuan kosong, Nilai Pemindahan 0)", await evalJs("document.getElementById('pd-dari').value==='' && document.getElementById('pd-nilai').value==='0' && document.querySelectorAll('#pd-rincian tr.jurnal-baris-data').length===0 && document.getElementById('pd-alasan').value===''"));
    // Ambil dari = Kas Dana Umum: pasangan Kas tidak dibuat (uangnya memang sudah di sana)
    await evalJs(`(function(){ var a=JSON.parse(localStorage.getItem('daftarJurnal')); a.push({id:'j3',nomor:'J-3',tanggal:'2026-04-01',keterangan:'',rincian:[{akunId:'k2',debit:300000,kredit:0},{akunId:'p1a',debit:0,kredit:300000,programId:'pr2',divisiId:'d1'}]}); localStorage.setItem('daftarJurnal', JSON.stringify(a)); return true; })()`);
    await ubahNilai("pd-dari", "pr2"); await ubahNilai("pd-kas-asal", "k2"); await nomorManual("PD-0002");
    await klikTujuan("Kas Dana Umum"); await klik("#tpd-semua-sisa"); await tunggu(100); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await ubahNilai("pd-alasan", "Sisa Beasiswa");
    await simpanPd();
    jr = await jurnalPd();
    const j2 = jr.find(j => j.nomor === "PD-0002");
    catat("Ambil dari = Kas Dana Umum: jurnal hanya pasangan Aset Neto (tanpa baris Kas), nilai 300.000, Divisi Pendidikan di baris Program saja (Dana Umum tanpa Divisi)", (await jumlahPd()) === 2 && !!j2 && barisJr(j2) === "m2:300000:0:pr2:d1 | m1:0:300000::", j2 ? barisJr(j2) : JSON.stringify(await galatPd()));
    // No Bukti kembar. Sisa Ramadhan sudah 0, jadi ditambah donasi 1.000 dulu supaya yang ditolak memang nomornya
    await evalJs(`(function(){ var a=JSON.parse(localStorage.getItem('daftarJurnal')); a.push({id:'j4',nomor:'J-4',tanggal:'2026-10-01',keterangan:'',rincian:[{akunId:'k1',debit:1000,kredit:0},{akunId:'p1a',debit:0,kredit:1000,programId:'pr1',divisiId:'d2'}]}); localStorage.setItem('daftarJurnal', JSON.stringify(a)); return true; })()`);
    await ubahNilai("pd-dari", "pr1"); await ubahNilai("pd-kas-asal", "k1"); await nomorManual("pd-0001");
    await klikTujuan("Kas Dana Umum"); await ubahNilai("tpd-nilai", "1000"); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await ubahNilai("pd-alasan", "Coba nomor kembar");
    await simpanPd();
    catat("No Bukti kembar (pd-0001 = PD-0001): ditolak 'sudah dipakai'", /sudah dipakai/.test(await galatPd()) && (await jumlahPd()) === 2, await galatPd());
    // Ubah PD-0001: sisa yang tampil tidak dikurangi pemindahan itu sendiri; jurnal dibuat ulang (bukan bertambah)
    await evalJs("(function(){modulPemindahanDana.bukaUbah(modulPemindahanDana.ambil().find(function(d){return d.nomor==='PD-0001';})); return true;})()"); await tunggu(300);
    catat("Buka PD-0001 untuk diubah: sisa dana tampil Rp 1.501.000 (1.500.000 + donasi 1.000; pemindahan ini sendiri tidak ikut mengurangi)", /Rp\s?1\.501\.000$/.test(await sisaTeks()), await sisaTeks());
    await klik("#pd-rincian tr.jurnal-baris-data"); await tunggu(250); await ubahNilai("tpd-nilai", "1000000"); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await simpanPd();
    jr = await jurnalPd();
    const j1 = jr.filter(j => j.nomor === "PD-0001");
    catat("Ubah nilai jadi 1.000.000: data diperbarui, jurnalnya dibuat ulang (tetap satu) dengan 1.000.000; Log 'Ubah'", (await jumlahPd()) === 2 && j1.length === 1 && barisJr(j1[0]) === "m2:1000000:0:pr1:d2 | m1:0:1000000:: | k2:1000000:0:: | k1:0:1000000::" && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Ubah'&&x.tipe==='Pemindahan Dana';})"), j1.length ? barisJr(j1[0]) : "");
    catat("Sisa dana Ramadhan sesudah diubah: Rp 501.000", (await evalJs("sisaDanaProgram('pr1','2026-10-29')")) === 501000);
    // Temuan 28 (D1.10): pemindahan bertanggal LEBIH AWAL tidak boleh memakai uang yang sudah dipindah PD-0001 (29 Okt).
    // Sisa Ramadhan per 15 Okt = 1.501.000, tetapi sesudah PD-0001 tinggal 501.000 -> yang bisa dipindah 501.000.
    catat("sisaDanaProgram mulai 15 Okt = sisa terendah ke depan 501.000 (bukan 1.501.000 per 15 Okt)", (await evalJs("sisaDanaProgram('pr1','2026-10-15')")) === 501000, await evalJs("sisaDanaProgram('pr1','2026-10-15')"));
    await evalJs("modulPemindahanDana.bukaBaru(); true"); await tunggu(200); await bersihNotif();
    await ubahNilai("pd-tanggal", "2026-10-15"); await ubahNilai("pd-dari", "pr1"); await ubahNilai("pd-kas-asal", "k1"); await tunggu(150);
    catat("Tanggal mundur 15 Okt: kotak 'Sisa yang bisa dipindah mulai 15 Okt 2026: Rp 501.000'", /^Sisa yang bisa dipindah mulai 15 Okt 2026: Rp\s?501\.000$/.test(await sisaTeks()), await sisaTeks());
    await klikTujuan("Kas Dana Umum"); await klik("#tpd-semua-sisa"); await tunggu(100);
    catat("Semua sisa (tanggal mundur): Nilai terisi 501.000, bukan 1.501.000", await evalJs("document.getElementById('tpd-nilai').value==='501.000'"), await evalJs("document.getElementById('tpd-nilai').value"));
    await ubahNilai("tpd-nilai", "600000"); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await ubahNilai("pd-alasan", "Coba tanggal mundur"); await nomorManual("PD-0009");
    await simpanPd();
    catat("Pemindahan 600.000 bertanggal 15 Okt (sebelum PD-0001): ditolak 'melebihi sisa yang bisa dipindah ... mulai 15 Okt 2026, yaitu Rp 501.000', tidak tersimpan", /Rp\s?600\.000 melebihi sisa yang bisa dipindah dari dana Program "Ramadhan 1447 H" mulai 15 Okt 2026, yaitu Rp\s?501\.000/.test(await notifPd()) && (await jumlahPd()) === 2, await notifPd());
    await evalJs("modulPemindahanDana.bukaBaru(); true"); await tunggu(200);
    // Hapus: konfirmasi, data dan jurnalnya ikut terhapus
    await bersihNotif();
    await evalJs("(function(){modulPemindahanDana.hapus(modulPemindahanDana.ambil().find(function(d){return d.nomor==='PD-0002';})); return true;})()"); await tunggu(300);
    catat("Hapus PD-0002: muncul popup konfirmasi", await evalJs("dialogKonfirmasi.open"));
    await evalJs("document.getElementById('ya-konfirmasi').click(); true"); await tunggu(400);
    catat("Ya, Hapus: PD-0002 dan jurnalnya terhapus, PD-0001 tetap; Log 'Hapus'", (await jumlahPd()) === 1 && !(await jurnalPd()).some(j => j.nomor === "PD-0002") && (await jurnalPd()).some(j => j.nomor === "PD-0001") && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(x){return x.tindakan==='Hapus'&&x.tipe==='Pemindahan Dana'&&x.referensi==='PD-0002';})"));
    // Jurnal otomatis tidak bisa diubah lewat Jurnal Umum (ditelusuri balik ke Pemindahan Dana)
    catat("Jurnal otomatis terdaftar asalnya: 'Pemindahan Dana'", await evalJs("(function(){var j=modulJurnal.ambil().find(function(x){return x.sumber&&x.sumber.jenis==='pemindahan';}); return !!j && asalJurnalOtomatis(j)==='Pemindahan Dana';})()"));
    // Program asal yang sudah dipakai pemindahan tidak bisa dihapus di Master Data (jurnalnya bertanda Program)
    await bersihNotif();
    await evalJs("(function(){modulProgram.hapus(modulProgram.ambil().find(function(p){return p.id==='pr1';})); return true;})()"); await tunggu(300);
    catat("Master Data: hapus Program Ramadhan (dipakai jurnal pemindahan) ditolak", /sudah dipakai/.test(await notifPd()) && !(await evalJs("dialogKonfirmasi.open")));
    await bersihNotif();
    await evalJs("modulPemindahanDana.bukaBaru(); true"); await tunggu(200);
    // ===== D1.7 bagian 4: arah ② Dana Umum → Divisi =====
    catat("Sisa Dana Umum per 29 Okt 2026 = 1.000.000 (PD-0001 yang sudah diubah; PD-0002 sudah dihapus)", (await evalJs("sisaDanaUmum('2026-10-29')")) === 1000000, await evalJs("sisaDanaUmum('2026-10-29')"));
    await ubahNilai("pd-tanggal", "2026-10-29"); await ubahNilai("pd-dari", "pr1"); await ubahNilai("pd-kas-asal", "k1");
    await klikTujuan("Kas Dana Umum"); await ubahNilai("tpd-nilai", "5000"); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await klik('#isi-pemindahan-dana input[name="pd-jenis"][value="ke-divisi"] + span'); await tunggu(200);
    catat("Pilih Jenis 'Dana Umum → Divisi': label jadi 'Dari', isian 'Dana Umum' (hanya dibaca) menggantikan pilihan Program, tujuan lama dibuang", await evalJs("(function(){var l=document.getElementById('label-pd-dari').textContent; return /^Dari\\s*\\*?$/.test(l.trim()) && !document.getElementById('pd-dari-umum').hidden && document.getElementById('pd-dari-umum').readOnly && document.getElementById('pd-dari').hidden && document.getElementById('pd-dari').parentElement.querySelector('.pemilih-opsi').hidden !== false && document.querySelectorAll('#pd-rincian tr.jurnal-baris-data').length===0;})()"), await evalJs("document.getElementById('label-pd-dari').textContent"));
    catat("Sisa yang tampil: 'Sisa Dana Umum yang bisa dipindah mulai 29 Okt 2026: Rp 1.000.000'", /^Sisa Dana Umum yang bisa dipindah mulai 29 Okt 2026: Rp\s?1\.000\.000$/.test(await sisaTeks()), await sisaTeks());
    await ubahNilai("pd-kas-asal", "k2");
    await klikTujuan("Kas Divisi Sosial");
    catat("Popup arah ②: baris 'Ke Divisi' (pilihan Divisi) tampil, baris 'Ke Dana Umum' tersembunyi, kursor di Divisi", await popupBuka() && await evalJs("!document.getElementById('baris-tpd-divisi').hidden && document.getElementById('baris-tpd-ke').hidden && [...document.getElementById('tpd-divisi').options].map(function(o){return o.textContent;}).join('|')==='Pilih Divisi...|Pendidikan|Sosial'"));
    await klik("#tpd-semua-sisa"); await tunggu(100);
    catat("Semua sisa arah ②: Nilai terisi sisa Dana Umum 1.000.000", await evalJs("document.getElementById('tpd-nilai').value==='1.000.000'"));
    await klik("#lanjut-tujuan-pemindahan"); await tunggu(200);
    catat("Lanjut tanpa Divisi: ditolak 'Divisi tujuan wajib dipilih', popup tetap", await popupBuka() && /Divisi tujuan wajib dipilih/.test(await evalJs("document.getElementById('galat-tpd-divisi').textContent")) && await evalJs("!document.getElementById('galat-tpd-divisi').hidden"));
    await ubahNilai("tpd-divisi", "d1"); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    catat("Baris tujuan: 'Divisi Pendidikan | [110101] Kas Divisi Sosial | 1.000.000'", JSON.stringify(await barisTabel()) === JSON.stringify(["Divisi Pendidikan|[110101] Kas Divisi Sosial|1.000.000"]), JSON.stringify(await barisTabel()));
    // Melebihi sisa Dana Umum
    await klik("#pd-rincian tr.jurnal-baris-data"); await tunggu(250);
    catat("Klik baris: popup membuka Divisi Pendidikan dan nilainya", await evalJs("document.getElementById('tpd-divisi').value==='d1' && document.getElementById('tpd-nilai').value==='1.000.000'"));
    await ubahNilai("tpd-nilai", "2000000"); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await ubahNilai("pd-alasan", "Kebutuhan beasiswa"); await nomorManual("PD-0003");
    await simpanPd();
    catat("Nilai 2.000.000 melebihi sisa Dana Umum: ditolak 'melebihi sisa yang bisa dipindah dari Dana Umum mulai 29 Okt 2026, yaitu Rp 1.000.000'", /melebihi sisa yang bisa dipindah dari Dana Umum mulai 29 Okt 2026, yaitu Rp\s?1\.000\.000/.test(await notifPd()) && (await jumlahPd()) === 1, await notifPd());
    await klik("#pd-rincian tr.jurnal-baris-data"); await tunggu(250); await ubahNilai("tpd-nilai", "1000000"); await klik("#lanjut-tujuan-pemindahan"); await tunggu(250);
    await simpanPd();
    const d3 = await evalJs("JSON.stringify(JSON.parse(localStorage.getItem('daftarPemindahanDana')).find(function(d){return d.nomor==='PD-0003';})||{})").then(JSON.parse);
    catat("Simpan arah ②: tersimpan {jenis ke-divisi, dariProgramId kosong, keDivisiId d1, kas asal Kas Dana Umum, kas tujuan Kas Divisi Sosial, 1.000.000}", d3.jenis === "ke-divisi" && d3.dariProgramId === "" && d3.keDivisiId === "d1" && d3.kasAsalId === "k2" && d3.kasTujuanId === "k1" && d3.nilai === 1000000, JSON.stringify(d3));
    const j3 = (await jurnalPd()).find(j => j.nomor === "PD-0003");
    catat("Jurnal arah ②: Debit Aset Neto Tidak Terikat [Dana Umum, tanpa Divisi] / Kredit Aset Neto Tidak Terikat [Divisi Pendidikan] / Debit Kas Divisi Sosial / Kredit Kas Dana Umum", !!j3 && barisJr(j3) === "m1:1000000:0:: | m1:0:1000000::d1 | k1:1000000:0:: | k2:0:1000000::", j3 ? barisJr(j3) : "tidak ada jurnal");
    catat("Sesudah diberikan ke Divisi: sisa Dana Umum 0", (await evalJs("sisaDanaUmum('2026-10-29')")) === 0, await evalJs("sisaDanaUmum('2026-10-29')"));
    // Buka lagi PD-0003: jenis, Dari Dana Umum, tujuan Divisi kembali terisi
    await evalJs("(function(){modulPemindahanDana.bukaUbah(modulPemindahanDana.ambil().find(function(d){return d.nomor==='PD-0003';})); return true;})()"); await tunggu(300);
    catat("Buka PD-0003: Jenis 'Dana Umum → Divisi' terpilih, Dari 'Dana Umum', sisa Dana Umum tampil 1.000.000 (dirinya tidak ikut), baris 'Divisi Pendidikan'", await evalJs("document.querySelector('input[name=\"pd-jenis\"][value=\"ke-divisi\"]').checked && !document.getElementById('pd-dari-umum').hidden") && /Rp\s?1\.000\.000$/.test(await sisaTeks()) && /^Divisi Pendidikan\|/.test((await barisTabel())[0] || ""), JSON.stringify(await barisTabel()));
    await foto("pemindahan-dana-ke-divisi.png");
    // Daftar memuat kedua arah dengan kolom Jenis, Dari, Ke
    await klik("#isi-pemindahan-dana .tombol-daftar"); await tunggu(400);
    const brs3 = await evalJs("[...document.querySelectorAll('#isi-pemindahan-dana .tabel-daftar tbody tr')].map(function(tr){return [...tr.cells].slice(2,5).map(function(td){return td.textContent.trim();}).join('|');})");
    catat("Daftar: PD-0003 'Dana Umum → Divisi | Dana Umum | Divisi Pendidikan' dan PD-0001 'Sisa Program → Dana Umum | Ramadhan 1447 H | Dana Umum'", JSON.stringify(brs3.sort()) === JSON.stringify(["Dana Umum → Divisi|Dana Umum|Divisi Pendidikan", "Sisa Program → Dana Umum|Ramadhan 1447 H|Dana Umum"]), JSON.stringify(brs3));
    await klik("#isi-pemindahan-dana .tombol-daftar"); await tunggu(300);
    await evalJs("modulPemindahanDana.bukaBaru(); true"); await tunggu(200);
    // 8) Daftar
    await evalJs(`(function(){ localStorage.setItem('daftarPemindahanDana', JSON.stringify([
        {id:'x1',nomor:'PD-0001',nama:'PD-0001',tanggal:'2026-10-29',dariProgramId:'pr1',kasAsalId:'k1',kasAsal:'110101 - Kas Divisi Sosial',kasTujuanId:'k2',kasTujuan:'110102 - Kas Dana Umum',nilai:1500000,total:1500000,alasan:'Kegiatan selesai'},
        {id:'x2',nomor:'PD-0002',nama:'PD-0002',tanggal:'2026-08-15',dariProgramId:'pr2',kasAsalId:'k2',kasAsal:'110102 - Kas Dana Umum',kasTujuanId:'k2',kasTujuan:'110102 - Kas Dana Umum',nilai:'750000',total:750000,alasan:'<b>tebal</b>'}, null])); saatTabDibuka['pemindahan-dana'](); return true; })()`);
    await klik("#isi-pemindahan-dana .tombol-daftar"); await tunggu(400);
    const kepala = await evalJs("[...document.querySelectorAll('#isi-pemindahan-dana .tabel-daftar thead th')].map(function(th){return th.textContent.trim();}).filter(Boolean).join('|')");
    catat("Daftar: kolom No Bukti, Tanggal, Jenis, Dari, Ke, Dari Kas/Bank, Ke Kas/Bank, Alasan, Nilai", /^No Bukti\|Tanggal\|Jenis\|Dari\|Ke\|Dari Kas\/Bank\|Ke Kas\/Bank\|Alasan\|Nilai/.test(kepala), kepala);
    const isiDaftar = await evalJs("[...document.querySelectorAll('#isi-pemindahan-dana .tabel-daftar tbody tr')].map(function(tr){return [...tr.cells].map(function(td){return td.textContent.trim();}).join('|');})");
    catat("Baris daftar: terbaru di atas; data rusak dilewati; Alasan berkode HTML tampil sebagai teks", JSON.stringify(isiDaftar) === JSON.stringify(["PD-0001|29 Okt 2026|Sisa Program → Dana Umum|Ramadhan 1447 H|Dana Umum|110101 - Kas Divisi Sosial|110102 - Kas Dana Umum|Kegiatan selesai|1.500.000", "PD-0002|15 Agu 2026|Sisa Program → Dana Umum|Beasiswa|Dana Umum|110102 - Kas Dana Umum|110102 - Kas Dana Umum|<b>tebal</b>|750.000"]) && await evalJs("!document.querySelector('#isi-pemindahan-dana .tabel-daftar tbody b')"), JSON.stringify(isiDaftar));
    const filterPd = await evalJs("[...document.querySelectorAll('#isi-pemindahan-dana .pilih-filter')].map(function(s){return s.options[0].textContent;}).join('|')");
    catat("Filter: Tanggal dan Jenis", filterPd === "Tanggal: Semua|Jenis: Semua", filterPd);
    await foto("pemindahan-dana-daftar.png");
    // 9) Buka data tersimpan: isian terisi kembali
    await evalJs("(function(){modulPemindahanDana.bukaUbah(modulPemindahanDana.ambil().find(function(d){return d.id==='x1';})); return true;})()"); await tunggu(300);
    catat("Buka PD-0001: Dari Ramadhan, Ambil dari Kas Divisi Sosial, Tanggal, Alasan, tujuan Kas Dana Umum 1.500.000, Nilai Pemindahan 1.500.000", await evalJs("document.getElementById('pd-dari').value==='pr1' && document.getElementById('pd-kas-asal').value==='k1' && document.getElementById('pd-tanggal').value==='2026-10-29' && document.getElementById('pd-alasan').value==='Kegiatan selesai' && document.getElementById('pd-nilai').value==='1.500.000' && /Kas Dana Umum\\|1\\.500\\.000$/.test([...document.querySelectorAll('#pd-rincian tr.jurnal-baris-data td')].slice(1,4).map(function(t){return t.textContent.trim();}).join('|'))"));
    // 10) Data rusak
    await evalJs("localStorage.setItem('daftarPemindahanDana','{rusak'); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-donasi"); await tunggu(300);
    await klik('#panel-donasi .kotak-menu[data-halaman="Pemindahan Dana"]'); await tunggu(400);
    await klik("#isi-pemindahan-dana .tombol-daftar"); await tunggu(300);
    catat("Data Pemindahan Dana rusak: halaman tetap terbuka, daftar kosong dengan pesan", /Belum ada pemindahan dana/.test(await evalJs("document.getElementById('isi-pemindahan-dana').textContent")));
    // 11) Lebar HP
    await klik("#isi-pemindahan-dana .tombol-daftar"); await tunggu(300);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await tunggu(400);
    await foto("pemindahan-dana-390.png");
    catat("Lebar HP 390: formulir Pemindahan Dana tidak melebar keluar layar", await evalJs("document.getElementById('form-pemindahan-dana').getBoundingClientRect().right <= 390"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
