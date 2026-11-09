// ==================== Pemindahan Dana (Donasi) ====================
// Memindah KEPEMILIKAN dana sekaligus UANGNYA antar kantong dana (PRD 6.1, rancangan dua arah disetujui 2026-10-30):
//   ① "ke-umum"   : sisa dana sebuah Program → Dana Umum (milik yayasan, tanpa Divisi)
//   ② "ke-divisi" : Dana Umum → sebuah Divisi (sejak itu milik Divisi tersebut, tanpa Program)
// Uangnya pindah dari Kas/Bank asal ke Kas/Bank tujuan. Memberi Dana Umum ke Divisi harus lewat sini (bukan Transfer
// Bank), supaya keluar-masuknya terlihat di laporan. Nilai tidak boleh melebihi sisa kantong asal
// (sisaDanaProgram / sisaDanaUmum, fitur/akun/akun.js).
// HTML-nya: fitur/pemindahan-dana/tampilan.js.
// Satu data tersimpan (kunci daftarPemindahanDana):
//   { id, nomor, nama(=nomor), aturanId, tanggal, jenis ("ke-umum" | "ke-divisi"), dariProgramId ("" untuk ②),
//     keDivisiId ("" untuk ①), kasAsalId, kasAsal ("kode - nama"), kasTujuanId, kasTujuan ("kode - nama"),
//     nilai, total(=nilai), alasan, ... }
//   Data lama tanpa "jenis" dianggap arah ① (rancangan sebelumnya hanya ke Dana Umum).
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var pilihDariPd = document.getElementById("pd-dari");
var kolomDariUmumPd = document.getElementById("pd-dari-umum");
var pilihKasAsalPd = document.getElementById("pd-kas-asal");
var kotakSisaPd = document.getElementById("pd-sisa");
var kolomTanggalPd = document.getElementById("pd-tanggal");
var kolomAlasanPd = document.getElementById("pd-alasan");
var badanRincianPd = document.getElementById("pd-rincian");
var tujuanPd = null;   // salinan kerja tujuan: { kasId, nilai, divisiId ("" untuk arah ①) } atau null (belum dipilih)

// Jenis sumber jurnal otomatis Pemindahan Dana (jurnal.sumber.jenis)
var SUMBER_JURNAL_PEMINDAHAN = "pemindahan";
var JENIS_PEMINDAHAN = { "ke-umum": "Sisa Program → Dana Umum", "ke-divisi": "Dana Umum → Divisi" };
var NAMA_DANA_UMUM = "Dana Umum";

// Jenis yang sedang dipilih di formulir
// Jenis yang dipilih: "ke-umum", "ke-divisi", atau "" kalau belum dipilih (Data Baru dibuka kosong, PRD 5.3a).
// Selama belum dipilih, tampilannya seperti "ke-umum"; Simpan menolaknya.
function jenisPd() {
    var pilihan = document.querySelector('#isi-pemindahan-dana input[name="pd-jenis"]:checked');
    return pilihan ? (pilihan.value === "ke-divisi" ? "ke-divisi" : "ke-umum") : "";
}
// Jenis sebuah data tersimpan (data lama tanpa jenis = arah ①)
function jenisDataPd(d) {
    return d && d.jenis === "ke-divisi" ? "ke-divisi" : "ke-umum";
}
// Tulisan "Dari" dan "Ke" di daftar
function teksDariPd(d) {
    return jenisDataPd(d) === "ke-divisi" ? NAMA_DANA_UMUM : namaProgramDari(d.dariProgramId);
}
function teksKePd(d) {
    return jenisDataPd(d) === "ke-divisi" ? "Divisi " + teksAman(namaDivisiDari(d.keDivisiId)) : NAMA_DANA_UMUM;
}

// Teks Kas/Bank "[kode] nama" dari id akunnya (kosong kalau akunnya sudah tidak ada)
function teksKasPd(kasId) {
    var akun = bacaDaftarAkun().find(function (a) { return a && a.id === kasId; });
    return akun ? "[" + teksAman(akun.kode) + "] " + teksAman(akun.nama) : "";
}

// Lampiran file (PRD 5.4): alat bersama umum/lampiran.js; wajib atau tidak menurut Preferensi, Lampiran (Pemindahan Dana)
var tombolLampiranPd = document.getElementById("pd-tombol-lampiran");
var lampiranPd = buatLampiranTransaksi({ jenis: "pemindahan", namaFitur: "Pemindahan Dana", tombol: tombolLampiranPd,
                                         lencana: document.getElementById("pd-lencana-lampiran") });

