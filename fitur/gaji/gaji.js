// ==================== Pencatatan Gaji (Buku Besar) ====================
// Berisi: formulir Pencatatan Gaji (tipe, periode, nomor, tanggal, jatuh tempo), pencarian karyawan, popup Rincian
// Karyawan, simpan/ubah/hapus, status bayar, dan tombol Proses (aktif tanpa harus disimpan dulu; menyimpan otomatis).
// Skema A (PRD 3.3, 4.2, 6.2): Pencatatan Gaji hanya catatan rinci per karyawan dan dasar slip gaji, TANPA jurnal.
// Gaji dibayar lewat formulir Pembayaran (baris Beban Gaji yang menyimpan gajiId), boleh beberapa kali sampai lunas;
// jurnalnya dibuat oleh Pembayaran. Yang belum ada: Proses > Gaji membuka Pembayaran (H3.5), komponen yang bisa
// diatur (H3.2), cetak slip (H3.6), lampiran, Ambil (tombolnya memberi tahu "belum tersedia").
// HTML-nya ada di fitur/gaji/tampilan.js. Dimuat sesudah fitur/jurnal/jurnal.js (memakai modulJurnal untuk
// membersihkan jurnal gaji skema lama) dan sebelum fitur/pembayaran (Pembayaran dibaca lewat bacaDaftarTersimpan).
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// Satu pencatatan: { id, nomor, nama(=nomor), aturanId, tipe, bulan, tahun, periode ("Oktober 2026"), tanggal, jatuhTempo,
//   akunBebanId (akun baris saat dibayar lewat Pembayaran; tidak dijurnal di sini), catatan, rincian[baris karyawan], jumlahKaryawan, totalBruto, totalPotongan, totalDibayarkan, ringkasanRincian,
//   dibuatOleh, dibuatPada, diubahPada }
// Satu baris karyawan: { id, karyawanId, nama, jabatan, gajiPokok, tunjJabatan, tunjMakan, tunjTransport, pengurangan, iuran, catatan }
var komponenGaji = [
    { kunci: "gajiPokok",     label: "Gaji Pokok",                arah: "pendapatan" },
    { kunci: "tunjJabatan",   label: "Tunjangan Jabatan",         arah: "pendapatan" },
    { kunci: "tunjMakan",     label: "Tunjangan Makan",           arah: "pendapatan" },
    { kunci: "tunjTransport", label: "Tunjangan Transportasi",    arah: "pendapatan" },
    { kunci: "pengurangan",   label: "Pengurangan Gaji",          arah: "potongan" },
    { kunci: "iuran",         label: "Iuran Bulanan dan lainnya", arah: "potongan" }
];
var namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
var barisGaji = [];   // salinan kerja baris karyawan pencatatan yang sedang dibuka
var badanRincianGaji = document.getElementById("pgaji-rincian");
var kolomTanggalGaji = document.getElementById("pgaji-tanggal");
var kolomTempoGaji = document.getElementById("pgaji-jatuh-tempo");
var pilihBulanGaji = document.getElementById("pgaji-bulan");
var pilihTahunGaji = document.getElementById("pgaji-tahun");
var pilihTipeGajiBayar = document.getElementById("pgaji-tipe");
var pilihBebanGaji = document.getElementById("pgaji-beban");
var tombolProsesGaji = document.getElementById("pgaji-proses");
var menuProsesGaji = document.getElementById("pgaji-proses-menu");

// Hitungan satu baris: bruto = jumlah pendapatan, potongan = jumlah potongan, dibayarkan = bruto - potongan
function hitungBarisGaji(b) {
    var bruto = 0, potongan = 0;
    komponenGaji.forEach(function (k) {
        var nilai = Number(b[k.kunci]) || 0;
        if (k.arah === "pendapatan") { bruto += nilai; } else { potongan += nilai; }
    });
    return { bruto: bruto, potongan: potongan, dibayarkan: bruto - potongan };
}

// Rupiah dengan tanda minus kalau negatif (potongan lebih besar dari pendapatan)
function teksRupiahGaji(n) { return (n < 0 ? "-" : "") + formatAngka(Math.abs(n)); }

// ----- Status bayar (PRD 3.3) -----
// Dihitung dari baris Pembayaran yang menyimpan gajiId pencatatan ini. Pembayaran dibaca langsung dari penyimpanan,
// karena fitur/pembayaran dimuat sesudah file ini. Hasil: { dibayar, sisa, teks: "Belum dibayar" | "Sebagian" | "Lunas" }.
function statusBayarGaji(gaji) {
    var dibayar = 0;
    bacaDaftarTersimpan("daftarPembayaran").forEach(function (bayar) {
        rincianAman(bayar).forEach(function (b) { if (b.gajiId === gaji.id) { dibayar += Number(b.nilai) || 0; } });
    });
    var total = Number(gaji.totalDibayarkan) || 0;
    var teks = dibayar <= 0 ? "Belum dibayar" : (dibayar >= total ? "Lunas" : "Sebagian");
    return { dibayar: dibayar, sisa: Math.max(0, total - dibayar), teks: teks };
}

