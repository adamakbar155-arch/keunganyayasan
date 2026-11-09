// ==================== Laporan: menu ====================
// Berisi: tab Laporan (ikon Laporan di menu samping; PRD 7, dari foto menu Laporan Accurate). Kiri: kategori; kanan: kartu
// laporan per kelompok dan kotak Cari. Setiap laporan dibuat di foldernya sendiri, lalu didaftarkan di DAFTAR_LAPORAN di
// bawah. Kartu membuka jendela Parameter, lalu kertas hasil laporan (bukaLaporan, fitur/laporan/kertas.js).
// HTML: fitur/laporan/tampilan.js. Gaya: fitur/laporan/laporan.css.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// Ikon kategori (gambar tetap buatan sendiri, bukan isian pengguna, jadi aman dipasang sebagai HTML)
var IKON_KATEGORI_LAPORAN = {
    tersimpan: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
    keuangan: '<path d="M4 20h16M6 16v-5M10 16V8M14 16v-6M18 16V5"/>',
    "divisi-program": '<rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>',
    "kas-bank": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18M7 4h10"/>',
    donasi: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
    "buku-besar": '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h12"/>',
    "aset-tetap": '<path d="M3 21h18M5 21V5l8-2v18M13 9l6 2v10"/><path d="M8 8h2M8 12h2M8 16h2"/>'
};
// Ikon kartu: ringkasan (lembar laporan, biru) dan rincian (tabel, ungu), seperti Accurate
var IKON_KARTU_LAPORAN = {
    ringkasan: '<path d="M10 6h20l8 8v28H10z"/><path d="M30 6v8h8"/><path d="M16 20h16M16 26h16M16 32h8"/>',
    rincian: '<rect x="6" y="8" width="34" height="32" rx="3"/><path d="M6 18h34M6 28h34M18 8v32M29 8v32"/>'
};

