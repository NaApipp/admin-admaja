# CLAUDE.md — Project Guidelines for Admaja

This document serves as the single-point operational and technical guide for Claude when developing the **Admaja** (Dashboard Admin & Portal Anggota Paskibra SMKN 4 Kendal) repository.

---

## 1. Project Overview & Source of Truth

- **Source of Truth**: [`PRD.md`](file:///e:/admaja/admin_admaja/PRD.md)
- **Domain**: `admajaskanifo.org`
- **Client / User**: Paskibra SMKN 4 Kendal & Pembina / Sekolah
- **Core Modules**:
  1. **Dashboard Admin**: Panel Super Admin & Admin (Kelola Anggota, Kelola Admin, Sesi & Presensi, Rekap Absensi, Pemilu Ketua Organisasi, Password Saver Vault).
  2. **Portal Anggota**: Mobile-first Web App untuk Anggota (Login NIPD/Email, Riwayat Kehadiran Pribadi, Voting Pemilu Ketua).
- **Out of Scope (Strictly Forbidden)**: Keuangan/Iuran, Inventaris Alat/Seragam, Modul Pengumuman.

---

## 2. Common Commands

```bash
# Development server (Next.js 16)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Code linting
npm run lint
```

---

## 3. Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router), React 19, TypeScript (Strict)
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Database**: MongoDB (via `mongodb` native driver and/or `mongoose`)
- **Authentication**: JWT (`jose` / `jsonwebtoken`) disimpan dalam **HTTP-only cookie**
- **Password Security**: `bcryptjs` untuk password login (salt rounds >= 10)
- **Password Saver Vault**: Simetris AES-256 (IV + Auth tag) menggunakan `PASSWORD_SAVER_KEY` dari environment variables
- **Validation**: `zod` untuk server-side validation di seluruh API route handler

---

## 4. RBAC & Actor Rules

| Role | Target Collection | Akses |
| :--- | :--- | :--- |
| **Super Admin** | `user_admin` (`role: "super_admin"`) | Akses penuh Dashboard Admin + Kelola Akun Admin + Password Saver Vault |
| **Admin / Pembina** | `user_admin` (`role: "admin"`) | Akses Dashboard Admin (Anggota, Sesi, Absensi, Pemilu). *Tidak boleh akses Password Saver atau Kelola Admin lain*. |
| **Anggota / Siswa** | `user` | Akses Portal Anggota (Lihat Presensi Diri Sendiri, Voting Pemilu Aktif). *Tidak boleh akses Dashboard Admin*. |

---

## 5. Key Collections & Data Contracts

- **`user_admin`**: `user_id`, `name`, `email`, `password` (hash), `angkatan`, `role` (`"admin"` \| `"super_admin"`), `status` (`"aktif"` \| `"tidak aktif"` \| `"purna"`)
- **`user`**: `user_id`, `name`, `nipd` (unique), `email` (unique), `password` (hash), `angkatan`, `kelas`, `status` (`"aktif"` \| `"tidak aktif"` \| `"purna"`)
- **`sessions`**: `session_id`, `date`, `nama_kegiatan`, `desc_kegiatan`, `created_by`, `created_at`
- **`presences`**: `presences_id`, `session_id`, `user_id`, `status` (`"Hadir"` \| `"Izin"` \| `"Sakit"` \| `"Alpha"`), `updated_at` (Compound unique `session_id + user_id`)
- **`elections`**: `elections_id`, `name`, `tanggal_mulai`, `tanggal_selesai`, `status` (`"draft"` \| `"dibuka"` \| `"ditutup"`)
- **`candidates`**: `candidates_id`, `elections_id`, `serial_number`, `candidate_data`, `visi_misi`
- **`votes`**: `votes_id`, `elections_id`, `candidates_id`, `voter_id`, `vote_time` (Compound unique `elections_id + voter_id` — voting tercatat untuk audit, bukan anonim)
- **`vault_credentials`**: `id`, `account_name`, `platform`, `username`, `encrypted_password`, `created_by`, `updated_at`

---

## 6. API Route & Backend Conventions

- **Base Path**: `/api/v1`
- **Status Codes**:
  - `200` / `201`: Success
  - `400`: Bad Request / Zod schema validation error
  - `401`: Unauthorized (Invalid or missing JWT token)
  - `403`: Forbidden (Role unauthorized)
  - `409`: Conflict (Contoh: Percobaan vote kedua kali oleh user yang sama)
  - `500`: Internal Server Error
- **Always Validate Server-Side**:
  - Jangan pernah percaya data client. Validasi Zod di setiap route handler.
  - Periksa status pemilihan sebelum menerima submit suara (harus `"dibuka"`).
  - Saat mengedit status presensi, selalu lakukan *update* pada record yang ada, bukan membuat record duplikat.
  - Saat mengubah status anggota menjadi `tidak aktif` atau `purna`, pertahankan histori data presensi lama.

---

## 7. UI/UX & Design Guidelines

- **Primary Color Theme**: **Biru Navy** (e.g. `#0B192C`, `#1E3E62`, `#001F3F`), latar Slate/Putih, teks kontras tinggi.
- **Language**: **Bahasa Indonesia** di seluruh UI & pesan feedback/validasi.
- **Status Colors (Presensi)**:
  - `Hadir`: Hijau
  - `Izin`: Kuning / Amber
  - `Sakit`: Biru
  - `Alpha`: Merah
- **Dashboard Admin**: Desktop-first, sidebar layout, table/list data, quick actions untuk input presensi cepat (< 2 menit di lapangan).
- **Portal Anggota**: Mobile-first, bottom navigation, touch targets >= 44x44px, alur voting: *Daftar Kandidat → Detail Visi Misi → Konfirmasi Pilihan → Halaman Sukses / Status Sudah Memilih*.
- **Resilience**: Debounce / disable tombol saat request berjalan untuk mencegah double-tap / double-submit pada koneksi lapangan yang lambat.
