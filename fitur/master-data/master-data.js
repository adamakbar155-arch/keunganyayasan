// ==================== Master Data: Divisi, Program, Karyawan, Gaji/Tunjangan ====================
// Berisi: halaman Divisi, Program (bidang di bawah Divisi), Karyawan, dan Gaji/Tunjangan,
// beserta fungsi bacaDivisi, bacaProgram, namaProgramDari, bacaKaryawan, bacaGaji.
// HTML-nya ada di fitur/master-data/tampilan.js; gayanya memakai umum/halaman-daftar.css.
// Dipanggil dari index.html sesudah umum/ (buatModulDaftar dan lain-lain) dan sebelum fitur/akun/akun.js.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- Halaman Divisi ----------
var kolomNamaDivisi = document.getElementById("divisi-nama");
var kolomKetDivisi = document.getElementById("divisi-keterangan");
var galatNamaDivisi = document.getElementById("galat-divisi-nama");

// Nama isian yang dibandingkan di rincian log (tab Pemeriksaan)
var labelDivisi = { nama: "Nama", keterangan: "Keterangan" };

// Membuat seluruh tampilan Data Baru + Daftar Divisi memakai komponen di atas
var modulDivisi = buatModulDaftar({
    id: "divisi",
    judul: "Divisi",
    kunci: "daftarDivisi",
    labelData: labelDivisi,
    kolom: [
        { kunci: "nama", judul: "Nama" },
        { kunci: "keterangan", judul: "Keterangan" }
    ],
    // Isi formulir dari data (mengubah) atau kosongkan (data baru)
    isiForm: function (divisi) {
        kolomNamaDivisi.value = divisi ? divisi.nama : "";
        kolomKetDivisi.value = divisi ? (divisi.keterangan || "") : "";
        galatNamaDivisi.hidden = true;
    },
    // Divisi yang masih punya program tidak boleh dihapus
    alasanTolakHapus: function (divisi) {
        var jumlah = bacaProgram().filter(function (p) { return p.divisiId === divisi.id; }).length;
        var jurnal = jumlahJurnalMemakai("divisiId", divisi.id);
        if (jumlah === 0 && jurnal > 0) { return 'Divisi "' + divisi.nama + '" sudah dipakai di ' + jurnal + ' jurnal.'; }
        if (jumlah > 0) { return 'Divisi "' + divisi.nama + '" masih dipakai oleh ' + jumlah + ' program.'; }
        var anggaran = jumlahAnggaranMemakai("divisi", divisi.id);
        return anggaran > 0 ? 'Divisi "' + divisi.nama + '" sudah dipakai di ' + anggaran + " Anggaran." : "";
    }
});

// Daftar divisi: [{ id, nama, keterangan }]. Dipakai juga oleh Program, Jurnal Umum, dan Pembayaran.
function bacaDivisi() {
    return modulDivisi.ambil();
}

// Dipanggil saat kotak Divisi di Master Data diklik
function bukaDivisiBaru() {
    modulDivisi.bukaDariMenu();
    kolomNamaDivisi.focus();
}

// Kotak Program dan Divisi di popup Master Data hanya tampil kalau fiturnya nyala di Preferensi → Fitur
function perbaruiKotakMaster() {
    document.querySelectorAll("#panel-master .kotak-menu").forEach(function (kotak) {
        var fitur = { "Divisi": "divisi", "Program": "program" }[kotak.dataset.halaman];
        if (fitur) {
            kotak.hidden = !fiturAktif(fitur);
        }
    });
}

