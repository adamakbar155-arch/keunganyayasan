// ==================== Komponen formulir transaksi ====================
// Bagian yang sama persis di formulir transaksi (Jurnal Umum, Pencatatan Gaji, Pembayaran), ditulis sekali di sini:
//   angkaDariTeks, teksAngkaIsian      -> membaca dan menulis angka Rupiah di kolom isian
//   tulisDenganSorot                    -> teks hasil pencarian dengan bagian yang cocok disorot
//   akunUntukJurnal, daftarProgramPilihan -> akun dan program yang boleh dipilih di transaksi
//   buatPengalihTab                     -> tab samping (Rincian / Info) dan tab di popup
//   barisKosongTabel, tombolHapusBaris, IKON_GESER -> isi tabel rincian
//   buatKolomCari                       -> kolom "Cari/Pilih..." dengan daftar hasil melayang
//   buatNomorOtomatis                   -> Nomor # dengan saklar Otomatis dan aturan penomoran
// Dimuat sesudah umum/komponen-daftar.js dan sebelum file fitur. Beberapa fungsi yang dipakai di sini (petaAkun,
// bacaPenomoran, intipNomorBerikutnya, nomorBerikutnya, bacaProgram) baru dibuat oleh file fitur sesudahnya, jadi
// hanya dipanggil saat pengguna memakai formulir, bukan saat file ini dimuat.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- Angka di kolom isian ----------
// "Rp 1.500.000" / "1.500.000" / "1500000" -> 1500000. Hanya angka yang dihitung (paling banyak 15 digit).
function angkaDariTeks(teks) {
    var digit = String(teks).replace(/\D/g, "").slice(0, 15);
    return digit === "" ? 0 : Number(digit);
}

// Jumlah dalam teks isian: 1500000 -> "1.500.000", nol -> kosong.
// Selalu angka bulat (Rupiah tanpa desimal), apa pun pengaturan desimal di Preferensi: angkaDariTeks membuang semua
// tanda baca, jadi "150.000,00" akan terbaca 15.000.000 (Temuan 26). Pemisah ribuan mengikuti format angka Preferensi.
function teksAngkaIsian(nilai) {
    return nilai > 0 ? formatAngka(nilai, Object.assign({}, bacaFormat(), { desimal: 0 })) : "";
}

// ---------- Kolom nominal: titik ribuan langsung saat mengetik (PRD 5.1) ----------
// Mengetik 1500000 langsung tampil 1.500.000; kursor tetap di belakang angka yang sama (tidak loncat ke ujung).
// Dipakai semua kolom nominal: Nilai di popup rincian (Jurnal Umum, Pembayaran/Penerimaan, Pencatatan Donasi),
// komponen Pencatatan Gaji, Nilai Transfer, Saldo Awal akun.
function pasangKolomRupiah(kolom) {
    function rapikan() {
        var sebelum = kolom.value;
        var baru = teksAngkaIsian(angkaDariTeks(sebelum));
        if (baru === sebelum) { return; }
        // Hitung berapa angka di depan kursor, lalu taruh kursor sesudah angka ke-sekian itu di teks yang sudah rapi
        var posisi = kolom.selectionStart === null ? sebelum.length : kolom.selectionStart;
        var angkaDiDepan = sebelum.slice(0, posisi).replace(/\D/g, "").length;
        kolom.value = baru;
        if (document.activeElement !== kolom) { return; }
        var i = 0, terhitung = 0;
        while (i < baru.length && terhitung < angkaDiDepan) {
            if (/\d/.test(baru.charAt(i))) { terhitung++; }
            i++;
        }
        kolom.setSelectionRange(i, i);
    }
    kolom.addEventListener("input", rapikan);
    kolom.addEventListener("blur", rapikan);   // juga untuk isian tempelan (paste) atau yang diisi kode
}

// ---------- Teks dengan sorotan ----------
// Menulis teks dengan bagian yang cocok dengan kata cari disorot kuning (memakai <mark>, tanpa innerHTML).
// kata harus sudah huruf kecil.
function tulisDenganSorot(wadah, teks, kata) {
    teks = teksAman(teks);
    var kecil = teks.toLowerCase();
    var mulai = 0;
    while (kata !== "") {
        var ketemu = kecil.indexOf(kata, mulai);
        if (ketemu === -1) { break; }
        wadah.appendChild(document.createTextNode(teks.slice(mulai, ketemu)));
        var tanda = document.createElement("mark");
        tanda.textContent = teks.slice(ketemu, ketemu + kata.length);
        wadah.appendChild(tanda);
        mulai = ketemu + kata.length;
    }
    wadah.appendChild(document.createTextNode(teks.slice(mulai)));
}

// ---------- Pilihan di transaksi ----------
// Akun yang boleh dipilih di transaksi (Jurnal Umum, Pembayaran, pilihan Kas/Bank, akun gaji): akun yang TIDAK punya
// sub akun, di tingkat mana pun. Akun yang masih punya sub (induk, atau sub yang punya sub lagi) hanya pengelompokan.
function akunUntukJurnal() {
    var anak = petaAkun().anak;
    return bacaAkunPilihan().filter(function (a) { return !(anak[a.id] && anak[a.id].length > 0); });
}

// Pilihan Kas/Bank di semua transaksi (Pembayaran, nanti Penerimaan, Transfer, Donasi; PRD 5.1): hanya akun bertipe
// Kas & Bank di TINGKAT 3 (kedalaman 2: induk > sub > akun ini), misalnya 11010101 Kas Kecil Masjid. Urut kode.
function akunKasBankPilihan() {
    var dalam = petaAkun().dalam;
    return akunUntukJurnal().filter(function (a) { return a.tipe === "kas-bank" && dalam[a.id] === 2; }).sort(urutKodeAkun);
}

// Mengisi satu kotak pilihan Kas/Bank dengan akunKasBankPilihan, tulisannya "kode - nama" (misalnya "110101 - Kas Kecil").
// Dipakai Pembayaran, Penerimaan, Transfer Bank, Histori Bank, Rekonsiliasi Bank, dan Penomoran supaya ditulis sekali.
// tambahan = pengaturan isiPilihan (umum/alat.js) yang berbeda per halaman: kosong, kosongKalauTakAda, terpilih,
// nonaktifKalauKosong, petunjuk. Bawaan: kosong "Pilih Kas/Bank...", kosongKalauTakAda "Belum ada akun".
function isiPilihanKasBank(select, tambahan) {
    var pengaturan = Object.assign({
        teks: function (a) { return a.kode + " - " + a.nama; },
        kosong: "Pilih Kas/Bank...",
        kosongKalauTakAda: "Belum ada akun"
    }, tambahan);
    return isiPilihan(select, akunKasBankPilihan(), pengaturan);
}

