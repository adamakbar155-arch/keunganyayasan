// ==================== Donatur (Donasi) ====================
// Data orang atau lembaga yang memberi donasi (PRD 6.1; dari formulir dan daftar Pelanggan Accurate).
//   - ID Donatur: otomatis D.00001, D.00002, ... saat saklar Otomatis menyala; diketik sendiri saat dimatikan.
//   - Kategori: pilih dari kategori yang sudah dipakai, atau ketik nama baru.
//   - Transaksi donasi nanti menyimpan id donatur, bukan salinan nama, jadi ganti nama cukup di sini.
// Bagian 1: tampilan, daftar, isi formulir. Bagian 2: simpan dan ubah. Bagian 3: Hamba Allah dan hapus.
// Pencatatan Donasi bagian 4: Total Donasi, tolak hapus donatur yang sudah berdonasi, dan tab Riwayat Donasi.
// HTML-nya: fitur/donatur/tampilan.js.
// Satu data tersimpan (kunci daftarDonatur):
//   { id, idDonatur, nama, kategori, telepon, hp, wa, email, jalan, kota, catatan, nonAktif, bawaan }.
//   bawaan: true hanya untuk donatur "Hamba Allah" yang dibuat otomatis (tidak bisa dihapus).
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var kolomNamaDn = document.getElementById("dn-nama");
var saklarIdOtomatisDn = document.getElementById("dn-id-otomatis");
var kolomIdDn = document.getElementById("dn-id");
var kolomKategoriDn = document.getElementById("dn-kategori");
var kolomTeleponDn = document.getElementById("dn-telepon");
var kolomHpDn = document.getElementById("dn-hp");
var kolomWaDn = document.getElementById("dn-wa");
var kolomEmailDn = document.getElementById("dn-email");
var kolomJalanDn = document.getElementById("dn-jalan");
var kolomKotaDn = document.getElementById("dn-kota");
var kolomCatatanDn = document.getElementById("dn-catatan");
var kotakNonAktifDn = document.getElementById("dn-nonaktif");
var galatDn = {
    nama: document.getElementById("galat-dn-nama"),
    id: document.getElementById("galat-dn-id")
};

// Daftar Donatur langsung dari penyimpanan (alat bersama di umum/alat.js). Dipakai juga saat modul daftar sedang
// dibuat (buatModulDaftar memanggil saatTampil), ketika modulDonatur belum ada. Nanti dipakai formulir Donasi.
function bacaDonatur() {
    return bacaDaftarTersimpan("daftarDonatur");
}

// Nama donatur menurut id-nya. Transaksi donasi hanya menyimpan id donatur (PRD 6.1), jadi semua tampilan nama
// donatur di transaksi memakai fungsi ini: ganti nama di halaman Donatur langsung ikut berubah di mana-mana.
function namaDonaturDariId(id) {
    var donatur = bacaDonatur().find(function (d) { return d && d.id === id; });
    return donatur ? teksAman(donatur.nama) : (id ? "(donatur sudah dihapus)" : "");
}

// Kontak Utama di daftar: No. WhatsApp; kalau kosong Handphone; kalau kosong juga No. Telepon (PRD 6.1)
function kontakUtamaDn(donatur) {
    return teksAman(donatur.wa).trim() || teksAman(donatur.hp).trim() || teksAman(donatur.telepon).trim();
}