// Lampiran file (PRD 5.4): alat bersama umum/lampiran.js; wajib atau tidak menurut Preferensi, Lampiran (Pencatatan Gaji)
var tombolLampiranGaji = document.getElementById("pgaji-tombol-lampiran");
var lampiranGaji = buatLampiranTransaksi({ jenis: "gaji", namaFitur: "Pencatatan Gaji", tombol: tombolLampiranGaji,
                                           lencana: document.getElementById("pgaji-lencana-lampiran") });

var modulPgaji = buatModulDaftar({
    id: "pgaji",
    judul: "Pencatatan Gaji",
    kunci: "daftarPencatatanGaji",
    labelData: { nomor: "Nomor", periode: "Periode", tanggal: "Tanggal", jatuhTempo: "Jatuh Tempo", jumlahKaryawan: "Jumlah Karyawan",
                 totalBruto: "Pendapatan Bruto (Rp)", totalPotongan: "Potongan (Rp)", totalDibayarkan: "Gaji dibayarkan (Rp)",
                 ringkasanRincian: "Rincian", catatan: "Catatan", jumlahLampiran: "Jumlah Lampiran", ringkasanLampiran: "Lampiran" },
    formatData: { tanggal: function (t) { return formatTanggal(t); }, jatuhTempo: function (t) { return formatTanggal(t); },
                  totalBruto: function (n) { return formatRupiah(n); }, totalPotongan: function (n) { return formatRupiah(n); },
                  totalDibayarkan: function (n) { return formatRupiah(n); } },
    urutAwal: { kolom: "tanggal", arah: -1 },
    kolom: [
        { kunci: "nomor", judul: "Nomor" },
        { kunci: "tanggal", judul: "Tanggal", tampil: function (g) { return formatTanggal(g.tanggal); }, urut: function (g) { return g.tanggal || ""; } },
        { kunci: "periode", judul: "Periode" },
        { kunci: "total", judul: "Gaji dibayarkan (Rp)", rata: "kanan", tampil: function (g) { return formatAngka(g.totalDibayarkan || 0); } },
        { kunci: "status", judul: "Status", tampil: function (g) { return statusBayarGaji(g).teks; } }
    ],
    filter: [
        { judul: "Status", ambil: function (g) { return statusBayarGaji(g).teks; } }
    ],
    pesanKosong: "Belum ada pencatatan gaji. Klik tombol + untuk membuat.",
    // Gaji yang sudah punya pembayaran, atau bertanggal terkunci, tidak boleh dihapus (PRD 3.3, 5.7)
    alasanTolakHapus: function (g) {
        if (statusBayarGaji(g).dibayar > 0) { return 'Gaji "' + g.nomor + '" sudah punya pembayaran. Hapus pembayarannya dulu di Pembayaran.'; }
        return tanggalTerkunci(g.tanggal)
            ? 'Pencatatan "' + g.nomor + '" bertanggal ' + formatTanggal(g.tanggal) + ' yang sudah terkunci (Preferensi, Pembatasan), jadi tidak bisa dihapus.'
            : "";
    },
    // Menghapus pencatatan ikut menghapus isi file lampirannya
    saatDihapus: function (g) { hapusIsiLampiran(g.id); },
    // data kosong = Data Baru (bulan ini, tanggal hari ini); berisi = pencatatan tersimpan dimuat untuk diubah
    isiForm: function (data) {
        // Data Baru dibuka kosong (PRD 5.3a): tipe, bulan, tahun, tanggal, jatuh tempo, aturan nomor, dan akun beban dipilih sendiri
        isiPilihanTahunGaji(data ? data.tahun : "");
        pilihBulanGaji.value = data ? String(data.bulan) : "";
        pilihTipeGajiBayar.value = data && data.tipe ? data.tipe : "";
        kolomTanggalGaji.value = data ? teksAman(data.tanggal) : "";
        kolomTempoGaji.value = data ? teksAman(data.jatuhTempo) : "";
        aturBatasTanggal(kolomTanggalGaji);
        // Data Baru: aturan nomor dipilih sendiri. Data tersimpan: nomornya tampil di kolom nomor dan boleh diubah.
        nomorGaji.mulai(data ? data.nomor : "");
        isiPilihanBebanGaji(data ? data.akunBebanId : "");
        document.getElementById("pgaji-catatan").value = data ? teksAman(data.catatan) : "";
        barisGaji = rincianAman(data).map(function (b) { return Object.assign({}, b); });
        // Setelah disimpan, Tipe Pembayaran dan Bulan/Tahun terkunci (seperti Accurate)
        ["pgaji-tipe", "pgaji-bulan", "pgaji-tahun"].forEach(function (id) { document.getElementById(id).disabled = !!data; });
        tampilkanStatusGaji(data);
        cariKaryawanGaji.tutup();
        document.getElementById("pgaji-cari-karyawan").value = "";
        gambarRincianGaji();
        lampiranGaji.muat(data);   // Data Baru: kosong; data tersimpan: lampirannya
        sembunyikanGalatGajiSimpan();
        pilihTabGaji("rincian");
    },
    // Baris karyawan dan lampiran ikut diingat per tab (PRD 6.10)
    keadaanTambahan: {
        ambil: function () { return { baris: barisGaji.map(function (b) { return Object.assign({}, b); }), lampiran: lampiranGaji.kerja() }; },
        pakai: function (simpanan) {
            barisGaji = simpanan.baris.map(function (b) { return Object.assign({}, b); });
            gambarRincianGaji();
            lampiranGaji.atur(simpanan.lampiran);
        }
    }
});

