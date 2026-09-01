Admaja — AI Development Specification

Source of truth: This document is converted from PRD-Admaja.docx.
Product requirements, terminology, scope, acceptance criteria, API contracts, RBAC, security requirements, UI/UX requirements, risks, assumptions, and database references below are preserved from the original PRD.

Important for AI coding agents: Do not invent requirements that contradict this document. If an implementation detail is missing or ambiguous, explicitly identify the ambiguity before making a destructive architectural decision.

AI Development Rules

1. Source of Truth

Treat this document as the primary product specification.

Preserve the terminology used by the PRD: Super Admin, Admin/Pembina/Pelatih, Anggota/Siswa Paskibra, aktif, tidak aktif, purna, draft, dibuka, ditutup, Hadir, Izin, Sakit, Alpha.

Features outside the defined scope must not be implemented unless explicitly requested.

Out-of-scope for this version: Keuangan/Iuran, Inventaris Alat/Seragam, dan Pengumuman.

2. Implementation Discipline

Before changing code, identify the relevant functional requirement (FR-\*) and acceptance criteria.

For every feature, implement both positive and negative paths described by the PRD.

Validate all client input again on the server.

Never rely solely on frontend authorization or validation.

Preserve existing data when changing member status; historical attendance must remain available.

For corrections to attendance, update the existing presence record instead of creating duplicates.

Voting must be protected at the backend/database level against duplicate votes.

Never store Password Saver passwords in plaintext.

3. Security Baseline

JWT authentication.

Authentication token in HTTP-only cookie.

Passwords hashed with bcrypt/Argon2.

Password Saver credentials encrypted symmetrically (e.g. AES-256).

Password Saver encryption key must be separate from the database and stored in environment variables.

RBAC must be enforced on every protected API endpoint.

Login and voting endpoints require rate limiting.

Sensitive access attempts, especially unauthorized Password Saver access, must be auditable.

Voting is recorded, not anonymous; voter_id and vote_time are retained for internal audit.

4. API Rules

API base path: /api/v1.

RESTful JSON API.

Protected endpoints require authentication.

Preserve HTTP semantics from the PRD, including 401, 403, 409, and validation errors.

Do not expose sensitive fields unnecessarily.

Voting duplicate attempts must return 409 Conflict.

Access to closed voting periods must be rejected by the backend.

5. UX Rules

Admin dashboard: desktop-first but responsive.

Member portal: mobile-first.

Indonesian language throughout the UI.

Touch targets on the member portal should be at least 44x44px.

Voting flow: candidate list → candidate detail/selection → confirmation → success.

Disable/restrict repeated submission while important requests are processing.

Provide clear loading/skeleton states on slow connections.

Attendance input should be optimized for fast field use.

6. Development Workflow for AI

When asked to implement a feature:

Locate the relevant PRD section and FR-\*.

State the affected actors and RBAC requirements.

Identify affected database collections/entities.

Identify affected API endpoints.

Implement server-side validation and authorization first.

Implement the UI/UX flow.

Add handling for negative/edge cases from the acceptance criteria.

Add/update tests for the affected behavior.

Check that the implementation does not violate scope or security requirements.

Summarize files changed and any unresolved ambiguity.

Original PRD Content

Product Recruitment Document (PRD)

Dashboard Admin Admaja & Portal Admaja

Sistem Manajemen Absensi & Pemilihan Ketua Organisasi Paskibra SMK 4 Kendal

DAFTAR ISI

Ringkasan Eksekutif

Daftar User Stories & Aktor

Persyaratan Fungsional

Persyaratan Non-Fungsional

Spesifikasi API Endpoint

Panduan UI/UX & Tata Letak

Risiko, Asumsi, & Strategi Mitigasi

Lampiran

1. RINGKASAN EKSEKUTIF

1.1 Latar Belakang

Organisasi Paskibra SMKN 4 Kendal saat ini masih mengelola presensi latihan dan proses pemilihan ketua organisasi secara manual (catatan kertas/spreadsheet dan musyawarah tatap muka tanpa pencatatan digital). Pendekatan ini menimbulkan beberapa masalah operasional:

Rekap kehadiran anggota memakan waktu dan rawan kesalahan input.

Tidak ada jejak audit (audit trail) yang jelas untuk hasil pemilihan ketua.

Admin/Pembina kesulitan memantau tren kehadiran per anggota secara cepat.

Tidak ada satu sumber data (single source of truth) yang bisa diakses kapan saja oleh pembina maupun anggota.

Untuk menjawab masalah tersebut, dibangun dua aplikasi yang saling terhubung dalam satu ekosistem:

Dashboard Admin Admaja — panel kendali untuk Admin/Pembina dan Super Admin dalam mengelola data anggota, sesi latihan, presensi, dan periode pemilihan ketua.

Portal Admaja — antarmuka bagi Anggota untuk melihat riwayat kehadiran pribadi dan berpartisipasi dalam pemilu ketua organisasi secara digital.

1.2 Visi Produk

Menjadikan seluruh proses administratif inti organisasi Paskibra — presensi latihan dan regenerasi kepemimpinan — berjalan digital, tercatat, dan dapat dipertanggungjawabkan (accountable), tanpa membebani anggota dengan proses yang rumit.

1.3 Ruang Lingkup Sistem

Di luar cakupan (out of scope) versi ini: modul Keuangan/Iuran, modul Inventaris Alat/Seragam, dan modul Pengumuman. Ketiga modul ini disepakati untuk tidak dikembangkan pada fase ini dan dapat menjadi bahan pengembangan lanjutan (roadmap fase berikutnya).

1.4 Tujuan Utama

Dashboard Admin:

Mengelola data anggota dan admin.

Membuat sesi kegiatan/latihan dan mencatat status kehadiran (Hadir/Izin/Sakit/Alpha) per anggota.

Menghasilkan rekap laporan absensi yang bisa diexport.

Menyelenggarakan pemilihan ketua organisasi: membuat periode pemilihan, menginput kandidat, membuka & menutup periode voting, serta melihat hasil akhir.

(Super Admin) Menyimpan kredensial atau password akun organisasi secara aman melalui fitur Password Saver.

Portal Anggota:

Login dan melihat status kehadiran diri sendiri.

Mengikuti pemilu ketua organisasi: melihat daftar kandidat dan memberikan satu suara per periode pemilihan.

2. DAFTAR USER STORIES & AKTOR

2.1 Pemetaan Aktor

Catatan desain RBAC: Sistem ini menggunakan struktur peran sederhana (admin dan user/anggota) sesuai kebutuhan operasional organisasi yang tidak memerlukan jenjang jabatan berlapis (Pengurus/Senior/Yunior). Perbedaan antara Admin dan Super Admin direpresentasikan melalui field role (admin / super_admin) pada koleksi user_admin, bukan sebagai aktor yang sepenuhnya terpisah — keduanya mengakses dashboard yang sama, hanya Super Admin yang melihat menu Password Saver.

2.2 Matriks Hak Akses (RBAC)

2.3 User Stories Kunci

Super Admin

Sebagai Super Admin, saya ingin menyimpan kredensial akun media sosial dan email organisasi di satu tempat yang aman, agar tidak tercecer saat terjadi pergantian pengurus.

Sebagai Super Admin, saya ingin bisa menambah/menonaktifkan akun Admin lain, agar akses sistem tetap terkendali.

Admin/Pembina

Sebagai Admin, saya ingin membuat sesi latihan baru dengan tanggal dan nama kegiatan, agar sistem otomatis menyiapkan daftar anggota aktif untuk diabsen.

Sebagai Admin, saya ingin menginput status kehadiran tiap anggota (Hadir/Izin/Sakit/Alpha), agar data presensi tercatat rapi.

Sebagai Admin, saya ingin melihat rekap laporan absensi dan mengexportnya, agar bisa dilaporkan ke pihak sekolah.

Sebagai Admin, saya ingin membuat periode pemilihan ketua dan menginput daftar kandidat, agar pemilu bisa berjalan terjadwal.

Sebagai Admin, saya ingin membuka dan menutup periode voting sesuai jadwal, agar proses pemilu terkendali.

Sebagai Admin, saya ingin melihat hasil akhir pemilu setelah periode ditutup, agar bisa mengumumkan ketua terpilih secara internal.

Anggota

Sebagai Anggota, saya ingin login ke portal menggunakan akun saya, agar bisa mengakses fitur presensi dan pemilu.

Sebagai Anggota, saya ingin sistem memberi tahu apakah saya sudah vote atau belum saat membuka halaman voting, agar tidak mencoba vote dua kali.

Sebagai Anggota, saya ingin melihat daftar kandidat lengkap dengan visi-misi sebelum memilih, agar keputusan saya terinformasi.

Sebagai Anggota, saya ingin mendapat konfirmasi setelah suara saya tersimpan, agar yakin partisipasi saya berhasil tercatat.

3. PERSYARATAN FUNGSIONAL

Setiap fitur berikut disusun dalam format User Story, dengan Acceptance Criteria yang mencakup Positive Case (skenario berhasil) dan Negative Case (skenario gagal/ditolak).