// Daftar laporan per kategori (PRD 7). Tiap laporan:
//   id         : penanda tetap (dipakai Laporan Tersimpan; jangan diganti)
//   nama       : judul kartu dan kertas;  label: (boleh kosong) nama Accurate sebagai label kecil
//   keterangan : penjelasan singkat;  jenis: "ringkasan" (kartu biru) atau "rincian" (kartu ungu)
//   gambar     : function (param) -> { isi, judul, catatan } (lihat kertas.js). Fungsi laporannya ada di file yang dimuat
//                SESUDAH file ini, jadi ditulis function (p) { return gambarXxx(p); }, supaya namanya baru dicari saat dipakai.
//   parameter  : (boleh tidak ada) isian Parameter yang berlaku: { filter, akun, centang } (parameter.js)
//   perTanggal : (boleh tidak ada) true = posisi pada tanggal s/d; kepala kertas menulis "Per <tanggal>" (PRD 7)
//   perBulan   : (boleh tidak ada) true = periode dibulatkan ke bulan penuh; kepala kertas menulis "Dari periode <bulan> s/d <bulan>"
//   lebar      : (boleh tidak ada) true = berkolom banyak; kertas lebih lebar dan mendatar saat dicetak
//   cetakAudit : (boleh tidak ada) function (param): tombol "Lampiran audit" tampil di bilah laporan (Bukti Pengeluaran, PRD 5.4)
var DAFTAR_LAPORAN = [
    { id: "tersimpan", nama: "Laporan Tersimpan", kelompok: [] },   // kartunya dari kelompokLaporanTersimpan (tersimpan.js)
    { id: "keuangan", nama: "Keuangan", kelompok: [
        { judul: "Laporan Keuangan Yayasan (ISAK 35)", laporan: [
            { id: "posisi-keuangan", nama: "Laporan Posisi Keuangan", label: "Neraca", jenis: "ringkasan", perTanggal: true,
              parameter: { filter: false }, gambar: function (p) { return gambarPosisiKeuangan(p); },
              keterangan: "Aset, liabilitas, dan aset neto (tanpa/dengan pembatasan) per tanggal" },
            { id: "penghasilan-komprehensif", nama: "Laporan Penghasilan Komprehensif", label: "Laba Rugi", jenis: "ringkasan",
              gambar: function (p) { return gambarPenghasilanKomprehensif(p); },
              keterangan: "Penerimaan dan beban, kolom dengan/tanpa pembatasan, untuk periode yang dipilih" },
            { id: "perubahan-aset-neto", nama: "Laporan Perubahan Aset Neto", label: "Perubahan Modal", jenis: "ringkasan",
              parameter: { filter: false, centang: false }, gambar: function (p) { return gambarPerubahanAsetNeto(p); },
              keterangan: "Saldo awal, surplus, pemindahan, dan saldo akhir aset neto" },
            { id: "arus-kas", nama: "Laporan Arus Kas", label: "", jenis: "ringkasan",
              parameter: { filter: false }, gambar: function (p) { return gambarArusKas(p); },
              keterangan: "Penerimaan dan pengeluaran kas metode langsung: operasi, investasi, pendanaan" },
            { id: "penghasilan-anggaran", nama: "Laporan Penghasilan (Perbandingan Anggaran)", label: "Laba Rugi (Perbandingan Anggaran)", jenis: "ringkasan", perBulan: true,
              parameter: { filter: false }, gambar: function (p) { return gambarPerbandinganAnggaran(p, ""); },
              keterangan: "Aktual dibanding Anggaran Tipe Umum, dengan Selisih dan % Selisih" }
        ] }
    ] },
    { id: "divisi-program", nama: "Divisi & Program", kelompok: [
        { judul: "Divisi & Program", laporan: [
            { id: "penghasilan-per-divisi", nama: "Laporan Penghasilan per Divisi", label: "Laba Rugi Departemen", jenis: "ringkasan",
              gambar: function (p) { return gambarPenghasilanPerDivisi(p); },
              keterangan: "Penerimaan, beban, dan surplus setiap Divisi berdampingan, dengan kolom Total" },
            { id: "penghasilan-per-program", nama: "Laporan Penghasilan per Program", label: "Laba Rugi Proyek", jenis: "ringkasan",
              gambar: function (p) { return gambarPenghasilanPerProgram(p); },
              keterangan: "Penerimaan, beban, dan surplus setiap Program berdampingan, dengan kolom Total" },
            { id: "penghasilan-anggaran-divisi", nama: "Laporan Penghasilan per Divisi (Perbandingan Anggaran)", label: "Laba Rugi Departemen (Perbandingan Anggaran)", jenis: "ringkasan", perBulan: true,
              parameter: { filter: "divisi" }, gambar: function (p) { return gambarPerbandinganAnggaran(p, "divisi"); },
              keterangan: "Aktual dibanding Anggaran Per Divisi, dengan Selisih dan % Selisih" },
            { id: "penghasilan-anggaran-program", nama: "Laporan Penghasilan per Program (Perbandingan Anggaran)", label: "Laba Rugi Proyek (Perbandingan Anggaran)", jenis: "ringkasan", perBulan: true,
              parameter: { filter: "program" }, gambar: function (p) { return gambarPerbandinganAnggaran(p, "program"); },
              keterangan: "Aktual dibanding Anggaran Per Program, dengan Selisih dan % Selisih" },
            { id: "donasi-per-program", nama: "Laporan Donasi per Program", label: "", jenis: "ringkasan", lebar: true,
              parameter: { centang: false }, gambar: function (p) { return gambarDonasiPerProgram(p); },
              keterangan: "Sisa awal, donasi masuk, pengeluaran, pemindahan, dan sisa akhir tiap Program" },
            { id: "sisa-dana-program", nama: "Sisa Dana per Program", label: "", jenis: "ringkasan", perTanggal: true,
              parameter: { centang: false }, gambar: function (p) { return gambarSisaDanaProgram(p); },
              keterangan: "Pemantauan sisa dana setiap Program pada tanggal tertentu" },
            { id: "rincian-pengeluaran", nama: "Rincian Pengeluaran", label: "", jenis: "rincian", lebar: true,
              parameter: { akun: true, centang: false }, gambar: function (p) { return gambarRincianPengeluaran(p); },
              keterangan: "Segala pembelian dan pengeluaran dari Jurnal Umum dan Pembayaran beserta keterangannya" },
            { id: "bukti-pengeluaran", nama: "Bukti Pengeluaran per Divisi dan Program", label: "", jenis: "rincian", lebar: true,
              parameter: { centang: false }, gambar: function (p) { return gambarBuktiPengeluaran(p); },
              cetakAudit: function (p) { cetakAuditBukti(p); },
              keterangan: "Pengeluaran setiap Divisi dan Program beserta nota atau bukti transaksinya" }
        ] }
    ] },
    { id: "kas-bank", nama: "Kas & Bank", kelompok: [
        { judul: "Kas & Bank", laporan: [
            { id: "daftar-kas-bank", nama: "Daftar Kas dan Bank", label: "", jenis: "ringkasan", perTanggal: true,
              parameter: { filter: false, centang: false }, gambar: function (p) { return gambarDaftarKasBank(p); },
              keterangan: "Daftar akun Kas dan Bank beserta saldonya" },
            { id: "rincian-beban-pembayaran", nama: "Rincian Beban Pembayaran", label: "", jenis: "rincian", lebar: true,
              parameter: { akun: true, centang: false }, gambar: function (p) { return gambarRincianBebanPembayaran(p); },
              keterangan: "Rincian beban dari setiap Pembayaran" }
        ] }
    ] },
    { id: "donasi", nama: "Donasi", kelompok: [
        { judul: "Donasi", laporan: [
            { id: "donasi-per-divisi", nama: "Penerimaan Donasi per Divisi", label: "", jenis: "ringkasan",
              parameter: { centang: false }, gambar: function (p) { return gambarDonasiPerDivisi(p); },
              keterangan: "Jumlah donasi yang diterima setiap Divisi untuk periode yang dipilih" },
            { id: "rincian-per-donasi", nama: "Rincian per Donasi", label: "", jenis: "rincian",
              parameter: { centang: false }, gambar: function (p) { return gambarRincianPerDonasi(p); },
              keterangan: "Daftar donasi setiap Kategori Donasi: tanggal, nilai, dan nama donatur" },
            { id: "donasi-per-donatur", nama: "Rincian Donasi per Donatur", label: "", jenis: "rincian",
              parameter: { centang: false }, gambar: function (p) { return gambarDonasiPerDonatur(p); },
              keterangan: "Daftar donasi setiap donatur: tanggal, nomor bukti, kategori, dan nilai" }
        ] }
    ] },
    { id: "buku-besar", nama: "Buku Besar", kelompok: [
        { judul: "Buku Besar", laporan: [
            { id: "neraca-saldo", nama: "Neraca Saldo", label: "", jenis: "ringkasan", perTanggal: true,
              parameter: { filter: false, centang: false }, gambar: function (p) { return gambarNeracaSaldo(p); },
              keterangan: "Saldo debit dan kredit setiap akun per tanggal" },
            { id: "buku-besar-akun", nama: "Buku Besar per Akun", label: "", jenis: "rincian", lebar: true,
              parameter: { filter: false, akun: true, centang: false }, gambar: function (p) { return gambarBukuBesar(p); },
              keterangan: "Semua transaksi satu akun beserta saldo berjalannya" },
            { id: "jurnal-tanpa-lampiran", nama: "Jurnal tanpa Lampiran", label: "", jenis: "rincian",
              parameter: { filter: false, centang: false }, gambar: function (p) { return gambarJurnalTanpaLampiran(p); },
              keterangan: "Jurnal yang belum memiliki lampiran bukti" }
        ] }
    ] },
    { id: "aset-tetap", nama: "Aset Tetap", kelompok: [
        { judul: "Aset Tetap", laporan: [
            { id: "daftar-aset-tetap", nama: "Daftar Aset Tetap", label: "", jenis: "ringkasan", perTanggal: true, lebar: true,
              parameter: { filter: false, centang: false }, gambar: function (p) { return gambarDaftarAsetTetap(p); },
              keterangan: "Nilai aset, sudah disusutkan, dan nilai buku per kategori pada tanggal tertentu" },
            { id: "penyusutan-aset-tetap", nama: "Penyusutan Aset Tetap", label: "", jenis: "rincian",
              parameter: { filter: false, centang: false }, gambar: function (p) { return gambarPenyusutanAsetTetap(p); },
              keterangan: "Penyusutan setiap aset dalam periode yang dipilih" },
            { id: "aset-dilepas", nama: "Aset yang Dilepas", label: "", jenis: "rincian", lebar: true,
              parameter: { filter: false, centang: false }, gambar: function (p) { return gambarAsetDilepas(p); },
              keterangan: "Aset yang dijual, rusak, hilang, atau dihibahkan, dengan untung atau ruginya" }
        ] }
    ] }
];

