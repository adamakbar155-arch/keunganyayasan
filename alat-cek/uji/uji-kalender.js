// Uji pemilih tanggal (kalender). Pemakaian: node uji-kalender.js <jalur-jsdom> <jalur-menu.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + require("fs").readFileSync(require("path").join(require("path").dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
const kesalahan = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => kesalahan.push("jsdomError: " + (e.detail || e.message)));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true, beforeParse: require("./bantu-sesi.js").pasang }); /* masuk sebagai pengguna uji (J.25) */
const w = dom.window, d = w.document;
w.addEventListener("error", (e) => kesalahan.push("window.error: " + e.message));
w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
w.HTMLDialogElement.prototype.close = function () { this.open = false; };
let lolos = 0, gagal = 0;
const cek = (n, k, info) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (info !== undefined ? "  -> " + JSON.stringify(info) : "")); } };
const el = (id) => d.getElementById(id);
const semuaId = ["kar-tgl-masuk", "yayasan-tgl-mulai", "batas-tanggal-kunci", "akun-tgl-saldo", "jurnal-tanggal"];
const bungkus = (id) => el(id).nextElementSibling;                       // .pemilih-tanggal sesudah kolom asli
const tampil = (id) => el(id + "-tampil");
const ikon = (id) => bungkus(id).querySelector(".pt-ikon");
const kal = (id) => bungkus(id).querySelector(".pt-kalender");
const judul = (id) => kal(id).querySelector(".pt-judul").textContent;
const hari = (id) => [...kal(id).querySelectorAll(".pt-hari")];
const nav = (id, label) => kal(id).querySelector('.pt-nav[aria-label="' + label + '"]');
const ubahLog = [];
semuaId.forEach(id => el(id).addEventListener("change", () => ubahLog.push(id)));
const iso = (t, b, h) => t + "-" + String(b).padStart(2, "0") + "-" + String(h).padStart(2, "0");

cek("1) kelima kolom tanggal di aplikasi dipasangi kalender (kolom teks + tombol kalender); kolom asli tersembunyi", semuaId.every(id => el(id).hidden && !!tampil(id) && !!ikon(id) && bungkus(id).classList.contains("pemilih-tanggal")));
cek("   tidak ada kolom <input type=date> yang terlewat (26 kolom, termasuk Tanggal/Jatuh Tempo gaji, Pembayaran, Penerimaan, Transfer, dari/sampai Histori Bank, Histori Akun, dan Rekonsiliasi Bank, Pencatatan Donasi, mulai/selesai Target Donasi, Pemindahan Dana, Dari/s/d Parameter Laporan, Transfer Anggaran, Tanggal Beli/Pakai Aset, Lepas Aset)", [...d.querySelectorAll('input[type="date"]')].length === 26 && !!tampil('tang-tanggal') && !!tampil('aset-tanggal-beli') && !!tampil('lepas-tanggal') && !!tampil('param-dari') && !!tampil('param-sampai') && !!tampil('pd-tanggal') && !!tampil('td-mulai') && !!tampil('td-selesai') && !!tampil('histori-akun-dari') && !!tampil('histori-akun-sampai') &&!!tampil('rekonsiliasi-dari') && !!tampil('rekonsiliasi-sampai') && !!tampil('histori-bank-dari') && !!tampil('histori-bank-sampai') && !!tampil('transfer-tanggal') && !!tampil('terima-tanggal') && !!tampil('bayar-tanggal') && !!tampil('pgaji-tanggal') && !!tampil('pgaji-jatuh-tempo') && [...d.querySelectorAll('input[type="date"]')].every(k => k.hidden));
cek("   kolom teks berformat dd/mm/yyyy dengan petunjuk 'dd/mm/yyyy'", tampil("akun-tgl-saldo").placeholder === "dd/mm/yyyy" && tampil("akun-tgl-saldo").maxLength === 10);
cek("   label ('per Tgl', 'Tgl Masuk', ...) mengarah ke kolom yang terlihat", d.querySelector('label[for="akun-tgl-saldo-tampil"]') !== null && d.querySelector('label[for="akun-tgl-saldo"]') === null && d.querySelector('label[for="kar-tgl-masuk-tampil"]') !== null);