// Tombol simpan di formulir
document.getElementById("form-divisi").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    var nama = kolomNamaDivisi.value.trim();
    var daftar = bacaDivisi();

    // Pemeriksaan: nama wajib diisi dan tidak boleh kembar (huruf besar/kecil dianggap sama)
    var pesanGalat = "";
    if (nama === "") {
        pesanGalat = "Nama divisi wajib diisi.";
    } else if (daftar.some(function (d) {
        return d.id !== modulDivisi.idDiubah && teksAman(d.nama).toLowerCase() === nama.toLowerCase();
    })) {
        pesanGalat = "Nama divisi sudah dipakai.";
    }
    if (pesanGalat) {
        galatNamaDivisi.textContent = pesanGalat;
        galatNamaDivisi.hidden = false;
        kolomNamaDivisi.focus();
        return;
    }

    var keterangan = kolomKetDivisi.value.trim();
    var sedangMengubah = (modulDivisi.idDiubah !== null);
    // Salinan data sebelum diubah, untuk dibandingkan di log
    var lamaDivisi = sedangMengubah
        ? Object.assign({}, daftar.find(function (d) { return d.id === modulDivisi.idDiubah; })) : null;
    if (sedangMengubah) {
        daftar.forEach(function (d) {
            if (d.id === modulDivisi.idDiubah) {
                d.nama = nama;
                d.keterangan = keterangan;
            }
        });
    } else {
        daftar.push({ id: buatId("d"), nama: nama, keterangan: keterangan });
    }
    if (modulDivisi.simpan(daftar)) {
        modulDivisi.selesaiSimpan(sedangMengubah, { nama: nama, keterangan: keterangan }, lamaDivisi);
        if (!sedangMengubah) {
            kolomNamaDivisi.focus();   // siap mengisi data berikutnya
        }
    }
});

// Pesan kesalahan hilang begitu pengguna mulai mengetik lagi
kolomNamaDivisi.addEventListener("input", function () { galatNamaDivisi.hidden = true; });

// ---------- Halaman Program ----------
// Satu divisi punya beberapa program (bidang di bawah divisi), dan setiap program milik satu divisi.
// Program bukan penanda dana terikat (PRD 2.3, Keputusan 8a): isian Sifat Dana sudah dihapus. Data lama yang
// masih menyimpan "sifat" dibiarkan apa adanya dan tidak dipakai.
var kolomNamaProgram = document.getElementById("program-nama");
var pilihDivisiProgram = document.getElementById("program-divisi");
var pilihStatusProgram = document.getElementById("program-status");
var kolomKetProgram = document.getElementById("program-keterangan");
var galatProgram = {
    nama: document.getElementById("galat-program-nama"),
    divisi: document.getElementById("galat-program-divisi"),
    status: document.getElementById("galat-program-status")
};
pilihStatusProgram.addEventListener("change", function () { galatProgram.status.hidden = true; });

var labelStatusProgram = { "aktif": "Aktif", "selesai": "Selesai" };

// Nama divisi dari id-nya (kosong kalau divisinya sudah tidak ada)
function namaDivisiDari(idDivisi) {
    var divisi = bacaDivisi().find(function (d) { return d.id === idDivisi; });
    return divisi ? divisi.nama : "";
}

// Isi pilihan divisi dari daftar Divisi terbaru (urut nama), lalu pilih yang sesuai
function isiPilihanDivisi(idTerpilih) {
    var urut = bacaDivisi().sort(function (a, b) { return teksAman(a.nama).localeCompare(teksAman(b.nama), "id"); });
    isiPilihan(pilihDivisiProgram, urut, { kosong: "Pilih divisi...", terpilih: idTerpilih });
}

function sembunyikanGalatProgram() {
    Object.keys(galatProgram).forEach(function (nama) { galatProgram[nama].hidden = true; });
}

