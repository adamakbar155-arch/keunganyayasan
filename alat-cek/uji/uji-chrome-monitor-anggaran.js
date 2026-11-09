// Uji Monitor Anggaran dan Transfer Anggaran (PRD 6.5) di Chrome asli, dengan hitungan tangan:
// Beban Listrik Januari 2026: anggaran 1.000.000, jurnal debit 700.000 dan kredit 100.000 = penggunaan 600.000, sisa 400.000.
// Donasi Januari: anggaran 5.000.000, jurnal kredit 2.000.000, sisa 3.000.000. Transfer 300.000 dari Listrik ke Konsumsi Februari.
// Per Divisi: jurnal Divisi lain tidak ikut. Pemakaian: node uji-chrome-monitor-anggaran.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9394;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };

const akun = (id, kode, nama, tipe, indukId) => ({ id, kode, nama, tipe, indukId: indukId || "" });
const AKUN = [
  akun("k0", "1101", "Kas & Bank", "kas-bank"), akun("k1", "110101", "Kas Kecil", "kas-bank", "k0"),
  akun("p0", "4101", "Pendapatan", "pendapatan"), akun("p1", "410101", "Donasi", "pendapatan", "p0"),
  akun("b0", "5101", "Beban", "beban"), akun("b1", "510101", "Beban Konsumsi", "beban", "b0"), akun("b2", "510102", "Beban Listrik", "beban", "b0")
];
const baris = (akunId, debit, kredit, divisiId) => ({ akunId, debit, kredit, divisiId: divisiId || "", programId: "" });
const JURNAL = [
  { id: "j1", nomor: "J1", tanggal: "2026-01-10", rincian: [baris("b2", 700000, 0, "d1"), baris("k1", 0, 700000)] },
  { id: "j2", nomor: "J2", tanggal: "2026-01-20", rincian: [baris("b2", 0, 100000, "d2"), baris("k1", 100000, 0)] },
  { id: "j3", nomor: "J3", tanggal: "2026-01-15", rincian: [baris("k1", 2000000, 0), baris("p1", 0, 2000000, "d1")] },
  { id: "j4", nomor: "J4", tanggal: "2026-02-01", rincian: [baris("b2", 999999, 0, "d1"), baris("k1", 0, 999999)] }
];
const ANGGARAN = [
  { id: "a1", nama: "Januari 2026, Umum", bulan: 1, tahun: 2026, tipe: "umum", kelompokId: "", rincian: [{ id: "r1", akunId: "b2", kode: "510102", nama: "Beban Listrik", nilai: 1000000 }, { id: "r2", akunId: "p1", kode: "410101", nama: "Donasi", nilai: 5000000 }], total: 6000000 },
  { id: "a2", nama: "Januari 2026, Makam", bulan: 1, tahun: 2026, tipe: "divisi", kelompokId: "d1", rincian: [{ id: "r3", akunId: "b2", kode: "510102", nama: "Beban Listrik", nilai: 800000 }], total: 800000 },
  { id: "a3", nama: "Januari 2026, Masjid", bulan: 1, tahun: 2026, tipe: "divisi", kelompokId: "d2", rincian: [{ id: "r4", akunId: "b2", kode: "510102", nama: "Beban Listrik", nilai: 200000 }], total: 200000 }
];

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
    const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); for (let i = 0; i < 100; i++) { if (await evalJs("document.readyState==='complete' && typeof bukaMonitorAnggaran==='function' && typeof bukaTransferAnggaranBaru==='function'")) { break; } await tunggu(200); } await tunggu(200); };
    await tunggu(800);
    const simpanAwal = (kunci, isi) => "localStorage.setItem('" + kunci + "', " + JSON.stringify(JSON.stringify(isi)) + ");";
    await evalJs("localStorage.clear();" + simpanAwal("daftarAkun", AKUN) + simpanAwal("daftarDivisi", [{ id: "d1", nama: "Makam" }, { id: "d2", nama: "Masjid" }]) + simpanAwal("daftarProgram", []) + simpanAwal("daftarJurnal", JURNAL) + simpanAwal("daftarAnggaran", ANGGARAN) + "true");
    await muatUlang();
    const ganti = (id, nilai) => evalJs(`(function(){var s=document.getElementById('${id}'); s.value=${JSON.stringify(nilai)}; s.dispatchEvent(new Event('change',{bubbles:true})); return true;})()`);
    const barisMon = () => evalJs("[...document.querySelectorAll('#mang-rincian tr')].map(function(x){return [...x.cells].map(function(c){return c.textContent;}).join('|');})");
    const galatForm = () => evalJs("document.getElementById('tang-pesan-galat').hidden ? '' : document.getElementById('tang-pesan-galat').textContent");
    const isiAngka = (nilai) => evalJs(`(function(){var k=document.getElementById('tang-nilai'); k.value=${JSON.stringify(nilai)}; k.dispatchEvent(new Event('input',{bubbles:true})); return true;})()`);

    // ===== Monitor =====
    await klik("#tombol-buku-besar"); await tunggu(300);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Monitor Anggaran"]'); await tunggu(400);
    catat("Klik kotak Monitor Anggaran: tab terbuka, urutan isian seperti foto", await evalJs("!document.getElementById('isi-monitor-anggaran').hidden && document.getElementById('mang-tipe').value==='umum'"));
    catat("Tipe Umum: kolom Divisi/Program tidak bisa diisi", await evalJs("document.getElementById('mang-kelompok').disabled"));
    await ganti("mang-bulan", "1"); await tunggu(150);
    await ganti("mang-tahun", "2026"); await tunggu(200);
    const umum = await barisMon();
    catat("Umum Januari: Anggaran, Penggunaan debit - kredit, Sisa; jurnal bulan lain tidak ikut; pendapatan kredit - debit", JSON.stringify(umum) === JSON.stringify(["Donasi|410101|5.000.000|2.000.000|3.000.000", "Beban Listrik|510102|1.000.000|600.000|400.000"]), JSON.stringify(umum));
    await foto("monitor-anggaran.png");
    await ganti("mang-akun", "b2"); await tunggu(150);
    catat("Pilih satu akun: hanya akun itu", (await barisMon()).length === 1);
    await ganti("mang-akun", ""); await tunggu(100);
    await ganti("mang-tipe", "divisi"); await tunggu(200);
    catat("Per Divisi tanpa pilihan: semua Divisi dijumlah (800.000 + 200.000; pakai 700.000 - 100.000)", JSON.stringify(await barisMon()) === JSON.stringify(["Beban Listrik|510102|1.000.000|600.000|400.000"]), JSON.stringify(await barisMon()));
    await ganti("mang-kelompok", "d2"); await tunggu(200);
    catat("Divisi Masjid: hanya jurnalnya sendiri (kredit 100.000 = penggunaan minus)", JSON.stringify(await barisMon()) === JSON.stringify(["Beban Listrik|510102|200.000|-100.000|300.000"]), JSON.stringify(await barisMon()));
    await ganti("mang-tipe", "umum"); await tunggu(150);
    await ganti("mang-bulan", "3"); await tunggu(150);
    catat("Bulan tanpa anggaran: Belum ada data", (await evalJs("document.getElementById('mang-rincian').textContent")) === "Belum ada data");
    await ganti("mang-bulan", "1"); await tunggu(150);

    // ===== Transfer =====
    await klik("#tombol-buku-besar"); await tunggu(300);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Transfer Anggaran"]'); await tunggu(400);
    catat("Klik kotak Transfer Anggaran: formulir terbuka, Sisa '-'", await evalJs("!document.getElementById('isi-transfer-anggaran').hidden && document.getElementById('tang-sisa').textContent==='-'"));
    await foto("transfer-anggaran.png");
    // Data Baru dibuka kosong (PRD 5.3a): Tanggal dan Tipe diisi seperti pengguna
    catat("Transfer Anggaran Data Baru kosong: Tanggal, Tipe, Tahun, Bulan", await evalJs("['tang-tanggal','tang-tipe','tang-tahun','tang-bulan-dari'].every(function(i){return document.getElementById(i).value==='';})"));
    await ganti("tang-tanggal", await evalJs("tanggalHariIni()")); await ganti("tang-tipe", "umum");
    await ganti("tang-tahun", "2026"); await ganti("tang-bulan-dari", "1"); await tunggu(200);
    catat("Akun asal hanya yang punya anggaran; akun tujuan semua akun pendapatan dan beban", await evalJs("[...document.getElementById('tang-akun-dari').options].map(function(o){return o.value;}).filter(Boolean).join()==='p1,b2' && [...document.getElementById('tang-akun-ke').options].map(function(o){return o.value;}).filter(Boolean).join()==='p1,b1,b2'"), await evalJs("[...document.getElementById('tang-akun-dari').options].map(function(o){return o.value;}).join()"));
    await ganti("tang-akun-dari", "b2"); await tunggu(150);
    catat("Pilih akun asal: Sisa Anggaran sama dengan Monitor", await evalJs("document.getElementById('tang-sisa').textContent==='Rp 400.000'"), await evalJs("document.getElementById('tang-sisa').textContent"));
    await evalJs("document.getElementById('tang-nomor-otomatis').click(); document.getElementById('tang-nomor').value='TA-1'; true");
    await ganti("tang-bulan-ke", "1"); await ganti("tang-akun-ke", "b2"); await isiAngka("100000");
    await klik("#tang-simpan"); await tunggu(200);
    catat("Asal dan tujuan sama persis ditolak", /tidak boleh sama/.test(await galatForm()), await galatForm());
    await ganti("tang-akun-ke", "b1"); await ganti("tang-bulan-ke", "2"); await isiAngka("400001");
    await klik("#tang-simpan"); await tunggu(200);
    catat("Nilai melebihi Sisa ditolak dan menyebut Sisa", /melebihi Sisa Anggaran \(Rp 400\.000\)/.test(await galatForm()), await galatForm());
    await isiAngka("300000");
    await klik("#tang-simpan"); await tunggu(300);
    const trf = JSON.parse(await evalJs("localStorage.getItem('daftarTransferAnggaran')"));
    catat("Simpan: data lengkap, tidak membuat jurnal", trf.length === 1 && trf[0].nilai === 300000 && trf[0].bulanDari === 1 && trf[0].bulanKe === 2 && trf[0].akunDari === "510102 Beban Listrik" && await evalJs("bacaJurnalMentah().length===4"), JSON.stringify(trf[0]));
    catat("Anggaran asal dikurangi transfer, Sisa ikut berkurang", await evalJs("rencanaPosAnggaran({tipe:'umum',kelompokId:'',bulan:1,tahun:2026,akunId:'b2'})===700000 && sisaPosAnggaran({tipe:'umum',kelompokId:'',bulan:1,tahun:2026,akunId:'b2'})===100000"));
    await klik("#tombol-buku-besar"); await tunggu(300);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Monitor Anggaran"]'); await tunggu(300);
    await ganti("mang-bulan", "2"); await tunggu(200);
    catat("Monitor Februari: akun tujuan tanpa anggaran muncul dengan nilai transfer", (await barisMon()).some(x => x === "Beban Konsumsi|510101|300.000|0|300.000"), JSON.stringify(await barisMon()));
    await evalJs("modulTransferAnggaran.bukaUbah(modulTransferAnggaran.ambil()[0]); bukaTab('transfer-anggaran'); true"); await tunggu(250);
    catat("Buka ubah: transfer sendiri tidak mengurangi Sisa (Rp 400.000)", await evalJs("document.getElementById('tang-sisa').textContent==='Rp 400.000' && document.getElementById('tang-akun-dari').value==='b2' && document.getElementById('tang-bulan-ke').value==='2'"), await evalJs("document.getElementById('tang-sisa').textContent"));
    await klik("#tang-simpan"); await tunggu(300);
    catat("Simpan ubahan: tetap satu data", await evalJs("JSON.parse(localStorage.getItem('daftarTransferAnggaran')).length===1") && await galatForm() === "", await galatForm());
    await evalJs("modulTransferAnggaran.tampilkan('daftar'); modulTransferAnggaran.gambarTabel(); true"); await tunggu(250);
    const daftar = await evalJs("document.querySelector('#isi-transfer-anggaran .tabel-daftar tbody').textContent");
    catat("Daftar: No Transfer, Dari, Ke, Nilai", /TA-1/.test(daftar) && /Januari, 510102 Beban Listrik/.test(daftar) && /Februari, 510101 Beban Konsumsi/.test(daftar) && /300\.000/.test(daftar), daftar);
    await foto("transfer-anggaran-daftar.png");
    // Penjaga data terkait
    catat("Anggaran asal Transfer tidak bisa dihapus", await evalJs("transferAsalAnggaran(modulAnggaran.ambil()[0]).length===1 && transferAsalAnggaran(modulAnggaran.ambil()[1]).length===0"));
    await evalJs("bukaAnggaranBaru(); modulAnggaran.bukaUbah(modulAnggaran.ambil()[0]); barisAng = barisAng.filter(function(b){return b.akunId!=='b2';}); gambarRincianAng(); true"); await tunggu(200);
    await evalJs("document.getElementById('ang-simpan').click(); true"); await tunggu(250);   // langsung, karena notifikasi tadi menutupi tombol
    catat("Akun asal Transfer tidak bisa dibuang dari rincian Anggaran", /Hapus Transfer-nya dulu/.test(await evalJs("document.getElementById('ang-pesan-galat').textContent")) && await evalJs("JSON.parse(localStorage.getItem('daftarAnggaran'))[0].rincian.length===2"), await evalJs("document.getElementById('ang-pesan-galat').textContent + ' | ' + localStorage.getItem('daftarAnggaran').slice(0,200)"));
    catat("Akun tujuan Transfer tidak bisa dihapus", await evalJs("tempatAkunDipakai('510101')") === "Transfer Anggaran");
    catat("Aturan penomoran bisa bertipe Transfer Anggaran", await evalJs("typeof tipePenomoran==='undefined' || tipePenomoran['transfer-anggaran']==='Transfer Anggaran'"));
    // ===== Laporan Perbandingan Anggaran, hitungan tangan =====
    // Umum 15 Jan - 10 Feb 2026 menjadi Januari sampai Februari penuh. Donasi: aktual 2.000.000, anggaran 5.000.000.
    // Listrik: aktual 600.000 + 999.999 = 1.599.999, anggaran 1.000.000 - 300.000 = 700.000. Konsumsi: anggaran 300.000 dari transfer.
    const bukaLap = (idLap, param) => evalJs(`(function(){var h=null; DAFTAR_LAPORAN.forEach(function(k){(k.kelompok||[]).forEach(function(g){g.laporan.forEach(function(l){if(l.id==='${idLap}'){h=l;}});});}); tampilkanLaporan(h, Object.assign({divisi:[],program:[],akun:[],hanyaTotal:false,akunInduk:true,akunAnak:true}, ${JSON.stringify(param)})); return true;})()`);
    const barisLap = () => evalJs("[...document.querySelectorAll('#lap-k-isi tr')].map(function(x){return [...x.cells].map(function(c){return c.textContent;}).join('|');})");
    await bukaLap("penghasilan-anggaran", { dari: "2026-01-15", sampai: "2026-02-10" }); await tunggu(300);
    const lapUmum = await barisLap();
    const harapUmum = ["Keterangan|Aktual|Anggaran|Selisih|% Selisih", "PENERIMAAN||||", "Donasi|2.000.000|5.000.000|(3.000.000)|-60 %", "JUMLAH PENERIMAAN|2.000.000|5.000.000|(3.000.000)|-60 %", "BEBAN||||", "Beban Konsumsi|-|300.000|(300.000)|-100 %", "Beban Listrik|1.599.999|700.000|899.999|129 %", "JUMLAH BEBAN|1.599.999|1.000.000|599.999|60 %", "SURPLUS (DEFISIT)|400.001|4.000.000|(3.599.999)|-90 %"];
    catat("Laporan Umum: hitungan tangan, termasuk Transfer Anggaran", JSON.stringify(lapUmum) === JSON.stringify(harapUmum), JSON.stringify(lapUmum));
    catat("Periode dibulatkan: Dari periode Januari 2026 s/d Februari 2026", await evalJs("document.getElementById('lap-k-periode').textContent==='Dari periode Januari 2026 s/d Februari 2026'"), await evalJs("document.getElementById('lap-k-periode').textContent"));
    await foto("laporan-anggaran.png");
    await bukaLap("penghasilan-anggaran-divisi", { dari: "2026-01-01", sampai: "2026-01-31", divisi: ["d1"] }); await tunggu(300);
    const lapDivisi = await barisLap();
    catat("Laporan Divisi Makam: Anggaran 0 dan ada Aktual = 100 %; jurnal Divisi lain tidak ikut", lapDivisi.includes("Donasi|2.000.000|-|2.000.000|100 %") && lapDivisi.includes("Beban Listrik|700.000|800.000|(100.000)|-13 %"), JSON.stringify(lapDivisi));
    catat("Kepala kertas Divisi menyebut Divisi saja, tanpa Program", await evalJs("document.getElementById('lap-k-filter').textContent==='Divisi: Makam'"), await evalJs("document.getElementById('lap-k-filter').textContent"));
    await bukaLap("penghasilan-anggaran-program", { dari: "2026-01-01", sampai: "2026-01-31" }); await tunggu(300);
    catat("Laporan Program tanpa data: pesan kosong", /Belum ada transaksi atau anggaran/.test(await evalJs("document.getElementById('lap-k-isi').textContent")));
    await evalJs("aturIsianParameterLaporan({filter:'program'}); true");
    catat("Parameter laporan Program: hanya pilihan Program", await evalJs("document.getElementById('param-baris-divisi').hidden && !document.getElementById('param-baris-program').hidden"));
    // Data rusak
    await evalJs(simpanAwal("daftarTransferAnggaran", [null, 7, { id: "x", tipe: "aneh", tahun: "z", nilai: "q" }, { id: "y", tipe: "divisi", kelompokDariId: "hilang", bulanDari: 99, akunDariId: "tidak-ada" }]) + "true");
    await muatUlang();
    await evalJs("bukaMonitorAnggaran(); bukaTransferAnggaranBaru(); modulTransferAnggaran.tampilkan('daftar'); modulTransferAnggaran.gambarTabel(); modulTransferAnggaran.bukaUbah(modulTransferAnggaran.ambil()[0]); true"); await tunggu(250);
    catat("Data rusak di penyimpanan tidak membuat macet", galat.length === 0, JSON.stringify(galat));
    await evalJs("modulTransferAnggaran.bukaBaru(); true");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(300);
    catat("Lebar 390: Transfer di dalam layar", await evalJs("document.getElementById('form-transfer-anggaran').getBoundingClientRect().right<=window.innerWidth"));
    await foto("transfer-anggaran-hp.png");
    await evalJs("bukaMonitorAnggaran(); true"); await tunggu(250);
    catat("Lebar 390: baris saring Monitor di dalam layar", await evalJs("document.querySelector('.mang-saring').getBoundingClientRect().right<=window.innerWidth"), await evalJs("JSON.stringify({saring:document.querySelector('.mang-saring').getBoundingClientRect().right, lebar:window.innerWidth, gulir:document.documentElement.scrollWidth, tabel:document.querySelector('.mang-tabel').getBoundingClientRect().right, anak:[...document.querySelector('.mang-saring').children].map(function(e){return Math.round(e.getBoundingClientRect().right);})})"));
    await foto("monitor-anggaran-hp.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack + "\nGalat halaman: " + JSON.stringify(galat)); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
