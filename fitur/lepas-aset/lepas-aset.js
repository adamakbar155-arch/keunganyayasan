// ==================== Lepas Aset ====================
// Aset yang dijual, rusak, hilang, atau dihibahkan (PRD 6.6). Jurnal otomatis: Debit Akumulasi Penyusutan, Debit Kas/Bank (kalau dijual),
// Kredit Akun Aset; selisih dengan Nilai Buku masuk Akun Untung/Rugi. Sesudah dilepas penyusutan berhenti, dan datanya tetap tersimpan.
// Satu data (kunci daftarLepasAset): { id, nomor (LA-00001), nama(=nomor), tanggal, asetId, kodeAset, namaAset, alasan, nilaiAset, sudahDisusutkan,
//   nilaiBuku, nilaiJual, selisih, kasId, akunSelisihId, catatan }. Data tersimpan hanya dilihat; membatalkan = menghapus.
// Memakai fitur/aset-tetap/hitung.js dan simpanTransaksiDenganJurnal. HTML: fitur/lepas-aset/tampilan.js.

var SUMBER_JURNAL_LEPAS = "lepas-aset";
var ALASAN_LEPAS_ASET = ["Dijual", "Rusak", "Hilang", "Dihibahkan"];
var pilihAsetLepas = document.getElementById("lepas-aset");
var kolomTanggalLepas = document.getElementById("lepas-tanggal");
var pilihAlasanLepas = document.getElementById("lepas-alasan");
var kolomNilaiLepas = document.getElementById("lepas-nilai");
var pilihKasLepas = document.getElementById("lepas-kas");
var pilihAkunLepas = document.getElementById("lepas-akun");
isiPilihan(pilihAlasanLepas, ALASAN_LEPAS_ASET, { nilai: function (a) { return a; }, teks: function (a) { return a; }, kosong: "Silakan Pilih" });   // PRD 5.3a

function nomorLepasBerikut(daftar) {
    var terbesar = daftar.reduce(function (n, l) {
        var cocok = /^LA-(\d+)$/.exec(teksAman(l.nomor));
        return cocok ? Math.max(n, Number(cocok[1])) : n;
    }, 0);
    return "LA-" + String(terbesar + 1).padStart(5, "0");
}

var modulLepasAset = buatModulDaftar({
    id: "lepas-aset",
    judul: "Lepas Aset",
    kunci: "daftarLepasAset",
    urutAwal: { kolom: "tanggal", arah: -1 },
    labelData: { nomor: "Nomor", tanggal: "Tanggal", namaAset: "Aset", alasan: "Alasan", nilaiJual: "Nilai Jual (Rp)", catatan: "Catatan" },
    formatData: { tanggal: function (t) { return formatTanggal(t); }, nilaiJual: teksRupiahAwal },
    kolom: [
        { kunci: "nomor", judul: "Nomor" },
        { kunci: "tanggal", judul: "Tanggal", tampil: function (l) { return formatTanggal(teksAman(l.tanggal)); }, urut: function (l) { return teksAman(l.tanggal); } },
        { kunci: "namaAset", judul: "Aset" },
        { kunci: "alasan", judul: "Alasan" },
        { kunci: "nilaiBuku", judul: "Nilai Buku", rata: "kanan", tampil: function (l) { return formatAngka(l.nilaiBuku || 0); } },
        { kunci: "nilaiJual", judul: "Nilai Jual", rata: "kanan", tampil: function (l) { return formatAngka(l.nilaiJual || 0); } }
    ],
    pesanKosong: "Belum ada aset yang dilepas. Klik tombol + untuk menambah.",
    alasanTolakHapus: function (l) {
        return tanggalTerkunci(l.tanggal) ? "Tanggalnya sudah terkunci (Preferensi, Pembatasan), jadi tidak bisa dibatalkan." : "";
    },
    saatDihapus: function (l) {
        modulJurnal.simpan(daftarJurnalTanpaOtomatis({ jenis: SUMBER_JURNAL_LEPAS, id: l.id }));
    },
    isiForm: function (data) {
        isiPilihanAsetLepas(data);
        // Data Baru dibuka kosong (PRD 5.3a): tanggal dan alasan dipilih sendiri
        kolomTanggalLepas.value = data ? teksAman(data.tanggal) : "";
        aturBatasTanggal(kolomTanggalLepas);
        pilihAlasanLepas.value = data ? teksAman(data.alasan) : "";
        kolomNilaiLepas.value = data && data.nilaiJual ? teksAngkaIsian(data.nilaiJual) : "";
        isiPilihanKasBank(pilihKasLepas, { terpilih: data ? teksAman(data.kasId) : "" });
        isiPilihan(pilihAkunLepas, akunBolehDianggarkan().sort(urutKodeAkun), {
            kosong: "Cari/Pilih Akun Perkiraan...", terpilih: data ? teksAman(data.akunSelisihId) : "",
            teks: function (a) { return teksAman(a.kode) + " " + teksAman(a.nama); }
        });
        document.getElementById("lepas-catatan").value = data ? teksAman(data.catatan) : "";
        document.getElementById("lepas-simpan").hidden = !!data;   // data tersimpan hanya dilihat
        document.getElementById("lepas-pesan-galat").hidden = true;
        perbaruiRingkasanLepas(data);
    }
});

