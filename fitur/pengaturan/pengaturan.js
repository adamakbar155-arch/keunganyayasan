// ==================== Pengaturan: Log Aktivitas, Pengguna, Penomoran ====================
// Berisi: Log Aktivitas (catatLog, waktuSekarang, penggunaAktif), halaman Pengguna (peran, kata sandi PBKDF2),
// dan halaman Penomoran (aturan nomor otomatis: formatNomor, nomorBerikutnya, intipNomorBerikutnya, bacaPenomoran).
// HTML-nya ada di fitur/pengaturan/tampilan.js. Dipanggil dari index.html sesudah fitur/kas-bank/kas-bank.js.
// Fungsi di sini dipakai halaman lain saat dijalankan (bukan saat dimuat).
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- Log Aktivitas ----------
// Catatan siapa melakukan apa dan kapan. Terisi otomatis setiap kali data dibuat, diubah, atau dihapus.
// Penting karena Finance Yayasan berhak penuh: apa pun yang diubah tetap bisa ditelusuri.
var KUNCI_LOG = "logAktivitas";
var BATAS_LOG = 2000;   // paling banyak 2000 catatan terakhir, supaya penyimpanan browser tidak penuh
// Sementara belum ada login, semua aktivitas ditulis atas nama "Pengguna". Nanti diganti nama dari login.
// Nama pengguna yang sedang masuk (sesi, umum/sesi.js); dipakai Log Aktivitas dan "Dibuat oleh"
var penggunaAktif = (bacaSesi() && teksAman(bacaSesi().nama)) || "Pengguna";

// Waktu sekarang dalam bentuk "2026-10-22T09:40:37" (sesuai jam di komputer pengguna)
function waktuSekarang() {
    var sekarang = new Date();
    function dua(angka) { return String(angka).padStart(2, "0"); }
    return tanggalHariIni() + "T" + dua(sekarang.getHours()) + ":" + dua(sekarang.getMinutes()) + ":" + dua(sekarang.getSeconds());
}

// Catat satu aktivitas. Contoh: catatLog({ tindakan: "Buat", tipe: "Divisi", referensi: "Pendidikan" })
// tindakan: "Buat", "Ubah", atau "Hapus"
function catatLog(info) {
    try {
        // Isi rusak (bukan daftar) dibaca sebagai daftar kosong, supaya catatan berikutnya tidak gagal diam-diam selamanya
        var daftar = bacaDaftarTersimpan(KUNCI_LOG);
        daftar.push({
            id: buatId("l"),
            waktu: waktuSekarang(),
            tindakan: info.tindakan,
            tipe: info.tipe,
            referensi: info.referensi || "-",
            rincian: info.rincian || null,   // daftar perubahan isian (lihat buatRincian), kalau ada
            pengguna: penggunaAktif
        });
        if (daftar.length > BATAS_LOG) {
            daftar = daftar.slice(daftar.length - BATAS_LOG);   // buang yang paling lama
        }
        localStorage.setItem(KUNCI_LOG, JSON.stringify(daftar));
    } catch (galat) {
        // Pencatatan log tidak boleh mengganggu pekerjaan utama, jadi kegagalan diabaikan
    }
}

// Menyusun daftar perubahan isian untuk tab "Pemeriksaan" di rincian log.
//   lama     : data sebelum diubah (null kalau data baru)
//   baru     : data sesudah diubah (null kalau data dihapus)
//   label    : { kunciIsian: "Nama yang tampil" }, hanya isian ini yang dibandingkan
//   pemformat: (opsional) { kunciIsian: fungsi } untuk mengubah nilai menjadi teks yang enak dibaca
// Isian yang tidak berubah tidak dimasukkan. Hasil: [{ label, lama, baru }]
function buatRincian(lama, baru, label, pemformat) {
    function teks(kunci, nilai) {
        if (nilai === undefined || nilai === null) { return ""; }
        return (pemformat && pemformat[kunci]) ? String(pemformat[kunci](nilai)) : String(nilai);
    }
    var hasil = [];
    Object.keys(label).forEach(function (kunci) {
        var teksLama = lama ? teks(kunci, lama[kunci]) : "";
        var teksBaru = baru ? teks(kunci, baru[kunci]) : "";
        if (teksLama === teksBaru) { return; }   // tidak berubah (atau sama-sama kosong)
        hasil.push({ label: label[kunci], lama: teksLama, baru: teksBaru });
    });
    return hasil;
}

// Waktu log "2026-10-22T09:40:37" -> "22 Okt 2026 09:40:37" (data rusak tanpa waktu menjadi kosong)
function teksWaktuLog(waktu) {
    var w = teksAman(waktu);
    return w ? (formatTanggal(w.slice(0, 10)) + " " + w.slice(11)).trim() : "";
}