// ---------- Pemeriksaan tanggal transaksi (PRD 5.3) ----------
// Dipakai semua formulir transaksi supaya aturannya ditulis sekali.
//   tanggal : isi kolom tanggal (YYYY-MM-DD)
//   lama    : data tersimpan yang sedang diubah, atau null untuk data baru
//   kata    : { catat: "jurnal", ini: "Jurnal ini" } -> dipakai di kalimat pesan
// Mengembalikan null kalau tanggal boleh dipakai, atau { pesan, diKolom } (diKolom = kursor ditaruh di kolom tanggal).
function galatTanggalTransaksi(tanggal, lama, kata) {
    if (tanggal === "") { return { pesan: "Tanggal wajib diisi.", diKolom: true }; }
    var mulai = tanggalMulaiDiatur();   // Preferensi > Data; belum diisi = tidak ada batas bawah
    if (mulai && tanggal < mulai) {
        return { pesan: "Tanggal tidak boleh sebelum tanggal mulai pembukuan, " + formatTanggal(mulai) + " (Preferensi, Data).", diKolom: true };
    }
    if (bacaPembatasan().masaDepan && tanggal > tanggalHariIni()) {
        return { pesan: "Tanggal tidak boleh melewati hari ini (Preferensi, Pembatasan).", diKolom: true };
    }
    if (tanggalTerkunci(tanggal)) {
        return { pesan: "Tanggal " + formatTanggal(tanggal) + " sudah terkunci (Preferensi, Pembatasan): " + kata.catat + " tidak bisa dicatat pada tanggal itu.", diKolom: true };
    }
    if (lama && tanggalTerkunci(lama.tanggal)) {
        return { pesan: kata.ini + " bertanggal " + formatTanggal(lama.tanggal) + " yang sudah terkunci (Preferensi, Pembatasan), jadi tidak bisa diubah.", diKolom: false };
    }
    return null;
}

// ---------- Bagian Dana: Terikat / Tidak Terikat (PRD 4.1) ----------
// Popup baris Jurnal Umum dan Pembayaran punya dua centang; hanya satu yang bisa dicentang (mencentang satu melepas
// yang lain). Nilai baris.terikat: true = Terikat, false = Tidak Terikat, null = belum dipilih.
//   centangTerikat, centangTidak : kedua kotak centang
// Mengembalikan { ambil() -> true/false/null, atur(nilai) }.
function pasangPilihanDana(centangTerikat, centangTidak) {
    centangTerikat.addEventListener("change", function () { if (centangTerikat.checked) { centangTidak.checked = false; } });
    centangTidak.addEventListener("change", function () { if (centangTidak.checked) { centangTerikat.checked = false; } });
    return {
        ambil: function () { return centangTerikat.checked ? true : (centangTidak.checked ? false : null); },
        atur: function (nilai) { centangTerikat.checked = (nilai === true); centangTidak.checked = (nilai === false); }
    };
}
// ---------- Pengaman baris: diperiksa saat Lanjut dan diperiksa ulang saat Simpan (PRD 4.1, 5.1) ----------
// Setiap baris selain akun Kas & Bank wajib punya Divisi (yang masih ada), dan, kalau formulirnya punya bagian Dana,
// wajib dipilih Terikat atau Tidak Terikat. Baris Kas & Bank tidak wajib (sifatnya dilihat dari baris lawannya).
// Dipakai Jurnal Umum, Pembayaran, dan Penerimaan supaya aturan dan kalimat pesannya sama.
//   daftarBaris : baris rincian (punya akunId, kode, nama, divisiId, terikat)
//   pakaiDana   : true kalau formulir punya bagian Dana (Jurnal Umum, Pembayaran)
// Kekurangan satu baris: "divisi", "dana", atau "" kalau lengkap (aturan yang sama untuk Lanjut dan Simpan).
function kekuranganBaris(b, pakaiDana) {
    var akun = bacaDaftarAkun().find(function (a) { return a.id === b.akunId; });
    if (akun && akun.tipe === "kas-bank") { return ""; }
    if (!bacaDivisi().some(function (d) { return d.id === b.divisiId; })) { return "divisi"; }
    if (pakaiDana && b.terikat !== true && b.terikat !== false) { return "dana"; }
    return "";
}
// Saat klik Lanjut di popup baris (sedini mungkin): pesan untuk isian popup yang sedang dibuka, atau "".
function pesanIsianBarisBelumLengkap(b, pakaiDana) {
    var kurang = kekuranganBaris(b, pakaiDana);
    // Belum ada Divisi sama sekali: beri tahu tempat membuatnya (berlaku sama di semua formulir)
    if (kurang === "divisi") { return "Divisi wajib dipilih (tab Info lainnya)." + (bacaDivisi().length ? "" : " Buat dulu di Master Data, Divisi."); }
    if (kurang === "dana") { return "Pilih Terikat atau Tidak Terikat di bagian Dana (tab Info lainnya)."; }
    return "";
}
// Saat Simpan: pesan untuk baris pertama yang belum lengkap (menyebut barisnya), atau "" kalau semua lengkap.
function pesanBarisBelumLengkap(daftarBaris, pakaiDana) {
    for (var i = 0; i < daftarBaris.length; i++) {
        var b = daftarBaris[i];
        var kurang = kekuranganBaris(b, pakaiDana);
        var nama = "Baris " + teksAman(b.kode) + " " + teksAman(b.nama);
        if (kurang === "divisi") { return nama + " belum diisi Divisi. Klik barisnya, lalu pilih Divisi di Info lainnya."; }
        if (kurang === "dana") { return nama + " belum dipilih Terikat atau Tidak Terikat. Klik barisnya, lalu pilih di Info lainnya (Dana)."; }
    }
    return "";
}