daftarkanAsalJurnal(SUMBER_JURNAL_LEPAS, { nama: "Lepas Aset", modul: modulLepasAset, tab: "lepas-aset" });

// Pilihan: aset yang belum dilepas; saat melihat data tersimpan, aset itu sendiri
function isiPilihanAsetLepas(data) {
    var daftar = bacaAsetTetap().filter(function (a) { return data ? a.id === data.asetId : !lepasDariAset(a.id); })
        .sort(function (x, y) { return teksAman(x.kode).localeCompare(teksAman(y.kode), "id", { numeric: true }); });
    isiPilihan(pilihAsetLepas, daftar, {
        kosong: "Pilih Aset...", kosongKalauTakAda: "Belum ada aset", terpilih: data ? teksAman(data.asetId) : "",
        teks: function (a) { return teksAman(a.kode) + " " + teksAman(a.nama); }
    });
}

function asetDipilihLepas() {
    return bacaAsetTetap().find(function (a) { return a.id === pilihAsetLepas.value; }) || null;
}

// Nilai pelepasan: nilai jual hanya kalau alasannya Dijual
function hitungLepas(aset) {
    var dijual = pilihAlasanLepas.value === "Dijual";
    var nilaiAset = aset ? Number(aset.nilai) || 0 : 0;
    var sudah = aset ? penyusutanSampai(aset) : 0;
    var nilaiJual = dijual ? angkaDariTeks(kolomNilaiLepas.value) : 0;
    return { nilaiAset: nilaiAset, sudah: sudah, nilaiBuku: nilaiAset - sudah, nilaiJual: nilaiJual, selisih: nilaiJual - (nilaiAset - sudah), dijual: dijual };
}

function perbaruiRingkasanLepas(data) {
    var h = data
        ? { nilaiAset: data.nilaiAset, nilaiBuku: data.nilaiBuku, selisih: data.selisih, dijual: data.alasan === "Dijual" }
        : hitungLepas(asetDipilihLepas());
    document.querySelectorAll("#isi-lepas-aset .lepas-jual").forEach(function (b) { b.hidden = !h.dijual; });
    document.getElementById("lepas-total-nilai").textContent = formatRupiah(h.nilaiAset || 0);
    document.getElementById("lepas-buku").textContent = formatRupiah(h.nilaiBuku || 0);
    document.getElementById("lepas-judul-selisih").textContent = h.selisih > 0 ? "Untung" : (h.selisih < 0 ? "Rugi" : "Untung/Rugi");
    document.getElementById("lepas-selisih").textContent = formatRupiah(Math.abs(h.selisih || 0));
    document.getElementById("lepas-info").textContent = data
        ? "Sudah dilepas. Klik tombol Hapus untuk membatalkan; jurnalnya ikut hilang dan aset kembali aktif."
        : "Simpan membuat jurnal otomatis: aset dan akumulasi penyusutannya dikeluarkan, selisih dengan Nilai Buku masuk Akun Untung/Rugi.";
}
function segarkanLepas() { if (!modulLepasAset.idDiubah) { perbaruiRingkasanLepas(null); } }
pilihAsetLepas.addEventListener("change", segarkanLepas);
pilihAlasanLepas.addEventListener("change", segarkanLepas);
kolomNilaiLepas.addEventListener("input", segarkanLepas);
pasangKolomRupiah(kolomNilaiLepas);   // titik ribuan langsung saat mengetik

function isiJurnalLepas(l) {
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var aset = bacaAsetTetap().find(function (a) { return a.id === l.asetId; });
    var k = kategoriAsetDari(aset.kategoriId);
    var keterangan = l.alasan + " " + l.namaAset;
    function baris(id, debit, kredit) {
        return { akunId: id, kode: perId[id].kode, nama: perId[id].nama, debit: debit, kredit: kredit, keterangan: keterangan };
    }
    var rincian = [];
    if (l.sudahDisusutkan > 0) { rincian.push(baris(k.akunAkumulasiId, l.sudahDisusutkan, 0)); }
    if (l.nilaiJual > 0) { rincian.push(baris(l.kasId, l.nilaiJual, 0)); }
    if (l.selisih < 0) { rincian.push(baris(l.akunSelisihId, -l.selisih, 0)); }
    rincian.push(baris(k.akunAsetId, 0, l.nilaiAset));
    if (l.selisih > 0) { rincian.push(baris(l.akunSelisihId, 0, l.selisih)); }
    return { nomor: l.nomor, tanggal: l.tanggal, keterangan: keterangan, rincian: rincian };
}