var modulPemindahanDana = buatModulDaftar({
    id: "pemindahan-dana",
    judul: "Pemindahan Dana",
    kunci: "daftarPemindahanDana",
    urutAwal: { kolom: "tanggal", arah: -1 },
    labelData: { nomor: "No Bukti", tanggal: "Tanggal", jenis: "Jenis", dariProgramId: "Dari Program", keDivisiId: "Ke Divisi",
                 kasAsal: "Dari Kas/Bank", kasTujuan: "Ke Kas/Bank", alasan: "Alasan", nilai: "Nilai (Rp)",
                 jumlahLampiran: "Jumlah Lampiran", ringkasanLampiran: "Lampiran" },
    formatData: {
        tanggal: function (t) { return formatTanggal(t); },
        jenis: function (j) { return JENIS_PEMINDAHAN[j] || ""; },
        dariProgramId: function (id) { return namaProgramDari(id); },
        keDivisiId: function (id) { return namaDivisiDari(id); },
        nilai: function (n) { return formatRupiah(n); }
    },
    kolom: [
        { kunci: "nomor", judul: "No Bukti" },
        { kunci: "tanggal", judul: "Tanggal", tampil: function (d) { return formatTanggal(d.tanggal); }, urut: function (d) { return d.tanggal || ""; } },
        { kunci: "jenis", judul: "Jenis", tampil: function (d) { return JENIS_PEMINDAHAN[jenisDataPd(d)]; } },
        { kunci: "dari", judul: "Dari", tampil: teksDariPd },
        { kunci: "ke", judul: "Ke", tampil: teksKePd },
        // Kas/Bank tampil dari teks yang tersimpan saat itu ("kode - nama"), supaya tetap terbaca walau akunnya dihapus
        { kunci: "kasAsal", judul: "Dari Kas/Bank", tampil: function (d) { return teksAman(d.kasAsal); } },
        { kunci: "kasTujuan", judul: "Ke Kas/Bank", tampil: function (d) { return teksAman(d.kasTujuan); } },
        { kunci: "alasan", judul: "Alasan" },
        // Pengurutan daftar membandingkan teks, jadi angka diberi nol di depan (seperti kolom Nilai di Pencatatan Donasi)
        { kunci: "nilai", judul: "Nilai", rata: "kanan", tampil: function (d) { return formatAngka(Number(d.nilai) || 0); }, urut: function (d) { return String(Number(d.nilai) || 0).padStart(18, "0"); } }
    ],
    filter: [
        // Nilai "2026-10" supaya urut menurut waktu; tampil "Okt 2026". Terbaru di atas (seperti Pencatatan Donasi).
        { judul: "Tanggal", ambil: function (d) { return teksAman(d.tanggal).slice(0, 7); }, tampil: teksBulanTahun, turun: true },
        { judul: "Jenis", ambil: function (d) { return JENIS_PEMINDAHAN[jenisDataPd(d)]; } }
    ],
    pesanKosong: "Belum ada pemindahan dana. Klik tombol + untuk mencatat.",
    // Yang sudah direkonsiliasi (PRD 6.3) atau bertanggal terkunci (PRD 5.3) tidak boleh dihapus, seperti transaksi lain
    alasanTolakHapus: function (d) {
        var rekonsiliasi = galatTransaksiSudahRekonsiliasi(SUMBER_JURNAL_PEMINDAHAN, d.id, "Pemindahan Dana");
        if (rekonsiliasi) { return rekonsiliasi; }
        return tanggalTerkunci(d.tanggal)
            ? 'Pemindahan Dana "' + teksAman(d.nomor) + '" bertanggal ' + formatTanggal(d.tanggal) + " yang sudah terkunci (Preferensi, Pembatasan), jadi tidak bisa dihapus."
            : "";
    },
    // Menghapus pemindahan ikut menghapus jurnal otomatisnya (PRD 3.1 butir 3) dan isi file lampirannya
    saatDihapus: function (d) {
        modulJurnal.simpan(daftarJurnalTanpaOtomatis({ jenis: SUMBER_JURNAL_PEMINDAHAN, id: d.id }));
        hapusIsiLampiran(d.id);
    },
    isiForm: function (data) {
        // Data Baru dibuka kosong (PRD 5.3a): tanggal, aturan nomor, dan jenis dipilih sendiri
        kolomTanggalPd.value = data ? teksAman(data.tanggal) : "";
        aturBatasTanggal(kolomTanggalPd);
        nomorPd.mulai(data ? data.nomor : "");
        var jenis = data ? jenisDataPd(data) : "";
        document.querySelectorAll('#isi-pemindahan-dana input[name="pd-jenis"]').forEach(function (r) { r.checked = (r.value === jenis); });
        isiPilihanDariPd(data ? data.dariProgramId : "");
        isiPilihanKasAsalPd(data ? data.kasAsalId : "");
        kolomAlasanPd.value = data ? teksAman(data.alasan) : "";
        tujuanPd = data && data.kasTujuanId
            ? { kasId: teksAman(data.kasTujuanId), nilai: Number(data.nilai) || 0, divisiId: jenis === "ke-divisi" ? teksAman(data.keDivisiId) : "" }
            : null;
        cariTujuanPd.tutup();
        document.getElementById("pd-cari-tujuan").value = "";
        lampiranPd.muat(data);   // Data Baru: kosong; data tersimpan: lampirannya
        document.getElementById("pd-pesan-galat").hidden = true;
        tampilkanJenisPd();
        pilihTabPd("tujuan");   // selalu mulai di tab Tujuan
    },
    // Baris Tujuan dan lampiran ikut diingat per tab (PRD 6.10). Jenis (pilihan bulat) sudah ikut lewat id-nya;
    // memulihkan Jenis menghapus Tujuan (lihat kejadian change di bawah), jadi Tujuan dipulihkan sesudahnya di sini.
    keadaanTambahan: {
        ambil: function () { return { tujuan: tujuanPd ? Object.assign({}, tujuanPd) : null, lampiran: lampiranPd.kerja() }; },
        pakai: function (simpanan) {
            tujuanPd = simpanan.tujuan ? Object.assign({}, simpanan.tujuan) : null;
            gambarTujuanPd();
            perbaruiSisaPd();
            lampiranPd.atur(simpanan.lampiran);
        }
    }
});