// ---------- Label filter Tanggal per bulan ----------
// Filter Tanggal di daftar transaksi memakai nilai "2026-10" (urut menurut waktu) dan tampil sebagai "Okt 2026".
function teksBulanTahun(nilai) {
    var bagian = String(nilai).split("-");
    var bulan = NAMA_BULAN_SINGKAT[Number(bagian[1]) - 1];
    return (bagian.length === 2 && bulan) ? bulan + " " + bagian[0] : String(nilai);
}

// ---------- Nomor transaksi sudah dipakai? (PRD 5.2) ----------
// Dipakai semua formulir transaksi supaya aturannya ditulis sekali (Temuan 20).
//   nomor        : nomor yang akan disimpan
//   daftar       : daftar data jenis transaksi ini (nomor wajib unik di antaranya)
//   idDiubah     : id data yang sedang diubah (nomornya sendiri tidak dihitung), atau null
//   sumberJurnal : jenis jurnal otomatis transaksi ini, misalnya "pembayaran"; kalau diisi, nomor juga tidak boleh sama
//                  dengan jurnal lain di buku jurnal (jurnal otomatisnya memakai nomor yang sama). null = tidak dicek.
// Huruf besar-kecil dianggap sama ("bkk-1" = "BKK-1").
function nomorTransaksiTerpakai(nomor, daftar, idDiubah, sumberJurnal) {
    var kecil = teksAman(nomor).toLowerCase();
    if (daftar.some(function (d) { return d.id !== idDiubah && teksAman(d.nomor).toLowerCase() === kecil; })) { return true; }
    if (!sumberJurnal) { return false; }
    var milikSendiri = idDiubah ? { jenis: sumberJurnal, id: idDiubah } : null;
    return modulJurnal.ambil().some(function (j) {
        return !(milikSendiri && jurnalMilik(j, milikSendiri)) && teksAman(j.nomor).toLowerCase() === kecil;
    });
}

// ---------- Pengaman saldo Kas/Bank minus (PRD 5.6, keputusan pengguna 2026-10-30) ----------
// Dipakai semua transaksi berjurnal sebelum disimpan (lewat simpanTransaksiDenganJurnal, dan Jurnal Umum langsung).
//   jurnalBaru : { tanggal, rincian } jurnal yang akan disimpan
//   milikLama  : function (j) -> true untuk jurnal lama transaksi ini (sedang diubah), yang diganti jurnalBaru
// Untuk tiap akun Kas/Bank di jurnalBaru, dihitung SALDO AKHIR HARI mulai tanggal transaksi (atau tanggal lamanya,
// mana yang lebih awal) sampai tanggal terakhir di buku jurnal, sebelum dan sesudah perubahan. Bermasalah hanya kalau
// sesudahnya ada saldo minus yang LEBIH minus daripada sebelumnya, supaya data lama yang terlanjur minus tidak
// menghalangi transaksi lain. Preferensi > Pembatasan: "tolak" (bawaan) = tidak disimpan; "peringatan" = tetap disimpan.
// Mengembalikan true kalau boleh lanjut menyimpan, false kalau ditolak (pesannya sudah tampil di pojok kanan atas).
function periksaKasMinus(jurnalBaru, milikLama) {
    var semuaAkun = bacaDaftarAkun();
    var semua = bacaJurnalMentah();
    var lama = semua.filter(function (j) { return j && milikLama(j); });
    var lain = semua.filter(function (j) { return j && !milikLama(j); });
    var mulai = teksAman(jurnalBaru.tanggal);
    lama.forEach(function (j) { if (teksAman(j.tanggal) && teksAman(j.tanggal) < mulai) { mulai = teksAman(j.tanggal); } });
    var idKas = [];
    rincianAman(jurnalBaru).forEach(function (r) {
        var akun = semuaAkun.find(function (a) { return a && a.id === r.akunId; });
        if (akun && akun.tipe === "kas-bank" && idKas.indexOf(akun.id) === -1) { idKas.push(akun.id); }
    });

    // Saldo akhir hari terendah sejak tanggal mulai: { saldo, tanggal } (alat bersama saldoTerendahSejak, umum/alat.js).
    // Kas/Bank bertambah oleh Debit. Tanpa prototipe: tanggal rusak tetap jadi kunci biasa.
    function terendah(akun, daftarJurnal) {
        var perHari = Object.create(null);
        daftarJurnal.forEach(function (j) {
            rincianAman(j).forEach(function (r) {
                if (r.akunId !== akun.id) { return; }
                var t = teksAman(j.tanggal);
                perHari[t] = (perHari[t] || 0) + (Number(r.debit) || 0) - (Number(r.kredit) || 0);
            });
        });
        return saldoTerendahSejak(perHari, akun.saldoAwal, mulai);
    }
    // Saldo yang tersedia pada akhir tanggal transaksi, tanpa transaksi ini
    function tersedia(akun) {
        return lain.reduce(function (n, j) {
            if (teksAman(j.tanggal) > teksAman(jurnalBaru.tanggal)) { return n; }
            return rincianAman(j).reduce(function (m, r) {
                return r.akunId === akun.id ? m + (Number(r.debit) || 0) - (Number(r.kredit) || 0) : m;
            }, n);
        }, Number(akun.saldoAwal) || 0);
    }

    var masalah = null;
    idKas.some(function (id) {
        var akun = semuaAkun.find(function (a) { return a.id === id; });
        var sebelum = terendah(akun, semua);
        var sesudah = terendah(akun, lain.concat([jurnalBaru]));
        if (sesudah.saldo < 0 && sesudah.saldo < sebelum.saldo) { masalah = { akun: akun, sesudah: sesudah }; }
        return !!masalah;
    });
    if (!masalah) { return true; }

    var tolak = bacaPembatasan().kasMinus !== "peringatan";
    tampilkanNotifikasi("Saldo [" + teksAman(masalah.akun.kode) + "] " + teksAman(masalah.akun.nama) + " jadi minus pada " +
        formatTanggal(masalah.sesudah.tanggal) + ": Rp -" + formatAngka(Math.abs(masalah.sesudah.saldo)) +
        ". Saldo tersedia per " + formatTanggal(jurnalBaru.tanggal) + ": " + formatRupiah(tersedia(masalah.akun)) + ". " +
        (tolak ? "Tidak disimpan (Preferensi, Pembatasan)." : "Tetap disimpan (Preferensi, Pembatasan: peringatan saja)."), "peringatan");
    return !tolak;
}

