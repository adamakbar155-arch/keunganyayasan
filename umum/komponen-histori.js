// ==================== Komponen bersama: halaman Histori (Histori Bank, Histori Akun) ====================
// Cara kerja halaman riwayat satu akun dengan saldo berjalan (PRD 6.3 Histori Bank, 6.4 Histori Akun; dari foto Accurate).
// Hanya MEMBACA buku jurnal: perhitungannya memakai historiAkun (fitur/jurnal/jurnal.js).
// - Baris pertama Saldo Awal, lalu transaksi, lalu Total (mutasi bersih).
// - Klik baris membuka transaksi asalnya (bukaAsalJurnal).
// - Kolom # (kalau dinyalakan): ceklis untuk transaksi yang sudah direkonsiliasi; klik ceklis membatalkan tandanya
//   (tandaRekonsiliasiUntuk dan batalkanTandaRekonsiliasi di fitur/jurnal/jurnal.js, sama dengan Rekonsiliasi Bank).
// - Ekspor CSV memakai alat bersama unduhCsv (umum/komponen-daftar.js).
// HTML-nya dibuat pasangTampilanHistori (umum/tampilan-histori.js) dengan id yang sama.
//
// Pemakaian (dari file fitur, sesudah tampilannya dipasang):
//   var halaman = buatHalamanHistori({ id: "histori-bank", judul: "Histori Bank", noCek: true, ceklis: true, namaBerkas: "histori-bank.csv" });
//   halaman.gambar()  -> menggambar ulang tabel
// Fungsi di dalam buatHalamanHistori tidak masuk ruang nama bersama, jadi Histori Bank dan Histori Akun tidak bertabrakan.

// Tanggal sehari sebelum (untuk "Saldo per ..."), dari "2026-10-01" menjadi "2026-09-30"
function tanggalSehariSebelum(iso) {
    var t = new Date(iso + "T00:00:00");
    t.setDate(t.getDate() - 1);
    var dua = function (n) { return String(n).padStart(2, "0"); };
    return t.getFullYear() + "-" + dua(t.getMonth() + 1) + "-" + dua(t.getDate());
}

// Mutasi bersih: jumlah Dr dikurangi jumlah Cr. Hasil { nilai (selalu positif), dk: "Dr" bertambah / "Cr" berkurang }.
// Dipakai tabel dan ekspor CSV, supaya Saldo Awal + Total = saldo akhir di keduanya.
function totalMutasiHistori(baris) {
    var bersih = baris.reduce(function (n, b) { return n + (b.dk === "Dr" ? b.mutasi : -b.mutasi); }, 0);
    return { nilai: Math.abs(bersih), dk: bersih < 0 ? "Cr" : "Dr" };
}

// Jumlah Debit dan jumlah Kredit rentang itu (baris Total di tampilan Debit/Kredit). Hasil { debit, kredit }.
function totalDebitKreditHistori(baris) {
    return baris.reduce(function (n, b) {
        if (b.dk === "Dr") { n.debit += b.mutasi; } else { n.kredit += b.mutasi; }
        return n;
    }, { debit: 0, kredit: 0 });
}

