// ==================== Laporan: daftar transaksi di balik satu baris ====================
// PRD 7 (permintaan pengguna 2026-11-06). Klik baris laporan ringkasan membuka jendela berisi transaksi pembentuk angka itu,
// menurut periode dan filter laporan. Klik satu transaksi membuka formulir asalnya (bukaAsalJurnal, fitur/jurnal/jurnal.js).
// Pemakaian dari tabel: baris diberi saring = function (r, akun, j) -> true kalau baris jurnal itu termasuk.
// rentangRincianLaporan diisi kertas.js sebelum laporan digambar. HTML: fitur/laporan/tampilan.js.

var rentangRincianLaporan = null;   // { dari, sampai, divisi, program } laporan yang sedang tampil
var dialogRincianBaris = document.getElementById("dialog-rincian-baris");

function bukaTransaksiAsalLaporan(j) {
    dialogRincianBaris.close();
    if (!bukaAsalJurnal(j)) { tampilkanNotifikasi("Transaksi asalnya sudah tidak ada.", "peringatan"); }
}

function bukaRincianBaris(judul, saring) {
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var rentang = rentangRincianLaporan;
    var data = [], totalDebit = 0, totalKredit = 0;
    telusuriJurnalLaporan({ perId: perId, dari: rentang.dari, sampai: rentang.sampai, divisi: rentang.divisi, program: rentang.program }, function (r, akun, j, tanggal) {
        if (!saring(r, akun, j)) { return; }
        var debit = Number(r.debit) || 0, kredit = Number(r.kredit) || 0;
        totalDebit += debit;
        totalKredit += kredit;
        data.push({
            tanggal: tanggal, nomor: teksAman(j.nomor), saatKlik: function () { bukaTransaksiAsalLaporan(j); },
            sel: [formatTanggal(tanggal), teksAman(j.nomor), asalJurnalOtomatis(j) || "Jurnal Umum", namaAkunLaporan(akun),
                  teksAman(r.keterangan) || teksAman(j.keterangan), debit, kredit]
        });
    });
    document.getElementById("judul-rincian-baris").textContent = judul;   // textContent: nama akun adalah isian pengguna
    var isi = document.getElementById("rincian-baris-isi");
    isi.textContent = "";
    if (!data.length) {
        isi.appendChild(pesanKosongLaporan("Tidak ada transaksi pada periode dan filter ini. Angka ini berasal dari saldo awal akun."));
    } else {
        data.sort(urutTanggalNomor);
        data.push({ jenis: "akhir", sel: ["Total", "", "", "", "", totalDebit, totalKredit] });
        isi.appendChild(buatTabelRincian({
            tanpaKolomData: true,
            kolom: [{ judul: "Tanggal", lebar: 86, rapat: true }, { judul: "No Bukti", lebar: 88, rapat: true }, { judul: "Sumber", lebar: 110 }, { judul: "Akun", lebar: 150 },
                    { judul: "Keterangan", lebar: 200 }, { judul: "Debit", lebar: 100, angka: true }, { judul: "Kredit", lebar: 100, angka: true }],
            baris: data
        }));
    }
    dialogRincianBaris.showModal();
}

document.getElementById("tutup-rincian-baris").addEventListener("click", function () { dialogRincianBaris.close(); });
dialogRincianBaris.addEventListener("click", function (k) {
    if (k.target === dialogRincianBaris) { dialogRincianBaris.close(); }
});