// ---- Sinkron dengan kode lain (yang membaca/menulis nilai kolom asli) ----
el("akun-tgl-saldo").value = "2026-10-23";
cek("2) kode lain mengisi nilai kolom asli (ISO): tampilan ikut menjadi 23/10/2026", tampil("akun-tgl-saldo").value === "23/10/2026" && el("akun-tgl-saldo").value === "2026-10-23");
el("akun-tgl-saldo").value = "";
cek("   nilai dikosongkan: tampilan kosong", tampil("akun-tgl-saldo").value === "");
el("akun-tgl-saldo").value = "2026-03-05";
cek("   kolom asli tetap mengembalikan bentuk ISO (2026-03-05), tampilan 05/03/2026", el("akun-tgl-saldo").value === "2026-03-05" && tampil("akun-tgl-saldo").value === "05/03/2026");
cek("   fokus pada kolom asli dialihkan ke kolom yang terlihat", (el("akun-tgl-saldo").focus(), d.activeElement === tampil("akun-tgl-saldo")));
el("batas-tanggal-kunci").disabled = true;
cek("   kolom asli dinonaktifkan: kolom teks dan tombol kalender ikut nonaktif", tampil("batas-tanggal-kunci").disabled && ikon("batas-tanggal-kunci").disabled);
el("batas-tanggal-kunci").disabled = false;
cek("   diaktifkan lagi: ikut aktif", !tampil("batas-tanggal-kunci").disabled && !ikon("batas-tanggal-kunci").disabled);

// ---- Membuka kalender ----
el("akun-tgl-saldo").value = "2026-10-23";
ikon("akun-tgl-saldo").click();
cek("3) klik tombol kalender: kalender terbuka dengan judul 'Oktober 2026' (bulan Indonesia)", !kal("akun-tgl-saldo").hidden && judul("akun-tgl-saldo") === "Oktober 2026" && ikon("akun-tgl-saldo").getAttribute("aria-expanded") === "true", judul("akun-tgl-saldo"));
cek("   nama hari: Mg Sn Sl Rb Km Jm Sb (Minggu di kolom pertama)", [...kal("akun-tgl-saldo").querySelectorAll("thead th")].map(t => t.textContent).join(" ") === "Mg Sn Sl Rb Km Jm Sb");
cek("   Oktober 2026: 31 tanggal; tanggal 1 jatuh pada hari Kamis (kolom ke-5)", hari("akun-tgl-saldo").length === 31 && hari("akun-tgl-saldo")[0].parentElement.cellIndex === 4, hari("akun-tgl-saldo")[0].parentElement.cellIndex);
const terpilih = kal("akun-tgl-saldo").querySelector(".pt-hari.dipilih");
cek("   tanggal terpilih (23) ditandai hijau 'dipilih'; hanya satu", !!terpilih && terpilih.textContent === "23" && kal("akun-tgl-saldo").querySelectorAll(".pt-hari.dipilih").length === 1);
const hariIni = w.tanggalHariIni();
cek("   hari ini diberi penanda 'hari-ini' bila ada di bulan yang tampil", (hariIni.slice(0, 7) !== "2026-10") || kal("akun-tgl-saldo").querySelector(".pt-hari.hari-ini").dataset.iso === hariIni);

// ---- Navigasi bulan/tahun ----
nav("akun-tgl-saldo", "Bulan berikutnya").click();
cek("4) kalender TETAP TERBUKA setelah klik tombol navigasi (tombol dibuang saat digambar ulang tidak dianggap klik di luar)", !kal("akun-tgl-saldo").hidden);
cek("   tombol ›: ke November 2026 (30 hari)", judul("akun-tgl-saldo") === "November 2026" && hari("akun-tgl-saldo").length === 30);
nav("akun-tgl-saldo", "Bulan sebelumnya").click(); nav("akun-tgl-saldo", "Bulan sebelumnya").click();
cek("   tombol ‹ dua kali: September 2026 (30 hari)", judul("akun-tgl-saldo") === "September 2026" && hari("akun-tgl-saldo").length === 30);
nav("akun-tgl-saldo", "Tahun berikutnya").click();
cek("   tombol »: September 2027", judul("akun-tgl-saldo") === "September 2027");
nav("akun-tgl-saldo", "Tahun sebelumnya").click(); nav("akun-tgl-saldo", "Tahun sebelumnya").click();
cek("   tombol « dua kali: September 2025", judul("akun-tgl-saldo") === "September 2025");
for (let i = 0; i < 9; i++) { nav("akun-tgl-saldo", "Bulan berikutnya").click(); }
cek("   maju 9 bulan melewati pergantian tahun: Juni 2026", judul("akun-tgl-saldo") === "Juni 2026", judul("akun-tgl-saldo"));
nav("akun-tgl-saldo", "Bulan sebelumnya").click();
for (let i = 0; i < 5; i++) { nav("akun-tgl-saldo", "Bulan sebelumnya").click(); }
cek("   mundur melewati Januari: Desember 2025", judul("akun-tgl-saldo") === "Desember 2025", judul("akun-tgl-saldo"));
cek("   Februari tahun kabisat 2028 punya 29 hari", (el("akun-tgl-saldo").value = "2028-02-10", ikon("akun-tgl-saldo").click(), ikon("akun-tgl-saldo").click(), hari("akun-tgl-saldo").length === 29));

