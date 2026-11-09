// ==================== Bilah atas: pilihan pembukuan ====================
// Berisi: tombol pilihan pembukuan di bilah atas (Yayasan, Sekolah, Unit usaha) beserta daftarnya.
// HTML-nya ada di umum/tampilan-kerangka.js. Dimuat paling akhir oleh index.html.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var tombolPembukuan = document.getElementById("tombol-pembukuan");
var daftarPembukuan = document.getElementById("daftar-pembukuan");
var namaPembukuan = document.getElementById("nama-pembukuan");

// Buka atau tutup daftar. aria-expanded memberi tahu pembaca layar statusnya.
function aturDaftarPembukuan(buka) {
    daftarPembukuan.hidden = !buka;
    tombolPembukuan.setAttribute("aria-expanded", buka ? "true" : "false");
}

// Klik tombol -> daftar dibuka kalau sedang tertutup, dan sebaliknya
tombolPembukuan.addEventListener("click", function () {
    aturDaftarPembukuan(daftarPembukuan.hidden);
});

// Klik salah satu pilihan -> nama di tombol berganti, tanda aktif pindah, daftar menutup
document.querySelectorAll(".pembukuan-pilihan").forEach(function (pilihan) {
    pilihan.addEventListener("click", function () {
        namaPembukuan.textContent = pilihan.dataset.nama;
        tampilkanNotifikasi("Pembukuan aktif: " + pilihan.dataset.nama);
        document.querySelectorAll(".pembukuan-pilihan").forEach(function (p) {
            p.classList.toggle("aktif", p === pilihan);
        });
        aturDaftarPembukuan(false);
    });
});

// Klik di mana saja di luar pilihan pembukuan -> daftar menutup
// (closest hanya ada pada elemen; pengaman ini mencegah galat kalau yang diklik bukan elemen)
document.addEventListener("click", function (kejadian) {
    var sasaran = kejadian.target;
    if (!(sasaran && sasaran.closest && sasaran.closest(".pembukuan"))) {
        aturDaftarPembukuan(false);
    }
});

// Tombol Esc -> daftar menutup
document.addEventListener("keydown", function (kejadian) {
    if (kejadian.key === "Escape") {
        aturDaftarPembukuan(false);
    }
});