// Halaman daftar saja (tanpa formulir), terbaru di atas, dengan empat filter
var modulLog = buatModulDaftar({
    id: "log",
    judul: "Log Aktivitas",
    kunci: KUNCI_LOG,
    hanyaDaftar: true,
    // Klik satu baris membuka rincian hanya-baca: tab Umum dan tab Pemeriksaan (apa yang berubah)
    detail: function (log) {
        var rincian = Array.isArray(log.rincian) ? log.rincian : [];
        return {
            judul: teksAman(log.referensi),
            tab: [
                {
                    nama: "Umum",
                    baris: [
                        { label: "Pengguna", nilai: log.pengguna },
                        { label: "Jenis Data", nilai: log.tipe },
                        { label: "Nama Referensi", nilai: log.referensi },
                        { label: "Tipe Tindakan", nilai: log.tindakan },
                        { label: "Tanggal/Jam", nilai: teksWaktuLog(log.waktu) }
                    ]
                },
                {
                    nama: "Pemeriksaan",
                    tabel: {
                        kolom: ["Isian", "Nilai Lama", "Nilai Baru"],
                        baris: rincian.map(function (r) { return [r.label, r.lama || "-", r.baru || "-"]; }),
                        kosong: log.rincian
                            ? "Tidak ada perubahan isian."
                            : "Rincian perubahan tidak tercatat untuk aktivitas ini."
                    }
                }
            ]
        };
    },
    urutAwal: { kolom: "waktu", arah: -1 },
    pesanKosong: "Belum ada aktivitas yang tercatat.",
    kolom: [
        { kunci: "referensi", judul: "Nama Referensi" },
        { kunci: "tindakan", judul: "Tipe Tindakan" },
        { kunci: "tipe", judul: "Jenis Data" },
        {
            kunci: "waktu", judul: "Tanggal",
            tampil: function (l) { return teksWaktuLog(l.waktu); },
            // Urut menurut waktu sebenarnya, bukan teks yang tampil. Id (yang memuat milidetik) menjadi
            // pembeda kalau dua aktivitas tercatat dalam detik yang sama.
            urut: function (l) { return teksAman(l.waktu) + "|" + teksAman(l.id); }
        },
        { kunci: "pengguna", judul: "Pengguna" }
    ],
    filter: [
        { judul: "Tanggal", ambil: function (l) { return teksAman(l.waktu).slice(0, 10); }, tampil: function (nilai) { return formatTanggal(nilai); }, turun: true },
        { judul: "Jenis Data", ambil: function (l) { return l.tipe; } },
        { judul: "Pengguna", ambil: function (l) { return l.pengguna; } },
        { judul: "Tipe Tindakan", ambil: function (l) { return l.tindakan; } }
    ]
});

// Data log berubah di halaman lain, jadi muat ulang setiap kali tab ini dibuka
saatTabDibuka.log = function () { modulLog.gambarTabel(); };

function bukaLog() {
    bukaTab("log");
}

// ---------- Halaman Pengguna ----------
// Data pengguna tersimpan di browser; login (login.html, PRD 6.12) adalah kunci layar, bukan pengaman penuh sampai tahap server.
// Kata sandi tidak disimpan apa adanya, melainkan diacak (PBKDF2-SHA256 dengan garam acak, umum/sandi.js).
// (Nama variabel sengaja berbeda dari "daftarPembukuan" milik pilihan pembukuan di bar atas)
var semuaPembukuan = [
    { kunci: "yayasan", label: "Yayasan" },
    { kunci: "sekolah", label: "Sekolah" },
    { kunci: "unit-usaha", label: "Unit usaha" }
];
var kolomPengguna = {
    nama: "pg-nama", username: "pg-username", kontak: "pg-kontak"
};
var kolomSandiPengguna = document.getElementById("pg-sandi");
var pilihPeranPengguna = document.getElementById("pg-peran");

// Empat peran tetap (hak tiap peran sesuai keputusan, tanpa tabel hak akses).
// "pembukuan" = pembukuan yang otomatis boleh dibuka oleh peran itu.
var peranPengguna = {
    "finance-yayasan": {
        label: "Finance Yayasan",
        pembukuan: ["yayasan", "sekolah", "unit-usaha"],
        keterangan: "Hak penuh atas ketiga pembukuan, termasuk mengelola pengguna."
    },
    "finance-sekolah": {
        label: "Finance Sekolah",
        pembukuan: ["sekolah"],
        keterangan: "Mencatat dan melihat hanya di pembukuan Sekolah."
    },
    "finance-unit-usaha": {
        label: "Finance Unit usaha",
        pembukuan: ["unit-usaha"],
        keterangan: "Mencatat dan melihat hanya di pembukuan Unit usaha."
    },
    "pengawas": {
        label: "Pengawas",
        pembukuan: ["yayasan", "sekolah", "unit-usaha"],
        keterangan: "Melihat ketiga pembukuan dan memberi catatan pengawasan. Tidak mengubah data."
    }
};

// Isi pilihan peran dari tabel di atas (sekali saja, daftarnya tetap)
isiPilihan(pilihPeranPengguna, Object.keys(peranPengguna), {
    nilai: function (kunci) { return kunci; },
    teks: function (kunci) { return peranPengguna[kunci].label; },
    kosong: "Pilih peran..."
});
var kotakPembukuanPengguna = document.querySelectorAll("input[name='pg-pembukuan']");
var kotakNonAktifPengguna = document.getElementById("pg-nonaktif");
var galatPengguna = {
    nama: document.getElementById("galat-pg-nama"),
    username: document.getElementById("galat-pg-username"),
    kontak: document.getElementById("galat-pg-kontak"),
    sandi: document.getElementById("galat-pg-sandi"),
    peran: document.getElementById("galat-pg-peran"),
    pembukuan: document.getElementById("galat-pg-pembukuan")
};

function namaPembukuanDari(daftarKunci) {
    return (daftarKunci || []).map(function (kunci) {
        var pembukuan = semuaPembukuan.find(function (p) { return p.kunci === kunci; });
        return pembukuan ? pembukuan.label : kunci;
    }).join(", ");
}

// Mengacak kata sandi: alat bersama umum/sandi.js (acakKataSandi), dipakai juga layar Masuk.

function sembunyikanGalatPengguna() {
    Object.keys(galatPengguna).forEach(function (nama) { galatPengguna[nama].hidden = true; });
}