function tampilkanGalatProgram(nama, pesan, kolomFokus) {
    galatProgram[nama].textContent = pesan;
    galatProgram[nama].hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

// Nama isian dan cara menampilkan nilainya di rincian log (tab Pemeriksaan)
var labelProgram = { nama: "Nama", divisiId: "Divisi", status: "Status", keterangan: "Keterangan" };
var formatProgram = {
    divisiId: function (id) { return namaDivisiDari(id); },
    status: function (nilai) { return labelStatusProgram[nilai] || nilai; }
};

// Muat ulang pilihan divisi dari data terbaru, tanpa menghilangkan pilihan yang sedang dipakai
function segarkanPilihanDivisi() {
    var pakaiDivisi = fiturAktif("divisi");
    document.getElementById("baris-program-divisi").hidden = !pakaiDivisi;
    isiPilihanDivisi(pilihDivisiProgram.value);
    document.getElementById("petunjuk-program-divisi").hidden = !(pakaiDivisi && bacaDivisi().length === 0);
}

var modulProgram = buatModulDaftar({
    id: "program",
    judul: "Program",
    kunci: "daftarProgram",
    labelData: labelProgram,
    formatData: formatProgram,
    saatTampil: segarkanPilihanDivisi,   // setiap kali berpindah antara formulir dan daftar
    kolom: [
        { kunci: "nama", judul: "Nama" },
        { kunci: "divisi", judul: "Divisi", tampil: function (p) { return namaDivisiDari(p.divisiId); } },
        { kunci: "status", judul: "Status", tampil: function (p) { return labelStatusProgram[p.status] || ""; } },
        { kunci: "keterangan", judul: "Keterangan" }
    ],
    isiForm: function (program) {
        var pakaiDivisi = fiturAktif("divisi");
        document.getElementById("baris-program-divisi").hidden = !pakaiDivisi;
        isiPilihanDivisi(program ? program.divisiId : "");
        document.getElementById("petunjuk-program-divisi").hidden = !(pakaiDivisi && bacaDivisi().length === 0);
        kolomNamaProgram.value = program ? program.nama : "";
        pilihStatusProgram.value = program ? program.status : "";   // Data Baru dibuka kosong (PRD 5.3a)
        kolomKetProgram.value = program ? (program.keterangan || "") : "";
        sembunyikanGalatProgram();
    },
    // Program yang sudah dipakai di jurnal tidak boleh dihapus (riwayat transaksinya akan kehilangan Program).
    // Begitu juga Program yang dipakai Target Donasi (PRD 6.1): targetnya akan kehilangan Program dan tidak bisa dihitung.
    // Target dibaca langsung dari penyimpanan, karena file Target Donasi dimuat SESUDAH file ini.
    alasanTolakHapus: function (program) {
        var jumlah = jumlahJurnalMemakai("programId", program.id);
        if (jumlah > 0) { return 'Program "' + program.nama + '" sudah dipakai di ' + jumlah + ' jurnal.'; }
        var jumlahTarget = bacaDaftarTersimpan("daftarTargetDonasi").filter(function (t) {
            return t && t.programId === program.id;
        }).length;
        if (jumlahTarget > 0) { return 'Program "' + program.nama + '" sudah dipakai di ' + jumlahTarget + " Target Donasi."; }
        var anggaran = jumlahAnggaranMemakai("program", program.id);
        return anggaran > 0 ? 'Program "' + program.nama + '" sudah dipakai di ' + anggaran + " Anggaran." : "";
    }
});

// Setiap kali tab Program dibuka (misalnya setelah menambah divisi di tab Divisi),
// pilihan divisi dan nama divisi di tabel dimuat ulang
saatTabDibuka.program = function () {
    segarkanPilihanDivisi();
    modulProgram.gambarTabel();
};

// Daftar program: [{ id, nama, divisiId, status, keterangan }] (data lama mungkin masih punya "sifat", tidak dipakai). Dipakai juga oleh Jurnal Umum dan Pembayaran.
function bacaProgram() {
    return modulProgram.ambil();
}

// Nama program dari id-nya (kosong kalau tidak ada atau programnya sudah dihapus)
function namaProgramDari(id) {
    if (!id) { return ""; }
    var program = bacaProgram().find(function (p) { return p.id === id; });
    return program ? teksAman(program.nama) : "";
}

// Dipanggil saat kotak Program di Master Data diklik
function bukaProgramBaru() {
    modulProgram.bukaDariMenu();
    kolomNamaProgram.focus();
}

// Tombol simpan di formulir
document.getElementById("form-program").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatProgram();
    var nama = kolomNamaProgram.value.trim();
    var idDivisi = pilihDivisiProgram.value;
    var pakaiDivisi = fiturAktif("divisi");
    var daftar = bacaProgram();

    // Pemeriksaan satu per satu, dari atas ke bawah; berhenti di kesalahan pertama
    if (nama === "") {
        tampilkanGalatProgram("nama", "Nama program wajib diisi.", kolomNamaProgram);
        return;
    }
    if (pakaiDivisi && idDivisi === "") {
        tampilkanGalatProgram("divisi", "Divisi wajib dipilih.", pilihDivisiProgram);
        return;
    }
    // Nama program tidak boleh kembar di dalam divisi yang sama
    var kembar = daftar.some(function (p) {
        return p.id !== modulProgram.idDiubah
            && p.divisiId === (pakaiDivisi ? idDivisi : "")
            && teksAman(p.nama).toLowerCase() === nama.toLowerCase();
    });
    if (kembar) {
        tampilkanGalatProgram("nama", "Nama program sudah dipakai di divisi ini.", kolomNamaProgram);
        return;
    }
    if (!labelStatusProgram[pilihStatusProgram.value]) {
        tampilkanGalatProgram("status", "Status wajib dipilih.", pilihStatusProgram);
        return;
    }

    var data = {
        nama: nama,
        divisiId: pakaiDivisi ? idDivisi : "",
        status: pilihStatusProgram.value,
        keterangan: kolomKetProgram.value.trim()
    };
    var sedangMengubah = (modulProgram.idDiubah !== null);
    var lamaProgram = sedangMengubah
        ? Object.assign({}, daftar.find(function (p) { return p.id === modulProgram.idDiubah; })) : null;
    if (sedangMengubah) {
        daftar.forEach(function (p) {
            if (p.id === modulProgram.idDiubah) {
                Object.assign(p, data);   // timpa nilai lama dengan yang baru
            }
        });
    } else {
        data.id = buatId("p");
        daftar.push(data);
    }
    if (modulProgram.simpan(daftar)) {
        modulProgram.selesaiSimpan(sedangMengubah, data, lamaProgram);
        if (!sedangMengubah) {
            kolomNamaProgram.focus();
        }
    }
});

