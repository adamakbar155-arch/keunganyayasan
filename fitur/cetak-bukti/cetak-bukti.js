// ==================== Cetak Bukti ====================
// Mencetak transaksi tersimpan memakai desain dari Desain Cetakan (PRD 6.9): Tanda Terima Donasi, Bukti Pembayaran, Bukti Penerimaan,
// Bukti Transfer, Bukti Jurnal. Hanya menyalin data ke kertas: tidak mengubah transaksi. Klik Cetak membuka Halaman Cetak berisi PDF
// (fitur/cetak-bukti/pdf-bukti.js), jadi hasilnya sama di semua browser. Tombol di formulir ditandai data-cetak-bukti="<nama formulir>".
// Dimuat sesudah semua formulir transaksi, fitur/cetakan/cetakan.js, dan pdf-bukti.js.

// ---------- Terbilang ----------
var ANGKA_TERBILANG = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

function terbilangBulat(n) {
    if (n < 12) { return ANGKA_TERBILANG[n]; }
    if (n < 20) { return terbilangBulat(n - 10) + " belas"; }
    if (n < 100) { return (terbilangBulat(Math.floor(n / 10)) + " puluh " + terbilangBulat(n % 10)).trim(); }
    if (n < 200) { return ("seratus " + terbilangBulat(n - 100)).trim(); }
    if (n < 1000) { return (terbilangBulat(Math.floor(n / 100)) + " ratus " + terbilangBulat(n % 100)).trim(); }
    if (n < 2000) { return ("seribu " + terbilangBulat(n - 1000)).trim(); }
    if (n < 1e6) { return (terbilangBulat(Math.floor(n / 1000)) + " ribu " + terbilangBulat(n % 1000)).trim(); }
    if (n < 1e9) { return (terbilangBulat(Math.floor(n / 1e6)) + " juta " + terbilangBulat(n % 1e6)).trim(); }
    if (n < 1e12) { return (terbilangBulat(Math.floor(n / 1e9)) + " miliar " + terbilangBulat(n % 1e9)).trim(); }
    return (terbilangBulat(Math.floor(n / 1e12)) + " triliun " + terbilangBulat(n % 1e12)).trim();
}

// 1500000 -> "Satu juta lima ratus ribu rupiah". Nilai dibulatkan ke rupiah.
function terbilangRupiah(nilai) {
    var n = Math.round(Math.abs(Number(nilai) || 0));
    var teks = n === 0 ? "nol" : terbilangBulat(n);
    return (Number(nilai) < 0 ? "Minus " : "") + (Number(nilai) < 0 ? teks : teks.charAt(0).toUpperCase() + teks.slice(1)) + " rupiah";
}

// ---------- Data tiap dokumen ----------
function divisiProgramCetak(b) {
    return [teksAman(namaDivisiDari(teksAman(b.divisiId))), teksAman(namaProgramDari(teksAman(b.programId)))].filter(Boolean).join(" / ");
}

function noJurnalCetak(sumberJenis, id) {
    var j = bacaJurnalMentah().find(function (x) { return x && x.sumber && x.sumber.jenis === sumberJenis && x.sumber.id === id; });
    return j ? teksAman(j.noJurnal) : "";
}

function dasarCetak(judul, d, jumlah) {
    return { judul: judul, nomor: teksAman(d.nomor), tanggal: formatTanggal(teksAman(d.tanggal)), jumlah: formatRupiah(jumlah), terbilang: terbilangRupiah(jumlah) };
}

// Bukti Pembayaran dan Bukti Penerimaan berbentuk sama, hanya kata di kepalanya berbeda
function dataKasCetak(d, judul, kunciPihak, sumber) {
    var total = Number(d.total) || 0;
    return Object.assign(dasarCetak(judul, d, total), {
        kas: teksAman(d.kas).replace(/^\S+\s+-\s+/, ""), pihak: teksAman(d[kunciPihak]) || "-", no_cek: teksAman(d.noCek) || "-",
        keterangan: teksAman(d.catatan), no_jurnal: noJurnalCetak(sumber, d.id),
        tabel: {
            kolom: KOLOM_TABEL_CETAK["bukti-pembayaran"],
            baris: rincianAman(d).map(function (b) { return [teksAman(b.kode) + " " + teksAman(b.nama), teksAman(b.catatan) || teksAman(d.catatan), divisiProgramCetak(b), formatAngka(b.nilai)]; }),
            total: ["Total", "", "", formatAngka(total)]
        }
    });
}