// ----- Hubungan dengan Pencatatan Donasi (PRD 6.1, PLAN D1.5 bagian 4) -----
// Data donasi dibaca langsung dari penyimpanan (kunci daftarDonasi), bukan lewat modul Pencatatan Donasi, karena file
// itu dimuat SESUDAH file ini. Setiap donasi menyimpan donaturId (id donatur), jadi pencocokan memakai id, bukan nama.
// Ringkasan per donatur: { idDonatur: { jumlah, total } }. Dihitung ulang hanya kalau isi daftarDonasi berubah,
// supaya daftar Donatur yang panjang (dan saat diurutkan) tidak membaca semua donasi berulang-ulang.
var ringkasanDonasiDn = { mentah: undefined, perDonatur: {} };
function ringkasanDonasiPerDonaturDn() {
    var mentah = null;
    try { mentah = localStorage.getItem("daftarDonasi"); } catch (galat) { mentah = null; }   // penyimpanan diblokir
    if (mentah === ringkasanDonasiDn.mentah) { return ringkasanDonasiDn.perDonatur; }
    var perDonatur = {};
    // bacaDaftarTersimpan: isi rusak dianggap daftar kosong; data rusak di dalamnya dilewati
    bacaDaftarTersimpan("daftarDonasi").forEach(function (donasi) {
        if (!donasi || typeof donasi.donaturId !== "string") { return; }
        var r = perDonatur[donasi.donaturId] || (perDonatur[donasi.donaturId] = { jumlah: 0, total: 0 });
        r.jumlah += 1;
        r.total += Number(donasi.total) || 0;
    });
    ringkasanDonasiDn = { mentah: mentah, perDonatur: perDonatur };
    return perDonatur;
}

// Total Donasi di daftar: jumlah nilai semua Pencatatan Donasi dari donatur ini (pengganti kolom Saldo Accurate)
function totalDonasiDn(donatur) {
    var r = ringkasanDonasiPerDonaturDn()[donatur.id];
    return r ? r.total : 0;
}

// ----- Tab Riwayat Donasi (PRD 6.1; di Accurate tidak ada, dirancang bersama pengguna 2026-10-29) -----
// Tabel donasi donatur yang sedang dibuka: Tanggal, No Bukti, Nama Donasi, Kas/Bank, Nilai; terbaru di atas.
// Hanya untuk dilihat (baris tidak bisa diklik). Pilihan Tahun: tahun-tahun yang punya donasi + tahun ini + Semua;
// awalnya tahun ini. Total di bawah mengikuti tahun yang dipilih. Semua isi dari data tampil lewat textContent.
var pilihTahunRiwayatDn = document.getElementById("dn-riwayat-tahun");
var isiRiwayatDn = document.getElementById("dn-riwayat-isi");
var kosongRiwayatDn = document.getElementById("dn-riwayat-kosong");
var totalRiwayatDn = document.getElementById("dn-riwayat-total");
var bungkusRiwayatDn = document.querySelector("#sub-dn-riwayat .riwayat-dn-gulir");
var alatRiwayatDn = document.querySelector("#sub-dn-riwayat .riwayat-dn-alat");
var donaturRiwayatDn = null;   // id donatur yang riwayatnya tampil; null = formulir Data Baru

// Isi pilihan Tahun. Pilihan sebelumnya dipertahankan kalau masih ada, kecuali mulaiTahunIni (donatur baru dibuka).
function isiPilihanTahunRiwayatDn(daftar, mulaiTahunIni) {
    var sebelumnya = pilihTahunRiwayatDn.value;
    var tahunIni = tanggalHariIni().slice(0, 4);
    var semuaTahun = [tahunIni];
    daftar.forEach(function (d) {
        var t = teksAman(d.tanggal).slice(0, 4);
        if (/^\d{4}$/.test(t) && semuaTahun.indexOf(t) === -1) { semuaTahun.push(t); }
    });
    semuaTahun.sort().reverse();   // terbaru di atas
    pilihTahunRiwayatDn.textContent = "";
    semuaTahun.concat([""]).forEach(function (t) {
        var opsi = document.createElement("option");
        opsi.value = t;
        opsi.textContent = t || "Semua";
        pilihTahunRiwayatDn.appendChild(opsi);
    });
    var tetap = !mulaiTahunIni && (sebelumnya === "" || semuaTahun.indexOf(sebelumnya) !== -1);
    pilihTahunRiwayatDn.value = tetap ? sebelumnya : tahunIni;
}

