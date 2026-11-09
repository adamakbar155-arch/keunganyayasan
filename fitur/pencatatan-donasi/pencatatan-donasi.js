// ==================== Pencatatan Donasi (Donasi) ====================
// Mencatat donasi uang dalam SATU proses (PRD 6.1): donatur, rincian Kategori Donasi, dan Kas/Bank di satu formulir;
// Simpan langsung membuat jurnal (Debit Kas/Bank, Kredit akun donasi tiap baris).
// Komponen sendiri, bukan komponen bersama Pembayaran/Penerimaan (keputusan pengguna 2026-10-28), tetapi memakai
// alat kecil bersama: buatNomorOtomatis, isiPilihanKasBank, buatPengalihTab, barisKosongTabel, tombolHapusBaris,
// buatKolomCari (umum/komponen-transaksi.js), galatTransaksiSudahRekonsiliasi, isianAwalDariBarisTerakhir,
// usulkanDivisiDariProgram (fitur/jurnal/jurnal.js), namaDonaturDariId dan buatDonaturCepat (fitur/donatur),
// teksSifatKd (fitur/kategori-donasi).
// Bagian 1: tampilan, daftar, isi formulir. Bagian 2: pilihan dan baris. Bagian 3: simpan/ubah/hapus + jurnal otomatis
// (simpanTransaksiDenganJurnal, umum/komponen-transaksi.js). Bagian 4 (menyusul): hubungan dengan Donatur. HTML-nya: fitur/pencatatan-donasi/tampilan.js.
// Satu data tersimpan (kunci daftarDonasi):
//   { id, nomor, nama(=nomor), aturanId, tanggal, donaturId, kasId, kas ("kode - nama"), caraBayar, keterangan,
//     rincian[baris], total, dibuatOleh, dibuatPada, diubahPada }
// Satu baris: { id, kategoriId, akunId, kode, nama, nilai, divisiId, programId, keterangan }
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var kolomTanggalDc = document.getElementById("dc-tanggal");
var pilihKasDc = document.getElementById("dc-kas");
var pilihCaraBayarDc = document.getElementById("dc-cara-bayar");
var kolomKeteranganDc = document.getElementById("dc-keterangan");
var kolomCariDonaturDc = document.getElementById("dc-cari-donatur");
var kolomDonaturDc = document.getElementById("dc-donatur");   // id donatur terpilih (tersembunyi)
var badanRincianDc = document.getElementById("dc-rincian");
var barisDc = [];   // salinan kerja baris donasi yang sedang dibuka

// Jenis sumber jurnal otomatis donasi (jurnal.sumber.jenis), dipakai juga Histori Bank dan Rekonsiliasi Bank
var SUMBER_JURNAL_DONASI = "donasi";

// Cara Bayar: pilihan tetap (PRD 6.1); Data Baru mulai dari "Silakan Pilih" (PRD 5.3a)
var CARA_BAYAR_DONASI = ["Tunai", "Transfer", "QRIS"];
isiPilihan(pilihCaraBayarDc, CARA_BAYAR_DONASI, {
    nilai: function (c) { return c; },
    teks: function (c) { return c; },
    kosong: "Silakan Pilih"
});

// Nama donasi baris-baris rincian, digabung, untuk kolom Kategori Donasi di daftar
function ringkasanKategoriDc(donasi) {
    var nama = [];
    rincianAman(donasi).forEach(function (b) {
        var n = teksAman(b.nama);
        if (n && nama.indexOf(n) === -1) { nama.push(n); }
    });
    return nama.join(", ");
}

// Lampiran file (PRD 5.4): alat bersama umum/lampiran.js; wajib atau tidak menurut Preferensi, Lampiran (Donasi)
var tombolLampiranDc = document.getElementById("dc-tombol-lampiran");
var lampiranDc = buatLampiranTransaksi({ jenis: "donasi", namaFitur: "Pencatatan Donasi", tombol: tombolLampiranDc,
                                         lencana: document.getElementById("dc-lencana-lampiran") });

