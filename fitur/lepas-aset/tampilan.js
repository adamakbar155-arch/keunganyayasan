// ==================== Tampilan: Aset Tetap: Lepas Aset ====================
// HTML halaman Lepas Aset (PRD 6.6): aset yang dijual, rusak, hilang, atau dihibahkan. Logikanya: fitur/lepas-aset/lepas-aset.js.
// Gaya: fitur/aset-tetap/aset-tetap.css.

pasangTampilan("tab-lepas-aset", /*html*/ `
                <div class="tab" id="tab-lepas-aset" hidden>
                    <button type="button" class="tab-judul" data-tab="lepas-aset">Lepas Aset</button>
                    <button type="button" class="tab-tutup" data-tutup="lepas-aset" aria-label="Tutup tab Lepas Aset">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-lepas-aset", /*html*/ `
            <section id="isi-lepas-aset" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-lepas-aset" class="jurnal-form" novalidate>
                            <p id="lepas-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>
                            <div class="aset-kartu">
                                <h2 class="aset-judul">Lepas Aset</h2>
                                <div class="aset-dua">
                                    <div>
                                        <div class="baris-form"><label for="lepas-aset">Aset <span class="wajib" aria-hidden="true">*</span></label><select id="lepas-aset" aria-required="true"></select></div>
                                        <div class="baris-form"><label for="lepas-tanggal">Tanggal <span class="wajib" aria-hidden="true">*</span></label><div class="grup-tanggal"><input id="lepas-tanggal" type="date" aria-required="true"></div></div>
                                        <div class="baris-form"><label for="lepas-alasan">Alasan <span class="wajib" aria-hidden="true">*</span></label><select id="lepas-alasan" class="pilih-filter" aria-required="true"></select></div>
                                        <div class="baris-form"><label for="lepas-catatan">Catatan</label><textarea id="lepas-catatan" rows="2"></textarea></div>
                                    </div>
                                    <div>
                                        <div class="baris-form lepas-jual">
                                            <label for="lepas-nilai">Nilai Jual <span class="wajib" aria-hidden="true">*</span></label>
                                            <div class="detail-rupiah"><span aria-hidden="true">Rp</span><input id="lepas-nilai" type="text" inputmode="numeric" autocomplete="off" placeholder="0"></div>
                                        </div>
                                        <div class="baris-form lepas-jual"><label for="lepas-kas">Kas/Bank <span class="wajib" aria-hidden="true">*</span></label><select id="lepas-kas"></select></div>
                                        <div class="baris-form"><label for="lepas-akun">Akun Untung/Rugi</label><select id="lepas-akun"></select></div>
                                    </div>
                                </div>
                                <p id="lepas-info" class="aset-info"></p>
                            </div>
                        </form>
                        <div class="jurnal-total aset-total" aria-live="polite">
                            <div class="jurnal-total-kotak"><span>Nilai Aset</span><strong id="lepas-total-nilai">Rp 0</strong></div>
                            <div class="jurnal-total-kotak"><span>Nilai Buku</span><strong id="lepas-buku">Rp 0</strong></div>
                            <div class="jurnal-total-kotak"><span id="lepas-judul-selisih">Untung/Rugi</span><strong id="lepas-selisih">Rp 0</strong></div>
                        </div>
                    </div>
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-lepas-aset" class="tombol-simpan-besar" id="lepas-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Batalkan" title="Batalkan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
