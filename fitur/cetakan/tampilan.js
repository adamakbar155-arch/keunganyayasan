// ==================== Tampilan: Desain Cetakan (daftar dan editor) ====================
// HTML halaman dan popup fitur ini. Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js)
// di tempat penanda <template data-tempat="...">. Logikanya ada di file .js lain di folder yang sama.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-cetakan", /*html*/ `
                <div class="tab" id="tab-cetakan" hidden>
                    <button type="button" class="tab-judul" data-tab="cetakan">Desain Cetakan</button>
                    <button type="button" class="tab-tutup" data-tutup="cetakan" aria-label="Tutup tab Desain Cetakan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-cetakan", /*html*/ `
            <!-- ===== Isi tab Desain Cetakan (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-cetakan" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <div class="sub-tab-baris">
                            <span class="sub-tab aktif">Informasi Umum</span>
                        </div>
                        <form id="form-cetakan" class="form-pref" novalidate>
                            <div class="sub-isi">
                                <div class="baris-form">
                                    <label for="ct-nama">Nama Desain <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="ct-nama" type="text" autocomplete="off" aria-required="true">
                                        <p id="galat-ct-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="ct-tipe">Tipe <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <select id="ct-tipe" aria-required="true"></select>
                                        <p id="galat-ct-tipe" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <p class="petunjuk">Setelah disimpan, ukuran kertas, margin, dan isi desain diatur lewat tombol Edit di daftar.</p>
                            </div>
                        </form>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-cetakan" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <!-- Tombol Edit Desain: membuka editor (hanya tampil saat mengubah desain yang sudah ada) -->
                        <button type="button" id="tombol-edit-cetakan" class="tombol-edit-besar" data-hanya-ubah hidden aria-label="Edit desain" title="Edit desain">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4l11-11-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>

                <!-- ===== Editor desain cetakan: halaman penuh yang menggantikan formulir dan daftar =====
                     Kertas di tengah (pratinjau langsung), panel pengaturan di kanan, seperti editor di Accurate. -->
                <div id="editor-cetakan" class="editor-cetakan" hidden>
                    <div class="editor-bar">
                        <button type="button" id="ec-tutup" class="tombol tombol-garis">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                            Tutup
                        </button>
                        <strong id="ec-judul">Desain Cetakan</strong>
                        <button type="button" id="ec-simpan" class="tombol tombol-utama">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                            Simpan
                        </button>
                    </div>

                    <div class="editor-badan">
                        <!-- Alat menambah elemen. Elemen baru muncul di dekat pojok kiri atas, langsung terpilih. -->
                        <div class="editor-alat" role="toolbar" aria-label="Tambah elemen">
                            <span class="editor-alat-label">Tambah:</span>
                            <button type="button" class="tombol tombol-garis" data-tambah="teks" title="Tambah teks">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>
                                Teks
                            </button>
                            <button type="button" class="tombol tombol-garis" data-tambah="garis" title="Tambah garis">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 12h16"/></svg>
                                Garis
                            </button>
                            <button type="button" class="tombol tombol-garis" data-tambah="kotak" title="Tambah kotak">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="1"/></svg>
                                Kotak
                            </button>
                            <button type="button" class="tombol tombol-garis" data-tambah="logo" title="Tambah logo">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>
                                Logo
                            </button>
                            <button type="button" class="tombol tombol-garis" data-tambah="tabel" title="Tambah Tabel Rincian: barisnya mengikuti transaksi saat dicetak">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M3 15h18M10 5v14"/></svg>
                                Tabel
                            </button>
                            <span class="editor-alat-label editor-alat-pemisah">Edit:</span>
                            <button type="button" class="tombol tombol-garis" data-edit="urungkan" title="Urungkan (Ctrl+Z)" disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>
                                Urungkan
                            </button>
                            <button type="button" class="tombol tombol-garis" data-edit="ulangi" title="Ulangi (Ctrl+Y)" disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg>
                                Ulangi
                            </button>
                            <button type="button" class="tombol tombol-garis" data-edit="salin" title="Salin elemen (Ctrl+C)" disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                                Salin
                            </button>
                            <button type="button" class="tombol tombol-garis" data-edit="tempel" title="Tempel elemen (Ctrl+V)" disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5V3h6v2M9 11h6M9 15h6"/></svg>
                                Tempel
                            </button>
                        </div>
                        <!-- Kanvas abu-abu berisi kertas. Setiap elemen desain digambar sebagai kotak yang diposisikan dalam milimeter. -->
                        <!-- Isi teks dipasang lewat textContent, jadi data tidak bisa menyisipkan kode HTML. -->
                        <div class="editor-kanvas" id="ec-kanvas">
                            <div class="editor-kertas" id="ec-kertas">
                                <div id="ec-halaman" class="halaman-cetak" role="img" aria-label="Kertas desain cetakan"></div>
                            </div>
                        </div>

                        <aside class="editor-panel" aria-label="Pengaturan desain">
                            <h3 class="editor-panel-judul">Desain Cetakan</h3>
                            <!-- Muncul hanya saat sebuah elemen dipilih di kertas. Isinya menyesuaikan jenis elemen. -->
                            <div class="editor-isian" id="ec-bagian-elemen" hidden>
                                <span class="editor-label">Elemen Terpilih: <span id="ec-jenis-elemen"></span></span>

                                <!-- Isi teks dan penyisip penanda (hanya elemen teks) -->
                                <div id="ec-bagian-isi" class="editor-kelompok" hidden>
                                    <label class="editor-label-kecil" for="ec-el-isi">Isi Teks</label>
                                    <textarea id="ec-el-isi" rows="4"></textarea>
                                    <div class="editor-penanda">
                                        <select id="ec-penanda" aria-label="Pilih penanda isian"></select>
                                        <button type="button" id="ec-sisip" class="tombol tombol-garis" title="Sisipkan penanda di tempat kursor">Sisipkan</button>
                                    </div>
                                    <p class="petunjuk">Penanda diganti data asli saat dicetak. Contoh: {{nomor}} menjadi nomor transaksi.</p>
                                </div>

                                <!-- Gaya huruf (hanya elemen teks) -->
                                <div id="ec-gaya-teks" class="editor-kelompok" hidden>
                                    <span class="editor-label-kecil">Huruf</span>
                                    <div class="editor-margin">
                                        <label for="ec-gaya-ukuran">Ukuran (pt)</label>
                                        <input id="ec-gaya-ukuran" type="number" min="4" max="96" step="0.5">
                                        <label for="ec-gaya-warna">Warna</label>
                                        <input id="ec-gaya-warna" type="color">
                                    </div>
                                    <div class="editor-segmen" role="group" aria-label="Gaya dan rata teks">
                                        <button type="button" id="ec-gaya-tebal" aria-pressed="false" title="Tebal"><b>B</b></button>
                                        <button type="button" id="ec-gaya-miring" aria-pressed="false" title="Miring"><i>I</i></button>
                                        <span class="pemisah" aria-hidden="true"></span>
                                        <button type="button" data-rata="kiri" aria-pressed="false" title="Rata kiri">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 10h10M4 14h16M4 18h10"/></svg>
                                        </button>
                                        <button type="button" data-rata="tengah" aria-pressed="false" title="Rata tengah">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 10h10M4 14h16M7 18h10"/></svg>
                                        </button>
                                        <button type="button" data-rata="kanan" aria-pressed="false" title="Rata kanan">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M10 10h10M4 14h16M10 18h10"/></svg>
                                        </button>
                                    </div>
                                </div>

                                <!-- Gaya kotak (hanya elemen kotak) -->
                                <div id="ec-gaya-kotak" class="editor-kelompok" hidden>
                                    <span class="editor-label-kecil">Kotak</span>
                                    <div class="editor-margin">
                                        <label for="ec-kotak-tebal">Garis (mm)</label>
                                        <input id="ec-kotak-tebal" type="number" min="0" max="5" step="0.1">
                                        <label for="ec-kotak-warna">Warna garis</label>
                                        <input id="ec-kotak-warna" type="color">
                                        <label for="ec-kotak-latar">Warna latar</label>
                                        <input id="ec-kotak-latar" type="color">
                                    </div>
                                    <label class="saklar"><input type="checkbox" id="ec-kotak-tanpa-latar"> <span>Tanpa warna latar</span></label>
                                </div>

                                <!-- Gaya garis (hanya elemen garis). Tebal garis diatur lewat Tinggi di bawah. -->
                                <div id="ec-gaya-garis" class="editor-kelompok" hidden>
                                    <span class="editor-label-kecil">Garis</span>
                                    <div class="editor-margin">
                                        <label for="ec-garis-warna">Warna</label>
                                        <input id="ec-garis-warna" type="color">
                                    </div>
                                    <p class="petunjuk">Tebal garis diatur lewat kolom Tinggi.</p>
                                </div>

                                <div class="editor-kelompok">
                                    <span class="editor-label-kecil">Posisi dan Ukuran</span>
                                    <div class="editor-margin">
                                        <label for="ec-el-x">X (mm)</label>
                                        <input id="ec-el-x" type="number" step="0.5">
                                        <label for="ec-el-y">Y (mm)</label>
                                        <input id="ec-el-y" type="number" step="0.5">
                                        <label for="ec-el-w">Lebar</label>
                                        <input id="ec-el-w" type="number" min="0.2" step="0.5">
                                        <label for="ec-el-h">Tinggi</label>
                                        <input id="ec-el-h" type="number" min="0.2" step="0.5">
                                    </div>
                                </div>

                                <button type="button" id="ec-hapus-elemen" class="tombol tombol-garis tombol-garis-bahaya">Hapus Elemen</button>
                                <p class="petunjuk">Geser dengan mouse, atau tombol panah (Shift = 5 mm). Tombol Delete menghapus.</p>
                            </div>


                            <div class="editor-isian">
                                <span class="editor-label">Nama</span>
                                <p id="ec-nama" class="editor-nilai"></p>
                            </div>

                            <div class="editor-isian">
                                <label class="editor-label" for="ec-kertas-pilih">Kertas</label>
                                <select id="ec-kertas-pilih"></select>
                            </div>

                            <div class="editor-isian">
                                <span class="editor-label">Margin (mm)</span>
                                <div class="editor-margin">
                                    <label for="ec-margin-kiri">Kiri</label>
                                    <input id="ec-margin-kiri" type="number" min="0" max="50" step="0.5">
                                    <label for="ec-margin-kanan">Kanan</label>
                                    <input id="ec-margin-kanan" type="number" min="0" max="50" step="0.5">
                                    <label for="ec-margin-atas">Atas</label>
                                    <input id="ec-margin-atas" type="number" min="0" max="50" step="0.5">
                                    <label for="ec-margin-bawah">Bawah</label>
                                    <input id="ec-margin-bawah" type="number" min="0" max="50" step="0.5">
                                </div>
                                <p id="ec-galat" class="pesan-galat-kolom" role="alert" hidden></p>
                            </div>

                            <div class="editor-isian">
                                <label class="editor-label" for="ec-orientasi">Orientasi</label>
                                <select id="ec-orientasi">
                                    <option value="portrait">Portrait (tegak)</option>
                                    <option value="landscape">Landscape (mendatar)</option>
                                </select>
                            </div>

                            <div class="editor-isian">
                                <span class="editor-label">Tampilan</span>
                                <div class="editor-zoom">
                                    <button type="button" id="ec-zoom-kurang" class="tombol tombol-garis" aria-label="Perkecil">&minus;</button>
                                    <span id="ec-zoom-teks" aria-live="polite">80%</span>
                                    <button type="button" id="ec-zoom-tambah" class="tombol tombol-garis" aria-label="Perbesar">+</button>
                                    <button type="button" id="ec-zoom-pas" class="tombol tombol-garis" title="Sesuaikan kertas dengan layar">Pas</button>
                                </div>
                            </div>

                            <div class="editor-isian">
                                <button type="button" id="ec-bawaan" class="tombol tombol-garis">Kembalikan ke Desain Bawaan</button>
                            </div>

                            <p id="ec-keterangan-isi" class="petunjuk"></p>
                        </aside>
                    </div>
                </div>
            </section>
`);