// Pesan kesalahan hilang begitu pengguna mulai mengubah isian
kolomNamaProgram.addEventListener("input", function () { galatProgram.nama.hidden = true; });
pilihDivisiProgram.addEventListener("change", function () { galatProgram.divisi.hidden = true; });

// ---------- Halaman Karyawan ----------
// Data pribadi, alamat, dan rekening karyawan. Gajinya dicatat di halaman Pencatatan Gaji (fitur/gaji).
var kolomKaryawan = {
    nama: "kar-nama", ktp: "kar-ktp", email: "kar-email", hp: "kar-hp", wa: "kar-wa",
    nomor: "kar-nomor", jabatan: "kar-jabatan", tglMasuk: "kar-tgl-masuk", catatan: "kar-catatan",
    jalan: "kar-jalan", kota: "kar-kota", kodePos: "kar-kodepos", provinsi: "kar-provinsi",
    bank: "kar-bank", noRek: "kar-norek", atasNama: "kar-atasnama"
};
var galatKaryawan = {
    nama: document.getElementById("galat-kar-nama"),
    nomor: document.getElementById("galat-kar-nomor"),
    email: document.getElementById("galat-kar-email")
};

function sembunyikanGalatKaryawan() {
    Object.keys(galatKaryawan).forEach(function (nama) { galatKaryawan[nama].hidden = true; });
}

// Tampilkan kesalahan: pindah dulu ke tab Karyawan (tempat kolom itu berada), lalu fokus ke kolomnya
function tampilkanGalatKaryawan(nama, pesan, idKolom) {
    document.querySelector("#isi-karyawan [data-subtab='kar-data']").click();
    galatKaryawan[nama].textContent = pesan;
    galatKaryawan[nama].hidden = false;
    document.getElementById(idKolom).focus();
}

