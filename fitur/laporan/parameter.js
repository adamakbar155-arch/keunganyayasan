// ==================== Laporan: jendela Parameter Laporan ====================
// Popup yang muncul saat kartu laporan diklik (PRD 7, dari foto Parameter Laporan Laba Rugi Accurate; tugas I.1g-1).
// Isinya dipakai bersama oleh laporan ringkasan (Posisi Keuangan, Penghasilan Komprehensif, ...):
//   Tanggal Dari dan s/d (isi awal: tanggal 1 bulan ini sampai hari ini),
//   Divisi dan Program (boleh pilih beberapa; tanpa pilihan = semua),
//   kotak centang Hanya Tampilkan Total, Tampilkan Akun Induk, Tampilkan Akun Anak.
// Pemakaian dari laporan:
//   bukaParameterLaporan(lap, function (param) { ...gambar laporan... }, paramSebelumnya);
//   param = { dari, sampai ("YYYY-MM-DD"), divisi: [id], program: [id], akun: [id], hanyaTotal, akunInduk, akunAnak }
// HTML: fitur/laporan/tampilan.js. Gaya: fitur/laporan/laporan.css.

var dialogParameterLaporan = document.getElementById("dialog-parameter-laporan");
var kolomDariParam = document.getElementById("param-dari");
var kolomSampaiParam = document.getElementById("param-sampai");
var galatTanggalParam = document.getElementById("galat-param-tanggal");
var saatTampilkanParam = null;   // fungsi milik laporan yang sedang dibuka; dijalankan saat Tampilkan diklik

// Divisi dan Program dibaca ulang setiap daftar dibuka (data bisa baru ditambah). teksAman: data rusak tetap aman.
var pemilihDivisiParam = buatPemilihBanyak({
    wadah: document.getElementById("param-divisi"),
    labelSemua: "Semua Divisi",
    ambilData: function () {
        return bacaDivisi().filter(function (d) { return d && teksAman(d.id) !== ""; })
            .map(function (d) { return { nilai: teksAman(d.id), teks: teksAman(d.nama) }; });
    }
});
var pemilihProgramParam = buatPemilihBanyak({
    wadah: document.getElementById("param-program"),
    // Semua Program, termasuk yang sudah Selesai: laporan bisa untuk periode lama
    ambilData: function () {
        return bacaProgram().filter(function (p) { return p && teksAman(p.id) !== ""; })
            .map(function (p) { return { nilai: teksAman(p.id), teks: teksAman(p.nama) }; });
    }
});

// Akun untuk laporan rincian (Rincian Pengeluaran, Buku Besar): semua akun, urut kode
var pemilihAkunParam = buatPemilihBanyak({
    wadah: document.getElementById("param-akun"),
    ambilData: function () {
        return bacaDaftarAkun().filter(function (a) { return a && teksAman(a.id) !== ""; }).sort(urutKodeAkun)
            .map(function (a) { return { nilai: teksAman(a.id), teks: "[" + teksAman(a.kode) + "] " + teksAman(a.nama) }; });
    }
});

// Hanya isian yang berlaku untuk laporan itu yang tampil. p = kolom parameter di DAFTAR_LAPORAN:
//   filter  : Divisi dan Program (bawaan ya; "divisi" atau "program" = hanya itu)
//   akun    : pilihan Akun (bawaan tidak)   centang : tiga kotak centang (bawaan ya)
function aturIsianParameterLaporan(p) {
    var a = p || {};
    var filter = a.filter !== false, akun = a.akun === true;
    document.getElementById("param-baris-divisi").hidden = !filter || a.filter === "program";
    document.getElementById("param-baris-program").hidden = !filter || a.filter === "divisi";
    document.getElementById("param-baris-akun").hidden = !akun;
    document.getElementById("param-judul-tambahan").hidden = !filter && !akun;
    document.getElementById("param-kotak-centang").hidden = a.centang === false;
}

