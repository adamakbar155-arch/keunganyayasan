// ==================== Kategori Donasi (Donasi) ====================
// Tempat membuat AKUN DONASI (PRD 6.1; dari formulir Barang & Jasa Accurate yang fungsinya diubah).
// Satu Kategori Donasi = satu akun pendapatan di Akun Perkiraan, sub dari akun induk yang dipilih.
//   - Kode Donasi = kode akunnya: otomatis dari induk (alat bersama buatKodeAkun di fitur/akun/akun.js), terkunci.
//   - Kelompok: pilih dari kelompok yang sudah dipakai, atau ketik nama baru.
//   - Terikat / Tidak Terikat dibaca dari Preferensi > Akun Perkiraan (sifatAkunDonasi di umum/preferensi.js).
// Bagian 1: tampilan, daftar, isi formulir. Bagian 2: simpan Data Baru membuat akun.
// Bagian 3: akunnya terkunci di Akun Perkiraan (3a, fitur/akun/akun.js), ubah ikut ke akun (3b), hapus ikut ke akun dan Preferensi (3c).
// Akun yang dibuat memakai bentuk akun Akun Perkiraan ditambah penanda kategoriDonasiId (id kategori pemiliknya).
// HTML-nya: fitur/kategori-donasi/tampilan.js. Dimuat sesudah fitur/akun/akun.js (memakai petaAkun dan buatKodeAkun).
// Satu data tersimpan (kunci daftarKategoriDonasi): { id, nama, indukId, akunId, kode, kelompok, catatan }.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var kolomNamaKd = document.getElementById("kd-nama");
var pilihIndukKd = document.getElementById("kd-induk");
var kolomKodeKd = document.getElementById("kd-kode");
var kolomKelompokKd = document.getElementById("kd-kelompok");
var kolomCatatanKd = document.getElementById("kd-catatan");
var galatKd = {
    nama: document.getElementById("galat-kd-nama"),
    induk: document.getElementById("galat-kd-induk")
};

// Label sifat akun donasi untuk kolom dan filter daftar
var labelSifatDonasi = { "terikat": "Terikat", "tidak-terikat": "Tidak Terikat", "": "Belum diatur" };
function teksSifatKd(kategori) {
    return labelSifatDonasi[sifatAkunDonasi(teksAman(kategori.kode))];
}

// Daftar Kategori Donasi langsung dari penyimpanan (alat bersama bacaDaftarTersimpan, umum/alat.js).
// Dipakai pilihan induk dan Kelompok, yang juga dipanggil SAAT modul daftar sedang dibuat (buatModulDaftar memanggil
// saatTampil), ketika modulKategoriDonasi belum ada. Dipakai juga fitur lain nanti (formulir Donasi).
function bacaKategoriDonasi() {
    return bacaDaftarTersimpan("daftarKategoriDonasi");
}

// Kategori yang sedang diubah, atau null kalau Data Baru
function kategoriKdDiubah() {
    if (typeof modulKategoriDonasi === "undefined" || !modulKategoriDonasi.idDiubah) { return null; }   // modul belum selesai dibuat
    return bacaKategoriDonasi().find(function (k) { return k.id === modulKategoriDonasi.idDiubah; }) || null;
}

// Pilihan "Sub dari": akun bertipe Pendapatan di tingkat 1 atau 2 (akun donasinya lalu berada paling dalam di tingkat 3,
// sama dengan batas Akun Perkiraan). Akun milik Kategori Donasi lain tidak boleh menjadi induk (akun itu dipakai transaksi).
function calonIndukKd() {
    var peta = petaAkun();
    // akunMilikKategoriDonasi (fitur/akun/akun.js) dipakai bersama dengan pilihan induk di Akun Perkiraan
    return peta.semua.filter(function (a) {
        return a.tipe === "pendapatan" && (peta.dalam[a.id] || 0) <= 1 && !akunMilikKategoriDonasi(a);
    }).sort(function (a, b) { return peta.jalur[a.id].localeCompare(peta.jalur[b.id], "id"); });
}
function isiPilihanIndukKd(idTerpilih) {
    var peta = petaAkun();
    var calon = calonIndukKd();
    isiPilihan(pilihIndukKd, calon, {
        teks: function (a) { return "- ".repeat(peta.dalam[a.id] || 0) + a.kode + " " + a.nama; },
        kosong: "Pilih akun induk...",
        kosongKalauTakAda: "Belum ada akun Pendapatan",
        terpilih: idTerpilih,
        petunjuk: document.getElementById("petunjuk-kd-induk")
    });
}

