// Uji tampilan Jurnal Umum. Pemakaian: node uji-jurnal.js <jalur-jsdom> <jalur-menu.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + require("fs").readFileSync(require("path").join(require("path").dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
const kesalahan = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => kesalahan.push("jsdomError: " + (e.detail || e.message)));
vc.on("warn", (m) => kesalahan.push("console.warn: " + m));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true, beforeParse: require("./bantu-sesi.js").pasang }); /* masuk sebagai pengguna uji (J.25) */
const w = dom.window, d = w.document;
w.addEventListener("error", (e) => kesalahan.push("window.error: " + e.message));
w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
w.HTMLDialogElement.prototype.close = function () { this.open = false; };
let lolos = 0, gagal = 0;
const cek = (n, k, info) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (info !== undefined ? "  -> " + JSON.stringify(info) : "")); } };
const el = (id) => d.getElementById(id);
const notif = () => d.getElementById("area-notifikasi").textContent;
// Pengguna mengisi Tanggal dulu sebelum memilih akun (Data Baru dibuka kosong, PRD 5.3a)
function isiTanggalJurnalKalauKosong() {
  if (el("jurnal-tanggal").value === "") { el("jurnal-tanggal").value = w.tanggalHariIni(); el("jurnal-tanggal").dispatchEvent(new w.Event("change", { bubbles: true })); }
}

// Jalur nyata: ikon Buku besar -> kotak Jurnal Umum
el("tombol-buku-besar").click();
d.querySelector('#panel-buku-besar .kotak-menu[data-halaman="Jurnal Umum"]').click();
cek("1) kotak Jurnal Umum membuka halaman (bukan 'belum tersedia'), popup tertutup", !el("isi-jurnal").hidden && el("tab-jurnal").classList.contains("aktif") && !el("panel-buku-besar").open && !/belum tersedia/.test(notif()), notif());
cek("   tab 'Jurnal Umum' muncul dengan tombol tutup; formulir tampil (bukan daftar)", !el("tab-jurnal").hidden && !d.querySelector("#isi-jurnal .modul-form").hidden);
cek("   tombol hijau daftar dan tab 'Data Baru' dibuat komponen", !!d.querySelector("#isi-jurnal .tombol-daftar") && /Data Baru/.test(d.querySelector("#isi-jurnal .modul-tab").textContent));

// Bagian atas
cek("2) Data Baru: Tanggal kosong (PRD 5.3a), tanda wajib *; diisi hari ini: teks tanggal muncul di sebelahnya", el("jurnal-tanggal").value === "" && (isiTanggalJurnalKalauKosong(), el("jurnal-tanggal").value === w.tanggalHariIni() && el("jurnal-tanggal-teks").textContent !== "") && /\*/.test(d.querySelector('label[for="jurnal-tanggal-tampil"]').textContent), [el("jurnal-tanggal").value, el("jurnal-tanggal-teks").textContent]);
cek("   Tipe Transaksi terkunci 'Jurnal Umum'", el("jurnal-tipe").value === "Jurnal Umum" && el("jurnal-tipe").readOnly);
cek("   Nomor #: saklar Otomatis menyala; pilihan aturan tampil, kolom ketik nomor tersembunyi", el("jurnal-nomor-otomatis").checked && !el("jurnal-aturan-nomor").hidden && el("jurnal-nomor").hidden);
cek("   belum ada aturan penomoran: pilihan 'Belum ada aturan penomoran' (nonaktif) + petunjuk menuju Pengaturan, Penomoran", el("jurnal-aturan-nomor").disabled && /Belum ada aturan penomoran/.test(el("jurnal-aturan-nomor").textContent) && /Pengaturan, Penomoran/.test(el("jurnal-contoh-nomor").textContent), el("jurnal-contoh-nomor").textContent);

// ---- Aturan penomoran dari Pengaturan, Penomoran ----
const aturanUji = [
  { id: "n1", nama: "Jurnal Umum", pembukuan: "yayasan", tipe: "jurnal", digit: 5, komponen: [{ jenis: "teks", nilai: "JU/" }, { jenis: "tahun" }, { jenis: "bulan" }, { jenis: "counter" }] },
  { id: "n2", nama: "Kas Kecil", pembukuan: "yayasan", tipe: "jurnal", digit: 4, komponen: [{ jenis: "teks", nilai: "KK-" }, { jenis: "counter" }] },
  { id: "n3", nama: "Donasi Harian", pembukuan: "yayasan", tipe: "donasi", digit: 4, komponen: [{ jenis: "teks", nilai: "DN-" }, { jenis: "counter" }] }
];
const hariIni = w.tanggalHariIni();
w.localStorage.setItem("daftarPenomoran", JSON.stringify(aturanUji));
w.localStorage.setItem("hitunganPenomoran", JSON.stringify({ ["n1|" + hariIni.slice(0, 7)]: 4 }));
const hitunganAwal = w.localStorage.getItem("hitunganPenomoran");
// Data Baru kosong seperti pengguna: kalau tab Data Baru masih berisi isian lama yang belum disimpan, tab itu ditutup lewat
// tombol x (Ya pada peringatan), lalu Data Baru dibuka lagi (PRD 6.10)
function jurnalBaruKosong() {
  w.modulJurnal.bukaBaru();
  if (w.modulJurnal.adaPerubahan()) {
    d.querySelector("#isi-jurnal .tab-dokumen .modul-tab.aktif .tab-tutup").click();
    if (d.getElementById("dialog-konfirmasi").open) { d.getElementById("ya-konfirmasi").click(); }
    w.modulJurnal.bukaBaru();
  }
}
jurnalBaruKosong();
const opsiAturan = [...el("jurnal-aturan-nomor").options].map(o => o.textContent);
cek("   pilihan aturan = 'Silakan Pilih' lalu aturan bertipe Jurnal Umum saja (Jurnal Umum, Kas Kecil); 'Donasi Harian' tidak ikut", JSON.stringify(opsiAturan) === JSON.stringify(["Silakan Pilih", "Jurnal Umum", "Kas Kecil"]) && !el("jurnal-aturan-nomor").disabled, opsiAturan);
cek("   Data Baru: aturan belum dipilih (PRD 5.3a), contoh 'Pilih aturan penomoran.'", el("jurnal-aturan-nomor").value === "" && el("jurnal-contoh-nomor").textContent === "Pilih aturan penomoran.", el("jurnal-contoh-nomor").textContent);
(el("jurnal-aturan-nomor").value = "n1", el("jurnal-aturan-nomor").dispatchEvent(new w.Event("change", { bubbles: true })));
cek("   memilih Jurnal Umum: contoh = nomor berikutnya (hitungan bulan ini sudah 4 -> nomor ke-5)", el("jurnal-aturan-nomor").value === "n1" && el("jurnal-contoh-nomor").textContent === "Nomor berikutnya: " + w.formatNomor(aturanUji[0], hariIni, 5), el("jurnal-contoh-nomor").textContent);
el("jurnal-aturan-nomor").value = "n2"; el("jurnal-aturan-nomor").dispatchEvent(new w.Event("change"));
cek("   pilih aturan 'Kas Kecil': contoh berganti (KK-0001)", el("jurnal-contoh-nomor").textContent === "Nomor berikutnya: KK-0001", el("jurnal-contoh-nomor").textContent);
el("jurnal-tanggal").value = "2027-03-15"; el("jurnal-tanggal").dispatchEvent(new w.Event("change"));
el("jurnal-aturan-nomor").value = "n1"; el("jurnal-aturan-nomor").dispatchEvent(new w.Event("change"));
cek("   ganti tanggal ke bulan lain: hitungan mulai lagi dari 1 (JU/20270300001)", el("jurnal-contoh-nomor").textContent === "Nomor berikutnya: JU/20270300001", el("jurnal-contoh-nomor").textContent);
cek("   melihat contoh TIDAK memakai nomor: hitungan penomoran tidak berubah", w.localStorage.getItem("hitunganPenomoran") === hitunganAwal);
el("jurnal-nomor-otomatis").checked = false; el("jurnal-nomor-otomatis").dispatchEvent(new w.Event("change"));
cek("   saklar dimatikan: pilihan aturan hilang, kolom nomor muncul dan bisa diketik, contoh kosong", el("jurnal-aturan-nomor").hidden && !el("jurnal-nomor").hidden && !el("jurnal-nomor").readOnly && el("jurnal-contoh-nomor").textContent === "");
el("jurnal-nomor-otomatis").checked = true; el("jurnal-nomor-otomatis").dispatchEvent(new w.Event("change"));
cek("   saklar dinyalakan lagi: pilihan aturan tampil lagi (pilihan sebelumnya tetap), contoh kembali", !el("jurnal-aturan-nomor").hidden && el("jurnal-nomor").hidden && el("jurnal-aturan-nomor").value === "n1" && /Nomor berikutnya/.test(el("jurnal-contoh-nomor").textContent));
// Aturan baru dibuat di Penomoran, lalu tab Jurnal dibuka lagi: pilihan ikut diperbarui; pilihan lama dipertahankan
w.localStorage.setItem("daftarPenomoran", JSON.stringify(aturanUji.concat([{ id: "n4", nama: "Jurnal Penyesuaian", pembukuan: "yayasan", tipe: "jurnal", digit: 3, komponen: [{ jenis: "counter" }] }])));
w.tampilkanTab("jurnal");
cek("   aturan baru di Penomoran muncul setelah tab dibuka lagi; pilihan sebelumnya (Jurnal Umum) tetap terpilih", [...el("jurnal-aturan-nomor").options].length === 4 && el("jurnal-aturan-nomor").value === "n1", [...el("jurnal-aturan-nomor").options].map(o => o.textContent));
// Aturan yang sedang terpilih dihapus: pindah ke aturan pertama
w.localStorage.setItem("daftarPenomoran", JSON.stringify([aturanUji[1]]));
w.tampilkanTab("jurnal");
cek("   aturan yang terpilih dihapus: kembali ke 'Silakan Pilih', tidak dipilihkan sendiri", el("jurnal-aturan-nomor").value === "" && el("jurnal-contoh-nomor").textContent === "Pilih aturan penomoran.");
cek("   nama aturan berisi kode HTML tampil sebagai teks biasa (aman)", (w.localStorage.setItem("daftarPenomoran", JSON.stringify([{ id: "n9", nama: "<img src=x onerror=alert(1)>", tipe: "jurnal", digit: 3, komponen: [{ jenis: "counter" }] }])), w.tampilkanTab("jurnal"), el("jurnal-aturan-nomor").querySelectorAll("img").length === 0 && /<img/.test(el("jurnal-aturan-nomor").options[1].textContent)));
w.localStorage.setItem("daftarPenomoran", JSON.stringify(aturanUji));
jurnalBaruKosong();