var modulDonasiCatat = buatModulDaftar({
    id: "donasi-catat",
    judul: "Pencatatan Donasi",
    kunci: "daftarDonasi",
    urutAwal: { kolom: "tanggal", arah: -1 },
    // Label isian untuk rincian Log Aktivitas (donatur dicatat dengan namanya, bukan id-nya)
    labelData: { nomor: "No Bukti", tanggal: "Tanggal", donaturId: "Donatur", kas: "Kas/Bank", caraBayar: "Cara Bayar",
                 keterangan: "Keterangan", ringkasanRincian: "Rincian", total: "Nilai (Rp)",
                 jumlahLampiran: "Jumlah Lampiran", ringkasanLampiran: "Lampiran" },
    formatData: {
        tanggal: function (t) { return formatTanggal(t); },
        donaturId: function (id) { return namaDonaturDariId(id); },
        total: function (n) { return formatRupiah(n); }
    },
    kolom: [
        { kunci: "nomor", judul: "Nomor #" },
        { kunci: "tanggal", judul: "Tanggal", tampil: function (d) { return formatTanggal(d.tanggal); }, urut: function (d) { return d.tanggal || ""; } },
        { kunci: "donatur", judul: "Donatur", tampil: function (d) { return namaDonaturDariId(d.donaturId); } },
        { kunci: "kas", judul: "Kas/Bank" },
        { kunci: "caraBayar", judul: "Cara Bayar" },
        { kunci: "kategori", judul: "Kategori Donasi", tampil: ringkasanKategoriDc },
        { kunci: "keterangan", judul: "Keterangan" },
        // Pengurutan daftar membandingkan teks, jadi angka diberi nol di depan (seperti kolom Nilai di Pembayaran)
        { kunci: "total", judul: "Nilai", rata: "kanan", tampil: function (d) { return formatAngka(d.total || 0); }, urut: function (d) { return String(d.total || 0).padStart(18, "0"); } }
    ],
    filter: [
        // Nilai "2026-10" supaya urut menurut waktu; tampil "Okt 2026". Terbaru di atas (seperti Pembayaran).
        { judul: "Tanggal", ambil: function (d) { return teksAman(d.tanggal).slice(0, 7); }, tampil: teksBulanTahun, turun: true },
        { judul: "Cara Bayar", ambil: function (d) { return teksAman(d.caraBayar); } },
        { judul: "Kas/Bank", ambil: function (d) { return teksAman(d.kas); } }
    ],
    pesanKosong: "Belum ada donasi. Klik tombol + untuk mencatat.",
    // Donasi yang sudah direkonsiliasi (PRD 6.3) atau bertanggal terkunci (PRD 5.3) tidak boleh dihapus, seperti Pembayaran
    alasanTolakHapus: function (d) {
        var rekonsiliasi = galatTransaksiSudahRekonsiliasi(SUMBER_JURNAL_DONASI, d.id, "Pencatatan Donasi");
        if (rekonsiliasi) { return rekonsiliasi; }
        return tanggalTerkunci(d.tanggal)
            ? 'Pencatatan Donasi "' + teksAman(d.nomor) + '" bertanggal ' + formatTanggal(d.tanggal) + " yang sudah terkunci (Preferensi, Pembatasan), jadi tidak bisa dihapus."
            : "";
    },
    // Menghapus donasi ikut menghapus jurnal otomatisnya (PRD 3.1 butir 3) dan isi file lampirannya
    saatDihapus: function (d) {
        modulJurnal.simpan(daftarJurnalTanpaOtomatis({ jenis: SUMBER_JURNAL_DONASI, id: d.id }));
        hapusIsiLampiran(d.id);
    },
    isiForm: function (data) {
        kolomTanggalDc.value = data ? teksAman(data.tanggal) : "";   // Data Baru dibuka kosong (PRD 5.3a)
        aturBatasTanggal(kolomTanggalDc);
        // Data Baru: nomor otomatis. Data tersimpan: nomornya tampil di kolom nomor dan boleh diubah.
        nomorDc.mulai(data ? data.nomor : "");
        isiPilihanKasDc(data ? data.kasId : "");
        tampilkanDonaturDc(data ? data.donaturId : "");
        pilihCaraBayarDc.value = data && CARA_BAYAR_DONASI.indexOf(data.caraBayar) !== -1 ? data.caraBayar : "";
        kolomKeteranganDc.value = data ? teksAman(data.keterangan) : "";
        // Status rekonsiliasi (hanya dibaca): jurnal donasi ini sudah ditandai cocok di Rekonsiliasi Bank atau belum
        document.getElementById("dc-rekonsiliasi").textContent =
            data && galatTransaksiSudahRekonsiliasi(SUMBER_JURNAL_DONASI, data.id, "Pencatatan Donasi") ? "Sudah" : "Belum";
        barisDc = rincianAman(data).map(function (b) { return Object.assign({}, b); });
        // Daftar pilihan yang masih terbuka ditutup; kolom cari kategori dikosongkan
        cariDonaturDc.tutup();
        cariKategoriDc.tutup();
        document.getElementById("dc-cari-kategori").value = "";
        gambarRincianDc();
        lampiranDc.muat(data);   // Data Baru: kosong; data tersimpan: lampirannya
        document.getElementById("dc-pesan-galat").hidden = true;
        pilihTabDc("rincian");
    },
    // Baris donasi dan lampiran ikut diingat per tab (PRD 6.10)
    keadaanTambahan: {
        ambil: function () { return { baris: barisDc.map(function (b) { return Object.assign({}, b); }), lampiran: lampiranDc.kerja() }; },
        pakai: function (simpanan) {
            barisDc = simpanan.baris.map(function (b) { return Object.assign({}, b); });
            gambarRincianDc();
            lampiranDc.atur(simpanan.lampiran);
        }
    }
});