3.1 MODUL DASHBOARD ADMIN

3.1.1 Manajemen Anggota & Admin

FR-01 — Kelola Data Anggota

Sebagai Admin, saya ingin menambah, mengubah, dan menonaktifkan data anggota, agar daftar anggota aktif selalu akurat saat sesi absensi dibuat.

Acceptance Criteria:

✅ Positive: Admin mengisi form (nama, angkatan, kelas, NIPD, email) → data tersimpan ke koleksi user dengan status aktif.

✅ Positive: Admin mengubah status anggota menjadi tidak aktif atau purna → anggota tersebut tidak lagi muncul di daftar sesi absensi baru, namun riwayat presensi lamanya tetap tersimpan.

❌ Negative: Admin mencoba menyimpan data dengan NIPD yang sudah terdaftar → sistem menolak dan menampilkan pesan "NIPD sudah digunakan".

❌ Negative: Field wajib (nama, NIPD) kosong → sistem menolak submit dan menandai field yang error.

FR-02 — Kelola Data Admin (khusus Super Admin)

Sebagai Super Admin, saya ingin menambah atau menonaktifkan akun Admin, agar pengelolaan akses tetap terkendali saat regenerasi pembina/pengurus.

Acceptance Criteria:

✅ Positive: Super Admin membuat akun admin baru dengan role admin → akun tersimpan di user_admin dan bisa langsung login.

✅ Positive: Super Admin menonaktifkan akun admin → akun berstatus tidak aktif tidak bisa login walau kredensial benar.

❌ Negative: Admin biasa (bukan Super Admin) mencoba mengakses menu kelola admin → sistem menolak dengan 403 Forbidden.

3.1.2 Presensi/Absensi

FR-03 — Buat Sesi Kegiatan

Sebagai Admin, saya ingin membuat sesi baru dengan tanggal dan nama kegiatan, agar sistem menyiapkan form absensi untuk seluruh anggota aktif.

Acceptance Criteria:

✅ Positive: Admin mengisi tanggal, nama kegiatan, dan deskripsi → sesi tersimpan ke koleksi sessions, sistem otomatis menampilkan seluruh anggota berstatus aktif untuk diabsen.

❌ Negative: Admin membuat sesi dengan tanggal yang sama dan nama kegiatan identik dengan sesi yang sudah ada → sistem memberi peringatan duplikasi (tetap bisa dilanjutkan jika disengaja, mengingat memungkinkan lebih dari satu jenis kegiatan dalam catatan, namun default satu kegiatan per hari).

FR-04 — Input Status Kehadiran

Sebagai Admin, saya ingin menandai status tiap anggota (Hadir/Izin/Sakit/Alpha) dalam satu sesi, agar presensi tercatat lengkap untuk seluruh peserta.

Acceptance Criteria:

✅ Positive: Admin memilih status per anggota lalu simpan → data tersimpan ke koleksi presences dengan relasi session_id + user_id + status.

✅ Positive: Admin mengubah status yang sudah diinput sebelumnya (koreksi) → sistem meng-update record yang sama, bukan membuat duplikat.

❌ Negative: Admin mencoba menyimpan tanpa memilih status untuk salah satu anggota → sistem menandai anggota tersebut sebagai belum lengkap dan meminta konfirmasi ulang (default disarankan Alpha jika sengaja dikosongkan).

FR-05 — Rekap & Export Laporan Absensi

Sebagai Admin, saya ingin melihat rekap kehadiran per anggota/per sesi dan mengexportnya, agar bisa dilaporkan ke pihak sekolah.

Acceptance Criteria:

✅ Positive: Admin memilih rentang tanggal/sesi → sistem menampilkan rekap persentase kehadiran per anggota, serta bisa diexport ke format CSV/Excel.

✅ Positive: Admin memfilter rekap per angkatan/kelas → hasil rekap terfilter sesuai kriteria.

❌ Negative: Rentang tanggal yang dipilih tidak memiliki data sesi sama sekali → sistem menampilkan pesan "Tidak ada data pada rentang ini" alih-alih laporan kosong tanpa keterangan.

3.1.3 Pemilihan Ketua Organisasi (Pemilu)

FR-06 — Buat Periode Pemilihan

Sebagai Admin, saya ingin membuat periode pemilihan baru dengan tanggal mulai dan selesai, agar jadwal pemilu jelas bagi seluruh anggota.

Acceptance Criteria:

✅ Positive: Admin mengisi nama pemilihan, tanggal mulai, tanggal selesai → tersimpan ke koleksi elections dengan status awal draft.

❌ Negative: Tanggal selesai diisi lebih awal dari tanggal mulai → sistem menolak dan meminta perbaikan tanggal.

FR-07 — Input Kandidat

Sebagai Admin, saya ingin menambahkan kandidat ketua beserta data dan visi-misinya, agar anggota bisa menilai sebelum memilih.

Acceptance Criteria:

✅ Positive: Admin menambahkan kandidat (nomor urut/serial number, data kandidat, visi-misi) yang terhubung ke elections_id tertentu → tersimpan ke koleksi candidates.

❌ Negative: Admin mencoba menambahkan kandidat dengan nomor urut yang sudah dipakai di periode yang sama → sistem menolak dan meminta nomor urut lain.

❌ Negative: Admin mencoba menambahkan kandidat pada periode yang berstatus sudah ditutup → sistem menolak perubahan data kandidat.

FR-08 — Buka & Tutup Periode Voting

Sebagai Admin, saya ingin mengaktifkan (buka) dan menonaktifkan (tutup) periode voting secara manual, agar waktu pemungutan suara terkendali penuh oleh pengurus.

Acceptance Criteria:

✅ Positive: Admin mengubah status elections dari draft menjadi dibuka → anggota mulai bisa mengakses halaman voting untuk periode tersebut.

✅ Positive: Admin mengubah status menjadi ditutup → anggota tidak bisa lagi submit suara baru; hasil dapat dilihat admin.

❌ Negative: Admin mencoba membuka dua periode pemilihan sekaligus dalam status dibuka secara bersamaan → sistem memberi peringatan untuk menghindari kebingungan anggota (opsional bisa diizinkan bila memang disengaja untuk multi-jabatan, namun default satu periode aktif dalam satu waktu).

FR-09 — Lihat Hasil Pemilu

Sebagai Admin, saya ingin melihat rekap perolehan suara tiap kandidat setelah periode ditutup, agar bisa menentukan dan mengumumkan ketua terpilih.

Acceptance Criteria:

✅ Positive: Admin membuka halaman hasil pada periode berstatus ditutup → sistem menampilkan jumlah suara per kandidat beserta daftar voter_id untuk keperluan audit (karena voting bersifat tercatat, bukan anonim).

❌ Negative: Admin mencoba melihat hasil pada periode yang masih berstatus dibuka → sistem menyembunyikan hasil sementara untuk mencegah bias, hanya menampilkan status "Voting sedang berlangsung" (opsional sesuai kebijakan pengurus; dapat dikonfigurasi bila pengurus ingin memantau progres jumlah pemilih tanpa melihat perolehan suara).

3.1.4 Password Saver (Khusus Super Admin)

FR-10 — Simpan Kredensial Akun Organisasi

Sebagai Super Admin, saya ingin menyimpan username/password akun-akun organisasi (media sosial, email sekolah, dll) dalam vault terenkripsi, agar tidak hilang saat pergantian pengurus.

Acceptance Criteria:

✅ Positive: Super Admin menambahkan entri baru (nama akun, platform, username, password) → password dienkripsi sebelum disimpan ke database, tidak pernah tersimpan dalam bentuk plain text.

✅ Positive: Super Admin membuka detail entri dan memilih "tampilkan password" → sistem mendekripsi dan menampilkan sementara, lalu tersembunyi lagi otomatis.

❌ Negative: Admin biasa (bukan Super Admin) mencoba mengakses endpoint Password Saver → sistem menolak dengan 403 Forbidden, dan percobaan akses tercatat di log aktivitas.

❌ Negative: Kegagalan proses enkripsi saat menyimpan → sistem membatalkan penyimpanan (bukan menyimpan data mentah) dan menampilkan pesan error.

3.2 MODUL PORTAL ANGGOTA

3.2.1 Autentikasi & Profil

FR-11 — Login Anggota

Sebagai Anggota, saya ingin login menggunakan email dan password, agar bisa mengakses fitur presensi dan pemilu.

Acceptance Criteria:

✅ Positive: Anggota memasukkan kredensial valid dan status akun aktif → sistem mengembalikan token sesi dan mengarahkan ke halaman utama.

❌ Negative: Password salah → sistem menolak dengan pesan generik "Email atau password salah" (tidak membocorkan email mana yang terdaftar).

❌ Negative: Akun berstatus tidak aktif/purna → login ditolak dengan pesan "Akun tidak aktif, hubungi pembina".

FR-12 — Lihat Riwayat Kehadiran

