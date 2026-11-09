// ==================== Tampilan: Dashboard ====================
// Kerangka Dashboard dan popup + Widget (PRD 6.7). Isi widget digambar oleh fitur/dashboard/dashboard.js dari data asli.
// Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js) di tempat penanda <template data-tempat="...">.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-dashboard", /*html*/ `
                <!-- Tiap tab = satu kotak .tab berisi tombol judul (dan tombol tutup untuk tab selain Dashboard).
                     Tab Preferensi bersembunyi (atribut hidden) sampai dibuka dari popup Pengaturan. -->
                <div class="tab aktif" id="tab-dashboard">
                    <button type="button" class="tab-judul" data-tab="dashboard">Dashboard</button>
                </div>
`);

pasangTampilan("isi-dashboard", /*html*/ `
            <!-- Isi tab Dashboard dimulai di sini (ditutup sebelum </main>) -->
            <section id="isi-dashboard" class="isi-tab">
                <div class="dash-atas">
                    <div class="dash-salam">
                        <strong id="dash-salam"></strong>
                        <span>Ini ringkasan keuangan yayasan.</span>
                    </div>
                    <!-- Pilih bulan: berlaku untuk widget bulanan -->
                    <div class="dash-periode">
                        <button type="button" id="dash-bulan-mundur" aria-label="Bulan sebelumnya" title="Bulan sebelumnya">‹</button>
                        <span id="dash-bulan" aria-live="polite"></span>
                        <button type="button" id="dash-bulan-maju" aria-label="Bulan berikutnya" title="Bulan berikutnya">›</button>
                    </div>
                    <button type="button" class="dash-tambah" id="tombol-widget">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                        Widget
                    </button>
                </div>
                <!-- Widget digambar oleh JavaScript, urut menurut pengaturan pengguna -->
                <div class="grid-widget" id="grid-widget"></div>
            </section>
`);

pasangTampilan("dialog-widget", /*html*/ `
    <!-- ===== Popup + Widget: memilih widget yang tampil dan urutannya ===== -->
    <dialog id="dialog-widget" class="dialog-detail dialog-widget" aria-labelledby="judul-dialog-widget">
        <header class="dialog-detail-kepala">
            <h2 id="judul-dialog-widget">Atur Widget</h2>
            <button type="button" id="tutup-dialog-widget" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div class="dialog-detail-isi">
            <p class="petunjuk">Centang widget yang ingin ditampilkan. Tombol panah mengatur urutannya. Tersimpan di browser ini.</p>
            <ul id="daftar-atur-widget" class="daftar-atur-widget"></ul>
        </div>
        <footer class="dialog-detail-kaki dialog-kaki-dua">
            <button type="button" id="bawaan-widget" class="tombol tombol-garis">Kembalikan ke Bawaan</button>
            <button type="button" id="selesai-widget" class="tombol tombol-utama">Selesai</button>
        </footer>
    </dialog>
`);