function selRiwayatDn(tr, teks, kelas) {
    var td = document.createElement("td");
    td.textContent = teks;
    if (kelas) { td.className = kelas; }
    tr.appendChild(td);
    return td;
}

function gambarRiwayatDn(mulaiTahunIni) {
    // Data donasi dibaca langsung dari penyimpanan (data rusak = daftar kosong; butir rusak dilewati)
    var semua = donaturRiwayatDn === null ? [] : bacaDaftarTersimpan("daftarDonasi").filter(function (d) {
        return d && d.donaturId === donaturRiwayatDn;
    });
    isiPilihanTahunRiwayatDn(semua, mulaiTahunIni);
    var tahun = pilihTahunRiwayatDn.value;   // "" = Semua
    var tampil = semua.filter(function (d) {
        return tahun === "" || teksAman(d.tanggal).slice(0, 4) === tahun;
    }).sort(function (a, b) {
        // Terbaru di atas; tanggal sama diurutkan menurut No Bukti (yang lebih besar di atas)
        return teksAman(b.tanggal).localeCompare(teksAman(a.tanggal)) || teksAman(b.nomor).localeCompare(teksAman(a.nomor));
    });

    isiRiwayatDn.textContent = "";
    var jumlah = 0;
    tampil.forEach(function (d) {
        var nilai = Number(d.total) || 0;
        jumlah += nilai;
        var tr = document.createElement("tr");
        selRiwayatDn(tr, formatTanggal(teksAman(d.tanggal)));
        selRiwayatDn(tr, teksAman(d.nomor));
        // Nama Donasi baris-barisnya digabung (alat yang sama dengan kolom Kategori Donasi di daftar Pencatatan Donasi);
        // dipotong "…" lewat CSS, nama lengkapnya di title (muncul saat kursor diarahkan)
        var namaDonasi = ringkasanKategoriDc(d);
        selRiwayatDn(tr, namaDonasi, "riwayat-dn-nama").title = namaDonasi;
        selRiwayatDn(tr, teksAman(d.kas));
        selRiwayatDn(tr, formatAngka(nilai), "sel-kanan");
        isiRiwayatDn.appendChild(tr);
    });

    var pesanKosong = semua.length === 0 ? "Belum ada donasi dari donatur ini."
        : (tampil.length === 0 ? "Belum ada donasi dari donatur ini pada tahun " + tahun + "." : "");
    alatRiwayatDn.hidden = (semua.length === 0);
    kosongRiwayatDn.textContent = pesanKosong;
    kosongRiwayatDn.hidden = (pesanKosong === "");
    bungkusRiwayatDn.hidden = (tampil.length === 0);
    totalRiwayatDn.hidden = (tampil.length === 0);
    totalRiwayatDn.textContent = "Total " + (tahun || "semua tahun") + " (" + tampil.length + " donasi): " + formatRupiah(jumlah);
}
pilihTahunRiwayatDn.addEventListener("change", function () { gambarRiwayatDn(false); });

// ID otomatis berikutnya: D. + 5 angka, satu sesudah nomor terbesar yang sudah ada (ID ketikan sendiri yang
// berbentuk D.angka ikut dihitung, supaya ID otomatis tidak bertabrakan dengannya). Contoh: D.00001, D.00002, ...
function idDonaturBerikutnya() {
    var terbesar = 0;
    bacaDonatur().forEach(function (d) {
        var cocok = /^D\.(\d+)$/i.exec(teksAman(d.idDonatur).trim());
        if (cocok) { terbesar = Math.max(terbesar, Number(cocok[1])); }
    });
    return "D." + String(terbesar + 1).padStart(5, "0");
}

// Saklar Otomatis: menyala = kolom ID terkunci dan berisi ID berikutnya (dihitung ulang saat disimpan);
// mati = ID diketik sendiri (isi yang ada dibiarkan, supaya bisa diubah sedikit saja)
function perbaruiKolomIdDn() {
    kolomIdDn.readOnly = saklarIdOtomatisDn.checked;
    if (saklarIdOtomatisDn.checked) { kolomIdDn.value = idDonaturBerikutnya(); }
    kolomIdDn.placeholder = saklarIdOtomatisDn.checked ? "" : "Ketik ID donatur";
}

