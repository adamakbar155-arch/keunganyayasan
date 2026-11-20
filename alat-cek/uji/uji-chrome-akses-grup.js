// Halaman Akses Grup (J.30, PRD 6.14) di Chrome asli: tabel Hak Akses (centang yang berlaku, aturan Aktif, Pilih semua, Cari,
// kelompok), Salin Hak, Daftar Pengguna (Operator, satu pengguna satu grup), simpan, hapus ditolak kalau masih dipakai,
// pilihan Akses Grup di formulir Pengguna, dan halaman hanya untuk Administrator.
// Pemakaian: node uji-chrome-akses-grup.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9408;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description) + " <<< " + e.slice(0, 160)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(!!ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); };
// Klik kotak centang lewat click() (menjalankan kejadian change seperti klik sungguhan)
const centang = (sel) => evalJs("(function(){var e=document.querySelector(" + JSON.stringify(sel) + "); if(!e){throw new Error('tidak ada: '+" + JSON.stringify(sel) + ");} e.click(); return e.checked;})()");
const tercentang = (idEl) => evalJs("document.getElementById(" + JSON.stringify(idEl) + ").checked");
const barisTampil = () => evalJs("JSON.stringify([...document.querySelectorAll('#ag-badan-hak tr[data-menu]')].filter(function(t){return !t.hidden;}).map(function(t){return t.dataset.menu;}))").then(JSON.parse);
const pesanNotif = () => evalJs("[...document.querySelectorAll('.notifikasi p')].map(function(p){return p.textContent;}).join(' | ')");
const bersihkanNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    const galat = [];
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/"));
    // Data awal: dua Operator dan satu Administrator lain (data rekaan, kata sandi palsu)
    await evalJs(`localStorage.clear(); localStorage.setItem("daftarPengguna", JSON.stringify([
      { id: "u-ani", nama: "Ani Operator", username: "ani", kontak: "", jenisAkses: "operator", nonAktif: false, sandi: { garam: "00", hash: "00", iterasi: 1 } },
      { id: "u-budi", nama: "Budi Operator", username: "budi", kontak: "", jenisAkses: "operator", nonAktif: true, sandi: { garam: "00", hash: "00", iterasi: 1 } },
      { id: "u-cici", nama: "Cici Admin", username: "cici", kontak: "", jenisAkses: "administrator", nonAktif: false, sandi: { garam: "00", hash: "00", iterasi: 1 } }
    ])); true`);
    await muatUlang();

    // 1) Kotak Akses Grup di Pengaturan membuka halamannya
    await evalJs("document.getElementById('tombol-pengaturan').click(); true"); await tunggu(200);
    catat("Kotak Akses Grup ada di popup Pengaturan", await evalJs("!!document.querySelector('#panel-pengaturan .kotak-menu[data-halaman=\"Akses Grup\"]')"));
    await evalJs("document.querySelector('#panel-pengaturan .kotak-menu[data-halaman=\"Akses Grup\"]').click(); true"); await tunggu(300);
    catat("Halaman Akses Grup terbuka di formulir Data Baru, tab Umum", await evalJs("!document.getElementById('isi-akses-grup').hidden && !document.getElementById('sub-ag-umum').hidden && document.activeElement && document.activeElement.id==='ag-nama'"));
    await foto("akses-grup-umum.png");

    // 2) Tabel Hak Akses: 7 kelompok, centang hanya yang berlaku
    await evalJs("document.querySelector('#isi-akses-grup [data-subtab=\"ag-hak\"]').click(); true"); await tunggu(150);
    catat("7 tombol kelompok menu, Master Data terpilih", await evalJs("document.querySelectorAll('#ag-kelompok button').length===7 && document.querySelector('#ag-kelompok button[aria-pressed=\"true\"]').textContent==='Master Data'"));
    catat("Master Data menampilkan Divisi, Program, Karyawan, Gaji/Tunjangan", JSON.stringify(await barisTampil()) === JSON.stringify(["divisi", "program", "karyawan", "gaji"]));
    catat("Semua menu baru kosong (grup baru tidak dicentang)", await evalJs("[...document.querySelectorAll('#ag-badan-hak input[data-hak]')].every(function(c){return !c.checked;})"));
    catat("Proses Penyusutan tanpa centang Ubah; Rekonsiliasi Bank hanya Aktif dan Ubah; Log Aktivitas hanya Aktif",
      await evalJs("!document.getElementById('ag-hak-penyusutan-ubah') && !!document.getElementById('ag-hak-penyusutan-lihat') && !!document.getElementById('ag-hak-rekonsiliasi-bank-ubah') && !document.getElementById('ag-hak-rekonsiliasi-bank-buat') && document.querySelectorAll('tr[data-menu=\"log\"] input').length===1"));

    // 3) Aturan Aktif
    await centang("#ag-hak-divisi-buat");
    catat("Mencentang Buat ikut mencentang Aktif", await tercentang("ag-hak-divisi-aktif"));
    await centang("#ag-hak-divisi-aktif");
    catat("Melepas Aktif ikut melepas Buat", !(await tercentang("ag-hak-divisi-aktif")) && !(await tercentang("ag-hak-divisi-buat")));

    // 4) Pilih semua (hanya baris yang tampil)
    await centang("#ag-baris-semua input[data-semua='lihat']");
    catat("Pilih semua Lihat: 4 menu Master Data Lihat + Aktif, menu kelompok lain tetap kosong",
      await evalJs("['divisi','program','karyawan','gaji'].every(function(k){return document.getElementById('ag-hak-'+k+'-lihat').checked && document.getElementById('ag-hak-'+k+'-aktif').checked;}) && !document.getElementById('ag-hak-akun-aktif').checked"));
    catat("Centang Pilih semua Aktif ikut penuh, Buat kosong", await evalJs("document.querySelector('#ag-baris-semua input[data-semua=\"aktif\"]').checked && !document.querySelector('#ag-baris-semua input[data-semua=\"buat\"]').checked"));
    await centang("#ag-hak-divisi-buat");
    catat("Sebagian Buat tercentang: Pilih semua Buat setengah (strip)", await evalJs("document.querySelector('#ag-baris-semua input[data-semua=\"buat\"]').indeterminate"));

    // 5) Kelompok lain dan Cari
    await evalJs("document.querySelector('#ag-kelompok button[data-kelompok=\"Laporan\"]').click(); true");
    catat("Kelompok Laporan: 7 menu; Pilih semua Ubah mati (tidak berlaku)", (await barisTampil()).length === 7 && await evalJs("document.querySelector('#ag-baris-semua input[data-semua=\"ubah\"]').disabled"));
    await evalJs("var c=document.getElementById('ag-cari'); c.value='anggaran'; c.dispatchEvent(new Event('input',{bubbles:true})); true");
    catat("Cari 'anggaran': Anggaran, Transfer Anggaran, Monitor Anggaran dengan judul Buku Besar",
      JSON.stringify(await barisTampil()) === JSON.stringify(["anggaran", "transfer-anggaran", "monitor-anggaran"]) && await evalJs("!document.querySelector('tr[data-judul-kelompok=\"Buku Besar\"]').hidden && document.querySelector('tr[data-judul-kelompok=\"Master Data\"]').hidden"));
    await evalJs("var c=document.getElementById('ag-cari'); c.value='zzz'; c.dispatchEvent(new Event('input',{bubbles:true})); true");
    catat("Cari tanpa hasil: pesan 'Tidak ada menu yang cocok.'", !(await evalJs("document.getElementById('ag-hak-kosong').hidden")));
    await evalJs("document.querySelector('#ag-kelompok button[data-kelompok=\"Master Data\"]').click(); true");
    catat("Klik kelompok mengosongkan Cari", await evalJs("document.getElementById('ag-cari').value===''") && (await barisTampil()).length === 4);
    await foto("akses-grup-hak.png");

    // 6) Simpan: nama wajib, Daftar Pengguna hanya Operator
    await evalJs("document.querySelector('#form-akses-grup').requestSubmit(); true"); await tunggu(150);
    catat("Simpan tanpa Nama Grup ditolak, kembali ke tab Umum", await evalJs("!document.getElementById('galat-ag-nama').hidden && !document.getElementById('sub-ag-umum').hidden"));
    const pilihanPengguna = await evalJs("JSON.stringify(operatorAg().map(function(p){return p.id;}))");
    catat("Pilihan Daftar Pengguna hanya Operator (Ani, Budi; tanpa Administrator)", pilihanPengguna === JSON.stringify(["u-ani", "u-budi"]), pilihanPengguna);
    await evalJs("document.getElementById('ag-nama').value='Staf Keuangan'; pemilihPenggunaAg.tetapkan(['u-ani']); document.querySelector('#form-akses-grup').requestSubmit(); true"); await tunggu(300);
    const g1 = await evalJs("JSON.stringify(JSON.parse(localStorage.getItem('daftarAksesGrup')))");
    const grup1 = JSON.parse(g1)[0];
    catat("Grup tersimpan dengan hak yang dicentang (dibersihkan)", grup1 && grup1.nama === "Staf Keuangan" && grup1.pembatasan === "preferensi" && JSON.stringify(grup1.hak.divisi) === JSON.stringify(["aktif", "buat", "lihat"]) && !grup1.hak.akun, g1);
    catat("Ani masuk grup (aksesGrupId di data Pengguna)", await evalJs("JSON.parse(localStorage.getItem('daftarPengguna')).find(function(p){return p.id==='u-ani';}).aksesGrupId===" + JSON.stringify(grup1.id)));
    catat("Log Aktivitas mencatat Buat Akses Grup dengan Daftar Pengguna dan Hak Akses", await evalJs("(function(){var l=JSON.parse(localStorage.getItem('logAktivitas')).filter(function(x){return x.tipe==='Akses Grup';}).pop(); return l && l.tindakan==='Buat' && l.rincian.some(function(r){return r.label==='Daftar Pengguna' && r.baru==='Ani Operator';}) && l.rincian.some(function(r){return r.label==='Hak Akses' && r.baru.indexOf('Master Data - Divisi (Aktif, Buat, Lihat)')!==-1;});})()"));
    await evalJs("document.querySelector('#isi-akses-grup .tombol-daftar').click(); true"); await tunggu(200);
    catat("Daftar: kolom Daftar Pengguna berisi Ani Operator", await evalJs("document.querySelector('#isi-akses-grup .tabel-daftar tbody').textContent.indexOf('Ani Operator')!==-1"));
    await foto("akses-grup-daftar.png");

    // 7) Grup kedua: Salin Hak, dan memindahkan Ani dari grup pertama
    await evalJs("bukaAksesGrupBaru(); true"); await tunggu(200);
    await evalJs("document.querySelector('#isi-akses-grup [data-subtab=\"ag-hak\"]').click(); true");
    await bersihkanNotif();
    await evalJs("document.getElementById('ag-salin').click(); true"); await tunggu(100);
    catat("Salin Hak tanpa memilih grup: peringatan", (await pesanNotif()).indexOf("Pilih dulu grup") !== -1);
    await evalJs("document.getElementById('ag-salin-dari').value=" + JSON.stringify(grup1.id) + "; document.getElementById('ag-salin').click(); true"); await tunggu(100);
    catat("Salin Hak mengisi tabel dari grup Staf Keuangan", await tercentang("ag-hak-divisi-buat") && await tercentang("ag-hak-gaji-lihat") && !(await tercentang("ag-hak-program-buat")));
    await bersihkanNotif(); await foto("akses-grup-salin.png");
    // Layar HP: kelompok pindah ke atas, halaman tidak melebar (tabel digeser sendiri)
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 800, deviceScaleFactor: 1, mobile: false }); await tunggu(250);
    catat("Lebar 390: tab Hak Akses tidak membuat halaman melebar", await evalJs("document.querySelector('#isi-akses-grup .form-pref').getBoundingClientRect().right<=window.innerWidth"));
    await foto("akses-grup-hak-390.png");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false }); await tunggu(250);
    const teksAni = await evalJs("JSON.stringify(operatorAg().map(function(p){return p.aksesGrupId||'';}))");
    catat("Ani tercatat di grup pertama sebelum dipindah", teksAni.indexOf(grup1.id) !== -1);
    await evalJs("document.getElementById('ag-nama').value='staf keuangan'; document.querySelector('#form-akses-grup').requestSubmit(); true"); await tunggu(150);
    catat("Nama Grup kembar (beda huruf besar/kecil) ditolak", await evalJs("document.getElementById('galat-ag-nama').textContent==='Nama Grup sudah dipakai grup lain.'"));
    await evalJs("document.getElementById('ag-nama').value='Relawan'; pemilihPenggunaAg.tetapkan(['u-ani','u-budi']); document.querySelector('#form-akses-grup').requestSubmit(); true"); await tunggu(300);
    const grup2 = JSON.parse(await evalJs("localStorage.getItem('daftarAksesGrup')")).find(g => g.nama === "Relawan");
    catat("Grup Relawan tersimpan dengan hak salinan", grup2 && JSON.stringify(grup2.hak) === JSON.stringify(grup1.hak));
    catat("Ani dan Budi pindah ke Relawan (satu pengguna satu grup)", await evalJs("JSON.parse(localStorage.getItem('daftarPengguna')).filter(function(p){return p.aksesGrupId===" + JSON.stringify(grup2.id) + ";}).length===2"));

    // 8) Hapus grup yang masih dipakai ditolak; grup kosong boleh
    await bersihkanNotif();
    await evalJs("modulAksesGrup.hapus(modulAksesGrup.ambil().find(function(g){return g.nama==='Relawan';})); true"); await tunggu(150);
    catat("Hapus grup yang masih dipakai ditolak", (await pesanNotif()).indexOf("masih dipakai 2 pengguna") !== -1);
    await evalJs("modulAksesGrup.hapus(modulAksesGrup.ambil().find(function(g){return g.nama==='Staf Keuangan';})); true"); await tunggu(150);
    catat("Hapus grup kosong meminta konfirmasi", await evalJs("document.getElementById('dialog-konfirmasi').open"));
    await evalJs("document.getElementById('ya-konfirmasi').click(); true"); await tunggu(150);
    catat("Grup kosong terhapus", await evalJs("JSON.parse(localStorage.getItem('daftarAksesGrup')).length===1"));

    // 9) Formulir Pengguna: pilihan Akses Grup hanya untuk Operator
    await evalJs("bukaPenggunaBaru(); true"); await tunggu(200);
    catat("Pengguna Data Baru (Operator): baris Akses Grup tampil, pilihan Tanpa Akses Grup + Relawan", await evalJs("!document.getElementById('baris-pg-akses-grup').hidden && [...document.getElementById('pg-akses-grup').options].map(function(o){return o.textContent;}).join('|')==='Tanpa Akses Grup (hanya Dashboard)|Relawan'"));
    await evalJs("document.getElementById('pg-jenis-administrator').click(); true");
    catat("Memilih Administrator menyembunyikan Akses Grup", await evalJs("document.getElementById('baris-pg-akses-grup').hidden"));
    await evalJs("modulPengguna.bukaUbah(modulPengguna.ambil().find(function(p){return p.id==='u-ani';})); true"); await tunggu(200);
    catat("Ubah Ani: Akses Grup terisi Relawan", await evalJs("document.getElementById('pg-akses-grup').value===" + JSON.stringify(grup2.id)));
    await evalJs("document.getElementById('pg-akses-grup').value=''; document.querySelector('#form-pengguna').requestSubmit(); true"); await tunggu(400);
    catat("Ani dilepas dari grup lewat formulir Pengguna", await evalJs("!JSON.parse(localStorage.getItem('daftarPengguna')).find(function(p){return p.id==='u-ani';}).aksesGrupId"));
    catat("Log Pengguna mencatat perubahan Akses Grup", await evalJs("(function(){var l=JSON.parse(localStorage.getItem('logAktivitas')).filter(function(x){return x.tipe==='Pengguna';}).pop(); return l && l.rincian.some(function(r){return r.label==='Akses Grup' && r.lama==='Relawan' && r.baru==='';});})()"));
    await foto("pengguna-akses-grup.png");

    // 10) Hanya Administrator: masuk sebagai Operator, kotak tersembunyi dan halaman ditolak
    await evalJs("sessionStorage.setItem('sesiMasuk', JSON.stringify({ penggunaId: 'u-ani', nama: 'Ani Operator', terakhirAktif: Date.now(), baruMasuk: false })); true");
    await muatUlang();
    catat("Operator: kotak Akses Grup tersembunyi", await evalJs("getComputedStyle(document.querySelector('#panel-pengaturan .kotak-menu[data-halaman=\"Akses Grup\"]')).display==='none'"));
    await evalJs("bukaTab('akses-grup'); true"); await tunggu(150);
    catat("Operator: halaman Akses Grup ditolak", await evalJs("document.getElementById('isi-akses-grup').hidden"));

    catat("Tidak ada galat skrip", galat.length === 0, galat.join(" | "));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