// Isi awal sesuai PRD: tanggal 1 bulan ini s/d hari ini, Semua Divisi, Program kosong, Induk dan Anak tercentang.
// awal = (boleh kosong) param yang dipakai sebelumnya (tombol Ubah Parameter di hasil laporan): isinya dipasang lagi.
function isiAwalParameterLaporan(awal) {
    var a = awal || {};
    var hariIni = tanggalHariIni();   // umum/preferensi.js, "YYYY-MM-DD"
    kolomDariParam.value = a.dari || hariIni.slice(0, 8) + "01";
    kolomSampaiParam.value = a.sampai || hariIni;
    galatTanggalParam.hidden = true;
    pemilihDivisiParam.tetapkan(a.divisi || []);
    pemilihProgramParam.tetapkan(a.program || []);
    pemilihAkunParam.tetapkan(a.akun || []);
    document.getElementById("param-hanya-total").checked = a.hanyaTotal === true;
    document.getElementById("param-akun-induk").checked = a.akunInduk !== false;
    document.getElementById("param-akun-anak").checked = a.akunAnak !== false;
}

// lap = data kartu dari DAFTAR_LAPORAN (untuk nama laporan di popup); saatTampilkan = function (param);
// awal = (boleh kosong) param sebelumnya
function bukaParameterLaporan(lap, saatTampilkan, awal) {
    aturIsianParameterLaporan(lap.parameter);
    isiAwalParameterLaporan(awal);
    document.getElementById("param-nama-laporan").textContent = lap.nama;   // textContent: aman dari kode HTML
    saatTampilkanParam = saatTampilkan;
    dialogParameterLaporan.showModal();
}

// Pesan kalau tanggal belum benar; kosong kalau sudah benar
function galatTanggalParameter(dari, sampai) {
    if (!dari) { return "Tanggal Dari wajib diisi."; }
    if (!sampai) { return "Tanggal s/d wajib diisi."; }
    if (dari > sampai) { return "Tanggal Dari tidak boleh sesudah tanggal s/d."; }   // bentuk YYYY-MM-DD bisa dibandingkan sebagai teks
    return "";
}

document.getElementById("tampilkan-parameter-laporan").addEventListener("click", function () {
    var pesan = galatTanggalParameter(kolomDariParam.value, kolomSampaiParam.value);
    if (pesan) {
        galatTanggalParam.textContent = pesan;
        galatTanggalParam.hidden = false;
        (kolomDariParam.value ? kolomSampaiParam : kolomDariParam).focus();
        return;
    }
    var param = {
        dari: kolomDariParam.value,
        sampai: kolomSampaiParam.value,
        divisi: pemilihDivisiParam.nilai(),
        program: pemilihProgramParam.nilai(),
        akun: pemilihAkunParam.nilai(),
        hanyaTotal: document.getElementById("param-hanya-total").checked,
        akunInduk: document.getElementById("param-akun-induk").checked,
        akunAnak: document.getElementById("param-akun-anak").checked
    };
    var tindakan = saatTampilkanParam;   // simpan dulu, karena penutupan popup mengosongkannya
    dialogParameterLaporan.close();
    if (tindakan) { tindakan(param); }
});

// Tanggal diubah: pesan salah lama disembunyikan
[kolomDariParam, kolomSampaiParam].forEach(function (k) {
    k.addEventListener("change", function () { galatTanggalParam.hidden = true; });
});

document.getElementById("tutup-parameter-laporan").addEventListener("click", function () { dialogParameterLaporan.close(); });
// Popup tertutup dengan cara apa pun (×, Esc, klik latar, Tampilkan): laporan yang menunggu dikosongkan
dialogParameterLaporan.addEventListener("close", function () { saatTampilkanParam = null; });
// Klik di latar gelap = tutup
dialogParameterLaporan.addEventListener("click", function (kejadian) {
    if (kejadian.target === dialogParameterLaporan) { dialogParameterLaporan.close(); }
});
