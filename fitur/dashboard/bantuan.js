// ==================== Petunjuk Penggunaan: Dashboard ====================
// Teks untuk tombol lampu (PRD 6.16; komponen umum/bantuan.js). Ditulis dari fitur/dashboard/tampilan.js dan dashboard.js
// (WIDGET_DASHBOARD). KALAU WIDGET ATAU TOMBOLNYA BERUBAH, TEKS INI IKUT DIPERBARUI. Bahasa sederhana, tanpa data asli.

daftarkanBantuan("dashboard", {
    judul: "Dashboard",
    tempat: ".dash-atas",   // lampu di baris atas Dashboard, sesudah tombol + Widget
    topik: [
        {
            judul: "Tentang Dashboard",
            isi: [
                "**Dashboard** adalah halaman pertama sesudah masuk. Isinya ringkasan keuangan yayasan dalam bentuk kartu angka dan grafik kecil " +
                "(**widget**), semuanya dihitung langsung dari data yang sudah dicatat.",
                "Dashboard tidak bisa mengubah data; untuk mencatat transaksi, pakai menu di samping kiri. Dashboard selalu bisa dibuka oleh " +
                "semua pengguna, termasuk Operator tanpa Akses Grup."
            ]
        },
        {
            judul: "Bagian Atas",
            isi: [
                {
                    tabel: {
                        kolom: ["Bagian", "Penjelasan"],
                        baris: [
                            ["Salam", "Sapaan sesuai waktu (pagi, siang, sore, malam) dengan nama pengguna yang sedang masuk."],
                            ["Pilihan bulan (‹ Bulan Tahun ›)", "Mengganti bulan yang dilihat. Berlaku untuk widget bulanan (kartu ringkasan, Donasi dan Pengeluaran, Beban Terbesar, Anggaran Bulan Ini)."],
                            ["+ Widget", "Membuka jendela **Atur Widget** untuk memilih widget yang tampil dan urutannya."],
                            ["Lampu jingga", "Membuka petunjuk ini."]
                        ]
                    }
                }
            ]
        },
        {
            judul: "Kartu Ringkasan",
            isi: [
                "Empat kartu besar di baris pertama, untuk bulan yang dipilih:",
                {
                    tabel: {
                        kolom: ["Kartu", "Arti"],
                        baris: [
                            ["Kas dan Bank", "Jumlah saldo semua akun Kas dan Bank sampai akhir bulan, dengan jumlah rekeningnya."],
                            ["Donasi bulan ini", "Total donasi yang diterima bulan itu, dibanding bulan sebelumnya (▲ naik atau ▼ turun dalam persen). Kalau bulan sebelumnya kosong, tertulis \"Belum ada pembanding\"."],
                            ["Pengeluaran bulan ini", "Total pengeluaran bulan itu, dibanding bulan sebelumnya."],
                            ["Selisih bulan ini", "Donasi bulan itu dikurangi pengeluaran bulan itu: **Surplus** kalau donasi lebih besar, **Defisit** kalau lebih kecil, **Seimbang** kalau sama."]
                        ]
                    }
                }
            ]
        },
        {
            judul: "Daftar Widget",
            isi: [
                "Widget yang tampil sejak awal:",
                {
                    poin: [
                        "**Donasi dan Pengeluaran**: lingkaran perbandingan bulan ini dengan bulan lalu.",
                        "**Arus Kas**: uang masuk dan keluar 7 hari terakhir.",
                        "**Tren Donasi**: garis donasi 30 hari terakhir.",
                        "**Aktivitas Terakhir**: kegiatan terakhir dari Log Aktivitas.",
                        "**Beban Terbesar**: akun beban terbesar bulan ini.",
                        "**Program Terbaik Tahun Ini**: peringkat donasi per Program.",
                        "**Perlu Perhatian**: hal yang perlu ditindak hari ini, misalnya anggaran yang terlewati atau target yang hampir berakhir.",
                        "**Anggaran Bulan Ini**: pemakaian anggaran dalam persen.",
                        "**Target Donasi**: capaian target yang sedang berjalan."
                    ]
                },
                "Widget tambahan yang bisa dinyalakan lewat **+ Widget**: Saldo per Rekening, Donasi dan Pengeluaran Tahun Ini, Komposisi Dana, " +
                "Donasi per Kategori, Donatur Terbesar, Donasi Terbaru, Sisa Dana per Program, dan Aset Tetap."
            ]
        },
        {
            judul: "Memakai Widget",
            isi: [
                {
                    poin: [
                        "Klik **judul widget** untuk membuka laporan atau halaman lengkapnya (misalnya judul Arus Kas membuka laporan Arus Kas).",
                        "Tombol **↻** (segarkan) di pojok widget menghitung ulang isinya.",
                        "Tombol **×** di pojok widget menyembunyikan widget itu. Tampilkan lagi lewat **+ Widget**."
                    ]
                }
            ]
        },
        {
            judul: "Mengatur Widget",
            isi: [
                {
                    langkah: [
                        "Klik tombol **+ Widget** di kanan atas Dashboard.",
                        "Centang widget yang ingin ditampilkan, hapus centang yang tidak perlu.",
                        "Pakai tombol **panah** untuk mengatur urutan widget.",
                        "Klik **Selesai**. Klik **Kembalikan ke Bawaan** kalau ingin kembali ke susunan awal."
                    ]
                },
                { catatan: "Susunan widget tersimpan di browser ini saja, jadi setiap komputer atau browser bisa punya susunan sendiri." }
            ]
        },
        {
            judul: "Hal Penting",
            isi: [
                {
                    poin: [
                        "Dashboard menghitung **semua** data (tidak dibatasi hak Lihat di Akses Grup), sama seperti laporan.",
                        "Kalau masih kosong (misalnya \"Belum ada donasi bulan ini\"), berarti belum ada transaksi pada periode itu. Untuk mencoba, " +
                        "Administrator bisa mengisi data rekaan lewat Pengaturan → Cadangan Data → Isi Data Contoh pada aplikasi yang masih kosong.",
                        "Angka Dashboard mengikuti data di browser komputer ini."
                    ]
                }
            ]
        }
    ]
});
