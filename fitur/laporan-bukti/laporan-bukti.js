// ==================== Laporan Bukti Pengeluaran per Divisi dan Program (PRD 5.4, tugas J.22) ====================
// Tidak ada di Accurate; dirancang bersama pengguna (2026-11-09). Isinya:
//   - Pengeluaran dengan definisi yang SAMA dengan Rincian Pengeluaran (barisPengeluaranLaporan, fitur/laporan-rincian):
//     Pembayaran (termasuk gaji) dan Jurnal Umum. Donasi, Penerimaan, Transfer, Pemindahan Dana tidak masuk.
//   - Dikelompokkan Divisi, lalu Program ("Tanpa Program"), lalu transaksi urut tanggal. Transaksi yang barisnya berbeda
//     Divisi/Program tampil di setiap kelompoknya dengan nilai bagian kelompok itu, jadi Total tetap benar.
//   - Bukti = lampiran transaksi asal (umum/lampiran.js): foto tampil sebagai gambar kecil, berkas lain sebagai label jenis;
//     klik untuk melihat besar atau mengunduh. Tanpa lampiran: tanda merah "Belum ada bukti".
//   - Cetak biasa dan Unduh PDF memakai kertas laporan umum (pdf-laporan.js; foto kecil ikut tercetak).
//   - Tombol "Lampiran audit": PDF halaman ringkasan (dengan nomor halaman tiap bukti dan tanda tangan) lalu satu blok
//     per transaksi dengan bukti besar.

// Lampiran transaksi asal sebuah jurnal: Pembayaran menyimpan lampirannya sendiri; Jurnal Umum di jurnalnya.
// cariAsal = pembacaAsalJurnal() (fitur/jurnal/jurnal.js), dibuat sekali per laporan
function lampiranAsalJurnal(j, semuaIsi, cariAsal) {
    var asal = cariAsal(j);
    return asal ? muatLampiranData(asal.data, semuaIsi) : muatLampiranData(j, semuaIsi);
}

// Mengumpulkan data laporan: [{ divisi, program, transaksi: [t], jumlah }] urut Divisi lalu Program.
// t = { kunci, tanggal, nomor, jenis, keterangan, nilai (bagian kelompok ini), lampiran: [file], jurnal }
function kumpulkanBuktiPengeluaran(param) {
    var semuaIsi = bacaIsiLampiran();   // dibaca sekali untuk semua transaksi
    var cariAsal = pembacaAsalJurnal();
    var lampiranPer = Object.create(null);   // kunci transaksi -> lampiran (sama untuk semua kelompok)
    var kelompok = Object.create(null);
    telusuriJurnalLaporan({ perId: petaAkunLaporan(bacaDaftarAkun()), dari: param.dari, sampai: param.sampai,
                            divisi: param.divisi, program: param.program }, function (r, akun, j, tanggal) {
        if (!barisPengeluaranLaporan(r, akun, j)) { return; }
        var idDivisi = teksAman(r.divisiId), idProgram = teksAman(r.programId);
        var kunciKelompok = idDivisi + "|" + idProgram;
        var g = kelompok[kunciKelompok];
        if (!g) {
            g = kelompok[kunciKelompok] = {
                divisi: teksAman(namaDivisiDari(idDivisi)) || "Tanpa Divisi",
                program: teksAman(namaProgramDari(idProgram)) || "Tanpa Program",
                tanpaDivisi: !namaDivisiDari(idDivisi), tanpaProgram: !namaProgramDari(idProgram), per: Object.create(null), transaksi: [], jumlah: 0
            };
        }
        var kunci = j.sumber ? teksAman(j.sumber.jenis) + ":" + teksAman(j.sumber.id) : "jurnal:" + teksAman(j.id);
        var t = g.per[kunci];
        if (!t) {
            if (!lampiranPer[kunci]) { lampiranPer[kunci] = lampiranAsalJurnal(j, semuaIsi, cariAsal); }
            t = g.per[kunci] = { kunci: kunci, tanggal: tanggal, nomor: teksAman(j.nomor), jenis: asalJurnalOtomatis(j) || "Jurnal Umum",
                                 keterangan: teksAman(j.keterangan) || teksAman(r.keterangan), nilai: 0, lampiran: lampiranPer[kunci], jurnal: j };
            g.transaksi.push(t);
        }
        var nilai = -selisihKreditDebit(r);
        t.nilai += nilai;
        g.jumlah += nilai;
    });
    var hasil = Object.keys(kelompok).map(function (k) { return kelompok[k]; });
    hasil.forEach(function (g) { g.transaksi.sort(urutTanggalNomor); });
    // Divisi menurut nama ("Tanpa Divisi" paling bawah); di dalam Divisi, Program menurut nama dan "Tanpa Program" paling bawah
    hasil.sort(function (a, b) {
        return (a.tanpaDivisi - b.tanpaDivisi) || a.divisi.localeCompare(b.divisi, "id") || (a.tanpaProgram - b.tanpaProgram) || a.program.localeCompare(b.program, "id");
    });
    return hasil;
}