function buatHalamanHistori(k) {
    var el = function (akhiran) { return document.getElementById(k.id + "-" + akhiran); };
    var pilihKas = el("kas"), kolomDari = el("dari"), kolomSampai = el("sampai"), badan = el("badan");
    var petunjuk = document.getElementById("petunjuk-" + k.id);
    var tombolGanti = el("ganti-tampilan");
    var hasilTerakhir = null;   // hasil terakhir yang digambar (dipakai ekspor CSV)

    // ----- Tampilan Mutasi + Tipe, atau Debit + Kredit (tombol ⇄, PRD 6.3 tambahan) -----
    // Pilihan terakhir diingat browser per halaman. Hanya kenyamanan: kalau penyimpanan diblokir, kembali ke Mutasi.
    var KUNCI_TAMPILAN = "tampilanHistori-" + k.id;
    var tampilanDk = false;
    try { tampilanDk = localStorage.getItem(KUNCI_TAMPILAN) === "debit-kredit"; } catch (galat) { /* pakai bawaan: Mutasi */ }

    // Judul dua kolom yang berganti, dan keterangan tombol ⇄
    function aturJudulKolom() {
        var judul = document.querySelectorAll("#isi-" + k.id + " th[data-kolom-nilai]");
        judul[0].textContent = tampilanDk ? "Debit" : "Mutasi";
        judul[1].textContent = tampilanDk ? "Kredit" : "Tipe";
        judul[1].classList.toggle("sel-kanan", tampilanDk);   // Kredit berisi angka, jadi rata kanan
        var keterangan = tampilanDk ? "Tampilkan kolom Mutasi dan Tipe" : "Tampilkan kolom Debit dan Kredit";
        tombolGanti.setAttribute("aria-pressed", String(tampilanDk));
        tombolGanti.setAttribute("aria-label", keterangan);
        tombolGanti.title = keterangan;
    }

    // Dua sel nilai untuk satu baris transaksi: [Mutasi, Tipe] atau [Debit, Kredit] (yang kosong ditulis 0)
    function selNilai(b) {
        if (tampilanDk) {
            return [[formatAngka(b.dk === "Dr" ? b.mutasi : 0), "sel-kanan"], [formatAngka(b.dk === "Cr" ? b.mutasi : 0), "sel-kanan"]];
        }
        return [[formatAngka(b.mutasi), "sel-kanan" + (b.dk === "Cr" ? " angka-negatif" : "")], [b.dk, ""]];   // uang keluar merah
    }

    // Satu baris tabel. sel = [teks, kelas]; klik = fungsi saat baris diklik (atau null);
    // ceklis = tombol ceklis rekonsiliasi untuk kolom # (atau null = kolom # kosong)
    function baris(sel, klik, ceklis) {
        var tr = document.createElement("tr");
        sel.forEach(function (s) {
            var td = document.createElement("td");
            td.textContent = s[0];   // textContent: aman dari kode HTML
            if (s[1]) { td.className = s[1]; }
            tr.appendChild(td);
        });
        if (k.ceklis) {
            var kolomCek = document.createElement("td");
            kolomCek.className = "histori-kol-cek";
            if (ceklis) { kolomCek.appendChild(ceklis); }
            tr.appendChild(kolomCek);
        }
        if (klik) {
            tr.className = "baris-data";
            tr.tabIndex = 0;
            tr.title = "Klik untuk membuka transaksi asalnya";
            tr.addEventListener("click", klik);
            tr.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); klik(); } });
        }
        badan.appendChild(tr);
        return tr;   // dikembalikan supaya baris khusus (Total) bisa diberi kelas sendiri
    }

    // Sel-sel satu baris, dengan kolom No Cek hanya kalau dinyalakan
    function sel(tanggal, nomor, noCek, tipe, keterangan, mutasi, dk, saldo) {
        var isi = [tanggal, nomor];
        if (k.noCek) { isi.push(noCek); }
        return isi.concat([tipe, keterangan, mutasi, dk, saldo]);
    }

    // Tombol ceklis hijau untuk baris yang sudah direkonsiliasi (PRD 6.3, dari foto Accurate).
    // Klik: konfirmasi, lalu tandanya dibatalkan lewat alat bersama batalkanTandaRekonsiliasi (fitur/jurnal/jurnal.js).
    function tombolCeklis(tanda, nomor) {
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "histori-ceklis";
        tombol.setAttribute("aria-label", "Sudah direkonsiliasi. Klik untuk membatalkan");
        tombol.title = "Sudah direkonsiliasi oleh " + teksAman(tanda.ditandaiOleh) + " pada " + teksAman(tanda.ditandaiPada).replace("T", " ") + ". Klik untuk membatalkan.";
        tombol.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';   // ikon tetap, bukan isian pengguna
        tombol.addEventListener("click", function (e) {
            e.stopPropagation();   // jangan ikut membuka transaksi asal (klik baris)
            tanyaKonfirmasi({
                judul: "Konfirmasi",
                pesan: "Data sudah dicocokkan dengan Rekening Koran. Apakah data ini tidak cocok dengan rekening koran?",
                nama: nomor,
                labelYa: "Ya"
            }, function () {
                if (batalkanTandaRekonsiliasi(tanda.id, nomor)) { gambar(); }
            });
        });
        // Enter/spasi di tombol juga jangan ikut membuka transaksi asal
        tombol.addEventListener("keydown", function (e) { e.stopPropagation(); });
        return tombol;
    }

    function tampilkanPetunjuk(teks) {
        petunjuk.textContent = teks;
        petunjuk.hidden = !teks;
    }

    // Menggambar ulang tabel dari pilihan akun dan rentang tanggal
    function gambar() {
        badan.textContent = "";
        hasilTerakhir = null;
        var idKas = pilihKas.value, dari = kolomDari.value, sampai = kolomSampai.value;
        if (!idKas) { tampilkanPetunjuk("Pilih Kas/Bank untuk melihat historinya."); return; }
        if (!dari || !sampai) { tampilkanPetunjuk("Isi tanggal dari dan sampai."); return; }
        if (dari > sampai) { tampilkanPetunjuk("Tanggal dari tidak boleh sesudah tanggal sampai."); return; }
        tampilkanPetunjuk("");

        var hasil = historiAkun(idKas, dari, sampai);
        hasilTerakhir = hasil;
        // Baris pertama: Saldo Awal "Saldo per [sehari sebelum tanggal dari]". Seperti Accurate, angkanya juga tampil
        // di kolom Mutasi; di tampilan Debit/Kredit kedua kolom itu kosong.
        var nilaiAwal = tampilanDk ? [["", "sel-kanan"], ["", "sel-kanan"]] : [[formatAngka(hasil.saldoAwal), "sel-kanan"], ["", ""]];
        baris(sel(["", ""], ["", ""], ["", ""], ["Saldo Awal", ""], ["Saldo per " + formatTanggal(tanggalSehariSebelum(dari)), ""],
                  nilaiAwal[0], nilaiAwal[1], [formatAngka(hasil.saldoAwal), "sel-kanan"]), null, null);
        var tanda = k.ceklis ? bacaTandaRekonsiliasi() : [];
        hasil.baris.forEach(function (b) {
            var t = k.ceklis ? tandaRekonsiliasiUntuk(tanda, b.jurnal.id, idKas) : null;
            var nilai = selNilai(b);
            baris(sel(
                [formatTanggal(b.tanggal), ""], [b.nomor, ""], [b.noCek, ""], [b.tipe, ""], [b.keterangan, ""],
                nilai[0], nilai[1], [formatAngka(b.saldo), "sel-kanan"]
            ), function () {
                if (!bukaAsalJurnal(b.jurnal)) { tampilkanNotifikasi("Transaksi asal baris ini sudah tidak ada.", "peringatan"); }
            }, t ? tombolCeklis(t, b.nomor) : null);
        });
        if (hasil.baris.length === 0) {
            tampilkanPetunjuk("Tidak ada transaksi pada rentang tanggal ini.");
            return;
        }
        // Baris terakhir: Total (PRD 6.3, dari foto Accurate). Tampilan Mutasi: mutasi bersih, Cr (berkurang) merah.
        // Tampilan Debit/Kredit: jumlah Debit dan jumlah Kredit.
        var nilaiTotal;
        if (tampilanDk) {
            var jumlah = totalDebitKreditHistori(hasil.baris);
            nilaiTotal = [[formatAngka(jumlah.debit), "sel-kanan"], [formatAngka(jumlah.kredit), "sel-kanan"]];
        } else {
            var total = totalMutasiHistori(hasil.baris);
            nilaiTotal = [[formatAngka(total.nilai), "sel-kanan" + (total.dk === "Cr" ? " angka-negatif" : "")], [total.dk, ""]];
        }
        baris(sel(["", ""], ["", ""], ["", ""], ["Total", ""], ["Total", ""],
                  nilaiTotal[0], nilaiTotal[1], ["", "sel-kanan"]), null, null).classList.add("histori-total");
    }

    // Tombol ⇄: ganti tampilan, ingat pilihannya, gambar ulang
    tombolGanti.addEventListener("click", function () {
        tampilanDk = !tampilanDk;
        try { localStorage.setItem(KUNCI_TAMPILAN, tampilanDk ? "debit-kredit" : "mutasi"); } catch (galat) { /* tidak diingat, tidak apa-apa */ }
        aturJudulKolom();
        gambar();
    });
    aturJudulKolom();

    [pilihKas, kolomDari, kolomSampai].forEach(function (isian) { isian.addEventListener("change", gambar); });
    el("segarkan").addEventListener("click", gambar);

    // Ekspor CSV: kolom sama dengan tabel dan tampilan yang sedang dipilih (alat bersama unduhCsv, aman dari CSV injection)
    el("ekspor").addEventListener("click", function () {
        if (!hasilTerakhir) { tampilkanNotifikasi("Pilih Kas/Bank dan tanggal dulu.", "peringatan"); return; }
        var hasil = hasilTerakhir;
        var saldoPer = "Saldo per " + formatTanggal(tanggalSehariSebelum(kolomDari.value));
        var isi = [tampilanDk
            ? sel("Tanggal", "No. Sumber", "No Cek", "Tipe Transaksi", "Keterangan", "Debit", "Kredit", "Saldo")
            : sel("Tanggal", "No. Sumber", "No Cek", "Tipe Transaksi", "Keterangan", "Mutasi", "Tipe", "Saldo")];
        isi.push(sel("", "", "", "Saldo Awal", saldoPer, tampilanDk ? "" : hasil.saldoAwal, "", hasil.saldoAwal));
        hasil.baris.forEach(function (b) {
            isi.push(tampilanDk
                ? sel(formatTanggal(b.tanggal), b.nomor, b.noCek, b.tipe, b.keterangan, b.dk === "Dr" ? b.mutasi : 0, b.dk === "Cr" ? b.mutasi : 0, b.saldo)
                : sel(formatTanggal(b.tanggal), b.nomor, b.noCek, b.tipe, b.keterangan, b.mutasi, b.dk, b.saldo));
        });
        // Baris Total sama dengan di tabel (hanya kalau ada transaksi)
        if (hasil.baris.length > 0) {
            if (tampilanDk) {
                var jumlah = totalDebitKreditHistori(hasil.baris);
                isi.push(sel("", "", "", "Total", "Total", jumlah.debit, jumlah.kredit, ""));
            } else {
                var total = totalMutasiHistori(hasil.baris);
                isi.push(sel("", "", "", "Total", "Total", total.nilai, total.dk, ""));
            }
        }
        if (unduhCsv(k.namaBerkas, isi)) { tampilkanNotifikasi(k.judul + " telah diunduh"); }
    });

    // Setiap tab dibuka: muat ulang pilihan Kas/Bank (akun Kas & Bank tingkat 3, alat bersama isiPilihanKasBank;
    // PRD 5.1); tanggal bawaan awal bulan ini s/d hari ini; gambar ulang
    saatTabDibuka[k.id] = function () {
        isiPilihanKasBank(pilihKas, { kosongKalauTakAda: "Belum ada akun Kas/Bank tingkat 3", terpilih: pilihKas.value });
        if (!kolomDari.value) { kolomDari.value = tanggalHariIni().slice(0, 8) + "01"; }
        if (!kolomSampai.value) { kolomSampai.value = tanggalHariIni(); }
        gambar();
    };

    return { gambar: gambar };
}
