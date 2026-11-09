Pengguna adalah pemula yang ingin belajar.
Pakai bahasa Indonesia yang sederhana.
Kerjakan satu langkah kecil per giliran dan tunggu persetujuan.
Beri komentar di kode dan jelaskan alasan tiap perubahan.
Jangan ubah banyak file sekaligus.
Aturan kerja proyek:
- Di awal sesi, baca CLAUDE.md dan PLAN.md, lalu sebutkan posisi kita sekarang (tahap dan tugas).
- Kerjakan satu tahap pada satu waktu, dan satu tugas kecil pada satu waktu.
- Jangan mengerjakan hal di luar PLAN.md. Kalau menemukan hal baru (bug, ide, detail yang kurang), catat di bagian "Temuan" di PLAN.md dan tanyakan dulu.
- Setelah setiap tugas: jelaskan apa yang berubah, beri langkah tes manual yang bisa saya ikuti, lalu centang tugasnya di PLAN.md setelah saya konfirmasi berhasil.
- Jangan lanjut ke tahap berikutnya sebelum saya mengetik "lanjut".
- Tugas ditandai [KAMU] (saya yang mengetik, kamu memandu) atau [CLAUDE] (kamu yang mengerjakan dan menjelaskan). Bagian inti yang ingin saya kuasai ditandai [KAMU].
- Semua teks di aplikasi memakai bahasa Indonesia sederhana. Jangan simpan password atau data asli di kode.
Alur kerja setiap fitur (keputusan 2026-10-25). Sistem aplikasi disamakan dengan Accurate:
1. Foto: saya mengirim foto layar Accurate untuk fitur itu. Jangan merancang tampilan fitur dari tebakan; kalau foto belum ada, minta dulu.
2. Bahas: logika dan alur dibahas dengan pertanyaan berpilihan, lalu ditulis di PRD.md dan saya setujui.
3. Rencana: tugas ditulis di PLAN.md.
4. Kode: disusun rapi memakai alat bersama di umum/ (lihat README.md). Sebelum menulis fungsi baru, cari dulu apakah sudah ada yang serupa; kalau ada, pakai atau satukan, jangan ditulis dua kali.
5. Periksa: pemeriksaan keamanan (di bawah) dan pemeriksaan kode ganda/tumpang tindih (fungsi atau aturan yang sama ditulis di dua tempat, nama global ganda, CSS mati), lalu langkah tes manual untuk saya.
Pemeriksaan keamanan otomatis (keputusan 2026-10-25):
- Setiap tugas yang menambah atau mengubah fitur, sebelum melapor selesai, jalankan pemeriksaan ringan:
  1. Tinjau keamanan file yang berubah saja memakai skill security-audit dalam mode panduan (bukan audit penuh, tanpa membuat folder laporan). Yang dicek terutama: isian pengguna tampil lewat textContent, data rusak di localStorage tidak membuat macet, ekspor (CSV/cetak) aman, file/lampiran dibatasi jenis dan ukurannya, tidak ada password atau data asli di kode.
  2. Jalankan ESLint, semua uji otomatis, uji data rusak, dan perbandingan tangkapan layar.
  3. Laporkan hasilnya singkat di bagian "Pemeriksaan keamanan" pada laporan tugas. Celah yang ditemukan dicatat di "Temuan" PLAN.md dan ditanyakan dulu sebelum diperbaiki (kecuali celah itu ada di kode yang baru saja dibuat pada tugas yang sama).
- Audit penuh (skill security-audit, 6 tahap) dijalankan di akhir setiap tahap, setelah semua tugas tahap itu dibuat dan sebelum saya mengetik "lanjut". Tanyakan dulu sebelum menjalankannya karena memakai banyak agen.