// ---- Memilih tanggal ----
ubahLog.length = 0;
el("akun-tgl-saldo").value = "2026-10-23";
if (!kal("akun-tgl-saldo").hidden) { ikon("akun-tgl-saldo").click(); }
ikon("akun-tgl-saldo").click();
hari("akun-tgl-saldo").find(b => b.textContent === "7").click();
cek("5) klik tanggal 7: nilai asli menjadi 2026-10-07, tampilan 07/10/2026, kalender tertutup, peristiwa 'change' terkirim", el("akun-tgl-saldo").value === "2026-10-07" && tampil("akun-tgl-saldo").value === "07/10/2026" && kal("akun-tgl-saldo").hidden && ubahLog.includes("akun-tgl-saldo"), [el("akun-tgl-saldo").value, ubahLog]);
cek("   fokus kembali ke kolom teks", d.activeElement === tampil("akun-tgl-saldo"));
ubahLog.length = 0;
ikon("akun-tgl-saldo").click();
hari("akun-tgl-saldo").find(b => b.textContent === "7").click();
cek("   memilih tanggal yang sama tidak mengirim 'change' lagi", !ubahLog.includes("akun-tgl-saldo"));

// ---- Mengetik ----
const ketik = (id, teks) => { tampil(id).value = teks; tampil(id).dispatchEvent(new w.Event("input", { bubbles: true })); };
ubahLog.length = 0;
ketik("akun-tgl-saldo", "15032027");
cek("6) mengetik 15032027: garis miring ditambah otomatis -> 15/03/2027", tampil("akun-tgl-saldo").value === "15/03/2027", tampil("akun-tgl-saldo").value);
tampil("akun-tgl-saldo").dispatchEvent(new w.Event("blur"));
cek("   keluar dari kolom: nilai asli 2027-03-15, 'change' terkirim", el("akun-tgl-saldo").value === "2027-03-15" && ubahLog.includes("akun-tgl-saldo"));
ketik("akun-tgl-saldo", "31/02/2027"); tampil("akun-tgl-saldo").dispatchEvent(new w.Event("blur"));
cek("   tanggal tidak ada di kalender (31/02/2027): ditolak, kembali ke 15/03/2027", el("akun-tgl-saldo").value === "2027-03-15" && tampil("akun-tgl-saldo").value === "15/03/2027", tampil("akun-tgl-saldo").value);
ketik("akun-tgl-saldo", "abc12");
cek("   huruf dibuang saat mengetik (abc12 -> 12)", tampil("akun-tgl-saldo").value === "12", tampil("akun-tgl-saldo").value);
tampil("akun-tgl-saldo").dispatchEvent(new w.Event("blur"));
cek("   setengah ketik lalu keluar: kembali ke nilai sebelumnya", tampil("akun-tgl-saldo").value === "15/03/2027" && el("akun-tgl-saldo").value === "2027-03-15");
ketik("akun-tgl-saldo", ""); tampil("akun-tgl-saldo").dispatchEvent(new w.Event("blur"));
cek("   dikosongkan lalu keluar: nilai asli menjadi kosong", el("akun-tgl-saldo").value === "" && tampil("akun-tgl-saldo").value === "");
ketik("akun-tgl-saldo", "1-2-2026"); tampil("akun-tgl-saldo").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
cek("   ketikan 1-2-2026 dirapikan menjadi 12/20/26 (tidak sah): ditolak, nilai tetap kosong atau sah, tidak rusak", /^(|\d{4}-\d{2}-\d{2})$/.test(el("akun-tgl-saldo").value) && /^(|\d{2}\/\d{2}\/\d{4})$/.test(tampil("akun-tgl-saldo").value), tampil("akun-tgl-saldo").value);
ketik("akun-tgl-saldo", "01022026"); tampil("akun-tgl-saldo").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
cek("   mengetik 01022026 lalu Enter: 2026-02-01", el("akun-tgl-saldo").value === "2026-02-01");

