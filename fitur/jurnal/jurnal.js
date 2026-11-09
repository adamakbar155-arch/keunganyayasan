// ==================== Jurnal Umum (Buku Besar) ====================
// Berisi: formulir Jurnal Umum (tanggal, nomor otomatis/manual, rincian), pencarian akun, popup Detail Akun,
// lampiran jurnal, dan simpan/ubah/hapus jurnal (wajib seimbang, nomor unik, tanggal tidak terkunci, tercatat di
// Log Aktivitas). Yang belum ada: geser urutan baris (tombolnya memberi tahu "belum tersedia").
// HTML-nya ada di fitur/jurnal/tampilan.js. Dimuat sesudah umum/ dan fitur/akun/akun.js (memakai petaAkun, tipeAkun),
// dan sebelum fitur/gaji serta fitur/pembayaran (keduanya memakai isi file ini).
// Semua nama (var dan function) di sini tetap bisa dipakai oleh skrip lain, karena skrip biasa berbagi satu ruang nama.

// Satu jurnal: { id, nomor, nama(=nomor), tanggal, keterangan, aturanId, rincian[baris], jumlahBaris, totalDebit,
//   ringkasanRincian, lampiranInfo, jumlahLampiran, ringkasanLampiran, sumber?, dibuatOleh, dibuatPada, diubahPada }
// Satu baris rincian: { id, akunId, kode, nama, debit, kredit, penanggung, divisiId, programId, keterangan }
// (debit/kredit bilangan bulat Rupiah; salah satunya 0).
// sumber = { jenis, id } kalau jurnal dibuat otomatis oleh transaksi lain (PRD 3.1): hanya bisa diubah/dihapus dari sana.
var kolomTanggalJurnal = document.getElementById("jurnal-tanggal");
var barisJurnal = [];   // salinan kerja baris rincian jurnal yang sedang dibuka

// Daftar asal jurnal otomatis, menurut sumber.jenis: { jenis: { nama, modul, tab } }. Setiap fitur yang membuat jurnal
// otomatis mendaftarkan dirinya lewat daftarkanAsalJurnal (Pembayaran dan Penerimaan lewat umum/komponen-transaksi-kas.js,
// Transfer di fitur/transfer/transfer.js), jadi file ini tidak perlu diubah setiap ada transaksi baru.
// Dipakai untuk pesan "ubah lewat halaman ..." dan untuk membuka transaksi asal (misalnya dari Histori Bank).
// Tanpa prototipe: jenis rusak seperti "constructor" di data jurnal tidak salah terbaca sebagai formulir asal
var asalJurnal = Object.create(null);
function daftarkanAsalJurnal(jenis, info) {
    asalJurnal[jenis] = info;   // info = { nama: "Pembayaran", modul: modulBayar, tab: "bayar" }
}
// Nama formulir asal sebuah jurnal otomatis, atau "" kalau jurnal itu diketik sendiri di Jurnal Umum
function asalJurnalOtomatis(jurnal) {
    if (!jurnal || !jurnal.sumber) { return ""; }
    return asalJurnal[jurnal.sumber.jenis] ? asalJurnal[jurnal.sumber.jenis].nama : "transaksi lain";
}

// Membuka transaksi asal sebuah jurnal di tabnya (jurnal otomatis), atau jurnal itu sendiri di Jurnal Umum.
// Mengembalikan false kalau transaksinya sudah tidak ada.
function bukaAsalJurnal(jurnal) {
    var asal = dataAsalJurnal(jurnal);
    if (!asal) { return false; }
    bukaTab(asal.tab);
    asal.modul.bukaUbah(asal.data);
    return true;
}
// Transaksi asal sebuah jurnal: { data, modul, tab }, atau null kalau sudah tidak ada. Jurnal yang diketik sendiri = jurnal itu.
// Dipakai juga laporan Bukti Pengeluaran untuk membaca lampiran transaksi asal (Pembayaran menyimpan lampirannya sendiri).
function dataAsalJurnal(jurnal) {
    return pembacaAsalJurnal()(jurnal);
}
// Untuk laporan yang menelusuri banyak jurnal: daftar tiap formulir asal dibaca SEKALI saja, lalu dicari menurut id.
// Mengembalikan fungsi (jurnal) -> { data, modul, tab } atau null.
function pembacaAsalJurnal() {
    var simpanan = Object.create(null);   // jenis -> { id: data }
    return function (jurnal) {
        var jenis = jurnal.sumber ? teksAman(jurnal.sumber.jenis) : "";
        var asal = jurnal.sumber ? asalJurnal[jenis] : { modul: modulJurnal, tab: "jurnal" };
        if (!asal) { return null; }
        if (!simpanan[jenis]) {
            simpanan[jenis] = Object.create(null);
            asal.modul.ambil().forEach(function (d) { if (d && d.id) { simpanan[jenis][d.id] = d; } });
        }
        var data = simpanan[jenis][jurnal.sumber ? jurnal.sumber.id : jurnal.id];
        return data ? { data: data, modul: asal.modul, tab: asal.tab } : null;
    };
}

