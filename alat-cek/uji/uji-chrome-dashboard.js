// Uji Dashboard berwarna (PRD 6.7) di Chrome asli, dengan hitungan tangan memakai tanggal hari ini:
// donasi 5.000.000, beban listrik 1.200.000 dan konsumsi 800.000, jadi selisih 3.000.000; Kas: saldo awal 1.000.000 + 5.000.000 - 2.000.000.
// Bulan lalu donasi 2.500.000. Transfer antar Kas tidak boleh masuk Arus Kas. Juga pilihan bulan, pengaturan widget, data kosong, data rusak, layar HP.
// Pemakaian: node uji-chrome-dashboard.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9398;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 140)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };

const akun = (id, kode, nama, tipe, indukId, ekstra) => Object.assign({ id, kode, nama, tipe, indukId: indukId || "" }, ekstra || {});
const AKUN = [
  akun("k0", "11", "Kas & Bank", "kas-bank"), akun("k1", "1101", "Kas Kecil", "kas-bank", "k0"), akun("k2", "110101", "Kas Masjid", "kas-bank", "k1", { saldoAwal: 1000000 }), akun("k3", "110102", "Kas Kantor", "kas-bank", "k1"),
  akun("p0", "41", "Pendapatan", "pendapatan"), akun("p1", "4101", "Donasi <b>Umum</b>", "pendapatan", "p0"),
  akun("b0", "51", "Beban", "beban"), akun("b1", "5101", "Beban Listrik", "beban", "b0"), akun("b2", "5102", "Beban Konsumsi", "beban", "b0")
];
const r = (akunId, debit, kredit, ekstra) => Object.assign({ id: "r" + Math.random(), akunId, debit, kredit, divisiId: "", programId: "" }, ekstra || {});

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
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 1000, deviceScaleFactor: 1, mobile: false });
    const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); for (let i = 0; i < 100; i++) { if (await evalJs("document.readyState==='complete' && typeof gambarDashboard==='function'")) { break; } await tunggu(200); } await tunggu(200); };
    await tunggu(800);
    for (let i = 0; i < 100 && !(await evalJs("typeof gambarDashboard==='function'")); i++) { await tunggu(200); }
    const hari = await evalJs("tanggalHariIni()");
    const y = hari.slice(0, 4), nomorBulan = Number(hari.slice(5, 7));
    const bulanLalu = await evalJs("geserBulanIso('" + hari.slice(0, 7) + "', -1)");
    const selesai = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
    const JURNAL = [
      { id: "j1", nomor: "DN-1", tanggal: hari, rincian: [r("k2", 5000000, 0), r("p1", 0, 5000000, { programId: "pr1" })] },
      { id: "j2", nomor: "BK-1", tanggal: hari, rincian: [r("b1", 1200000, 0), r("k2", 0, 1200000)] },
      { id: "j3", nomor: "BK-2", tanggal: hari, rincian: [r("b2", 800000, 0, { programId: "pr2" }), r("k2", 0, 800000)] },
      { id: "j4", nomor: "TF-1", tanggal: hari, rincian: [r("k3", 300000, 0), r("k2", 0, 300000)] },
      { id: "j5", nomor: "DN-0", tanggal: bulanLalu + "-10", rincian: [r("k2", 2500000, 0), r("p1", 0, 2500000)] }
    ];
    const simpan = (k, v) => "localStorage.setItem('" + k + "', " + JSON.stringify(JSON.stringify(v)) + ");";
    await evalJs("localStorage.clear();" + simpan("daftarAkun", AKUN) + simpan("daftarJurnal", JURNAL) + simpan("daftarProgram", [{ id: "pr1", nama: "Beasiswa", divisiId: "", status: "aktif" }, { id: "pr2", nama: "Santunan", divisiId: "", status: "aktif" }])
      + simpan("daftarAnggaran", [{ id: "a1", bulan: nomorBulan, tahun: Number(y), tipe: "umum", kelompokId: "", rincian: [{ id: "x", akunId: "b1", nilai: 1000000 }, { id: "y", akunId: "b2", nilai: 1000000 }] }])
      + simpan("daftarTargetDonasi", [{ id: "t1", nama: "Beasiswa " + y, programId: "pr1", mulai: y + "-01-01", selesai: selesai, nilai: 50000000 }])
      + simpan("daftarPencatatanGaji", [{ id: "g1", nomor: "G1", totalDibayarkan: 100, rincian: [] }])
      + simpan("daftarKategoriAset", [{ id: "ka", nama: "Kendaraan", akunAsetId: "k2", akunAkumulasiId: "", akunBebanId: "b1", umurTahun: 5 }])
      + simpan("daftarAsetTetap", [{ id: "as", kode: "AT-00001", nama: "Mobil", kategoriId: "ka", nilai: 120000000, umurBulan: 60, tanggalPakai: "2020-01-01", tanggalBeli: "2020-01-01" }])
      + simpan("logAktivitas", [{ id: "l1", tindakan: "Buat", tipe: "Pembayaran", referensi: "<b>BK-1</b>", waktu: hari + "T09:12:00", pengguna: "Pengguna" }])
      + "true");
    await muatUlang();
    const w = (idW) => `document.querySelector('[data-widget="${idW}"]')`;
    const teks = (idW) => evalJs(`(${w(idW)}||{}).textContent||''`);
    const tampil = () => evalJs("[...document.querySelectorAll('#grid-widget [data-widget]')].map(function(e){return e.dataset.widget;}).join()");
    const BAWAAN = "ringkasan,banding,arus,tren,aktivitas,pengeluaran,program,perhatian,anggaran,target";

    catat("Sepuluh widget bawaan, urut seperti gambar", await tampil() === BAWAAN, await tampil());
    const ring = await teks("ringkasan");
    catat("Empat kartu hitungan tangan; Kas setelah Transfer tetap sama jumlahnya; banding bulan lalu", /Kas dan BankRp 6\.500\.000/.test(ring) && /Donasi bulan iniRp 5\.000\.000▲ 100%/.test(ring) && /Pengeluaran bulan iniRp 2\.000\.000/.test(ring) && /Selisih bulan iniRp 3\.000\.000Surplus/.test(ring), ring);
    catat("Tidak ada angka contoh lama", !(await evalJs("document.body.textContent.indexOf('Rp 12.500.000')!==-1")));
    catat("Salam dan bulan berjalan", /^Selamat (pagi|siang|sore|malam), /.test(await evalJs("document.getElementById('dash-salam').textContent")) && await evalJs("document.getElementById('dash-bulan-maju').disabled"));
    const bd = await teks("banding");
    catat("Lingkaran: terpakai 40%, Donasi naik baik, Selisih 3 jt", /40%terpakai/.test(bd) && /Donasi5 jt▲ 100%/.test(bd) && /SelisihRp 3 jt/.test(bd), bd);
    const judulArus = await evalJs(`[...${w("arus")}.querySelectorAll('title')].map(function(t){return t.textContent;}).join('|')`);
    catat("Arus Kas: masuk 5 jt, keluar 2 jt; Transfer antar Kas tidak dihitung", /Masuk Rp 5\.000\.000\nKeluar Rp 2\.000\.000/.test(judulArus), judulArus);
    catat("Tren Donasi: puncak 5 jt dari 30 hari", /5 jt/.test(await teks("tren")) && await evalJs(`${w("tren")}.querySelectorAll('title').length===30`), await teks("tren"));
    const per = await teks("perhatian");
    catat("Perlu Perhatian: enam hal, lencana 6 hal", /Penyusutan .* belum diproses/.test(per) && /Gaji belum lunas: 1/.test(per) && /Anggaran Beban Listrik terlewati Rp 200\.000/.test(per) && /berakhir 1?\d hari lagi, baru 0%/.test(per) && /sisa dana minus: 1/.test(per) && /tidak cocok/.test(per) && /6 hal/.test(per), per);
    const ang = await teks("anggaran");
    catat("Anggaran: yang lewat di depan, 120% dan 80%", /120%Beban ListrikLewat 200 rb/.test(ang) && /80%Beban Konsumsi800 rb \/ 1 jt/.test(ang), ang);
    catat("Program Terbaik dan Beban Terbesar", /1BeasiswaRp 5 jt2Tanpa ProgramRp 2,5 jt/.test(await teks("program")) && /Beban Listrik1,2 jt/.test(await teks("pengeluaran")) && /2 jtbulan ini/.test(await teks("pengeluaran")), (await teks("program")) + "|" + (await teks("pengeluaran")));
    catat("Aktivitas garis waktu; kode HTML tetap teks", /Buat Pembayaran <b>BK-1<\/b>/.test(await teks("aktivitas")) && !(await evalJs(`${w("aktivitas")}.querySelector('span b')`)), await teks("aktivitas"));
    await foto("dashboard.png");

    // Pilih bulan
    await evalJs("document.getElementById('dash-bulan-mundur').click(); true"); await tunggu(200);
    const ring2 = await teks("ringkasan");
    catat("Tombol ‹: bulan lalu; donasi 2,5 jt, pengeluaran 0, belum ada pembanding", /Donasi bulan iniRp 2\.500\.000Belum ada pembanding/.test(ring2) && /Pengeluaran bulan iniRp 0/.test(ring2) && await evalJs("!document.getElementById('dash-bulan-maju').disabled"), ring2);
    catat("Perlu Perhatian tetap menurut hari ini", /Anggaran Beban Listrik terlewati/.test(await teks("perhatian")));
    await evalJs("document.getElementById('dash-bulan-maju').click(); document.getElementById('dash-bulan-maju').click(); true"); await tunggu(200);
    catat("Tombol ›: berhenti di bulan ini", /Donasi bulan iniRp 5\.000\.000/.test(await teks("ringkasan")) && await evalJs("geserBulanDashboard===0"));

    // + Widget
    await evalJs("document.getElementById('tombol-widget').click(); true"); await tunggu(200);
    catat("Popup Atur Widget: 18 baris, 10 tercentang", await evalJs("document.getElementById('dialog-widget').open && document.querySelectorAll('#daftar-atur-widget li').length===18 && document.querySelectorAll('#daftar-atur-widget input:checked').length===10"));
    await foto("dashboard-widget.png");
    const centang = (i) => evalJs(`document.querySelectorAll('#daftar-atur-widget input')[${i}].click(); true`);
    await centang(10); await tunggu(150);   // rekening
    catat("Centang widget tambahan: langsung tampil, saldo benar", (await tampil()).endsWith("target,rekening") && /Kas MasjidRp 6\.200\.000/.test(await teks("rekening")), await teks("rekening"));
    await evalJs("document.querySelector('#daftar-atur-widget li:nth-child(11) [aria-label^=Naik]').click(); true"); await tunggu(150);
    catat("Tombol naik mengubah urutan", (await tampil()).endsWith("rekening,target"), await tampil());
    await evalJs("document.getElementById('selesai-widget').click(); true");
    await muatUlang();
    catat("Pengaturan tetap sesudah halaman dimuat ulang", (await tampil()).endsWith("rekening,target"), await tampil());
    await evalJs(`${w("anggaran")}.querySelector('[aria-label^=Sembunyikan]').click(); true`); await tunggu(150);
    catat("Tombol Sembunyikan menghilangkan widget", !(await tampil()).includes("anggaran"));
    for (const x of ["tahun", "komposisi", "kategori", "donatur", "terbaru", "sisa-dana", "aset"]) { await evalJs(`(function(){var d=bacaPengaturanWidget(); d.tampil['${x}']=true; simpanPengaturanWidget(d); return true;})()`); }
    await tunggu(200);
    catat("Semua widget tambahan terisi tanpa pesan galat", !(await evalJs("document.getElementById('grid-widget').textContent.indexOf('belum bisa ditampilkan')!==-1")));
    catat("Grafik tahun 12 bulan dengan tooltip", await evalJs(`${w("tahun")}.querySelectorAll('.grafik-kolom').length===12 && ${w("tahun")}.querySelectorAll('.grafik-kolom')[${nomorBulan - 1}].title.indexOf('Pengeluaran Rp 2.000.000')!==-1`));
    catat("Komposisi, Sisa Dana, Aset benar", /Tanpa pembatasan/.test(await teks("komposisi")) && /SantunanRp -800\.000/.test(await teks("sisa-dana")) && /Nilai BukuRp 120\.000\.000/.test(await teks("aset")), await teks("sisa-dana"));
    await foto("dashboard-semua.png");
    await evalJs("document.getElementById('tombol-widget').click(); document.getElementById('bawaan-widget').click(); document.getElementById('selesai-widget').click(); true"); await tunggu(200);
    catat("Kembalikan ke Bawaan", await tampil() === BAWAAN, await tampil());
    await evalJs(`${w("anggaran")}.querySelector('.widget-judul').click(); true`); await tunggu(300);
    catat("Klik judul Anggaran membuka Monitor Anggaran", await evalJs("!document.getElementById('isi-monitor-anggaran').hidden"));
    await evalJs("tampilkanTab('dashboard'); true"); await tunggu(150);
    catat("Ikut Cadangan Data", await evalJs("jenisKunciCadangan.widgetDashboard==='objek'"));
    // Pengaturan rusak dan data rusak
    await evalJs("localStorage.setItem('widgetDashboard', JSON.stringify({urutan:['hilang',5,null,'ringkasan','ringkasan'], tampil:'rusak'})); localStorage.setItem('daftarAnggaran','{rusak'); localStorage.setItem('daftarTargetDonasi', JSON.stringify([null,5,{id:'x'}])); localStorage.setItem('logAktivitas', JSON.stringify([null,{id:1},{waktu:5}])); localStorage.setItem('daftarJurnal', JSON.stringify([null,{id:'r',rincian:'rusak',tanggal:5}])); true");
    await muatUlang();
    catat("Pengaturan dan data rusak: tetap tampil, tidak macet", (await tampil()).startsWith("ringkasan,") && galat.length === 0 && !(await evalJs("document.getElementById('grid-widget').textContent.indexOf('belum bisa ditampilkan')!==-1")), JSON.stringify(galat) + (await evalJs("document.getElementById('grid-widget').textContent")).slice(0, 300));
    await evalJs("localStorage.clear(); true"); await muatUlang();
    catat("Tanpa data: pesan kosong, Rp 0", /Rp 0/.test(await teks("ringkasan")) && /Belum ada donasi atau pengeluaran/.test(await teks("banding")) && /Belum ada anggaran bulan ini/.test(await teks("anggaran")), await teks("banding"));
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(300);
    catat("Lebar 390: kartu dan widget di dalam layar", await evalJs(`${w("banding")}.getBoundingClientRect().right<=window.innerWidth && ${w("ringkasan")}.getBoundingClientRect().right<=window.innerWidth`), await evalJs(`${w("banding")}.getBoundingClientRect().right`));
    await foto("dashboard-hp.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack + "\nGalat halaman: " + JSON.stringify(galat)); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