Sebagai Anggota, saya ingin melihat riwayat kehadiran saya sendiri, agar bisa memantau rekap presensi pribadi.

Acceptance Criteria:

✅ Positive: Anggota membuka halaman riwayat → sistem menampilkan daftar sesi beserta status kehadirannya (Hadir/Izin/Sakit/Alpha).

❌ Negative: Anggota mencoba mengakses riwayat anggota lain lewat manipulasi URL/ID → sistem menolak dengan 403 Forbidden.

3.2.2 Voting Pemilu

FR-13 — Buka Halaman Voting & Validasi Status

Sebagai Anggota, saya ingin sistem otomatis mengecek apakah saya sudah memilih atau belum saat membuka halaman voting, agar tidak salah submit dua kali.

Acceptance Criteria:

✅ Positive: Anggota belum pernah vote pada periode aktif → sistem menampilkan daftar kandidat untuk dipilih.

✅ Positive: Anggota sudah pernah vote pada periode aktif → sistem langsung mengarahkan ke halaman "Anda sudah memilih" tanpa menampilkan form voting ulang.

❌ Negative: Tidak ada periode pemilihan berstatus dibuka saat ini → sistem menampilkan halaman "Belum ada pemilihan yang sedang berlangsung".

FR-14 — Pilih Kandidat & Submit Suara

Sebagai Anggota, saya ingin memilih satu kandidat dan mengonfirmasi pilihan saya, agar suara saya tercatat sah.

Acceptance Criteria:

✅ Positive: Anggota memilih satu kandidat lalu konfirmasi → sistem menyimpan ke koleksi votes (relasi elections_id, candidates_id, voter_id, vote_time) dan menampilkan konfirmasi sukses.

❌ Negative: Anggota mencoba submit tanpa memilih kandidat → tombol submit nonaktif/sistem menolak dengan validasi "Pilih kandidat terlebih dahulu".

❌ Negative: Anggota mencoba submit suara kedua kalinya pada periode yang sama (melalui request langsung ke API, bukan lewat UI) → sistem menolak di level backend dengan 409 Conflict — Anda sudah memilih, sebagai lapisan keamanan tambahan selain validasi di frontend.

❌ Negative: Periode voting berubah menjadi ditutup tepat saat anggota sedang mengisi form → sistem menolak submit dengan pesan "Periode voting telah ditutup".

4. PERSYARATAN NON-FUNGSIONAL

4.1 Keamanan

4.2 Performa & Aksesibilitas Mobile

Portal Anggota harus mobile-first, mengingat mayoritas anggota mengakses dari ponsel, termasuk saat berada di lapangan latihan dengan koneksi yang tidak selalu stabil.

Halaman voting dan form absensi dioptimalkan agar tetap dapat dimuat pada koneksi lambat (ukuran payload minimal, lazy loading komponen non-kritis).

Waktu respons API untuk operasi baca (GET) ditargetkan di bawah 500ms pada kondisi jaringan normal, dan sistem menampilkan status loading/skeleton yang jelas saat koneksi lambat agar anggota tidak submit ganda karena mengira aksi gagal.

Aksi submit penting (absensi, voting) dirancang idempotent atau memiliki penguncian tombol sementara (debounce) setelah diklik, untuk mencegah duplikasi akibat klik berulang saat koneksi lambat.

4.3 Skalabilitas & Ketersediaan

Deploy di Vercel (Free Plan) sesuai batasan proyek — perlu diperhatikan batas execution time dan bandwidth pada tier gratis; proses ekspor laporan besar sebaiknya dijalankan secara asynchronous/terpaging agar tidak melebihi batas timeout function serverless.

MongoDB dipilih agar skema fleksibel mengikuti kebutuhan lapangan (misal penambahan field baru pada candidate_data tanpa migrasi kaku).

4.4 Usability

Interaksi Admin untuk input absensi harus bisa diselesaikan dalam waktu singkat (idealnya < 2 menit untuk satu sesi berisi puluhan anggota), karena biasanya diinput langsung di lapangan.

Bahasa antarmuka menggunakan Bahasa Indonesia yang sederhana dan konsisten di seluruh sistem.


6. PANDUAN UI/UX & TATA LETAK

6.1 Dashboard Admin Admaja (Desktop-first, tetap responsif)

Prinsip desain: gunakan sidebar navigasi tetap di desktop untuk perpindahan cepat antar modul, dengan warna status yang konsisten (mis. hijau = Hadir, kuning = Izin, biru = Sakit, merah = Alpha) agar rekap mudah dibaca sekilas.

6.2 Portal Admaja (Mobile-first)