// ---------- Menyimpan transaksi beserta jurnal otomatisnya (PRD 3.1) ----------
// Langkah yang sama untuk semua transaksi yang membuat jurnal (Pembayaran, Penerimaan, Transfer, dll.):
//   1) simpan daftar transaksi; 2) simpan jurnal otomatisnya; kalau jurnal gagal, daftar transaksi dikembalikan;
//   3) nomor otomatis baru "dipakai" (hitungan naik) setelah semuanya tersimpan; kalau nomornya ternyata berubah,
//      transaksi dan jurnalnya disimpan ulang dengan nomor itu; 4) notifikasi dan Log Aktivitas (selesaiSimpan).
// o = { modul, kunci, daftar, trx, sedangMengubah, salinanLama, sumberJurnal, isiJurnal(trx), nomor (alat buatNomorOtomatis),
//       infoNomor, tanggal, lampiran, galatLampiran(pesan) }. Mengembalikan true kalau berhasil.
//   lampiran (boleh tidak ada): kotak lampiran formulir (umum/lampiran.js). Isi file disimpan sesudah pemeriksaan Kas/Bank minus
//   dan SEBELUM transaksinya; penyimpanan penuh = transaksi tidak disimpan (pesan lewat galatLampiran). Kalau transaksi atau
//   jurnalnya gagal disimpan, isi file dikembalikan seperti semula.
function simpanTransaksiDenganJurnal(o) {
    var sumber = { jenis: o.sumberJurnal, id: o.trx.id };
    // Pengaman Kas/Bank minus (PRD 5.6): jurnal lama transaksi ini (kalau sedang diubah) diganti versi barunya
    if (!periksaKasMinus(o.isiJurnal(o.trx), function (j) { return jurnalMilik(j, sumber); })) { return false; }
    var simpananLampiran = null;
    if (o.lampiran) {
        simpananLampiran = o.lampiran.simpanIsi(o.trx.id);
        if (!simpananLampiran) { o.galatLampiran(o.lampiran.pesanPenuh); return false; }
    }
    function gagal() { if (simpananLampiran) { simpananLampiran.pulihkan(); } return false; }
    var awal = JSON.stringify(o.modul.ambil());
    if (!o.modul.simpan(o.daftar)) { return gagal(); }
    if (!modulJurnal.simpan(daftarJurnalDenganOtomatis(sumber, o.isiJurnal(o.trx)))) {
        try { localStorage.setItem(o.kunci, awal); } catch (galat) { /* biarkan */ }
        return gagal();
    }
    var nomorDipakai = o.nomor.pakai(o.infoNomor, o.tanggal);
    if (nomorDipakai !== o.trx.nomor) {
        o.trx.nomor = o.trx.nama = nomorDipakai;
        o.modul.simpan(o.daftar);
        modulJurnal.simpan(daftarJurnalDenganOtomatis(sumber, o.isiJurnal(o.trx)));
    }
    o.modul.selesaiSimpan(o.sedangMengubah, o.trx, o.salinanLama);
    return true;
}

// Urutkan akun menurut kode (1101, 110101, 1102, ...)
function urutKodeAkun(a, b) {
    return teksAman(a.kode).localeCompare(teksAman(b.kode), "id", { numeric: true });
}

// Program untuk pilihan di transaksi: hanya yang berstatus Aktif, ditambah program yang sedang dipakai baris itu
// (supaya baris lama dengan program yang sudah Selesai tetap menampilkan programnya).
function daftarProgramPilihan(idDipakai) {
    return bacaProgram().filter(function (p) { return p.status === "aktif" || (idDipakai && p.id === idDipakai); });
}

// ---------- Tab samping dan tab popup ----------
// tombol   : kumpulan tombol tab (NodeList), masing-masing punya data-<kunci>="nama"
// kunci    : nama dataset, misalnya "jurnalTab" untuk atribut data-jurnal-tab
// panelId  : { nama: "id panel" }, misalnya { rincian: "jurnal-panel-rincian", info: "jurnal-panel-info" }
// Mengembalikan fungsi pilih(nama) untuk berpindah tab dari kode. Klik tombol juga sudah dipasang.
function buatPengalihTab(tombol, kunci, panelId) {
    function pilih(nama) {
        tombol.forEach(function (t) {
            var aktif = (t.dataset[kunci] === nama);
            t.classList.toggle("aktif", aktif);
            t.setAttribute("aria-selected", aktif ? "true" : "false");
        });
        Object.keys(panelId).forEach(function (n) {
            document.getElementById(panelId[n]).hidden = (n !== nama);
        });
    }
    tombol.forEach(function (t) {
        t.addEventListener("click", function () { pilih(t.dataset[kunci]); });
    });
    return pilih;
}

// ---------- Isi tabel rincian ----------
// Ikon tiga garis di kolom paling kiri (penanda baris; teks tetap milik aplikasi, bukan dari pengguna)
var IKON_GESER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 8h12M6 12h12M6 16h12"/></svg>';

// Baris "Belum ada data" untuk tabel rincian yang masih kosong. jumlahKolom = kolom sesudah kolom ikon.
function barisKosongTabel(jumlahKolom) {
    var tr = document.createElement("tr");
    tr.className = "jurnal-kosong";
    var tdGeser = document.createElement("td");
    tdGeser.className = "jurnal-kol-geser";
    tdGeser.setAttribute("aria-hidden", "true");
    tdGeser.innerHTML = IKON_GESER;   // ikon tetap, bukan dari pengguna
    var td = document.createElement("td");
    td.colSpan = jumlahKolom;
    td.textContent = "Belum ada data";
    tr.appendChild(tdGeser);
    tr.appendChild(td);
    return tr;
}

// Sel berisi tombol X untuk menghapus satu baris. Klik tombol tidak ikut membuka popup baris.
//   label     : untuk pembaca layar, misalnya "Hapus baris 110101 Kas Kecil"
//   saatHapus : fungsi yang menghapus baris itu dari data kerja lalu menggambar ulang tabel
function tombolHapusBaris(label, saatHapus) {
    var td = document.createElement("td");
    td.className = "jurnal-kol-hapus";
    var tombol = document.createElement("button");
    tombol.type = "button";
    tombol.className = "jurnal-hapus-baris";
    tombol.title = "Hapus baris";
    tombol.setAttribute("aria-label", label);
    tombol.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';   // ikon tetap
    tombol.addEventListener("click", function (k) {
        k.stopPropagation();   // jangan ikut membuka popup baris
        saatHapus();
    });
    td.appendChild(tombol);
    return td;
}