// Tabel rincian
const kepala = [...d.querySelectorAll("#isi-jurnal .jurnal-tabel thead th")].map(th => th.textContent.trim());
cek("3) kolom rincian: (geser) Kode #, Nama Perkiraan, Program, Penanggung Jawab, Keterangan, Debit, Kredit, (hapus baris)", JSON.stringify(kepala.slice(1, 8)) === JSON.stringify(["Kode #", "Nama Perkiraan", "Program", "Penanggung Jawab", "Keterangan", "Debit", "Kredit"]) && kepala.length === 9, kepala);
cek("   tabel kosong: 'Belum ada data'; judul 'Rincian Jurnal *'; kolom 'Cari/Pilih Akun Perkiraan...'", /Belum ada data/.test(el("jurnal-rincian").textContent) && /Rincian Jurnal/.test(d.querySelector(".jurnal-judul-rincian h2").textContent) && el("jurnal-cari-akun").placeholder === "Cari/Pilih Akun Perkiraan...");
cek("   total: Total Debit Rp 0 dan Total Kredit Rp 0", el("jurnal-total-debit").textContent === "Rp 0" && el("jurnal-total-kredit").textContent === "Rp 0");

// Tab samping
cek("4) tab samping: Rincian aktif, Info tersembunyi", !el("jurnal-panel-rincian").hidden && el("jurnal-panel-info").hidden && d.querySelector('[data-jurnal-tab="rincian"]').getAttribute("aria-selected") === "true");
d.querySelector('[data-jurnal-tab="info"]').click();
cek("   klik Info: panel Info tampil (Keterangan, Dibuat oleh), Rincian tersembunyi", el("jurnal-panel-rincian").hidden && !el("jurnal-panel-info").hidden && !!el("jurnal-keterangan") && el("jurnal-dibuat-oleh").readOnly && d.querySelector('[data-jurnal-tab="info"]').classList.contains("aktif"));
d.querySelector('[data-jurnal-tab="rincian"]').click();
cek("   klik Rincian: kembali", !el("jurnal-panel-rincian").hidden && el("jurnal-panel-info").hidden);

// Tombol belum berfungsi
const tombolMenyusul = [...d.querySelectorAll("#isi-jurnal [data-jurnal-menyusul]")];
cek("5) hanya tombol cari rincian yang masih menyusul (cetak, lampiran, Ambil, dan Lainnya sudah hidup)", tombolMenyusul.length === 1, tombolMenyusul.length);
tombolMenyusul.forEach(t => t.click());
cek("   klik semuanya: notifikasi 'belum tersedia' muncul (tanpa error)", /Pencarian rincian jurnal belum tersedia/.test(notif()));
// ---- Rincian jurnal: cari akun -> popup Detail Akun -> Lanjut -> baris ----
w.localStorage.setItem("daftarDivisi", JSON.stringify([{ id: "d1", nama: "Pendidikan" }, { id: "d2", nama: "Kesehatan" }]));
w.localStorage.setItem("daftarProgram", JSON.stringify([{ id: "p1", nama: "Beasiswa", divisiId: "d1", sifat: "terikat", status: "aktif" }, { id: "p2", nama: "Program Lama", divisiId: "d2", sifat: "terikat", status: "selesai" }]));
const akunSemua = JSON.parse(w.localStorage.getItem("daftarAkun"));
const indukKode = akunSemua.filter(a => !a.indukId).map(a => a.kode);
jurnalBaruKosong();

const ketik = (teks) => { isiTanggalJurnalKalauKosong(); el("jurnal-cari-akun").value = teks; el("jurnal-cari-akun").dispatchEvent(new w.Event("input", { bubbles: true })); };
const tekan = (kunci) => el("jurnal-cari-akun").dispatchEvent(new w.KeyboardEvent("keydown", { key: kunci, bubbles: true, cancelable: true }));
const pilihanAkun = () => [...d.querySelectorAll("#jurnal-daftar-akun .jurnal-pilihan-akun")];
const barisRincian = () => [...d.querySelectorAll("#jurnal-rincian tr.jurnal-baris-data")];
const sel = (n) => [...barisRincian()[n].children].map(td => td.textContent.trim());
const dialog = el("dialog-detail-akun");
const klikPilih = (n) => pilihanAkun()[n].dispatchEvent(new w.MouseEvent("mousedown", { bubbles: true, cancelable: true }));
// Dana belum dipilih -> Tidak Terikat (arti lama; sejak PRD 4.1 2026-10-28 wajib dipilih sebelum Simpan)
const lanjut = () => { if (!el("detail-terikat").checked && !el("detail-tidak-terikat").checked) { el("detail-tidak-terikat").checked = true; } if (el("detail-divisi").value === "" && el("detail-divisi").options.length > 1) { el("detail-divisi").value = el("detail-divisi").options[1].value; } el("lanjut-detail-akun").click(); };   // Divisi wajib (PRD 5.1)
const isiNilai = (teks) => { el("detail-nilai").value = teks; el("detail-nilai").dispatchEvent(new w.Event("input", { bubbles: true })); el("detail-nilai").dispatchEvent(new w.Event("blur")); };
const pilihSisi = (sisi) => { d.querySelector('input[name="detail-sisi"][value="' + sisi + '"]').checked = true; };

