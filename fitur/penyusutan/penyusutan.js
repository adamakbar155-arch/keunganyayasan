// ==================== Proses Penyusutan ====================
// Satu proses = satu bulan = satu jurnal per akhir bulan (PRD 6.6): Debit Beban Penyusutan, Kredit Akumulasi Penyusutan, tanpa Divisi
// dan Program karena aset milik yayasan. Bulan yang sudah diproses tidak bisa diproses lagi. Membatalkan = menghapus proses bulan terakhir.
// Satu data (kunci daftarPenyusutan): { id, nomor (PNY.2026.10), nama(=nomor), bulan ("2026-10"), tanggal, rincian: [{ asetId, kode, nama, kategoriId, nilai }], total }
// Memakai fitur/aset-tetap/hitung.js dan simpanTransaksiDenganJurnal. HTML: fitur/penyusutan/tampilan.js.

var SUMBER_JURNAL_PENYUSUTAN = "penyusutan";
var pilihBulanPny = document.getElementById("pny-bulan");
var kolomTahunPny = document.getElementById("pny-tahun");
isiPilihanBulanAnggaran(pilihBulanPny);

function teksBulanPny(bulan) {
    return (namaBulanKalender[Number(bulan.slice(5, 7)) - 1] || "") + " " + bulan.slice(0, 4);
}
function bulanTerakhirPny() {
    return bacaPenyusutan().map(function (p) { return teksAman(p.bulan); }).sort().pop() || "";
}
function bulanSesudah(bulan) {
    var t = Number(bulan.slice(0, 4)), b = Number(bulan.slice(5, 7));
    return b === 12 ? (t + 1) + "-01" : t + "-" + String(b + 1).padStart(2, "0");
}
// Sesudah bulan terakhir; proses pertama: bulan aset paling awal dipakai, atau bulan ini
function bulanAwalPny() {
    var terakhir = bulanTerakhirPny();
    if (terakhir) { return bulanSesudah(terakhir); }
    return bacaAsetTetap().map(function (a) { return teksAman(a.tanggalPakai).slice(0, 7); }).filter(Boolean).sort()[0] || tanggalHariIni().slice(0, 7);
}
function bulanDipilihPny() {
    return kolomTahunPny.value + "-" + String(pilihBulanPny.value).padStart(2, "0");
}

var modulPenyusutan = buatModulDaftar({
    id: "penyusutan",
    judul: "Proses Penyusutan",
    kunci: "daftarPenyusutan",
    urutAwal: { kolom: "bulan", arah: -1 },
    labelData: { nomor: "Nomor", bulan: "Bulan", total: "Total (Rp)" },
    formatData: { total: teksRupiahAwal },
    kolom: [
        { kunci: "bulan", judul: "Bulan", tampil: function (p) { return teksBulanPny(teksAman(p.bulan)); }, urut: function (p) { return teksAman(p.bulan); } },
        { kunci: "nomor", judul: "Nomor" },
        { kunci: "jumlah", judul: "Jumlah Aset", rata: "kanan", tampil: function (p) { return String(rincianAman(p).length); } },
        { kunci: "total", judul: "Total", rata: "kanan", tampil: function (p) { return formatAngka(p.total || 0); }, urut: function (p) { return String(p.total || 0).padStart(18, "0"); } }
    ],
    pesanKosong: "Belum ada proses penyusutan. Klik tombol + untuk memproses.",
    // Hanya bulan terakhir yang bisa dibatalkan, supaya deret bulan tidak bolong (PRD 6.6)
    alasanTolakHapus: function (p) {
        if (teksAman(p.bulan) !== bulanTerakhirPny()) { return "Hanya proses bulan terakhir yang bisa dibatalkan."; }
        if (rincianAman(p).some(function (r) { return !!lepasDariAset(r.asetId); })) { return "Ada aset di proses ini yang sudah dilepas. Hapus dulu data Lepas Aset-nya."; }
        return tanggalTerkunci(p.tanggal) ? "Bulan ini sudah terkunci (Preferensi, Pembatasan), jadi tidak bisa dibatalkan." : "";
    },
    saatDihapus: function (p) {
        modulJurnal.simpan(daftarJurnalTanpaOtomatis({ jenis: SUMBER_JURNAL_PENYUSUTAN, id: p.id }));
    },
    isiForm: function (data) {
        var bulan = data ? teksAman(data.bulan) : bulanAwalPny();
        pilihBulanPny.value = String(Number(bulan.slice(5, 7)));
        kolomTahunPny.value = bulan.slice(0, 4);
        // Proses tersimpan hanya dilihat; proses berikutnya bulannya sudah pasti
        var tetap = !!data || !!bulanTerakhirPny();
        pilihBulanPny.disabled = tetap;
        kolomTahunPny.disabled = tetap;
        document.getElementById("pny-simpan").hidden = !!data;
        document.getElementById("pny-pesan-galat").hidden = true;
        gambarRincianPny(data ? rincianAman(data) : barisPenyusutanBulan(bulan), data);
    }
});

daftarkanAsalJurnal(SUMBER_JURNAL_PENYUSUTAN, { nama: "Proses Penyusutan", modul: modulPenyusutan, tab: "penyusutan" });