// Jurnal otomatis pemindahan bisa ditelusuri balik (pesan "ubah lewat halaman ...", Histori Bank, Rekonsiliasi Bank)
daftarkanAsalJurnal(SUMBER_JURNAL_PEMINDAHAN, { nama: "Pemindahan Dana", modul: modulPemindahanDana, tab: "pemindahan-dana" });

// Tab samping: Tujuan dan Info lainnya ("i", berisi Alasan) — alat bersama, seperti Pencatatan Donasi.
// buatModulDaftar tidak memanggil isiForm saat dibuat, jadi isiForm baru memakai pilihTabPd sesudah baris ini.
var pilihTabPd = buatPengalihTab(document.querySelectorAll("#isi-pemindahan-dana [data-pd-tab]"), "pdTab",
    { tujuan: "pd-panel-tujuan", info: "pd-panel-info" });

// No Bukti: otomatis dari aturan penomoran bertipe Pemindahan Dana (Pengaturan, Penomoran), atau diketik sendiri
var nomorPd = buatNomorOtomatis({
    saklar: document.getElementById("pd-nomor-otomatis"),
    pilihan: document.getElementById("pd-aturan-nomor"),
    kolom: document.getElementById("pd-nomor"),
    contoh: document.getElementById("pd-contoh-nomor"),
    tanggal: kolomTanggalPd,
    tipe: "pemindahan",
    namaTipe: "Pemindahan Dana"
});

// ----- Jenis Pemindahan: isian menyesuaikan -----
// Arah ①: "Dari Program" berupa pilihan Program. Arah ②: "Dari" selalu Dana Umum (hanya dibaca).
// Kotak pilihan Program disembunyikan lewat atribut hidden (label pilihannya ikut tersembunyi, umum/pemilih-opsi.js).
function tampilkanJenisPd() {
    var keDivisi = jenisPd() === "ke-divisi";
    var label = document.getElementById("label-pd-dari");
    label.firstChild.textContent = keDivisi ? "Dari " : "Dari Program ";
    label.querySelector(".wajib").hidden = keDivisi;   // "Dana Umum" hanya dibaca, jadi tanpa tanda wajib
    pilihDariPd.hidden = keDivisi;
    kolomDariUmumPd.hidden = !keDivisi;
    perbaruiSisaPd();
    gambarTujuanPd();
}
document.querySelectorAll('#isi-pemindahan-dana input[name="pd-jenis"]').forEach(function (r) {
    r.addEventListener("change", function () {
        // Ganti arah: tujuan lama dibuang, karena Ke-nya berbeda (Dana Umum atau Divisi)
        tujuanPd = null;
        document.getElementById("pd-pesan-galat").hidden = true;
        tampilkanJenisPd();
    });
});

// ----- Dari Program dan sisa dananya -----
// Program Aktif maupun Selesai boleh jadi asal (sisa Program yang sudah selesai justru yang biasanya dipindah).
// Program Selesai diberi tanda "(Selesai)" di pilihan.
function isiPilihanDariPd(terpilih) {
    isiPilihan(pilihDariPd, bacaProgram().filter(function (p) { return p && typeof p === "object"; }), {
        kosong: "Pilih Program...",
        kosongKalauTakAda: "Belum ada Program",
        terpilih: teksAman(terpilih),
        teks: function (p) { return teksAman(p.nama) + (p.status === "selesai" ? " (Selesai)" : ""); }
    });
}

// Ambil dari = akun Kas & Bank tingkat 3 (alat bersama isiPilihanKasBank, umum/komponen-transaksi.js; PRD 5.1)
function isiPilihanKasAsalPd(idTerpilih) {
    isiPilihanKasBank(pilihKasAsalPd, {
        terpilih: teksAman(idTerpilih),
        nonaktifKalauKosong: true,
        petunjuk: document.getElementById("petunjuk-pd-kas")
    });
}