// Jurnal otomatis donasi bisa ditelusuri balik (pesan "ubah lewat halaman ...", Histori Bank, Rekonsiliasi Bank)
daftarkanAsalJurnal(SUMBER_JURNAL_DONASI, { nama: "Pencatatan Donasi", modul: modulDonasiCatat, tab: "donasi-catat" });

// Tab samping: Rincian Donasi dan Info lainnya ("i")
var pilihTabDc = buatPengalihTab(document.querySelectorAll("#isi-donasi-catat [data-dc-tab]"), "dcTab",
    { rincian: "dc-panel-rincian", info: "dc-panel-info" });

// Kas/Bank = akun Kas & Bank tingkat 3 (alat bersama isiPilihanKasBank, umum/komponen-transaksi.js; PRD 5.1)
function isiPilihanKasDc(idTerpilih) {
    isiPilihanKasBank(pilihKasDc, {
        terpilih: idTerpilih,
        nonaktifKalauKosong: true,
        petunjuk: document.getElementById("petunjuk-dc-kas")
    });
}

// No Bukti: otomatis dari aturan penomoran bertipe Donasi (Pengaturan, Penomoran), atau diketik sendiri
var nomorDc = buatNomorOtomatis({
    saklar: document.getElementById("dc-nomor-otomatis"),
    pilihan: document.getElementById("dc-aturan-nomor"),
    kolom: document.getElementById("dc-nomor"),
    contoh: document.getElementById("dc-contoh-nomor"),
    tanggal: kolomTanggalDc,
    tipe: "donasi",
    namaTipe: "Donasi"
});
// No Bukti mengikuti Kas/Bank yang dipilih (seperti Pembayaran, PRD 6.3); tetap bisa diganti atau diketik sendiri
pilihKasDc.addEventListener("change", function () { nomorDc.ikutKas(pilihKasDc.value); });

// ----- Tabel rincian dan total -----
function gambarRincianDc() {
    badanRincianDc.textContent = "";
    var total = 0;
    if (barisDc.length === 0) { badanRincianDc.appendChild(barisKosongTabel(4)); }
    barisDc.forEach(function (b) {
        total += Number(b.nilai) || 0;
        var tr = document.createElement("tr");
        tr.className = "jurnal-baris-data";
        tr.tabIndex = 0;
        tr.title = "Klik untuk mengubah";
        function sel(teks, kelas) {
            var td = document.createElement("td");
            td.className = kelas;
            td.textContent = teks;   // textContent: aman dari kode HTML
            tr.appendChild(td);
            return td;
        }
        var tdGeser = sel("", "jurnal-kol-geser");
        tdGeser.setAttribute("aria-hidden", "true");
        tdGeser.innerHTML = IKON_GESER;   // ikon tetap
        sel(teksAman(b.kode), "jurnal-sel-teks jurnal-sel-kode");
        sel(teksAman(b.nama), "jurnal-sel-teks");
        sel(formatAngka(b.nilai), "jurnal-sel-angka");
        tr.appendChild(tombolHapusBaris("Hapus baris " + teksAman(b.kode) + " " + teksAman(b.nama), function () {
            barisDc = barisDc.filter(function (x) { return x.id !== b.id; });
            gambarRincianDc();
        }));
        // Klik atau Enter pada baris: buka popup untuk mengubahnya
        tr.addEventListener("click", function () { bukaRincianDc(null, b); });
        tr.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target === tr) { e.preventDefault(); bukaRincianDc(null, b); } });
        badanRincianDc.appendChild(tr);
    });
    // Seperti Accurate: "1 Rincian Donasi", "2 Rincian Donasi", ...
    document.getElementById("dc-jumlah").textContent = barisDc.length ? barisDc.length + " " : "";
    document.getElementById("dc-total").textContent = formatRupiah(total);
    // Nilai Pembayaran di bagian atas = jumlah rincian (hanya dibaca; PRD 6.1)
    document.getElementById("dc-nilai-bayar").value = formatAngka(total);
}