isiTanggalJurnalKalauKosong();
el("jurnal-cari-akun").dispatchEvent(new w.Event("focus"));
cek("5b) fokus di kolom cari: daftar terbuka berisi 32 akun (bagan 44 dikurangi 12 akun induk), urut menurut kode", !el("jurnal-daftar-akun").hidden && pilihanAkun().length === 32 && /^110101/.test(pilihanAkun()[0].querySelector(".jurnal-pilihan-bawah span").textContent), pilihanAkun().length);
cek("    akun induk (1101, 1201, ..., 7101) TIDAK ada di pilihan", !pilihanAkun().some(li => indukKode.includes(li.querySelector(".jurnal-pilihan-bawah span").textContent)), indukKode);
ketik("kas & bank");
cek("    mencari nama induk 'Kas & Bank': tidak ditemukan (induk tidak dimasukkan)", pilihanAkun().length === 0 && /Tidak ada akun yang cocok/.test(el("jurnal-daftar-akun").textContent));
ketik("1101");
cek("    mencari 1101: hanya sub akunnya yang muncul (110101, 110102, 110103); induk 1101 sendiri tidak", pilihanAkun().length === 3 && !pilihanAkun().some(li => li.querySelector(".jurnal-pilihan-bawah span").textContent === "1101"), pilihanAkun().map(li => li.textContent));
// Akun tingkat satu tanpa sub akun boleh dipilih (bukan induk sungguhan)
w.localStorage.setItem("daftarAkun", JSON.stringify(akunSemua.concat([{ id: "x9", kode: "1102", nama: "Rekening Baru", tipe: "kas-bank", indukId: "", saldoAwal: 0, tanggalSaldo: "2026-01-01" }])));
ketik("rekening baru");
cek("    akun tingkat satu tanpa sub akun (1102 Rekening Baru) bisa dipilih", pilihanAkun().length === 1 && /1102/.test(pilihanAkun()[0].textContent));
// Sub akun yang punya sub (110101 Kas Kecil diberi anak) disembunyikan; anaknya (tingkat 3) muncul
const kasKecil = akunSemua.find(a => a.kode === "110101");
w.localStorage.setItem("daftarAkun", JSON.stringify(akunSemua.concat([{ id: "x7", kode: "11010101", nama: "Kas Kecil Kantor", tipe: "kas-bank", indukId: kasKecil.id, saldoAwal: 0 }])));
ketik("kas kecil");
cek("    sub akun yang punya sub (110101 Kas Kecil) TIDAK muncul; anaknya 11010101 Kas Kecil Kantor muncul", pilihanAkun().length === 1 && /11010101/.test(pilihanAkun()[0].textContent), pilihanAkun().map(li => li.textContent));
w.localStorage.setItem("daftarAkun", JSON.stringify(akunSemua));

ketik("kas kecil");
cek("6) mengetik 'kas kecil': hanya akun yang cocok, bagian cocok disorot <mark>", pilihanAkun().length >= 1 && pilihanAkun().every(li => /kas kecil/i.test(li.textContent)) && /kas kecil/i.test(pilihanAkun()[0].querySelector("mark").textContent), pilihanAkun().map(li => li.textContent));
const pertama = pilihanAkun()[0];
cek("   tiap pilihan: nama, kode kiri bawah, tipe akun (miring) kanan bawah", /Kas Kecil/.test(pertama.querySelector(".jurnal-pilihan-nama").textContent) && /^110101/.test(pertama.querySelector(".jurnal-pilihan-bawah span").textContent) && pertama.querySelector(".jurnal-pilihan-tipe").textContent === "Kas & Bank", pertama.textContent);
ketik("510101");
cek("   dicari lewat kode (510101 = Beban Gaji)", pilihanAkun().length === 1 && /Beban Gaji/.test(pilihanAkun()[0].textContent));
ketik("kas kecil"); tekan("Escape");
cek("7) Esc menutup daftar; panah bawah membuka lagi", el("jurnal-daftar-akun").hidden && (tekan("ArrowDown"), !el("jurnal-daftar-akun").hidden));

// ---- Popup Detail Akun ----
tekan("Enter");
cek("8) Enter memilih akun: popup Detail Akun terbuka (BELUM ada baris); kolom cari kosong, daftar tertutup", dialog.open === true && barisRincian().length === 0 && el("jurnal-cari-akun").value === "" && el("jurnal-daftar-akun").hidden && /Belum ada data/.test(el("jurnal-rincian").textContent));
cek("    isi tab Detail Akun: Kode # 110101, Nama Perkiraan 'Kas Kecil' terkunci, Debit terpilih, Nilai kosong, Penanggung Jawab kosong", el("detail-kode").textContent === "110101" && el("detail-nama").value === "Kas Kecil" && el("detail-nama").readOnly && d.querySelector('input[name="detail-sisi"][value="debit"]').checked && el("detail-nilai").value === "" && el("detail-penanggung").value === "");
cek("    tidak ada pilihan Pemasok/Pelanggan/Karyawan; yang ada 'Penanggung Jawab' berupa kolom nama", !/Pelanggan|Pemasok|Karyawan/.test(dialog.textContent) && /Penanggung Jawab/.test(dialog.textContent) && el("detail-penanggung").type === "text");
d.querySelector('[data-detail-tab="info"]').click();
cek("    tab Info Lainnya: Divisi, Program (bukan 'Proyek'/'Departemen'), Keterangan", !el("detail-panel-info").hidden && el("detail-panel-detail").hidden && !/Proyek|Departemen/.test(dialog.textContent) && !!el("detail-divisi") && !!el("detail-program") && !!el("detail-keterangan"));
const opsiProgram = [...el("detail-program").options].map(o => o.textContent);
const opsiDivisi = [...el("detail-divisi").options].map(o => o.textContent);
cek("    pilihan Program: '(Tanpa Program)' + Beasiswa saja (Program Lama yang Selesai tidak ikut); Divisi: Pilih Divisi..., Pendidikan, Kesehatan (Divisi wajib, PRD 5.1)", JSON.stringify(opsiProgram) === JSON.stringify(["(Tanpa Program)", "Beasiswa"]) && JSON.stringify(opsiDivisi) === JSON.stringify(["Pilih Divisi...", "Pendidikan", "Kesehatan"]), [opsiProgram, opsiDivisi]);
d.querySelector('[data-detail-tab="detail"]').click();
lanjut();
cek("9) Lanjut dengan Nilai kosong: ditolak, pesan 'Nilai wajib diisi', popup tetap terbuka, tidak ada baris", dialog.open && !el("galat-detail-nilai").hidden && /Nilai wajib diisi/.test(el("galat-detail-nilai").textContent) && barisRincian().length === 0);
isiNilai("abc1.500.000");
cek("    huruf diabaikan; setelah keluar kolom ditulis 1.500.000; pesan salah hilang saat mengetik", el("detail-nilai").value === "1.500.000" && el("galat-detail-nilai").hidden);
el("detail-penanggung").value = "Budi Santoso";
lanjut();
cek("10) Lanjut: popup tertutup, baris pertama bertambah (110101, Kas Kecil, Debit 1.500.000, Kredit kosong)", !dialog.open && barisRincian().length === 1 && JSON.stringify([sel(0)[1], sel(0)[2], sel(0)[6], sel(0)[7]]) === JSON.stringify(["110101", "Kas Kecil", "1.500.000", ""]), sel(0));
cek("    kolom Penanggung Jawab di tabel berisi 'Budi Santoso'", sel(0)[4] === "Budi Santoso", sel(0));
cek("    Total Debit Rp 1.500.000, Total Kredit Rp 0, total merah (belum seimbang)", el("jurnal-total-debit").textContent === "Rp 1.500.000" && el("jurnal-total-kredit").textContent === "Rp 0" && d.querySelector(".jurnal-total").classList.contains("tidak-seimbang"));

// Akun kedua lewat klik, kredit, program & divisi & keterangan
ketik("510101"); klikPilih(0);
cek("11) memilih akun dengan klik juga membuka popup (Beban Gaji 510101)", dialog.open && el("detail-kode").textContent === "510101");
pilihSisi("kredit"); isiNilai("1500000");
d.querySelector('[data-detail-tab="info"]').click();
const ubahProgramDetail = (v) => { el("detail-program").value = v; el("detail-program").dispatchEvent(new w.Event("change")); };
cek("    Divisi dan Program tidak terkunci: keduanya bebas dipilih (Divisi tidak harus ikut Program)", !el("detail-divisi").disabled && !el("detail-program").disabled && !el("detail-divisi-petunjuk"));
ubahProgramDetail("p1");
cek("    Divisi masih kosong lalu Program Beasiswa dipilih -> Divisi diusulkan Pendidikan (dari program), TIDAK terkunci", el("detail-divisi").value === "d1" && !el("detail-divisi").disabled, el("detail-divisi").value);
el("detail-divisi").value = "d2";
ubahProgramDetail("p1");
cek("    Divisi diganti sendiri ke Kesehatan (beda dari divisi Program): tetap Kesehatan, tidak ditimpa saat Program dipilih lagi", el("detail-divisi").value === "d2", el("detail-divisi").value);
ubahProgramDetail("");
cek("    Program dikosongkan: Divisi tidak berubah (tetap Kesehatan)", el("detail-divisi").value === "d2");
el("detail-divisi").value = ""; ubahProgramDetail("p1");
cek("    Divisi dikosongkan lalu Program dipilih lagi: diusulkan lagi dari Program (Pendidikan)", el("detail-divisi").value === "d1");
el("detail-keterangan").value = "Biaya beasiswa Oktober";
lanjut();
cek("12) baris kedua: Kredit 1.500.000, Program 'Beasiswa', Keterangan terisi; Total seimbang (merah hilang)", barisRincian().length === 2 && sel(1)[3] === "Beasiswa" && sel(1)[5] === "Biaya beasiswa Oktober" && sel(1)[6] === "" && sel(1)[7] === "1.500.000" && el("jurnal-total-kredit").textContent === "Rp 1.500.000" && !d.querySelector(".jurnal-total").classList.contains("tidak-seimbang"), sel(1));