// Kode Donasi mengikuti induk yang dipilih. Saat mengubah kategori lama yang induknya tidak berubah, kodenya tetap.
function perbaruiKodeKd() {
    var lama = kategoriKdDiubah();
    var indukId = pilihIndukKd.value;
    if (lama && lama.indukId === indukId) {
        kolomKodeKd.value = teksAman(lama.kode);
    } else {
        kolomKodeKd.value = indukId ? buatKodeAkun("pendapatan", indukId, lama ? lama.akunId : null) : "";
    }
}

// Daftar Kelompok yang sudah pernah dipakai, untuk pilihan di kolom Kelompok (alat bersama di umum/alat.js)
function isiDaftarKelompokKd() {
    isiSaranDatalist(document.getElementById("kd-daftar-kelompok"), bacaKategoriDonasi(), function (k) { return k.kelompok; });
}

function sembunyikanGalatKd() {
    Object.keys(galatKd).forEach(function (nama) { galatKd[nama].hidden = true; });
}

var modulKategoriDonasi = buatModulDaftar({
    id: "kategori-donasi",
    judul: "Kategori Donasi",
    kunci: "daftarKategoriDonasi",
    labelData: { nama: "Nama Donasi", indukId: "Sub dari", kode: "Kode Donasi", kelompok: "Kelompok", catatan: "Catatan" },
    formatData: { indukId: function (id) { var a = petaAkun().perId[id]; return a ? a.kode + " " + a.nama : ""; } },
    kolom: [
        { kunci: "nama", judul: "Nama Donasi" },
        { kunci: "kode", judul: "Kode" },
        { kunci: "kelompok", judul: "Kelompok" },
        { kunci: "sifat", judul: "Terikat / Tidak Terikat", tampil: teksSifatKd }
    ],
    filter: [
        { judul: "Kelompok", ambil: function (k) { return teksAman(k.kelompok); } },
        { judul: "Terikat / Tidak Terikat", ambil: teksSifatKd }
    ],
    pesanKosong: "Belum ada kategori donasi. Klik tombol + untuk membuat.",
    saatTampil: function () { isiPilihanIndukKd(pilihIndukKd.value); isiDaftarKelompokKd(); },
    isiForm: function (kategori) {
        isiPilihanIndukKd(kategori ? kategori.indukId : "");
        kolomNamaKd.value = kategori ? teksAman(kategori.nama) : "";
        kolomKelompokKd.value = kategori ? teksAman(kategori.kelompok) : "";
        kolomCatatanKd.value = kategori ? teksAman(kategori.catatan) : "";
        perbaruiKodeKd();
        isiDaftarKelompokKd();
        sembunyikanGalatKd();
        document.querySelector("#isi-kategori-donasi [data-subtab='kd-umum']").click();   // selalu mulai di tab Umum
    },
    // Hapus ditolak kalau akunnya sudah dipakai (jurnal, Gaji, Penomoran, ...), supaya transaksi lama tidak kehilangan akun.
    // Kalau akunnya hanya dipasang di Preferensi, boleh dihapus: akunnya nanti dikeluarkan dari Preferensi (saatDihapus).
    alasanTolakHapus: function (kategori) {
        var akun = akunKategoriKd(kategori);
        if (!akun) { return ""; }   // data rusak: akunnya sudah tidak ada, kategorinya tetap boleh dihapus
        var tempat = tempatAkunDipakai(akun.kode);
        if (tempat && tempat !== TEMPAT_PREFERENSI_AKUN) {
            return 'Kategori "' + teksAman(kategori.nama) + '" tidak bisa dihapus karena akunnya sudah dipakai di ' + tempat + ".";
        }
        return "";
    },
    // Dipanggil sesudah kategori terhapus: akunnya ikut dihapus dan kodenya dikeluarkan dari Preferensi.
    // Tidak perlu pembatalan seperti saat Simpan: menghapus selalu memperkecil data (tidak bisa melewati batas
    // penyimpanan), dan kalau penyimpanan browser diblokir, langkah pertama (menghapus kategori) sudah gagal lebih dulu.
    saatDihapus: function (kategori) {
        var akun = akunKategoriKd(kategori);
        if (!akun) { return; }
        var sisa = modulAkun.ambil().filter(function (a) { return a.id !== akun.id; });
        if (!modulAkun.simpan(sisa)) { return; }
        catatLog({ tindakan: "Hapus", tipe: "Akun Perkiraan", referensi: akun.kode + " " + akun.nama + " (dari Kategori Donasi)" });
        keluarkanAkunDariPreferensi(akun.kode);
        modulAkun.gambarTabel();
    }
});

// Akun milik sebuah kategori (lewat akunId), atau null kalau akunnya sudah tidak ada
function akunKategoriKd(kategori) {
    return modulAkun.ambil().find(function (a) { return a.id === kategori.akunId; }) || null;
}

