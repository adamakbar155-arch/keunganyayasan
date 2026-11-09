// ==================== Komponen bersama: transaksi Kas/Bank (Pembayaran, Penerimaan) ====================
// Pembayaran dan Penerimaan berbentuk kembar (PRD 6.3): Kas/Bank, tanggal, No Bukti, rincian akun lewat popup, Info lainnya,
// simpan/ubah/hapus dengan jurnal otomatis. Logikanya ditulis SEKALI di sini; tiap fitur hanya memanggil buatTransaksiKas
// dengan pengaturannya (fitur/pembayaran/pembayaran.js, fitur/penerimaan/penerimaan.js). Perbaikan cukup di satu tempat.
// HTML-nya dibuat oleh umum/tampilan-transaksi-kas.js (id elemen di bawah mengikuti cetakan itu).
// Dimuat sesudah umum/komponen-transaksi.js. Fungsi dari fitur/jurnal (daftarJurnalDenganOtomatis, jurnalMilik,
// gambarButirAkun, isianAwalDariBarisTerakhir, usulkanDivisiDariProgram) baru dipakai saat buatTransaksiKas dipanggil,
// jadi pemanggilnya harus dimuat sesudah fitur/jurnal/jurnal.js.
//
// Satu transaksi tersimpan: { id, nomor, nama(=nomor), aturanId, tanggal, kasId, kas ("kode - nama"), noCek,
//   <kunciPihak> (penerima/pemberi), catatan, rincian[baris], jumlahBaris, total, ringkasanRincian,
//   lampiranInfo, jumlahLampiran, ringkasanLampiran (umum/lampiran.js), dibuatOleh, dibuatPada, diubahPada }
// Satu baris: { id, akunId, kode, nama, nilai, divisiId, programId, terikat, catatan, ...isian tambahan fitur (misalnya gajiId) }
//   terikat = bagian Dana di Info lainnya (PRD 4.1): true = Terikat, false = Tidak Terikat; wajib dipilih saat Simpan.
//   Hanya ada kalau popupnya punya bagian Dana (Pembayaran: pasangTampilanTransaksiKas dengan centangTerikat: true);
//   Penerimaan tidak punya, jadi selalu false.
//
// k (pengaturan):
//   id, idPopup   : awalan id elemen (sama dengan pasangTampilanTransaksiKas), misalnya "bayar" dan "rbayar"
//   judul         : "Pembayaran"
//   kunci         : kunci penyimpanan, misalnya "daftarPembayaran" (otomatis ikut Cadangan Data)
//   arah          : "keluar" (Debit rincian, Kredit Kas/Bank) atau "masuk" (Debit Kas/Bank, Kredit rincian)  (PRD 4.2)
//   kunciPihak    : "penerima" / "pemberi";  labelPihak: "Penerima" / "Pemberi";  kataPihak: "kepada" / "dari"
//   tipeNomor     : tipe aturan penomoran, misalnya "pembayaran"
//   sumberJurnal  : sumber.jenis jurnal otomatis, misalnya "pembayaran" (didaftarkan otomatis lewat daftarkanAsalJurnal).
//                   Dipakai juga sebagai kunci Preferensi, Lampiran (wajib lampiran atau tidak).
//   awalanId      : awalan id data baru, misalnya "by"
//   periksaRincian(baris, idDiubah) : (boleh tidak ada) pemeriksaan tambahan sebelum simpan -> pesan, atau ""
//   isiInfoBaris(baris)             : (boleh tidak ada) mengisi isian tambahan di popup saat baris dibuka
// Hasil: { modul, baris(), aturBaris(daftarBaris), gambarRincian(), bukaBaru() }
function buatTransaksiKas(k) {
    var el = function (id) { return document.getElementById(id); };
    var p = k.idPopup;
    var baris = [];   // salinan kerja baris transaksi yang sedang dibuka
    var kolomTanggal = el(k.id + "-tanggal");
    var pilihKas = el(k.id + "-kas");
    var badanRincian = el(k.id + "-rincian");
    var kolomPihak = el(k.id + "-" + k.kunciPihak);
    // Lampiran file (PRD 5.4): alat bersama umum/lampiran.js, sama seperti Jurnal Umum
    var tombolLampiran = el(k.id + "-tombol-lampiran");
    var lampiran = buatLampiranTransaksi({ jenis: k.sumberJurnal, namaFitur: k.judul, tombol: tombolLampiran, lencana: el(k.id + "-lencana-lampiran") });

    // ----- Daftar (seperti Accurate: Nomor, Tanggal, Kas/Bank, No Cek, Keterangan, Nilai; filter Tanggal dan Kas/Bank) -----
    var labelData = { nomor: "No Bukti", tanggal: "Tanggal", kas: "Kas/Bank", noCek: "No Cek", total: "Nilai (Rp)", ringkasanRincian: "Rincian", catatan: "Catatan",
                      jumlahLampiran: "Jumlah Lampiran", ringkasanLampiran: "Lampiran" };
    labelData[k.kunciPihak] = k.labelPihak;
    var modul = buatModulDaftar({
        id: k.id,
        judul: k.judul,
        kunci: k.kunci,
        labelData: labelData,
        formatData: { tanggal: function (t) { return formatTanggal(t); }, total: function (n) { return formatRupiah(n); } },
        urutAwal: { kolom: "tanggal", arah: -1 },
        kolom: [
            { kunci: "nomor", judul: "Nomor #" },
            { kunci: "tanggal", judul: "Tanggal", tampil: function (b) { return formatTanggal(b.tanggal); }, urut: function (b) { return b.tanggal || ""; } },
            { kunci: "kas", judul: "Kas/Bank" },
            { kunci: "noCek", judul: "No Cek #" },
            { kunci: "keterangan", judul: "Keterangan", tampil: keteranganTransaksi },
            { kunci: "total", judul: "Nilai", rata: "kanan", tampil: function (b) { return formatAngka(b.total || 0); }, urut: function (b) { return String(b.total || 0).padStart(18, "0"); } }
        ],
        filter: [
            // Nilai "2026-10" supaya urut menurut waktu; tampil "Okt 2026". Terbaru di atas.
            { judul: "Tanggal", ambil: function (b) { return teksAman(b.tanggal).slice(0, 7); }, tampil: teksBulanTahun, turun: true },
            { judul: "Kas/Bank", ambil: function (b) { return teksAman(b.kas); } }
        ],
        pesanKosong: "Belum ada " + k.judul.toLowerCase() + ". Klik tombol + untuk membuat.",
        // Transaksi yang sudah direkonsiliasi (PRD 6.3) atau bertanggal terkunci (PRD 5.3) tidak boleh dihapus
        alasanTolakHapus: function (b) {
            var rekonsiliasi = galatTransaksiSudahRekonsiliasi(k.sumberJurnal, b.id, k.judul);
            if (rekonsiliasi) { return rekonsiliasi; }
            return tanggalTerkunci(b.tanggal)
                ? k.judul + ' "' + b.nomor + '" bertanggal ' + formatTanggal(b.tanggal) + ' yang sudah terkunci (Preferensi, Pembatasan), jadi tidak bisa dihapus.'
                : "";
        },
        // Menghapus transaksi ikut menghapus jurnal otomatisnya (PRD 3.1 butir 3) dan isi file lampirannya
        saatDihapus: function (b) {
            modulJurnal.simpan(daftarJurnalTanpaOtomatis({ jenis: k.sumberJurnal, id: b.id }));
            hapusIsiLampiran(b.id);
        },
        isiForm: function (data) {
            kolomTanggal.value = data ? teksAman(data.tanggal) : "";   // Data Baru dibuka kosong (PRD 5.3a)
            aturBatasTanggal(kolomTanggal);
            // Data Baru: nomor otomatis. Data tersimpan: nomornya tampil di kolom nomor dan boleh diubah.
            nomor.mulai(data ? data.nomor : "");
            isiPilihanKas(data ? data.kasId : "");
            el(k.id + "-no-cek").value = data ? teksAman(data.noCek) : "";
            kolomPihak.value = data ? teksAman(data[k.kunciPihak]) : "";
            el(k.id + "-catatan").value = data ? teksAman(data.catatan) : "";
            // Baris tersimpan selalu sudah jelas sifat dananya: yang tidak dicentang Terikat (termasuk data lama) = Tidak Terikat
            baris = rincianAman(data).map(function (b) { return Object.assign({}, b, { terikat: b.terikat === true }); });
            cariAkun.tutup();
            el(k.id + "-cari-akun").value = "";
            gambarRincian();
            lampiran.muat(data);   // Data Baru: kosong; data tersimpan: lampirannya
            el(k.id + "-pesan-galat").hidden = true;
            pilihTab("rincian");
        },
        // Baris rincian dan lampiran ikut diingat per tab (PRD 6.10)
        keadaanTambahan: {
            ambil: function () { return { baris: baris.map(function (b) { return Object.assign({}, b); }), lampiran: lampiran.kerja() }; },
            pakai: function (simpanan) {
                baris = simpanan.baris.map(function (b) { return Object.assign({}, b); });
                gambarRincian();
                lampiran.atur(simpanan.lampiran);
            }
        }
    });

    // Keterangan di daftar: catatan, atau "Pembayaran kepada ..." / "Penerimaan dari ..." dari baris pertama isian pihak
    function keteranganTransaksi(b) {
        if (b.catatan) { return b.catatan; }
        var pihak = teksAman(b[k.kunciPihak]).split("\n")[0].trim();
        return k.judul + (pihak ? " " + k.kataPihak + " " + pihak : "");
    }

    // Jurnal otomatis transaksi ini bisa ditelusuri balik (pesan "ubah lewat halaman ...", Histori Bank)
    daftarkanAsalJurnal(k.sumberJurnal, { nama: k.judul, modul: modul, tab: k.id });

    // Tab samping: Rincian dan Info lainnya
    var pilihTab = buatPengalihTab(document.querySelectorAll("#isi-" + k.id + " [data-" + k.id + "-tab]"), k.id + "Tab",
        { rincian: k.id + "-panel-rincian", info: k.id + "-panel-info" });

    // Kas/Bank = akun Kas & Bank tingkat 3 (alat bersama isiPilihanKasBank, umum/komponen-transaksi.js; PRD 5.1)
    function isiPilihanKas(idTerpilih) {
        isiPilihanKasBank(pilihKas, {
            terpilih: idTerpilih,
            nonaktifKalauKosong: true,
            petunjuk: el("petunjuk-" + k.id + "-kas")
        });
    }

    // No Bukti: otomatis dari aturan penomoran bertipe transaksi ini (Pengaturan, Penomoran), atau diketik sendiri
    var nomor = buatNomorOtomatis({
        saklar: el(k.id + "-nomor-otomatis"),
        pilihan: el(k.id + "-aturan-nomor"),
        kolom: el(k.id + "-nomor"),
        contoh: el(k.id + "-contoh-nomor"),
        tanggal: kolomTanggal,
        tipe: k.tipeNomor,
        namaTipe: k.judul
    });

    // No Bukti mengikuti Kas/Bank yang dipilih (PRD 6.3); tetap bisa diganti atau diketik sendiri
    pilihKas.addEventListener("change", function () { nomor.ikutKas(pilihKas.value); });

    // ----- Tabel rincian dan total -----
    function gambarRincian() {
        badanRincian.textContent = "";
        var total = 0;
        if (baris.length === 0) { badanRincian.appendChild(barisKosongTabel(4)); }
        baris.forEach(function (b) {
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
            sel(b.kode, "jurnal-sel-teks jurnal-sel-kode");
            sel(b.nama, "jurnal-sel-teks");
            sel(formatAngka(b.nilai), "jurnal-sel-angka");
            tr.appendChild(tombolHapusBaris("Hapus baris " + b.kode + " " + b.nama, function () {
                baris = baris.filter(function (x) { return x.id !== b.id; });
                gambarRincian();
            }));
            tr.addEventListener("click", function () { bukaRincian(null, b); });
            tr.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target === tr) { e.preventDefault(); bukaRincian(null, b); } });
            badanRincian.appendChild(tr);
        });
        // Seperti Accurate: "1 Rincian Pembayaran", "2 Rincian Pembayaran", ...
        el(k.id + "-jumlah").textContent = baris.length ? baris.length + " " : "";
        el(k.id + "-total").textContent = formatRupiah(total);
    }

    // ----- Cari akun -----
    // Yang boleh dipilih hanya akun yang tidak punya sub akun. Kas/Bank dan Tanggal wajib diisi dulu sebelum daftar akun
    // bisa dibuka (pengaman urutan isian, alat bersama buatSyaratIsian di umum/komponen-transaksi.js).
    var syaratAkun = buatSyaratIsian([
        { nama: "Kas/Bank", kata: "Pilih", kolom: pilihKas },
        { nama: "Tanggal", kolom: kolomTanggal }
    ], "memilih akun perkiraan");
    var cariAkun = buatKolomCari({
        kolom: el(k.id + "-cari-akun"),
        daftar: el(k.id + "-daftar-akun"),
        ambilData: akunUntukJurnal,
        cocok: function (a, kata) { return kata === "" || (teksAman(a.nama) + " " + teksAman(a.kode)).toLowerCase().indexOf(kata) !== -1; },
        urut: urutKodeAkun,
        gambarButir: gambarButirAkun,
        teksKosong: function (adaData) { return adaData ? "Tidak ada akun yang cocok." : "Belum ada akun yang bisa dipilih. Buat di Buku Besar, Akun Perkiraan."; },
        saatPilih: function (akun) { bukaRincian(akun, null); },
        bolehBuka: syaratAkun.bolehBuka
    });

    // ----- Popup rincian -----
    var dialog = el("dialog-rincian-" + k.id);
    var kolomNilai = el(p + "-nilai");
    var galatNilai = el("galat-" + p + "-nilai");
    var pilihDivisi = el(p + "-divisi");
    var pilihProgram = el(p + "-program");
    // Bagian Dana (PRD 4.1): dua centang Terikat / Tidak Terikat. null kalau popup ini tidak memakainya (Penerimaan).
    var dana = el(p + "-terikat") ? pasangPilihanDana(el(p + "-terikat"), el(p + "-tidak-terikat")) : null;
    var dibuka = null;   // { akun, baris } yang sedang diisi

    var pilihTabPopup = buatPengalihTab(dialog.querySelectorAll("[data-" + p + "-tab]"), p + "Tab",
        { rincian: p + "-panel-rincian", info: p + "-panel-info" });

    // akun = akun baru dipilih (baris baru); b = baris yang sudah ada (diubah)
    function bukaRincian(akun, b) {
        dibuka = { akun: akun, baris: b };
        el(p + "-kode").textContent = teksAman(b ? b.kode : akun.kode);
        el(p + "-nama").value = teksAman(b ? b.nama : akun.nama);
        kolomNilai.value = b ? teksAngkaIsian(b.nilai) : "";
        // Baris baru mengikuti Divisi/Program/pilihan Dana baris terakhir (seperti Jurnal Umum); tetap bisa diubah
        var awal = b ? { divisiId: b.divisiId, programId: b.programId, terikat: b.terikat } : isianAwalDariBarisTerakhir(baris);
        isiPilihan(pilihDivisi, bacaDivisi(), { kosong: "Pilih Divisi...", terpilih: awal.divisiId });   // wajib (PRD 5.1)
        isiPilihan(pilihProgram, daftarProgramPilihan(awal.programId), { kosong: "(Tanpa Program)", terpilih: awal.programId });
        if (dana) { dana.atur(awal.terikat); }
        el(p + "-catatan").value = b ? teksAman(b.catatan) : "";
        if (k.isiInfoBaris) { k.isiInfoBaris(b); }   // isian tambahan fitur (misalnya kolom Pencatatan Gaji)
        el("hapus-rincian-" + k.id).hidden = !b;
        galatNilai.hidden = true;
        pilihTabPopup("rincian");
        dialog.showModal();
        kolomNilai.focus();
    }

    // Program dipilih dan Divisi masih kosong: Divisi diusulkan dari Program (tetap bisa diubah)
    pilihProgram.addEventListener("change", function () { usulkanDivisiDariProgram(pilihProgram, pilihDivisi); });
    kolomNilai.addEventListener("input", function () { galatNilai.hidden = true; });
    pasangKolomRupiah(kolomNilai);   // titik ribuan langsung saat mengetik
    kolomNilai.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); simpanRincian(); } });

    // Menutup popup dengan cara apa pun. Penanda dipasang SEBELUM menutup: fokus yang kembali ke kolom cari akun
    // tepat sesudah popup tertutup tidak membuka daftar.
    function tutupRincian() {
        dibuka = null;
        cariAkun.abaikanFokusSebentar();
        dialog.close();
    }

    // Lanjut: periksa nilai, lalu tambah baris baru atau perbarui baris yang dibuka
    function simpanRincian() {
        if (!dibuka) { return; }
        var nilai = angkaDariTeks(kolomNilai.value);
        if (nilai <= 0) {
            pilihTabPopup("rincian");
            galatNilai.textContent = "Nilai wajib diisi dan lebih dari 0.";
            galatNilai.hidden = false;
            kolomNilai.focus();
            return;
        }
        // Divisi (dan Dana untuk Pembayaran) diperiksa sedini mungkin, saat Lanjut (PRD 5.1); popup tetap terbuka
        // Penerimaan tidak punya bagian Dana: barisnya selalu Tidak Terikat (false)
        var terikat = dana ? dana.ambil() : false;
        var kurang = pesanIsianBarisBelumLengkap({
            akunId: dibuka.baris ? dibuka.baris.akunId : dibuka.akun.id, divisiId: pilihDivisi.value, terikat: terikat
        }, !!dana);
        if (kurang) {
            pilihTabPopup("info");
            tampilkanNotifikasi(kurang, "peringatan");
            return;
        }
        var data = {
            nilai: nilai,
            divisiId: pilihDivisi.value,
            programId: pilihProgram.value,
            terikat: terikat,   // sudah diperiksa di atas
            catatan: el(p + "-catatan").value.trim()
        };
        var baru = !dibuka.baris;
        if (baru) {
            var akun = dibuka.akun;
            baris.push(Object.assign({ id: buatId("rb"), akunId: akun.id, kode: akun.kode, nama: akun.nama }, data));
        } else {
            Object.assign(dibuka.baris, data);
        }
        tutupRincian();
        gambarRincian();
        if (baru) { cariAkun.fokusUlang(); }   // siap memilih akun berikutnya
    }
    el("lanjut-rincian-" + k.id).addEventListener("click", simpanRincian);
    el("tutup-rincian-" + k.id).addEventListener("click", tutupRincian);
    // Hapus (di popup): buang baris yang sedang dibuka
    el("hapus-rincian-" + k.id).addEventListener("click", function () {
        if (!dibuka || !dibuka.baris) { return; }
        var id = dibuka.baris.id;
        baris = baris.filter(function (x) { return x.id !== id; });
        tutupRincian();
        gambarRincian();
    });
    // Esc: peristiwa "cancel" datang SEBELUM popup tertutup
    dialog.addEventListener("cancel", function () { dibuka = null; cariAkun.abaikanFokusSebentar(); });

    // ----- Menyimpan (PRD 3.1, 4.2, 5.2, 5.3) -----
    function sembunyikanGalat() { el(k.id + "-pesan-galat").hidden = true; }
    function tampilkanGalat(pesan, kolomFokus) {
        var kotak = el(k.id + "-pesan-galat");
        kotak.textContent = pesan;
        kotak.hidden = false;
        if (kolomFokus) { kolomFokus.focus(); }
    }

    // Ringkasan rincian untuk Log Aktivitas: "510101 Beban Gaji 4.950.000; 610101 Beban Admin 5.000"
    function ringkasanRincian(rincian) {
        return rincian.map(function (b) { return b.kode + " " + b.nama + " " + formatAngka(b.nilai); }).join("; ");
    }

    // Isi jurnal otomatis (PRD 4.2). Keluar: Debit akun tiap baris, Kredit Kas/Bank. Masuk: kebalikannya.
    // Divisi/Program/centang Terikat ikut ke baris akun; sisi Kas/Bank tanpa Program dan tidak terikat (PRD 4.1).
    function isiJurnal(trx, kas) {
        var keluar = (k.arah === "keluar");
        var rincian = trx.rincian.map(function (b) {
            return { akunId: b.akunId, kode: b.kode, nama: b.nama, debit: keluar ? b.nilai : 0, kredit: keluar ? 0 : b.nilai,
                     divisiId: b.divisiId, programId: b.programId, terikat: b.terikat === true, keterangan: b.catatan || trx.catatan };
        });
        var sisiKas = { akunId: kas.id, kode: kas.kode, nama: kas.nama, debit: keluar ? 0 : trx.total, kredit: keluar ? trx.total : 0,
                        keterangan: k.judul + " " + trx.nomor };
        if (keluar) { rincian.push(sisiKas); } else { rincian.unshift(sisiKas); }   // baris Debit selalu di atas
        return { nomor: trx.nomor, tanggal: trx.tanggal, rincian: rincian, keterangan: keteranganTransaksi(trx) };
    }

    el("form-" + k.id).addEventListener("submit", function (e) {
        e.preventDefault();
        sembunyikanGalat();
        var daftar = modul.ambil();
        var sedangMengubah = (modul.idDiubah !== null);
        var lama = sedangMengubah ? daftar.find(function (b) { return b.id === modul.idDiubah; }) : null;
        var tanggal = kolomTanggal.value;

        // Pemeriksaan satu per satu; berhenti di kesalahan pertama.
        // Transaksi yang sudah direkonsiliasi tidak bisa diubah sebelum tandanya dibatalkan (PRD 6.3)
        var rekonsiliasi = lama ? galatTransaksiSudahRekonsiliasi(k.sumberJurnal, lama.id, k.judul) : "";
        if (rekonsiliasi) { tampilkanGalat(rekonsiliasi); return; }
        var galatTanggal = galatTanggalTransaksi(tanggal, lama, { catat: k.judul.toLowerCase(), ini: k.judul + " ini" });
        if (galatTanggal) { tampilkanGalat(galatTanggal.pesan, galatTanggal.diKolom ? kolomTanggal : null); return; }
        var kas = akunKasBankPilihan().find(function (a) { return a.id === pilihKas.value; });
        if (!kas) { tampilkanGalat("Kas/Bank wajib dipilih.", pilihKas); return; }
        if (baris.length === 0) {
            pilihTab("rincian");
            tampilkanGalat("Rincian " + k.judul + " masih kosong. Pilih akun lewat kolom cari.", el(k.id + "-cari-akun")); return;
        }
        var semuaAkun = bacaDaftarAkun();
        var hilang = baris.find(function (b) { return !semuaAkun.some(function (a) { return a.id === b.akunId; }); });
        if (hilang) { pilihTab("rincian"); tampilkanGalat("Akun " + hilang.kode + " " + hilang.nama + " sudah tidak ada. Hapus baris itu dulu."); return; }
        var galatTambahan = k.periksaRincian ? k.periksaRincian(baris, modul.idDiubah) : "";
        if (galatTambahan) { pilihTab("rincian"); tampilkanGalat(galatTambahan); return; }
        // Pengaman (PRD 4.1, 5.1): setiap baris selain Kas & Bank wajib punya Divisi, dan (Pembayaran, yang punya bagian
        // Dana) wajib dipilih Terikat atau Tidak Terikat. Peringatannya notifikasi di pojok kanan atas.
        var belumLengkap = pesanBarisBelumLengkap(baris, !!dana);
        if (belumLengkap) { pilihTab("rincian"); tampilkanNotifikasi(belumLengkap, "peringatan"); return; }
        // Preferensi, Lampiran: bila transaksi ini wajib berlampiran, minimal satu file harus ada
        if (lampiran.wajibKosong()) { tampilkanGalat(lampiran.pesanWajib, tombolLampiran); return; }

        // No Bukti: otomatis atau diketik; unik di antara transaksi ini dan di buku jurnal (jurnalnya memakai nomor yang sama)
        var infoNomor = nomor.ambil(tanggal);
        if (infoNomor.galat) { tampilkanGalat(infoNomor.galat, infoNomor.kolomFokus); return; }
        var noBukti = infoNomor.nomor;
        if (nomorTransaksiTerpakai(noBukti, daftar, modul.idDiubah, k.sumberJurnal)) {
            tampilkanGalat('No Bukti "' + noBukti + '" sudah dipakai (di ' + k.judul + ' atau Jurnal Umum).' + (infoNomor.otomatis ? " Matikan Otomatis dan ketik nomor lain." : ""), nomor.kolomNomorKembar());
            return;
        }

        var total = baris.reduce(function (n, b) { return n + (Number(b.nilai) || 0); }, 0);
        var data = {
            nomor: noBukti, nama: noBukti, aturanId: infoNomor.aturanId,
            tanggal: tanggal, kasId: kas.id, kas: kas.kode + " - " + kas.nama,
            noCek: el(k.id + "-no-cek").value.trim(),
            catatan: el(k.id + "-catatan").value.trim(),
            rincian: baris.map(function (b) { return Object.assign({}, b); }),
            jumlahBaris: baris.length, total: total,
            ringkasanRincian: ringkasanRincian(baris)
        };
        data[k.kunciPihak] = kolomPihak.value.trim();
        Object.assign(data, lampiran.infoData());   // hanya keterangan file; isinya disimpan terpisah (umum/lampiran.js)
        var salinanLama = lama ? Object.assign({}, lama) : null;
        var trx;
        if (sedangMengubah) {
            data.diubahPada = waktuSekarang();
            Object.assign(lama, data);
            trx = lama;
        } else {
            data.id = buatId(k.awalanId);
            data.dibuatOleh = penggunaAktif;
            data.dibuatPada = waktuSekarang();
            daftar.push(data);
            trx = data;
        }

        // Simpan transaksi bersama jurnal dan isi lampirannya (alat bersama, umum/komponen-transaksi.js)
        simpanTransaksiDenganJurnal({
            modul: modul, kunci: k.kunci, daftar: daftar, trx: trx, sedangMengubah: sedangMengubah, salinanLama: salinanLama,
            sumberJurnal: k.sumberJurnal, isiJurnal: function (t) { return isiJurnal(t, kas); },
            nomor: nomor, infoNomor: infoNomor, tanggal: tanggal,
            lampiran: lampiran, galatLampiran: function (pesan) { tampilkanGalat(pesan, tombolLampiran); }
        });
    });

    // Akun, divisi, program, dan aturan nomor bisa berubah di halaman lain: muat ulang tiap tab dibuka
    saatTabDibuka[k.id] = function () {
        modul.gambarTabel();
        nomor.segarkan();
        isiPilihanKas(pilihKas.value);
        gambarRincian();
        lampiran.perbaruiLencana();
    };

    return {
        modul: modul,
        baris: function () { return baris; },
        // Mengganti baris kerja (misalnya Pembayaran gaji dari Proses > Gaji) lalu menggambar ulang tabel
        aturBaris: function (daftarBaris) { baris = daftarBaris; gambarRincian(); },
        gambarRincian: gambarRincian,
        bukaBaru: function () { modul.bukaDariMenu(); }
    };
}