function gambarRincianPny(baris, tersimpan) {
    var badan = document.getElementById("pny-rincian");
    badan.textContent = "";
    if (baris.length === 0) {
        var kosong = badan.insertRow().insertCell();
        kosong.colSpan = 3;
        kosong.className = "pny-kosong";
        kosong.textContent = "Tidak ada aset yang disusutkan pada bulan ini";
    }
    var total = 0;
    baris.forEach(function (b) {
        total += Number(b.nilai) || 0;
        var tr = badan.insertRow();
        tr.insertCell().textContent = teksAman(b.kode);   // textContent: aman dari kode HTML
        tr.insertCell().textContent = teksAman(b.nama);
        var nilai = tr.insertCell();
        nilai.className = "sel-kanan";
        nilai.textContent = formatAngka(b.nilai);
    });
    document.getElementById("pny-total").textContent = formatRupiah(total);
    document.getElementById("pny-petunjuk").textContent = tersimpan
        ? "Sudah diproses. Klik tombol Hapus untuk membatalkan proses bulan terakhir."
        : "Simpan membuat satu jurnal per akhir bulan: Debit Beban Penyusutan, Kredit Akumulasi Penyusutan.";
}

function segarkanRincianPny() {
    if (modulPenyusutan.idDiubah) { return; }
    gambarRincianPny(barisPenyusutanBulan(bulanDipilihPny()), null);
}
pilihBulanPny.addEventListener("change", segarkanRincianPny);
kolomTahunPny.addEventListener("input", segarkanRincianPny);

// Jurnal: akun yang sama dijumlah, jadi satu baris per akun beban dan per akun akumulasi
function isiJurnalPenyusutan(p) {
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var debit = Object.create(null), kredit = Object.create(null);
    rincianAman(p).forEach(function (b) {
        var k = kategoriAsetDari(b.kategoriId);
        debit[k.akunBebanId] = (debit[k.akunBebanId] || 0) + b.nilai;
        kredit[k.akunAkumulasiId] = (kredit[k.akunAkumulasiId] || 0) + b.nilai;
    });
    function baris(id, d, c) {
        return { akunId: id, kode: perId[id].kode, nama: perId[id].nama, debit: d, kredit: c, keterangan: "Penyusutan " + teksBulanPny(p.bulan) };
    }
    return {
        nomor: p.nomor, tanggal: p.tanggal, keterangan: "Penyusutan aset tetap " + teksBulanPny(p.bulan),
        rincian: Object.keys(debit).map(function (id) { return baris(id, debit[id], 0); })
            .concat(Object.keys(kredit).map(function (id) { return baris(id, 0, kredit[id]); }))
    };
}

function tampilkanGalatPny(pesan) {
    var kotak = document.getElementById("pny-pesan-galat");
    kotak.textContent = pesan;   // textContent: aman dari kode HTML
    kotak.hidden = false;
}

document.getElementById("form-penyusutan").addEventListener("submit", function (e) {
    e.preventDefault();
    if (modulPenyusutan.idDiubah) { return; }   // proses tersimpan hanya dilihat
    document.getElementById("pny-pesan-galat").hidden = true;
    var daftar = modulPenyusutan.ambil();
    var tahun = Number(kolomTahunPny.value);
    if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) { tampilkanGalatPny("Tahun wajib diisi, dari 2000 sampai 2100."); return; }
    var bulan = bulanDipilihPny();
    if (daftar.some(function (p) { return p.bulan === bulan; })) { tampilkanGalatPny("Bulan " + teksBulanPny(bulan) + " sudah diproses."); return; }
    var terakhir = bulanTerakhirPny();
    if (terakhir && bulan !== bulanSesudah(terakhir)) { tampilkanGalatPny("Proses berikutnya harus " + teksBulanPny(bulanSesudah(terakhir)) + "."); return; }
    if (bulan > tanggalHariIni().slice(0, 7)) { tampilkanGalatPny("Bulan yang belum tiba tidak bisa diproses."); return; }
    var baris = barisPenyusutanBulan(bulan);
    if (baris.length === 0) { tampilkanGalatPny("Tidak ada aset yang disusutkan pada bulan ini."); return; }
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var kurang = baris.find(function (b) {
        var k = kategoriAsetDari(b.kategoriId);
        return !k || !perId[teksAman(k.akunBebanId)] || !perId[teksAman(k.akunAkumulasiId)];
    });
    if (kurang) { tampilkanGalatPny('Akun penyusutan untuk aset "' + kurang.nama + '" belum lengkap. Periksa Kategori Aset.'); return; }
    var tanggal = akhirBulanAset(bulan);
    var galatTanggal = galatTanggalTransaksi(tanggal, null, { catat: "penyusutan", ini: "Penyusutan ini" });
    if (galatTanggal) { tampilkanGalatPny(galatTanggal.pesan); return; }

    var nomor = "PNY." + bulan.replace("-", ".");
    var data = {
        id: buatId("pny"), nomor: nomor, nama: nomor, bulan: bulan, tanggal: tanggal, rincian: baris,
        total: baris.reduce(function (n, b) { return n + b.nilai; }, 0), dibuatOleh: penggunaAktif, dibuatPada: waktuSekarang()
    };
    daftar.push(data);
    // Nomornya sudah pasti dari bulannya, jadi tidak memakai aturan penomoran
    simpanTransaksiDenganJurnal({
        modul: modulPenyusutan, kunci: "daftarPenyusutan", daftar: daftar, trx: data, sedangMengubah: false, salinanLama: null,
        sumberJurnal: SUMBER_JURNAL_PENYUSUTAN, isiJurnal: isiJurnalPenyusutan,
        nomor: { pakai: function (info) { return info.nomor; } }, infoNomor: { nomor: nomor }, tanggal: tanggal
    });
});

saatTabDibuka.penyusutan = function () {
    modulPenyusutan.gambarTabel();
    if (!modulPenyusutan.idDiubah) { modulPenyusutan.bukaBaru(); }
};

function bukaPenyusutanBaru() { modulPenyusutan.bukaDariMenu(); }