var kategoriLaporanAktif = "tersimpan";   // seperti Accurate: menu Laporan dibuka di Laporan Tersimpan
var kolomCariLaporan = document.getElementById("lap-cari");

// Satu SVG dari gambar tetap di atas
function buatIkonLaporan(isi, kotakLihat, kelas) {
    var wadah = document.createElement("span");
    wadah.className = kelas;
    wadah.insertAdjacentHTML("beforeend", '<svg viewBox="' + kotakLihat + '" fill="none" stroke="currentColor" stroke-width="' +
        (kotakLihat === "0 0 24 24" ? "1.8" : "2") + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + isi + "</svg>");
    return wadah;
}

// Tombol kategori di kiri
function gambarKategoriLaporan() {
    var nav = document.getElementById("lap-kategori");
    nav.textContent = "";
    DAFTAR_LAPORAN.forEach(function (kat) {
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "lap-kat" + (kat.id === kategoriLaporanAktif ? " aktif" : "");
        tombol.setAttribute("aria-current", kat.id === kategoriLaporanAktif ? "true" : "false");
        tombol.appendChild(buatIkonLaporan(IKON_KATEGORI_LAPORAN[kat.id], "0 0 24 24", "lap-kat-ikon"));
        tombol.appendChild(document.createTextNode(kat.nama));
        tombol.addEventListener("click", function () {
            kategoriLaporanAktif = kat.id;
            kolomCariLaporan.value = "";   // pindah kategori = mulai lagi tanpa kata cari
            gambarMenuLaporan();
        });
        nav.appendChild(tombol);
    });
    // Layar sempit: kategori berbaris ke samping dan bisa digeser; geser supaya kategori aktif terlihat utuh
    // (scrollLeft hanya menggeser baris ini, halaman tidak ikut bergulir)
    var aktif = nav.querySelector(".lap-kat.aktif");
    if (aktif && nav.scrollWidth > nav.clientWidth) { nav.scrollLeft = Math.max(0, aktif.offsetLeft - nav.offsetLeft - 8); }
}

