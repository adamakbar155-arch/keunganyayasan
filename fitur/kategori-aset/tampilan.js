// ==================== Tampilan: Aset Tetap: Kategori Aset ====================
// HTML halaman Kategori Aset (PRD 6.6). Foto Accurate hanya berisi Nama; akun dan umur ditaruh di sini supaya formulir aset
// cukup memilih kategori. Logikanya: fitur/kategori-aset/kategori-aset.js. Gaya: fitur/aset-tetap/aset-tetap.css.

pasangTampilan("tab-kategori-aset", /*html*/ `
                <div class="tab" id="tab-kategori-aset" hidden>
                    <button type="button" class="tab-judul" data-tab="kategori-aset">Kategori Aset</button>
                    <button type="button" class="tab-tutup" data-tutup="kategori-aset" aria-label="Tutup tab Kategori Aset">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-kategori-aset", /*html*/ `
            <section id="isi-kategori-aset" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-kategori-aset" class="jurnal-form" novalidate>
                            <p id="kat-aset-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>
                            <div class="aset-kartu">
                                <h2 class="aset-judul">Info Umum</h2>
                                <div class="baris-form"><label for="kat-aset-nama">Nama <span class="wajib" aria-hidden="true">*</span></label><input id="kat-aset-nama" type="text" maxlength="80" autocomplete="off" aria-required="true"></div>
                                <div class="baris-form">
                                    <span class="label-kelompok">Tidak disusutkan</span>
                                    <label class="aset-centang"><input id="kat-aset-tidak" type="checkbox"> Ya (misalnya tanah)</label>
                                </div>
                                <div class="baris-form"><label for="kat-aset-akun">Akun Aset <span class="wajib" aria-hidden="true">*</span></label><select id="kat-aset-akun" aria-required="true"></select></div>
                                <div class="baris-form kat-aset-susut"><label for="kat-aset-akumulasi">Akun Akumulasi Penyusutan <span class="wajib" aria-hidden="true">*</span></label><select id="kat-aset-akumulasi"></select></div>
                                <div class="baris-form kat-aset-susut"><label for="kat-aset-beban">Akun Beban Penyusutan <span class="wajib" aria-hidden="true">*</span></label><select id="kat-aset-beban"></select></div>
                                <div class="baris-form kat-aset-susut"><label for="kat-aset-umur">Umur Aset (tahun) <span class="wajib" aria-hidden="true">*</span></label><input id="kat-aset-umur" type="number" min="1" max="100" step="1"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-kategori-aset" class="tombol-simpan-besar" id="kat-aset-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