// ---------- Kolom cari dengan daftar hasil melayang ----------
// Dipakai untuk "Cari/Pilih Akun Perkiraan..." (Jurnal Umum, Pembayaran) dan "Cari/Pilih Karyawan..." (Gaji).
// Perilaku: fokus atau klik membuka daftar; mengetik menyaring; panah atas/bawah memindah sorotan; Enter memilih;
// Esc atau klik di luar menutup. Paling banyak 50 hasil.
//   kolom        : <input> kolom cari
//   daftar       : <ul> daftar hasil (berada di dalam pembungkus yang sama dengan kolom)
//   ambilData()  : semua butir yang boleh dipilih
//   cocok(butir, kata) : apakah butir cocok dengan kata cari (kata sudah huruf kecil; kata kosong = semua cocok)
//   urut(a, b)   : (boleh kosong) urutan hasil
//   gambarButir(li, butir, kata) : mengisi isi satu baris hasil
//   teksKosong(adaData) : tulisan kalau tidak ada hasil (adaData = false berarti memang belum ada data sama sekali)
//   saatPilih(butir)    : dijalankan saat butir dipilih (kolom sudah dikosongkan dan daftar sudah ditutup)
//   bolehBuka()  : (boleh kosong) syarat sebelum daftar dibuka; kalau false, daftar tidak dibuka
//   tambahBaru   : (boleh kosong) { nama(butir), saatKlik(kata) } -> tombol 'Simpan "kata" sebagai data baru?' (seperti
//                  Accurate) muncul di bawah daftar selama belum ada butir yang nama(butir)-nya SAMA PERSIS dengan kata
//                  (huruf besar-kecil dianggap sama), walaupun ada hasil yang mirip (misalnya "Andi" saat ada "Fandi").
//                  Klik tombol menjalankan saatKlik dengan kata aslinya. Enter hanya membuat data baru kalau tidak ada
//                  hasil sama sekali (kalau ada hasil, Enter memilih hasil yang disorot).
// Mengembalikan { tutup, abaikanFokusSebentar, fokusUlang }.
function buatKolomCari(p) {
    var hasil = [];       // butir yang sedang tampil di daftar
    var sorot = -1;       // nomor hasil yang disorot (untuk panah dan Enter)
    var waktuAbaikan = 0; // fokus yang datang sebelum waktu ini tidak membuka daftar
    var pembungkus = p.kolom.parentElement;

    function tutup() {
        p.daftar.hidden = true;
        p.kolom.setAttribute("aria-expanded", "false");
        sorot = -1;
    }

    function terapkanSorot() {
        p.daftar.querySelectorAll(".jurnal-pilihan-akun").forEach(function (li, i) {
            li.classList.toggle("disorot", i === sorot);
            li.setAttribute("aria-selected", i === sorot ? "true" : "false");
            if (i === sorot && li.scrollIntoView) { li.scrollIntoView({ block: "nearest" }); }   // sorotan selalu terlihat
        });
    }

    function pilih(butir) {
        p.kolom.value = "";
        tutup();
        p.saatPilih(butir);
    }

    function gambar() {
        if (p.bolehBuka && !p.bolehBuka()) {
            p.kolom.value = "";
            tutup();
            return;
        }
        var kata = p.kolom.value.trim().toLowerCase();
        var semua = p.ambilData();
        hasil = semua.filter(function (b) { return p.cocok(b, kata); });
        if (p.urut) { hasil.sort(p.urut); }
        hasil = hasil.slice(0, 50);
        p.daftar.textContent = "";
        if (hasil.length === 0) {
            var info = document.createElement("li");
            info.className = "jurnal-info-akun";
            info.textContent = p.teksKosong(semua.length > 0);
            p.daftar.appendChild(info);
        }
        hasil.forEach(function (butir, i) {
            var li = document.createElement("li");
            li.className = "jurnal-pilihan-akun";
            li.setAttribute("role", "option");
            p.gambarButir(li, butir, kata);
            // mousedown (bukan click) supaya terjadi sebelum kolom cari kehilangan fokus
            li.addEventListener("mousedown", function (k) { k.preventDefault(); pilih(butir); });
            li.addEventListener("mousemove", function () { sorot = i; terapkanSorot(); });
            p.daftar.appendChild(li);
        });
        // Tombol data baru di paling bawah: selama belum ada data bernama sama persis dengan kata yang diketik
        if (bolehTambahBaru() && !semua.some(function (b) { return teksAman(p.tambahBaru.nama(b)).trim().toLowerCase() === kata; })) {
            p.daftar.appendChild(butirTambahBaru());
        }
        sorot = hasil.length ? 0 : -1;
        terapkanSorot();
        p.daftar.hidden = false;
        p.kolom.setAttribute("aria-expanded", "true");
    }

    // Tombol 'Simpan "..." sebagai data baru?' hanya kalau halaman memintanya dan ada kata yang diketik
    function bolehTambahBaru() { return !!p.tambahBaru && p.kolom.value.trim() !== ""; }
    function jalankanTambahBaru() {
        var kata = p.kolom.value.trim();   // kata asli (bukan huruf kecil), untuk nama data baru
        p.kolom.value = "";
        tutup();
        p.tambahBaru.saatKlik(kata);
    }
    function butirTambahBaru() {
        var li = document.createElement("li");
        li.className = "jurnal-info-akun";
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "tombol tombol-utama tombol-data-baru";
        tombol.textContent = 'Simpan "' + p.kolom.value.trim() + '" sebagai data baru?';   // textContent: aman dari kode HTML
        // mousedown (bukan click) supaya terjadi sebelum kolom cari kehilangan fokus
        tombol.addEventListener("mousedown", function (k) { k.preventDefault(); jalankanTambahBaru(); });
        li.appendChild(tombol);
        return li;
    }

    // Sesudah popup tertutup, browser mengembalikan fokus ke kolom cari (kadang terlambat). Jangan buka daftar karenanya.
    p.kolom.addEventListener("focus", function () {
        if (Date.now() < waktuAbaikan) { return; }
        gambar();
    });
    p.kolom.addEventListener("click", gambar);
    p.kolom.addEventListener("input", gambar);
    p.kolom.addEventListener("keydown", function (k) {
        if (k.key === "ArrowDown" || k.key === "ArrowUp") {
            k.preventDefault();
            if (p.daftar.hidden) { gambar(); return; }
            if (hasil.length) {
                sorot = (sorot + (k.key === "ArrowDown" ? 1 : -1) + hasil.length) % hasil.length;
                terapkanSorot();
            }
        } else if (k.key === "Enter") {
            k.preventDefault();   // Enter di sini memilih, bukan mengirim formulir
            if (!p.daftar.hidden && sorot >= 0 && (!p.bolehBuka || p.bolehBuka())) { pilih(hasil[sorot]); }
            else if (!p.daftar.hidden && hasil.length === 0 && p.daftar.querySelector(".tombol-data-baru")) { jalankanTambahBaru(); }
        } else if (k.key === "Escape") {
            tutup();
        }
    });
    // Klik di luar kolom cari dan daftarnya menutup daftar
    document.addEventListener("click", function (k) {
        if (!p.daftar.hidden && !pembungkus.contains(k.target)) { tutup(); }
    });

    // Dipanggil SEBELUM popup ditutup: fokus yang kembali ke kolom cari dalam 0,6 detik tidak membuka daftar
    function abaikanFokusSebentar() { waktuAbaikan = Date.now() + 600; }

    // Siap memilih butir berikutnya tanpa langsung membuka daftar. Saat popup tertutup, Chrome sudah mengembalikan
    // fokus ke kolom cari, tetapi belum menerima ketikan di sana sampai fokus "dipasang ulang"; jadi fokus dilepas
    // lalu dipasang lagi, ditunda sebentar sampai popup benar-benar tertutup.
    function fokusUlang() {
        setTimeout(function () {
            abaikanFokusSebentar();
            p.kolom.blur();
            p.kolom.focus();
        }, 0);
    }

    return { tutup: tutup, abaikanFokusSebentar: abaikanFokusSebentar, fokusUlang: fokusUlang };
}