function perbaruiTanggalMasukTeks() {
    document.getElementById("kar-tgl-teks").textContent =
        formatTanggal(document.getElementById(kolomKaryawan.tglMasuk).value);
}
document.getElementById(kolomKaryawan.tglMasuk).addEventListener("change", perbaruiTanggalMasukTeks);

// Nama isian dan cara menampilkan nilainya di rincian log (tab Pemeriksaan)
var labelKaryawan = {
    nama: "Nama Lengkap", ktp: "No. KTP", email: "Email", hp: "Handphone", wa: "No. WhatsApp",
    nomor: "Nomor Pegawai", jabatan: "Posisi Jabatan", tglMasuk: "Tgl Masuk", catatan: "Catatan",
    jalan: "Alamat", kota: "Kota", kodePos: "Kode Pos", provinsi: "Provinsi",
    bank: "Nama Bank", noRek: "No Rekening", atasNama: "Atas Nama Rekening"
};
var formatKaryawan = { tglMasuk: function (tanggal) { return formatTanggal(tanggal); } };

var modulKaryawan = buatModulDaftar({
    id: "karyawan",
    judul: "Karyawan",
    kunci: "daftarKaryawan",
    labelData: labelKaryawan,
    formatData: formatKaryawan,
    kolom: [
        { kunci: "nomor", judul: "Nomor Pegawai" },
        { kunci: "nama", judul: "Nama" },
        { kunci: "jabatan", judul: "Jabatan" },
        { kunci: "hp", judul: "Handphone" }
    ],
    isiForm: function (karyawan) {
        Object.keys(kolomKaryawan).forEach(function (nama) {
            document.getElementById(kolomKaryawan[nama]).value = karyawan ? teksAman(karyawan[nama]) : "";
        });
        // Karyawan baru: Tgl Masuk dibiarkan kosong (PRD 5.3a); boleh tidak diisi
        // Pembatasan: kalau "tanggal yang belum berlangsung tidak bisa dipilih" nyala, hari ke depan tidak bisa dipilih.
        // Tanggal masuk boleh sebelum tanggal mulai pembukuan (bukan tanggal transaksi).
        aturBatasTanggal(document.getElementById(kolomKaryawan.tglMasuk), { tanpaBatasBawah: true });
        perbaruiTanggalMasukTeks();
        sembunyikanGalatKaryawan();
    },
    // Karyawan yang sudah tercatat di Pencatatan Gaji tidak boleh dihapus (riwayat gajinya merujuk ke karyawan ini)
    alasanTolakHapus: function (karyawan) {
        var jumlah = jumlahGajiMemakaiKaryawan(karyawan.id);
        return jumlah > 0 ? 'Karyawan "' + karyawan.nama + '" sudah tercatat di ' + jumlah + ' pencatatan gaji.' : "";
    }
});

// Berapa Pencatatan Gaji yang memuat karyawan ini. Dibaca langsung dari penyimpanan, karena halaman
// Pencatatan Gaji (fitur/gaji) dimuat sesudah file ini.
function jumlahGajiMemakaiKaryawan(idKaryawan) {
    return bacaDaftarTersimpan("daftarPencatatanGaji").filter(function (g) {
        return rincianAman(g).some(function (b) { return b.karyawanId === idKaryawan; });
    }).length;
}

// Daftar karyawan. Dipakai juga oleh Pencatatan Gaji (pencarian karyawan).
function bacaKaryawan() {
    return modulKaryawan.ambil();
}

// Dipanggil saat kotak Karyawan di Master Data diklik
function bukaKaryawanBaru() {
    modulKaryawan.bukaDariMenu();
    document.getElementById(kolomKaryawan.nama).focus();
}