var modulJurnal = buatModulDaftar({
    id: "jurnal",
    judul: "Jurnal Umum",
    kunci: "daftarJurnal",
    labelData: { nomor: "Nomor", tanggal: "Tanggal", keterangan: "Keterangan", totalDebit: "Total (Rp)", ringkasanRincian: "Rincian", jumlahLampiran: "Jumlah Lampiran", ringkasanLampiran: "Lampiran" },
    formatData: { tanggal: function (t) { return formatTanggal(t); }, totalDebit: function (n) { return formatRupiah(n); } },
    urutAwal: { kolom: "tanggal", arah: -1 },   // terbaru di atas
    kolom: [
        { kunci: "nomor", judul: "Nomor" },
        { kunci: "tanggal", judul: "Tanggal", tampil: function (j) { return formatTanggal(j.tanggal); }, urut: function (j) { return j.tanggal || ""; } },
        { kunci: "keterangan", judul: "Keterangan" },
        { kunci: "total", judul: "Total (Rp)", rata: "kanan", tampil: function (j) { return formatAngka(j.totalDebit || 0); }, urut: function (j) { return String(j.totalDebit || 0).padStart(18, "0"); } }
    ],
    pesanKosong: "Belum ada jurnal. Klik tombol + untuk membuat jurnal.",
    // Daftar tidak bercampur (PRD 3.1, seperti Accurate): hanya jurnal yang diketik di Jurnal Umum. Jurnal otomatis
    // Pembayaran, Penerimaan, dan lainnya tampil di daftar transaksinya sendiri, tetapi tetap dihitung di saldo.
    tampilHanya: function (jurnal) { return !jurnal.sumber; },
    // Jurnal otomatis hanya dihapus dari formulir asalnya; jurnal pada tanggal terkunci tidak boleh dihapus
    alasanTolakHapus: function (jurnal) {
        var asal = asalJurnalOtomatis(jurnal);
        if (asal) { return 'Jurnal "' + jurnal.nomor + '" dibuat otomatis dari ' + asal + '. Hapus lewat halaman ' + asal + '.'; }
        var rekonsiliasi = galatSudahRekonsiliasi(jurnal, "Jurnal");
        if (rekonsiliasi) { return rekonsiliasi; }
        return tanggalTerkunci(jurnal.tanggal)
            ? 'Jurnal "' + jurnal.nomor + '" bertanggal ' + formatTanggal(jurnal.tanggal) + ' yang sudah terkunci (Preferensi, Pembatasan), jadi tidak bisa dihapus.'
            : "";
    },
    // Menghapus jurnal juga menghapus isi file lampirannya dari penyimpanan
    saatDihapus: function (jurnal) { hapusIsiLampiran(jurnal.id); },   // umum/lampiran.js
    isiForm: function (jurnal) {
        kolomTanggalJurnal.value = jurnal && jurnal.tanggal ? jurnal.tanggal : "";   // Data Baru dibuka kosong (PRD 5.3a)
        aturBatasTanggal(kolomTanggalJurnal);   // mengikuti pembatasan masa depan di Preferensi
        perbaruiTanggalJurnalTeks();
        // Jurnal baru: nomor otomatis. Jurnal tersimpan: nomornya tampil di kolom nomor dan boleh diubah.
        nomorJurnal.mulai(jurnal ? jurnal.nomor : "");
        // Baris tersimpan selalu sudah jelas sifat dananya: yang tidak dicentang Terikat (termasuk data lama) = Tidak Terikat (PRD 4.1)
        barisJurnal = rincianAman(jurnal).map(function (r) { return Object.assign({}, r, { terikat: r.terikat === true }); });
        cariAkunJurnal.tutup();
        document.getElementById("jurnal-cari-akun").value = "";
        gambarRincianJurnal();
        document.getElementById("jurnal-keterangan").value = jurnal ? teksAman(jurnal.keterangan) : "";
        document.getElementById("jurnal-dibuat-oleh").value = jurnal ? teksAman(jurnal.dibuatOleh) : "";
        lampiranJurnal.muat(jurnal);   // jurnal baru: kosong; jurnal tersimpan: lampirannya
        sembunyikanGalatJurnal();
        pilihTabJurnal("rincian");
    },
    // Baris rincian dan lampiran ikut diingat per tab (PRD 6.10)
    keadaanTambahan: {
        ambil: function () {
            return { baris: barisJurnal.map(function (b) { return Object.assign({}, b); }), lampiran: lampiranJurnal.kerja() };
        },
        pakai: function (k) {
            barisJurnal = k.baris.map(function (b) { return Object.assign({}, b); });
            gambarRincianJurnal();
            lampiranJurnal.atur(k.lampiran);
        }
    }
});

function perbaruiTanggalJurnalTeks() {
    document.getElementById("jurnal-tanggal-teks").textContent = formatTanggalTeks(kolomTanggalJurnal.value);
}
kolomTanggalJurnal.addEventListener("change", perbaruiTanggalJurnalTeks);

// Tab samping: Rincian dan Info
var pilihTabJurnal = buatPengalihTab(document.querySelectorAll("#isi-jurnal [data-jurnal-tab]"), "jurnalTab",
    { rincian: "jurnal-panel-rincian", info: "jurnal-panel-info" });

// Nomor: otomatis dari aturan penomoran bertipe Jurnal Umum (Pengaturan, Penomoran), atau diketik sendiri
var nomorJurnal = buatNomorOtomatis({
    saklar: document.getElementById("jurnal-nomor-otomatis"),
    pilihan: document.getElementById("jurnal-aturan-nomor"),
    kolom: document.getElementById("jurnal-nomor"),
    contoh: document.getElementById("jurnal-contoh-nomor"),
    tanggal: kolomTanggalJurnal,
    tipe: "jurnal",
    namaTipe: "Jurnal Umum"
});

// ---------- Nomor jurnal: JV.2026.11.00081 (PRD 6.4, seperti foto Accurate) ----------
// Isian noJurnal milik semua jurnal, manual maupun otomatis. Berbeda dari nomor (nomor transaksinya) dan dari var nomorJurnal di atas
// (nomor formulir Jurnal Umum). Satu deret per bulan menurut urutan input. Dipasang di satu pintu, modulJurnal.simpan, supaya
// tidak ada jurnal yang terlewat. Saat transaksi diubah jurnalnya tetap objek yang sama, jadi nomornya tidak berganti.
var KUNCI_HITUNGAN_NO_JURNAL = "hitunganNomorJurnal";
var POLA_NO_JURNAL = /^JV\.(\d{4}\.\d{2})\.(\d+)$/;
jenisKunciCadangan[KUNCI_HITUNGAN_NO_JURNAL] = "objek";   // ikut Cadangan Data