// ---------- Pengaman urutan isian (PRD 5.1, permintaan pengguna 2026-10-30) ----------
// Kolom cari rincian (akun, kategori, karyawan, tujuan) baru bisa dibuka kalau isian di bagian atas formulir sudah
// lengkap. Kalau belum: muncul peringatan (tidak diulang dalam 1 detik, karena fokus dan klik terjadi hampir bersamaan)
// dan kursor dipindah ke isian pertama yang kurang. Dipakai lewat pilihan bolehBuka di buatKolomCari.
//   syarat : [{ nama, kolom, kata, terisi() }] berurutan seperti di formulir
//            nama = nama isian di pesan; kolom = elemen yang diberi kursor; kata = "Pilih" (bawaan "Isi");
//            terisi() = (boleh kosong) apakah sudah terisi; bawaannya kolom.value tidak kosong
//   tujuan : sisa kalimat pesan, misalnya "memilih akun perkiraan"
// Mengembalikan { kurang() -> syarat pertama yang belum terisi atau null, bolehBuka() -> true/false }.
function buatSyaratIsian(syarat, tujuan) {
    var waktuPeringatan = 0;
    function kurang() {
        return syarat.find(function (s) { return !(s.terisi ? s.terisi() : s.kolom.value !== ""); }) || null;
    }
    function bolehBuka() {
        var s = kurang();
        if (!s) { return true; }
        if (Date.now() - waktuPeringatan > 1000) {
            waktuPeringatan = Date.now();
            tampilkanNotifikasi((s.kata || "Isi") + " " + s.nama + " dulu sebelum " + tujuan + ".", "peringatan");
        }
        s.kolom.focus();
        return false;
    }
    return { kurang: kurang, bolehBuka: bolehBuka };
}

// ---------- Penanda pilihan (chip) di kolom cari satu pilihan ----------
// Pilihan yang sudah dipilih tampil sebagai label "[ID] Nama ×" di dalam kolom cari (PRD 5.1, seperti Accurate).
// Klik × melepas pilihan; mengetik di kolom memulai pencarian baru dan melepas pilihan lama.
// Labelnya dibuat dengan alat bersama buatChip (umum/alat.js). Kolom diberi jarak kiri selebar label supaya teks yang
// diketik tidak tertutup.
//   kolom     : <input> kolom cari (pembungkusnya harus position: relative, misalnya .jurnal-cari)
//   saatLepas : fungsi yang dijalankan saat pilihan dilepas (× diklik, atau kolom diketik), misalnya mengosongkan id terpilih
//   pertahankanSaatMengetik : (boleh kosong) true = mengetik hanya menyembunyikan label sementara (pilihan tetap);
//                 dipakai kotak pilihan (umum/pemilih-opsi.js), yang memasang kembali labelnya sendiri saat kolom ditinggalkan
//   petunjuk() : (boleh kosong) tulisan petunjuk kolom saat tidak ada label; bawaan = placeholder awal kolom
// Mengembalikan { tampilkan(teks, tanpaHapus), kosongkan() }. tanpaHapus = true: label tanpa tombol × (pilihan wajib berisi).
// kosongkan() hanya menghapus label (tanpa saatLepas).
function buatChipPilihan(p) {
    var chip = null;
    var petunjukAsli = p.kolom.placeholder;

    function kosongkan() {
        if (chip) { chip.remove(); chip = null; }
        p.kolom.style.paddingLeft = "";
        p.kolom.placeholder = p.petunjuk ? p.petunjuk() : petunjukAsli;
    }
    function lepas() {
        kosongkan();
        p.saatLepas();
    }
    // Jarak kiri kolom = lebar label. Kalau kolom sedang tersembunyi (lebar 0), dihitung ulang saat kolom difokus.
    function aturJarak() {
        if (!chip) { return; }
        var lebar = chip.getBoundingClientRect().width;
        if (lebar > 0) { p.kolom.style.paddingLeft = Math.ceil(lebar + 12) + "px"; }
    }
    function tampilkan(teks, tanpaHapus) {
        kosongkan();
        chip = buatChip(teks, "Lepas pilihan " + teks, function (e) {
            e.stopPropagation();   // jangan ikut membuka daftar pilihan
            lepas();
            p.kolom.focus();
        });
        chip.classList.add("chip-di-kolom");
        if (tanpaHapus) { chip.querySelector(".chip-hapus").remove(); }
        // Klik pada tulisan label = klik kolom: kursor ke kolom (daftar pilihan terbuka untuk mengganti pilihan)
        chip.addEventListener("click", function () { p.kolom.focus(); p.kolom.click(); });
        p.kolom.value = "";
        p.kolom.placeholder = "";
        p.kolom.parentElement.insertBefore(chip, p.kolom.nextSibling);
        aturJarak();
    }
    p.kolom.addEventListener("focus", aturJarak);
    p.kolom.addEventListener("input", function () {
        if (!chip) { return; }
        if (p.pertahankanSaatMengetik) { kosongkan(); } else { lepas(); }
    });
    return { tampilkan: tampilkan, kosongkan: kosongkan };
}