// ---- Baris berikutnya mengikuti Divisi/Program baris terakhir (tetap bisa diubah) ----
const pilihProgramDetail = () => el("detail-program").value;
const pilihDivisiDetail = () => el("detail-divisi").value;
ketik("kas kecil"); klikPilih(0);
cek("11b) baris sebelumnya (Beban Gaji) ber-Program 'Beasiswa': popup akun berikutnya otomatis terisi Program Beasiswa dan Divisi Pendidikan (tidak terkunci)", pilihProgramDetail() === "p1" && pilihDivisiDetail() === "d1" && !el("detail-divisi").disabled, [pilihProgramDetail(), pilihDivisiDetail()]);
cek("    isian lain tetap kosong (Penanggung Jawab, Keterangan, Nilai tidak ikut terisi)", el("detail-penanggung").value === "" && el("detail-keterangan").value === "" && el("detail-nilai").value === "");
ubahProgramDetail("");
el("detail-divisi").value = "d2";
isiNilai("100");
lanjut();
cek("    isian otomatis tetap bisa diubah: baris ini disimpan Tanpa Program dan Divisi Kesehatan (d2)", barisRincian().length === 3 && sel(2)[3] === "" && w.barisJurnal[2].divisiId === "d2" && w.barisJurnal[2].programId === "", w.barisJurnal[2]);
ketik("bank"); klikPilih(0);
cek("    akun berikutnya mengikuti baris TERAKHIR (bukan baris pertama): Divisi Kesehatan, Tanpa Program, Divisi terbuka", pilihDivisiDetail() === "d2" && pilihProgramDetail() === "" && !el("detail-divisi").disabled, [pilihDivisiDetail(), pilihProgramDetail()]);
el("tutup-detail-akun").click();
// Program sudah Selesai: tidak diikuti, tetapi Divisi tetap
w.barisJurnal[2].programId = "p1"; w.barisJurnal[2].divisiId = "d1";
w.localStorage.setItem("daftarProgram", JSON.stringify([{ id: "p1", nama: "Beasiswa", divisiId: "d1", sifat: "terikat", status: "selesai" }]));
ketik("bank"); klikPilih(0);
cek("    kalau Program baris terakhir sudah Selesai: Program tidak diikuti (kosong), Divisi tetap diikuti", pilihProgramDetail() === "" && pilihDivisiDetail() === "d1", [pilihProgramDetail(), pilihDivisiDetail()]);
el("tutup-detail-akun").click();
w.localStorage.setItem("daftarProgram", JSON.stringify([{ id: "p1", nama: "Beasiswa", divisiId: "d1", sifat: "terikat", status: "aktif" }, { id: "p2", nama: "Program Lama", divisiId: "d2", sifat: "terikat", status: "selesai" }]));
// Mengubah baris yang sudah ada memakai isinya sendiri, bukan isi baris terakhir
barisRincian()[0].click();
// Baris 1 disimpan tanpa Program, Divisi diisi Pendidikan (d1) oleh lanjut() karena Divisi wajib
cek("    membuka baris yang sudah ada (baris 1, tanpa Program): memakai isinya sendiri, bukan baris terakhir", pilihProgramDetail() === "" && pilihDivisiDetail() === "d1", [pilihProgramDetail(), pilihDivisiDetail()]);
el("tutup-detail-akun").click();
// Jurnal baru: tidak ada yang diikuti
jurnalBaruKosong();
ketik("bank"); klikPilih(0);
cek("    jurnal baru: baris pertama tidak mengikuti apa pun (Divisi dan Program kosong)", pilihProgramDetail() === "" && pilihDivisiDetail() === "", [pilihProgramDetail(), pilihDivisiDetail()]);
el("tutup-detail-akun").click();
// Hanya Divisi diisi (tanpa Program): dibawa ke baris berikutnya
jurnalBaruKosong();
ketik("bank"); klikPilih(0); isiNilai("50"); el("detail-divisi").value = "d2"; lanjut();
ketik("kas kecil"); klikPilih(0);
cek("    hanya Divisi diisi (tanpa Program): Divisi dibawa ke baris berikutnya dan tetap bisa diubah", pilihDivisiDetail() === "d2" && pilihProgramDetail() === "" && !el("detail-divisi").disabled, [pilihDivisiDetail(), pilihProgramDetail()]);
el("tutup-detail-akun").click();
jurnalBaruKosong();
// Divisi sekarang wajib (PRD 5.1), jadi baris "Divisi sengaja kosong" tidak mungkin lagi.
// Yang diuji: baris ber-Program dibuka lagi tetap memakai Program dan Divisi yang tersimpan.
jurnalBaruKosong();
ketik("bank"); klikPilih(0); isiNilai("10"); ubahProgramDetail("p1"); lanjut();
barisRincian()[0].click();
cek("    baris tersimpan ber-Program: saat dibuka lagi Program dan Divisi sesuai yang tersimpan", pilihProgramDetail() === "p1" && pilihDivisiDetail() === "d1", [pilihProgramDetail(), pilihDivisiDetail()]);
el("tutup-detail-akun").click();
jurnalBaruKosong();
// ---- kembali ke rangkaian uji semula: siapkan 2 baris seperti sebelumnya ----
ketik("kas kecil"); klikPilih(0); isiNilai("1500000"); el("detail-penanggung").value = "Budi Santoso"; lanjut();
ketik("510101"); klikPilih(0); pilihSisi("kredit"); isiNilai("1500000"); el("detail-program").value = "p1"; el("detail-program").dispatchEvent(new w.Event("change")); el("detail-keterangan").value = "Biaya beasiswa Oktober"; lanjut();
// Mengubah baris yang sudah ada
barisRincian()[0].click();
cek("13) klik baris pertama: popup terbuka untuk mengubah (Kode 110101, Debit, 1.500.000, penanggung jawab terisi); tab kembali ke Detail Akun", dialog.open && el("detail-kode").textContent === "110101" && d.querySelector('input[name="detail-sisi"][value="debit"]').checked && el("detail-nilai").value === "1.500.000" && el("detail-penanggung").value === "Budi Santoso" && !el("detail-panel-detail").hidden);
pilihSisi("kredit"); isiNilai("200000");
lanjut();
cek("    diubah ke Kredit 200.000: baris diperbarui (bukan baris baru), Debit baris itu kosong, total ikut berubah", barisRincian().length === 2 && sel(0)[6] === "" && sel(0)[7] === "200.000" && el("jurnal-total-debit").textContent === "Rp 0" && el("jurnal-total-kredit").textContent === "Rp 1.700.000", sel(0));
// X dan klik latar menutup tanpa menyimpan
barisRincian()[0].click(); isiNilai("999999");
el("tutup-detail-akun").click();
cek("14) tombol X: popup tertutup, perubahan dibatalkan (baris tetap 200.000)", !dialog.open && sel(0)[7] === "200.000");
barisRincian()[0].click(); isiNilai("888888");
dialog.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));   // klik latar (target = dialog sendiri)
cek("    klik di latar gelap menutup tanpa menyimpan", !dialog.open && sel(0)[7] === "200.000");
ketik("kas kecil"); klikPilih(0); isiNilai("5"); el("tutup-detail-akun").click();
cek("    menambah akun lalu menutup dengan X: tidak ada baris baru (tetap 2)", barisRincian().length === 2);

// Hapus baris
barisRincian()[1].querySelector(".jurnal-hapus-baris").click();
cek("15) tombol hapus baris: baris hilang TANPA membuka popup; total dihitung ulang", barisRincian().length === 1 && !dialog.open && el("jurnal-total-kredit").textContent === "Rp 200.000");
barisRincian()[0].querySelector(".jurnal-hapus-baris").click();
cek("    baris terakhir dihapus: kembali 'Belum ada data', total Rp 0, tidak merah", /Belum ada data/.test(el("jurnal-rincian").textContent) && el("jurnal-total-debit").textContent === "Rp 0" && !d.querySelector(".jurnal-total").classList.contains("tidak-seimbang"));