function beriNomorJurnal(daftar) {
    var belum = daftar.filter(function (j) { return !POLA_NO_JURNAL.test(teksAman(j.noJurnal)); });
    if (belum.length === 0) { return; }
    var hitungan = bacaPengaturan(KUNCI_HITUNGAN_NO_JURNAL, {});
    // Hitungan tidak pernah turun: nomor yang dihapus tidak dipakai lagi. Nomor yang sudah ada ikut dihitung, untuk data lama.
    daftar.forEach(function (j) {
        var cocok = POLA_NO_JURNAL.exec(teksAman(j.noJurnal));
        if (cocok) { hitungan[cocok[1]] = Math.max(Number(hitungan[cocok[1]]) || 0, Number(cocok[2])); }
    });
    // Jurnal lama: urut tanggal lalu waktu dibuat. Jurnal baru selalu satu per satu, jadi mengikuti urutan input.
    belum.sort(function (a, b) {
        return (teksAman(a.tanggal) + teksAman(a.dibuatPada)).localeCompare(teksAman(b.tanggal) + teksAman(b.dibuatPada));
    });
    belum.forEach(function (j) {
        var tanggal = /^\d{4}-\d{2}/.test(teksAman(j.tanggal)) ? teksAman(j.tanggal) : tanggalHariIni();   // data rusak: bulan ini
        var bulan = tanggal.slice(0, 4) + "." + tanggal.slice(5, 7);
        hitungan[bulan] = (Number(hitungan[bulan]) || 0) + 1;
        j.noJurnal = "JV." + bulan + "." + String(hitungan[bulan]).padStart(5, "0");
    });
    try { localStorage.setItem(KUNCI_HITUNGAN_NO_JURNAL, JSON.stringify(hitungan)); } catch (galat) { /* nomor tetap terisi di jurnalnya */ }
}

var simpanJurnalDasar = modulJurnal.simpan;
modulJurnal.simpan = function (daftar) {
    beriNomorJurnal(daftar);
    return simpanJurnalDasar(daftar);
};

// Jurnal yang belum bernomor (jurnal lama, hasil pulihkan cadangan lama) diberi nomor. Dipanggil saat aplikasi dibuka.
function lengkapiNomorJurnal() {
    var daftar = modulJurnal.ambil();
    if (daftar.some(function (j) { return !POLA_NO_JURNAL.test(teksAman(j.noJurnal)); })) { modulJurnal.simpan(daftar); }
}
lengkapiNomorJurnal();

// Tombol yang belum berfungsi (cari rincian): beri tahu lewat notifikasi
document.querySelectorAll("#isi-jurnal [data-jurnal-menyusul]").forEach(function (tombol) {
    tombol.addEventListener("click", function () {
        tampilkanNotifikasi(tombol.dataset.jurnalMenyusul + " belum tersedia.", "peringatan");
    });
});

// ----- Rincian jurnal: cari akun, isi Detail Akun lewat popup, baris tabel, total -----
// Alurnya seperti di Accurate: cari akun -> pilih -> popup "Detail Akun" -> Lanjut -> baris bertambah.
// Klik sebuah baris membuka popup yang sama untuk mengubahnya.
var badanRincianJurnal = document.getElementById("jurnal-rincian");

// Daftar hasil: nama (cocok disorot), kode di kiri bawah, tipe akun di kanan bawah
var cariAkunJurnal = buatKolomCari({
    kolom: document.getElementById("jurnal-cari-akun"),
    daftar: document.getElementById("jurnal-daftar-akun"),
    ambilData: akunUntukJurnal,
    cocok: function (a, kata) { return kata === "" || (teksAman(a.nama) + " " + teksAman(a.kode)).toLowerCase().indexOf(kata) !== -1; },
    urut: urutKodeAkun,
    gambarButir: gambarButirAkun,
    teksKosong: function (adaData) { return adaData ? "Tidak ada akun yang cocok." : "Belum ada akun yang bisa dipilih. Buat di Buku Besar, Akun Perkiraan."; },
    saatPilih: function (akun) { bukaDetailAkunJurnal(akun, null); },
    // Pengaman urutan isian (alat bersama, umum/komponen-transaksi.js): Tanggal dulu
    bolehBuka: buatSyaratIsian([{ nama: "Tanggal", kolom: document.getElementById("jurnal-tanggal") }], "memilih akun perkiraan").bolehBuka
});

// Isi satu baris hasil pencarian akun (dipakai juga oleh Pembayaran)
function gambarButirAkun(li, akun, kata) {
    var nama = document.createElement("div");
    nama.className = "jurnal-pilihan-nama";
    tulisDenganSorot(nama, akun.nama, kata);
    var bawah = document.createElement("div");
    bawah.className = "jurnal-pilihan-bawah";
    var kode = document.createElement("span");
    tulisDenganSorot(kode, akun.kode, kata);
    var tipe = document.createElement("span");
    tipe.className = "jurnal-pilihan-tipe";
    tipe.textContent = tipeAkun[akun.tipe] || "";
    bawah.appendChild(kode);
    bawah.appendChild(tipe);
    li.appendChild(nama);
    li.appendChild(bawah);
}

// ----- Popup Detail Akun -----
var dialogDetailAkun = document.getElementById("dialog-detail-akun");
var kolomDetailNilai = document.getElementById("detail-nilai");
var kolomDetailPenanggung = document.getElementById("detail-penanggung");
var pilihDetailDivisi = document.getElementById("detail-divisi");
var pilihDetailProgram = document.getElementById("detail-program");
var kolomDetailKeterangan = document.getElementById("detail-keterangan");
// Bagian Dana (PRD 4.1): dua centang Terikat / Tidak Terikat, hanya satu (alat bersama, umum/komponen-transaksi.js)
var danaDetail = pasangPilihanDana(document.getElementById("detail-terikat"), document.getElementById("detail-tidak-terikat"));
var galatDetailNilai = document.getElementById("galat-detail-nilai");
var detailSaatIni = null;   // { akun, baris }: baris = null berarti menambah baris baru, berisi baris = mengubah

var pilihTabDetailAkun = buatPengalihTab(document.querySelectorAll("#dialog-detail-akun [data-detail-tab]"), "detailTab",
    { detail: "detail-panel-detail", info: "detail-panel-info" });