// "2 foto, 1 PDF" untuk tulisan di sel Bukti (ikut ke PDF, Excel, CSV); kosong = belum ada bukti
function ringkasanBukti(lampiran) {
    var hitung = {}, urutan = [];
    lampiran.forEach(function (f) {
        var jenis = dataUrlGambarAman(f.isi) ? "foto" : (akhiranBerkas(f.nama) || "berkas").toUpperCase();
        if (!hitung[jenis]) { hitung[jenis] = 0; urutan.push(jenis); }
        hitung[jenis]++;
    });
    return urutan.map(function (j) { return hitung[j] + " " + j; }).join(", ");
}

// ----- Tampilan di layar -----
function selBuktiLaporan(t) {
    var td = document.createElement("td");
    td.className = "lap-bukti-sel";
    if (!t.lampiran.length) {
        var belum = document.createElement("span");
        belum.className = "lap-bukti-belum";
        belum.textContent = "Belum ada bukti";
        td.appendChild(belum);
        return td;
    }
    var deret = document.createElement("span");
    deret.className = "lap-bukti-deret";
    t.lampiran.forEach(function (f, i) {
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "lap-bukti-butir";
        tombol.setAttribute("aria-label", "Lihat bukti " + f.nama);   // nama file hanya lewat atribut/textContent
        tombol.title = f.nama;
        if (dataUrlGambarAman(f.isi)) {
            var img = document.createElement("img");
            img.src = f.isi;
            img.alt = "";
            img.dataset.pdfGambar = "";   // ikut tercetak kecil di PDF (pdf-laporan.js)
            tombol.appendChild(img);
        } else {
            // Label jenis lewat CSS (attr), bukan teks, supaya tulisan sel tetap "1 PDF" di PDF dan Excel
            tombol.classList.add("lap-bukti-berkas");
            tombol.dataset.jenis = (akhiranBerkas(f.nama) || "file").toUpperCase().slice(0, 4);
        }
        tombol.addEventListener("click", function (k) { k.stopPropagation(); bukaBuktiLaporan(t, i); });
        tombol.addEventListener("keydown", function (k) { if (k.key === "Enter") { k.stopPropagation(); } });
        deret.appendChild(tombol);
    });
    td.appendChild(deret);
    var ringkas = document.createElement("small");
    ringkas.className = "lap-bukti-ringkas";
    ringkas.textContent = ringkasanBukti(t.lampiran);
    td.appendChild(ringkas);
    return td;
}

function barisJumlahBukti(badan, teks, nilai, jenis) {
    var tr = badan.insertRow();
    tr.className = "lap-b-" + jenis;
    var judul = tr.insertCell();
    judul.colSpan = 4;
    judul.textContent = teks;
    var angka = tr.insertCell();
    angka.className = "lap-n";
    angka.textContent = angkaLaporan(nilai);
    angka.dataset.angka = nilai;
    tr.insertCell();
}