Prinsip desain: navigasi bawah (bottom navigation bar) untuk portal mobile agar mudah dijangkau ibu jari; ukuran tombol minimal 44x44px sesuai standar aksesibilitas sentuh; hindari form panjang — pecah proses voting menjadi langkah bertahap (lihat kandidat → pilih → konfirmasi) agar tidak membingungkan dan meminimalkan risiko salah klik.

7. RISIKO, ASUMSI, & STRATEGI MITIGASI

7.1 Asumsi

Satu anggota hanya terdaftar pada satu akun user, tidak ada akun ganda.

Dalam satu hari umumnya hanya ada satu sesi kegiatan/latihan (sesuai kesepakatan awal desain), namun struktur data tidak membatasi jika suatu saat dibutuhkan lebih dari satu sesi per hari.

Kandidat ketua ditunjuk/diverifikasi secara manual oleh pengurus (bukan pendaftaran mandiri oleh anggota), sehingga tidak diperlukan alur approval kandidat.

Voting bersifat tercatat (dapat diaudit), bukan anonim — seluruh anggota organisasi telah menyepakati mekanisme ini sejak awal.

Hanya anggota berstatus aktif yang berhak memberikan suara dan dihitung dalam daftar sesi absensi baru.

8. LAMPIRAN

8.1 Referensi Struktur Database (ringkasan dari desain awal)

Admin User Collections

user_admin: user_id, name, angkatan, role (admin/super_admin), status (aktif/tidak aktif/purna)

Universal Collections

user: user_id, name, angkatan, kelas, nipd, email, status (aktif/tidak aktif/purna)

Collections Absensi

sessions: session_id, date, nama_kegiatan, desc_kegiatan

presences: presences_id, session_id, user_id, status

Collections Pemilu

elections: elections_id, name, tanggal_mulai, tanggal_selesai, status

candidates: candidates_id, elections_id, serial_number, candidate_data, visi_misi

votes: votes_id, elections_id, candidates_id, voter_id, vote_time

Catatan: Fitur Password Saver memerlukan koleksi tambahan (misal vault_credentials: id, account_name, platform, username, encrypted_password, created_by, updated_at) yang belum tercakup pada diagram awal dan perlu ditambahkan pada implementasi.

8.2 Referensi Alur (Flow) — dari diagram desain awal

Flow Absensi: Admin buat sesi → sistem tampilkan anggota aktif → input status kehadiran → simpan ke presences → generate rekap laporan.

Flow Pemilu (Admin): Buat periode pemilihan → input kandidat → buka periode voting → tutup periode & lihat hasil.

Flow Pemilu (User): Login portal → buka halaman voting → validasi status vote → jika sudah vote: ke halaman utama; jika belum: lihat daftar kandidat → pilih & submit → simpan suara & konfirmasi.

Dokumen ini adalah dokumentasi resmi proyek dan menjadi acuan bersama antara Tim Developer, Pembina/Pengurus Paskibra, dan pihak sekolah. Perubahan lingkup (termasuk aktivasi modul Keuangan/Iuran, Inventaris, atau Pengumuman) memerlukan pembaruan dokumen ini pada versi berikutnya.

Note Client:

Password SAVER

Buat sesi (admin)

Anggota aktif melakukan voting (user)

Landing Page

Absensi (Coming Soon, after pemilu)

Internal Test: 16 Oktober 2026

Domain Valid:

Admajaskanifo.org

Main Color:

All Platform: Biru Navy

| Versi Dokumen | 1.0 |

| --- | --- |

| Tanggal | 31 Agustus 2026 |

| Status | Done — Siap Development |

| Disusun oleh | Tim Pengembang (Nabil Arif Triyant) |

| Untuk | Pembina/Pengurus Paskibra SMK & Pihak Sekolah |

| Cakupan | Dashboard Admin Admaja | Portal Admaja |

| --- | --- | --- |

| Manajemen anggota (CRUD) | ✅ | — |

| Pembuatan sesi kegiatan/latihan | ✅ | — |

| Input status kehadiran per anggota | ✅ | — |

| Rekap & export laporan absensi | ✅ | — |

| Buat periode pemilihan & kandidat | ✅ | — |

| Buka/tutup periode voting | ✅ | — |

| Lihat hasil pemilu | ✅ (khusus admin) | ❌ (tidak ditampilkan ke anggota) |

| Password Saver (vault kredensial organisasi) | ✅ (khusus Super Admin) | — |

| Login & lihat halaman voting | — | ✅ |

| Voting kandidat ketua | — | ✅ |