// ---------- Kolom pilih beberapa (label banyak) ----------
// Kolom cari yang boleh berisi BEBERAPA pilihan, masing-masing tampil sebagai label "Nama ×" (seperti kolom Cabang dan
// Departemen di Parameter Laporan Accurate; PRD 7). Dipakai Divisi dan Program di Parameter Laporan.
// Memakai alat bersama buatKolomCari (daftar, panah, Enter) dan buatChip (umum/alat.js), dengan tampilan kotak
// .pemilih-banyak (sama dengan .pemilih-akun, umum/popup-dan-preferensi.css).
//   wadah      : elemen .pemilih-banyak berisi .pemilih-chip, <input> kolom cari, dan <ul class="jurnal-daftar-akun">
//   ambilData  : function () -> [{ nilai, teks }] semua pilihan (dibaca ulang setiap daftar dibuka)
//   labelSemua : (boleh kosong) tulisan label saat belum ada pilihan, misalnya "Semua Divisi" (tanpa ×);
//                tanpa ini kolom kosong menampilkan placeholder-nya
//   saatUbah   : (boleh kosong) dijalankan setiap pilihan bertambah/berkurang
// Mengembalikan { nilai() -> salinan daftar nilai terpilih, tetapkan(daftarNilai) }.
function buatPemilihBanyak(p) {
    var kolom = p.wadah.querySelector("input");
    var wadahChip = p.wadah.querySelector(".pemilih-chip");
    var terpilih = [];

    function teksDari(nilai) {
        var o = p.ambilData().find(function (b) { return b.nilai === nilai; });
        return o ? o.teks : "(sudah dihapus)";   // data bisa terhapus setelah dipilih: tetap tampil supaya bisa dilepas
    }
    function gambarChip() {
        wadahChip.textContent = "";
        if (terpilih.length === 0 && p.labelSemua) {
            var semua = buatChip(p.labelSemua, "", function () {});
            semua.querySelector(".chip-hapus").remove();   // "Semua" adalah keadaan awal, bukan pilihan yang bisa dilepas
            wadahChip.appendChild(semua);
        }
        terpilih.forEach(function (nilai) {
            var teks = teksDari(nilai);
            wadahChip.appendChild(buatChip(teks, "Lepas pilihan " + teks, function (e) {
                e.stopPropagation();   // jangan ikut membuka daftar pilihan
                terpilih = terpilih.filter(function (n) { return n !== nilai; });
                gambarChip();
                if (p.saatUbah) { p.saatUbah(); }
                kolom.focus();
            }));
        });
    }

    buatKolomCari({
        kolom: kolom,
        daftar: p.wadah.querySelector(".jurnal-daftar-akun"),
        // Yang sudah dipilih tidak ditawarkan lagi
        ambilData: function () { return p.ambilData().filter(function (b) { return terpilih.indexOf(b.nilai) === -1; }); },
        cocok: function (b, kata) { return kata === "" || b.teks.toLowerCase().indexOf(kata) !== -1; },
        gambarButir: function (li, b, kata) {
            var nama = document.createElement("div");
            nama.className = "jurnal-pilihan-nama";
            tulisDenganSorot(nama, b.teks, kata);
            li.appendChild(nama);
        },
        teksKosong: function (adaData) { return adaData ? "Tidak ada pilihan yang cocok." : "Tidak ada pilihan lagi."; },
        saatPilih: function (b) {
            terpilih.push(b.nilai);
            gambarChip();
            if (p.saatUbah) { p.saatUbah(); }
        }
    });
    // Esc saat daftar pilihan terbuka: hanya daftar yang menutup (buatKolomCari), popup tempat kolom ini berada tidak ikut
    // tertutup. preventDefault mencegah <dialog> menganggap Esc sebagai permintaan tutup.
    kolom.addEventListener("keydown", function (k) {
        var daftar = p.wadah.querySelector(".jurnal-daftar-akun");
        if (k.key === "Escape" && !daftar.hidden) { k.preventDefault(); }
    }, true);   // true: diperiksa sebelum buatKolomCari menutup daftarnya
    // Klik di mana saja di dalam kotak (juga di sela label) = klik kolom cari
    p.wadah.addEventListener("click", function (k) {
        if (k.target === p.wadah || k.target === wadahChip) { kolom.focus(); }
    });

    gambarChip();
    return {
        nilai: function () { return terpilih.slice(); },
        tetapkan: function (daftarNilai) {
            terpilih = (Array.isArray(daftarNilai) ? daftarNilai : []).filter(function (n, i, s) {
                return typeof n === "string" && n !== "" && s.indexOf(n) === i;   // hanya teks, tanpa kembar
            });
            gambarChip();
        }
    };
}