// ----- Cari/Pilih Donatur (PRD 6.1) -----
// Hanya donatur yang tidak Non Aktif. Yang disimpan id-nya (kolom tersembunyi dc-donatur); kolom cari hanya menampilkan nama.
// Kalau nama yang diketik tidak ada, tombol 'Simpan "..." sebagai data baru?' langsung membuat donatur baru (buatDonaturCepat).
// Donatur terpilih tampil sebagai label "[ID] Nama ×" di kolom (alat bersama buatChipPilihan; PRD 5.1).
// Mengetik di kolom atau klik × melepas pilihan, supaya id tersimpan dan nama yang tampil tidak berbeda.
var chipDonaturDc = buatChipPilihan({
    kolom: kolomCariDonaturDc,
    saatLepas: function () { kolomDonaturDc.value = ""; }
});
function teksChipDonaturDc(donatur) {
    return "[" + teksAman(donatur.idDonatur) + "] " + teksAman(donatur.nama);
}
function pilihDonaturDc(donatur) {
    kolomDonaturDc.value = donatur.id;
    chipDonaturDc.tampilkan(teksChipDonaturDc(donatur));
    document.getElementById("dc-pesan-galat").hidden = true;
}
// Mengisi kolom Donatur dari id tersimpan (membuka donasi lama, atau tab dibuka lagi sesudah nama diganti di Donatur)
function tampilkanDonaturDc(id) {
    kolomDonaturDc.value = teksAman(id);
    var donatur = bacaDonatur().find(function (d) { return d && d.id === id; });
    if (donatur) {
        chipDonaturDc.tampilkan(teksChipDonaturDc(donatur));
    } else {
        chipDonaturDc.kosongkan();
        // Donatur sudah dihapus: tetap tampil sebagai tulisan supaya terlihat (namaDonaturDariId)
        kolomCariDonaturDc.value = id ? namaDonaturDariId(id) : "";
    }
}
function gambarButirDonaturDc(li, donatur, kata) {
    var nama = document.createElement("div");
    nama.className = "jurnal-pilihan-nama";
    tulisDenganSorot(nama, teksAman(donatur.nama), kata);
    var bawah = document.createElement("div");
    bawah.className = "jurnal-pilihan-bawah";
    tulisDenganSorot(bawah, teksAman(donatur.idDonatur), kata);
    li.appendChild(nama);
    li.appendChild(bawah);
}
var cariDonaturDc = buatKolomCari({
    kolom: kolomCariDonaturDc,
    daftar: document.getElementById("dc-daftar-donatur"),
    ambilData: function () { return bacaDonatur().filter(function (d) { return d && typeof d === "object" && !d.nonAktif; }); },
    cocok: function (d, kata) { return kata === "" || (teksAman(d.nama) + " " + teksAman(d.idDonatur)).toLowerCase().indexOf(kata) !== -1; },
    urut: function (a, b) { return teksAman(a.nama).localeCompare(teksAman(b.nama), "id"); },
    gambarButir: gambarButirDonaturDc,
    teksKosong: function () { return "Tidak ditemukan data yang cocok"; },
    saatPilih: pilihDonaturDc,
    tambahBaru: {
        nama: function (d) { return d.nama; },   // tombol tetap muncul selama belum ada donatur bernama sama persis
        saatKlik: function (nama) {
            var baru = buatDonaturCepat(nama);   // fitur/donatur/donatur.js
            if (!baru) { return; }
            pilihDonaturDc(baru);
            tampilkanNotifikasi('Donatur "' + baru.nama + '" telah disimpan sebagai data baru (' + baru.idDonatur + ").");
        }
    }
});

// Kolom diketik (juga saat tidak ada label, misalnya donatur lama yang sudah dihapus): pilihan lama dilepas
kolomCariDonaturDc.addEventListener("input", function () { kolomDonaturDc.value = ""; });