// Pilihan bulan (Januari..Desember) diisi sekali; tahun: 3 tahun ke belakang sampai tahun depan
// Keduanya diawali "Silakan Pilih" (PRD 5.3a). terpilih "" = Data Baru.
isiPilihan(pilihBulanGaji, namaBulan.map(function (nama, i) { return { id: String(i + 1), nama: nama }; }), { kosong: "Silakan Pilih" });
function isiPilihanTahunGaji(terpilih) {
    var tahunIni = Number(tanggalHariIni().slice(0, 4)), daftar = [];
    var awal = Math.min(tahunIni - 3, Number(terpilih) || tahunIni), akhir = Math.max(tahunIni + 1, Number(terpilih) || tahunIni);
    for (var t = awal; t <= akhir; t++) { daftar.push({ id: String(t), nama: String(t) }); }
    isiPilihan(pilihTahunGaji, daftar, { kosong: "Silakan Pilih", terpilih: terpilih ? String(terpilih) : "" });
}

// Tab samping: Rincian Karyawan dan Info lainnya
var pilihTabGaji = buatPengalihTab(document.querySelectorAll("#isi-pgaji [data-pgaji-tab]"), "pgajiTab",
    { rincian: "pgaji-panel-rincian", info: "pgaji-panel-info" });

// Nomor: otomatis dari aturan penomoran bertipe Pencatatan Gaji (Pengaturan, Penomoran), atau diketik sendiri
var nomorGaji = buatNomorOtomatis({
    saklar: document.getElementById("pgaji-nomor-otomatis"),
    pilihan: document.getElementById("pgaji-aturan-nomor"),
    kolom: document.getElementById("pgaji-nomor"),
    contoh: document.getElementById("pgaji-contoh-nomor"),
    tanggal: kolomTanggalGaji,
    tipe: "gaji",
    namaTipe: "Pencatatan Gaji"
});

// ----- Info lainnya: akun Beban Gaji -----
// Pilihan = akun Beban atau Beban Lainnya yang boleh dipilih di transaksi (akunUntukJurnal: tanpa sub akun), urut kode
function isiPilihanBebanGaji(idTerpilih) {
    var akun = akunUntukJurnal().filter(function (a) { return a.tipe === "beban" || a.tipe === "beban-lain"; }).sort(urutKodeAkun);
    isiPilihan(pilihBebanGaji, akun, {
        teks: function (a) { return a.kode + " - " + a.nama; },
        kosong: "Pilih akun beban...",
        kosongKalauTakAda: "Belum ada akun",
        terpilih: idTerpilih,
        nonaktifKalauKosong: true,
        petunjuk: document.getElementById("petunjuk-pgaji-beban")
    });
}

// ----- Tabel Rincian Karyawan dan total -----
function gambarRincianGaji() {
    badanRincianGaji.textContent = "";
    if (barisGaji.length === 0) { badanRincianGaji.appendChild(barisKosongTabel(5)); }
    var totalBruto = 0, totalBayar = 0;
    barisGaji.forEach(function (b) {
        var h = hitungBarisGaji(b);
        totalBruto += h.bruto;
        totalBayar += h.dibayarkan;
        var tr = document.createElement("tr");
        tr.className = "jurnal-baris-data";
        tr.tabIndex = 0;
        tr.title = "Klik untuk mengubah rincian gaji";
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
        sel(b.nama, "jurnal-sel-teks");
        sel(formatAngka(h.bruto), "jurnal-sel-angka");
        sel(formatAngka(h.potongan), "jurnal-sel-angka");
        var tdBayar = sel(teksRupiahGaji(h.dibayarkan), "jurnal-sel-angka");
        if (h.dibayarkan < 0) { tdBayar.classList.add("pgaji-minus"); }
        tr.appendChild(tombolHapusBaris("Hapus baris " + b.nama, function () {
            barisGaji = barisGaji.filter(function (x) { return x.id !== b.id; });
            gambarRincianGaji();
        }));
        tr.addEventListener("click", function () { bukaRincianGaji(null, b); });
        tr.addEventListener("keydown", function (k) { if (k.key === "Enter" && k.target === tr) { k.preventDefault(); bukaRincianGaji(null, b); } });
        badanRincianGaji.appendChild(tr);
    });
    document.getElementById("pgaji-jumlah").textContent = barisGaji.length ? " (" + barisGaji.length + ")" : "";
    document.getElementById("pgaji-total-bruto").textContent = "Rp " + teksRupiahGaji(totalBruto);
    document.getElementById("pgaji-total-bayar").textContent = "Rp " + teksRupiahGaji(totalBayar);
    aturTombolProsesGaji();   // Proses aktif begitu ada karyawan di rincian (PRD 6.2)
}