// Saran Kategori dari kategori yang sudah pernah dipakai (alat bersama isiSaranDatalist di umum/alat.js)
function isiDaftarKategoriDn() {
    isiSaranDatalist(document.getElementById("dn-daftar-kategori"), bacaDonatur(), function (d) { return d.kategori; });
}

function sembunyikanGalatDn() {
    Object.keys(galatDn).forEach(function (nama) { galatDn[nama].hidden = true; });
}

var modulDonatur = buatModulDaftar({
    id: "donatur",
    judul: "Donatur",
    kunci: "daftarDonatur",
    labelData: {
        nama: "Nama", idDonatur: "ID Donatur", kategori: "Kategori", telepon: "No. Telepon", hp: "Handphone",
        wa: "No. WhatsApp", email: "Email", jalan: "Alamat", kota: "Kota", catatan: "Catatan", nonAktif: "Non Aktif"
    },
    formatData: { nonAktif: function (n) { return n ? "Ya" : "Tidak"; } },
    kolom: [
        { kunci: "nama", judul: "Nama" },
        { kunci: "idDonatur", judul: "ID Donatur" },
        { kunci: "kontak", judul: "Kontak Utama", tampil: kontakUtamaDn },
        { kunci: "kategori", judul: "Kategori" },
        { kunci: "total", judul: "Total Donasi", rata: "kanan", tampil: function (d) { return formatRupiah(totalDonasiDn(d)); },
          // Pengurutan daftar membandingkan teks, jadi angka diberi nol di depan (seperti kolom Nilai di Jurnal Umum)
          urut: function (d) { return String(totalDonasiDn(d)).padStart(18, "0"); } }
    ],
    pesanKosong: "Belum ada donatur. Klik tombol + untuk menambah.",
    saatTampil: function () { isiDaftarKategoriDn(); },
    isiForm: function (donatur) {
        kolomNamaDn.value = donatur ? teksAman(donatur.nama) : "";
        // Data Baru: ID otomatis. Mengubah: ID lama ditampilkan apa adanya.
        saklarIdOtomatisDn.checked = !donatur;
        kolomIdDn.value = donatur ? teksAman(donatur.idDonatur) : "";
        perbaruiKolomIdDn();
        kolomKategoriDn.value = donatur ? teksAman(donatur.kategori) : "";
        kolomTeleponDn.value = donatur ? teksAman(donatur.telepon) : "";
        kolomHpDn.value = donatur ? teksAman(donatur.hp) : "";
        kolomWaDn.value = donatur ? teksAman(donatur.wa) : "";
        kolomEmailDn.value = donatur ? teksAman(donatur.email) : "";
        kolomJalanDn.value = donatur ? teksAman(donatur.jalan) : "";
        kolomKotaDn.value = donatur ? teksAman(donatur.kota) : "";
        kolomCatatanDn.value = donatur ? teksAman(donatur.catatan) : "";
        kotakNonAktifDn.checked = donatur ? !!donatur.nonAktif : false;
        // Hamba Allah (bawaan): Nama dan Non Aktif dikunci (PRD 6.1, keputusan 2026-10-28); isian lain tetap bisa diubah
        var bawaan = !!(donatur && donatur.bawaan);
        kolomNamaDn.readOnly = bawaan;
        kotakNonAktifDn.disabled = bawaan;
        kolomNamaDn.title = bawaan ? "Nama donatur bawaan tidak bisa diubah." : "";
        isiDaftarKategoriDn();
        sembunyikanGalatDn();
        // Tab Riwayat Donasi: donasi donatur yang dibuka (Data Baru = belum ada), mulai dari tahun ini
        donaturRiwayatDn = donatur ? donatur.id : null;
        gambarRiwayatDn(true);
        document.querySelector("#isi-donatur [data-subtab='dn-umum']").click();   // selalu mulai di tab Umum
    },
    // Hamba Allah (bawaan) dan donatur yang sudah dipakai di Pencatatan Donasi tidak bisa dihapus (PRD 6.1):
    // kalau dihapus, donasinya kehilangan nama donatur. Donatur lain dihapus lewat popup konfirmasi.
    alasanTolakHapus: function (donatur) {
        if (donatur.bawaan) {
            return 'Donatur "' + teksAman(donatur.nama) + '" adalah donatur bawaan untuk donatur yang tidak mau disebut namanya, jadi tidak bisa dihapus.';
        }
        var r = ringkasanDonasiPerDonaturDn()[donatur.id];
        if (r) {
            return 'Donatur "' + teksAman(donatur.nama) + '" sudah dipakai di ' + r.jumlah + " Pencatatan Donasi, jadi tidak bisa dihapus. " +
                "Kalau tidak dipakai lagi, centang Non Aktif di tab Lainnya.";
        }
        return "";
    }
});