function gambarBuktiPengeluaran(param) {
    var kelompok = kumpulkanBuktiPengeluaran(param);
    if (!kelompok.length) { return { isi: pesanKosongLaporan("Belum ada pengeluaran pada periode dan filter ini.") }; }
    var tabel = document.createElement("table");
    tabel.className = "lap-tabel lap-rincian lap-berkelompok lap-bukti";
    var kepala = tabel.createTHead().insertRow();
    [["Tanggal", "lap-rapat"], ["No Bukti", "lap-rapat"], ["Jenis", ""], ["Keterangan", ""], ["Nilai", "lap-n"], ["Bukti", ""]].forEach(function (k) {
        var th = document.createElement("th");
        th.scope = "col";
        th.textContent = k[0];
        th.className = k[1];
        kepala.appendChild(th);
    });
    var badan = tabel.createTBody();
    var total = 0, tanpaBukti = Object.create(null);
    kelompok.forEach(function (g, n) {
        // Judul Divisi hanya sekali untuk Program-Program di bawahnya
        if (n === 0 || kelompok[n - 1].divisi !== g.divisi) {
            var trD = badan.insertRow();
            trD.className = "lap-b-bagian";
            var selD = trD.insertCell();
            selD.colSpan = 6;
            selD.textContent = "Divisi: " + g.divisi;
        }
        var trP = badan.insertRow();
        trP.className = "lap-b-judul lap-bukti-program";
        var selP = trP.insertCell();
        selP.colSpan = 6;
        selP.textContent = "Program: " + g.program;
        g.transaksi.forEach(function (t) {
            var tr = badan.insertRow();
            [formatTanggal(t.tanggal), t.nomor, t.jenis, t.keterangan].forEach(function (teks, i) {
                var td = tr.insertCell();
                td.textContent = teks;
                if (i < 2) { td.className = "lap-rapat"; }
            });
            var nilai = tr.insertCell();
            nilai.className = "lap-n";
            nilai.textContent = angkaLaporan(t.nilai);
            nilai.dataset.angka = t.nilai;
            tr.appendChild(selBuktiLaporan(t));
            if (!t.lampiran.length) { tr.classList.add("lap-bukti-kurang"); tanpaBukti[t.kunci] = true; }
            pasangKlikBarisLaporan(tr, function () { bukaAsalJurnal(t.jurnal); });
        });
        barisJumlahBukti(badan, "Jumlah " + g.program, g.jumlah, "jumlah");
        total += g.jumlah;
        if (n === kelompok.length - 1 || kelompok[n + 1].divisi !== g.divisi) {
            var jumlahDivisi = kelompok.filter(function (x) { return x.divisi === g.divisi; }).reduce(function (s, x) { return s + x.jumlah; }, 0);
            barisJumlahBukti(badan, "Jumlah Divisi " + g.divisi, jumlahDivisi, "jumlah");
        }
    });
    barisJumlahBukti(badan, "TOTAL", total, "akhir");
    aturLebarTabel(tabel, [84, 92, 96, 230, 100, 170]);   // fitur/laporan/pohon.js
    var kurang = Object.keys(tanpaBukti).length;
    return { isi: tabel, catatan: kurang ? [kurang + " transaksi belum ada bukti (bertanda merah)."] : [] };
}

// ----- Popup Lihat Bukti -----
var dialogBuktiLaporan = document.getElementById("dialog-bukti-laporan");
var buktiDilihat = null;   // { t, nomor }