// ----- Cari/Pilih Kategori Donasi (PRD 6.1) -----
// Hanya Kategori Donasi yang akunnya ada di kolom Donasi Terikat atau Tidak Terikat di Preferensi (sifatnya jelas)
// dan akunnya masih ada di Akun Perkiraan.
function kategoriDonasiPilihanDc() {
    var adaAkun = {};
    bacaDaftarAkun().forEach(function (a) { adaAkun[a.id] = true; });
    return bacaKategoriDonasi().filter(function (k) {
        return k && typeof k === "object" && adaAkun[k.akunId] && sifatAkunDonasi(teksAman(k.kode)) !== "";
    });
}
function gambarButirKategoriDc(li, kategori, kata) {
    var nama = document.createElement("div");
    nama.className = "jurnal-pilihan-nama";
    tulisDenganSorot(nama, teksAman(kategori.nama), kata);
    var bawah = document.createElement("div");
    bawah.className = "jurnal-pilihan-bawah";
    var kode = document.createElement("span");
    tulisDenganSorot(kode, teksAman(kategori.kode), kata);
    var sifat = document.createElement("span");
    sifat.className = "jurnal-pilihan-tipe";
    sifat.textContent = teksSifatKd(kategori);   // Terikat / Tidak Terikat (fitur/kategori-donasi)
    bawah.appendChild(kode);
    bawah.appendChild(sifat);
    li.appendChild(nama);
    li.appendChild(bawah);
}
var cariKategoriDc = buatKolomCari({
    kolom: document.getElementById("dc-cari-kategori"),
    daftar: document.getElementById("dc-daftar-kategori"),
    ambilData: kategoriDonasiPilihanDc,
    cocok: function (k, kata) { return kata === "" || (teksAman(k.nama) + " " + teksAman(k.kode)).toLowerCase().indexOf(kata) !== -1; },
    urut: function (a, b) { return teksAman(a.kode).localeCompare(teksAman(b.kode), "id"); },
    gambarButir: gambarButirKategoriDc,
    teksKosong: function (adaData) {
        return adaData ? "Tidak ada Kategori Donasi yang cocok."
            : "Belum ada Kategori Donasi yang bisa dipilih. Buat di Donasi, Kategori Donasi, lalu masukkan akunnya ke kolom Donasi Terikat atau Tidak Terikat di Preferensi, Akun Perkiraan.";
    },
    saatPilih: function (kategori) { bukaRincianDc(kategori, null); },
    // Pengaman urutan isian (alat bersama, umum/komponen-transaksi.js): Donatur, Kas/Bank, Tanggal dulu
    bolehBuka: buatSyaratIsian([
        { nama: "Donatur", kata: "Pilih", kolom: kolomCariDonaturDc, terisi: function () { return kolomDonaturDc.value !== ""; } },
        { nama: "Kas/Bank", kata: "Pilih", kolom: pilihKasDc },
        { nama: "Tanggal", kolom: kolomTanggalDc }
    ], "memilih Kategori Donasi").bolehBuka
});

// ----- Popup Rincian Donasi -----
var dialogRincianDc = document.getElementById("dialog-rincian-donasi-catat");
var kolomNilaiRdc = document.getElementById("rdc-nilai");
var pilihDivisiRdc = document.getElementById("rdc-divisi");
var pilihProgramRdc = document.getElementById("rdc-program");
var galatRdc = { nilai: document.getElementById("galat-rdc-nilai") };   // Divisi kosong: notifikasi pojok kanan (PRD 5.1)
var rincianDibukaDc = null;   // { kategori, baris } yang sedang diisi

var pilihTabRdc = buatPengalihTab(dialogRincianDc.querySelectorAll("[data-rdc-tab]"), "rdcTab",
    { rincian: "rdc-panel-rincian", info: "rdc-panel-info" });

// kategori = Kategori Donasi baru dipilih (baris baru); b = baris yang sudah ada (diubah)
function bukaRincianDc(kategori, b) {
    rincianDibukaDc = { kategori: kategori, baris: b };
    document.getElementById("rdc-kode").textContent = teksAman(b ? b.kode : kategori.kode);
    document.getElementById("rdc-nama").value = teksAman(b ? b.nama : kategori.nama);
    kolomNilaiRdc.value = b ? teksAngkaIsian(b.nilai) : "";
    // Baris baru mengikuti Divisi dan Program baris terakhir (alat bersama Jurnal Umum); tetap bisa diubah
    var awal = b ? { divisiId: b.divisiId, programId: b.programId } : isianAwalDariBarisTerakhir(barisDc);
    isiPilihan(pilihDivisiRdc, bacaDivisi(), { kosong: "Pilih Divisi...", terpilih: awal.divisiId });
    isiPilihan(pilihProgramRdc, daftarProgramPilihan(awal.programId), { kosong: "(Tanpa Program)", terpilih: awal.programId });
    document.getElementById("rdc-keterangan").value = b ? teksAman(b.keterangan) : "";
    document.getElementById("hapus-rincian-donasi-catat").hidden = !b;
    galatRdc.nilai.hidden = true;
    pilihTabRdc("rincian");
    dialogRincianDc.showModal();
    kolomNilaiRdc.focus();
}