pilihIndukKd.addEventListener("change", function () { galatKd.induk.hidden = true; perbaruiKodeKd(); });
kolomNamaKd.addEventListener("input", function () { galatKd.nama.hidden = true; });

function tampilkanGalatKd(nama, pesan, kolomFokus) {
    galatKd[nama].textContent = pesan;
    galatKd[nama].hidden = false;
    document.querySelector("#isi-kategori-donasi [data-subtab='kd-umum']").click();   // semua isian wajib ada di tab Umum
    if (kolomFokus) { kolomFokus.focus(); }
}

// ----- Simpan: Data Baru membuat akun pendapatan otomatis, Ubah memperbarui akunnya (PRD 6.1) -----
// Dua daftar disimpan berurutan (akun dulu, lalu Kategori Donasi). Kalau Kategori Donasi gagal disimpan (misalnya
// penyimpanan browser penuh), daftar akun dikembalikan seperti semula supaya akun dan kategorinya tidak berbeda.
document.getElementById("form-kategori-donasi").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatKd();
    var lama = kategoriKdDiubah();   // null kalau Data Baru
    var nama = kolomNamaKd.value.trim();
    var indukId = pilihIndukKd.value;
    var daftarKd = modulKategoriDonasi.ambil();

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama
    if (nama === "") {
        tampilkanGalatKd("nama", "Nama Donasi wajib diisi.", kolomNamaKd);
        return;
    }
    // Nama tidak boleh sama dengan kategori LAIN (kategori yang sedang diubah sendiri dilewati)
    if (daftarKd.some(function (k) { return (!lama || k.id !== lama.id) && teksAman(k.nama).toLowerCase() === nama.toLowerCase(); })) {
        tampilkanGalatKd("nama", "Nama Donasi sudah dipakai kategori lain.", kolomNamaKd);
        return;
    }
    if (indukId === "") {
        tampilkanGalatKd("induk", "Pilih akun induknya (Sub dari).", pilihIndukKd);
        return;
    }
    // Induk bisa saja sudah tidak boleh dipakai (misalnya dihapus atau dipindah di tab Akun Perkiraan yang lain)
    if (!calonIndukKd().some(function (a) { return a.id === indukId; })) {
        isiPilihanIndukKd("");
        perbaruiKodeKd();
        tampilkanGalatKd("induk", "Akun induk ini sudah tidak bisa dipakai. Pilih ulang.", pilihIndukKd);
        return;
    }
    if (lama) { simpanUbahKd(lama, nama, indukId, daftarKd); } else { simpanBaruKd(nama, indukId, daftarKd); }
});

var pesanKodePenuhKd = "Kode otomatis tidak bisa dibuat (nomor urut di bawah induk ini sudah penuh sampai 99).";

// Satu data Kategori Donasi dari isian formulir (dipakai Data Baru dan Ubah)
function kategoriDariFormKd(id, nama, indukId, akunId, kode) {
    return {
        id: id,
        nama: nama,
        indukId: indukId,
        akunId: akunId,
        kode: kode,
        kelompok: kolomKelompokKd.value.trim(),
        catatan: kolomCatatanKd.value.trim()
    };
}

// Simpan daftar akun (boleh null = tidak berubah) lalu daftar Kategori Donasi. Kalau kategori gagal disimpan,
// daftar akun dikembalikan ke isi awalnya (awalAkun). Hasil: true kalau keduanya berhasil.
function simpanAkunDanKategoriKd(daftarAkun, awalAkun, daftarKd) {
    if (daftarAkun && !modulAkun.simpan(daftarAkun)) { return false; }
    if (!modulKategoriDonasi.simpan(daftarKd)) {
        try { localStorage.setItem("daftarAkun", awalAkun); } catch (galat) { /* biarkan: pesan gagal sudah tampil */ }
        return false;
    }
    return true;
}