| Aktor | Deskripsi | Akses Utama |

| --- | --- | --- |

| Super Admin | User yang terpilih | Dashboard Admin (penuh) + Password Saver |

| Admin/Pembina/Pelatih | Pengurus yang mengoperasikan kegiatan harian: sesi latihan, absensi, pemilu. | Dashboard Admin (penuh, kecuali Password Saver) |

| Anggota/Siswa Paskibra | Seluruh anggota aktif organisasi. | Portal Anggota |

| Modul / Aksi | Super Admin | Admin/Pembina | Anggota |

| --- | --- | --- | --- |

| Login Dashboard Admin | ✅ | ✅ | ❌ |

| Login Portal Anggota | ❌ | ❌ | ✅ |

| Kelola data anggota (CRUD) | ✅ | ✅ | ❌ |

| Kelola data admin lain | ✅ | ❌ | ❌ |

| Input status kehadiran | ✅ | ✅ | ❌ |

| Lihat rekap & export laporan absensi | ✅ | ✅ | ❌ |

| Lihat riwayat kehadiran diri sendiri | ❌ | ❌ | ✅ |

| Buat periode pemilihan ketua | ✅ | ✅ | ❌ |

| Input kandidat | ✅ | ✅ | ❌ |

| Buka/tutup periode voting | ✅ | ✅ | ❌ |

| Lihat hasil pemilu | ✅ | ✅ | ❌ |

| Lihat daftar kandidat & voting | ❌ | ❌ | ✅ |

| Akses Password Saver (vault kredensial organisasi) | ✅ | ❌ | ❌ |

| Ubah status aktif/nonaktif/purna anggota & admin | ✅ | ✅ (anggota saja) | ❌ |

| Aspek | Ketentuan |

| --- | --- |

| Autentikasi | Menggunakan JWT (JSON Web Token). Token disimpan di HTTP-only cookie untuk mencegah akses via JavaScript (mitigasi XSS). |

| Hashing Password | Password anggota & admin di-hash menggunakan bcrypt/argon2 sebelum disimpan — tidak pernah disimpan dalam bentuk plain text. |

| Enkripsi Password Saver | Kredensial pada fitur Password Saver dienkripsi menggunakan algoritma simetris (misal AES-256) dengan encryption key terpisah dari database utama (disimpan sebagai environment variable, bukan hard-coded). |

| Otorisasi Peran | Setiap endpoint API memvalidasi role pengguna dari payload token sebelum memproses request (middleware-based authorization), sesuai Matriks RBAC pada Bagian 2.2. |

| Validasi Input | Seluruh input dari client divalidasi ulang di sisi server (tidak hanya mengandalkan validasi frontend) untuk mencegah data korup atau injection. |

| Audit Trail Voting | Setiap record votes menyimpan voter_id dan vote_time untuk keperluan audit internal pengurus, sesuai kesepakatan bahwa voting bersifat tercatat (bukan anonim). |

| Rate Limiting | Endpoint login dan endpoint voting diberi rate limit untuk mencegah brute force dan percobaan submit suara berulang secara otomatis. |

| --- | --- |

| Login | Form email/password, pesan error inline. |

| Beranda/Dashboard | Ringkasan statistik (jumlah anggota aktif, tingkat kehadiran minggu ini, status periode pemilu aktif). |

| Manajemen Anggota | Tabel dengan filter (status/angkatan/kelas), search bar, tombol tambah, form modal tambah/edit. |

| Sesi Kegiatan | Daftar sesi (kartu/tabel), tombol "Buat Sesi Baru", halaman detail sesi berisi checklist absensi per anggota dengan opsi status berupa tombol/toggle cepat (Hadir/Izin/Sakit/Alpha). |

| Rekap Laporan | Filter tanggal/kelas/angkatan, tabel rekap persentase, tombol export (CSV/Excel), grafik ringkas tren kehadiran. |

| Pemilu | Tab: Periode Pemilihan (list + buat baru), Kandidat (form input + list per periode), Kontrol Status (tombol buka/tutup dengan konfirmasi), Hasil (tabel + grafik batang perolehan suara, hanya tampil setelah ditutup). |

| Password Saver (khusus Super Admin) | Daftar entri dalam bentuk kartu/tabel dengan password ter-mask (••••••••), tombol mata untuk reveal sementara, form tambah/edit terenkripsi. |

| Manajemen Admin (khusus Super Admin) | Tabel daftar admin, tombol tambah, toggle status aktif/nonaktif. |

| Halaman | Komponen Utama |

| --- | --- |

