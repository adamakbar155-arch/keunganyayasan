// ==================== Tampilan: Cadangan Data ====================
// HTML halaman dan popup fitur ini. Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js)
// di tempat penanda <template data-tempat="...">. Logikanya ada di file .js lain di folder yang sama.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-cadangan", /*html*/ `
                <div class="tab" id="tab-cadangan" hidden>
                    <button type="button" class="tab-judul" data-tab="cadangan">Cadangan Data</button>
                    <button type="button" class="tab-tutup" data-tutup="cadangan" aria-label="Tutup tab Cadangan Data">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-cadangan", /*html*/ `
            <!-- ===== Isi tab Cadangan Data ===== -->
            <section id="isi-cadangan" class="isi-tab" hidden>
                <div class="halaman-info">
                    <h2 class="judul-halaman-info">Cadangan Data</h2>

                    <!-- Peringatan keamanan: file cadangan tidak dikunci -->
                    <p class="kotak-peringatan">
                        <strong>Simpan file cadangan di tempat aman.</strong>
                        File ini <strong>tidak dikunci</strong> dan berisi data pribadi (nama, KTP, rekening karyawan) serta kata sandi pengguna dalam bentuk teracak.
                        Simpan di flashdisk atau penyimpanan awan pribadi, di luar komputer ini, dan jangan dikirim ke sembarang orang.
                    </p>

                    <div class="dua-kartu">
                        <!-- ===== Kartu 1: Buat Cadangan ===== -->
                        <section class="kartu-halaman" aria-labelledby="judul-buat-cadangan">
                            <h3 id="judul-buat-cadangan">Buat Cadangan</h3>
                            <p>Mengunduh semua data aplikasi ini sebagai satu file.</p>
                            <p class="info-cadangan">Cadangan terakhir dibuat: <strong id="cadangan-terakhir">belum pernah</strong></p>

                            <div class="bungkus-tabel">
                                <table class="tabel-data tabel-kecil" aria-label="Data yang akan dicadangkan">
                                    <thead><tr><th scope="col">Data</th><th scope="col" class="kanan">Jumlah</th></tr></thead>
                                    <tbody id="ringkasan-sekarang"></tbody>
                                </table>
                            </div>

                            <button type="button" id="tombol-buat-cadangan" class="tombol tombol-utama">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>
                                Buat Cadangan
                            </button>
                        </section>

                        <!-- ===== Kartu 2: Pulihkan ===== -->
                        <section class="kartu-halaman" aria-labelledby="judul-pulihkan">
                            <h3 id="judul-pulihkan">Pulihkan dari Cadangan</h3>
                            <p>Memilih file cadangan lalu <strong>mengganti semua data</strong> di aplikasi ini dengan isi file itu. Sebelum diganti, aplikasi otomatis mengunduh cadangan data yang sedang ada.</p>

                            <label class="label-berkas" for="berkas-cadangan">Pilih file cadangan (.json)</label>
                            <input id="berkas-cadangan" type="file" accept=".json,application/json">
                            <p id="galat-cadangan" class="pesan-galat-kolom" role="alert" hidden></p>

                            <!-- Muncul setelah file dipilih dan dinyatakan benar -->
                            <div id="hasil-periksa" hidden>
                                <p class="info-cadangan">File dibuat: <strong id="file-dibuat"></strong></p>
                                <div class="bungkus-tabel">
                                    <table class="tabel-data tabel-kecil" aria-label="Perbandingan data sekarang dan isi file">
                                        <thead><tr><th scope="col">Data</th><th scope="col" class="kanan">Sekarang</th><th scope="col" class="kanan">Di file</th></tr></thead>
                                        <tbody id="ringkasan-perbandingan"></tbody>
                                    </table>
                                </div>
                                <button type="button" id="tombol-pulihkan" class="tombol tombol-bahaya">Pulihkan (Ganti Semua Data)</button>
                            </div>
                        </section>
                    </div>
                </div>
            </section>
`);