// Divisi dan Program dibuat fleksibel: Divisi TIDAK harus sama dengan divisi milik Program.
// Sebagai kemudahan, kalau Divisi masih kosong saat Program dipilih, Divisi diisi dari program itu (usulan),
// dan tetap bisa diganti. Divisi yang sudah dipilih tidak diubah, dan mengosongkan Program tidak mengubah Divisi.
function usulkanDivisiDariProgram(pilihanProgram, pilihanDivisi) {
    var program = bacaProgram().find(function (p) { return p.id === pilihanProgram.value; });
    if (program && pilihanDivisi.value === "" && program.divisiId &&
        bacaDivisi().some(function (d) { return d.id === program.divisiId; })) {
        pilihanDivisi.value = program.divisiId;
    }
}
pilihDetailProgram.addEventListener("change", function () { usulkanDivisiDariProgram(pilihDetailProgram, pilihDetailDivisi); });

// Isi pilihan Divisi dan Program. Program hanya yang Aktif; program yang dipakai baris ini tetap ditampilkan walau sudah Selesai.
// Nilai awal dipakai apa adanya (baris yang dibuka tetap memakai isinya sendiri, tidak diusulkan ulang).
function isiPilihanDetailAkun(divisiId, programId) {
    isiPilihan(pilihDetailDivisi, bacaDivisi(), { kosong: "Pilih Divisi...", terpilih: divisiId });   // wajib, kecuali Kas & Bank (PRD 5.1)
    isiPilihan(pilihDetailProgram, daftarProgramPilihan(programId), { kosong: "(Tanpa Program)", terpilih: programId });
}

// Divisi, Program, dan pilihan Dana (Terikat / Tidak Terikat) awal untuk baris baru: mengikuti baris terakhir supaya
// tidak perlu memilih berulang-ulang (tetap bisa diubah). Program yang sudah Selesai tidak diikuti (hanya Divisi-nya).
// Dipakai juga oleh Pembayaran dan Pencatatan Donasi. Baris pertama: Dana belum dipilih (null, wajib dipilih; PRD 4.1).
function isianAwalDariBarisTerakhir(daftarBaris) {
    if (!daftarBaris.length) { return { divisiId: "", programId: "", terikat: null }; }
    var terakhir = daftarBaris[daftarBaris.length - 1];
    var program = bacaProgram().find(function (p) { return p.id === terakhir.programId; });
    return { divisiId: terakhir.divisiId || "", programId: (program && program.status === "aktif") ? program.id : "",
             terikat: (terakhir.terikat === true || terakhir.terikat === false) ? terakhir.terikat : null };
}

function bukaDetailAkunJurnal(akun, baris) {
    detailSaatIni = { akun: akun, baris: baris };
    document.getElementById("detail-kode").textContent = teksAman(akun.kode);
    document.getElementById("detail-nama").value = teksAman(akun.nama);
    var sisi = (baris && baris.kredit > 0) ? "kredit" : "debit";
    document.querySelector('input[name="detail-sisi"][value="' + sisi + '"]').checked = true;
    kolomDetailNilai.value = baris ? teksAngkaIsian(Math.max(baris.debit, baris.kredit)) : "";
    kolomDetailPenanggung.value = baris ? teksAman(baris.penanggung) : "";
    kolomDetailKeterangan.value = baris ? teksAman(baris.keterangan) : "";
    var awal = baris ? { divisiId: baris.divisiId, programId: baris.programId, terikat: baris.terikat }
                     : isianAwalDariBarisTerakhir(barisJurnal);
    isiPilihanDetailAkun(awal.divisiId, awal.programId);
    danaDetail.atur(awal.terikat);
    galatDetailNilai.hidden = true;
    pilihTabDetailAkun("detail");
    dialogDetailAkun.showModal();
    kolomDetailNilai.focus();
}

// Nilai ditulis dengan titik ribuan begitu kolom ditinggalkan; huruf diabaikan
kolomDetailNilai.addEventListener("input", function () { galatDetailNilai.hidden = true; });
pasangKolomRupiah(kolomDetailNilai);   // titik ribuan langsung saat mengetik

// Menutup popup Detail Akun dengan cara apa pun. Penanda dipasang SEBELUM menutup: browser mengembalikan fokus ke
// kolom cari tepat saat popup tertutup, dan fokus itu tidak boleh membuka daftar akun.
function tutupDetailAkunJurnal() {
    detailSaatIni = null;
    cariAkunJurnal.abaikanFokusSebentar();
    dialogDetailAkun.close();
}