// ---- Batas tanggal (max) ----
const hariIniIso = w.tanggalHariIni();
const [tt, bb, hh] = hariIniIso.split("-").map(Number);
w.modulJurnal.bukaBaru();
cek("7) formulir Jurnal membatasi tanggal sampai hari ini (Preferensi melarang masa depan): max = hari ini", el("jurnal-tanggal").max === hariIniIso, el("jurnal-tanggal").max);
ikon("jurnal-tanggal").click();
const depan = hari("jurnal-tanggal").filter(b => b.dataset.iso > hariIniIso);
const lalu = hari("jurnal-tanggal").filter(b => b.dataset.iso <= hariIniIso);
cek("   tanggal setelah hari ini tidak bisa dipilih (disabled); sampai hari ini bisa", depan.every(b => b.disabled) && lalu.every(b => !b.disabled), [depan.length, lalu.length]);
if (depan.length) { depan[0].click(); }
cek("   mengklik tanggal terlarang tidak mengubah nilai (tetap kosong, Data Baru PRD 5.3a)", el("jurnal-tanggal").value === "");
nav("jurnal-tanggal", "Bulan berikutnya").click();
cek("   bulan depan seluruhnya nonaktif tetapi tetap bisa dilihat", hari("jurnal-tanggal").length > 0 && hari("jurnal-tanggal").every(b => b.disabled));
ikon("jurnal-tanggal").click();

// ---- Penutupan ----
ikon("akun-tgl-saldo").click();
cek("8) satu kalender terbuka pada satu waktu: membuka kalender lain menutup yang pertama", (ikon("kar-tgl-masuk").click(), kal("akun-tgl-saldo").hidden && !kal("kar-tgl-masuk").hidden));
d.body.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
cek("   klik di luar menutup kalender", kal("kar-tgl-masuk").hidden);
ikon("kar-tgl-masuk").click();
d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
cek("   Esc menutup kalender dan fokus kembali ke kolom teks", kal("kar-tgl-masuk").hidden && d.activeElement === tampil("kar-tgl-masuk"));
tampil("kar-tgl-masuk").dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
cek("   panah bawah di kolom teks membuka kalender", !kal("kar-tgl-masuk").hidden);
ikon("kar-tgl-masuk").click();
el("batas-tanggal-kunci").disabled = false;
ikon("batas-tanggal-kunci").click();
el("batas-tanggal-kunci").disabled = true;
cek("   kolom dinonaktifkan saat kalender terbuka: kalender menutup", kal("batas-tanggal-kunci").hidden);
el("batas-tanggal-kunci").disabled = false;

// ---- Aman dari kode HTML & kompatibel dengan form lain ----
cek("9) isi kalender dibuat lewat textContent (tidak ada elemen asing)", [...d.querySelectorAll(".pt-kalender")].every(k => k.querySelectorAll("script,img,iframe").length === 0));
// Karyawan: Data Baru dibuka kosong (PRD 5.3a); tanggal yang diisi lewat kode tetap tampil di kalender
w.modulKaryawan.bukaBaru();
cek("10) formulir Karyawan: Tgl Masuk kosong saat dibuka; diisi lewat kode, tampil di kalender", el("kar-tgl-masuk").value === "" && tampil("kar-tgl-masuk").value === "" && (el("kar-tgl-masuk").value = hariIniIso, tampil("kar-tgl-masuk").value === w.isoKeTampilan(hariIniIso)), [el("kar-tgl-masuk").value, tampil("kar-tgl-masuk").value]);
// Preferensi: tanggal mulai data disimpan lewat kode lama
el("yayasan-tgl-mulai").value = "2024-09-30";
cek("11) Preferensi: tanggal mulai data dibaca kode lama dalam bentuk ISO; tampil 30/09/2024", el("yayasan-tgl-mulai").value === "2024-09-30" && tampil("yayasan-tgl-mulai").value === "30/09/2024");
// Pembatasan
el("batas-tanggal-kunci").value = "2026-09-30";
cek("12) Pembatasan: tanggal kunci 2026-09-30 tampil 30/09/2026", tampil("batas-tanggal-kunci").value === "30/09/2026");
cek("13) tidak ada galat skrip", kesalahan.length === 0, kesalahan);
console.log("\nLolos:", lolos, "Gagal:", gagal, "| Kesalahan skrip:", kesalahan.length ? kesalahan : "tidak ada");
process.exit(gagal || kesalahan.length ? 1 : 0);