// Donatur bawaan "Hamba Allah" (PRD 6.1, keputusan 2026-10-25): dibuat otomatis kalau belum ada, ditandai bawaan: true.
// Dipanggil saat halaman dimuat dan setiap tab Donatur dibuka (misalnya sesudah Cadangan Data dipulihkan).
// Kalau isi penyimpanan rusak, tidak ada yang ditulis, supaya data rusak itu tidak tertimpa (masih bisa dipulihkan).
function pastikanHambaAllahDn() {
    var daftar;
    try {
        var mentah = localStorage.getItem("daftarDonatur");
        daftar = mentah === null ? [] : JSON.parse(mentah);
    } catch (galat) {
        return;   // isi rusak atau penyimpanan diblokir
    }
    if (!Array.isArray(daftar)) { return; }
    if (daftar.some(function (d) { return d && d.bawaan; })) { return; }
    daftar.push({
        id: buatId("dn"),
        idDonatur: idDonaturBerikutnya(),
        nama: "Hamba Allah",
        kategori: "", telepon: "", hp: "", wa: "", email: "", jalan: "", kota: "",
        catatan: "Donatur bawaan untuk donatur yang tidak mau disebut namanya.",
        nonAktif: false,
        bawaan: true
    });
    modulDonatur.simpan(daftar);
}
pastikanHambaAllahDn();

saklarIdOtomatisDn.addEventListener("change", function () {
    galatDn.id.hidden = true;
    if (!saklarIdOtomatisDn.checked) { kolomIdDn.focus(); }
    perbaruiKolomIdDn();
});
kolomNamaDn.addEventListener("input", function () { galatDn.nama.hidden = true; });
kolomIdDn.addEventListener("input", function () { galatDn.id.hidden = true; });

function tampilkanGalatDn(nama, pesan, kolomFokus) {
    galatDn[nama].textContent = pesan;
    galatDn[nama].hidden = false;
    document.querySelector("#isi-donatur [data-subtab='dn-umum']").click();   // semua isian wajib ada di tab Umum
    if (kolomFokus) { kolomFokus.focus(); }
}