// Sisa yang bisa dipindah dari kantong asal: sisa Program (arah ①) atau sisa Dana Umum (arah ②), yaitu sisa terendah
// mulai tanggal pemindahan ke depan, supaya uang yang sudah dipindah di tanggal sesudahnya tidak dipindah lagi
// (PRD 6.1, Temuan 28). Dipakai kotak sisa, tombol "Semua sisa", dan pemeriksaan Simpan. Saat mengubah, jurnal pemindahan ini sendiri tidak ikut dihitung, supaya nilai lamanya tidak mengurangi sisa (PRD 6.1).
// Arah ① tanpa Program dipilih: null (belum bisa dihitung).
function sisaDanaAsalPd() {
    var idDiubah = modulPemindahanDana.idDiubah;
    var milikSendiri = idDiubah ? { jenis: SUMBER_JURNAL_PEMINDAHAN, id: idDiubah } : null;
    var abaikan = milikSendiri ? function (j) { return jurnalMilik(j, milikSendiri); } : null;
    if (jenisPd() === "ke-divisi") { return sisaDanaUmum(kolomTanggalPd.value, abaikan); }
    return pilihDariPd.value ? sisaDanaProgram(pilihDariPd.value, kolomTanggalPd.value, abaikan) : null;
}

function perbaruiSisaPd() {
    var sisa = sisaDanaAsalPd();
    if (sisa === null) { kotakSisaPd.hidden = true; return; }
    var judul = jenisPd() === "ke-divisi" ? "Sisa Dana Umum yang bisa dipindah mulai " : "Sisa yang bisa dipindah mulai ";
    kotakSisaPd.textContent = "";
    kotakSisaPd.appendChild(document.createTextNode(judul + formatTanggal(kolomTanggalPd.value || tanggalHariIni()) + ": "));
    var angka = document.createElement("strong");
    angka.textContent = formatRupiah(sisa);
    kotakSisaPd.appendChild(angka);
    kotakSisaPd.classList.toggle("habis", sisa <= 0);
    kotakSisaPd.hidden = false;
}
pilihDariPd.addEventListener("change", function () {
    document.getElementById("pd-pesan-galat").hidden = true;
    perbaruiSisaPd();
});
kolomTanggalPd.addEventListener("change", perbaruiSisaPd);

// ----- Baris tujuan, Nilai Pemindahan, dan Total -----
// Tulisan "Ke" baris tujuan: arah ① "Dana Umum" (milik yayasan), arah ② "Divisi ..."
function teksKeTujuanPd() {
    return jenisPd() === "ke-divisi" ? "Divisi " + teksAman(namaDivisiDari(tujuanPd.divisiId)) : NAMA_DANA_UMUM;
}
function gambarTujuanPd() {
    badanRincianPd.textContent = "";
    var nilai = tujuanPd ? (Number(tujuanPd.nilai) || 0) : 0;
    if (!tujuanPd) {
        badanRincianPd.appendChild(barisKosongTabel(4));
    } else {
        var tr = document.createElement("tr");
        tr.className = "jurnal-baris-data";
        tr.tabIndex = 0;
        tr.title = "Klik untuk mengubah";
        var sel = function (teks, kelas) {
            var td = document.createElement("td");
            td.className = kelas;
            td.textContent = teks;   // textContent: aman dari kode HTML
            tr.appendChild(td);
            return td;
        };
        var tdGeser = sel("", "jurnal-kol-geser");
        tdGeser.setAttribute("aria-hidden", "true");
        tdGeser.innerHTML = IKON_GESER;   // ikon tetap
        var tdKe = sel(teksKeTujuanPd(), "jurnal-sel-teks");
        if (jenisPd() === "ke-umum") {
            var label = document.createElement("span");
            label.className = "label-umum-pd";
            label.textContent = "milik yayasan";
            tdKe.appendChild(label);
        }
        sel(teksKasPd(tujuanPd.kasId) || "(Kas/Bank sudah dihapus)", "jurnal-sel-teks");
        sel(formatAngka(nilai), "jurnal-sel-angka");
        tr.appendChild(tombolHapusBaris("Hapus tujuan", function () {
            tujuanPd = null;
            gambarTujuanPd();
        }));
        // Klik atau Enter pada baris: buka popup untuk mengubahnya
        tr.addEventListener("click", function () { bukaTujuanPd(tujuanPd.kasId); });
        tr.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target === tr) { e.preventDefault(); bukaTujuanPd(tujuanPd.kasId); } });
        badanRincianPd.appendChild(tr);
    }
    // Nilai Pemindahan di bagian atas dan Total di bawah = nilai tujuan (hanya dibaca; PRD 6.1)
    document.getElementById("pd-nilai").value = formatAngka(nilai);
    document.getElementById("pd-total").textContent = formatRupiah(nilai);
}

