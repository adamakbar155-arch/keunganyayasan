// ==================== Tampilan: Aset Tetap ====================
// Popup menu Aset Tetap dan halaman Aset Tetap (PRD 6.6): satu halaman tanpa tab samping, disederhanakan dari foto Accurate.
// Daftar (tombol hijau) dibuat otomatis oleh buatModulDaftar. Logikanya: fitur/aset-tetap/aset-tetap.js.

pasangTampilan("panel-aset", /*html*/ `
    <!-- ===== Popup Aset Tetap (ikon Aset Tetap di menu samping). Warna: biru = data, hijau = transaksi. ===== -->
    <dialog id="panel-aset" class="panel-pengaturan" aria-labelledby="judul-aset">
        <div class="panel-isi">
            <header class="panel-kepala">
                <h2 id="judul-aset">Aset Tetap</h2>
                <button type="button" id="tutup-aset" class="tombol-ikon" aria-label="Tutup">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
            </header>
            <div class="kotak-pengaturan">
                <a href="#" class="kotak-menu" data-halaman="Aset Tetap">
                    <span class="kotak-ikon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V5l8-2v18M13 9l6 2v10"/><path d="M8 8h2M8 12h2M8 16h2"/></svg>
                    </span>
                    <span class="kotak-label-menu">Aset Tetap</span>
                </a>
                <a href="#" class="kotak-menu" data-halaman="Kategori Aset">
                    <span class="kotak-ikon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/></svg>
                    </span>
                    <span class="kotak-label-menu">Kategori Aset</span>
                </a>
                <a href="#" class="kotak-menu kotak-hijau" data-halaman="Proses Penyusutan">
                    <span class="kotak-ikon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5l6 6 4-3 6 8"/><path d="M20 11v5h-5"/><path d="M4 20h16"/></svg>
                    </span>
                    <span class="kotak-label-menu">Proses Penyusutan</span>
                </a>
                <a href="#" class="kotak-menu kotak-hijau" data-halaman="Lepas Aset">
                    <span class="kotak-ikon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V9l6-4v16M10 11l6 2v8"/><path d="M15 6h6M18 3l3 3-3 3"/></svg>
                    </span>
                    <span class="kotak-label-menu">Lepas Aset</span>
                </a>
            </div>
        </div>
    </dialog>
`);

pasangTampilan("tab-aset-tetap", /*html*/ `
                <div class="tab" id="tab-aset-tetap" hidden>
                    <button type="button" class="tab-judul" data-tab="aset-tetap">Aset Tetap</button>
                    <button type="button" class="tab-tutup" data-tutup="aset-tetap" aria-label="Tutup tab Aset Tetap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-aset-tetap", /*html*/ `
            <!-- ===== Isi tab Aset Tetap: data aset untuk menghitung penyusutan, tidak mencatat uang (PRD 6.6) ===== -->
            <section id="isi-aset-tetap" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-aset-tetap" class="jurnal-form" novalidate>
                            <div class="aset-kepala">
                                <div class="baris-form"><label for="aset-nama">Nama <span class="wajib" aria-hidden="true">*</span></label><input id="aset-nama" type="text" maxlength="120" autocomplete="off" aria-required="true"></div>
                                <div class="baris-form"><label for="aset-kode">Kode Aset</label><input id="aset-kode" type="text" readonly aria-describedby="petunjuk-aset-kode"></div>
                                <div class="baris-form"><label for="aset-tanggal-beli">Tanggal Beli <span class="wajib" aria-hidden="true">*</span></label><div class="grup-tanggal"><input id="aset-tanggal-beli" type="date" aria-required="true"></div></div>
                                <div class="baris-form"><label for="aset-tanggal-pakai">Tanggal Pakai <span class="wajib" aria-hidden="true">*</span></label><div class="grup-tanggal"><input id="aset-tanggal-pakai" type="date" aria-required="true"></div></div>
                            </div>

                            <p id="aset-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>

                            <div class="aset-kartu">
                                <h2 class="aset-judul">Informasi Aset</h2>
                                <div class="aset-dua">
                                    <div>
                                        <div class="baris-form"><label for="aset-kategori">Kategori Aset <span class="wajib" aria-hidden="true">*</span></label><select id="aset-kategori" aria-required="true"></select></div>
                                        <div class="baris-form">
                                            <label for="aset-nilai">Nilai Aset <span class="wajib" aria-hidden="true">*</span></label>
                                            <div class="detail-rupiah"><span aria-hidden="true">Rp</span><input id="aset-nilai" type="text" inputmode="numeric" autocomplete="off" placeholder="0" aria-required="true"></div>
                                        </div>
                                        <div class="baris-form baris-umur-aset"><label for="aset-umur">Umur Aset (tahun) <span class="wajib" aria-hidden="true">*</span></label><input id="aset-umur" type="number" min="1" max="100" step="1" aria-required="true"></div>
                                        <div class="baris-form">
                                            <label for="aset-nilai-sisa">Nilai Sisa</label>
                                            <div class="detail-rupiah"><span aria-hidden="true">Rp</span><input id="aset-nilai-sisa" type="text" inputmode="numeric" autocomplete="off" placeholder="0"></div>
                                        </div>
                                        <div class="baris-form">
                                            <span class="label-kelompok">Tidak disusutkan</span>
                                            <label class="aset-centang"><input id="aset-tidak-disusutkan" type="checkbox"> Ya (misalnya tanah)</label>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="baris-form"><label for="aset-lokasi">Lokasi</label><input id="aset-lokasi" type="text" maxlength="120" autocomplete="off"></div>
                                        <div class="baris-form"><label for="aset-catatan">Catatan</label><textarea id="aset-catatan" rows="3" placeholder="Nomor polisi, penanggung jawab..."></textarea></div>
                                        <div class="baris-form">
                                            <label for="aset-sudah">Sudah disusutkan</label>
                                            <div>
                                                <div class="detail-rupiah"><span aria-hidden="true">Rp</span><input id="aset-sudah" type="text" inputmode="numeric" autocomplete="off" placeholder="0"></div>
                                                <p class="petunjuk">Untuk aset lama: penyusutan sebelum memakai aplikasi ini.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p class="aset-info"><strong>Formulir ini tidak mencatat uang.</strong> Pembelian tetap dicatat sekali lewat Pembayaran atau Jurnal Umum ke akun aset. Di sini hanya data aset untuk menghitung penyusutan.</p>
                            </div>
                        </form>

                        <div class="jurnal-total aset-total" aria-live="polite">
                            <div class="jurnal-total-kotak"><span>Penyusutan per Bulan</span><strong id="aset-per-bulan">Rp 0</strong></div>
                            <div class="jurnal-total-kotak"><span>Nilai Aset</span><strong id="aset-total-nilai">Rp 0</strong></div>
                            <div class="jurnal-total-kotak"><span>Nilai Buku</span><strong id="aset-nilai-buku">Rp 0</strong></div>
                        </div>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-aset-tetap" class="tombol-simpan-besar" id="aset-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