function tampilkanGalatPengguna(nama, pesan, kolomFokus) {
    galatPengguna[nama].textContent = pesan;
    galatPengguna[nama].hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

// Menerapkan peran yang dipilih: centang pembukuan diatur otomatis dan dikunci, supaya tidak
// ada pengguna dengan pembukuan yang bertentangan dengan perannya. Tanpa peran, centang bebas.
function terapkanPeran() {
    var peran = peranPengguna[pilihPeranPengguna.value];
    kotakPembukuanPengguna.forEach(function (kotak) {
        if (peran) {
            kotak.checked = peran.pembukuan.indexOf(kotak.value) !== -1;
        }
        kotak.disabled = !!peran;
    });
    document.getElementById("petunjuk-pg-peran").textContent = peran
        ? peran.keterangan
        : "Peran menentukan pembukuan yang boleh dibuka dan apa yang boleh dilakukan.";
}
pilihPeranPengguna.addEventListener("change", function () {
    galatPengguna.peran.hidden = true;
    terapkanPeran();
});

// Label dan petunjuk kolom kata sandi berbeda saat menambah dan saat mengubah
function aturKolomSandi(sedangMengubah) {
    document.getElementById("label-pg-sandi").textContent = sedangMengubah ? "Atur Ulang Kata Sandi" : "Kata Sandi Awal";
    document.getElementById("tanda-wajib-pg-sandi").hidden = sedangMengubah;
    document.getElementById("petunjuk-pg-sandi").textContent = sedangMengubah
        ? "Kosongkan kalau kata sandi tidak diganti. Kalau diisi, pengguna wajib menggantinya lagi saat masuk."
        : "Kata sandi sementara. Pengguna wajib menggantinya saat pertama masuk.";
}

// Nama isian dan cara menampilkan nilainya di rincian log. Kata sandi sengaja tidak masuk;
// yang dicatat hanya KAPAN terakhir diatur.
var labelPengguna = {
    nama: "Nama Lengkap", username: "Nama Pengguna", kontak: "Email/No Handphone",
    peran: "Peran", pembukuan: "Pembukuan", nonAktif: "Non Aktif", sandiDiatur: "Kata Sandi Terakhir Diatur"
};
var formatPengguna = {
    peran: function (kunci) { return peranPengguna[kunci] ? peranPengguna[kunci].label : kunci; },
    pembukuan: function (daftarKunci) { return namaPembukuanDari(daftarKunci); },
    nonAktif: function (nilai) { return nilai ? "Ya" : "Tidak"; },
    sandiDiatur: function (waktu) { return teksWaktuLog(waktu); }
};

var modulPengguna = buatModulDaftar({
    id: "pengguna",
    judul: "Pengguna",
    kunci: "daftarPengguna",
    labelData: labelPengguna,
    formatData: formatPengguna,
    kolom: [
        { kunci: "nama", judul: "Nama" },
        { kunci: "username", judul: "Nama Pengguna" },
        { kunci: "kontak", judul: "Email/No Handphone" },
        { kunci: "peran", judul: "Peran", tampil: function (p) { return peranPengguna[p.peran] ? peranPengguna[p.peran].label : ""; } },
        { kunci: "pembukuan", judul: "Pembukuan", tampil: function (p) { return namaPembukuanDari(p.pembukuan); } },
        { kunci: "nonAktif", judul: "Non Aktif", tampil: function (p) { return p.nonAktif ? "Ya" : "Tidak"; } }
    ],
    // Pengaman akun (PRD 6.12): akun sendiri dan Finance Yayasan aktif terakhir tidak bisa dihapus
    alasanTolakHapus: function (p) {
        var s = bacaSesi();
        if (s && p.id === s.penggunaId) { return "Akun yang sedang Anda pakai tidak bisa dihapus."; }
        if (!adaFinanceYayasanAktif(bacaPengguna().filter(function (x) { return x.id !== p.id; }))) { return "Harus ada minimal satu Finance Yayasan yang aktif, jadi akun ini tidak bisa dihapus."; }
        return "";
    },
    isiForm: function (pengguna) {
        Object.keys(kolomPengguna).forEach(function (nama) {
            document.getElementById(kolomPengguna[nama]).value = pengguna ? teksAman(pengguna[nama]) : "";
        });
        kolomSandiPengguna.value = "";   // kata sandi tidak pernah ditampilkan kembali
        aturKolomSandi(!!pengguna);
        pilihPeranPengguna.value = pengguna ? (pengguna.peran || "") : "";
        kotakPembukuanPengguna.forEach(function (kotak) {
            kotak.checked = !!pengguna && Array.isArray(pengguna.pembukuan) && pengguna.pembukuan.indexOf(kotak.value) !== -1;
        });
        terapkanPeran();   // peran yang dipilih mengatur dan mengunci centang pembukuan
        kotakNonAktifPengguna.checked = pengguna ? !!pengguna.nonAktif : false;
        sembunyikanGalatPengguna();
    }
});

// Apakah di daftar ini masih ada Finance Yayasan yang aktif (PRD 6.12)
function adaFinanceYayasanAktif(daftar) {
    return daftar.some(function (p) { return p && p.peran === "finance-yayasan" && !p.nonAktif; });
}

// Daftar pengguna (layar Masuk membaca data yang sama lewat umum/sesi.js)
function bacaPengguna() {
    return modulPengguna.ambil();
}

// Dipanggil saat kotak Pengguna di Pengaturan diklik
function bukaPenggunaBaru() {
    modulPengguna.bukaDariMenu();
    document.getElementById(kolomPengguna.nama).focus();
}

// Tombol simpan di formulir. Fungsi ini "async" karena pengacakan kata sandi butuh waktu sebentar.
// Selama kata sandi diacak (sekitar satu detik), simpan berikutnya diabaikan, supaya tidak tercipta pengguna kembar
// kalau tombol Simpan ditekan dua kali.
var sedangMenyimpanPengguna = false;
document.getElementById("form-pengguna").addEventListener("submit", async function (kejadian) {
    kejadian.preventDefault();
    if (sedangMenyimpanPengguna) { return; }
    sembunyikanGalatPengguna();

    var data = {};
    Object.keys(kolomPengguna).forEach(function (nama) {
        data[nama] = document.getElementById(kolomPengguna[nama]).value.trim();
    });
    var sandi = kolomSandiPengguna.value;   // kata sandi sengaja tidak di-trim: spasi boleh jadi bagian sandi
    var daftar = bacaPengguna();
    var sedangMengubah = (modulPengguna.idDiubah !== null);
    var pembukuan = Array.from(kotakPembukuanPengguna).filter(function (k) { return k.checked; }).map(function (k) { return k.value; });

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama
    if (data.nama === "") {
        tampilkanGalatPengguna("nama", "Nama lengkap wajib diisi.", document.getElementById(kolomPengguna.nama));
        return;
    }
    if (data.username === "") {
        tampilkanGalatPengguna("username", "Nama pengguna wajib diisi.", document.getElementById(kolomPengguna.username));
        return;
    }
    if (daftar.some(function (p) { return p.id !== modulPengguna.idDiubah && teksAman(p.username).toLowerCase() === data.username.toLowerCase(); })) {
        tampilkanGalatPengguna("username", "Nama pengguna sudah dipakai.", document.getElementById(kolomPengguna.username));
        return;
    }
    // Email/No Handphone tidak wajib. Kalau kosong, pemeriksaan bentuk dan pemeriksaan kembar dilewati.
    // Kalau diisi dan memuat tanda @ dianggap email; selain itu dianggap nomor handphone.
    if (data.kontak === "") {
        // dilewati
    } else if (data.kontak.indexOf("@") !== -1) {
        if (!/^\S+@\S+\.\S+$/.test(data.kontak)) {
            tampilkanGalatPengguna("kontak", "Format email tidak benar.", document.getElementById(kolomPengguna.kontak));
            return;
        }
    } else if (data.kontak.replace(/[\s-]/g, "").replace(/^\+/, "").search(/^\d{8,15}$/) === -1) {
        tampilkanGalatPengguna("kontak", "Nomor handphone tidak benar. Isi 8 sampai 15 angka.", document.getElementById(kolomPengguna.kontak));
        return;
    }
    var kontakBaku = data.kontak.toLowerCase();
    if (data.kontak !== "" && daftar.some(function (p) { return p.id !== modulPengguna.idDiubah && teksAman(p.kontak).toLowerCase() === kontakBaku; })) {
        tampilkanGalatPengguna("kontak", "Email atau nomor handphone sudah dipakai pengguna lain.", document.getElementById(kolomPengguna.kontak));
        return;
    }
    if (!sedangMengubah && sandi === "") {
        tampilkanGalatPengguna("sandi", "Kata sandi awal wajib diisi.", kolomSandiPengguna);
        return;
    }
    if (pilihPeranPengguna.value === "") {
        tampilkanGalatPengguna("peran", "Peran wajib dipilih.", pilihPeranPengguna);
        return;
    }
    if (pembukuan.length === 0) {
        tampilkanGalatPengguna("pembukuan", "Pilih minimal satu pembukuan.", kotakPembukuanPengguna[0]);
        return;
    }

    data.peran = pilihPeranPengguna.value;
    data.pembukuan = pembukuan;
    data.nonAktif = kotakNonAktifPengguna.checked;

    // Pengaman akun (PRD 6.12): akun yang sedang dipakai tidak bisa dijadikan Non Aktif, dan harus tetap ada
    // minimal satu Finance Yayasan aktif (kalau tidak, tidak ada lagi yang bisa mengelola pengguna)
    var sesiSaya = bacaSesi();
    if (sedangMengubah && sesiSaya && modulPengguna.idDiubah === sesiSaya.penggunaId && data.nonAktif) {
        tampilkanNotifikasi("Akun yang sedang Anda pakai tidak bisa dijadikan Non Aktif.", "peringatan");
        return;
    }
    if (!adaFinanceYayasanAktif(daftar.filter(function (p) { return p.id !== modulPengguna.idDiubah; }).concat([data]))) {
        tampilkanNotifikasi("Harus ada minimal satu Finance Yayasan yang aktif.", "peringatan");
        return;
    }

    // Salinan data lama (tanpa data kata sandi) untuk dibandingkan di log
    var lama = sedangMengubah
        ? Object.assign({}, daftar.find(function (p) { return p.id === modulPengguna.idDiubah; })) : null;

    // Kata sandi diacak dulu. Kalau gagal, tidak ada yang disimpan.
    if (sandi !== "") {
        sedangMenyimpanPengguna = true;
        try {
            data.sandi = await acakKataSandi(sandi);
            data.wajibGantiSandi = true;       // pengguna harus menggantinya saat masuk
            data.sandiDiatur = waktuSekarang();
        } catch (galat) {
            tampilkanNotifikasi(galat.message, "galat");
            return;
        } finally {
            sedangMenyimpanPengguna = false;
        }
        daftar = bacaPengguna();   // baca ulang: selama menunggu, data bisa saja berubah
        var masihKembar = daftar.some(function (p) { return p.id !== modulPengguna.idDiubah && teksAman(p.username).toLowerCase() === data.username.toLowerCase(); });
        if (masihKembar) {
            tampilkanGalatPengguna("username", "Nama pengguna sudah dipakai.", document.getElementById(kolomPengguna.username));
            return;
        }
    }

    if (sedangMengubah) {
        daftar.forEach(function (p) {
            if (p.id === modulPengguna.idDiubah) {
                Object.assign(p, data);   // kata sandi lama tetap kalau kolom sandi dikosongkan
            }
        });
    } else {
        data.id = buatId("u");
        daftar.push(data);
    }
    // itemBaru untuk log: kata sandi sengaja dibuang dari salinannya
    var untukLog = Object.assign({}, data);
    delete untukLog.sandi;
    // Kalau kata sandi tidak diganti, waktu "terakhir diatur" tetap sama dengan sebelumnya,
    // supaya log tidak keliru menampilkannya sebagai perubahan
    if (!untukLog.sandiDiatur && lama) {
        untukLog.sandiDiatur = lama.sandiDiatur;
    }
    if (modulPengguna.simpan(daftar)) {
        modulPengguna.selesaiSimpan(sedangMengubah, untukLog, lama);
        if (!sedangMengubah) {
            document.getElementById(kolomPengguna.nama).focus();
        }
    }
});

// Pesan kesalahan hilang begitu pengguna mulai mengubah isian
Object.keys(kolomPengguna).forEach(function (nama) {
    document.getElementById(kolomPengguna[nama]).addEventListener("input", function () { galatPengguna[nama].hidden = true; });
});
kolomSandiPengguna.addEventListener("input", function () { galatPengguna.sandi.hidden = true; });
kotakPembukuanPengguna.forEach(function (k) {
    k.addEventListener("change", function () { galatPengguna.pembukuan.hidden = true; });
});

// ---------- Halaman Penomoran ----------
// Aturan penomoran untuk transaksi pembukuan Yayasan. Sekolah dan Unit usaha mengatur penomorannya
// sendiri di dalam pembukuan masing-masing.
// Counter mulai dari 1 lagi menurut komponen yang dipakai (lihat periodeReset): tiap bulan kalau nomor memuat Bulan
// atau Hari, tiap tahun kalau hanya memuat Tahun, dan tidak pernah kalau tidak memuat keduanya. Tanpa aturan ini,
// nomor tanpa bulan (misalnya "JU-0001") akan terulang di bulan berikutnya dan bertabrakan dengan nomor lama.
var tipeTransaksi = {
    "donasi": "Donasi",
    "penerimaan": "Penerimaan Kas dan Bank",
    "pembayaran": "Pembayaran",
    "transfer": "Transfer Kas/Bank",
    "jurnal": "Jurnal Umum",
    "gaji": "Pencatatan Gaji",
    "pemindahan": "Pemindahan Dana",   // antar Program atau ke Dana Umum (PRD 6.1)
    "transfer-anggaran": "Transfer Anggaran",   // PRD 6.5
    "pegawai": "Nomor Pegawai"
};

// Jenis komponen yang bisa disusun menjadi nomor (urutan sama dengan pilihan di Accurate)
var angkaRomawi = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
var jenisKomponen = {
    "tahun":          { label: "Tahun" },
    "tahun-singkat":  { label: "Tahun [Singkat]" },
    "bulan":          { label: "Bulan" },
    "bulan-romawi":   { label: "Bulan [Romawi]" },
    "hari":           { label: "Hari" },
    "counter":        { label: "Counter" },
    "teks":           { label: "Teks Pemisah" }
};

// Menyusun nomor dari sebuah aturan, tanggal transaksi ("2026-10-22"), dan nomor urut.
// Dipakai formulir transaksi, dan untuk contoh di formulir dan daftar ini. Aturan atau tanggal yang rusak -> "".
function formatNomor(aturan, tanggalIso, nomorUrut) {
    if (!aturan || !Array.isArray(aturan.komponen) || !/^\d{4}-\d{2}-\d{2}$/.test(teksAman(tanggalIso))) { return ""; }
    var bagian = tanggalIso.split("-");   // [tahun, bulan, hari]
    var digit = Number(aturan.digit);
    if (!(digit >= 1 && digit <= 10)) { digit = 5; }
    return aturan.komponen.map(function (k) {
        switch (k.jenis) {
            case "tahun":         return bagian[0];
            case "tahun-singkat": return bagian[0].slice(2);
            case "bulan":         return bagian[1];
            case "bulan-romawi":  return angkaRomawi[Number(bagian[1]) - 1];
            case "hari":          return bagian[2];
            case "counter":       return String(nomorUrut).padStart(digit, "0");
            default:              return teksAman(k.nilai);   // teks pemisah
        }
    }).join("");
}

// Kapan Counter mulai dari 1 lagi: "bulan" (nomor memuat Bulan, Bulan Romawi, atau Hari), "tahun" (hanya Tahun),
// atau "tidak" (nomor tidak memuat tanggal sama sekali, jadi hitungan berlanjut terus).
function periodeReset(komponen) {
    var jenis = (Array.isArray(komponen) ? komponen : []).map(function (k) { return k && k.jenis; });
    if (jenis.indexOf("bulan") !== -1 || jenis.indexOf("bulan-romawi") !== -1 || jenis.indexOf("hari") !== -1) { return "bulan"; }
    if (jenis.indexOf("tahun") !== -1 || jenis.indexOf("tahun-singkat") !== -1) { return "tahun"; }
    return "tidak";
}
var TEKS_PERIODE_RESET = { bulan: "Reset setiap bulan", tahun: "Reset setiap tahun", tidak: "Tidak pernah reset (berlanjut terus)" };

// Hitungan nomor yang sudah terpakai: { "idAturan|periode": angka }. Isi rusak dianggap kosong.
function bacaHitunganPenomoran() {
    return bacaPengaturan("hitunganPenomoran", {});   // alat bersama di umum/preferensi.js
}

// Kunci hitungan sebuah aturan untuk tanggal tertentu, menurut periode resetnya.
// Contoh: "n123|2026-10" (bulanan), "n123|2026" (tahunan), "n123|semua" (tidak pernah reset).
function kunciHitunganPenomoran(aturan, tanggalIso) {
    var periode = periodeReset(aturan.komponen);
    if (periode === "bulan") { return aturan.id + "|" + tanggalIso.slice(0, 7); }
    if (periode === "tahun") { return aturan.id + "|" + tanggalIso.slice(0, 4); }
    return aturan.id + "|semua";
}

// Hitungan saat ini untuk aturan dan tanggal itu. Kalau kuncinya belum ada (misalnya aturan lama yang dulu dihitung
// per bulan lalu diubah komponennya), dimulai dari hitungan terbesar yang pernah tercatat untuk aturan itu di periode
// yang sama, supaya nomor yang sudah pernah dipakai tidak terulang.
function hitunganPenomoranSaatIni(aturan, tanggalIso, hitungan) {
    var kunci = kunciHitunganPenomoran(aturan, tanggalIso);
    if (typeof hitungan[kunci] === "number") { return hitungan[kunci]; }
    var periode = periodeReset(aturan.komponen);
    var awalan = aturan.id + "|" + (periode === "bulan" ? tanggalIso.slice(0, 7) : periode === "tahun" ? tanggalIso.slice(0, 4) : "");
    var terbesar = 0;
    Object.keys(hitungan).forEach(function (k) {
        if (k.indexOf(awalan) === 0 && typeof hitungan[k] === "number") { terbesar = Math.max(terbesar, hitungan[k]); }
    });
    return terbesar;
}

// Nomor berikutnya untuk sebuah aturan pada tanggal transaksi, DAN memakainya (hitungan bertambah satu).
// Dipanggil hanya setelah transaksi benar-benar tersimpan. null kalau aturan tidak ada atau gagal disimpan.
function nomorBerikutnya(idAturan, tanggalIso) {
    var aturan = bacaPenomoran().find(function (a) { return a.id === idAturan; });
    if (!aturan || !/^\d{4}-\d{2}-\d{2}$/.test(teksAman(tanggalIso))) { return null; }
    var hitungan = bacaHitunganPenomoran();
    var urut = hitunganPenomoranSaatIni(aturan, tanggalIso, hitungan) + 1;
    hitungan[kunciHitunganPenomoran(aturan, tanggalIso)] = urut;
    try { localStorage.setItem("hitunganPenomoran", JSON.stringify(hitungan)); } catch (galat) { return null; }
    return formatNomor(aturan, tanggalIso, urut);
}

// Melihat nomor berikutnya TANPA memakainya (hitungan tidak bertambah). Dipakai untuk contoh di formulir transaksi.
function intipNomorBerikutnya(idAturan, tanggalIso) {
    var aturan = bacaPenomoran().find(function (a) { return a.id === idAturan; });
    if (!aturan || !/^\d{4}-\d{2}-\d{2}$/.test(teksAman(tanggalIso))) { return null; }
    return formatNomor(aturan, tanggalIso, hitunganPenomoranSaatIni(aturan, tanggalIso, bacaHitunganPenomoran()) + 1);
}

var kolomNamaPenomoran = document.getElementById("pn-nama");
var pilihTipePenomoran = document.getElementById("pn-tipe");
var kolomDigitPenomoran = document.getElementById("pn-digit");
var pilihJenisKomponen = document.getElementById("pn-jenis");
var kolomTeksKomponen = document.getElementById("pn-teks");
var wadahKomponen = document.getElementById("pn-komponen");
var kotakContohNomor = document.getElementById("pn-contoh");
var pilihKasPenomoran = document.getElementById("pn-kas");
var barisKasPenomoran = document.getElementById("baris-pn-kas");
var galatPenomoran = {
    nama: document.getElementById("galat-pn-nama"),
    tipe: document.getElementById("galat-pn-tipe"),
    kas: document.getElementById("galat-pn-kas"),
    digit: document.getElementById("galat-pn-digit"),
    komponen: document.getElementById("galat-pn-komponen")
};
var komponenSaatIni = [];   // komponen yang sedang disusun di formulir: [{ jenis, nilai }]

// Halaman ini khusus pembukuan Yayasan. Aturan penomoran Sekolah dan Unit usaha dibuat nanti
// di dalam pembukuan masing-masing. Nilai ini tetap disimpan di tiap aturan supaya aturan lama
// tetap jelas milik pembukuan mana.
var PEMBUKUAN_PENOMORAN = "yayasan";

// Isi pilihan tipe transaksi dan jenis komponen (sekali saja, daftarnya tetap). Mulai dari "Silakan Pilih" (PRD 5.3a).
isiPilihan(pilihTipePenomoran, Object.keys(tipeTransaksi), {
    nilai: function (kunci) { return kunci; },
    teks: function (kunci) { return tipeTransaksi[kunci]; },
    kosong: "Silakan Pilih"
});
isiPilihan(pilihJenisKomponen, Object.keys(jenisKomponen), {
    nilai: function (kunci) { return kunci; },
    teks: function (kunci) { return jenisKomponen[kunci].label; },
    kosong: "Silakan Pilih"
});

// ----- Aturan yang mengikuti Kas/Bank (PRD 6.3) -----
// Untuk tipe ini, aturan bisa ditautkan ke satu akun Kas/Bank: saat Kas/Bank itu dipilih di transaksi, aturannya terpilih
// otomatis (lihat ikutKas di buatNomorOtomatis). Kosong = berlaku untuk semua Kas/Bank.
// Donasi ikut (PRD 6.1: No Bukti Pencatatan Donasi mengikuti Kas/Bank seperti Pembayaran).
var TIPE_PENOMORAN_IKUT_KAS = ["pembayaran", "penerimaan", "donasi"];

// Tampilkan isian Kas/Bank hanya untuk tipe di atas, dan isi pilihannya (akun Kas/Bank tingkat 3, alat bersama
// isiPilihanKasBank di umum/komponen-transaksi.js; PRD 5.1). Pilihan kosong di sini berarti "berlaku untuk semua".
function aturKasPenomoran(idTerpilih) {
    var ikutKas = TIPE_PENOMORAN_IKUT_KAS.indexOf(pilihTipePenomoran.value) !== -1;
    barisKasPenomoran.hidden = !ikutKas;
    isiPilihanKasBank(pilihKasPenomoran, {
        kosong: "(Semua Kas/Bank)",
        kosongKalauTakAda: "(Semua Kas/Bank)",
        terpilih: idTerpilih
    });
}
pilihTipePenomoran.addEventListener("change", function () { galatPenomoran.kas.hidden = true; galatPenomoran.tipe.hidden = true; aturKasPenomoran(pilihKasPenomoran.value); });
pilihKasPenomoran.addEventListener("change", function () { galatPenomoran.kas.hidden = true; });

// Nama Kas/Bank sebuah aturan untuk daftar dan Log ("" kalau tidak tertaut)
function namaKasPenomoran(idKas) {
    if (!idKas) { return ""; }
    var akun = bacaDaftarAkun().find(function (a) { return a.id === idKas; });
    return akun ? akun.kode + " - " + akun.nama : "(akun sudah dihapus)";
}

// Nama satu komponen untuk ditampilkan (jenis yang tidak dikenal dari data rusak tetap tampil, tidak membuat galat)
function labelKomponen(k) {
    return jenisKomponen[k.jenis] ? jenisKomponen[k.jenis].label : teksAman(k.jenis);
}

// Kolom teks hanya muncul kalau jenis "Teks Pemisah" dipilih
pilihJenisKomponen.addEventListener("change", function () {
    kolomTeksKomponen.hidden = (pilihJenisKomponen.value !== "teks");
    if (!kolomTeksKomponen.hidden) { kolomTeksKomponen.focus(); }
});

// Teks untuk komponen, dipakai di rincian log, misalnya: "DON" + Tahun + Bulan + Counter
function teksKomponen(daftarKomponen) {
    return (daftarKomponen || []).map(function (k) {
        return k.jenis === "teks" ? '"' + teksAman(k.nilai) + '"' : labelKomponen(k);
    }).join(" + ");
}

// Perbarui kotak "Contoh Hasil Penomoran" dan kolom "Tipe Penomoran" (kapan reset) dari susunan komponen saat ini
function perbaruiContohNomor() {
    document.getElementById("pn-reset").value = TEKS_PERIODE_RESET[periodeReset(komponenSaatIni)];
    if (komponenSaatIni.length === 0) {
        kotakContohNomor.textContent = "-";
        return;
    }
    var digit = Number(kolomDigitPenomoran.value);
    if (!(digit >= 1 && digit <= 10)) { digit = 5; }
    kotakContohNomor.textContent = formatNomor({ komponen: komponenSaatIni, digit: digit }, tanggalHariIni(), 1);
}

// Gambar komponen yang sudah ditambahkan: label, tombol geser kiri/kanan, dan tombol hapus (×)
function gambarKomponen() {
    wadahKomponen.textContent = "";
    komponenSaatIni.forEach(function (k, i) {
        var chip = document.createElement("span");
        chip.className = "chip-akun";
        var teks = document.createElement("span");
        teks.textContent = k.jenis === "teks" ? 'Teks "' + teksAman(k.nilai) + '"' : labelKomponen(k);

        function tombolKecil(simbol, label, saatKlik, nonaktif) {
            var tombol = document.createElement("button");
            tombol.type = "button";
            tombol.className = "chip-hapus";
            tombol.textContent = simbol;
            tombol.setAttribute("aria-label", label + " " + teks.textContent);
            tombol.disabled = !!nonaktif;
            tombol.addEventListener("click", saatKlik);
            return tombol;
        }
        // Geser kiri/kanan = menukar urutan dengan tetangga
        function tukar(dengan) {
            var sementara = komponenSaatIni[i];
            komponenSaatIni[i] = komponenSaatIni[dengan];
            komponenSaatIni[dengan] = sementara;
            gambarKomponen();
        }
        chip.appendChild(tombolKecil("◀", "Geser ke kiri", function () { tukar(i - 1); }, i === 0));
        chip.appendChild(teks);
        chip.appendChild(tombolKecil("▶", "Geser ke kanan", function () { tukar(i + 1); }, i === komponenSaatIni.length - 1));
        chip.appendChild(tombolKecil("×", "Hapus", function () {
            komponenSaatIni.splice(i, 1);
            gambarKomponen();
        }));
        wadahKomponen.appendChild(chip);
    });
    galatPenomoran.komponen.hidden = true;
    perbaruiContohNomor();
}

// Tombol +: tambah komponen ke ujung kanan. Counter hanya boleh satu; teks tidak boleh kosong.
document.getElementById("pn-tambah").addEventListener("click", function () {
    var jenis = pilihJenisKomponen.value;
    if (!jenisKomponen[jenis]) {
        tampilkanGalatPenomoran("komponen", "Pilih jenis komponen dulu.", pilihJenisKomponen);
        return;
    }
    if (jenis === "counter" && komponenSaatIni.some(function (k) { return k.jenis === "counter"; })) {
        tampilkanGalatPenomoran("komponen", "Counter hanya boleh ada satu.", null);
        return;
    }
    var komponen = { jenis: jenis };
    if (jenis === "teks") {
        if (kolomTeksKomponen.value === "") {
            tampilkanGalatPenomoran("komponen", "Isi teks pemisah dulu, misalnya / atau -.", kolomTeksKomponen);
            return;
        }
        komponen.nilai = kolomTeksKomponen.value;
        kolomTeksKomponen.value = "";
    }
    komponenSaatIni.push(komponen);
    gambarKomponen();
});

kolomDigitPenomoran.addEventListener("input", function () {
    galatPenomoran.digit.hidden = true;
    perbaruiContohNomor();
});

function sembunyikanGalatPenomoran() {
    Object.keys(galatPenomoran).forEach(function (nama) { galatPenomoran[nama].hidden = true; });
}

function tampilkanGalatPenomoran(nama, pesan, kolomFokus) {
    galatPenomoran[nama].textContent = pesan;
    galatPenomoran[nama].hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

// Nama isian dan cara menampilkan nilainya di rincian log
var labelPenomoran = { nama: "Nama", tipe: "Tipe Transaksi", kasId: "Kas/Bank", digit: "Jumlah Digit Counter", komponen: "Komponen" };
var formatPenomoran = {
    tipe: function (kunci) { return tipeTransaksi[kunci] || kunci; },
    kasId: namaKasPenomoran,
    komponen: function (daftarKomponen) { return teksKomponen(daftarKomponen); }
};

var modulPenomoran = buatModulDaftar({
    id: "penomoran",
    judul: "Penomoran",
    kunci: "daftarPenomoran",
    labelData: labelPenomoran,
    formatData: formatPenomoran,
    kolom: [
        { kunci: "nama", judul: "Nama" },
        { kunci: "tipe", judul: "Tipe Transaksi", tampil: function (a) { return tipeTransaksi[a.tipe] || ""; } },
        { kunci: "kas", judul: "Kas/Bank", tampil: function (a) { return namaKasPenomoran(a.kasId); } },
        { kunci: "contoh", judul: "Contoh Nomor", tampil: function (a) { return formatNomor(a, tanggalHariIni(), 1); } }
    ],
    filter: [
        { judul: "Tipe Transaksi", ambil: function (a) { return tipeTransaksi[a.tipe] || ""; } }
    ],
    isiForm: function (aturan) {
        kolomNamaPenomoran.value = aturan ? teksAman(aturan.nama) : "";
        // Data Baru dibuka kosong (PRD 5.3a): tipe, jumlah digit, dan jenis komponen dipilih sendiri
        pilihTipePenomoran.value = aturan ? aturan.tipe : "";
        aturKasPenomoran(aturan ? teksAman(aturan.kasId) : "");
        kolomDigitPenomoran.value = aturan ? aturan.digit : "";
        // Salinan komponen, supaya mengubah di formulir tidak langsung mengubah data tersimpan
        komponenSaatIni = (aturan && Array.isArray(aturan.komponen)) ? aturan.komponen.map(function (k) { return Object.assign({}, k); }) : [];
        pilihJenisKomponen.value = "";
        kolomTeksKomponen.hidden = true;
        kolomTeksKomponen.value = "";
        gambarKomponen();
        sembunyikanGalatPenomoran();
    },
    // Susunan komponen (di memori, bukan kolom isian) ikut diingat per tab (PRD 6.10)
    keadaanTambahan: {
        ambil: function () { return komponenSaatIni.map(function (k) { return Object.assign({}, k); }); },
        pakai: function (simpanan) { komponenSaatIni = simpanan.map(function (k) { return Object.assign({}, k); }); gambarKomponen(); }
    }
});

// Daftar aturan penomoran. Dipakai formulir transaksi (lewat buatNomorOtomatis di umum/komponen-transaksi.js).
function bacaPenomoran() {
    return modulPenomoran.ambil();
}

// Dipanggil saat kotak Penomoran di Pengaturan diklik
function bukaPenomoranBaru() {
    modulPenomoran.bukaDariMenu();
    kolomNamaPenomoran.focus();
}

// Tombol simpan di formulir
document.getElementById("form-penomoran").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatPenomoran();
    var nama = kolomNamaPenomoran.value.trim();
    var daftar = bacaPenomoran();
    var digit = Number(kolomDigitPenomoran.value);

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama
    if (nama === "") {
        tampilkanGalatPenomoran("nama", "Nama wajib diisi.", kolomNamaPenomoran);
        return;
    }
    // Nama tidak boleh kembar
    var kembar = daftar.some(function (a) {
        return a.id !== modulPenomoran.idDiubah && teksAman(a.nama).toLowerCase() === nama.toLowerCase();
    });
    if (kembar) {
        tampilkanGalatPenomoran("nama", "Nama sudah dipakai.", kolomNamaPenomoran);
        return;
    }
    if (!tipeTransaksi[pilihTipePenomoran.value]) {
        tampilkanGalatPenomoran("tipe", "Tipe Transaksi wajib dipilih.", pilihTipePenomoran);
        return;
    }
    if (!(Number.isInteger(digit) && digit >= 1 && digit <= 10)) {
        tampilkanGalatPenomoran("digit", "Jumlah digit counter harus angka 1 sampai 10.", kolomDigitPenomoran);
        return;
    }
    if (!komponenSaatIni.some(function (k) { return k.jenis === "counter"; })) {
        tampilkanGalatPenomoran("komponen", "Tambahkan komponen Counter, supaya setiap nomor berbeda.", pilihJenisKomponen);
        return;
    }
    // Satu Kas/Bank hanya boleh punya satu aturan per tipe, supaya pilihan otomatisnya jelas
    var kasId = barisKasPenomoran.hidden ? "" : pilihKasPenomoran.value;
    var kasKembar = kasId && daftar.find(function (a) {
        return a.id !== modulPenomoran.idDiubah && a.tipe === pilihTipePenomoran.value && a.kasId === kasId;
    });
    if (kasKembar) {
        tampilkanGalatPenomoran("kas", 'Kas/Bank ini sudah punya aturan "' + teksAman(kasKembar.nama) + '" untuk tipe yang sama.', pilihKasPenomoran);
        return;
    }

    var data = {
        nama: nama,
        pembukuan: PEMBUKUAN_PENOMORAN,
        tipe: pilihTipePenomoran.value,
        kasId: kasId,
        digit: digit,
        komponen: komponenSaatIni.map(function (k) { return Object.assign({}, k); })
    };
    var sedangMengubah = (modulPenomoran.idDiubah !== null);
    var lama = sedangMengubah
        ? Object.assign({}, daftar.find(function (a) { return a.id === modulPenomoran.idDiubah; })) : null;
    if (sedangMengubah) {
        daftar.forEach(function (a) {
            if (a.id === modulPenomoran.idDiubah) {
                Object.assign(a, data);
            }
        });
    } else {
        data.id = buatId("n");
        daftar.push(data);
    }
    if (modulPenomoran.simpan(daftar)) {
        modulPenomoran.selesaiSimpan(sedangMengubah, data, lama);
        if (!sedangMengubah) {
            kolomNamaPenomoran.focus();
        }
    }
});

kolomNamaPenomoran.addEventListener("input", function () { galatPenomoran.nama.hidden = true; });