// Keamanan: kode HTML pada nama akun dan isian
const akunRusak = akunSemua.map(a => a.kode === "110101" ? Object.assign({}, a, { nama: "<img src=x onerror=alert(1)>Kas" }) : a);
w.localStorage.setItem("daftarAkun", JSON.stringify(akunRusak));
ketik("img");
cek("16) nama akun berisi <img ...>: tampil sebagai teks (daftar)", d.querySelectorAll("#jurnal-daftar-akun img").length === 0 && pilihanAkun().length === 1, pilihanAkun().length);
klikPilih(0); isiNilai("100"); el("detail-penanggung").value = "<b>x</b>"; el("detail-keterangan").value = "<script>alert(1)<\/script>";
lanjut();
cek("    baris dan popup juga aman (tidak ada elemen img/b/script dari isian)", d.querySelectorAll("#jurnal-rincian img, #jurnal-rincian b, #jurnal-rincian script").length === 0 && /<b>x<\/b>/.test(sel(0)[4]), sel(0));
w.localStorage.setItem("daftarAkun", JSON.stringify(akunSemua));
// Formulir baru mengosongkan rincian
jurnalBaruKosong();
cek("17) jurnal baru (tombol +): rincian dan kolom cari dikosongkan, total Rp 0", barisRincian().length === 0 && el("jurnal-cari-akun").value === "" && el("jurnal-total-debit").textContent === "Rp 0");
// Klik di luar menutup daftar
el("jurnal-cari-akun").dispatchEvent(new w.Event("focus"));
d.body.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
cek("18) klik di luar kolom cari: daftar tertutup", el("jurnal-daftar-akun").hidden);
cek("19) Enter di kolom isian popup = Lanjut (kecuali Keterangan)", (ketik("kas kecil"), klikPilih(0), isiNilai("777"), el("detail-nilai").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })), !dialog.open && barisRincian().length === 1 && sel(0)[6] === "777"));
jurnalBaruKosong();
cek("6) tombol Simpan tampil abu-abu (disabled), dan formulir tidak terkirim", el("jurnal-simpan").disabled && (el("form-jurnal").dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true })), !el("isi-jurnal").hidden));
cek("   tombol hapus tersembunyi untuk data baru", d.querySelector("#isi-jurnal [data-aksi='hapus']").hidden);

// Daftar
d.querySelector("#isi-jurnal .tombol-daftar").click();
cek("7) tombol hijau: pindah ke daftar; daftar kosong 'Belum ada jurnal'; filter/cari/tombol + ada", !el("isi-jurnal").querySelector(".modul-form").hidden === false && /Belum ada jurnal/.test(d.querySelector("#isi-jurnal .tabel-kosong").textContent) && !!d.querySelector("#isi-jurnal .kolom-cari"), d.querySelector("#isi-jurnal .tabel-kosong").textContent);
const kolomDaftar = [...d.querySelectorAll("#isi-jurnal .tabel-daftar thead th")].map(th => th.textContent.replace(/[^A-Za-z ]/g, "").trim());
cek("   kolom daftar: Nomor, Tanggal, Keterangan, Total (Rp)", JSON.stringify(kolomDaftar) === JSON.stringify(["Nomor", "Tanggal", "Keterangan", "Total Rp"]), kolomDaftar);
d.querySelector("#isi-jurnal [data-alat='baru']").click();
cek("   tombol + di daftar: kembali ke formulir kosong dengan tab Rincian", !d.querySelector("#isi-jurnal .modul-form").hidden && !el("jurnal-panel-rincian").hidden);

// Integrasi
cek("8) kunci 'daftarJurnal' terdaftar untuk Cadangan Data", w.jenisKunciCadangan.daftarJurnal === "daftar");
cek("9) tab ditutup (X) kembali ke Dashboard", (d.querySelector('[data-tutup="jurnal"]').click(), el("isi-jurnal").hidden && !el("isi-dashboard").hidden));
// Tab bisa dibuka lagi
el("tombol-buku-besar").click(); d.querySelector('#panel-buku-besar .kotak-menu[data-halaman="Jurnal Umum"]').click();
cek("10) dibuka lagi: tampil normal", !el("isi-jurnal").hidden && !d.querySelector("#isi-jurnal .modul-form").hidden);
// Kotak lain di Buku Besar tidak terpengaruh
el("panel-buku-besar").open = false;
d.querySelector('#panel-buku-besar .kotak-menu[data-halaman="Log Aktifitas Jurnal"]').click();
cek("11) kotak Log Aktifitas Jurnal membuka tabnya", !el("isi-log-jurnal").hidden);

// ====================== MENYIMPAN JURNAL ======================
w.localStorage.setItem("daftarAkun", JSON.stringify(akunSemua));
w.localStorage.setItem("daftarJurnal", "[]");
w.localStorage.setItem("hitunganPenomoran", "{}");
w.localStorage.setItem("pembatasanYayasan", "{}");
w.localStorage.setItem("daftarPenomoran", JSON.stringify(aturanUji));
w.localStorage.setItem("logAktivitas", "[]");
w.localStorage.setItem("daftarDivisi", JSON.stringify([{ id: "d1", nama: "Pendidikan" }, { id: "d2", nama: "Kesehatan" }, { id: "d3", nama: "Umum" }]));
w.localStorage.setItem("daftarProgram", JSON.stringify([{ id: "p1", nama: "Beasiswa", divisiId: "d1", sifat: "terikat", status: "aktif" }]));
const jurnalTersimpan = () => JSON.parse(w.localStorage.getItem("daftarJurnal") || "[]");
const galatJurnal = () => el("jurnal-pesan-galat").hidden ? "" : el("jurnal-pesan-galat").textContent;
// Pengguna memilih aturan "Jurnal Umum" (n1) sebelum Simpan kalau Otomatis menyala dan aturan masih kosong (PRD 5.3a)
const pilihAturanJurnal = () => { el("jurnal-aturan-nomor").value = "n1"; el("jurnal-aturan-nomor").dispatchEvent(new w.Event("change", { bubbles: true })); };
const kirimJurnal = () => {
  if (el("jurnal-nomor-otomatis").checked && el("jurnal-aturan-nomor").value === "" && [...el("jurnal-aturan-nomor").options].some(o => o.value === "n1")) { pilihAturanJurnal(); }
  el("form-jurnal").dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));
};
const tambahBaris = (kata, sisi, nilai, ubah) => { ketik(kata); klikPilih(0); pilihSisi(sisi); isiNilai(String(nilai)); if (ubah) { ubah(); } lanjut(); };
const tgl = w.tanggalHariIni();
const nomorKe = (n) => w.formatNomor(aturanUji[0], tgl, n);
const idAkun = (kode) => akunSemua.find(a => a.kode === kode).id;
const logJurnal = (tindakan) => JSON.parse(w.localStorage.getItem("logAktivitas")).filter(l => l.tipe === "Jurnal Umum" && l.tindakan === tindakan);
const pilihTipeJurnalPopup = () => null;

jurnalBaruKosong();
cek("20) jurnal kosong: tombol Simpan abu-abu, tanpa keterangan status", el("jurnal-simpan").disabled && el("jurnal-status").textContent === "");
tambahBaris("kas kecil", "debit", 1000);
cek("    satu baris saja: status 'Jurnal minimal berisi dua baris.', Simpan tetap abu-abu", el("jurnal-simpan").disabled && /minimal berisi dua baris/.test(el("jurnal-status").textContent), el("jurnal-status").textContent);
tambahBaris("donasi", "kredit", 400);
cek("    belum seimbang: status 'Belum seimbang: selisih Rp 600 (debit lebih besar).', Simpan abu-abu", el("jurnal-simpan").disabled && el("jurnal-status").textContent === "Belum seimbang: selisih Rp 600 (debit lebih besar).", el("jurnal-status").textContent);
kirimJurnal();
cek("    dipaksa kirim saat belum seimbang: ditolak dengan pesan, tidak ada yang tersimpan", jurnalTersimpan().length === 0 && /Belum seimbang/.test(galatJurnal()), galatJurnal());
barisRincian()[1].click(); isiNilai("1000"); lanjut();
cek("    diubah jadi seimbang: status kosong dan tombol Simpan menyala", !el("jurnal-simpan").disabled && el("jurnal-status").textContent === "");

