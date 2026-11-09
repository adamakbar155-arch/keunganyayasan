// ==================== Pemasang tampilan fitur ====================
// Tiap fitur menyimpan HTML-nya sendiri di fitur/<nama>/tampilan.js. index.html hanya berisi penanda tempat:
//     <template data-tempat="jurnal-isi"></template>
// File tampilan.js memanggil pasangTampilan("jurnal-isi", `...HTML...`), lalu penanda itu diganti dengan HTML tersebut.
// Dengan begitu urutan HTML di halaman tetap sama seperti sebelum dipecah (ini penting: beberapa kode memakai
// elemen pertama yang cocok, misalnya document.querySelector(".jurnal-cari")).
//
// File ini dimuat PALING AWAL, lalu semua tampilan.js, baru sesudah itu skrip logika (umum/inti.js dan seterusnya),
// karena logika mencari elemen halaman saat dimuat.
//
// Kenapa tidak memuat file .html terpisah? Browser menolak membaca file lain saat index.html dibuka langsung
// dari komputer (file://). Teks HTML di dalam file .js tetap boleh. Nanti di tahap server (PHP), tampilan.js
// bisa diganti menjadi tampilan.php yang di-include, tanpa mengubah logika.
function pasangTampilan(tempat, html) {
    var penanda = document.querySelector('template[data-tempat="' + tempat + '"]');
    if (!penanda) {
        // Penanda hilang = salah ketik nama atau index.html belum diperbarui. Diberi tahu di Console (F12).
        console.error("pasangTampilan: penanda tempat \"" + tempat + "\" tidak ada di index.html.");
        return;
    }
    penanda.insertAdjacentHTML("beforebegin", html);   // HTML tetap milik aplikasi (bukan isian pengguna)
    penanda.remove();
}