function gambarPopupBukti() {
    var t = buktiDilihat.t, f = t.lampiran[buktiDilihat.nomor];
    document.getElementById("judul-bukti-laporan").textContent = f.nama;   // textContent: aman dari kode HTML
    document.getElementById("bukti-laporan-transaksi").textContent =
        t.nomor + " · " + formatTanggal(t.tanggal) + " · " + t.jenis + " · " + formatRupiah(t.nilai) + (t.keterangan ? " · " + t.keterangan : "");
    var tampil = document.getElementById("bukti-laporan-tampil");
    tampil.textContent = "";
    if (dataUrlGambarAman(f.isi)) {
        var img = document.createElement("img");
        img.src = f.isi;
        img.alt = "Bukti " + f.nama;
        tampil.appendChild(img);
    } else {
        var info = document.createElement("p");
        info.className = "petunjuk";
        info.textContent = dataUrlLampiranAman(f.isi)
            ? "Berkas " + (akhiranBerkas(f.nama) || "ini").toUpperCase() + " (" + teksUkuranBerkas(f.ukuran) + ") tidak bisa ditampilkan di sini. Klik Unduh untuk membukanya."
            : "Isi berkas ini tidak ditemukan di penyimpanan (mungkin rusak atau terhapus).";
        tampil.appendChild(info);
    }
    document.getElementById("bukti-laporan-unduh").disabled = !dataUrlLampiranAman(f.isi);
    var lain = document.getElementById("bukti-laporan-lain");
    lain.textContent = "";
    lain.hidden = t.lampiran.length < 2;
    t.lampiran.forEach(function (x, i) {
        var li = document.createElement("li");
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "tombol tombol-garis" + (i === buktiDilihat.nomor ? " aktif" : "");
        tombol.textContent = x.nama;
        tombol.setAttribute("aria-current", i === buktiDilihat.nomor ? "true" : "false");
        tombol.addEventListener("click", function () { buktiDilihat.nomor = i; gambarPopupBukti(); });
        li.appendChild(tombol);
        lain.appendChild(li);
    });
}

function bukaBuktiLaporan(t, nomor) {
    buktiDilihat = { t: t, nomor: nomor };
    gambarPopupBukti();
    dialogBuktiLaporan.showModal();
}
function tutupBuktiLaporan() { dialogBuktiLaporan.close(); }
document.getElementById("tutup-bukti-laporan").addEventListener("click", tutupBuktiLaporan);
document.getElementById("bukti-laporan-selesai").addEventListener("click", tutupBuktiLaporan);
dialogBuktiLaporan.addEventListener("click", function (k) { if (k.target === dialogBuktiLaporan) { tutupBuktiLaporan(); } });
document.getElementById("bukti-laporan-unduh").addEventListener("click", function () {
    var f = buktiDilihat.t.lampiran[buktiDilihat.nomor];
    if (dataUrlLampiranAman(f.isi)) { unduhLampiran(f.nama, f.isi); }   // umum/lampiran.js
});
document.getElementById("bukti-laporan-buka").addEventListener("click", function () {
    var jurnal = buktiDilihat.t.jurnal;
    tutupBuktiLaporan();
    if (!bukaAsalJurnal(jurnal)) { tampilkanNotifikasi("Transaksinya sudah tidak ada.", "peringatan"); }
});

// ----- PDF Lampiran audit -----
// Kertas A4 tegak. Halaman ringkasan lebih dulu, tetapi ditulis TERAKHIR: nomor halaman tiap blok baru diketahui sesudah
// blok-blok bukti disusun. Jumlah halaman ringkasan dihitung lebih dulu (ukur tanpa menggambar).
var KERTAS_AUDIT = { lebar: 210, tinggi: 297, kiri: 15, kanan: 15, atas: 14, bawah: 16 };

// Data unik per transaksi (satu blok per transaksi) dan baris ringkasan per kelompok
function dataAuditBukti(kelompok) {
    var blok = [], perKunci = Object.create(null), baris = [], total = 0;
    kelompok.forEach(function (g) {
        g.transaksi.forEach(function (t) {
            var b = perKunci[t.kunci];
            if (!b) { b = perKunci[t.kunci] = { t: t, bagian: [], nilai: 0, nomor: blok.length + 1, halaman: 0 }; blok.push(b); }
            b.bagian.push(g.divisi + " / " + g.program + ": " + formatRupiah(t.nilai));
            b.nilai += t.nilai;
            baris.push({ kelompok: g.divisi + " / " + g.program, blok: b, nilai: t.nilai });
            total += t.nilai;
        });
    });
    return { blok: blok, baris: baris, total: total };
}

