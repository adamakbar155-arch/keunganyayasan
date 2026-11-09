// ==================== Tampilan: Kas & Bank: Transfer Bank ====================
// HTML halaman Transfer Bank (dari foto Accurate, PRD 6.3): Tanggal dan Nomor di atas; tab Transfer Uang (Dari Kas/Bank,
// Ke Kas/Bank, Nilai Transfer) dan tab Info lainnya (Catatan). Memakai kelas Jurnal Umum (jurnal-*) supaya rupanya seragam.
// Logikanya: fitur/transfer/transfer.js. Gaya tambahan: fitur/transfer/transfer.css.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-transfer", /*html*/ `
                <div class="tab" id="tab-transfer" hidden>
                    <button type="button" class="tab-judul" data-tab="transfer">Transfer Bank</button>
                    <button type="button" class="tab-tutup" data-tutup="transfer" aria-label="Tutup tab Transfer Bank">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-transfer", /*html*/ `
            <!-- ===== Isi tab Transfer Bank (memindah uang antar Kas/Bank milik yayasan sendiri), mirip Accurate.
                 Tombol hijau, tab "Data Baru", dan Daftar dibuat otomatis oleh buatModulDaftar. ===== -->
            <section id="isi-transfer" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-transfer" class="jurnal-form" novalidate>

                            <!-- Bagian atas kiri: tanggal; kanan: nomor -->
                            <div class="jurnal-kepala pgaji-kepala">
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="transfer-tanggal">Tanggal <span class="wajib" aria-hidden="true">*</span></label>
                                        <div class="grup-tanggal">
                                            <input id="transfer-tanggal" type="date" aria-required="true">
                                        </div>
                                    </div>
                                </div>
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="transfer-aturan-nomor">Nomor # <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <!-- Otomatis: aturan penomoran bertipe Transfer (Pengaturan, Penomoran). Dimatikan: diketik sendiri. -->
                                            <div class="jurnal-nomor">
                                                <label class="saklar" title="Nomor dibuat otomatis"><input type="checkbox" id="transfer-nomor-otomatis" checked aria-label="Nomor otomatis"> <span>Otomatis</span></label>
                                                <select id="transfer-aturan-nomor" aria-label="Aturan penomoran"></select>
                                                <input id="transfer-nomor" type="text" hidden placeholder="Ketik nomor" autocomplete="off">
                                            </div>
                                            <p id="transfer-contoh-nomor" class="petunjuk jurnal-contoh-nomor"></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p id="transfer-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>

                            <!-- Badan: tab samping (Transfer Uang, Info lainnya) dan isinya -->
                            <div class="jurnal-badan">
                                <div class="jurnal-tab-samping" role="tablist" aria-label="Bagian transfer bank">
                                    <button type="button" class="jurnal-tab-ikon aktif" role="tab" aria-selected="true" aria-controls="transfer-panel-uang" data-transfer-tab="uang" title="Transfer Uang" aria-label="Transfer Uang">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                                    </button>
                                    <button type="button" class="jurnal-tab-ikon" role="tab" aria-selected="false" aria-controls="transfer-panel-info" data-transfer-tab="info" title="Info lainnya" aria-label="Info lainnya">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>
                                    </button>
                                </div>

                                <div class="jurnal-isi">
                                    <!-- Panel Transfer Uang: dari, ke, nilai -->
                                    <div id="transfer-panel-uang" class="jurnal-panel" role="tabpanel">
                                        <h2 class="transfer-judul">Transfer Uang</h2>
                                        <div class="transfer-isian">
                                            <div class="baris-form">
                                                <label for="transfer-dari">Dari Kas/Bank <span class="wajib" aria-hidden="true">*</span></label>
                                                <select id="transfer-dari" aria-required="true"></select>
                                            </div>
                                            <div class="baris-form">
                                                <label for="transfer-ke">Ke Kas/Bank <span class="wajib" aria-hidden="true">*</span></label>
                                                <select id="transfer-ke" aria-required="true"></select>
                                            </div>
                                            <div class="baris-form">
                                                <label for="transfer-nilai">Nilai Transfer <span class="wajib" aria-hidden="true">*</span></label>
                                                <div class="detail-rupiah transfer-nilai">
                                                    <span aria-hidden="true">Rp</span>
                                                    <input id="transfer-nilai" type="text" inputmode="numeric" autocomplete="off" placeholder="0" aria-required="true">
                                                </div>
                                            </div>
                                        </div>
                                        <p id="petunjuk-transfer-kas" class="petunjuk" hidden>Belum ada akun Kas &amp; Bank tingkat 3 (sub dari sub akun, misalnya Kas &amp; Bank &gt; Kas Kecil &gt; Kas Kecil Masjid). Buat dulu di Buku Besar, Akun Perkiraan.</p>
                                    </div>

                                    <!-- Panel Info lainnya: catatan -->
                                    <div id="transfer-panel-info" class="jurnal-panel" role="tabpanel" hidden>
                                        <h3 class="fitur-grup">Info lainnya</h3>
                                        <div class="baris-form">
                                            <label for="transfer-catatan">Catatan</label>
                                            <textarea id="transfer-catatan" rows="3"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <!-- Total = nilai transfer -->
                        <div class="jurnal-total" aria-live="polite">
                            <div class="jurnal-total-kotak">
                                <span>Total</span>
                                <strong id="transfer-total">Rp 0</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Tombol di kanan: simpan, cetak, lampiran, hapus (saat mengubah) -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-transfer" class="tombol-simpan-besar" id="transfer-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-aksi-samping tombol-aksi-biru" data-cetak-bukti="Transfer Bank" aria-label="Cetak" title="Cetak">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                            <svg class="panah" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <!-- Lampiran (alat bersama umum/lampiran.js). Angka kecil = jumlah lampiran. -->
                        <button type="button" id="transfer-tombol-lampiran" class="tombol-aksi-samping tombol-aksi-biru" aria-label="Lampiran" title="Lampiran">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>
                            <span id="transfer-lencana-lampiran" class="lencana-aksi" hidden>0</span>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
