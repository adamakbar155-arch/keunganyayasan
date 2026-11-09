// Uji halaman Akun Perkiraan (model Accurate: Sub Akun dicentang = sub, tidak = induk). Pemakaian: node uji-akun.js <jalur-jsdom> <jalur-menu.html>
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
const isi = (id, v) => { el(id).value = v; el(id).dispatchEvent(new w.Event("input", { bubbles: true })); };
const ubahPilihan = (id, v) => { el(id).value = v; el(id).dispatchEvent(new w.Event("change", { bubbles: true })); };
const centang = (v) => { el("akun-sub").checked = v; el("akun-sub").dispatchEvent(new w.Event("change", { bubbles: true })); };
const kirim = () => el("form-akun").dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));
const galat = (n) => { const e = el("galat-akun-" + n); return e.hidden ? "" : e.textContent; };
const semuaAkun = () => JSON.parse(w.localStorage.getItem("daftarAkun") || "[]");
const perKode = (k) => semuaAkun().find(a => a.kode === k);
const baris = () => [...d.querySelectorAll("#isi-akun tbody tr")].map(tr => [...tr.children].map(td => td.textContent));
const pilihInduk = (kode) => { ubahPilihan("akun-induk", perKode(kode).id); };
const daftarInduk = () => { el("akun-induk-cari").dispatchEvent(new w.Event("focus")); return [...d.querySelectorAll("#akun-induk-daftar .pemilih-pilihan")].map(b => b.textContent.trim()); };
// Data Baru kosong seperti pengguna: kalau tab Data Baru masih berisi isian lama yang belum disimpan, tab itu ditutup lewat
// tombol x (Ya pada peringatan), lalu Data Baru dibuka lagi (PRD 6.10)
const dataBaruKosong = () => {
  w.modulAkun.bukaBaru();
  if (w.modulAkun.adaPerubahan()) {
    d.querySelector("#isi-akun .tab-dokumen .modul-tab.aktif .tab-tutup").click();
    if (el("dialog-konfirmasi").open) { el("ya-konfirmasi").click(); }
    w.modulAkun.bukaBaru();
  }
};const buat = (o) => {
  dataBaruKosong();
  ubahPilihan("akun-tipe", o.tipe || "kas-bank");
  if (o.induk) { centang(true); pilihInduk(o.induk); }
  isi("akun-nama", o.nama);
  isi("akun-saldo", o.saldo || ""); el("akun-tgl-saldo").value = "2026-01-01";
  if (o.bank) { isi("akun-nama-bank", o.bank); isi("akun-no-rekening", o.rek || ""); isi("akun-atas-nama", o.atas || ""); }
  kirim();
};