// Lanjut: periksa nilai, lalu tambah baris (akun baru) atau perbarui baris yang dibuka
function simpanDetailAkunJurnal() {
    if (!detailSaatIni) { return; }
    var nilai = angkaDariTeks(kolomDetailNilai.value);
    if (nilai <= 0) {
        pilihTabDetailAkun("detail");
        galatDetailNilai.textContent = "Nilai wajib diisi dan lebih dari 0.";
        galatDetailNilai.hidden = false;
        kolomDetailNilai.focus();
        return;
    }
    // Divisi dan Dana diperiksa sedini mungkin, saat Lanjut (PRD 5.1): popup tetap terbuka di tab Info Lainnya
    var akunBaris = detailSaatIni.baris || detailSaatIni.akun;
    var kurang = pesanIsianBarisBelumLengkap({ akunId: akunBaris.akunId || akunBaris.id, divisiId: pilihDetailDivisi.value, terikat: danaDetail.ambil() }, true);
    if (kurang) {
        pilihTabDetailAkun("info");
        tampilkanNotifikasi(kurang, "peringatan");
        return;
    }
    var debit = document.querySelector('input[name="detail-sisi"][value="debit"]').checked;
    var data = {
        debit: debit ? nilai : 0,
        kredit: debit ? 0 : nilai,
        penanggung: kolomDetailPenanggung.value.trim(),
        divisiId: pilihDetailDivisi.value,
        programId: pilihDetailProgram.value,
        terikat: danaDetail.ambil(),   // true = Terikat, false = Tidak Terikat (sudah pasti dipilih: diperiksa di atas)
        keterangan: kolomDetailKeterangan.value.trim()
    };
    var baruDitambah = !detailSaatIni.baris;
    if (baruDitambah) {
        var akun = detailSaatIni.akun;
        barisJurnal.push(Object.assign({ id: buatId("r"), akunId: akun.id, kode: akun.kode, nama: akun.nama }, data));
    } else {
        Object.assign(detailSaatIni.baris, data);
    }
    tutupDetailAkunJurnal();
    gambarRincianJurnal();
    if (baruDitambah) { cariAkunJurnal.fokusUlang(); }   // siap memilih akun berikutnya
}
document.getElementById("lanjut-detail-akun").addEventListener("click", simpanDetailAkunJurnal);
document.getElementById("tutup-detail-akun").addEventListener("click", tutupDetailAkunJurnal);
// Klik di latar gelap (di luar kotak) menutup tanpa menyimpan
dialogDetailAkun.addEventListener("click", function (k) { if (k.target === dialogDetailAkun) { tutupDetailAkunJurnal(); } });
// Esc: peristiwa "cancel" datang SEBELUM popup tertutup, jadi penanda dipasang di sini juga
dialogDetailAkun.addEventListener("cancel", function () { cariAkunJurnal.abaikanFokusSebentar(); });
dialogDetailAkun.addEventListener("close", function () { detailSaatIni = null; });
// Enter di kolom isian (bukan di kolom Keterangan) = Lanjut
dialogDetailAkun.addEventListener("keydown", function (k) {
    if (k.key === "Enter" && k.target.tagName === "INPUT" && k.target.type !== "radio") { k.preventDefault(); simpanDetailAkunJurnal(); }
});

// ----- Tabel rincian -----
// Menggambar ulang seluruh baris rincian (saat baris bertambah/berubah/berkurang atau tab dibuka lagi)
function gambarRincianJurnal() {
    badanRincianJurnal.textContent = "";
    if (barisJurnal.length === 0) {
        badanRincianJurnal.appendChild(barisKosongTabel(8));
        hitungTotalJurnal();
        return;
    }
    barisJurnal.forEach(function (b) {
        var tr = document.createElement("tr");
        tr.dataset.id = b.id;
        tr.className = "jurnal-baris-data";
        tr.tabIndex = 0;
        tr.title = "Klik untuk mengubah";

        function sel(kelas, teks) {
            var td = document.createElement("td");
            td.className = kelas || "";
            if (teks !== undefined) { td.textContent = teks; }   // textContent: aman dari kode HTML
            tr.appendChild(td);
            return td;
        }
        var tdGeser = sel("jurnal-kol-geser");
        tdGeser.setAttribute("aria-hidden", "true");
        tdGeser.innerHTML = IKON_GESER;   // ikon tetap
        sel("jurnal-sel-teks jurnal-sel-kode", b.kode);
        sel("jurnal-sel-teks", b.nama);
        sel("jurnal-sel-teks", namaProgramDari(b.programId));
        sel("jurnal-sel-teks", b.penanggung);
        sel("jurnal-sel-teks", b.keterangan);
        sel("jurnal-sel-angka", teksAngkaIsian(b.debit));
        sel("jurnal-sel-angka", teksAngkaIsian(b.kredit));
        tr.appendChild(tombolHapusBaris("Hapus baris " + b.kode + " " + b.nama, function () {
            barisJurnal = barisJurnal.filter(function (x) { return x.id !== b.id; });
            gambarRincianJurnal();
        }));

        // Klik baris (atau Enter saat baris terpilih) membuka Detail Akun untuk mengubahnya
        function bukaUbah() {
            var akun = bacaDaftarAkun().find(function (a) { return a.id === b.akunId; }) || { id: b.akunId, kode: b.kode, nama: b.nama };
            bukaDetailAkunJurnal(akun, b);
        }
        tr.addEventListener("click", bukaUbah);
        tr.addEventListener("keydown", function (k) { if (k.key === "Enter" && k.target === tr) { bukaUbah(); } });
        badanRincianJurnal.appendChild(tr);
    });
    hitungTotalJurnal();
}

// Jumlah debit dan kredit seluruh baris
function jumlahDebitKreditJurnal() {
    var debit = 0, kredit = 0;
    barisJurnal.forEach(function (b) { debit += Number(b.debit) || 0; kredit += Number(b.kredit) || 0; });
    return { debit: debit, kredit: kredit };
}

// Kenapa jurnal belum bisa disimpan (kosong = sudah memenuhi syarat dasar): minimal dua baris, debit sama dengan kredit
function alasanJurnalBelumBisaDisimpan() {
    var total = jumlahDebitKreditJurnal();
    if (barisJurnal.length === 0) { return ""; }
    if (barisJurnal.length < 2) { return "Jurnal minimal berisi dua baris."; }
    if (total.debit !== total.kredit) {
        return "Belum seimbang: selisih " + formatRupiah(Math.abs(total.debit - total.kredit)) + (total.debit > total.kredit ? " (debit lebih besar)." : " (kredit lebih besar).");
    }
    return "";
}

// Total debit dan kredit. Tidak seimbang = total berwarna merah. Tombol Simpan baru menyala kalau jurnal seimbang.
function hitungTotalJurnal() {
    var total = jumlahDebitKreditJurnal();
    document.getElementById("jurnal-total-debit").textContent = formatRupiah(total.debit);
    document.getElementById("jurnal-total-kredit").textContent = formatRupiah(total.kredit);
    document.querySelector("#isi-jurnal .jurnal-total").classList.toggle("tidak-seimbang", barisJurnal.length > 0 && total.debit !== total.kredit);
    var alasan = alasanJurnalBelumBisaDisimpan();
    document.getElementById("jurnal-status").textContent = alasan;
    document.getElementById("jurnal-simpan").disabled = (barisJurnal.length === 0 || alasan !== "");
}