// Program dipilih dan Divisi masih kosong: Divisi diusulkan dari Program (tetap bisa diubah)
pilihProgramRdc.addEventListener("change", function () { usulkanDivisiDariProgram(pilihProgramRdc, pilihDivisiRdc); });
kolomNilaiRdc.addEventListener("input", function () { galatRdc.nilai.hidden = true; });
pasangKolomRupiah(kolomNilaiRdc);   // titik ribuan langsung saat mengetik
kolomNilaiRdc.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); simpanRincianDc(); } });

// Menutup popup. Penanda dipasang SEBELUM menutup: fokus yang kembali ke kolom cari tidak langsung membuka daftar.
function tutupRincianDc() {
    rincianDibukaDc = null;
    cariKategoriDc.abaikanFokusSebentar();
    dialogRincianDc.close();
}

// Lanjut: Nilai wajib > 0 dan Divisi wajib (PRD 6.1), lalu tambah baris baru atau perbarui baris yang dibuka
function simpanRincianDc() {
    if (!rincianDibukaDc) { return; }
    var nilai = angkaDariTeks(kolomNilaiRdc.value);
    if (nilai <= 0) {
        pilihTabRdc("rincian");
        galatRdc.nilai.textContent = "Nilai wajib diisi dan lebih dari 0.";
        galatRdc.nilai.hidden = false;
        kolomNilaiRdc.focus();
        return;
    }
    // Divisi wajib, diperiksa saat Lanjut dengan aturan dan peringatan bersama (notifikasi pojok kanan; PRD 5.1)
    var akunBarisRdc = rincianDibukaDc.baris ? rincianDibukaDc.baris.akunId : rincianDibukaDc.kategori.akunId;
    var kurang = pesanIsianBarisBelumLengkap({ akunId: akunBarisRdc, divisiId: pilihDivisiRdc.value }, false);
    if (kurang) {
        pilihTabRdc("info");
        tampilkanNotifikasi(kurang, "peringatan");
        pilihDivisiRdc.focus();
        return;
    }
    var data = {
        nilai: nilai,
        divisiId: pilihDivisiRdc.value,
        programId: pilihProgramRdc.value,
        keterangan: document.getElementById("rdc-keterangan").value.trim()
    };
    var baru = !rincianDibukaDc.baris;
    if (baru) {
        var k = rincianDibukaDc.kategori;
        barisDc.push(Object.assign({ id: buatId("rd"), kategoriId: k.id, akunId: k.akunId, kode: teksAman(k.kode), nama: teksAman(k.nama) }, data));
    } else {
        Object.assign(rincianDibukaDc.baris, data);
    }
    tutupRincianDc();
    gambarRincianDc();
    if (baru) { cariKategoriDc.fokusUlang(); }   // siap memilih kategori berikutnya
}
document.getElementById("lanjut-rincian-donasi-catat").addEventListener("click", simpanRincianDc);
document.getElementById("tutup-rincian-donasi-catat").addEventListener("click", tutupRincianDc);
// Hapus (di popup): buang baris yang sedang dibuka
document.getElementById("hapus-rincian-donasi-catat").addEventListener("click", function () {
    if (!rincianDibukaDc || !rincianDibukaDc.baris) { return; }
    var id = rincianDibukaDc.baris.id;
    barisDc = barisDc.filter(function (x) { return x.id !== id; });
    tutupRincianDc();
    gambarRincianDc();
});
// Esc: peristiwa "cancel" datang SEBELUM popup tertutup
dialogRincianDc.addEventListener("cancel", function () { rincianDibukaDc = null; cariKategoriDc.abaikanFokusSebentar(); });