// Menyusun PDF dari data dan foto yang sudah diubah ke JPEG (foto[kunci + "|" + idFile])
function susunPdfAuditBukti(data, foto, kepala) {
    var k = KERTAS_AUDIT, lebar = k.lebar - k.kiri - k.kanan, batas = k.tinggi - k.bawah;
    var pdf = buatPdf();
    var abu = "#4b5563", biru = "#0b2a5b", merah = "#b91c1c";

    function garisAtas() {   // pita warna aplikasi di atas tiap halaman, sama dengan PDF laporan lain
        pdf.kotak(0, 0, k.lebar, 1.2, { latar: biru });
        pdf.kotak(0, 0, 26, 1.2, { latar: "#f5a623" });
    }

    // ---- Ringkasan: menggambar (pdf ada) atau hanya mengukur jumlah halaman (gambar = false) ----
    var KOLOM = [{ judul: "No", w: 9 }, { judul: "Divisi / Program", w: 58 }, { judul: "No Bukti", w: 28 }, { judul: "Tanggal", w: 22 },
                 { judul: "Nilai", w: 30, kanan: true }, { judul: "Bukti", w: 14, kanan: true }, { judul: "Hal.", w: 19, kanan: true }];
    var TINGGI_BARIS = 6;
    function ringkasan(gambar) {
        var halaman = 0, y = k.atas;
        function tulis(teks, x, yy, gaya) { if (gambar) { pdf.teks(teks, x, yy, gaya); } }
        function kotak(x, yy, w, h, gaya) { if (gambar) { pdf.kotak(x, yy, w, h, gaya); } }
        function pindahHalaman() { halaman++; if (gambar) { pdf.pilihHalaman(halaman); } y = k.atas; judulKolom(); }
        function judulKolom() {
            kotak(k.kiri, y, lebar, TINGGI_BARIS, { latar: "#e8edf4" });
            var x = k.kiri;
            KOLOM.forEach(function (c) {
                tulis(c.judul, c.kanan ? xRataPdf(c.judul, x, c.w - 1, { rata: "kanan" }, 8) : x + 1, garisDasarPdf(y, 8, TINGGI_BARIS / tinggiBarisPdf(8, 1)), { ukuran: 8, tebal: true, warna: biru });
                x += c.w;
            });
            y += TINGGI_BARIS;
        }
        // Kepala halaman pertama
        kepala.forEach(function (g) {
            var t = teksSebarisPdf(g.teks, lebar, g.ukuran, g.tebal);
            tulis(t, xRataPdf(t, k.kiri, lebar, { rata: "tengah", tebal: g.tebal }, g.ukuran), garisDasarPdf(y, g.ukuran), g);
            y += tinggiBarisPdf(g.ukuran);
        });
        y += 3;
        judulKolom();
        data.baris.forEach(function (b, i) {
            if (y + TINGGI_BARIS > batas) { pindahHalaman(); }
            var nilaiSel = [String(i + 1), b.kelompok, b.blok.t.nomor, formatTanggal(b.blok.t.tanggal), formatAngka(b.nilai),
                            String(b.blok.t.lampiran.length), b.blok.halaman ? String(b.blok.halaman) : "-"];
            var x = k.kiri, yDasar = garisDasarPdf(y, 8, TINGGI_BARIS / tinggiBarisPdf(8, 1));
            nilaiSel.forEach(function (teks, n) {
                var c = KOLOM[n], isi = teksSebarisPdf(teks, c.w - 2, 8, false);
                var warna = (n === 5 && !b.blok.t.lampiran.length) ? merah : "#111111";
                tulis(isi, c.kanan ? xRataPdf(isi, x, c.w - 1, { rata: "kanan" }, 8) : x + 1, yDasar, { ukuran: 8, warna: warna, tebal: n === 5 && !b.blok.t.lampiran.length });
                x += c.w;
            });
            kotak(k.kiri, y + TINGGI_BARIS - 0.15, lebar, 0.15, { latar: "#e4e9f1" });
            y += TINGGI_BARIS;
        });
        // TOTAL, jumlah tanpa bukti, dan tanda tangan (tetap satu kesatuan di halaman yang sama)
        var tinggiAkhir = TINGGI_BARIS + 8 + 42;
        if (y + tinggiAkhir > batas) { pindahHalaman(); }
        kotak(k.kiri, y, lebar, 0.4, { latar: "#111111" });
        var xNilai = k.kiri + KOLOM.slice(0, 4).reduce(function (s, c) { return s + c.w; }, 0);
        var yTotal = garisDasarPdf(y, 9, TINGGI_BARIS / tinggiBarisPdf(9, 1));
        tulis("TOTAL", k.kiri + 1, yTotal, { ukuran: 9, tebal: true });
        var teksTotal = formatAngka(data.total);
        tulis(teksTotal, xRataPdf(teksTotal, xNilai, KOLOM[4].w - 1, { rata: "kanan", tebal: true }, 9), yTotal, { ukuran: 9, tebal: true });
        y += TINGGI_BARIS + 2;
        var kurang = data.blok.filter(function (b) { return !b.t.lampiran.length; }).length;
        var teksKurang = data.blok.length + " transaksi; " + (kurang ? kurang + " transaksi belum ada bukti." : "semua transaksi sudah ada bukti.");
        tulis(teksKurang, k.kiri, garisDasarPdf(y, 8.5), { ukuran: 8.5, warna: kurang ? merah : abu, tebal: kurang > 0 });
        y += 12;
        // Tanda tangan: dua kolom
        [["Disiapkan oleh,", k.kiri], ["Diperiksa oleh,", k.kiri + lebar / 2 + 10]].forEach(function (p) {
            tulis(p[0], p[1], garisDasarPdf(y, 9), { ukuran: 9 });
            kotak(p[1], y + 24, lebar / 2 - 20, 0.25, { latar: "#111111" });
            tulis("Nama dan tanggal", p[1], garisDasarPdf(y + 25, 7.5), { ukuran: 7.5, warna: abu });
        });
        return halaman + 1;
    }

    // ---- Blok bukti per transaksi ----
    var halamanSekarang = -1, y = 0;
    function halamanBaru() { pdf.halamanBaru(k.lebar, k.tinggi); halamanSekarang++; garisAtas(); y = k.atas; }

    // Isi bukti satu transaksi menjadi "baris": foto (satu selebar blok, atau dua berdampingan), nama berkas lain, atau kosong
    function barisBukti(b) {
        var fotoT = [], berkas = [];
        b.t.lampiran.forEach(function (f) {
            var j = foto[b.t.kunci + "|" + f.id];
            if (j) { fotoT.push({ f: f, j: j }); } else { berkas.push(f); }
        });
        var hasil = [];
        if (fotoT.length === 1) {
            var g = fotoT[0].j, w = lebar - 4, h = Math.min(w * g.tinggi / g.lebar, 150);
            hasil.push({ jenis: "foto", isi: [{ g: g, w: h * g.lebar / g.tinggi, h: h, nama: fotoT[0].f.nama }], tinggi: h + 6 });
        } else {
            for (var i = 0; i < fotoT.length; i += 2) {
                var pasangan = fotoT.slice(i, i + 2), wKolom = (lebar - 4 - 4) / 2;
                var isi = pasangan.map(function (p) {
                    var hh = Math.min(wKolom * p.j.tinggi / p.j.lebar, 110);
                    return { g: p.j, w: hh * p.j.lebar / p.j.tinggi, h: hh, nama: p.f.nama };
                });
                hasil.push({ jenis: "foto", isi: isi, tinggi: Math.max.apply(null, isi.map(function (x) { return x.h; })) + 6 });
            }
        }
        berkas.forEach(function (f) { hasil.push({ jenis: "berkas", f: f, tinggi: 6 }); });
        if (!b.t.lampiran.length) { hasil.push({ jenis: "kosong", tinggi: 14 }); }
        return hasil;
    }

    function kepalaBlok(b) {
        var t = b.t;
        var bagian = b.bagian.join("; ");
        var lipatBagian = lipatTeksPdf(bagian, lebar - 4, 7.5, false);
        var lipatKet = t.keterangan ? lipatTeksPdf(t.keterangan, lebar - 4, 8, false) : [];
        return { tinggi: 8 + lipatKet.length * tinggiBarisPdf(8) + lipatBagian.length * tinggiBarisPdf(7.5) + 2, ket: lipatKet, bagian: lipatBagian };
    }

    function gambarKepalaBlok(b, kb) {
        var t = b.t;
        pdf.kotak(k.kiri, y, lebar, 7, { latar: "#e8edf4" });
        var judul = b.nomor + ". " + t.nomor + "  ·  " + formatTanggal(t.tanggal) + "  ·  " + t.jenis;
        pdf.teks(teksSebarisPdf(judul, lebar - 45, 9.5, true), k.kiri + 2, garisDasarPdf(y, 9.5, 7 / tinggiBarisPdf(9.5, 1)), { ukuran: 9.5, tebal: true, warna: biru });
        var nilai = formatRupiah(b.nilai);
        pdf.teks(nilai, xRataPdf(nilai, k.kiri, lebar - 2, { rata: "kanan", tebal: true }, 9.5), garisDasarPdf(y, 9.5, 7 / tinggiBarisPdf(9.5, 1)), { ukuran: 9.5, tebal: true });
        y += 8;
        kb.ket.forEach(function (s) { pdf.teks(s, k.kiri + 2, garisDasarPdf(y, 8), { ukuran: 8 }); y += tinggiBarisPdf(8); });
        kb.bagian.forEach(function (s) { pdf.teks(s, k.kiri + 2, garisDasarPdf(y, 7.5), { ukuran: 7.5, warna: abu }); y += tinggiBarisPdf(7.5); });
        y += 2;
    }

    function gambarBarisBukti(r) {
        if (r.jenis === "foto") {
            var x = k.kiri + 2;
            r.isi.forEach(function (p, i) {
                var xKolom = r.isi.length === 1 ? k.kiri + (lebar - p.w) / 2 : x + i * ((lebar - 8) / 2 + 4) + ((lebar - 8) / 2 - p.w) / 2;
                pdf.kotak(xKolom - 0.3, y - 0.3, p.w + 0.6, p.h + 0.6, { garis: "#cbd5e1", tebal: 0.2 });
                pdf.gambar(p.g.data, p.g.lebar, p.g.tinggi, xKolom, y, p.w, p.h);
                var nama = teksSebarisPdf(p.nama, Math.max(20, p.w), 7, false);
                pdf.teks(nama, xKolom, garisDasarPdf(y + p.h + 0.5, 7), { ukuran: 7, warna: abu });
            });
        } else if (r.jenis === "berkas") {
            var label = "[" + ((akhiranBerkas(r.f.nama) || "berkas").toUpperCase()) + "] ";
            pdf.teks(teksSebarisPdf(label + r.f.nama + "  -  buka atau unduh dari aplikasi", lebar - 4, 8.5, false), k.kiri + 2, garisDasarPdf(y, 8.5), { ukuran: 8.5 });
        } else {
            pdf.kotak(k.kiri + 2, y, lebar - 4, 11, { latar: "#fef2f2", garis: merah, tebal: 0.4 });
            var teks = "Belum ada bukti";
            pdf.teks(teks, xRataPdf(teks, k.kiri + 2, lebar - 4, { rata: "tengah", tebal: true }, 10), garisDasarPdf(y, 10, 11 / tinggiBarisPdf(10, 1)), { ukuran: 10, tebal: true, warna: merah });
        }
        y += r.tinggi;
    }

    // Halaman ringkasan dikosongkan dulu (jumlahnya diukur), lalu blok mulai di halaman sesudahnya
    var jumlahRingkasan = ringkasan(false);
    for (var i = 0; i < jumlahRingkasan; i++) { halamanBaru(); }
    halamanBaru();
    data.blok.forEach(function (b) {
        var kb = kepalaBlok(b), isi = barisBukti(b);
        var tinggiBlok = kb.tinggi + isi.reduce(function (s, r) { return s + r.tinggi; }, 0) + 4;
        // Blok tidak terpotong antarhalaman; blok yang lebih tinggi dari satu halaman baru boleh dipotong di antara baris fotonya
        if (y + tinggiBlok > batas && y > k.atas) { halamanBaru(); }
        b.halaman = halamanSekarang + 1;
        gambarKepalaBlok(b, kb);
        isi.forEach(function (r) {
            if (y + r.tinggi > batas && y > k.atas) { halamanBaru(); }
            gambarBarisBukti(r);
        });
        y += 4;
    });
    // Sekarang nomor halaman blok sudah diketahui: tulis ringkasan di halaman-halaman pertama
    pdf.pilihHalaman(0);
    ringkasan(true);

    // Kaki semua halaman
    var jumlah = pdf.jumlahHalaman(), gaya = { ukuran: 7.5, warna: abu }, yKaki = k.tinggi - k.bawah + 7;
    for (var h = 0; h < jumlah; h++) {
        pdf.pilihHalaman(h);
        pdf.teks(kepala.kaki, k.kiri, yKaki, gaya);
        var nomor = "Halaman " + (h + 1) + " dari " + jumlah;
        pdf.teks(nomor, xRataPdf(nomor, k.kiri, lebar, { rata: "kanan" }, 7.5), yKaki, gaya);
    }
    return pdf;
}