// ----- Cari karyawan (dari Master Data, Karyawan) -----
// Baris hasil: nama (cocok disorot), nomor pegawai di kiri bawah, jabatan di kanan bawah
var cariKaryawanGaji = buatKolomCari({
    kolom: document.getElementById("pgaji-cari-karyawan"),
    daftar: document.getElementById("pgaji-daftar-karyawan"),
    ambilData: bacaKaryawan,
    // Pengaman urutan isian (alat bersama, umum/komponen-transaksi.js): Tanggal dulu
    bolehBuka: buatSyaratIsian([{ nama: "Tanggal", kolom: kolomTanggalGaji }], "memilih karyawan").bolehBuka,
    cocok: function (k, kata) {
        return kata === "" || (teksAman(k.nama) + " " + teksAman(k.nomor) + " " + teksAman(k.jabatan)).toLowerCase().indexOf(kata) !== -1;
    },
    urut: function (a, b) { return teksAman(a.nama).localeCompare(teksAman(b.nama), "id"); },
    gambarButir: function (li, kar, kata) {
        var nama = document.createElement("div");
        nama.className = "jurnal-pilihan-nama";
        tulisDenganSorot(nama, kar.nama, kata);
        var bawah = document.createElement("div");
        bawah.className = "jurnal-pilihan-bawah";
        var nomor = document.createElement("span");
        nomor.textContent = teksAman(kar.nomor);
        var jabatan = document.createElement("span");
        jabatan.className = "jurnal-pilihan-tipe";
        jabatan.textContent = teksAman(kar.jabatan);
        bawah.appendChild(nomor);
        bawah.appendChild(jabatan);
        li.appendChild(nama);
        li.appendChild(bawah);
    },
    teksKosong: function (adaData) { return adaData ? "Tidak ada karyawan yang cocok." : "Belum ada karyawan. Buat di Master Data, Karyawan."; },
    saatPilih: function (kar) { bukaRincianGaji(kar, null); }
});

// ----- Popup Rincian Karyawan -----
var dialogRincianGaji = document.getElementById("dialog-rincian-gaji");
var kolomKomponenGaji = {};   // kunci komponen -> <input>
var rincianGajiDibuka = null; // { kar, baris } yang sedang diisi di popup

var pilihTabRincianGaji = buatPengalihTab(dialogRincianGaji.querySelectorAll("[data-rgaji-tab]"), "rgajiTab",
    { gaji: "rgaji-panel-gaji", info: "rgaji-panel-info" });

// Baris komponen dibuat dari daftar komponenGaji: label di kiri, kotak Rp di kanan
komponenGaji.forEach(function (k) {
    var baris = document.createElement("div");
    baris.className = "baris-form rgaji-komponen";
    var label = document.createElement("label");
    label.setAttribute("for", "rgaji-" + k.kunci);
    label.textContent = k.label;
    var bungkus = document.createElement("div");
    bungkus.className = "detail-rupiah";
    var rp = document.createElement("span");
    rp.setAttribute("aria-hidden", "true");
    rp.textContent = "Rp";
    var input = document.createElement("input");
    input.type = "text";
    input.id = "rgaji-" + k.kunci;
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.placeholder = "0";
    // Titik ribuan langsung saat mengetik (alat bersama pasangKolomRupiah); total langsung diperbarui
    pasangKolomRupiah(input);
    input.addEventListener("input", hitungPopupGaji);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); simpanRincianGaji(); } });
    bungkus.appendChild(rp);
    bungkus.appendChild(input);
    baris.appendChild(label);
    baris.appendChild(bungkus);
    document.getElementById(k.arah === "pendapatan" ? "rgaji-pendapatan" : "rgaji-potongan").appendChild(baris);
    kolomKomponenGaji[k.kunci] = input;
});

// Gaji dibayarkan di popup dihitung ulang setiap angka diketik
function hitungPopupGaji() {
    var b = {};
    komponenGaji.forEach(function (k) { b[k.kunci] = angkaDariTeks(kolomKomponenGaji[k.kunci].value); });
    var dibayarkan = hitungBarisGaji(b).dibayarkan;
    var hasil = document.getElementById("rgaji-dibayarkan");
    hasil.value = teksRupiahGaji(dibayarkan);
    hasil.classList.toggle("pgaji-minus", dibayarkan < 0);
}