// Tombol simpan di formulir
document.getElementById("form-karyawan").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatKaryawan();

    var data = {};
    Object.keys(kolomKaryawan).forEach(function (nama) {
        data[nama] = document.getElementById(kolomKaryawan[nama]).value.trim();
    });
    var daftar = bacaKaryawan();

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama
    if (data.nama === "") {
        tampilkanGalatKaryawan("nama", "Nama lengkap wajib diisi.", kolomKaryawan.nama);
        return;
    }
    if (data.nomor === "") {
        tampilkanGalatKaryawan("nomor", "Nomor pegawai wajib diisi.", kolomKaryawan.nomor);
        return;
    }
    var nomorKembar = daftar.some(function (k) {
        return k.id !== modulKaryawan.idDiubah && teksAman(k.nomor).toLowerCase() === data.nomor.toLowerCase();
    });
    if (nomorKembar) {
        tampilkanGalatKaryawan("nomor", "Nomor pegawai sudah dipakai.", kolomKaryawan.nomor);
        return;
    }
    // Pemeriksaan email sederhana: harus ada tanda @ dan titik setelahnya (kalau diisi)
    if (data.email !== "" && !/^\S+@\S+\.\S+$/.test(data.email)) {
        tampilkanGalatKaryawan("email", "Format email tidak benar.", kolomKaryawan.email);
        return;
    }

    var sedangMengubah = (modulKaryawan.idDiubah !== null);
    var lamaKaryawan = sedangMengubah
        ? Object.assign({}, daftar.find(function (k) { return k.id === modulKaryawan.idDiubah; })) : null;
    if (sedangMengubah) {
        daftar.forEach(function (k) {
            if (k.id === modulKaryawan.idDiubah) {
                Object.assign(k, data);   // timpa nilai lama dengan yang baru
            }
        });
    } else {
        data.id = buatId("k");
        daftar.push(data);
    }
    if (modulKaryawan.simpan(daftar)) {
        modulKaryawan.selesaiSimpan(sedangMengubah, data, lamaKaryawan);
        document.querySelector("#isi-karyawan [data-subtab='kar-data']").click();   // kembali ke tab pertama
        if (!sedangMengubah) {
            document.getElementById(kolomKaryawan.nama).focus();
        }
    }
});

// Pesan kesalahan hilang begitu pengguna mulai mengubah isian
document.getElementById(kolomKaryawan.nama).addEventListener("input", function () { galatKaryawan.nama.hidden = true; });
document.getElementById(kolomKaryawan.nomor).addEventListener("input", function () { galatKaryawan.nomor.hidden = true; });
document.getElementById(kolomKaryawan.email).addEventListener("input", function () { galatKaryawan.email.hidden = true; });

// ---------- Halaman Gaji/Tunjangan ----------
// Daftar jenis komponen gaji beserta akun bebannya. Catatan: Pencatatan Gaji (fitur/gaji) memakai komponen tetap
// seperti Accurate dan belum memakai daftar ini; nasib halaman ini diputuskan di PLAN.md (tugas H.7).
var tipeGaji = {
    "gaji-pokok":            { label: "Gaji Pokok",                    arah: "Bayar",  periode: "Bulanan" },
    "tunjangan-tetap":       { label: "Tunjangan Tetap",               arah: "Bayar",  periode: "Bulanan" },
    "tunjangan-tidak-tetap": { label: "Tunjangan Tidak Tetap",         arah: "Bayar",  periode: "Bulanan" },
    "lembur-insentif":       { label: "Lembur dan Insentif",           arah: "Bayar",  periode: "Sewaktu-waktu" },
    "bonus-thr":             { label: "Bonus dan THR",                 arah: "Bayar",  periode: "Sewaktu-waktu" },
    "potongan-iuran":        { label: "Potongan Iuran",                arah: "Potong", periode: "Bulanan" },
    "potongan-cicilan":      { label: "Potongan Cicilan atau Kasbon",  arah: "Potong", periode: "Bulanan" }
};

var kolomNamaGaji = document.getElementById("gaji-nama");
var pilihTipeGaji = document.getElementById("gaji-tipe");
var kolomBayarPotong = document.getElementById("gaji-bayar-potong");
var pilihAkunGaji = document.getElementById("gaji-akun");
var kotakNonAktifGaji = document.getElementById("gaji-nonaktif");
var galatGaji = {
    nama: document.getElementById("galat-gaji-nama"),
    tipe: document.getElementById("galat-gaji-tipe"),
    akun: document.getElementById("galat-gaji-akun")
};

