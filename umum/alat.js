// ==================== Alat bantu umum ====================
// Fungsi kecil yang dipakai banyak fitur, supaya caranya sama di mana-mana dan cukup diperbaiki di satu tempat:
//   buatId(awalan)                       -> id unik untuk data baru
//   isiPilihan(select, daftar, pengaturan) -> mengisi kotak pilihan <select>
//   teksAman(nilai)                      -> nilai apa pun menjadi teks (null/undefined menjadi "")
// Dimuat sesudah umum/inti.js dan sebelum file lain yang memakainya.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- Id unik ----------
// Awalan menandai jenis datanya (misalnya "j" jurnal, "k" karyawan), lalu waktu sekarang dan beberapa huruf acak.
// Bagian acak mencegah dua data yang dibuat pada milidetik yang sama mendapat id kembar.
// Contoh: buatId("j") -> "j1792745868738x4f2"
function buatId(awalan) {
    return awalan + Date.now() + Math.random().toString(36).slice(2, 6);
}

// ---------- Teks aman ----------
// Data dari penyimpanan bisa saja rusak (misalnya nama kosong atau berupa angka). Fungsi ini memastikan hasilnya teks,
// supaya .toLowerCase(), .indexOf(), dan sejenisnya tidak membuat halaman macet.
function teksAman(nilai) {
    return (nilai === null || nilai === undefined) ? "" : String(nilai);
}

// ---------- Membaca daftar tersimpan langsung dari penyimpanan ----------
// Untuk membaca data halaman lain yang file-nya dimuat BELAKANGAN (modulnya belum ada saat file ini berjalan),
// misalnya Akun membaca Jurnal, atau Pencatatan Gaji membaca Pembayaran. Hasilnya selalu daftar berisi objek saja;
// data yang rusak atau belum ada menghasilkan daftar kosong.
function bacaDaftarTersimpan(kunci) {
    try {
        var teks = localStorage.getItem(kunci);
        var data = teks ? JSON.parse(teks) : [];
        if (Array.isArray(data)) { return data.filter(function (x) { return x !== null && typeof x === "object"; }); }
    } catch (galat) { /* anggap belum ada data */ }
    return [];
}

// ---------- Mengunduh teks sebagai file ----------
// Dipakai unduh CSV (daftar, Histori Bank) dan file Cadangan Data. tipe: misalnya "text/csv;charset=utf-8".
// Alamat sementara dibersihkan beberapa detik kemudian (kalau langsung, unduhan bisa batal).
// Mengembalikan true kalau unduhan berhasil dimulai.
function unduhTeks(namaBerkas, isi, tipe) {
    try {
        var tautan = document.createElement("a");
        tautan.href = URL.createObjectURL(new Blob([isi], { type: tipe }));
        tautan.download = namaBerkas;
        document.body.appendChild(tautan);
        tautan.click();
        tautan.remove();
        setTimeout(function () { URL.revokeObjectURL(tautan.href); }, 4000);
        return true;
    } catch (galat) {
        return false;
    }
}

// ---------- Rincian (baris) transaksi yang aman ----------
// Jurnal, Pencatatan Gaji, dan Pembayaran menyimpan barisnya di "rincian". Kalau data tersimpan rusak
// (rincian bukan daftar, atau ada baris kosong/null), fungsi ini mengembalikan daftar berisi objek saja.
function rincianAman(data) {
    if (!data || !Array.isArray(data.rincian)) { return []; }
    return data.rincian.filter(function (r) { return r !== null && typeof r === "object"; });
}

// ---------- Saldo akhir hari terendah mulai tanggal tertentu ----------
// Satu cara hitung untuk dua pengaman: Kas/Bank minus (PRD 5.6) dan sisa dana yang bisa dipindah (PRD 6.1, Temuan 28).
//   perHari : { "YYYY-MM-DD": perubahan saldo pada hari itu } (buat dengan Object.create(null) supaya tanggal rusak
//             seperti "constructor" tetap jadi kunci biasa)
//   awal    : saldo sebelum semua tanggal itu (misalnya saldo awal akun; sisa dana mulai dari 0)
//   mulai   : "YYYY-MM-DD"; kosong = saldo akhir semua hari
// Hasil { saldo, tanggal }: saldo AKHIR HARI terendah mulai tanggal itu sampai hari terakhir, dan tanggal terjadinya.
// Kalau tidak ada perubahan sesudah tanggal mulai, hasilnya saldo akhir hari tanggal mulai itu sendiri.
function saldoTerendahSejak(perHari, awal, mulai) {
    var saldo = Number(awal) || 0;
    var hasil = null;
    Object.keys(perHari).sort().forEach(function (t) {
        // Hari pertama sesudah tanggal mulai: saldo saat ini = saldo akhir hari tanggal mulai, jadi titik awal pembanding
        if (mulai && t > mulai && hasil === null) { hasil = { saldo: saldo, tanggal: mulai }; }
        saldo += Number(perHari[t]) || 0;
        if (hasil !== null && saldo < hasil.saldo) { hasil = { saldo: saldo, tanggal: t }; }
    });
    return hasil || { saldo: saldo, tanggal: mulai };
}

