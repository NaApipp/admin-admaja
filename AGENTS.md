<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Admaja — AI Agent Development Guide & Specification

> **Source of Truth**: `PRD.md` (Product Requirement Document: Dashboard Admin Admaja & Portal Admaja).  
> **Domain**: `admajaskanifo.org` | **Target User**: Paskibra SMKN 4 Kendal | **Theme**: Biru Navy  

---

## 1. Project Overview & Architecture

Admaja adalah ekosistem digital untuk organisasi Paskibra SMKN 4 Kendal yang mengintegrasikan dua antarmuka utama:
1. **Dashboard Admin Admaja**: Panel kendali untuk Admin/Pembina dan Super Admin (Manajemen Anggota, Manajemen Admin, Sesi Latihan, Input Presensi, Rekap/Export Laporan, Manajemen Pemilu Ketua, dan Password Saver).
2. **Portal Admaja**: Web app mobile-first untuk Anggota Paskibra (Login, Cek Riwayat Kehadiran Pribadi, dan Voting Pemilihan Ketua Organisasi).

---

## 2. Tech Stack & Workspace Guidelines

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript 5 (Strict mode)
- **Styling**: Tailwind CSS v4, PostCSS, Lucide React Icons
- **Database & ODM**: MongoDB (Native driver / Mongoose)
- **Authentication**: JWT (JSON Web Token) via `jose` / `jsonwebtoken`, disimpan di **HTTP-only Cookie**
- **Security / Hashing**: `bcryptjs` / `bcrypt` untuk user password; AES-256 simetris untuk Password Saver
- **Validation**: `zod` untuk server-side request & schema validation
- **Dev Commands**:
  - `npm run dev`: Menjalankan development server
  - `npm run build`: Build production Next.js
  - `npm run lint`: Jalankan ESLint

---

## 3. Strict Scope & Boundaries

### ✅ In-Scope (Wajib Diimplementasikan Sesuai PRD)
1. **Manajemen Anggota (CRUD)**: Data anggota aktif, tidak aktif, purna.
2. **Manajemen Admin (Super Admin)**: Tambah / nonaktifkan akun admin.
3. **Presensi / Absensi**: Pembuatan sesi kegiatan, input cepat Hadir/Izin/Sakit/Alpha, rekap & export (CSV/Excel).
4. **Pemilu Ketua Organisasi**: Buat periode (draft/dibuka/ditutup), input kandidat (nomor urut, visi-misi, foto/data), buka/tutup voting, lihat hasil perolehan suara (khusus admin setelah ditutup).
5. **Portal Voting Anggota**: Validasi status vote, pilih kandidat, konfirmasi suara, pencegahan duplicate vote.
6. **Password Saver (Vault Kredensial Khusus Super Admin)**: Enkripsi AES-256, show/hide password, audit log.

### 🚫 Out-of-Scope (DILARANG dibuat pada fase ini)
- ❌ Modul Keuangan / Iuran
- ❌ Modul Inventaris Alat / Seragam
- ❌ Modul Pengumuman

---

## 4. RBAC (Role-Based Access Control) Matrix

| Modul / Aksi | Super Admin | Admin / Pembina | Anggota (User) |
| :--- | :---: | :---: | :---: |
| **Login Dashboard Admin** | ✅ | ✅ | ❌ |
| **Login Portal Anggota** | ❌ | ❌ | ✅ |
| **Kelola Data Anggota (CRUD)** | ✅ | ✅ | ❌ |
| **Kelola Data Admin Lain** | ✅ | ❌ | ❌ |
| **Buat Sesi & Input Presensi** | ✅ | ✅ | ❌ |
| **Lihat Rekap & Export Absensi** | ✅ | ✅ | ❌ |
| **Lihat Riwayat Kehadiran Sendiri** | ❌ | ❌ | ✅ |
| **Buat Periode Pemilu & Kandidat** | ✅ | ✅ | ❌ |
| **Buka / Tutup Periode Voting** | ✅ | ✅ | ❌ |
| **Lihat Hasil Suara Pemilu** | ✅ (setelah ditutup) | ✅ (setelah ditutup) | ❌ |
| **Lihat Daftar Kandidat & Voting** | ❌ | ❌ | ✅ |
| **Akses Password Saver (Vault)** | ✅ | ❌ | ❌ |
| **Ubah Status Akun** | ✅ (Admin & Anggota) | ✅ (Anggota saja) | ❌ |

---

## 5. Database Schema & Collections Reference

### 1. `user_admin` (Admin & Super Admin)
- `user_id`: String / ObjectId (Unique)
- `name`: String
- `email`: String (Unique)
- `password`: String (Hashed with bcrypt)
- `angkatan`: String / Number
- `role`: `"admin"` | `"super_admin"`
- `status`: `"aktif"` | `"tidak aktif"` | `"purna"`
- `created_at`, `updated_at`: Date

### 2. `user` (Anggota / Siswa Paskibra)
- `user_id`: String / ObjectId (Unique)
- `name`: String
- `nipd`: String (Unique identifier)
- `email`: String (Unique)
- `password`: String (Hashed with bcrypt)
- `angkatan`: String / Number
- `kelas`: String
- `status`: `"aktif"` | `"tidak aktif"` | `"purna"`
- `created_at`, `updated_at`: Date

### 3. `sessions` (Sesi Kegiatan / Latihan)
- `session_id`: String / ObjectId
- `date`: Date / String (YYYY-MM-DD)
- `nama_kegiatan`: String
- `desc_kegiatan`: String
- `created_by`: String (Admin user_id)
- `created_at`: Date