// kar = karyawan baru dipilih (baris baru); baris = baris yang sudah ada (diubah)
function bukaRincianGaji(kar, baris) {
    rincianGajiDibuka = { kar: kar, baris: baris };
    var sumber = baris || {};
    document.getElementById("rgaji-nama").textContent = teksAman(baris ? baris.nama : kar.nama);
    var jabatan = teksAman(baris ? baris.jabatan : kar.jabatan);
    document.getElementById("rgaji-jabatan").textContent = jabatan ? "[" + jabatan + "]" : "";
    komponenGaji.forEach(function (k) { kolomKomponenGaji[k.kunci].value = teksAngkaIsian(Number(sumber[k.kunci]) || 0); });
    document.getElementById("rgaji-catatan").value = teksAman(sumber.catatan);
    hitungPopupGaji();
    pilihTabRincianGaji("gaji");
    dialogRincianGaji.showModal();
    kolomKomponenGaji.gajiPokok.focus();
}

// Menutup popup dengan cara apa pun. Penanda dipasang SEBELUM menutup: fokus yang kembali ke kolom cari karyawan
// tepat sesudah popup tertutup tidak membuka daftar.
function tutupRincianGaji() {
    rincianGajiDibuka = null;
    cariKaryawanGaji.abaikanFokusSebentar();
    dialogRincianGaji.close();
}

// Lanjut: isi popup masuk ke tabel (baris baru atau baris lama diperbarui)
function simpanRincianGaji() {
    if (!rincianGajiDibuka) { return; }
    var data = {};
    komponenGaji.forEach(function (k) { data[k.kunci] = angkaDariTeks(kolomKomponenGaji[k.kunci].value); });
    data.catatan = document.getElementById("rgaji-catatan").value.trim();
    if (rincianGajiDibuka.baris) {
        Object.assign(rincianGajiDibuka.baris, data);
    } else {
        var kar = rincianGajiDibuka.kar;
        barisGaji.push(Object.assign({ id: buatId("bg"), karyawanId: kar.id, nama: teksAman(kar.nama), jabatan: teksAman(kar.jabatan) }, data));
    }
    tutupRincianGaji();
    gambarRincianGaji();
}
document.getElementById("lanjut-rincian-gaji").addEventListener("click", simpanRincianGaji);
document.getElementById("tutup-rincian-gaji").addEventListener("click", tutupRincianGaji);
// Esc: peristiwa "cancel" datang SEBELUM popup tertutup
dialogRincianGaji.addEventListener("cancel", function () { rincianGajiDibuka = null; cariKaryawanGaji.abaikanFokusSebentar(); });

// Tombol yang belum berfungsi: beri tahu lewat notifikasi
document.querySelectorAll("[data-pgaji-menyusul]").forEach(function (tombol) {
    tombol.addEventListener("click", function () {
        tampilkanNotifikasi(tombol.dataset.pgajiMenyusul + " belum tersedia.", "peringatan");
    });
});