// ---- Simpan jurnal pertama (nomor otomatis) ----
el("jurnal-keterangan").value = "Sumbangan tunai";
(el("jurnal-aturan-nomor").value = "n1", el("jurnal-aturan-nomor").dispatchEvent(new w.Event("change", { bubbles: true })));
kirimJurnal();
const j1 = jurnalTersimpan()[0];
cek("21) simpan: 1 jurnal, nomor dari aturan 'Jurnal Umum' urut 1 bulan ini, nama = nomor, aturanId n1", jurnalTersimpan().length === 1 && j1.nomor === nomorKe(1) && j1.nama === j1.nomor && j1.aturanId === "n1", j1 && j1.nomor);
cek("    isi tersimpan: tanggal hari ini, keterangan, 2 baris rincian, total debit 1000, dibuat oleh Pengguna, dibuat pada terisi", j1.tanggal === tgl && j1.keterangan === "Sumbangan tunai" && j1.rincian.length === 2 && j1.totalDebit === 1000 && j1.dibuatOleh === "Pengguna" && /^\d{4}-\d{2}-\d{2}T/.test(j1.dibuatPada), j1);
cek("    hitungan penomoran naik jadi 1, contoh nomor berikutnya = urut 2", JSON.parse(w.localStorage.getItem("hitunganPenomoran"))["n1|" + tgl.slice(0, 7)] === 1 && (pilihAturanJurnal(), el("jurnal-contoh-nomor").textContent === "Nomor berikutnya: " + nomorKe(2)), el("jurnal-contoh-nomor").textContent);
cek("    notifikasi 'Jurnal Umum telah berhasil disimpan'; formulir kembali kosong (Data Baru): rincian kosong, Simpan abu-abu, tombol hapus tersembunyi", /Jurnal Umum telah berhasil disimpan/.test(notif()) && barisRincian().length === 0 && el("jurnal-simpan").disabled && d.querySelector("#isi-jurnal [data-aksi='hapus']").hidden && el("jurnal-keterangan").value === "");
const buat1 = logJurnal("Buat");
cek("22) Log Aktivitas: 'Buat' Jurnal Umum dengan nomor sebagai referensi; rincian Pemeriksaan memuat ringkasan baris", buat1.length === 1 && buat1[0].referensi === j1.nomor && JSON.stringify(buat1[0].rincian).indexOf("110101 Kas Kecil D 1.000") >= 0 && JSON.stringify(buat1[0].rincian).indexOf("410101 Donasi K 1.000") >= 0, buat1[0]);
cek("23) Cadangan Data memuat jurnal; ringkasan menampilkan baris 'Jurnal Umum' = 1", JSON.parse(w.susunIsiCadangan()).data.daftarJurnal.length === 1 && w.ringkasanCadangan(w.ambilDataAplikasi()).some(r => r.label === "Jurnal Umum" && r.nilai === "1"));
let peta = w.petaAkun();
cek("24) saldo akun mengikuti jurnal: Kas Kecil (sisi debit) Rp 1.000; Donasi (sisi kredit) Rp 1.000; induk Kas & Bank dan Pendapatan ikut", peta.total[idAkun("110101")] === 1000 && peta.total[idAkun("410101")] === 1000 && peta.total[idAkun("1101")] === 1000 && peta.total[idAkun("4101")] === 1000, [peta.total[idAkun("110101")], peta.total[idAkun("410101")]]);

// ---- Jurnal kedua: nomor urut 2 ----
tambahBaris("kas kecil", "debit", 500); tambahBaris("donasi", "kredit", 500); kirimJurnal();
cek("25) jurnal kedua: nomor otomatis urut 2; total 2 jurnal; hitungan 2", jurnalTersimpan().length === 2 && jurnalTersimpan()[1].nomor === nomorKe(2) && JSON.parse(w.localStorage.getItem("hitunganPenomoran"))["n1|" + tgl.slice(0, 7)] === 2, jurnalTersimpan().map(j => j.nomor));
const j2 = jurnalTersimpan()[1];

// ---- Nomor manual ----
tambahBaris("kas kecil", "debit", 200); tambahBaris("donasi", "kredit", 200);
el("jurnal-nomor-otomatis").checked = false; el("jurnal-nomor-otomatis").dispatchEvent(new w.Event("change"));
kirimJurnal();
cek("26) nomor manual kosong ditolak ('Nomor wajib diisi.'), tidak tersimpan", jurnalTersimpan().length === 2 && galatJurnal() === "Nomor wajib diisi.", galatJurnal());
el("jurnal-nomor").value = j1.nomor.toLowerCase(); kirimJurnal();
cek("    nomor sama dengan jurnal lain (huruf besar/kecil dianggap sama) ditolak", jurnalTersimpan().length === 2 && /sudah dipakai jurnal lain/.test(galatJurnal()), galatJurnal());
el("jurnal-nomor").value = "MANUAL-001"; kirimJurnal();
cek("    nomor manual unik tersimpan ('MANUAL-001'); hitungan penomoran otomatis TIDAK berubah (tetap 2)", jurnalTersimpan().length === 3 && jurnalTersimpan()[2].nomor === "MANUAL-001" && jurnalTersimpan()[2].aturanId === "" && JSON.parse(w.localStorage.getItem("hitunganPenomoran"))["n1|" + tgl.slice(0, 7)] === 2);
const j3 = jurnalTersimpan()[2];

// ---- Tanggal ----
tambahBaris("kas kecil", "debit", 100); tambahBaris("donasi", "kredit", 100);
el("jurnal-tanggal").value = ""; kirimJurnal();
cek("27) tanggal kosong ditolak ('Tanggal wajib diisi.')", galatJurnal() === "Tanggal wajib diisi." && jurnalTersimpan().length === 3, galatJurnal());
el("jurnal-tanggal").value = "2099-01-01"; kirimJurnal();
cek("    tanggal di masa depan ditolak (pembatasan masa depan di Preferensi menyala)", /melewati hari ini/.test(galatJurnal()) && jurnalTersimpan().length === 3, galatJurnal());
w.localStorage.setItem("pembatasanYayasan", JSON.stringify({ tanggal: "tertentu", tanggalKunci: tgl, masaDepan: true, akses: "bebas" }));
el("jurnal-tanggal").value = tgl; kirimJurnal();
cek("    tanggal pada/sebelum tanggal kunci (Preferensi, Pembatasan) ditolak: 'sudah terkunci'", /sudah terkunci/.test(galatJurnal()) && jurnalTersimpan().length === 3, galatJurnal());
w.localStorage.setItem("pembatasanYayasan", "{}");
jurnalBaruKosong();
cek("    jurnal baru: pesan kesalahan lama hilang", el("jurnal-pesan-galat").hidden);

// ---- Mengubah jurnal tersimpan ----
w.modulJurnal.bukaUbah(j1);
cek("28) membuka jurnal tersimpan: nomor di kolom nomor (saklar Otomatis mati), 2 baris, keterangan, 'Dibuat oleh' Pengguna, tombol hapus tampil", !el("jurnal-nomor-otomatis").checked && el("jurnal-nomor").value === j1.nomor && !el("jurnal-nomor").hidden && barisRincian().length === 2 && el("jurnal-keterangan").value === "Sumbangan tunai" && el("jurnal-dibuat-oleh").value === "Pengguna" && !d.querySelector("#isi-jurnal [data-aksi='hapus']").hidden && el("tab-jurnal").textContent.indexOf("Jurnal Umum") >= 0);
barisRincian()[0].click(); isiNilai("2000"); lanjut();
cek("    mengubah satu baris jadi 2.000: belum seimbang, Simpan abu-abu", el("jurnal-simpan").disabled && /selisih Rp 1.000/.test(el("jurnal-status").textContent), el("jurnal-status").textContent);
barisRincian()[1].click(); isiNilai("2000"); lanjut();
kirimJurnal();
const j1b = jurnalTersimpan().find(j => j.id === j1.id);
cek("29) simpan perubahan: tetap 3 jurnal (bukan baru), id dan nomor sama, total 2000, diubahPada terisi, dibuatOleh tetap", jurnalTersimpan().length === 3 && j1b.nomor === j1.nomor && j1b.totalDebit === 2000 && !!j1b.diubahPada && j1b.dibuatPada === j1.dibuatPada && j1b.dibuatOleh === "Pengguna", j1b);
const ubah1 = logJurnal("Ubah");
cek("    Log Aktivitas: 'Ubah' dengan perbandingan Total (Rp) 1.000 -> 2.000 dan ringkasan Rincian", ubah1.length === 1 && JSON.stringify(ubah1[0].rincian).indexOf("Total (Rp)") >= 0 && JSON.stringify(ubah1[0].rincian).indexOf("D 2.000") >= 0, ubah1[0] && JSON.stringify(ubah1[0].rincian).slice(0, 200));
// PRD 6.10: sesudah disimpan, tab data itu tetap terbuka berisi data terbaru dan tidak dianggap berubah lagi
cek("    setelah ubah selesai, tab jurnal tetap terbuka dengan isi terbaru, tanpa tanda perubahan", !d.querySelector("#isi-jurnal .modul-form").hidden && w.modulJurnal.idDiubah === j1.id && d.querySelector("#isi-jurnal .tab-dokumen .modul-tab.aktif .tab-judul").textContent === j1.nomor && !w.modulJurnal.adaPerubahan());
peta = w.petaAkun();
cek("    saldo ikut: Kas Kecil = 2.000 + 500 + 200 = 2.700; Donasi = 2.700", peta.total[idAkun("110101")] === 2700 && peta.total[idAkun("410101")] === 2700, peta.total[idAkun("110101")]);
w.modulJurnal.bukaUbah(j2); el("jurnal-nomor").value = j1.nomor; kirimJurnal();
cek("30) mengubah nomor jurnal ke nomor yang sudah dipakai jurnal lain ditolak; data tidak berubah", /sudah dipakai jurnal lain/.test(galatJurnal()) && jurnalTersimpan().find(j => j.id === j2.id).nomor === j2.nomor, galatJurnal());