// ----- Cari/Pilih tujuan: Kas/Bank tujuan -----
// Pilihannya akun Kas & Bank tingkat 3, sama dengan pilihan Kas/Bank lain (PRD 5.1): arah ① Kas Dana Umum yang dibuat
// pengguna sendiri, arah ② Kas/Bank Divisi tujuan. Hanya satu tujuan: memilih Kas/Bank lain mengganti tujuannya.
function gambarButirKasPd(li, akun, kata) {
    var nama = document.createElement("div");
    nama.className = "jurnal-pilihan-nama";
    tulisDenganSorot(nama, teksAman(akun.nama), kata);
    var bawah = document.createElement("div");
    bawah.className = "jurnal-pilihan-bawah";
    var kode = document.createElement("span");
    tulisDenganSorot(kode, teksAman(akun.kode), kata);
    var tipe = document.createElement("span");
    tipe.className = "jurnal-pilihan-tipe";
    tipe.textContent = "Kas & Bank";
    bawah.appendChild(kode);
    bawah.appendChild(tipe);
    li.appendChild(nama);
    li.appendChild(bawah);
}
var cariTujuanPd = buatKolomCari({
    kolom: document.getElementById("pd-cari-tujuan"),
    daftar: document.getElementById("pd-daftar-tujuan"),
    ambilData: function () { return akunKasBankPilihan(); },
    cocok: function (a, kata) { return kata === "" || (teksAman(a.kode) + " " + teksAman(a.nama)).toLowerCase().indexOf(kata) !== -1; },
    urut: urutKodeAkun,
    gambarButir: gambarButirKasPd,
    teksKosong: function (adaData) {
        return adaData ? "Tidak ada Kas/Bank yang cocok." : "Belum ada akun Kas & Bank tingkat 3. Buat dulu di Buku Besar, Akun Perkiraan.";
    },
    saatPilih: function (akun) { bukaTujuanPd(akun.id); },
    bolehBuka: function () { return syaratTujuanPd.bolehBuka(); }
});

// Pengaman urutan isian (PRD 5.1/6.1, alat bersama umum/komponen-transaksi.js): tujuan baru bisa dipilih, dan popup
// tujuan bisa dibuka, kalau Dari Program (arah ①), Ambil dari, dan Tanggal sudah terisi. Dengan begitu sisa dana dan
// Kas/Bank asal sudah jelas sebelum nilainya diisi.
var syaratTujuanPd = buatSyaratIsian([
    // Jenis dipilih paling dulu, karena menentukan Ke-nya (Dana Umum atau Divisi); Data Baru dibuka kosong (PRD 5.3a)
    { nama: "Jenis pemindahan", kata: "Pilih", kolom: document.querySelector('#isi-pemindahan-dana input[name="pd-jenis"]'), terisi: function () { return jenisPd() !== ""; } },
    { nama: "Dari Program", kata: "Pilih", kolom: pilihDariPd, terisi: function () { return jenisPd() === "ke-divisi" || pilihDariPd.value !== ""; } },
    { nama: "Ambil dari", kata: "Pilih", kolom: pilihKasAsalPd },
    { nama: "Tanggal", kolom: kolomTanggalPd }
], "memilih tujuan");

// ----- Popup Tujuan Pemindahan -----
var dialogTujuanPd = document.getElementById("dialog-tujuan-pemindahan");
var kolomNilaiTpd = document.getElementById("tpd-nilai");
var galatNilaiTpd = document.getElementById("galat-tpd-nilai");
var pilihDivisiTpd = document.getElementById("tpd-divisi");
var galatDivisiTpd = document.getElementById("galat-tpd-divisi");
var kasDibukaPd = null;   // id Kas/Bank tujuan yang sedang diisi di popup

function bukaTujuanPd(kasId) {
    // Pengaman urutan isian: popup tidak dibuka sebelum isian di atas lengkap (misalnya baris lama diklik sesudah
    // Ambil dari dikosongkan)
    if (!syaratTujuanPd.bolehBuka()) { return; }
    kasDibukaPd = kasId;
    var keDivisi = jenisPd() === "ke-divisi";
    // Arah ①: Ke = Dana Umum (hanya dibaca). Arah ②: Ke Divisi dipilih (wajib).
    document.getElementById("baris-tpd-ke").hidden = keDivisi;
    document.getElementById("baris-tpd-divisi").hidden = !keDivisi;
    isiPilihan(pilihDivisiTpd, bacaDivisi(), { kosong: "Pilih Divisi...", terpilih: tujuanPd ? tujuanPd.divisiId : "" });
    document.getElementById("tpd-kas").value = teksKasPd(kasId);
    // Membuka baris yang sama: isinya tampil. Memilih Kas/Bank lain: nilai dan Divisi lama tetap dibawa (tujuan diganti).
    kolomNilaiTpd.value = tujuanPd ? teksAngkaIsian(tujuanPd.nilai) : "";
    galatNilaiTpd.hidden = true;
    galatDivisiTpd.hidden = true;
    document.getElementById("hapus-tujuan-pemindahan").hidden = !(tujuanPd && tujuanPd.kasId === kasId);
    dialogTujuanPd.showModal();
    (keDivisi && !pilihDivisiTpd.value ? pilihDivisiTpd : kolomNilaiTpd).focus();
}