function tampilkanGalatLepas(pesan, kolomFokus) {
    var kotak = document.getElementById("lepas-pesan-galat");
    kotak.textContent = pesan;   // textContent: aman dari kode HTML
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

document.getElementById("form-lepas-aset").addEventListener("submit", function (e) {
    e.preventDefault();
    if (modulLepasAset.idDiubah) { return; }   // data tersimpan hanya dilihat
    document.getElementById("lepas-pesan-galat").hidden = true;
    var daftar = modulLepasAset.ambil();
    var aset = asetDipilihLepas();
    var tanggal = kolomTanggalLepas.value;
    if (!aset || lepasDariAset(aset.id)) { tampilkanGalatLepas("Aset wajib dipilih.", pilihAsetLepas); return; }
    var galatTanggal = galatTanggalTransaksi(tanggal, null, { catat: "pelepasan aset", ini: "Pelepasan ini" });
    if (galatTanggal) { tampilkanGalatLepas(galatTanggal.pesan, galatTanggal.diKolom ? kolomTanggalLepas : null); return; }
    if (tanggal < teksAman(aset.tanggalBeli)) { tampilkanGalatLepas("Tanggal tidak boleh sebelum Tanggal Beli.", kolomTanggalLepas); return; }
    // Penyusutan yang sudah diproses sesudah tanggal ini akan salah, jadi ditolak
    var terakhir = bacaPenyusutan().filter(function (p) { return rincianAman(p).some(function (r) { return r.asetId === aset.id; }); })
        .map(function (p) { return teksAman(p.bulan); }).sort().pop() || "";
    if (terakhir && tanggal.slice(0, 7) < terakhir) { tampilkanGalatLepas("Tanggal tidak boleh sebelum bulan penyusutan terakhir aset ini (" + terakhir + ").", kolomTanggalLepas); return; }
    if (ALASAN_LEPAS_ASET.indexOf(pilihAlasanLepas.value) === -1) { tampilkanGalatLepas("Alasan wajib dipilih.", pilihAlasanLepas); return; }   // PRD 5.3a

    var h = hitungLepas(aset);
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var k = kategoriAsetDari(aset.kategoriId);
    if (!k || !perId[teksAman(k.akunAsetId)] || (h.sudah > 0 && !perId[teksAman(k.akunAkumulasiId)])) { tampilkanGalatLepas("Akun di Kategori Aset belum lengkap. Isi Akun Akumulasi Penyusutan juga kalau aset ini sudah pernah disusutkan."); return; }
    if (h.dijual && !(h.nilaiJual > 0)) { tampilkanGalatLepas("Nilai Jual wajib diisi dan lebih dari 0.", kolomNilaiLepas); return; }
    if (h.dijual && !pilihKasLepas.value) { tampilkanGalatLepas("Kas/Bank wajib dipilih.", pilihKasLepas); return; }
    if (Math.abs(h.selisih) >= 0.005 && !pilihAkunLepas.value) { tampilkanGalatLepas("Akun Untung/Rugi wajib dipilih.", pilihAkunLepas); return; }

    var nomor = nomorLepasBerikut(daftar);
    var data = {
        id: buatId("la"), nomor: nomor, nama: nomor, tanggal: tanggal, asetId: aset.id, kodeAset: teksAman(aset.kode), namaAset: teksAman(aset.nama),
        alasan: pilihAlasanLepas.value, nilaiAset: h.nilaiAset, sudahDisusutkan: h.sudah, nilaiBuku: h.nilaiBuku, nilaiJual: h.nilaiJual, selisih: h.selisih,
        kasId: h.dijual ? pilihKasLepas.value : "", akunSelisihId: pilihAkunLepas.value, catatan: document.getElementById("lepas-catatan").value.trim(),
        dibuatOleh: penggunaAktif, dibuatPada: waktuSekarang()
    };
    daftar.push(data);
    simpanTransaksiDenganJurnal({
        modul: modulLepasAset, kunci: "daftarLepasAset", daftar: daftar, trx: data, sedangMengubah: false, salinanLama: null,
        sumberJurnal: SUMBER_JURNAL_LEPAS, isiJurnal: isiJurnalLepas,
        nomor: { pakai: function (info) { return info.nomor; } }, infoNomor: { nomor: nomor }, tanggal: tanggal
    });
});

saatTabDibuka["lepas-aset"] = function () {
    modulLepasAset.gambarTabel();
    if (!modulLepasAset.idDiubah) { modulLepasAset.bukaBaru(); }
};

function bukaLepasAsetBaru() { modulLepasAset.bukaDariMenu(); }