// ---- Daftar jurnal ----
w.modulJurnal.tampilkan("daftar"); w.modulJurnal.gambarTabel();
const barisDaftar = [...d.querySelectorAll("#isi-jurnal .tabel-daftar tbody tr")].map(tr => [...tr.children].map(td => td.textContent));
cek("31) daftar menampilkan 3 jurnal (tanggal terbaru dulu), kolom Nomor/Tanggal/Keterangan/Total", barisDaftar.length === 3 && barisDaftar.some(r => r[0] === j1.nomor && r[3] === "2.000" && r[2] === "Sumbangan tunai") && barisDaftar.every(r => r[1] === w.formatTanggal(tgl)), barisDaftar);
cek("    kolom Total rata kanan", d.querySelector("#isi-jurnal .tabel-daftar tbody tr td:nth-child(4)").classList.contains("sel-kanan"));
d.querySelector("#isi-jurnal .tabel-daftar tbody tr").click();
cek("    klik baris di daftar membuka jurnal itu di formulir (rincian terisi)", !d.querySelector("#isi-jurnal .modul-form").hidden && barisRincian().length === 2);

// ---- Hapus jurnal ----
w.modulJurnal.hapus(j3);
cek("32) hapus jurnal: konfirmasi muncul menyebut nomor", el("dialog-konfirmasi").open && /MANUAL-001/.test(el("isi-konfirmasi").textContent + el("nama-konfirmasi").textContent));
el("ya-konfirmasi").click();
cek("    setelah Ya: jurnal terhapus (tinggal 2), Log 'Hapus' tercatat, saldo dihitung ulang (Kas Kecil = 2.500)", jurnalTersimpan().length === 2 && !jurnalTersimpan().some(j => j.id === j3.id) && logJurnal("Hapus").length === 1 && w.petaAkun().total[idAkun("110101")] === 2500, w.petaAkun().total[idAkun("110101")]);