// Isi pilihan tipe dari tabel tipeGaji (sekali saja, daftarnya tetap). Data Baru mulai dari "Silakan Pilih" (PRD 5.3a).
isiPilihan(pilihTipeGaji, Object.keys(tipeGaji), {
    nilai: function (kunci) { return kunci; },
    teks: function (kunci) { return tipeGaji[kunci].label; },
    kosong: "Silakan Pilih"
});

// Kolom "Bayar/Potong" ikut berubah mengikuti tipe yang dipilih, misalnya "Bayar - Bulanan"
function perbaruiBayarPotong() {
    var tipe = tipeGaji[pilihTipeGaji.value];
    kolomBayarPotong.value = tipe ? tipe.arah + " - " + tipe.periode : "";
}
pilihTipeGaji.addEventListener("change", function () {
    perbaruiBayarPotong();
    galatGaji.tipe.hidden = true;
});

function teksAkunDari(kode) {
    var akun = bacaDaftarAkun().find(function (a) { return a.kode === kode; });
    return akun ? teksAkun(akun) : teksAman(kode);   // akun sudah dihapus: tetap tampilkan kodenya
}

// Isi pilihan Akun Beban dari Daftar Akun terbaru (urut kode), lalu pilih yang sesuai. Nilai pilihan = KODE akun.
// Kalau belum ada akun Beban sama sekali, kolom ini tidak wajib (ada petunjuk, dan bintang merah disembunyikan).
function isiPilihanAkunGaji(kodeTerpilih) {
    var semuaAkun = bacaAkunBeban().sort(function (a, b) {
        return teksAman(a.kode).localeCompare(teksAman(b.kode), "id", { numeric: true });
    });
    var jumlah = isiPilihan(pilihAkunGaji, semuaAkun, {
        nilai: function (a) { return a.kode; },
        teks: teksAkun,
        kosong: "Cari/Pilih Akun Perkiraan...",
        kosongKalauTakAda: "Belum ada akun Beban",
        terpilih: kodeTerpilih,
        nonaktifKalauKosong: true,
        petunjuk: document.getElementById("petunjuk-gaji-akun")
    });
    document.getElementById("tanda-wajib-akun").hidden = (jumlah === 0);   // bintang merah hanya kalau wajib
}
function sembunyikanGalatGaji() {
    Object.keys(galatGaji).forEach(function (nama) { galatGaji[nama].hidden = true; });
}

function tampilkanGalatGaji(nama, pesan, kolomFokus) {
    galatGaji[nama].textContent = pesan;
    galatGaji[nama].hidden = false;
    kolomFokus.focus();
}

// Nama isian dan cara menampilkan nilainya di rincian log (tab Pemeriksaan)
var labelGaji = { nama: "Nama", tipe: "Tipe Gaji/Tunjangan", akunBeban: "Akun Beban", nonAktif: "Non Aktif" };
var formatGaji = {
    tipe: function (nilai) { return tipeGaji[nilai] ? tipeGaji[nilai].label : nilai; },
    akunBeban: function (kode) { return kode ? teksAkunDari(kode) : ""; },
    nonAktif: function (nilai) { return nilai ? "Ya" : "Tidak"; }
};