// Satu kartu laporan. kata = kata cari (huruf kecil) untuk disorot.
// Kartu Laporan Tersimpan (lap.tersimpan) langsung menampilkan laporan dengan parameternya, dan punya tombol hapus.
function buatKartuLaporan(lap, kata) {
    var kartu = document.createElement("button");
    kartu.type = "button";
    kartu.className = "lap-kartu " + (lap.jenis === "rincian" ? "rincian" : "ringkasan");
    kartu.appendChild(buatIkonLaporan(IKON_KARTU_LAPORAN[lap.jenis === "rincian" ? "rincian" : "ringkasan"], "0 0 48 48", "lap-kartu-ikon"));
    var teks = document.createElement("span");
    teks.className = "lap-kartu-teks";
    var nama = document.createElement("span");
    nama.className = "lap-kartu-nama";
    tulisDenganSorot(nama, lap.nama, kata);   // umum/komponen-transaksi.js
    if (lap.label) {
        var label = document.createElement("span");
        label.className = "lap-label";
        label.textContent = lap.label;
        nama.appendChild(label);
    }
    var ket = document.createElement("span");
    ket.className = "lap-kartu-ket";
    tulisDenganSorot(ket, lap.keterangan, kata);
    teks.appendChild(nama);
    teks.appendChild(ket);
    kartu.appendChild(teks);
    kartu.addEventListener("click", function () {
        if (lap.tersimpan) { tampilkanLaporan(lap.asal, lap.tersimpan.param, lap.tersimpan.modifikasi); } else { bukaLaporan(lap); }
    });
    if (!lap.tersimpan) { return kartu; }
    var bungkus = document.createElement("div");
    bungkus.className = "lap-kartu-bungkus";
    var hapus = document.createElement("button");
    hapus.type = "button";
    hapus.className = "lap-tersimpan-hapus";
    hapus.textContent = "×";
    hapus.setAttribute("aria-label", "Hapus laporan tersimpan " + lap.nama);
    hapus.addEventListener("click", function () { hapusLaporanTersimpan(lap.tersimpan); });
    bungkus.appendChild(kartu);
    bungkus.appendChild(hapus);
    return bungkus;
}