| Login | Form sederhana, ramah sentuh (touch-friendly), tombol besar. |

| Beranda | Sapaan nama anggota, ringkasan kehadiran terbaru, banner "Pemilu sedang berlangsung" jika ada periode aktif. |

| Riwayat Kehadiran | List/timeline sesi dengan badge status berwarna, dapat difilter per bulan. |

| Halaman Voting | Jika belum vote: daftar kartu kandidat (foto/nomor urut, ringkasan visi-misi, tombol "Lihat Detail" & "Pilih"), halaman konfirmasi sebelum submit final. Jika sudah vote: tampilan status "Anda sudah memilih" tanpa akses ulang ke form. |

| Detail Kandidat | Nomor urut, foto, visi-misi lengkap, tombol kembali ke daftar. |

| Konfirmasi Suara | Modal/halaman konfirmasi sebelum submit final ("Anda yakin memilih Kandidat X? Pilihan tidak dapat diubah setelah dikonfirmasi."), lalu halaman sukses. |

| No | Risiko/Batasan | Dampak | Strategi Mitigasi |

| --- | --- | --- | --- |

| 1 | Koneksi internet lambat/terputus saat latihan di lapangan terbuka | Admin gagal menyimpan absensi, anggota gagal submit suara | Desain form dengan auto-retry & optimistic UI; tombol submit terkunci sementara (debounce) setelah diklik untuk mencegah duplikasi; pertimbangkan draft lokal (local state) sebelum submit final ke server. |

| 2 | Anggota mencoba vote dua kali lewat manipulasi request API langsung (bukan lewat UI) | Integritas hasil pemilu terganggu | Validasi ganda: pengecekan status vote di frontend dan constraint unik (elections_id + voter_id) di level database/backend, sehingga permintaan kedua otomatis ditolak 409 Conflict. |

| 3 | Batasan Vercel Free Plan (execution time & bandwidth terbatas) | Proses export laporan besar bisa timeout | Export laporan dijalankan secara paginated/batch, atau digenerate secara asinkron dan dikirim link download setelah selesai. |

| 4 | Kredensial Password Saver bocor jika encryption key tersimpan sembarangan | Akun organisasi (medsos, email) bisa diretas | Encryption key wajib disimpan sebagai environment variable terpisah dari repo/database, akses hanya untuk Super Admin, dan seluruh percobaan akses dicatat di log aktivitas. |

| 5 | Kesalahan input massal oleh Admin (misal salah pilih status kehadiran untuk banyak anggota sekaligus) | Data rekap tidak akurat | Sediakan mode "review sebelum simpan" pada form batch absensi, serta kemampuan edit/koreksi status setelah tersimpan (bukan data terkunci permanen). |

| 6 | Pergantian pengurus (siklus tahunan) menyebabkan hilangnya pemahaman sistem | Sistem tidak terpakai maksimal periode berikutnya | Sediakan dokumentasi penggunaan singkat (SOP) di dalam dashboard atau dokumen terpisah untuk onboarding admin baru. |

AI Implementation Checklist

Use this checklist before considering a feature complete:

Requirement mapped to a specific FR-\* or PRD section.

Correct actor/RBAC verified.

Server-side authentication verified.

Server-side authorization verified.

Server-side input validation implemented.

Positive acceptance criteria implemented.

Negative acceptance criteria implemented.

Relevant database relation/constraint implemented.

Duplicate/Idempotency behavior handled where required.

Error status/message follows the PRD.

Loading/error/success UI handled.

Mobile responsiveness considered where applicable.

Security implications reviewed.

Tests added/updated.

No out-of-scope feature introduced.

Documentation updated if the implementation changes an API or data contract.

AI Prompt Template

Use this template when asking an AI coding agent to work on Admaja:

You are developing the Admaja system.

Treat `PRD-Admaja-AI-Development.md` as the source of truth.


Before coding:

1. Identify the relevant PRD section and FR-\*.
2. Identify affected actors and RBAC rules.
3. Identify affected database collections/entities.
4. Identify affected API endpoints.
5. Identify positive and negative acceptance criteria.
6. Identify security and data-integrity concerns.

Implementation requirements:

- Do not violate the existing PRD scope.
- Validate input on the server.
- Enforce authorization on the backend.
- Preserve existing API/data contracts unless the task explicitly changes them.
- Follow the PRD's error semantics.
- Add/update tests for the implementation.
- If the requirement is ambiguous, explain the ambiguity and choose the least risky implementation.

After coding:

- Summarize changed files.
- Summarize implemented behavior.
- List tests performed.
- List any remaining risks or ambiguities.
