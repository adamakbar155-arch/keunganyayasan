// Dimuat lebih dulu oleh cek.ps1 (node -r) untuk uji Chrome. Uji-uji lama menunggu halaman dengan waktu tetap (800 ms, 1300 ms),
// padahal saat komputer sibuk halaman bisa butuh 2 sampai 3 detik (diukur 2026-11-06), sehingga uji gagal dengan
// "... is not defined" walaupun aplikasinya benar. Di sini hanya tunggu panjang (800 ms ke atas) yang dikalikan 3;
// tunggu pendek setelah klik tetap, supaya lama pemeriksaan tidak bertambah banyak.
const setTimeoutAsli = global.setTimeout;
global.setTimeout = (fungsi, ms, ...sisa) => setTimeoutAsli(fungsi, ms >= 800 ? ms * 3 : ms, ...sisa);