kolomNilaiTpd.addEventListener("input", function () { galatNilaiTpd.hidden = true; });
pilihDivisiTpd.addEventListener("change", function () { galatDivisiTpd.hidden = true; });
pasangKolomRupiah(kolomNilaiTpd);   // titik ribuan langsung saat mengetik
kolomNilaiTpd.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); simpanTujuanPd(); } });

// Semua sisa: isi Nilai dengan seluruh sisa kantong asal (tetap bisa diubah untuk sebagian)
document.getElementById("tpd-semua-sisa").addEventListener("click", function () {
    var sisa = sisaDanaAsalPd();
    if (sisa === null) {
        tampilkanNotifikasi("Pilih Dari Program dulu, supaya sisa dananya diketahui.", "peringatan");
        return;
    }
    kolomNilaiTpd.value = teksAngkaIsian(Math.max(0, sisa));
    galatNilaiTpd.hidden = true;
    kolomNilaiTpd.focus();
});

// Menutup popup. Penanda dipasang SEBELUM menutup: fokus yang kembali ke kolom cari tidak langsung membuka daftar.
function tutupTujuanPd() {
    kasDibukaPd = null;
    cariTujuanPd.abaikanFokusSebentar();
    dialogTujuanPd.close();
}

// Lanjut: arah ② Divisi wajib; Nilai wajib > 0; lalu tujuan diisi atau diganti
function simpanTujuanPd() {
    if (!kasDibukaPd) { return; }
    var keDivisi = jenisPd() === "ke-divisi";
    var divisi = bacaDivisi().find(function (d) { return d && d.id === pilihDivisiTpd.value; });
    if (keDivisi && !divisi) {
        galatDivisiTpd.textContent = bacaDivisi().length ? "Divisi tujuan wajib dipilih." : "Belum ada Divisi. Buat dulu di Master Data, Divisi.";
        galatDivisiTpd.hidden = false;
        pilihDivisiTpd.focus();
        return;
    }
    var nilai = angkaDariTeks(kolomNilaiTpd.value);
    if (nilai <= 0) {
        galatNilaiTpd.textContent = "Nilai wajib diisi dan lebih dari 0.";
        galatNilaiTpd.hidden = false;
        kolomNilaiTpd.focus();
        return;
    }
    tujuanPd = { kasId: kasDibukaPd, nilai: nilai, divisiId: keDivisi ? divisi.id : "" };
    tutupTujuanPd();
    gambarTujuanPd();
}
document.getElementById("lanjut-tujuan-pemindahan").addEventListener("click", simpanTujuanPd);
document.getElementById("tutup-tujuan-pemindahan").addEventListener("click", tutupTujuanPd);
// Hapus (di popup): buang tujuan
document.getElementById("hapus-tujuan-pemindahan").addEventListener("click", function () {
    tujuanPd = null;
    tutupTujuanPd();
    gambarTujuanPd();
});
// Esc: peristiwa "cancel" datang SEBELUM popup tertutup
dialogTujuanPd.addEventListener("cancel", function () { kasDibukaPd = null; cariTujuanPd.abaikanFokusSebentar(); });