(async () => {
  try {
    // ---- Awal: kosong ----
    const awal = semuaAkun();
    const aw = (k) => awal.find(a => a.kode === k);
    const induk12 = awal.filter(a => a.indukId === "");
    cek("0) bagan awal dipasang sekali: 12 induk + 32 sub akun = 44 akun", awal.length === 44 && induk12.length === 12, [awal.length, induk12.length]);
    cek("   Kas & Bank 1101 punya sub Kas Kecil 110101, Bank 110102, Setara Kas 110103", aw("1101").nama === "Kas & Bank" && aw("110101").nama === "Kas Kecil" && aw("110102").nama === "Bank" && aw("110103").nama === "Setara Kas" && ["110101", "110102", "110103"].every(k => aw(k).indukId === aw("1101").id));
    cek("   Donasi (410101) satu akun saja (tanpa sub Terikat/Tidak Terikat): pemisahan lewat Program", aw("410101").nama === "Donasi" && aw("410101").indukId === aw("4101").id && !awal.some(a => a.indukId === aw("410101").id) && !awal.some(a => /Terikat/.test(a.nama) && a.tipe === "pendapatan"));
    cek("   induk tipe lain juga punya sub: Aset Tetap 130104 Peralatan dan Inventaris, Modal 310102 Aset Neto Terikat, Beban 510101 Beban Gaji, Pendapatan 410101 Donasi", aw("130104").nama === "Peralatan dan Inventaris" && aw("130104").indukId === aw("1301").id && aw("310102").nama === "Aset Neto Terikat" && aw("510101").nama === "Beban Gaji" && aw("410101").nama === "Donasi" && aw("410101").tipe === "pendapatan");
    cek("   tipe sub akun sama dengan induknya, kode sub = kode induk + 2 digit, semua kode unik", awal.every(a => { const p = awal.find(x => x.id === a.indukId); return !p || (p.tipe === a.tipe && a.kode.startsWith(p.kode) && a.kode.length === p.kode.length + 2); }) && new Set(awal.map(a => a.kode)).size === 44);
    cek("   dipasang tanpa mengisi Log Aktivitas", JSON.parse(w.localStorage.getItem("logAktivitas") || "[]").length === 0);
    w.pasangAkunAwal();
    cek("   dipanggil lagi tidak menggandakan", semuaAkun().length === 44);
    // Daftar tampil berurutan pohon
    w.modulAkun.gambarTabel();
    cek("   daftar menampilkan 44 baris, 1101 paling atas lalu sub-subnya menjorok", baris().length === 44 && baris()[0][0].trim() === "1101" && baris()[1][0].startsWith(" "));
    // Gaji/Tunjangan: akun Beban sudah ada -> pilihan memuat hanya akun bertipe Beban/Beban Lainnya, dan wajib
    w.bukaGajiBaru();
    const opsiAwal = [...el("gaji-akun").options].map(o => o.textContent);
    cek("   Gaji/Tunjangan: Akun Beban memuat 9 akun Beban/Beban Lainnya (tanpa Kas & Bank) dan wajib", opsiAwal.length === 10 && opsiAwal.slice(1).every(t => /^\[(5|6)1/.test(t)) && !el("tanda-wajib-akun").hidden, opsiAwal);
    // Kosongkan dulu untuk menguji pembuatan dari nol (menghapus semua tidak memasang akun awal lagi)
    w.localStorage.setItem("daftarAkun", "[]"); w.modulAkun.gambarTabel(); w.pasangAkunAwal();
    cek("1) daftar yang sengaja dikosongkan tidak diisi akun awal lagi", semuaAkun().length === 0, semuaAkun().length);
    w.bukaAkunBaru();
    cek("2) formulir baru kosong (PRD 5.3a): Tipe 'Silakan Pilih', kode kosong, tanggal saldo kosong", el("akun-tipe").value === "" && el("akun-kode").value === "" && el("akun-tgl-saldo").value === "", [el("akun-tipe").value, el("akun-kode").value, el("akun-tgl-saldo").value]);
    ubahPilihan("akun-tipe", "kas-bank");
    cek("   pilih Kas & Bank: Sub Akun tidak dicentang; kolom induk tersembunyi; kode terkunci terisi 1101", !el("akun-sub").checked && el("akun-induk-baris").hidden && el("akun-kode").readOnly && el("akun-kode").value === "1101", el("akun-kode").value);
    ubahPilihan("akun-tipe", "pendapatan");
    cek("   ganti tipe -> kode 4101", el("akun-kode").value === "4101");
    ubahPilihan("akun-tipe", "kas-bank");
    // Temuan 42: akun baru bertipe Pendapatan memunculkan peringatan Kategori Donasi; tipe lain tidak
    cek("   peringatan Kategori Donasi hanya untuk akun Pendapatan baru", (ubahPilihan("akun-tipe", "pendapatan"), !el("akun-peringatan-donasi").hidden && /Kategori Donasi/.test(el("akun-peringatan-donasi").textContent)) && (ubahPilihan("akun-tipe", "beban"), el("akun-peringatan-donasi").hidden) && (ubahPilihan("akun-tipe", "kas-bank"), el("akun-peringatan-donasi").hidden));
    cek("   blok bank hanya untuk Kas & Bank", !el("akun-bank").hidden && (ubahPilihan("akun-tipe", "beban"), el("akun-bank").hidden) && (ubahPilihan("akun-tipe", "kas-bank"), !el("akun-bank").hidden));
    centang(true);
    cek("3) centang Sub Akun: kolom Cari/Pilih muncul, kode kosong (induk belum dipilih); daftar kosong memberi petunjuk", !el("akun-induk-baris").hidden && el("akun-kode").value === "" && /Belum ada akun bertipe ini/.test(el("akun-induk-daftar").textContent), el("akun-kode").value);
    centang(false);
    cek("   hilangkan centang: kolom induk hilang, kode kembali 1101", el("akun-induk-baris").hidden && el("akun-kode").value === "1101");

    // ---- Validasi ----
    isi("akun-nama", ""); kirim();
    cek("4) nama kosong ditolak", galat("nama") !== "" && semuaAkun().length === 0, galat("nama"));
    isi("akun-nama", "X"); isi("akun-saldo", "1500000a");
    cek("   saldo diketik: titik ribuan langsung muncul, huruf dibuang (1500000a -> 1.500.000)", el("akun-saldo").value === "1.500.000", el("akun-saldo").value);
    el("akun-saldo").value = "12a"; kirim();   // isian tanpa diketik (misalnya diisi kode): pemeriksaan saat Simpan tetap menolak
    cek("   saldo bukan angka ditolak (pindah ke tab Saldo)", galat("saldo") !== "" && !el("sub-akun-saldo").hidden, galat("saldo"));
    isi("akun-saldo", "1.000"); el("akun-tgl-saldo").value = ""; kirim();
    cek("   ada saldo awal tanpa tanggal saldo ditolak (tanpa saldo boleh kosong, PRD 5.3a)", galat("tgl") !== "", galat("tgl"));
    isi("akun-saldo", "");
    el("akun-tgl-saldo").value = "2026-01-01"; centang(true); kirim();
    cek("   Sub Akun dicentang tanpa memilih induk ditolak", galat("induk") !== "" && semuaAkun().length === 0, galat("induk"));
    centang(false);

    // ---- Membuat akun ----
    buat({ nama: "Kas & Bank" });
    buat({ nama: "Bank Lain", bank: "BCA", rek: "123", atas: "Yayasan X", saldo: "1.000" });
    buat({ nama: "Kas Kecil", induk: "1101", saldo: "500" });
    buat({ nama: "Kas Kecil Masjid", induk: "110101", saldo: "11.083.020" });
    buat({ tipe: "pendapatan", nama: "Donasi Umum" });
    buat({ nama: "Kas Besar", induk: "1101", saldo: "1000" });
    const kode = semuaAkun().map(a => a.kode).sort();
    cek("5) kode otomatis: induk 1101, 1102, 4101; sub 110101, 110102; sub-sub 11010101", JSON.stringify(kode) === JSON.stringify(["110101", "11010101", "110102", "1101", "1102", "4101"].sort()), kode);
    cek("   induk tanpa induk (indukId kosong); sub menunjuk induknya", perKode("1101").indukId === "" && perKode("110101").indukId === perKode("1101").id && perKode("11010101").indukId === perKode("110101").id);
    cek("   info bank tersimpan untuk Kas & Bank", perKode("1102").namaBank === "BCA" && perKode("1102").saldoAwal === 1000);
    cek("   setelah simpan, formulir baru menawarkan 1103", (dataBaruKosong(), ubahPilihan("akun-tipe", "kas-bank"), el("akun-kode").value === "1103"), el("akun-kode").value);

    // ---- Daftar bertingkat ----
    w.modulAkun.gambarTabel();
    const ft = d.querySelectorAll("#isi-akun .pilih-filter");
    ft[0].value = "kas-bank"; ft[0].dispatchEvent(new w.Event("change"));
    const b = baris();
    cek("6) urutan pohon: 1101, 110101, 11010101, 110102, 1102", JSON.stringify(b.map(r => r[0].trim())) === JSON.stringify(["1101", "110101", "11010101", "110102", "1102"]), b.map(r => r[0]));
    cek("   jorokan per tingkat", !b[0][0].startsWith(" ") && b[1][0].startsWith(" ") && b[2][0].startsWith(" ".repeat(8)));
    cek("   saldo induk = jumlah semua di bawahnya (500+11.083.020+1000 = 11.084.520)", b[0][3] === "11.084.520" && b[1][3] === "11.083.520" && b[4][3] === "1.000", b.map(r => r[3]));
    ft[0].value = ""; ft[0].dispatchEvent(new w.Event("change"));
    cek("   daftar lengkap 6 baris", baris().length === 6);

    // ---- Pilihan induk ----
    dataBaruKosong(); ubahPilihan("akun-tipe", "kas-bank"); centang(true);   // Tipe dipilih dulu (Data Baru kosong, PRD 5.3a)
    const kandidat = daftarInduk();
    cek("7) pilihan induk: akun bertipe sama, maksimal tiga tingkat -> hanya 4 akun (1101, 110101, 110102, 1102); tanpa Donasi; kode di kanan", kandidat.length === 4 && !kandidat.some(t => /Donasi/.test(t)) && kandidat.some(t => /Kas Kecil\s*110101$/.test(t)) && kandidat.some(t => /Kas & Bank\s*1101$/.test(t)), kandidat);
    cek("   akun tingkat ketiga (Kas Kecil Masjid 11010101) TIDAK muncul sebagai pilihan induk", !kandidat.some(t => /Kas Kecil Masjid/.test(t)), kandidat);
    isi("akun-induk-cari", "110101");
    cek("   dicari dengan kode 110101: 1 hasil; klik memilih -> nama terisi, kode 11010102", d.querySelectorAll("#akun-induk-daftar .pemilih-pilihan").length === 1 && (d.querySelector("#akun-induk-daftar .pemilih-pilihan").click(), el("akun-induk-cari").value === "Kas Kecil" && el("akun-kode").value === "11010102" && el("akun-induk-daftar").hidden), [el("akun-induk-cari").value, el("akun-kode").value]);
    cek("   membuka daftar lagi setelah memilih: semua 4 pilihan tetap tampil (tidak tersaring oleh nama terpilih)", daftarInduk().length === 4);

    // ---- Tampilan akun yang sudah ada: Saldo Saat ini + tab Akun Anak ----
    dataBaruKosong();
    cek("7b) data baru: tab Akun Anak dan kotak Saldo Saat ini tidak tampil", el("tab-akun-anak").hidden && el("akun-saldo-kini").hidden);
    w.modulAkun.bukaUbah(perKode("1101"));
    cek("    akun yang sudah ada: tab Akun Anak dan kotak Saldo Saat ini tampil", !el("tab-akun-anak").hidden && !el("akun-saldo-kini").hidden);
    cek("    kotak Saldo Saat ini berada di dalam tab Saldo, bukan di Informasi Umum", el("sub-akun-saldo").contains(el("akun-saldo-kini")) && !el("sub-akun-umum").contains(el("akun-saldo-kini")));
    d.querySelector('#isi-akun .sub-tab[data-subtab="akun-saldo"]').click();
    cek("    membuka tab Saldo: yang tampil Saldo Awal (Nilai, per Tgl) dan Saldo Saat ini; Informasi Umum tersembunyi", !el("sub-akun-saldo").hidden && el("sub-akun-umum").hidden && el("akun-saldo").offsetParent !== undefined && !el("akun-saldo-kini").hidden);
    d.querySelector('#isi-akun .sub-tab[data-subtab="akun-umum"]').click();
    cek("    Saldo Saat ini = saldo induk + semua sub akun = Rp 11.084.520; catatan 'akan mengikuti setiap transaksi' ada", el("akun-saldo-kini-nilai").textContent === "Rp 11.084.520" && /mengikuti setiap transaksi/.test(el("akun-saldo-kini").textContent), el("akun-saldo-kini-nilai").textContent);
    el("tab-akun-anak").click();
    const anak = [...d.querySelectorAll("#akun-anak-isi tr")].map(tr => [tr.children[0].textContent, tr.children[1].textContent]);
    cek("    tab Akun Anak menampilkan diri sendiri + semua turunan bertingkat: 1101, 110101, 11010101, 110102", JSON.stringify(anak.map(r => r[1])) === JSON.stringify(["1101", "110101", "11010101", "110102"]), anak);
    cek("    nama menjorok relatif: 0, 1, 2, 1 tingkat", anak.map(r => (r[0].match(/^ */)[0].length / 4)).join(",") === "0,1,2,1", anak.map(r => r[0]));
    cek("    tab Akun Anak tampil, panel lain tersembunyi", !el("sub-akun-anak").hidden && el("sub-akun-umum").hidden);
    d.querySelectorAll("#akun-anak-isi tr")[1].click();
    cek("    klik baris Kas Kecil: akun itu terbuka (kode 110101), tab Akun Anak kembali ke Informasi Umum, daftarnya kini 2 baris", el("akun-kode").value === "110101" && !el("sub-akun-umum").hidden && el("akun-saldo-kini-nilai").textContent === "Rp 11.083.520" && (el("tab-akun-anak").click(), d.querySelectorAll("#akun-anak-isi tr").length === 2), [el("akun-kode").value, el("akun-saldo-kini-nilai").textContent]);
    d.querySelectorAll("#akun-anak-isi tr")[0].click();   // baris akun itu sendiri: tidak membuka apa-apa
    cek("    klik baris akun itu sendiri: tidak berpindah", el("akun-kode").value === "110101");
    w.modulAkun.bukaUbah(perKode("110102"));
    cek("    akun tanpa sub akun: hanya dirinya sendiri + petunjuk 'belum punya sub akun'", (el("tab-akun-anak").click(), d.querySelectorAll("#akun-anak-isi tr").length === 1 && !el("akun-anak-kosong").hidden));
    dataBaruKosong();
    cek("    kembali ke data baru: tab Akun Anak dan Saldo Saat ini hilang lagi, kembali ke Informasi Umum", el("tab-akun-anak").hidden && el("akun-saldo-kini").hidden && !el("sub-akun-umum").hidden);

    // Tab Akun Anak hanya untuk induk (tingkat 1) dan sub pertamanya (tingkat 2)
    w.modulAkun.bukaUbah(perKode("1101"));
    const tabAnakTampil = (kode) => (w.modulAkun.bukaUbah(perKode(kode)), !el("tab-akun-anak").hidden);
    cek("    tab Akun Anak: tampil untuk induk 1101 dan sub pertama 110101 / 110102", tabAnakTampil("1101") && tabAnakTampil("110101") && tabAnakTampil("110102"));
    cek("    tab Akun Anak: TIDAK tampil untuk akun tingkat ketiga (11010101); Saldo Saat ini tetap tampil", !tabAnakTampil("11010101") && !el("akun-saldo-kini").hidden && el("akun-saldo-kini-nilai").textContent === "Rp 11.083.020", el("akun-saldo-kini-nilai").textContent);
    cek("    induk tanpa sub (4101 Donasi Umum, dibuat di uji ini): tab tampil, hanya dirinya + petunjuk 'belum punya sub akun'", tabAnakTampil("4101") && (el("tab-akun-anak").click(), d.querySelectorAll("#akun-anak-isi tr").length === 1 && !el("akun-anak-kosong").hidden), d.querySelectorAll("#akun-anak-isi tr").length);
    dataBaruKosong();

    // ---- Ubah ----
    w.modulAkun.bukaUbah(perKode("110101"));
    cek("8) ubah sub akun: centang & induk terisi, kode tetap 110101", el("akun-sub").checked && el("akun-induk-cari").value === "Kas & Bank" && el("akun-kode").value === "110101" && !el("akun-induk-baris").hidden);
    const pil = daftarInduk();
    cek("   pilihan induk akun yang punya sub (Kas Kecil): tanpa dirinya & sub akunnya, dan hanya induk tingkat 1 (cabangnya setinggi 2 tingkat) -> 1101 dan 1102", !pil.some(t => /Kas Kecil/.test(t)) && pil.length === 2, pil);
    centang(false); ubahPilihan("akun-tipe", "beban"); kirim();
    cek("9) pindah tipe akun yang punya sub akun ditolak", galat("tipe") !== "" && perKode("110101") && perKode("110101").tipe === "kas-bank", galat("tipe"));
    ubahPilihan("akun-tipe", "kas-bank"); centang(true); pilihInduk("1101"); isi("akun-nama", "Kas Kecil (ubah)"); isi("akun-saldo", "2000"); kirim();
    cek("   ubah nama & saldo tersimpan; saldo induk ikut (2000+11.083.020+1000 = 11.086.020)", perKode("110101").nama === "Kas Kecil (ubah)" && baris().find(r => r[0].trim() === "1101")[3] === "11.086.020", baris().find(r => r[0].trim() === "1101"));

    // ---- Pindah induk <-> jadi induk ----
    w.modulAkun.bukaUbah(perKode("11010101")); centang(false);
    cek("10) lepas centang Sub Akun pada sub-sub akun: pratinjau jadi induk 1103", el("akun-kode").value === "1103" && el("akun-induk-baris").hidden, el("akun-kode").value);
    kirim();
    cek("   tersimpan sebagai induk 1103 (indukId kosong), kode lama hilang", !!perKode("1103") && perKode("1103").indukId === "" && perKode("1103").nama === "Kas Kecil Masjid" && !perKode("11010101"));
    w.modulAkun.bukaUbah(perKode("1103")); centang(true); pilihInduk("110101");
    cek("   dijadikan sub lagi di bawah Kas Kecil: kode 11010101", el("akun-kode").value === "11010101", el("akun-kode").value);
    kirim();
    cek("   tersimpan: 11010101 kembali, 1103 hilang", !!perKode("11010101") && !perKode("1103"));

    // ---- Dipakai tempat lain ----
    w.localStorage.setItem("daftarGaji", JSON.stringify([{ id: "g1", nama: "Gaji Pokok", tipe: "gaji-pokok", akunBeban: "4101" }]));
    w.modulAkun.hapus(perKode("4101"));
    cek("11) hapus akun yang dipakai Gaji/Tunjangan ditolak", !el("dialog-konfirmasi").open && /Gaji\/Tunjangan/.test(d.getElementById("area-notifikasi").textContent) && !!perKode("4101"));
    w.modulAkun.bukaUbah(perKode("4101"));
    cek("   mengubah akun Pendapatan yang sudah ada: tanpa peringatan", el("akun-peringatan-donasi").hidden);
    ubahPilihan("akun-tipe", "beban-lain"); kirim();
    cek("   pindah tipe akun yang dipakai Gaji ditolak (kode ikut berubah)", /tidak bisa diubah/.test(galat("tipe")) && perKode("4101") && perKode("4101").tipe === "pendapatan", galat("tipe"));
    w.localStorage.setItem("daftarGaji", "[]");
    w.localStorage.setItem("akunPerkiraanYayasan", JSON.stringify({ pendapatanDonasi: ["4101"] }));
    w.modulAkun.hapus(perKode("4101"));
    cek("   hapus akun yang dipakai Preferensi ditolak", !el("dialog-konfirmasi").open && /Preferensi/.test(d.getElementById("area-notifikasi").textContent) && !!perKode("4101"));
    w.localStorage.removeItem("akunPerkiraanYayasan");

    // ---- Penghapusan ----
    w.modulAkun.hapus(perKode("1101"));
    cek("12) hapus akun yang punya sub akun ditolak", !el("dialog-konfirmasi").open && /sub akun/.test(d.getElementById("area-notifikasi").textContent) && !!perKode("1101"));
    w.modulAkun.hapus(perKode("110102"));
    cek("   akun bebas: konfirmasi muncul; Ya -> terhapus dan tercatat di Log", el("dialog-konfirmasi").open && (el("ya-konfirmasi").click(), !perKode("110102") && JSON.parse(w.localStorage.getItem("logAktivitas")).some(l => l.tindakan === "Hapus" && l.tipe === "Akun Perkiraan" && l.referensi === "Kas Besar")));

    // ---- Integrasi ----
    const log = JSON.parse(w.localStorage.getItem("logAktivitas"));
    cek("13) Log: Buat dan Ubah tercatat dengan rincian", log.some(l => l.tindakan === "Buat" && l.tipe === "Akun Perkiraan") && log.some(l => l.tindakan === "Ubah" && l.tipe === "Akun Perkiraan" && l.rincian && l.rincian.length));
    buat({ tipe: "beban", nama: "Beban Gaji" });
    w.bukaGajiBaru();
    const opsiGaji = [...el("gaji-akun").options].map(o => o.textContent);
    cek("   Gaji/Tunjangan: pilihan Akun Beban hanya akun bertipe Beban ([5101] Beban Gaji), tanpa Kas & Bank; kini wajib", opsiGaji.length === 2 && /\[5101\] Beban Gaji/.test(opsiGaji[1]) && !el("gaji-akun").disabled && !el("tanda-wajib-akun").hidden, opsiGaji);
    el("panel-buku-besar").open = false;
    d.querySelector('#panel-buku-besar .kotak-menu[data-halaman="Akun Perkiraan"]').click();
    cek("14) kotak Akun Perkiraan di Buku Besar membuka halaman", !el("isi-akun").hidden);
    cek("15) Cadangan Data menyertakan akun (6 akun)", JSON.parse(w.susunIsiCadangan()).data.daftarAkun.length === 6, JSON.parse(w.susunIsiCadangan()).data.daftarAkun.length);
    const cari = d.querySelector("#isi-akun .kolom-cari"); cari.value = "masjid"; cari.dispatchEvent(new w.Event("input"));
    cek("16) pencarian 'masjid' menyisakan 1 baris", baris().length === 1);
  } catch (e) { kesalahan.push("uji: " + e.stack); }
  console.log("\nLolos:", lolos, "Gagal:", gagal, "| Kesalahan skrip:", kesalahan.length ? kesalahan : "tidak ada");
  process.exit(gagal || kesalahan.length ? 1 : 0);
})();