// ---- Pengaman: akun / Program / Divisi yang dipakai jurnal ----
jurnalBaruKosong();
tambahBaris("kas kecil", "debit", 50, () => { el("detail-divisi").value = "d3"; });
tambahBaris("donasi", "kredit", 50, () => { el("detail-program").value = "p1"; el("detail-program").dispatchEvent(new w.Event("change")); el("detail-divisi").value = ""; });
kirimJurnal();
const j4 = jurnalTersimpan()[2];
cek("33) jurnal dengan Divisi 'Umum' (d3) dan Program 'Beasiswa' (p1) tersimpan; rincian membawa divisiId dan programId", jurnalTersimpan().length === 3 && j4.rincian[0].divisiId === "d3" && j4.rincian[1].programId === "p1", j4 && j4.rincian);
w.modulProgram.hapus(w.modulProgram.ambil().find(p => p.id === "p1"));
cek("    hapus Program yang dipakai jurnal ditolak ('sudah dipakai di 1 jurnal'), tanpa popup konfirmasi", !el("dialog-konfirmasi").open && /sudah dipakai di 1 jurnal/.test(notif()) && w.modulProgram.ambil().length === 1, notif().slice(-120));
w.modulDivisi.hapus(w.modulDivisi.ambil().find(x => x.id === "d3"));
cek("    hapus Divisi yang dipakai jurnal ditolak ('sudah dipakai di 1 jurnal')", !el("dialog-konfirmasi").open && /Divisi "Umum" sudah dipakai di 1 jurnal/.test(notif()) && w.modulDivisi.ambil().length === 3, notif().slice(-140));
w.modulAkun.hapus(w.modulAkun.ambil().find(a => a.kode === "110101"));
cek("    hapus akun yang dipakai jurnal ditolak (menyebut 'Jurnal Umum'), tanpa popup konfirmasi", !el("dialog-konfirmasi").open && /Jurnal Umum/.test(notif()) && !!w.modulAkun.ambil().find(a => a.kode === "110101"), notif().slice(-140));
// Kode akun tidak boleh berubah kalau sudah dipakai jurnal (induknya dilepas/diganti mengubah kode)
w.modulAkun.bukaUbah(w.modulAkun.ambil().find(a => a.kode === "110101"));
d.getElementById("akun-sub").checked = false; d.getElementById("akun-sub").dispatchEvent(new w.Event("change", { bubbles: true }));
d.getElementById("form-akun").dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));
cek("    memindahkan akun yang dipakai jurnal (kodenya akan berubah) ditolak", !d.getElementById("galat-akun-tipe").hidden && /Jurnal Umum/.test(d.getElementById("galat-akun-tipe").textContent) && w.modulAkun.ambil().find(a => a.kode === "110101").indukId !== "", d.getElementById("galat-akun-tipe").textContent);
w.tampilkanTab("jurnal");
// Tanggal terkunci: jurnal lama tidak bisa diubah atau dihapus
w.localStorage.setItem("pembatasanYayasan", JSON.stringify({ tanggal: "tertentu", tanggalKunci: tgl, masaDepan: true, akses: "bebas" }));
w.modulJurnal.hapus(j4);
cek("34) jurnal pada tanggal terkunci: hapus ditolak (pesan 'terkunci'), tanpa popup konfirmasi", !el("dialog-konfirmasi").open && /terkunci/.test(notif().slice(-200)) && jurnalTersimpan().length === 3, notif().slice(-160));
w.modulJurnal.bukaUbah(j4); kirimJurnal();
cek("    jurnal pada tanggal terkunci: ubah ditolak ('sudah terkunci, jadi tidak bisa diubah' atau tanggal terkunci)", /terkunci/.test(galatJurnal()) && jurnalTersimpan().length === 3, galatJurnal());
w.localStorage.setItem("pembatasanYayasan", "{}");
jurnalBaruKosong();
// Tanpa aturan penomoran: nomor otomatis tidak bisa dipakai
w.localStorage.setItem("daftarPenomoran", "[]");
w.tampilkanTab("jurnal");
tambahBaris("kas kecil", "debit", 10); tambahBaris("donasi", "kredit", 10); kirimJurnal();
cek("35) tanpa aturan penomoran Jurnal Umum: simpan otomatis ditolak dengan petunjuk membuat aturan; tidak tersimpan", jurnalTersimpan().length === 3 && /aturan penomoran/.test(galatJurnal()) && /Pengaturan, Penomoran/.test(galatJurnal()), galatJurnal());
w.localStorage.setItem("daftarPenomoran", JSON.stringify(aturanUji));
jurnalBaruKosong();
// ====================== LAMPIRAN ======================
(async () => {
const berkas = (nama, isi, tipe) => new w.File([isi], nama, { type: tipe || "text/plain" });
const isiLamp = () => JSON.parse(w.localStorage.getItem("lampiranJurnal") || "{}");
const daftarLamp = () => [...d.querySelectorAll("#daftar-lampiran .butir-lampiran")];
const kuncikanWajib = (v) => w.localStorage.setItem("lampiranYayasan", JSON.stringify({ jurnal: v }));
kuncikanWajib(false);
w.localStorage.setItem("daftarPenomoran", JSON.stringify(aturanUji));
jurnalBaruKosong();
cek("40) jurnal baru: lencana klip tersembunyi, tidak ada lampiran", el("jurnal-lencana-lampiran").hidden && daftarLamp().length === 0);
el("jurnal-tombol-lampiran").click();
cek("    klik klip: dialog Lampiran terbuka, 'Belum ada lampiran' tampil, catatan wajib tersembunyi", el("dialog-lampiran").open && !el("lampiran-kosong").hidden && el("lampiran-wajib").hidden);
await w.lampiranJurnal.tambah([berkas("catatan.txt", "halo dunia")]);
cek("41) tambah file .txt: masuk daftar (nama + ukuran), lencana = 1, 'Belum ada' hilang", daftarLamp().length === 1 && /catatan\.txt/.test(daftarLamp()[0].textContent) && el("jurnal-lencana-lampiran").textContent === "1" && !el("jurnal-lencana-lampiran").hidden && el("lampiran-kosong").hidden, daftarLamp().map(x => x.textContent));
await w.lampiranJurnal.tambah([berkas("virus.exe", "x", "application/x-msdownload")]);
cek("42) file .exe ditolak dengan pesan, daftar tetap 1", daftarLamp().length === 1 && /jenis file tidak diizinkan/.test(el("galat-lampiran").textContent), el("galat-lampiran").textContent);
await w.lampiranJurnal.tambah([berkas("besar.pdf", "%PDF-1.4\n" + "a".repeat(800 * 1024), "application/pdf")]);
cek("43) PDF 800 KB (di atas 700 KB) ditolak dengan pesan ukuran", daftarLamp().length === 1 && /paling besar 700 KB/.test(el("galat-lampiran").textContent), el("galat-lampiran").textContent);
await w.lampiranJurnal.tambah([1, 2, 3, 4, 5, 6].map(n => berkas("f" + n + ".txt", "isi" + n)));
cek("44) menambah 6 file sekaligus: total berhenti di 5, sisanya ditolak (paling banyak 5)", daftarLamp().length === 5 && /paling banyak 5/.test(el("galat-lampiran").textContent), daftarLamp().length);
daftarLamp()[4].querySelector("button.tombol-garis-bahaya").click();
daftarLamp()[3].querySelector("button.tombol-garis-bahaya").click();
daftarLamp()[2].querySelector("button.tombol-garis-bahaya").click();
daftarLamp()[1].querySelector("button.tombol-garis-bahaya").click();
cek("45) tombol Hapus pada butir: daftar turun jadi 1, lencana ikut turun", daftarLamp().length === 1 && el("jurnal-lencana-lampiran").textContent === "1");
// nama berbahaya hanya tampil sebagai teks
await w.lampiranJurnal.tambah([berkas("<img src=x onerror=alert(1)>.txt", "z")]);
cek("46) nama file berisi HTML tampil sebagai teks biasa (tidak jadi elemen)", daftarLamp().length === 2 && !d.querySelector("#daftar-lampiran img") && /<img src=x/.test(daftarLamp()[1].textContent));
let diunduh = null; w.unduhLampiran = (n, i) => { diunduh = { n, i }; };
daftarLamp()[0].querySelector("button.tombol-garis").click();
cek("47) tombol Unduh memanggil unduhan dengan nama file dan isi data:", diunduh && diunduh.n === "catatan.txt" && /^data:text\/plain/.test(diunduh.i), diunduh);
el("selesai-lampiran").click();
cek("    tombol Selesai menutup dialog", !el("dialog-lampiran").open);

// ---- Simpan dengan lampiran ----
const sebelum = jurnalTersimpan().length;
tambahBaris("kas kecil", "debit", 5000);
tambahBaris("donasi", "kredit", 5000);
kirimJurnal();
const jl = jurnalTersimpan()[sebelum];
cek("48) simpan: jurnal punya lampiranInfo 2 file (tanpa isi), jumlahLampiran 2, ringkasan memuat nama", jl && jl.lampiranInfo.length === 2 && jl.jumlahLampiran === 2 && /catatan\.txt/.test(jl.ringkasanLampiran) && !JSON.stringify(jl).includes("data:text"), jl);
cek("    isi file disimpan terpisah di 'lampiranJurnal' menurut id jurnal", jl && Object.keys(isiLamp()[jl.id] || {}).length === 2);
cek("    Log Aktivitas mencatat Jumlah Lampiran 2 dan nama file", (() => { const l = logJurnal("Buat").slice(-1)[0]; return l && l.rincian.some(r => r.label === "Jumlah Lampiran" && r.baru === "2") && l.rincian.some(r => r.label === "Lampiran" && /catatan\.txt/.test(r.baru)); })());
// ---- Ubah ----
w.modulJurnal.bukaUbah(jl);
cek("49) buka jurnal tersimpan: lampiran termuat kembali (lencana 2)", el("jurnal-lencana-lampiran").textContent === "2");
el("jurnal-tombol-lampiran").click();
cek("    isi file ikut termuat (tombol Unduh aktif)", daftarLamp().length === 2 && !daftarLamp()[0].querySelector("button.tombol-garis").disabled);
daftarLamp()[1].querySelector("button.tombol-garis-bahaya").click();
el("selesai-lampiran").click();
kirimJurnal();
const jl2 = jurnalTersimpan().find(x => x.id === jl.id);
cek("50) hapus satu lampiran lalu simpan: tersisa 1 di data dan 1 isi di penyimpanan", jl2.lampiranInfo.length === 1 && Object.keys(isiLamp()[jl.id]).length === 1, jl2.lampiranInfo);
// ---- Wajib ----
kuncikanWajib(true);
jurnalBaruKosong();
cek("51) lampiran wajib: tombol klip diberi penanda, aria-label menyebut wajib", el("jurnal-tombol-lampiran").classList.contains("lampiran-wajib-kosong") && /wajib/.test(el("jurnal-tombol-lampiran").getAttribute("aria-label")));
tambahBaris("kas kecil", "debit", 700);
tambahBaris("donasi", "kredit", 700);
const n0 = jurnalTersimpan().length;
kirimJurnal();
cek("    simpan tanpa lampiran ditolak dengan pesan, tidak tersimpan", jurnalTersimpan().length === n0 && /Lampiran wajib/.test(galatJurnal()), galatJurnal());
el("jurnal-tombol-lampiran").click();
cek("    dialog menampilkan catatan wajib", !el("lampiran-wajib").hidden);
await w.lampiranJurnal.tambah([berkas("bukti.txt", "bukti")]);
el("selesai-lampiran").click();
kirimJurnal();
cek("    setelah ada lampiran: tersimpan", jurnalTersimpan().length === n0 + 1);
// ---- Hapus jurnal membersihkan isi ----
const idHapus = jurnalTersimpan()[n0].id;
cek("52) sebelum dihapus: isi lampiran ada", !!isiLamp()[idHapus]);
w.modulJurnal.hapus(jurnalTersimpan()[n0]); el("ya-konfirmasi").click();
cek("    jurnal dihapus: isi lampirannya ikut hilang dari penyimpanan", jurnalTersimpan().length === n0 && !isiLamp()[idHapus]);
// ---- Kuota penuh ----
kuncikanWajib(false);
jurnalBaruKosong();
tambahBaris("kas kecil", "debit", 100); tambahBaris("donasi", "kredit", 100);
await w.lampiranJurnal.tambah([berkas("q.txt", "q")]);
const asliSet = w.Storage.prototype.setItem;
w.Storage.prototype.setItem = function (k, v) { if (k === "lampiranJurnal") { throw new Error("QuotaExceeded"); } return asliSet.call(this, k, v); };
const n1 = jurnalTersimpan().length;
kirimJurnal();
w.Storage.prototype.setItem = asliSet;
cek("53) penyimpanan penuh: jurnal tidak tersimpan dan ada pesan jelas soal lampiran", jurnalTersimpan().length === n1 && /tidak muat/.test(galatJurnal()), galatJurnal());
cek("54) tidak ada galat skrip selama rangkaian lampiran", kesalahan.length === 0, kesalahan);
akhir();
})();
function akhir() {
cek("36) tidak ada galat skrip selama seluruh rangkaian simpan", kesalahan.length === 0, kesalahan);
cek("12) tidak ada console.warn/galat skrip", kesalahan.length === 0, kesalahan);
console.log("\nLolos:", lolos, "Gagal:", gagal, "| Kesalahan skrip:", kesalahan.length ? kesalahan : "tidak ada");
process.exit(gagal || kesalahan.length ? 1 : 0);
}