// ---------- Nomor otomatis ----------
// Nomor # di formulir transaksi: saklar Otomatis (bawaan menyala) dengan pilihan aturan penomoran dari Pengaturan,
// Penomoran, atau dimatikan lalu nomor diketik sendiri. Contoh nomor berikutnya tampil di bawahnya.
//   saklar   : kotak centang "Otomatis"
//   pilihan  : <select> aturan penomoran
//   kolom    : <input> nomor yang diketik sendiri
//   contoh   : elemen teks "Nomor berikutnya: ..."
//   tanggal  : kolom tanggal transaksi (hitungan nomor bisa mulai lagi tiap bulan/tahun)
//   tipe     : tipe aturan penomoran, misalnya "jurnal", "gaji", "pembayaran"
//   namaTipe : nama tipe untuk pesan, misalnya "Jurnal Umum"
// Mengembalikan:
//   mulai(nomorTersimpan) : untuk mengisi formulir. Tanpa nomor (data baru) = otomatis; dengan nomor = nomornya tampil
//                           di kolom dan boleh diubah.
//   segarkan()            : muat ulang pilihan aturan (aturan bisa berubah di Pengaturan)
//   ikutKas(idKas)        : pilih aturan yang ditautkan ke akun Kas/Bank itu (transaksi Kas/Bank, PRD 6.3)
//   ambil(tanggal)        : nomor yang akan dipakai saat menyimpan: { nomor, aturanId, otomatis } atau
//                           { galat: "pesan", kolomFokus } kalau belum bisa
//   pakai(info, tanggal)  : dipanggil SETELAH data tersimpan: nomor otomatis baru "dipakai" (hitungan naik).
//                           Mengembalikan nomor yang benar-benar terpakai (bisa beda kalau aturan dipakai di tempat lain).
function buatNomorOtomatis(p) {
    function perbaruiContoh() {
        if (!p.saklar.checked) { p.contoh.textContent = ""; return; }
        if (p.pilihan.value === "") {
            p.contoh.textContent = aturanTipeIni().length
                ? "Pilih aturan penomoran."
                : "Buat aturan penomoran bertipe " + p.namaTipe + " di Pengaturan, Penomoran.";
            return;
        }
        var nomor = intipNomorBerikutnya(p.pilihan.value, p.tanggal.value || tanggalHariIni());
        p.contoh.textContent = nomor ? "Nomor berikutnya: " + nomor : "";
    }

    function aturanTipeIni() {
        return bacaPenomoran().filter(function (a) { return a.tipe === p.tipe; });
    }

    // Aturan yang cocok untuk satu akun Kas/Bank (PRD 6.3): aturan yang ditautkan ke Kas/Bank itu; kalau tidak ada,
    // aturan "Semua Kas/Bank" (tanpa tautan) yang pertama; kalau tidak ada juga, aturan pertama. idKas "" = belum dipilih.
    function aturanUntukKas(aturan, idKas) {
        var tertaut = idKas ? aturan.find(function (a) { return a.kasId === idKas; }) : null;
        var umum = aturan.find(function (a) { return !a.kasId; });
        var pilih = tertaut || umum || aturan[0];
        return pilih ? pilih.id : "";
    }

    // Isi pilihan aturan bertipe ini; pilihan yang sedang dipakai dipertahankan kalau masih ada.
    // Data Baru mulai dari "Silakan Pilih" (PRD 5.3a): aturan tidak dipilihkan sendiri.
    function segarkan() {
        var sebelumnya = p.pilihan.value;
        var aturan = aturanTipeIni();
        var adaSebelumnya = aturan.some(function (a) { return a.id === sebelumnya; });
        isiPilihan(p.pilihan, aturan, {
            kosong: "Silakan Pilih",
            kosongKalauTakAda: "Belum ada aturan penomoran",
            terpilih: adaSebelumnya ? sebelumnya : "",
            nonaktifKalauKosong: true
        });
        perbaruiContoh();
    }

    // Otomatis = pilihan aturan tampil; dimatikan = kolom nomor diketik sendiri
    function terapkanMode() {
        var otomatis = p.saklar.checked;
        p.pilihan.hidden = !otomatis;
        p.kolom.hidden = otomatis;
        perbaruiContoh();
    }

    p.pilihan.addEventListener("change", perbaruiContoh);
    p.tanggal.addEventListener("change", perbaruiContoh);   // pindah bulan berarti hitungan nomor bisa mulai lagi
    p.saklar.addEventListener("change", function () {
        terapkanMode();
        if (p.saklar.checked) { p.kolom.value = ""; } else { p.kolom.focus(); }
    });

    return {
        mulai: function (nomorTersimpan) {
            p.kolom.value = teksAman(nomorTersimpan);
            p.saklar.checked = !nomorTersimpan;
            p.pilihan.value = "";   // Data Baru: aturan dipilih sendiri (PRD 5.3a)
            segarkan();
            terapkanMode();
        },
        segarkan: segarkan,
        // Dipanggil saat Kas/Bank dipilih di transaksi Kas/Bank: aturan nomornya ikut Kas/Bank itu (PRD 6.3).
        // Hanya saat Otomatis menyala; pengguna tetap bisa memilih aturan lain atau mematikan Otomatis.
        ikutKas: function (idKas) {
            if (!p.saklar.checked) { return; }
            var id = aturanUntukKas(aturanTipeIni(), idKas);
            if (id) { p.pilihan.value = id; }
            perbaruiContoh();
        },
        ambil: function (tanggal) {
            if (p.saklar.checked) {
                var aturanId = p.pilihan.value;
                if (aturanId === "") {
                    return { galat: "Pilih aturan penomoran (atau matikan Otomatis dan ketik nomor sendiri). Aturan dibuat di Pengaturan, Penomoran, tipe " + p.namaTipe + ".",
                             kolomFokus: p.pilihan.disabled ? p.saklar : p.pilihan };
                }
                var nomor = intipNomorBerikutnya(aturanId, tanggal) || "";
                if (nomor === "") {
                    // Aturan rusak atau tidak lengkap: jangan sampai data tersimpan tanpa nomor
                    return { galat: "Aturan penomoran ini tidak menghasilkan nomor. Periksa aturannya di Pengaturan, Penomoran, atau matikan Otomatis dan ketik nomor sendiri.",
                             kolomFokus: p.pilihan };
                }
                return { nomor: nomor, aturanId: aturanId, otomatis: true };
            }
            var diketik = p.kolom.value.trim();
            if (diketik === "") { return { galat: "Nomor wajib diisi.", kolomFokus: p.kolom }; }
            return { nomor: diketik, aturanId: "", otomatis: false };
        },
        pakai: function (info, tanggal) {
            return info.otomatis ? (nomorBerikutnya(info.aturanId, tanggal) || info.nomor) : info.nomor;
        },
        // Kolom yang difokuskan kalau nomor ternyata sudah dipakai data lain
        kolomNomorKembar: function () { return p.saklar.checked ? p.pilihan : p.kolom; }
    };
}