// ----- Menyimpan (PRD 3.1, 4.2, 5.2, 5.3, 6.1) -----
function tampilkanGalatDc(pesan, kolomFokus) {
    var kotak = document.getElementById("dc-pesan-galat");
    kotak.textContent = pesan;   // textContent: aman dari kode HTML
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

// Ringkasan rincian untuk Log Aktivitas: "41010101 Infaq Umum 150.000; 41010102 Wakaf 50.000"
function ringkasanRincianDc(rincian) {
    return rincian.map(function (b) { return b.kode + " " + b.nama + " " + formatAngka(b.nilai); }).join("; ");
}

// Jurnal otomatis (PRD 4.2): Debit Kas/Bank sebesar Total; Kredit akun donasi tiap baris membawa Divisi, Program,
// Keterangan baris. Terikat atau tidaknya baris ditentukan oleh kolom Preferensi tempat akun donasinya berada (PRD 6.1),
// jadi tanda "terikat" di baris jurnal diambil dari sifatAkunDonasi, bukan dari centang.
function isiJurnalDonasi(trx, kas) {
    var rincian = trx.rincian.map(function (b) {
        return { akunId: b.akunId, kode: b.kode, nama: b.nama, debit: 0, kredit: b.nilai,
                 divisiId: b.divisiId, programId: b.programId, terikat: sifatAkunDonasi(b.kode) === "terikat",
                 keterangan: b.keterangan || trx.keterangan };
    });
    rincian.unshift({ akunId: kas.id, kode: kas.kode, nama: kas.nama, debit: trx.total, kredit: 0,
                      keterangan: "Pencatatan Donasi " + trx.nomor });   // baris Debit selalu di atas
    var keterangan = trx.keterangan || ("Donasi dari " + namaDonaturDariId(trx.donaturId));
    return { nomor: trx.nomor, tanggal: trx.tanggal, rincian: rincian, keterangan: keterangan };
}

document.getElementById("form-donasi-catat").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    document.getElementById("dc-pesan-galat").hidden = true;
    var daftar = modulDonasiCatat.ambil();
    var sedangMengubah = (modulDonasiCatat.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (d) { return d.id === modulDonasiCatat.idDiubah; }) : null;
    var tanggal = kolomTanggalDc.value;

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama.
    // Donasi yang sudah direkonsiliasi tidak bisa diubah sebelum tandanya dibatalkan (PRD 6.3)
    var rekonsiliasi = lama ? galatTransaksiSudahRekonsiliasi(SUMBER_JURNAL_DONASI, lama.id, "Pencatatan Donasi") : "";
    if (rekonsiliasi) { tampilkanGalatDc(rekonsiliasi); return; }
    // Donatur wajib dan masih ada. Yang Non Aktif tidak boleh dipilih untuk donasi baru, tetapi donasi lama yang memang
    // memakai donatur itu tetap boleh disimpan ulang (PRD 6.1).
    var donaturId = kolomDonaturDc.value;
    var donatur = bacaDonatur().find(function (d) { return d && d.id === donaturId; });
    if (!donatur) { tampilkanGalatDc("Donatur wajib dipilih.", kolomCariDonaturDc); return; }
    if (donatur.nonAktif && !(lama && lama.donaturId === donatur.id)) {
        tampilkanGalatDc('Donatur "' + teksAman(donatur.nama) + '" sudah Non Aktif. Pilih donatur lain.', kolomCariDonaturDc); return;
    }
    var kas = akunKasBankPilihan().find(function (a) { return a.id === pilihKasDc.value; });
    if (!kas) { tampilkanGalatDc("Kas/Bank wajib dipilih.", pilihKasDc); return; }
    var galatTanggal = galatTanggalTransaksi(tanggal, lama, { catat: "donasi", ini: "Pencatatan Donasi ini" });
    if (galatTanggal) { tampilkanGalatDc(galatTanggal.pesan, galatTanggal.diKolom ? kolomTanggalDc : null); return; }
    // Cara Bayar ada di tab Info lainnya; Data Baru dibuka kosong (PRD 5.3a)
    if (CARA_BAYAR_DONASI.indexOf(pilihCaraBayarDc.value) === -1) {
        pilihTabDc("info");
        tampilkanGalatDc("Cara Bayar wajib dipilih (tab Info lainnya).", pilihCaraBayarDc); return;
    }
    if (barisDc.length === 0) {
        pilihTabDc("rincian");
        tampilkanGalatDc("Rincian Donasi masih kosong. Pilih Kategori Donasi lewat kolom cari.", document.getElementById("dc-cari-kategori")); return;
    }
    // Akun donasi tiap baris masih ada, dan Divisi-nya masih ada (bisa saja dihapus di halaman lain sejak baris diisi)
    var semuaAkun = bacaDaftarAkun();
    var hilang = barisDc.find(function (b) { return !semuaAkun.some(function (a) { return a.id === b.akunId; }); });
    if (hilang) { pilihTabDc("rincian"); tampilkanGalatDc("Akun " + teksAman(hilang.kode) + " " + teksAman(hilang.nama) + " sudah tidak ada. Hapus baris itu dulu."); return; }
    // Divisi wajib di setiap baris (alat bersama, sama dengan Jurnal Umum/Pembayaran/Penerimaan; PRD 5.1). Terikat atau
    // tidaknya donasi ditentukan akunnya, jadi bagian Dana tidak dipakai di sini.
    var belumLengkap = pesanBarisBelumLengkap(barisDc, false);
    if (belumLengkap) { pilihTabDc("rincian"); tampilkanNotifikasi(belumLengkap, "peringatan"); return; }
    // Preferensi, Lampiran: bila donasi wajib berlampiran, minimal satu file harus ada
    if (lampiranDc.wajibKosong()) { tampilkanGalatDc(lampiranDc.pesanWajib, tombolLampiranDc); return; }

    // No Bukti: otomatis atau diketik; unik di antara donasi dan di buku jurnal (jurnalnya memakai nomor yang sama)
    var infoNomor = nomorDc.ambil(tanggal);
    if (infoNomor.galat) { tampilkanGalatDc(infoNomor.galat, infoNomor.kolomFokus); return; }
    var noBukti = infoNomor.nomor;
    if (nomorTransaksiTerpakai(noBukti, daftar, modulDonasiCatat.idDiubah, SUMBER_JURNAL_DONASI)) {
        tampilkanGalatDc('No Bukti "' + noBukti + '" sudah dipakai (di Pencatatan Donasi atau Jurnal Umum).' + (infoNomor.otomatis ? " Matikan Otomatis dan ketik nomor lain." : ""), nomorDc.kolomNomorKembar());
        return;
    }

    var total = barisDc.reduce(function (n, b) { return n + (Number(b.nilai) || 0); }, 0);
    var data = {
        nomor: noBukti, nama: noBukti, aturanId: infoNomor.aturanId,
        tanggal: tanggal, donaturId: donatur.id, kasId: kas.id, kas: kas.kode + " - " + kas.nama,
        caraBayar: pilihCaraBayarDc.value,   // sudah diperiksa di atas
        keterangan: kolomKeteranganDc.value.trim(),
        rincian: barisDc.map(function (b) { return Object.assign({}, b); }),
        jumlahBaris: barisDc.length, total: total,
        ringkasanRincian: ringkasanRincianDc(barisDc)
    };
    Object.assign(data, lampiranDc.infoData());   // hanya keterangan file; isinya disimpan terpisah (umum/lampiran.js)
    var salinanLama = lama ? Object.assign({}, lama) : null;
    var trx;
    if (sedangMengubah) {
        data.diubahPada = waktuSekarang();
        Object.assign(lama, data);
        trx = lama;
    } else {
        data.id = buatId("dc");
        data.dibuatOleh = penggunaAktif;
        data.dibuatPada = waktuSekarang();
        daftar.push(data);
        trx = data;
    }

    // Simpan donasi bersama jurnalnya (alat bersama, umum/komponen-transaksi.js): notifikasi, Log Aktivitas, nomor naik
    var berhasil = simpanTransaksiDenganJurnal({
        modul: modulDonasiCatat, kunci: "daftarDonasi", daftar: daftar, trx: trx, sedangMengubah: sedangMengubah, salinanLama: salinanLama,
        sumberJurnal: SUMBER_JURNAL_DONASI, isiJurnal: function (t) { return isiJurnalDonasi(t, kas); },
        nomor: nomorDc, infoNomor: infoNomor, tanggal: tanggal,
        lampiran: lampiranDc, galatLampiran: function (pesan) { tampilkanGalatDc(pesan, tombolLampiranDc); }
    });
    if (berhasil && !sedangMengubah) { kolomCariDonaturDc.focus(); }   // siap mencatat donasi berikutnya
});

// Kas/Bank, aturan nomor, dan nama donatur bisa berubah di halaman lain: muat ulang tiap tab dibuka
saatTabDibuka["donasi-catat"] = function () {
    modulDonasiCatat.gambarTabel();
    nomorDc.segarkan();
    isiPilihanKasDc(pilihKasDc.value);
    if (kolomDonaturDc.value) { tampilkanDonaturDc(kolomDonaturDc.value); }   // nama bisa saja baru diganti di Donatur
    gambarRincianDc();
    lampiranDc.perbaruiLencana();   // tanda wajib mengikuti Preferensi terbaru
};

// Dipanggil dari popup Donasi, kotak Pencatatan Donasi
function bukaPencatatanDonasiBaru() {
    modulDonasiCatat.bukaDariMenu();
    kolomCariDonaturDc.focus();
}