// ---------- Mengisi kotak pilihan <select> ----------
//   select     : elemen <select> yang diisi
//   daftar     : data pilihan, misalnya daftar akun atau divisi
//   pengaturan :
//     nilai(butir)        -> nilai pilihan (bawaan: butir.id)
//     teks(butir)         -> tulisan pilihan (bawaan: butir.nama)
//     kosong              -> tulisan pilihan pertama yang bernilai "" (misalnya "Pilih divisi..."); tanpa ini tidak ada
//     kosongKalauTakAda   -> tulisan pilihan pertama kalau daftar kosong (misalnya "Belum ada akun"); bawaan = kosong
//     terpilih            -> nilai yang dipilih; kalau tidak ada di daftar, yang terpilih pilihan pertama ("")
//     nonaktifKalauKosong -> true: kotak pilihan dinonaktifkan kalau daftar kosong
//     petunjuk            -> elemen petunjuk yang hanya tampil kalau daftar kosong (misalnya "Buat dulu di ...")
// Mengembalikan jumlah pilihan dari daftar (tanpa pilihan kosong).
function isiPilihan(select, daftar, pengaturan) {
    var p = pengaturan || {};
    var ambilNilai = p.nilai || function (b) { return b.id; };
    var ambilTeks = p.teks || function (b) { return b.nama; };
    var adaIsi = daftar.length > 0;
    select.textContent = "";
    var tulisanKosong = (!adaIsi && p.kosongKalauTakAda) ? p.kosongKalauTakAda : p.kosong;
    if (tulisanKosong !== undefined) {
        var kosong = document.createElement("option");
        kosong.value = "";
        kosong.textContent = tulisanKosong;
        select.appendChild(kosong);
    }
    var nilaiAda = [];
    daftar.forEach(function (butir) {
        var o = document.createElement("option");
        o.value = teksAman(ambilNilai(butir));
        o.textContent = teksAman(ambilTeks(butir));   // textContent: aman dari kode HTML
        select.appendChild(o);
        nilaiAda.push(o.value);
    });
    var terpilih = teksAman(p.terpilih);
    if (nilaiAda.indexOf(terpilih) !== -1) {
        select.value = terpilih;
    } else if (select.options.length) {
        select.selectedIndex = 0;
    }
    if (p.nonaktifKalauKosong) { select.disabled = !adaIsi; }
    if (p.petunjuk) { p.petunjuk.hidden = adaIsi; }
    return daftar.length;
}

// ---------- Penanda pilihan (chip) ----------
// Label biru muda "[kode] Nama" dengan tombol × (gaya .chip-akun di umum/popup-dan-preferensi.css; PRD 5.1).
// Dipakai pemilih akun Preferensi dan kolom cari/pilih satu pilihan (buatChipPilihan, umum/komponen-transaksi.js).
//   teks       : tulisan label (ditulis lewat textContent, aman dari kode HTML)
//   labelHapus : keterangan tombol × untuk pembaca layar, misalnya "Hapus akun 110101"
//   saatHapus  : fungsi yang dijalankan saat × diklik
function buatChip(teks, labelHapus, saatHapus) {
    var chip = document.createElement("span");
    chip.className = "chip-akun";
    var tulisan = document.createElement("span");
    tulisan.className = "chip-teks";
    tulisan.textContent = teks;
    var hapus = document.createElement("button");
    hapus.type = "button";
    hapus.className = "chip-hapus";
    hapus.setAttribute("aria-label", labelHapus);
    hapus.textContent = "×";   // tanda ×
    hapus.addEventListener("click", saatHapus);
    chip.appendChild(tulisan);
    chip.appendChild(hapus);
    return chip;
}

// ---------- Saran isian "pilih atau ketik baru" (<datalist>) ----------
// Mengisi <datalist> dengan nilai yang sudah pernah dipakai (tanpa kembar dan tanpa yang kosong, urut abjad),
// misalnya Kelompok di Kategori Donasi atau Kategori di Donatur. Pengguna tetap bisa mengetik nilai baru.
//   datalist : elemen <datalist> yang diisi
//   daftar   : data tersimpan, misalnya daftar Kategori Donasi
//   ambil    : function (butir) -> nilai yang disarankan, misalnya butir.kelompok
function isiSaranDatalist(datalist, daftar, ambil) {
    var nilai = [];
    daftar.forEach(function (butir) {
        var n = teksAman(ambil(butir)).trim();
        if (n && nilai.indexOf(n) === -1) { nilai.push(n); }
    });
    nilai.sort(function (a, b) { return a.localeCompare(b, "id"); });
    datalist.textContent = "";
    nilai.forEach(function (n) {
        var opsi = document.createElement("option");
        opsi.value = n;   // value: aman, tidak ditafsirkan sebagai HTML
        datalist.appendChild(opsi);
    });
}