var JENIS_CETAK = {
    "Pembayaran": { tipe: "bukti-pembayaran", form: "form-bayar", modul: function () { return asalJurnal.pembayaran.modul; }, data: function (d) { return dataKasCetak(d, "BUKTI PEMBAYARAN", "penerima", "pembayaran"); } },
    "Penerimaan": { tipe: "bukti-penerimaan", form: "form-terima", modul: function () { return asalJurnal.penerimaan.modul; }, data: function (d) { return dataKasCetak(d, "BUKTI PENERIMAAN", "pemberi", "penerimaan"); } },
    "Transfer Bank": { tipe: "bukti-transfer", form: "form-transfer", modul: function () { return modulTransfer; }, data: function (d) {
        var nilai = Number(d.nilai) || 0;
        return Object.assign(dasarCetak("BUKTI TRANSFER", d, nilai), {
            dari_kas: teksAman(d.dari), ke_kas: teksAman(d.ke), keterangan: teksAman(d.catatan), no_jurnal: noJurnalCetak(SUMBER_JURNAL_TRANSFER, d.id),
            tabel: { kolom: KOLOM_TABEL_CETAK["bukti-transfer"], baris: [[teksAman(d.dari), teksAman(d.ke), formatAngka(nilai)]], total: ["Total", "", formatAngka(nilai)] }
        });
    } },
    "Jurnal Umum": { tipe: "jurnal-umum", form: "form-jurnal", modul: function () { return modulJurnal; }, data: function (d) {
        var debit = 0, kredit = 0;
        var baris = rincianAman(d).map(function (r) {
            debit += Number(r.debit) || 0;
            kredit += Number(r.kredit) || 0;
            return [teksAman(r.kode) + " " + teksAman(r.nama), teksAman(r.keterangan), formatAngka(r.debit || 0), formatAngka(r.kredit || 0)];
        });
        return Object.assign(dasarCetak("BUKTI JURNAL", d, debit), {
            keterangan: teksAman(d.keterangan), no_jurnal: teksAman(d.noJurnal),
            tabel: { kolom: KOLOM_TABEL_CETAK["jurnal-umum"], baris: baris, total: ["Total", "", formatAngka(debit), formatAngka(kredit)] }
        });
    } },
    "Pencatatan Donasi": { tipe: "kuitansi-donasi", form: "form-donasi-catat", modul: function () { return modulDonasiCatat; }, data: function (d) {
        var total = rincianAman(d).reduce(function (n, b) { return n + (Number(b.nilai) || 0); }, 0);
        var donatur = bacaDaftarTersimpan("daftarDonatur").find(function (x) { return x && x.id === d.donaturId; }) || {};
        return Object.assign(dasarCetak("TANDA TERIMA DONASI", d, total), {
            donatur: teksAman(donatur.nama) || "-", id_donatur: teksAman(donatur.idDonatur) || "-", cara_bayar: teksAman(d.caraBayar), kas: teksAman(d.kas).replace(/^\S+\s+-\s+/, ""),
            keterangan: teksAman(d.keterangan), no_jurnal: noJurnalCetak(SUMBER_JURNAL_DONASI, d.id),
            tabel: {
                kolom: KOLOM_TABEL_CETAK["kuitansi-donasi"],
                baris: rincianAman(d).map(function (b) { return [teksAman(b.nama), teksAman(namaProgramDari(teksAman(b.programId))) || "-", formatAngka(b.nilai)]; }),
                total: null
            }
        });
    } }
};

// ---------- Desain ----------
var KERTAS_BUKTI_BAWAAN = { kertas: "A5", orientasi: "landscape", margin: { kiri: 10, kanan: 10, atas: 8, bawah: 6 } };
// Tanda Terima Donasi seukuran slip gaji: sepertiga A4 mendatar (keputusan pengguna 2026-11-07)
var KERTAS_TANDA_TERIMA = { kertas: "Slip", orientasi: "landscape", margin: { kiri: 10, kanan: 10, atas: 5, bawah: 3 } };

function kertasBawaanTipe(tipe) {
    return JSON.parse(JSON.stringify(tipe === "kuitansi-donasi" ? KERTAS_TANDA_TERIMA : KERTAS_BUKTI_BAWAAN));
}

// Isi desain tanpa id, untuk membandingkan apakah pengguna pernah mengeditnya
function sidikElemen(elemen) {
    return JSON.stringify(elemen.map(function (e) { return Object.assign({}, e, { id: "" }); }));
}

function marginDesain(desain) {
    return desain.margin && typeof desain.margin === "object" ? desain.margin : kertasAwalCetakan.margin;
}

// Desain Tanda Terima bawaan di browser ini (A4 atau A5) dipindah ke Slip, HANYA kalau isinya masih sama persis dengan desain bawaan
// kertas itu atau masih kosong. Yang sudah diedit tidak disentuh. Berjalan sekali per browser, supaya pengguna tetap bisa
// memilih kertas lain sesudahnya.
var KUNCI_TANDA_TERIMA_SLIP = "tandaTerimaSudahSlip";