// Data Baru: membuat akun pendapatan otomatis, lalu Kategori Donasinya
function simpanBaruKd(nama, indukId, daftarKd) {
    // Kode dihitung ulang saat disimpan (bukan hanya dibaca dari kolom), supaya pasti terbaru
    var kode = buatKodeAkun("pendapatan", indukId, null);
    if (kode === "") {
        tampilkanGalatKd("induk", pesanKodePenuhKd, pilihIndukKd);
        return;
    }
    kolomKodeKd.value = kode;

    var idKategori = buatId("kd");
    var daftarAkun = modulAkun.ambil();
    var awalAkun = JSON.stringify(daftarAkun);
    // Bentuk akun sama dengan akun buatan halaman Akun Perkiraan (fitur/akun/akun.js), ditambah penanda kategoriDonasiId:
    // akun ini milik Kategori Donasi, jadi nanti hanya bisa diubah/dihapus lewat Kategori Donasi (bagian 3).
    var akun = {
        id: buatId("a"),
        kode: kode,
        nama: nama,
        tipe: "pendapatan",
        indukId: indukId,
        catatan: "Dibuat otomatis oleh Kategori Donasi.",
        nonAktif: false,
        namaBank: "", noRekening: "", atasNamaRekening: "",
        saldoAwal: 0,
        tanggalSaldo: tanggalMulaiPembukuan(),
        kategoriDonasiId: idKategori
    };
    var kategori = kategoriDariFormKd(idKategori, nama, indukId, akun.id, kode);

    daftarAkun.push(akun);
    daftarKd.push(kategori);
    if (!simpanAkunDanKategoriKd(daftarAkun, awalAkun, daftarKd)) { return; }
    // Akun baru juga dicatat di Log Aktivitas, supaya terlihat dari mana akun itu datang
    catatLog({ tindakan: "Buat", tipe: "Akun Perkiraan", referensi: kode + " " + nama + " (dari Kategori Donasi)" });
    modulAkun.gambarTabel();
    modulKategoriDonasi.selesaiSimpan(false, kategori, null);   // notifikasi, Log Aktivitas, formulir kosong lagi
    kolomNamaKd.focus();
}

// Ubah: nama akun ikut berganti. Sub dari boleh diganti hanya kalau akunnya belum dipakai (jurnal, Preferensi,
// dan tempat lain di tempatAkunDipakai), karena kode akunnya ikut berganti (keputusan pengguna 2026-10-27).
// Kelompok dan Catatan hanya milik kategori, tidak disalin ke akun.
function simpanUbahKd(lama, nama, indukId, daftarKd) {
    var daftarAkun = modulAkun.ambil();
    var awalAkun = JSON.stringify(daftarAkun);
    var akun = daftarAkun.find(function (a) { return a.id === lama.akunId; });
    if (!akun) {
        // Data rusak: akunnya sudah tidak ada. Ditolak, supaya kategori tidak menunjuk ke akun yang tidak ada.
        tampilkanNotifikasi("Akun donasi untuk kategori ini tidak ditemukan di Akun Perkiraan. Kategori tidak bisa diubah.", "galat");
        return;
    }
    var kode = teksAman(akun.kode);
    if (indukId !== akun.indukId) {
        var tempat = tempatAkunDipakai(akun.kode);
        if (tempat) {
            tampilkanGalatKd("induk", "Sub dari tidak bisa diganti karena kode akunnya ikut berubah dan akun ini sudah dipakai di " + tempat + ".", pilihIndukKd);
            return;
        }
        kode = buatKodeAkun("pendapatan", indukId, akun.id);
        if (kode === "") {
            tampilkanGalatKd("induk", pesanKodePenuhKd, pilihIndukKd);
            return;
        }
    }
    kolomKodeKd.value = kode;
    var akunBerubah = (akun.nama !== nama || akun.indukId !== indukId || akun.kode !== kode);
    akun.nama = nama;
    akun.indukId = indukId;
    akun.kode = kode;

    var kategori = kategoriDariFormKd(lama.id, nama, indukId, akun.id, kode);
    var daftarBaru = daftarKd.map(function (k) { return k.id === lama.id ? kategori : k; });

    // Kalau nama, induk, dan kode akun tetap (hanya Kelompok/Catatan yang diganti), daftar akun tidak perlu disimpan ulang
    if (!simpanAkunDanKategoriKd(akunBerubah ? daftarAkun : null, awalAkun, daftarBaru)) { return; }
    if (akunBerubah) {
        catatLog({ tindakan: "Ubah", tipe: "Akun Perkiraan", referensi: kode + " " + nama + " (dari Kategori Donasi)" });
        modulAkun.gambarTabel();
    }
    modulKategoriDonasi.selesaiSimpan(true, kategori, lama);   // notifikasi, Log Aktivitas (rincian perubahan), kembali ke daftar
}

// Setiap tab dibuka: muat ulang pilihan induk (akun bisa saja baru ditambah di Akun Perkiraan)
saatTabDibuka["kategori-donasi"] = function () {
    isiPilihanIndukKd(pilihIndukKd.value);
    perbaruiKodeKd();
    modulKategoriDonasi.gambarTabel();
};

// Dipanggil dari popup Donasi, kotak Kategori Donasi
function bukaKategoriDonasiBaru() {
    modulKategoriDonasi.bukaDariMenu();
    kolomNamaKd.focus();
}