var modulGaji = buatModulDaftar({
    id: "gaji",
    judul: "Gaji/Tunjangan",
    kunci: "daftarGaji",
    labelData: labelGaji,
    formatData: formatGaji,
    // Akun bisa saja baru ditambah di Daftar Akun, jadi pilihan dimuat ulang tiap berpindah tampilan
    saatTampil: function () { isiPilihanAkunGaji(pilihAkunGaji.value); },
    kolom: [
        { kunci: "nama", judul: "Nama" },
        { kunci: "tipe", judul: "Tipe Gaji/Tunjangan", tampil: function (g) { return tipeGaji[g.tipe] ? tipeGaji[g.tipe].label : ""; } },
        { kunci: "bayarPotong", judul: "Bayar/Potong", tampil: function (g) { return tipeGaji[g.tipe] ? tipeGaji[g.tipe].arah : ""; } },
        { kunci: "akun", judul: "Akun Beban", tampil: function (g) { return g.akunBeban ? teksAkunDari(g.akunBeban) : ""; } },
        { kunci: "nonAktif", judul: "Non Aktif", tampil: function (g) { return g.nonAktif ? "Ya" : "Tidak"; } }
    ],
    isiForm: function (gaji) {
        kolomNamaGaji.value = gaji ? gaji.nama : "";
        pilihTipeGaji.value = gaji ? gaji.tipe : "";
        perbaruiBayarPotong();
        isiPilihanAkunGaji(gaji ? gaji.akunBeban : "");
        kotakNonAktifGaji.checked = gaji ? !!gaji.nonAktif : false;
        sembunyikanGalatGaji();
    }
});

// Daftar komponen gaji/tunjangan (dipakai juga oleh tempatAkunDipakai di fitur/akun).
function bacaGaji() {
    return modulGaji.ambil();
}

saatTabDibuka.gaji = function () {
    isiPilihanAkunGaji(pilihAkunGaji.value);
    modulGaji.gambarTabel();
};

// Dipanggil saat kotak Gaji/Tunjangan di Master Data diklik
function bukaGajiBaru() {
    modulGaji.bukaDariMenu();
    kolomNamaGaji.focus();
}

// Tombol simpan di formulir
document.getElementById("form-gaji").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatGaji();
    var nama = kolomNamaGaji.value.trim();
    var daftar = bacaGaji();
    var adaAkun = bacaAkunBeban().length > 0;   // wajib hanya kalau sudah ada akun bertipe Beban

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama
    if (nama === "") {
        tampilkanGalatGaji("nama", "Nama wajib diisi.", kolomNamaGaji);
        return;
    }
    var kembar = daftar.some(function (g) {
        return g.id !== modulGaji.idDiubah && teksAman(g.nama).toLowerCase() === nama.toLowerCase();
    });
    if (kembar) {
        tampilkanGalatGaji("nama", "Nama sudah dipakai.", kolomNamaGaji);
        return;
    }
    if (pilihTipeGaji.value === "") {
        tampilkanGalatGaji("tipe", "Tipe Gaji/Tunjangan wajib dipilih.", pilihTipeGaji);
        return;
    }
    // Akun Beban wajib hanya kalau Daftar Akun sudah punya akun
    if (adaAkun && pilihAkunGaji.value === "") {
        tampilkanGalatGaji("akun", "Akun beban wajib dipilih.", pilihAkunGaji);
        return;
    }

    var data = {
        nama: nama,
        tipe: pilihTipeGaji.value,
        akunBeban: pilihAkunGaji.value,
        nonAktif: kotakNonAktifGaji.checked
    };
    var sedangMengubah = (modulGaji.idDiubah !== null);
    var lamaGaji = sedangMengubah
        ? Object.assign({}, daftar.find(function (g) { return g.id === modulGaji.idDiubah; })) : null;
    if (sedangMengubah) {
        daftar.forEach(function (g) {
            if (g.id === modulGaji.idDiubah) {
                Object.assign(g, data);   // timpa nilai lama dengan yang baru
            }
        });
    } else {
        data.id = buatId("g");
        daftar.push(data);
    }
    if (modulGaji.simpan(daftar)) {
        modulGaji.selesaiSimpan(sedangMengubah, data, lamaGaji);
        if (!sedangMengubah) {
            kolomNamaGaji.focus();
        }
    }
});

// Pesan kesalahan hilang begitu pengguna mulai mengubah isian
kolomNamaGaji.addEventListener("input", function () { galatGaji.nama.hidden = true; });
pilihAkunGaji.addEventListener("change", function () { galatGaji.akun.hidden = true; });
