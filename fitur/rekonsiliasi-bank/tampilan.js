// ==================== Tampilan: Kas & Bank: Rekonsiliasi Bank ====================
// HTML halaman Rekonsiliasi Bank (dari foto Accurate, PRD 6.3): pilih Kas/Bank dan rentang tanggal, lalu dua kolom:
// kiri "Catatan Aplikasi" (kartu transaksi), kanan "Rekening Bank" (tombol "Ada di Rekening Koran" per kartu).
// Baris atas memakai gaya bersama halaman histori (kelas histori-alat di umum/histori.css, dan jurnal-form), jadi tidak ditulis ulang.
// Logikanya: fitur/rekonsiliasi-bank/rekonsiliasi-bank.js. Gaya tambahan: fitur/rekonsiliasi-bank/rekonsiliasi-bank.css.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-rekonsiliasi-bank", /*html*/ `
                <div class="tab" id="tab-rekonsiliasi-bank" hidden>
                    <button type="button" class="tab-judul" data-tab="rekonsiliasi-bank">Rekonsiliasi Bank</button>
                    <button type="button" class="tab-tutup" data-tutup="rekonsiliasi-bank" aria-label="Tutup tab Rekonsiliasi Bank">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-rekonsiliasi-bank", /*html*/ `
            <!-- ===== Isi tab Rekonsiliasi Bank: cocokkan transaksi aplikasi dengan rekening koran, seperti Accurate ===== -->
            <section id="isi-rekonsiliasi-bank" class="isi-tab" hidden>
                <!-- Atas: Kas/Bank, tanggal dari s/d sampai, segarkan (gaya bersama dari Histori Bank) -->
                <div class="histori-alat jurnal-form">
                    <select id="rekonsiliasi-kas" aria-label="Pilih Kas/Bank"></select>
                    <div class="grup-tanggal">
                        <input id="rekonsiliasi-dari" type="date" aria-label="Dari tanggal">
                    </div>
                    <span class="histori-sd">s/d</span>
                    <div class="grup-tanggal">
                        <input id="rekonsiliasi-sampai" type="date" aria-label="Sampai tanggal">
                    </div>
                    <button type="button" id="rekonsiliasi-segarkan" class="tombol tombol-garis" aria-label="Segarkan" title="Segarkan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>
                    </button>
                    <label class="rekon-tampil-cocok">
                        <input type="checkbox" id="rekonsiliasi-tampil-cocok"> Tampilkan yang sudah cocok
                    </label>
                </div>
                <p id="petunjuk-rekonsiliasi" class="petunjuk" hidden></p>

                <!-- Dua kotak judul terpisah seperti Accurate: garis atas merah muda (kiri) dan biru (kanan),
                     judul besar berikon, lalu bilah abu-abu. Kiri berisi saldo dan jumlah yang belum cocok. -->
                <div class="rekon-kepala">
                    <div class="rekon-kotak-judul rekon-kotak-kiri">
                        <h3 class="rekon-judul">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9 8h6"/></svg>
                            Catatan Aplikasi
                        </h3>
                        <div class="rekon-bilah">
                            <!-- Saldo per tanggal sampai, ditulis "Saldo Rp ..." seperti Accurate; tanggalnya ada di keterangan saat disorot -->
                            <span id="rekonsiliasi-saldo-baris" class="rekon-saldo">Saldo <strong id="rekonsiliasi-saldo">Rp 0</strong></span>
                            <span id="rekonsiliasi-belum" class="rekon-belum"></span>
                        </div>
                    </div>
                    <div class="rekon-kotak-judul rekon-kotak-kanan">
                        <h3 class="rekon-judul">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>
                            Rekening Bank
                        </h3>
                        <div class="rekon-bilah"></div>
                    </div>
                </div>
                <!-- Baris kartu digambar oleh JavaScript (rekonsiliasi-bank.js) -->
                <div id="rekonsiliasi-daftar" class="rekon-daftar"></div>
                <!-- Tidak ada data yang perlu dicocokkan (dari foto Accurate): gambar map + kaca pembesar dan tulisan -->
                <div id="rekonsiliasi-kosong" class="rekon-kosong" hidden>
                    <svg viewBox="0 0 120 110" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M30 40V14a6 6 0 0 1 6-6h34l14 14v18" stroke-dasharray="7 6"/>
                        <path d="M10 46h28l8 8h56l-10 44H20z"/>
                        <circle class="rekon-kaca" cx="66" cy="66" r="18"/>
                        <path d="M79 79l14 14" stroke-width="7"/>
                        <path d="M60 61a6 6 0 1 1 8 5.6c-1.4.6-2 1.6-2 3V71"/>
                        <circle cx="66" cy="77" r="0.8" fill="currentColor"/>
                    </svg>
                    <p>Tidak ada data mutasi kas/bank yang tersedia</p>
                </div>
            </section>
`);