// Kelompok: judul + kisi kartu
function buatKelompokLaporan(judul, daftar, kata) {
    var bagian = document.createElement("section");
    bagian.className = "lap-kelompok";
    var h = document.createElement("h3");
    h.textContent = judul;
    bagian.appendChild(h);
    var kisi = document.createElement("div");
    kisi.className = "lap-kisi";
    daftar.forEach(function (lap) { kisi.appendChild(buatKartuLaporan(lap, kata)); });
    bagian.appendChild(kisi);
    return bagian;
}

function pesanKosongLaporan(teks) {
    var p = document.createElement("p");
    p.className = "lap-kosong";
    p.textContent = teks;
    return p;
}

// Kelompok milik satu kategori; Laporan Tersimpan dibaca dari penyimpanan
function kelompokKategoriLaporan(kat) {
    return kat.id === "tersimpan" ? kelompokLaporanTersimpan() : kat.kelompok;
}

// Isi kanan. Tanpa kata cari: kelompok milik kategori aktif. Dengan kata cari: semua laporan di semua kategori yang nama
// atau keterangannya memuat kata itu, dikelompokkan menurut kategori (kategori aktif tidak membatasi pencarian).
function gambarMenuLaporan() {
    gambarKategoriLaporan();
    var kat = DAFTAR_LAPORAN.find(function (k) { return k.id === kategoriLaporanAktif; }) || DAFTAR_LAPORAN[0];
    var kata = kolomCariLaporan.value.trim().toLowerCase();
    var isi = document.getElementById("lap-isi");
    isi.textContent = "";
    document.getElementById("lap-judul").textContent = kata ? "Hasil pencarian" : kat.nama;
    var tombolTersimpan = (kata !== "" || kat.id !== "tersimpan");
    document.getElementById("lap-impor").hidden = tombolTersimpan;
    document.getElementById("lap-ekspor").hidden = tombolTersimpan;

    if (kata) {
        var ada = false;
        DAFTAR_LAPORAN.forEach(function (k) {
            var cocok = [];
            kelompokKategoriLaporan(k).forEach(function (kel) {
                kel.laporan.forEach(function (lap) {
                    if ((lap.nama + " " + lap.label + " " + lap.keterangan).toLowerCase().indexOf(kata) !== -1) { cocok.push(lap); }
                });
            });
            if (cocok.length) { ada = true; isi.appendChild(buatKelompokLaporan(k.nama, cocok, kata)); }
        });
        if (!ada) { isi.appendChild(pesanKosongLaporan('Tidak ada laporan yang cocok dengan "' + kolomCariLaporan.value.trim() + '".')); }
        return;
    }
    var kelompok = kelompokKategoriLaporan(kat);
    if (kat.id === "tersimpan" && kelompok.length === 0) {
        isi.appendChild(pesanKosongLaporan("Belum ada laporan tersimpan. Buka laporan, lalu klik Simpan Laporan supaya laporan beserta pengaturannya (periode, Divisi, Program) bisa dibuka lagi dari sini."));
        return;
    }
    kelompok.forEach(function (kel) { isi.appendChild(buatKelompokLaporan(kel.judul, kel.laporan, "")); });
}

kolomCariLaporan.addEventListener("input", gambarMenuLaporan);

// Ikon Laporan di menu samping
function bukaMenuLaporan() {
    bukaTab("laporan");
}
saatTabDibuka.laporan = gambarMenuLaporan;
document.getElementById("tombol-laporan").addEventListener("click", function (kejadian) {
    kejadian.preventDefault();   // tautan href="#" tidak menggulir halaman ke atas
    bukaMenuLaporan();
});