// Mengubah semua foto bukti ke JPEG satu per satu (memuat gambar perlu menunggu), lalu selesai(foto)
function muatFotoAuditBukti(blok, selesai) {
    var antre = [], foto = Object.create(null);
    blok.forEach(function (b) {
        b.t.lampiran.forEach(function (f) { if (dataUrlGambarAman(f.isi)) { antre.push({ kunci: b.t.kunci + "|" + f.id, isi: f.isi }); } });
    });
    (function lanjut(n) {
        if (n >= antre.length) { selesai(foto); return; }
        muatGambarPdf(antre[n].isi, 1400, 0.85, function (hasil) {
            if (hasil) { foto[antre[n].kunci] = hasil; }   // foto rusak dilewati: tercetak sebagai nama berkas
            lanjut(n + 1);
        });
    })(0);
}

function cetakAuditBukti(param) {
    var kelompok = kumpulkanBuktiPengeluaran(param);
    if (!kelompok.length) { tampilkanNotifikasi("Belum ada pengeluaran pada periode dan filter ini.", "peringatan"); return; }
    var data = dataAuditBukti(kelompok);
    function teks(id) { return document.getElementById(id).textContent; }
    var kepala = [
        { teks: teks("lap-k-yayasan").toUpperCase(), ukuran: 10.5, tebal: true, warna: "#111111" },
        { teks: "Lampiran Audit - Bukti Pengeluaran per Divisi dan Program", ukuran: 13, tebal: true, warna: "#0b2a5b" },
        { teks: teks("lap-k-periode"), ukuran: 9.5, warna: "#111111" }
    ];
    if (teks("lap-k-filter")) { kepala.push({ teks: teks("lap-k-filter"), ukuran: 8, warna: "#4b5563" }); }
    kepala.kaki = "Dicetak " + teksWaktuDicetak();
    tampilkanNotifikasi("Menyiapkan Lampiran audit...");
    muatFotoAuditBukti(data.blok, function (foto) {
        var pdf = null;
        try { pdf = susunPdfAuditBukti(data, foto, kepala); } catch (galat) { pdf = null; }
        if (!pdf) { tampilkanNotifikasi("Lampiran audit belum bisa dibuat.", "peringatan"); return; }
        var judul = "Lampiran Audit Bukti Pengeluaran";
        tampilkanHalamanCetak(pdf, judul, namaBerkasPdf(namaBerkasLaporan(judul)));   // umum/halaman-pdf.js
    });
}