// ----- Menyimpan (PRD 3.1, 4.2, 5.2, 5.3, 6.1) -----
function tampilkanGalatPd(pesan, kolomFokus) {
    var kotak = document.getElementById("pd-pesan-galat");
    kotak.textContent = pesan;   // textContent: aman dari kode HTML
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

// Jurnal otomatis (PRD 4.2), satu jurnal:
//   arah ① : Debit Aset Neto Terikat [Program asal, Divisi Program itu] / Kredit Aset Neto Tidak Terikat [tanpa Divisi,
//            tanpa Program = Dana Umum]
//   arah ② : Debit Aset Neto Tidak Terikat [Dana Umum] / Kredit Aset Neto Tidak Terikat [Divisi tujuan, tanpa Program]
//   uang   : Debit Kas/Bank tujuan / Kredit Kas/Bank asal, tanpa Program dan Divisi (seperti Transfer Bank);
//            tidak dibuat kalau keduanya sama (uangnya memang sudah di sana)
function isiJurnalPemindahan(trx, akun) {
    var keterangan = "Pemindahan Dana " + trx.nomor + ": " + teksAman(trx.alasan);
    var baris = function (a, debit, kredit, programId, divisiId, terikat) {
        return { akunId: a.id, kode: a.kode, nama: a.nama, debit: debit, kredit: kredit,
                 divisiId: divisiId, programId: programId, terikat: terikat, keterangan: keterangan };
    };
    var rincian;
    if (trx.jenis === "ke-divisi") {
        rincian = [
            baris(akun.tidakTerikat, trx.nilai, 0, "", "", false),
            baris(akun.tidakTerikat, 0, trx.nilai, "", trx.keDivisiId, false)
        ];
    } else {
        var program = bacaProgram().find(function (p) { return p && p.id === trx.dariProgramId; });
        rincian = [
            baris(akun.terikat, trx.nilai, 0, trx.dariProgramId, program ? teksAman(program.divisiId) : "", true),
            baris(akun.tidakTerikat, 0, trx.nilai, "", "", false)
        ];
    }
    if (akun.kasTujuan.id !== akun.kasAsal.id) {
        rincian.push({ akunId: akun.kasTujuan.id, kode: akun.kasTujuan.kode, nama: akun.kasTujuan.nama, debit: trx.nilai, kredit: 0, keterangan: keterangan });
        rincian.push({ akunId: akun.kasAsal.id, kode: akun.kasAsal.kode, nama: akun.kasAsal.nama, debit: 0, kredit: trx.nilai, keterangan: keterangan });
    }
    return { nomor: trx.nomor, tanggal: trx.tanggal, rincian: rincian, keterangan: keterangan };
}

document.getElementById("form-pemindahan-dana").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    document.getElementById("pd-pesan-galat").hidden = true;
    var daftar = modulPemindahanDana.ambil();
    var sedangMengubah = (modulPemindahanDana.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (d) { return d.id === modulPemindahanDana.idDiubah; }) : null;
    var tanggal = kolomTanggalPd.value;
    var jenis = jenisPd();

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama.
    // Yang sudah direkonsiliasi tidak bisa diubah sebelum tandanya dibatalkan (PRD 6.3)
    var rekonsiliasi = lama ? galatTransaksiSudahRekonsiliasi(SUMBER_JURNAL_PEMINDAHAN, lama.id, "Pemindahan Dana") : "";
    if (rekonsiliasi) { tampilkanGalatPd(rekonsiliasi); return; }
    if (jenis === "") {
        tampilkanGalatPd("Jenis pemindahan wajib dipilih.", document.querySelector('#isi-pemindahan-dana input[name="pd-jenis"]')); return;
    }
    var program = null;
    if (jenis === "ke-umum") {
        program = bacaProgram().find(function (p) { return p && p.id === pilihDariPd.value; });
        if (!program) { tampilkanGalatPd("Dari Program wajib dipilih.", pilihDariPd); return; }
    }
    var semuaKas = akunKasBankPilihan();
    var kasAsal = semuaKas.find(function (a) { return a.id === pilihKasAsalPd.value; });
    if (!kasAsal) { tampilkanGalatPd("Ambil dari (Kas/Bank) wajib dipilih.", pilihKasAsalPd); return; }
    var galatTanggal = galatTanggalTransaksi(tanggal, lama, { catat: "pemindahan dana", ini: "Pemindahan Dana ini" });
    if (galatTanggal) { tampilkanGalatPd(galatTanggal.pesan, galatTanggal.diKolom ? kolomTanggalPd : null); return; }
    if (!tujuanPd) {
        pilihTabPd("tujuan");
        tampilkanGalatPd("Tujuan masih kosong. Pilih Kas/Bank tujuan lewat kolom cari.", document.getElementById("pd-cari-tujuan")); return;
    }
    var kasTujuan = semuaKas.find(function (a) { return a.id === tujuanPd.kasId; });
    if (!kasTujuan) { pilihTabPd("tujuan"); tampilkanGalatPd("Kas/Bank tujuan sudah tidak ada. Pilih Kas/Bank tujuan lagi."); return; }
    var divisiTujuan = null;
    if (jenis === "ke-divisi") {
        divisiTujuan = bacaDivisi().find(function (d) { return d && d.id === tujuanPd.divisiId; });
        if (!divisiTujuan) { pilihTabPd("tujuan"); tampilkanGalatPd("Divisi tujuan belum dipilih atau sudah dihapus. Klik baris tujuan untuk memilihnya."); return; }
    }
    var nilai = Number(tujuanPd.nilai) || 0;
    if (nilai <= 0) { pilihTabPd("tujuan"); tampilkanGalatPd("Nilai tujuan wajib lebih dari 0. Klik baris tujuan untuk mengisinya."); return; }
    var alasan = kolomAlasanPd.value.trim();
    if (alasan === "") {
        pilihTabPd("info");   // Alasan ada di tab "i" (PRD 6.1)
        tampilkanGalatPd("Alasan wajib diisi (tab Info lainnya).", kolomAlasanPd); return;
    }
    // Preferensi, Lampiran: bila Pemindahan Dana wajib berlampiran, minimal satu file harus ada
    if (lampiranPd.wajibKosong()) { tampilkanGalatPd(lampiranPd.pesanWajib, tombolLampiranPd); return; }
    // Akun Aset Neto untuk jurnal otomatis dipilih sekali di Preferensi (PRD 4.2)
    var akunTerikat = akunAsetNeto("terikat"), akunTidakTerikat = akunAsetNeto("tidak-terikat");
    if (!akunTerikat || !akunTidakTerikat) {
        tampilkanGalatPd("Akun Aset Neto Terikat dan Aset Neto Tidak Terikat belum dipilih. Pilih dulu di Preferensi, Akun Perkiraan, tab Aset Neto."); return;
    }
    // Pengaman: tidak boleh melebihi sisa yang bisa dipindah mulai tanggal ini (pemindahan ini sendiri tidak ikut dihitung)
    var sisa = sisaDanaAsalPd();
    if (nilai > sisa) {
        var namaAsal = jenis === "ke-divisi" ? "Dana Umum" : 'dana Program "' + teksAman(program.nama) + '"';
        tampilkanNotifikasi("Nilai " + formatRupiah(nilai) + " melebihi sisa yang bisa dipindah dari " + namaAsal + " mulai " +
            formatTanggal(tanggal) + ", yaitu " + formatRupiah(Math.max(0, sisa)) + ".", "peringatan");
        return;
    }

    // No Bukti: otomatis atau diketik; unik di antara pemindahan dan di buku jurnal (jurnalnya memakai nomor yang sama)
    var infoNomor = nomorPd.ambil(tanggal);
    if (infoNomor.galat) { tampilkanGalatPd(infoNomor.galat, infoNomor.kolomFokus); return; }
    var noBukti = infoNomor.nomor;
    if (nomorTransaksiTerpakai(noBukti, daftar, modulPemindahanDana.idDiubah, SUMBER_JURNAL_PEMINDAHAN)) {
        tampilkanGalatPd('No Bukti "' + noBukti + '" sudah dipakai (di Pemindahan Dana atau Jurnal Umum).' + (infoNomor.otomatis ? " Matikan Otomatis dan ketik nomor lain." : ""), nomorPd.kolomNomorKembar());
        return;
    }

    var data = {
        nomor: noBukti, nama: noBukti, aturanId: infoNomor.aturanId, tanggal: tanggal, jenis: jenis,
        dariProgramId: program ? program.id : "",
        keDivisiId: divisiTujuan ? divisiTujuan.id : "",
        kasAsalId: kasAsal.id, kasAsal: kasAsal.kode + " - " + kasAsal.nama,
        kasTujuanId: kasTujuan.id, kasTujuan: kasTujuan.kode + " - " + kasTujuan.nama,
        nilai: nilai, total: nilai, alasan: alasan
    };
    Object.assign(data, lampiranPd.infoData());   // hanya keterangan file; isinya disimpan terpisah (umum/lampiran.js)
    var salinanLama = lama ? Object.assign({}, lama) : null;
    var trx;
    if (sedangMengubah) {
        data.diubahPada = waktuSekarang();
        Object.assign(lama, data);
        trx = lama;
    } else {
        data.id = buatId("pd");
        data.dibuatOleh = penggunaAktif;
        data.dibuatPada = waktuSekarang();
        daftar.push(data);
        trx = data;
    }

    // Simpan bersama jurnalnya (alat bersama, umum/komponen-transaksi.js): notifikasi, Log Aktivitas, nomor naik
    var akun = { terikat: akunTerikat, tidakTerikat: akunTidakTerikat, kasAsal: kasAsal, kasTujuan: kasTujuan };
    var berhasil = simpanTransaksiDenganJurnal({
        modul: modulPemindahanDana, kunci: "daftarPemindahanDana", daftar: daftar, trx: trx, sedangMengubah: sedangMengubah, salinanLama: salinanLama,
        sumberJurnal: SUMBER_JURNAL_PEMINDAHAN, isiJurnal: function (t) { return isiJurnalPemindahan(t, akun); },
        nomor: nomorPd, infoNomor: infoNomor, tanggal: tanggal,
        lampiran: lampiranPd, galatLampiran: function (pesan) { tampilkanGalatPd(pesan, tombolLampiranPd); }
    });
    if (berhasil && !sedangMengubah) { pilihKasAsalPd.focus(); }   // siap mencatat pemindahan berikutnya
});

// Setiap tab dibuka: pilihan Program dan Kas/Bank, sisa dana, dan nama di tabel dimuat ulang
saatTabDibuka["pemindahan-dana"] = function () {
    isiPilihanDariPd(pilihDariPd.value);
    isiPilihanKasAsalPd(pilihKasAsalPd.value);
    tampilkanJenisPd();
    nomorPd.segarkan();
    modulPemindahanDana.gambarTabel();
    lampiranPd.perbaruiLencana();   // tanda wajib mengikuti Preferensi terbaru
};

// Dipanggil dari popup Donasi, kotak Pemindahan Dana
function bukaPemindahanDanaBaru() {
    modulPemindahanDana.bukaDariMenu();
    pilihDariPd.focus();
}