// ----- Lampiran jurnal -----
// Memakai alat bersama umum/lampiran.js (jenis file, batas ukuran, popup, penyimpanan isi file terpisah).
var tombolLampiranJurnal = document.getElementById("jurnal-tombol-lampiran");
var lampiranJurnal = buatLampiranTransaksi({
    jenis: "jurnal", namaFitur: "Jurnal Umum",
    tombol: tombolLampiranJurnal, lencana: document.getElementById("jurnal-lencana-lampiran")
});

// ----- Menyimpan jurnal -----
function sembunyikanGalatJurnal() { document.getElementById("jurnal-pesan-galat").hidden = true; }
function tampilkanGalatJurnal(pesan, kolomFokus) {
    var kotak = document.getElementById("jurnal-pesan-galat");
    kotak.textContent = pesan;
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

// Ringkasan satu baris per rincian, untuk Log Aktivitas (tab Pemeriksaan): perubahan pada baris tetap terlihat.
// Contoh: "110101 Kas Kecil D 1.500.000 [Beasiswa] (Budi); 510101 Beban Gaji K 1.500.000"
function ringkasanRincianJurnal(rincian) {
    return rincian.map(function (r) {
        var teks = r.kode + " " + r.nama + (r.debit > 0 ? " D " + formatAngka(r.debit) : " K " + formatAngka(r.kredit));
        var program = namaProgramDari(r.programId);
        if (program) { teks += " [" + program + "]"; }
        if (r.penanggung) { teks += " (" + r.penanggung + ")"; }
        return teks;
    }).join("; ");
}

// ----- Jurnal otomatis milik transaksi lain (PRD 3.1, 4.1) -----
// Jurnal Umum adalah pemilik buku jurnal, jadi cara menulis jurnal otomatis ada di sini dan dipakai bersama oleh
// Pembayaran (dan nanti Donasi, Penerimaan, Transfer, dll.). Kedua fungsi hanya MENYUSUN daftar baru; penyimpanannya
// dilakukan transaksi asal, supaya transaksi dan jurnalnya bisa disimpan bersama (dan dikembalikan kalau gagal).
// sumber = { jenis: "pembayaran", id: "<id transaksi>" }
function jurnalMilik(jurnal, sumber) {
    return !!jurnal.sumber && jurnal.sumber.jenis === sumber.jenis && jurnal.sumber.id === sumber.id;
}

// Daftar jurnal setelah jurnal milik sumber dibuat atau diganti isinya (nomor dan tanggal mengikuti transaksi asal).
// isi = { nomor, tanggal, keterangan, rincian: [{ akunId, kode, nama, debit, kredit, divisiId, programId, penanggung, keterangan }] }
function daftarJurnalDenganOtomatis(sumber, isi) {
    var daftar = modulJurnal.ambil();
    var rincian = isi.rincian.map(function (r) {
        return { id: buatId("r"), akunId: r.akunId, kode: r.kode, nama: r.nama, debit: r.debit || 0, kredit: r.kredit || 0,
                 penanggung: r.penanggung || "", divisiId: r.divisiId || "", programId: r.programId || "",
                 terikat: r.terikat === true,   // centang Terikat baris pengeluaran ikut ke jurnal (PRD 4.1)
                 keterangan: r.keterangan || "" };
    });
    var data = {
        nomor: isi.nomor, nama: isi.nomor, tanggal: isi.tanggal, keterangan: isi.keterangan, aturanId: "",
        rincian: rincian, jumlahBaris: rincian.length,
        totalDebit: rincian.reduce(function (n, r) { return n + r.debit; }, 0),
        ringkasanRincian: ringkasanRincianJurnal(rincian),
        lampiranInfo: [], jumlahLampiran: 0, ringkasanLampiran: "",
        sumber: { jenis: sumber.jenis, id: sumber.id }
    };
    var lama = daftar.find(function (j) { return jurnalMilik(j, sumber); });
    if (lama) {
        data.diubahPada = waktuSekarang();
        Object.assign(lama, data);   // jurnal dibuat ulang dengan isi terbaru; id dan dibuatPada tetap (PRD 3.1 butir 4)
    } else {
        data.id = buatId("j");
        data.dibuatOleh = penggunaAktif;
        data.dibuatPada = waktuSekarang();
        daftar.push(data);
    }
    return daftar;
}

// ----- Histori satu akun (PRD 6.3 Histori Bank; nanti juga Histori Akun di Buku Besar) -----
// Semua baris buku jurnal yang menyentuh satu akun dalam rentang tanggal, dengan saldo berjalan.
//   saldoAwal = saldo awal akun + semua mutasi sebelum tanggal dari.
//   Arah saldo mengikuti sisi normal akun (tipeSaldoDebit, fitur/akun/akun.js): akun bersisi debit (Kas/Bank, aset, beban)
//   bertambah oleh Debit; akun bersisi kredit bertambah oleh Kredit.
// Hasil: { saldoAwal, baris: [{ jurnal, tanggal, nomor, noCek, tipe, keterangan, mutasi, dk ("Dr"/"Cr"), saldo }] }
function historiAkun(idAkun, dari, sampai) {
    var akun = bacaDaftarAkun().find(function (a) { return a.id === idAkun; });
    if (!akun) { return { saldoAwal: 0, baris: [] }; }
    var sisiDebit = !!tipeSaldoDebit[akun.tipe];
    function bersih(r) { var d = Number(r.debit) || 0, k = Number(r.kredit) || 0; return sisiDebit ? d - k : k - d; }

    // Urut tanggal, lalu waktu dibuat (transaksi di tanggal yang sama tampil sesuai urutan pencatatannya)
    var jurnalUrut = bacaJurnalMentah().slice().sort(function (a, b) {
        return (teksAman(a.tanggal) + teksAman(a.dibuatPada)).localeCompare(teksAman(b.tanggal) + teksAman(b.dibuatPada));
    });
    // No Cek diambil dari transaksi asalnya (Pembayaran/Penerimaan menyimpan noCek)
    function dataAsal(j) {
        var asal = j.sumber ? asalJurnal[j.sumber.jenis] : null;
        return asal ? asal.modul.ambil().find(function (d) { return d.id === j.sumber.id; }) || null : null;
    }

    var saldo = Number(akun.saldoAwal) || 0;
    jurnalUrut.forEach(function (j) {
        if (teksAman(j.tanggal) >= dari) { return; }
        rincianAman(j).forEach(function (r) { if (r.akunId === idAkun) { saldo += bersih(r); } });
    });
    var saldoAwal = saldo;
    var baris = [];
    jurnalUrut.forEach(function (j) {
        var t = teksAman(j.tanggal);
        if (t < dari || (sampai && t > sampai)) { return; }
        rincianAman(j).forEach(function (r) {
            if (r.akunId !== idAkun) { return; }
            var debit = Number(r.debit) || 0;
            saldo += bersih(r);
            var asal = dataAsal(j);
            baris.push({
                jurnal: j, tanggal: t, nomor: teksAman(j.nomor), noCek: asal ? teksAman(asal.noCek) : "",
                tipe: asalJurnalOtomatis(j) || "Jurnal Umum",
                keterangan: teksAman(j.keterangan) || teksAman(r.keterangan),
                mutasi: debit > 0 ? debit : (Number(r.kredit) || 0), dk: debit > 0 ? "Dr" : "Cr", saldo: saldo
            });
        });
    });
    return { saldoAwal: saldoAwal, baris: baris };
}

// ----- Tanda rekonsiliasi bank (PRD 6.3) -----
// Baris jurnal Kas/Bank yang sudah dicocokkan dengan rekening koran: [{ id, jurnalId, akunId, ditandaiOleh, ditandaiPada }].
// Ditulis oleh halaman Rekonsiliasi Bank; dibaca di sini oleh semua formulir transaksi, karena transaksi yang sudah
// direkonsiliasi tidak boleh diubah atau dihapus sebelum tandanya dibatalkan. Kunci ini ikut Cadangan Data
// (terdaftar di jenisKunciCadangan, umum/komponen-daftar.js).
var KUNCI_REKONSILIASI = "tandaRekonsiliasi";
function bacaTandaRekonsiliasi() {
    return bacaDaftarTersimpan(KUNCI_REKONSILIASI);
}
function simpanTandaRekonsiliasi(daftar) {
    try { localStorage.setItem(KUNCI_REKONSILIASI, JSON.stringify(daftar)); return true; }
    catch (galat) { tampilkanNotifikasi("Tanda rekonsiliasi gagal disimpan (penyimpanan browser penuh atau diblokir).", "galat"); return false; }
}
// Tanda cocok untuk satu jurnal di satu akun Kas/Bank (atau undefined). Dipakai Rekonsiliasi Bank dan Histori Bank.
function tandaRekonsiliasiUntuk(daftarTanda, jurnalId, akunId) {
    return daftarTanda.find(function (t) { return t.jurnalId === jurnalId && t.akunId === akunId; });
}
// Membatalkan satu tanda cocok (unceklis): transaksinya bisa diubah/dihapus lagi. Dipakai tombol Batalkan di
// Rekonsiliasi Bank dan klik ceklis di Histori Bank. Mengembalikan true kalau berhasil disimpan.
function batalkanTandaRekonsiliasi(idTanda, nomor) {
    var daftar = bacaTandaRekonsiliasi().filter(function (t) { return t.id !== idTanda; });
    if (!simpanTandaRekonsiliasi(daftar)) { return false; }
    catatLog({ tindakan: "Batalkan cocok", tipe: "Rekonsiliasi Bank", referensi: nomor });
    tampilkanNotifikasi('Tanda cocok "' + nomor + '" dibatalkan. Transaksinya bisa diubah lagi.');
    return true;
}

// Pesan penolakan kalau jurnal ini sudah direkonsiliasi, atau "" kalau bebas diubah/dihapus.
// judul: nama transaksinya, misalnya "Pembayaran" atau "Jurnal".
function galatSudahRekonsiliasi(jurnal, judul) {
    if (!jurnal || !bacaTandaRekonsiliasi().some(function (t) { return t.jurnalId === jurnal.id; })) { return ""; }
    return judul + ' "' + teksAman(jurnal.nomor) + '" sudah direkonsiliasi. Batalkan dulu tanda cocoknya (tombol Batalkan di Rekonsiliasi Bank, atau klik ceklisnya di Histori Bank) sebelum mengubah atau menghapus.';
}
// Sama, untuk transaksi yang membuat jurnal otomatis (dicari lewat sumbernya)
function galatTransaksiSudahRekonsiliasi(jenisSumber, idTransaksi, judul) {
    var jurnal = modulJurnal.ambil().find(function (j) { return jurnalMilik(j, { jenis: jenisSumber, id: idTransaksi }); });
    return galatSudahRekonsiliasi(jurnal, judul);
}

// Daftar jurnal tanpa jurnal milik sumber (dipakai saat transaksi asalnya dihapus)
function daftarJurnalTanpaOtomatis(sumber) {
    return modulJurnal.ambil().filter(function (j) { return !jurnalMilik(j, sumber); });
}

document.getElementById("form-jurnal").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatJurnal();
    var daftar = modulJurnal.ambil();
    var sedangMengubah = (modulJurnal.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (j) { return j.id === modulJurnal.idDiubah; }) : null;
    var tanggal = kolomTanggalJurnal.value;

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama.
    // Jurnal otomatis tidak bisa diubah di sini, apa pun tanggalnya
    var asal = asalJurnalOtomatis(lama);
    if (asal) {
        tampilkanGalatJurnal("Jurnal ini dibuat otomatis dari " + asal + ". Ubah lewat halaman " + asal + ".");
        return;
    }
    // Jurnal yang sudah direkonsiliasi tidak bisa diubah sebelum tandanya dibatalkan (PRD 6.3)
    var rekonsiliasi = galatSudahRekonsiliasi(lama, "Jurnal");
    if (rekonsiliasi) {
        tampilkanGalatJurnal(rekonsiliasi);
        return;
    }
    // Tanggal: aturan bersama (umum/komponen-transaksi.js)
    var galatTanggal = galatTanggalTransaksi(tanggal, lama, { catat: "jurnal", ini: "Jurnal ini" });
    if (galatTanggal) {
        tampilkanGalatJurnal(galatTanggal.pesan, galatTanggal.diKolom ? kolomTanggalJurnal : null);
        return;
    }
    var alasan = alasanJurnalBelumBisaDisimpan();
    if (barisJurnal.length === 0) { alasan = "Rincian jurnal masih kosong. Pilih akun lewat kolom cari."; }
    if (alasan !== "") {
        tampilkanGalatJurnal(alasan);
        return;
    }
    // Pengaman (PRD 4.1, 5.1): setiap baris selain Kas & Bank wajib punya Divisi dan pilihan Dana, supaya tidak lupa.
    // Peringatannya notifikasi di pojok kanan atas (seperti peringatan lain di aplikasi).
    var belumLengkap = pesanBarisBelumLengkap(barisJurnal, true);
    if (belumLengkap) {
        tampilkanNotifikasi(belumLengkap, "peringatan");
        return;
    }
    // Preferensi, Lampiran: bila jurnal wajib berlampiran, minimal satu file harus ada
    if (lampiranJurnal.wajibKosong()) {
        tampilkanGalatJurnal(lampiranJurnal.pesanWajib, tombolLampiranJurnal);
        return;
    }

    // Nomor: otomatis (dari aturan yang dipilih) atau diketik sendiri. Nomor harus unik.
    var infoNomor = nomorJurnal.ambil(tanggal);
    if (infoNomor.galat) { tampilkanGalatJurnal(infoNomor.galat, infoNomor.kolomFokus); return; }
    var nomor = infoNomor.nomor;
    // daftar = seluruh buku jurnal (termasuk jurnal otomatis), jadi cukup dicek di daftar itu sendiri
    if (nomorTransaksiTerpakai(nomor, daftar, modulJurnal.idDiubah, null)) {
        tampilkanGalatJurnal('Nomor "' + nomor + '" sudah dipakai jurnal lain.' + (infoNomor.otomatis ? " Matikan Otomatis dan ketik nomor lain, atau pilih aturan penomoran lain." : ""), nomorJurnal.kolomNomorKembar());
        return;
    }

    var rincian = barisJurnal.map(function (b) {
        return { id: b.id, akunId: b.akunId, kode: b.kode, nama: b.nama, debit: b.debit, kredit: b.kredit,
                 penanggung: b.penanggung, divisiId: b.divisiId, programId: b.programId, terikat: b.terikat === true,
                 keterangan: b.keterangan };
    });
    var data = {
        nomor: nomor,
        nama: nomor,   // komponen daftar memakai "nama" sebagai penanda data di notifikasi, konfirmasi hapus, dan Log Aktivitas
        tanggal: tanggal,
        keterangan: document.getElementById("jurnal-keterangan").value.trim(),
        aturanId: infoNomor.aturanId,
        rincian: rincian,
        jumlahBaris: rincian.length,
        totalDebit: jumlahDebitKreditJurnal().debit,
        ringkasanRincian: ringkasanRincianJurnal(rincian)
    };
    Object.assign(data, lampiranJurnal.infoData());   // hanya keterangan file; isinya disimpan terpisah (umum/lampiran.js)
    // Pengaman Kas/Bank minus (PRD 5.6, alat bersama umum/komponen-transaksi.js); jurnal lama (kalau diubah) diganti
    if (!periksaKasMinus({ tanggal: tanggal, rincian: rincian }, function (j) { return !!lama && j.id === lama.id; })) { return; }
    var salinanLama = lama ? Object.assign({}, lama) : null;
    var idJurnal = lama ? lama.id : buatId("j");
    // Isi file disimpan lebih dulu. Kalau penyimpanan browser penuh, jurnal tidak jadi disimpan dan kita beri tahu.
    var simpananLampiran = lampiranJurnal.simpanIsi(idJurnal);
    if (!simpananLampiran) { tampilkanGalatJurnal(lampiranJurnal.pesanPenuh, tombolLampiranJurnal); return; }
    if (sedangMengubah) {
        data.diubahPada = waktuSekarang();
        Object.assign(lama, data);   // timpa nilai lama dengan yang baru (id, dibuatOleh, dibuatPada tetap)
    } else {
        data.id = idJurnal;
        data.dibuatOleh = penggunaAktif;
        data.dibuatPada = waktuSekarang();
        daftar.push(data);
    }
    if (!modulJurnal.simpan(daftar)) {
        simpananLampiran.pulihkan();   // jurnal gagal disimpan: kembalikan isi lampiran seperti semula
        return;
    }
    // Nomor otomatis baru "dipakai" (hitungan naik) setelah jurnal benar-benar tersimpan
    var tersimpan = sedangMengubah ? lama : data;
    var nomorDipakai = nomorJurnal.pakai(infoNomor, tanggal);
    if (nomorDipakai !== tersimpan.nomor) {
        tersimpan.nomor = nomorDipakai;
        tersimpan.nama = nomorDipakai;
        modulJurnal.simpan(daftar);
    }
    modulJurnal.selesaiSimpan(sedangMengubah, tersimpan, salinanLama);
});

// Aturan penomoran bisa berubah di Pengaturan, jadi pilihan dimuat ulang setiap tab dibuka
saatTabDibuka.jurnal = function () { modulJurnal.gambarTabel(); nomorJurnal.segarkan(); gambarRincianJurnal(); };

// Dipanggil dari Buku Besar, kotak Jurnal Umum: buka tab, langsung ke formulir jurnal baru
function bukaJurnalBaru() {
    modulJurnal.bukaDariMenu();
}