### 4. `presences` (Catatan Kehadiran)
- `presences_id`: String / ObjectId
- `session_id`: Reference to `sessions`
- `user_id`: Reference to `user`
- `status`: `"Hadir"` | `"Izin"` | `"Sakit"` | `"Alpha"`
- `updated_at`: Date
- *Constraint*: Unik per kombinasi (`session_id` + `user_id`). Update record yang ada saat koreksi, jangan buat duplikat!

### 5. `elections` (Periode Pemilihan)
- `elections_id`: String / ObjectId
- `name`: String (e.g. "Pemilihan Ketua Paskibra Periode 2026/2027")
- `tanggal_mulai`: Date
- `tanggal_selesai`: Date
- `status`: `"draft"` | `"dibuka"` | `"ditutup"`
- `created_by`: String
- `created_at`, `updated_at`: Date

### 6. `candidates` (Kandidat Ketua)
- `candidates_id`: String / ObjectId
- `elections_id`: Reference to `elections`
- `serial_number`: Number (Nomor Urut 1, 2, 3, dst - Unik per election)
- `candidate_data`: Object `{ name: string, foto_url?: string, kelas?: string, angkatan?: string, bio?: string }`
- `visi_misi`: Object `{ visi: string, misi: string[] }`

### 7. `votes` (Suara Masuk)
- `votes_id`: String / ObjectId
- `elections_id`: Reference to `elections`
- `candidates_id`: Reference to `candidates`
- `voter_id`: Reference to `user` (Anggota)
- `vote_time`: Date (Timestamp)
- *Constraint*: **Unique Compound Index** (`elections_id` + `voter_id`). Voting tercatat (bukan anonim) untuk kebutuhan audit.

### 8. `vault_credentials` (Password Saver - Khusus Super Admin)
- `id`: String / ObjectId
- `account_name`: String (e.g. "Instagram Official Paskibra")
- `platform`: String (e.g. "Instagram", "Email Sekolah", "TikTok")
- `username`: String
- `encrypted_password`: String (AES-256 encrypted payload / IV / Auth tag)
- `created_by`: String (Super Admin user_id)
- `created_at`, `updated_at`: Date

---

## 6. API Guidelines & Security Baseline

- **Base Path**: `/api/v1`
- **Response Format**: Standar JSON `{ success: boolean, data?: any, error?: string, message?: string }`
- **Authentication**: JWT dikirim via HTTP-only cookie.
- **Authorization & RBAC**: Verifikasi token dan role pada backend / middleware untuk setiap endpoint terproteksi.
- **Validation**: Selalu validasi payload request di server (menggunakan Zod).
- **HTTP Status Codes Semantics**:
  - `200 OK` / `201 Created`
  - `400 Bad Request`: Validasi input gagal / parameter tidak lengkap
  - `401 Unauthorized`: Token tidak ada atau tidak valid
  - `403 Forbidden`: Role tidak berwenang (misal Admin biasa mengakses Password Saver / Anggota akses Admin API)
  - `404 Not Found`: Data / endpoint tidak ditemukan
  - `409 Conflict`: Percobaan duplicate vote (Anggota mencoba memilih kedua kali pada pemilu yang sama)
  - `500 Internal Server Error`: Kesalahan server internal
- **Security Rules**:
  - Password akun **wajib** di-hash dengan `bcryptjs` (salt >= 10).
  - Password Saver dienkripsi secara simetris (AES-256-GCM / CBC) menggunakan `PASSWORD_SAVER_KEY` dari environment variables (terpisah dari database).
  - Rate limiting pada endpoint login dan voting untuk mencegah brute-force.
  - Saat status anggota diubah jadi `tidak aktif` atau `purna`, jangan hapus histori absensi sebelumnya.

---

## 7. UI/UX Directives

- **Primary Color Palette**: Biru Navy (Dominan `#0B192C` / `#1E3E62` / `#001F3F`), Slate/White background, Aksen Emas/Navy.
- **Warna Status Presensi Konsisten**:
  - `Hadir`: Hijau (`emerald`/`green`)
  - `Izin`: Kuning / Amber (`amber`/`yellow`)
  - `Sakit`: Biru (`sky`/`blue`)
  - `Alpha`: Merah (`rose`/`red`)
- **Dashboard Admin**: Desktop-first namun tetap responsif (Sidebar navigasi, data tables, quick toggle status presensi, grafik hasil suara).
- **Portal Anggota**: Mobile-first (Bottom navigation, touch target minimal 44x44px, alur voting bertahap: *Pilih Kandidat* → *Detail Visi Misi* → *Konfirmasi Pilihan* → *Halaman Sukses / Status Sudah Memilih*).
- **Bahasa**: Seluruh antarmuka menggunakan **Bahasa Indonesia**.
- **UX Resilience**:
  - Tombol submit absensi & voting memiliki proteksi **debounce / disable state** saat loading untuk mencegah double submit.
  - Sediakan skeleton loader & error boundary untuk koneksi lambat saat latihan lapangan.

---

## 8. AI Implementation Workflow Checklist

Sebelum menganggap implementasi selesai, pastikan AI Agent memverifikasi:
1. [ ] Memetakan kebutuhan ke Functional Requirement (`FR-01` s/d `FR-14`) di `PRD.md`.
2. [ ] Validasi otorisasi & RBAC di sisi backend (Super Admin / Admin / Anggota).
3. [ ] Validasi input di sisi server menggunakan Zod.
4. [ ] Mengimplementasikan skenario positif (Positive Acceptance Criteria).
5. [ ] Mengimplementasikan skenario negatif/edge cases (Negative Acceptance Criteria).
6. [ ] Memastikan compound index & idempotency (misal unique vote per election & session presence update).
7. [ ] Tidak melanggar batasan scope (tidak menambahkan fitur iuran/inventaris/pengumuman).
8. [ ] Menggunakan Bahasa Indonesia yang baku dan tema visual Biru Navy.