function perbaruiTandaTerimaLama() {
    if (localStorage.getItem(KUNCI_TANDA_TERIMA_SLIP)) { return; }
    var daftar = bacaCetakan(), berubah = false;
    daftar.forEach(function (c) {
        if (c.tipe !== "kuitansi-donasi" || c.kertas === KERTAS_TANDA_TERIMA.kertas) { return; }
        var ada = Array.isArray(c.elemen) && c.elemen.length > 0;
        var bawaan = elemenBawaan(c.tipe, { kertas: c.kertas, orientasi: c.orientasi, margin: marginDesain(c) });
        if (ada && sidikElemen(c.elemen) !== sidikElemen(bawaan)) { return; }
        Object.assign(c, kertasBawaanTipe(c.tipe));
        c.elemen = elemenBawaan(c.tipe, c);
        berubah = true;
    });
    if (berubah) { modulCetakan.simpan(daftar); }
    localStorage.setItem(KUNCI_TANDA_TERIMA_SLIP, "1");
}

// Desain tipe ini; kalau belum ada, desain bawaan dibuat dan disimpan supaya bisa diedit di Desain Cetakan (PRD 6.9)
function desainUntukTipe(tipe) {
    if (tipe === "kuitansi-donasi") { perbaruiTandaTerimaLama(); }
    var daftar = bacaCetakan().filter(function (c) { return c.tipe === tipe; });
    if (daftar.length) { return daftar; }
    var baru = Object.assign({ id: buatId("c"), nama: tipeCetakan[tipe], tipe: tipe, html: "" }, kertasBawaanTipe(tipe));
    baru.elemen = elemenBawaan(tipe, baru);
    modulCetakan.simpan(bacaCetakan().concat([baru]));
    return [baru];
}

function elemenDesain(desain) {
    var pengaturan = { kertas: desain.kertas, orientasi: desain.orientasi, margin: marginDesain(desain) };
    var ada = Array.isArray(desain.elemen) ? desain.elemen.filter(function (e) { return e && typeof e === "object" && typeof e.id === "string" && namaJenisElemen[e.jenis]; }) : null;
    return ada || elemenBawaan(desain.tipe, pengaturan);
}

// ---------- Mencetak ----------
function jalankanCetak(desain, data, nomor, namaJenis) {
    buatBuktiPdf(desain, data, function (pdf) {
        if (!pdf) {
            tampilkanNotifikasi("Dokumen belum bisa dibuat.", "peringatan");
            return;
        }
        catatLog({ tindakan: "Cetak", tipe: namaJenis, referensi: nomor });
        var judul = namaJenis + " " + nomor;
        tampilkanHalamanCetak(pdf, judul, namaBerkasPdf(judul));
    });
}

var dialogPilihDesain = document.getElementById("dialog-pilih-desain");

// Tombol Cetak juga menyimpan (PRD 6.9): Data Baru dan transaksi yang diubah disimpan dulu lewat jalur tombol Simpan, jadi semua pemeriksaan tetap
// berlaku; kalau ditolak, pesannya tampil dan tidak ada yang dicetak. Transaksi yang tidak diubah langsung dicetak tanpa disimpan ulang, supaya
// Log tidak mencatat perubahan palsu, dan transaksi terkunci atau sudah direkonsiliasi tetap bisa dicetak ulang.
function cetakTransaksi(namaJenis) {
    var jenis = JENIS_CETAK[namaJenis], modul = jenis.modul();
    // Tab yang tidak diubah: langsung cetak (komponen tab mengetahui perubahannya, umum/komponen-daftar.js)
    if (modul.idDiubah !== null && !modul.adaPerubahan()) { cetakTersimpan(namaJenis, modul.idDiubah); return; }
    modul.idTerakhirDisimpan = null;
    document.getElementById(jenis.form).requestSubmit();   // berhasil = komponen mengisi idTerakhirDisimpan
    if (modul.idTerakhirDisimpan) { cetakTersimpan(namaJenis, modul.idTerakhirDisimpan); }
}

function cetakTersimpan(namaJenis, idTransaksi) {
    var jenis = JENIS_CETAK[namaJenis];
    var transaksi = jenis.modul().ambil().find(function (d) { return d.id === idTransaksi; });
    if (!transaksi) { return; }
    var data = jenis.data(transaksi), desain = desainUntukTipe(jenis.tipe);
    if (desain.length === 1) { jalankanCetak(desain[0], data, data.nomor, namaJenis); return; }
    var wadah = document.getElementById("daftar-pilih-desain");
    wadah.textContent = "";
    desain.forEach(function (c) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = teksAman(c.nama);   // textContent: aman dari kode HTML
        b.addEventListener("click", function () {
            dialogPilihDesain.close();
            jalankanCetak(c, data, data.nomor, namaJenis);
        });
        wadah.appendChild(b);
    });
    dialogPilihDesain.showModal();
}

document.querySelectorAll("[data-cetak-bukti]").forEach(function (tombol) {
    tombol.addEventListener("click", function () { cetakTransaksi(tombol.dataset.cetakBukti); });
});
document.getElementById("tutup-pilih-desain").addEventListener("click", function () { dialogPilihDesain.close(); });