// ----- Menyimpan Pencatatan Gaji -----
// Menyimpan TIDAK membuat jurnal (PRD 4.2). Jurnal gaji dibuat saat gaji dibayar lewat Pembayaran.
function sembunyikanGalatGajiSimpan() { document.getElementById("pgaji-pesan-galat").hidden = true; }
function tampilkanGalatGajiSimpan(pesan, kolomFokus) {
    var kotak = document.getElementById("pgaji-pesan-galat");
    kotak.textContent = pesan;
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

// Ringkasan rincian untuk Log Aktivitas: "Gunawan 3.450.000; Ani Lestari 2.000.000"
function ringkasanRincianGaji(rincian) {
    return rincian.map(function (b) { return b.nama + " " + formatAngka(hitungBarisGaji(b).dibayarkan); }).join("; ");
}

// Satu karyawan hanya sekali per periode per tipe (PRD 6.2): Bulanan Oktober dan THR Oktober boleh terpisah,
// tetapi dua kali Bulanan Oktober ditolak. Mengembalikan pesan kesalahan, atau "" kalau tidak ada yang dobel.
function galatGajiDobel(daftar, tipe, bulan, tahun) {
    var lain = daftar.filter(function (g) {
        return g.id !== modulPgaji.idDiubah && g.tipe === tipe && Number(g.bulan) === bulan && Number(g.tahun) === tahun;
    });
    var pesan = "";
    barisGaji.some(function (b) {
        var sudah = lain.find(function (g) { return rincianAman(g).some(function (x) { return x.karyawanId === b.karyawanId; }); });
        if (sudah) { pesan = b.nama + " sudah tercatat di Pencatatan Gaji " + sudah.nomor + " untuk periode dan tipe yang sama."; }
        return !!sudah;
    });
    return pesan;
}

// Apakah isi formulir sama dengan pencatatan tersimpan? (Proses tidak perlu menyimpan ulang yang tidak berubah)
function isiGajiSama(lama, data) {
    return Object.keys(data).every(function (kunci) {
        return kunci === "aturanId" || JSON.stringify(lama[kunci]) === JSON.stringify(data[kunci]);
    });
}

// Memeriksa lalu menyimpan isi formulir. Dipakai tombol Simpan dan Proses (PRD 6.2), supaya aturannya ditulis sekali.
//   untukProses = false (tombol Simpan): setelah tersimpan formulir kembali seperti biasa (komponen daftar).
//   untukProses = true  (Proses > Gaji): pencatatan yang isinya tidak berubah tidak disimpan ulang (termasuk yang sudah
//                         dibayar sebagian), dan setelah tersimpan pencatatan tetap terbuka.
// Mengembalikan pencatatan yang tersimpan, atau null kalau ada kesalahan (pesannya sudah tampil di formulir).
function simpanPencatatanGaji(untukProses) {
    sembunyikanGalatGajiSimpan();
    var daftar = modulPgaji.ambil();
    var sedangMengubah = (modulPgaji.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (g) { return g.id === modulPgaji.idDiubah; }) : null;
    var tanggal = kolomTanggalGaji.value, tempo = kolomTempoGaji.value;

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama. Isian Data Baru yang kosong ditolak (PRD 5.3a).
    if (pilihTipeGajiBayar.value === "") { tampilkanGalatGajiSimpan("Tipe Pembayaran wajib dipilih.", pilihTipeGajiBayar); return null; }
    if (pilihBulanGaji.value === "") { tampilkanGalatGajiSimpan("Bulan gaji wajib dipilih.", pilihBulanGaji); return null; }
    if (pilihTahunGaji.value === "") { tampilkanGalatGajiSimpan("Tahun gaji wajib dipilih.", pilihTahunGaji); return null; }
    // Tanggal: aturan bersama (umum/komponen-transaksi.js)
    var galatTanggal = galatTanggalTransaksi(tanggal, lama, { catat: "gaji", ini: "Pencatatan ini" });
    if (galatTanggal) { tampilkanGalatGajiSimpan(galatTanggal.pesan, galatTanggal.diKolom ? kolomTanggalGaji : null); return null; }
    if (tempo === "") { tampilkanGalatGajiSimpan("Jatuh Tempo wajib diisi.", kolomTempoGaji); return null; }
    if (tempo < tanggal) { tampilkanGalatGajiSimpan("Jatuh Tempo tidak boleh sebelum Tanggal.", kolomTempoGaji); return null; }
    if (barisGaji.length === 0) {
        pilihTabGaji("rincian");
        tampilkanGalatGajiSimpan("Rincian Karyawan masih kosong. Pilih karyawan lewat kolom cari.", document.getElementById("pgaji-cari-karyawan")); return null;
    }
    var minus = barisGaji.find(function (b) { return hitungBarisGaji(b).dibayarkan < 0; });
    if (minus) {
        pilihTabGaji("rincian");
        tampilkanGalatGajiSimpan("Gaji dibayarkan untuk " + minus.nama + " kurang dari nol (potongan lebih besar dari pendapatan). Perbaiki dulu rinciannya."); return null;
    }
    var totalBruto = 0, totalPotongan = 0, totalDibayarkan = 0;
    barisGaji.forEach(function (b) { var h = hitungBarisGaji(b); totalBruto += h.bruto; totalPotongan += h.potongan; totalDibayarkan += h.dibayarkan; });
    if (totalDibayarkan <= 0) {
        pilihTabGaji("rincian");
        tampilkanGalatGajiSimpan("Total gaji dibayarkan masih Rp 0. Isi rincian gaji karyawan dulu."); return null;
    }
    var tipe = pilihTipeGajiBayar.value;
    var bulan = Number(pilihBulanGaji.value), tahun = Number(pilihTahunGaji.value);
    var dobel = galatGajiDobel(daftar, tipe, bulan, tahun);
    if (dobel) { pilihTabGaji("rincian"); tampilkanGalatGajiSimpan(dobel); return null; }
    if (!bacaDaftarAkun().some(function (a) { return a.id === pilihBebanGaji.value; })) {
        pilihTabGaji("info");
        tampilkanGalatGajiSimpan("Akun Beban Gaji wajib dipilih (tab Info lainnya).", pilihBebanGaji); return null;
    }
    // Preferensi, Lampiran: bila Pencatatan Gaji wajib berlampiran, minimal satu file harus ada
    if (lampiranGaji.wajibKosong()) { tampilkanGalatGajiSimpan(lampiranGaji.pesanWajib, tombolLampiranGaji); return null; }

    // Nomor: otomatis (aturan Pencatatan Gaji) atau diketik. Harus unik di antara Pencatatan Gaji (PRD 5.2).
    // ambil() belum menghabiskan hitungan; hitungan baru dipakai setelah tersimpan (pakai, di bawah).
    var infoNomor = nomorGaji.ambil(tanggal);
    if (infoNomor.galat) { tampilkanGalatGajiSimpan(infoNomor.galat, infoNomor.kolomFokus); return null; }
    var nomor = infoNomor.nomor;
    if (nomorTransaksiTerpakai(nomor, daftar, modulPgaji.idDiubah, null)) {   // Pencatatan Gaji tidak punya jurnal
        tampilkanGalatGajiSimpan('Nomor "' + nomor + '" sudah dipakai pencatatan gaji lain.' + (infoNomor.otomatis ? " Matikan Otomatis dan ketik nomor lain." : ""), nomorGaji.kolomNomorKembar()); return null;
    }

    var data = {
        nomor: nomor, nama: nomor, aturanId: infoNomor.aturanId,
        tipe: tipe,
        bulan: bulan, tahun: tahun, periode: namaBulan[bulan - 1] + " " + tahun,
        tanggal: tanggal, jatuhTempo: tempo,
        akunBebanId: pilihBebanGaji.value,
        catatan: document.getElementById("pgaji-catatan").value.trim(),
        rincian: barisGaji.map(function (b) { return Object.assign({}, b); }),
        jumlahKaryawan: barisGaji.length,
        totalBruto: totalBruto, totalPotongan: totalPotongan, totalDibayarkan: totalDibayarkan,
        ringkasanRincian: ringkasanRincianGaji(barisGaji)
    };
    Object.assign(data, lampiranGaji.infoData());   // hanya keterangan file; isinya disimpan terpisah (umum/lampiran.js)
    // Proses pada pencatatan yang tidak berubah: langsung lanjut tanpa menyimpan ulang
    if (untukProses && lama && isiGajiSama(lama, data)) { return lama; }
    // Gaji yang sudah punya pembayaran tidak boleh diubah (PRD 3.3)
    if (lama && statusBayarGaji(lama).dibayar > 0) {
        tampilkanGalatGajiSimpan("Gaji ini sudah punya pembayaran, jadi tidak bisa diubah. Hapus pembayarannya dulu di Pembayaran kalau perlu diubah."); return null;
    }
    var salinanLama = lama ? Object.assign({}, lama) : null;
    var gaji;
    if (sedangMengubah) {
        data.diubahPada = waktuSekarang();
        Object.assign(lama, data);
        gaji = lama;
    } else {
        data.id = buatId("pg");
        data.dibuatOleh = penggunaAktif;
        data.dibuatPada = waktuSekarang();
        daftar.push(data);
        gaji = data;
    }

    // Isi file lampiran disimpan lebih dulu; penyimpanan penuh = pencatatan tidak disimpan. Kalau pencatatannya gagal
    // disimpan, isi file dikembalikan seperti semula.
    var simpananLampiran = lampiranGaji.simpanIsi(gaji.id);
    if (!simpananLampiran) { tampilkanGalatGajiSimpan(lampiranGaji.pesanPenuh, tombolLampiranGaji); return null; }
    if (!modulPgaji.simpan(daftar)) { simpananLampiran.pulihkan(); return null; }
    // Nomor otomatis baru "dipakai" (hitungan naik) setelah benar-benar tersimpan
    var nomorDipakai = nomorGaji.pakai(infoNomor, tanggal);
    if (nomorDipakai !== gaji.nomor) {
        gaji.nomor = gaji.nama = nomorDipakai;
        modulPgaji.simpan(daftar);
    }
    modulPgaji.selesaiSimpan(sedangMengubah, gaji, salinanLama);   // notifikasi + Log Aktivitas
    if (untukProses) { modulPgaji.bukaUbah(gaji); }                 // pencatatan tetap terbuka untuk diproses
    return gaji;
}

document.getElementById("form-pgaji").addEventListener("submit", function (k) {
    k.preventDefault();
    simpanPencatatanGaji(false);
});

// Karyawan, aturan nomor, dan pembayaran bisa berubah di halaman lain: muat ulang tiap tab dibuka
saatTabDibuka.pgaji = function () {
    modulPgaji.gambarTabel();
    nomorGaji.segarkan();
    isiPilihanBebanGaji(pilihBebanGaji.value);
    gambarRincianGaji();
    tampilkanStatusGaji(gajiTerbuka());
    lampiranGaji.perbaruiLencana();   // tanda wajib mengikuti Preferensi terbaru
};

// ----- Status bayar dan tombol Proses -----
function tutupMenuProsesGaji() { menuProsesGaji.hidden = true; tombolProsesGaji.setAttribute("aria-expanded", "false"); }

// Pencatatan tersimpan yang sedang dibuka di formulir, atau null kalau Data Baru
function gajiTerbuka() {
    if (modulPgaji.idDiubah === null) { return null; }
    return modulPgaji.ambil().find(function (x) { return x.id === modulPgaji.idDiubah; }) || null;
}

// Kolom Status di formulir (Belum disimpan / Belum dibayar / Sebagian (sisa ...) / Lunas)
function tampilkanStatusGaji(data) {
    tutupMenuProsesGaji();
    var status = data ? statusBayarGaji(data) : null;
    document.getElementById("pgaji-status").value = !status ? "Belum disimpan"
        : status.teks + (status.teks === "Sebagian" ? " (sisa Rp " + formatAngka(status.sisa) + ")" : "");
    aturTombolProsesGaji();
}

// Tombol Proses (PRD 6.2): aktif begitu Rincian Karyawan berisi karyawan, tanpa harus disimpan dulu;
// tidak aktif kalau rincian kosong atau gaji sudah lunas.
function aturTombolProsesGaji() {
    var data = gajiTerbuka();
    var lunas = !!data && statusBayarGaji(data).teks === "Lunas";
    var kosong = barisGaji.length === 0;
    tombolProsesGaji.disabled = kosong || lunas;
    tombolProsesGaji.title = lunas ? "Gaji ini sudah lunas"
        : (kosong ? "Aktif setelah ada karyawan di Rincian Karyawan" : "Bayar gaji ini (pencatatan disimpan otomatis dulu)");
    if (tombolProsesGaji.disabled) { tutupMenuProsesGaji(); }
}
tombolProsesGaji.addEventListener("click", function () {
    menuProsesGaji.hidden = !menuProsesGaji.hidden;
    tombolProsesGaji.setAttribute("aria-expanded", menuProsesGaji.hidden ? "false" : "true");
});
// Klik di luar tombol Proses dan menunya menutup menu
document.addEventListener("click", function (k) {
    if (!menuProsesGaji.hidden && !tombolProsesGaji.parentElement.contains(k.target)) { tutupMenuProsesGaji(); }
});

// Proses > Gaji (PRD 6.2, seperti Accurate): simpan otomatis dulu (pemeriksaan sama dengan Simpan), lalu langsung
// pindah ke Pembayaran baru berisi satu baris: akun Beban Gaji dari pencatatan, senilai sisa yang belum dibayar.
// Gaji tidak lagi dibayar lewat Jurnal Umum (PRD 3.3).
document.getElementById("pgaji-proses-gaji").addEventListener("click", function () {
    tutupMenuProsesGaji();
    var gaji = simpanPencatatanGaji(true);
    if (!gaji) { return; }   // ada kesalahan: pesannya sudah tampil di formulir, Proses dibatalkan
    var sisa = statusBayarGaji(gaji).sisa;
    if (sisa <= 0) { tampilkanNotifikasi("Gaji " + teksAman(gaji.nomor) + " sudah lunas.", "peringatan"); return; }
    var akun = bacaDaftarAkun().find(function (a) { return a.id === gaji.akunBebanId; });
    if (!akun) {
        pilihTabGaji("info");
        tampilkanGalatGajiSimpan("Akun Beban Gaji pencatatan ini sudah tidak ada. Pilih akun lain di tab Info lainnya, lalu Proses lagi.", pilihBebanGaji);
        return;
    }
    bukaPembayaranGaji(gaji, akun, sisa);   // fitur/pembayaran/pembayaran.js
});

// ----- Pindah dari skema lama (sekali jalan) -----
// Skema lama membuat jurnal Debit Beban Gaji / Kredit Utang Beban saat Pencatatan Gaji disimpan, dan membayar gaji
// lewat baris Jurnal Umum bertanda gajiId. Skema A tidak memakai keduanya (PRD 3.3, 4.2), jadi saat aplikasi dibuka:
//  - jurnal bertanda sumber "gaji" dihapus;
//  - tanda gajiId di baris Jurnal Umum dilepas (jurnalnya tetap ada);
//  - isian lama (jurnalId, akunUtangId) dibuang dari data Pencatatan Gaji. akunBebanId tetap: di skema A
//    akun itu dipakai sebagai akun baris saat gaji dibayar lewat Pembayaran (PRD 6.2).
// Dijalankan setelah semua skrip dimuat (DOMContentLoaded), karena catatLog ada di fitur/pengaturan yang dimuat belakangan.
// Kalau tidak ada sisa skema lama, tidak ada yang diubah.
function pindahkanGajiSkemaLama() {
    var daftarJurnal = modulJurnal.ambil();
    var dihapus = daftarJurnal.filter(function (j) { return j.sumber && j.sumber.jenis === "gaji"; });
    var tautanDilepas = 0;
    var sisaJurnal = daftarJurnal.filter(function (j) { return dihapus.indexOf(j) === -1; });
    sisaJurnal.forEach(function (j) {
        rincianAman(j).forEach(function (r) { if (r.gajiId) { delete r.gajiId; tautanDilepas++; } });
    });
    var daftarGaji = modulPgaji.ambil();
    var gajiDibersihkan = 0;
    daftarGaji.forEach(function (g) {
        var adaLama = ("jurnalId" in g) || ("akunUtangId" in g);
        if (adaLama) { delete g.jurnalId; delete g.akunUtangId; gajiDibersihkan++; }
    });
    if (dihapus.length === 0 && tautanDilepas === 0 && gajiDibersihkan === 0) { return; }
    if (!modulJurnal.simpan(sisaJurnal) || !modulPgaji.simpan(daftarGaji)) { return; }
    catatLog({
        tindakan: "Ubah", tipe: "Pencatatan Gaji",
        referensi: "Pindah ke skema A: " + dihapus.length + " jurnal gaji lama dihapus" +
            (dihapus.length ? " (" + dihapus.map(function (j) { return teksAman(j.nomor); }).join(", ") + ")" : "") +
            ", " + tautanDilepas + " tautan gaji di Jurnal Umum dilepas"
    });
}
document.addEventListener("DOMContentLoaded", pindahkanGajiSkemaLama);

// Dipanggil dari Buku Besar, kotak Pencatatan Gaji
function bukaPencatatanGajiBaru() {
    modulPgaji.bukaDariMenu();
}