// ----- Simpan: Data Baru dan Ubah (PRD 6.1) -----
// Nama wajib tetapi boleh sama dengan donatur lain; ID wajib dan tidak boleh kembar (huruf besar/kecil dianggap sama).
// Log Aktivitas mencatat perubahan tiap isian lewat labelData, termasuk nama lama → nama baru.
document.getElementById("form-donatur").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatDn();
    var daftar = modulDonatur.ambil();
    var sedangMengubah = (modulDonatur.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (d) { return d.id === modulDonatur.idDiubah; }) : null;
    var nama = kolomNamaDn.value.trim();
    var bawaan = !!(lama && lama.bawaan);
    // Hamba Allah: nama dan Non Aktif selalu dari data lamanya, walaupun isian formulir sempat diubah lewat cara lain
    if (bawaan) {
        nama = teksAman(lama.nama).trim() || "Hamba Allah";
        kotakNonAktifDn.checked = false;
    }

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama
    if (nama === "") {
        tampilkanGalatDn("nama", "Nama wajib diisi.", kolomNamaDn);
        return;
    }
    // ID otomatis dihitung ulang saat disimpan (bukan hanya dibaca dari kolom), supaya pasti belum dipakai
    if (saklarIdOtomatisDn.checked) { kolomIdDn.value = idDonaturBerikutnya(); }
    var idDonatur = kolomIdDn.value.trim();
    if (idDonatur === "") {
        tampilkanGalatDn("id", "ID Donatur wajib diisi.", kolomIdDn);
        return;
    }
    var kembar = daftar.some(function (d) {
        return (!lama || d.id !== lama.id) && teksAman(d.idDonatur).trim().toLowerCase() === idDonatur.toLowerCase();
    });
    if (kembar) {
        tampilkanGalatDn("id", "ID Donatur sudah dipakai donatur lain.", kolomIdDn);
        return;
    }

    var data = {
        id: lama ? lama.id : buatId("dn"),
        idDonatur: idDonatur,
        nama: nama,
        kategori: kolomKategoriDn.value.trim(),
        telepon: kolomTeleponDn.value.trim(),
        hp: kolomHpDn.value.trim(),
        wa: kolomWaDn.value.trim(),
        email: kolomEmailDn.value.trim(),
        jalan: kolomJalanDn.value.trim(),
        kota: kolomKotaDn.value.trim(),
        catatan: kolomCatatanDn.value.trim(),
        nonAktif: kotakNonAktifDn.checked,
        bawaan: bawaan   // tanda Hamba Allah ikut tersimpan saat diubah, supaya tetap tidak bisa dihapus
    };
    var daftarBaru = lama
        ? daftar.map(function (d) { return d.id === lama.id ? data : d; })
        : daftar.concat([data]);
    if (!modulDonatur.simpan(daftarBaru)) { return; }
    modulDonatur.selesaiSimpan(sedangMengubah, data, lama);   // notifikasi, Log Aktivitas, formulir kosong / kembali ke daftar
    if (!sedangMengubah) { kolomNamaDn.focus(); }
});

// Setiap tab Donatur dibuka: daftar dan Riwayat Donasi digambar ulang, karena donasi mungkin baru dicatat/diubah
saatTabDibuka.donatur = function () { pastikanHambaAllahDn(); modulDonatur.gambarTabel(); gambarRiwayatDn(false); };

// Donatur baru langsung dari kolom Donatur di Pencatatan Donasi (PRD 6.1): hanya nama, ID otomatis berikutnya.
// Kontak dan isian lain dilengkapi nanti di halaman ini. Tercatat di Log Aktivitas seperti Simpan biasa.
// Mengembalikan data donatur yang baru, atau null kalau gagal (nama kosong atau penyimpanan gagal; pesannya sudah tampil).
function buatDonaturCepat(nama) {
    nama = teksAman(nama).trim();
    if (nama === "") { return null; }
    var data = {
        id: buatId("dn"), idDonatur: idDonaturBerikutnya(), nama: nama,
        kategori: "", telepon: "", hp: "", wa: "", email: "", jalan: "", kota: "", catatan: "",
        nonAktif: false, bawaan: false
    };
    if (!modulDonatur.simpan(modulDonatur.ambil().concat([data]))) { return null; }
    catatLog({ tindakan: "Buat", tipe: "Donatur", referensi: nama + " (dari Pencatatan Donasi)" });
    modulDonatur.gambarTabel();
    return data;
}

// Dipanggil dari popup Donasi, kotak Donatur
function bukaDonaturBaru() {
    modulDonatur.bukaDariMenu();
    kolomNamaDn.focus();
}
