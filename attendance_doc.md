# 📬 Postman Payload — API Attendance (Absensi) Admaja

> **Base URL**: `http://localhost:3000/api/attendance`  
> **Auth**: Cookie `token` (login terlebih dahulu, simpan cookie dari endpoint `/api/auth/login`)

---

## 🔐 Prasyarat — Login Dulu

**POST** `http://localhost:3000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "admin@admaja.com",
  "password": "password123"
}
```

> Simpan cookie `token` dari response. Di Postman: **Cookies** otomatis tersimpan jika menggunakan Cookie Jar.

---

## 📅 SESSIONS — `/api/attendance/sessions`

---

### 1. GET — Ambil Semua Sesi Kegiatan

**GET** `http://localhost:3000/api/attendance/sessions`

- Body: *(kosong)*

**Ekspektasi Response:**
```json
{
  "success": true,
  "message": "Daftar sesi absensi berhasil diambil",
  "data": [
    {
      "session_id": "SES-K8D3A1",
      "nama_kegiatan": "Latihan Rutin PBB",
      "desc_kegiatan": "Pemantapan gerakan dasar baris-berbaris",
      "date": "2026-09-06",
      "waktu_mulai": "15:30",
      "waktu_selesai": "17:30",
      "created_by": "ADM-001",
      "created_by_name": "Admin Paskibra",
      "rekap": {
        "hadir": 20,
        "izin": 2,
        "sakit": 1,
        "alpha": 0,
        "total_absen": 23,
        "total_anggota_aktif": 25
      }
    }
  ],
  "total": 1
}
```

---

### 2. POST — Buat Sesi Kegiatan Baru

**POST** `http://localhost:3000/api/attendance/sessions`

**Headers:** `Content-Type: application/json`

**Body Lengkap:**
```json
{
  "nama_kegiatan": "Latihan Rutin PBB Dasar",
  "desc_kegiatan": "Pemantapan formasi baris-berbaris dan evaluasi kerapian seragam anggota angkatan 2025.",
  "date": "2026-09-06",
  "waktu_mulai": "15:30",
  "waktu_selesai": "17:30"
}
```

**Body Minimal (hanya field wajib):**
```json
{
  "nama_kegiatan": "Latihan Upacara 17 Agustus",
  "date": "2026-09-07"
}
```

**Ekspektasi Response (201):**
```json
{
  "success": true,
  "message": "Sesi kegiatan berhasil dibuat. Sekarang dapat dilakukan pengisian presensi.",
  "data": {
    "session_id": "SES-K8D3A1",
    "nama_kegiatan": "Latihan Rutin PBB Dasar",
    "date": "2026-09-06",
    "waktu_mulai": "15:30",
    "waktu_selesai": "17:30",
    "created_by": "ADM-001",
    "created_by_name": "Admin Paskibra"
  }
}
```

**Negative — Nama terlalu pendek:**
```json
{
  "nama_kegiatan": "AB",
  "date": "2026-09-06"
}
```
> `400` — "Nama kegiatan minimal 3 karakter"

**Negative — Format tanggal salah:**
```json
{
  "nama_kegiatan": "Latihan PBB",
  "date": "06-09-2026"
}
```
> `400` — "Format tanggal harus YYYY-MM-DD"

---

### 3. GET — Detail Sesi + Daftar Presensi Member Aktif

**GET** `http://localhost:3000/api/attendance/sessions/SES-K8D3A1`

**Ekspektasi Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "session_id": "SES-K8D3A1",
      "nama_kegiatan": "Latihan Rutin PBB Dasar",
      "date": "2026-09-06",
      "waktu_mulai": "15:30",
      "waktu_selesai": "17:30"
    },
    "rekap": {
      "hadir": 20,
      "izin": 2,
      "sakit": 1,
      "alpha": 0,
      "belum_absen": 2,
      "total_member_aktif": 25
    },
    "members": [
      {
        "user_id": "USR-ABC123",
        "name": "Budi Santoso",
        "nisn": "1234567890",
        "kelas": "XII RPL 1",
        "angkatan": "2024",
        "status_member": "aktif",
        "presence_id": null,
        "status": null,
        "keterangan": "",
        "updated_at": null
      }
    ]
  }
}
```

---

### 4. PUT — Update Info Sesi Kegiatan

**PUT** `http://localhost:3000/api/attendance/sessions/SES-K8D3A1`

**Body (partial update):**
```json
{
  "nama_kegiatan": "Latihan Upacara Hari Kemerdekaan",
  "waktu_mulai": "07:00",
  "waktu_selesai": "10:00"
}
```

**Body (full update):**
```json
{
  "nama_kegiatan": "Latihan Gabungan PBB & Lagu",
  "desc_kegiatan": "Latihan gabungan persiapan event sekolah semester ganjil.",
  "date": "2026-09-10",
  "waktu_mulai": "14:00",
  "waktu_selesai": "17:00"
}
```

**Ekspektasi Response (200):**
```json
{
  "success": true,
  "message": "Data sesi kegiatan berhasil diperbarui"
}
```

---

### 5. DELETE — Hapus Sesi + Semua Presensinya

**DELETE** `http://localhost:3000/api/attendance/sessions/SES-K8D3A1`

- Body: *(kosong)*

**Ekspektasi Response (200):**
```json
{
  "success": true,
  "message": "Sesi kegiatan dan data presensi terkait berhasil dihapus"
}
```

**Negative — Session tidak ditemukan:**
> `404` — "Sesi kegiatan tidak ditemukan"

---

## ✅ PRESENSI — `/api/attendance`

---

### 6. GET — Statistik Kehadiran Organisasi (Default, tanpa query param)

**GET** `http://localhost:3000/api/attendance`

**Ekspektasi Response:**
```json
{
  "success": true,
  "message": "Statistik kehadiran berhasil diambil",
  "data": {
    "total_presences": 150,
    "hadir": 110,
    "izin": 20,
    "sakit": 12,
    "alpha": 8
  }
}
```

---

### 7. GET — Presensi per Sesi

**GET** `http://localhost:3000/api/attendance?session_id=SES-K8D3A1`

**Ekspektasi Response:**
```json
{
  "success": true,
  "message": "Data presensi sesi berhasil diambil",
  "data": [
    {
      "presences_id": "PRS-AB1234",
      "session_id": "SES-K8D3A1",
      "user_id": "USR-ABC123",
      "name": "Budi Santoso",
      "kelas": "XII RPL 1",
      "angkatan": "2024",
      "nisn": "1234567890",
      "status": "Hadir",
      "keterangan": "",
      "updated_at": "2026-09-06T10:30:00.000Z",
      "updated_by": "ADM-001"
    }
  ],
  "total": 1
}
```

---

### 8. GET — Riwayat Kehadiran per Anggota

**GET** `http://localhost:3000/api/attendance?user_id=USR-ABC123`

**Ekspektasi Response:**
```json
{
  "success": true,
  "message": "Riwayat kehadiran anggota berhasil diambil",
  "data": [
    {
      "presences_id": "PRS-AB1234",
      "session_id": "SES-K8D3A1",
      "nama_kegiatan": "Latihan Rutin PBB Dasar",
      "date": "2026-09-06",
      "status": "Hadir",
      "keterangan": "",
      "updated_at": "2026-09-06T10:30:00.000Z"
    },
    {
      "presences_id": "PRS-CD5678",
      "session_id": "SES-M2N4P6",
      "nama_kegiatan": "Latihan Upacara",
      "date": "2026-08-30",
      "status": "Izin",
      "keterangan": "Izin sakit demam",
      "updated_at": "2026-08-30T15:45:00.000Z"
    }
  ],
  "total": 2
}
```

---

### 9. POST — Input Presensi SINGLE (1 Anggota)

**POST** `http://localhost:3000/api/attendance`

**Headers:** `Content-Type: application/json`

**Body — Hadir:**
```json
{
  "session_id": "SES-K8D3A1",
  "user_id": "USR-ABC123",
  "status": "Hadir",
  "keterangan": ""
}
```

**Body — Izin:**
```json
{
  "session_id": "SES-K8D3A1",
  "user_id": "USR-DEF456",
  "status": "Izin",
  "keterangan": "Izin acara keluarga"
}
```

**Body — Sakit:**
```json
{
  "session_id": "SES-K8D3A1",
  "user_id": "USR-GHI789",
  "status": "Sakit",
  "keterangan": "Sakit demam, ada surat keterangan dokter"
}
```

**Body — Alpha:**
```json
{
  "session_id": "SES-K8D3A1",
  "user_id": "USR-JKL012",
  "status": "Alpha",
  "keterangan": ""
}
```

**Ekspektasi Response (200):**
```json
{
  "success": true,
  "message": "Presensi anggota 'Budi Santoso' berhasil dicatat sebagai 'Hadir'",
  "data": {
    "session_id": "SES-K8D3A1",
    "user_id": "USR-ABC123",
    "member_name": "Budi Santoso",
    "status": "Hadir",
    "keterangan": "",
    "updated_at": "2026-09-06T10:30:00.000Z"
  }
}
```

**Negative — Status tidak valid:**
```json
{
  "session_id": "SES-K8D3A1",
  "user_id": "USR-ABC123",
  "status": "Mangkir"
}
```
> `400` — "Status presensi harus berupa: Hadir, Izin, Sakit, atau Alpha"

**Negative — Sesi tidak ditemukan:**
```json
{
  "session_id": "SES-INVALID",
  "user_id": "USR-ABC123",
  "status": "Hadir"
}
```
> `404` — "Sesi kegiatan dengan ID '...' tidak ditemukan"

**Negative — Anggota tidak aktif:**
```json
{
  "session_id": "SES-K8D3A1",
  "user_id": "USR-NONAKTIF",
  "status": "Hadir"
}
```
> `400` — "Hanya anggota yang berstatus 'aktif' yang dapat diabsen"

**Negative — session_id kosong:**
```json
{
  "session_id": "",
  "user_id": "USR-ABC123",
  "status": "Hadir"
}
```
> `400` — "ID Sesi wajib diisi"

---

### 10. POST — Input Presensi BULK / MASSAL (Banyak Anggota Sekaligus)

**POST** `http://localhost:3000/api/attendance`

**Headers:** `Content-Type: application/json`

**Body — 5 Anggota Sekaligus:**
```json
{
  "session_id": "SES-K8D3A1",
  "attendances": [
    {
      "user_id": "USR-ABC123",
      "status": "Hadir",
      "keterangan": ""
    },
    {
      "user_id": "USR-DEF456",
      "status": "Hadir",
      "keterangan": ""
    },
    {
      "user_id": "USR-GHI789",
      "status": "Izin",
      "keterangan": "Izin keperluan keluarga"
    },
    {
      "user_id": "USR-JKL012",
      "status": "Sakit",
      "keterangan": "Sakit flu, sudah izin ke pembina"
    },
    {
      "user_id": "USR-MNO345",
      "status": "Alpha",
      "keterangan": ""
    }
  ]
}
```

**Ekspektasi Response (200) — Semua Berhasil:**
```json
{
  "success": true,
  "message": "Presensi berhasil disimpan: 5 anggota berhasil dicatat.",
  "processed_count": 5,
  "rejected_count": 0
}
```

**Ekspektasi Response — Sebagian Ditolak (ada anggota tidak aktif):**
```json
{
  "success": true,
  "message": "Presensi berhasil disimpan: 4 anggota berhasil dicatat.",
  "processed_count": 4,
  "rejected_count": 1,
  "rejected_members": [
    {
      "user_id": "USR-MNO345",
      "reason": "Status anggota 'Agus Wijaya' adalah 'tidak aktif' (hanya anggota aktif yang dapat diabsen)"
    }
  ]
}
```

**Negative — Array attendances kosong:**
```json
{
  "session_id": "SES-K8D3A1",
  "attendances": []
}
```
> `400` — "Daftar kehadiran minimal berisi 1 anggota"

**Negative — Status tidak valid dalam bulk:**
```json
{
  "session_id": "SES-K8D3A1",
  "attendances": [
    {
      "user_id": "USR-ABC123",
      "status": "Bolos"
    }
  ]
}
```
> `400` — "Status presensi harus berupa: Hadir, Izin, Sakit, atau Alpha"

---

### 11. DELETE — Reset / Batalkan Presensi Satu Anggota

**DELETE** `http://localhost:3000/api/attendance?session_id=SES-K8D3A1&user_id=USR-ABC123`

- Body: *(kosong)*

**Ekspektasi Response (200):**
```json
{
  "success": true,
  "message": "Catatan presensi berhasil direset / dibatalkan"
}
```

**Negative — Tanpa query params:**

`DELETE http://localhost:3000/api/attendance`
> `400` — "Parameter 'session_id' dan 'user_id' wajib disertakan"

**Negative — Record tidak ditemukan:**
> `404` — "Catatan presensi tidak ditemukan"

---

## 👥 MEMBERS — `/api/attendance/members`

---

### 12. GET — Daftar Anggota Aktif (tanpa status presensi)

**GET** `http://localhost:3000/api/attendance/members`

**Ekspektasi Response:**
```json
{
  "success": true,
  "message": "Daftar anggota aktif untuk presensi berhasil diambil",
  "data": [
    {
      "user_id": "USR-ABC123",
      "name": "Budi Santoso",
      "nisn": "1234567890",
      "kelas": "XII RPL 1",
      "angkatan": "2024",
      "status_member": "aktif",
      "status": null,
      "keterangan": "",
      "updated_at": null
    }
  ],
  "total": 25
}
```

---

### 13. GET — Anggota Aktif + Status Presensi pada Sesi Tertentu

**GET** `http://localhost:3000/api/attendance/members?session_id=SES-K8D3A1`

**Ekspektasi Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "USR-ABC123",
      "name": "Budi Santoso",
      "kelas": "XII RPL 1",
      "angkatan": "2024",
      "status_member": "aktif",
      "status": "Hadir",
      "keterangan": "",
      "updated_at": "2026-09-06T10:30:00.000Z"
    },
    {
      "user_id": "USR-DEF456",
      "name": "Siti Rahayu",
      "kelas": "XI TKJ 2",
      "angkatan": "2025",
      "status_member": "aktif",
      "status": null,
      "keterangan": "",
      "updated_at": null
    }
  ],
  "total": 25
}
```

---

## 📌 Ringkasan Endpoint & Method

| # | Method | URL | Keterangan |
|---|--------|-----|-----------|
| 1 | GET | `/api/attendance/sessions` | Semua sesi + rekap |
| 2 | POST | `/api/attendance/sessions` | Buat sesi baru |
| 3 | GET | `/api/attendance/sessions/:id` | Detail sesi + daftar member |
| 4 | PUT | `/api/attendance/sessions/:id` | Update info sesi |
| 5 | DELETE | `/api/attendance/sessions/:id` | Hapus sesi + presensinya |
| 6 | GET | `/api/attendance` | Statistik keseluruhan |
| 7 | GET | `/api/attendance?session_id=` | Presensi per sesi |
| 8 | GET | `/api/attendance?user_id=` | Riwayat per anggota |
| 9 | POST | `/api/attendance` | Input presensi single |
| 10 | POST | `/api/attendance` (+ `attendances[]`) | Input presensi bulk |
| 11 | DELETE | `/api/attendance?session_id=&user_id=` | Reset presensi anggota |
| 12 | GET | `/api/attendance/members` | Daftar anggota aktif |
| 13 | GET | `/api/attendance/members?session_id=` | Anggota + status presensi sesi |

---

## ⚠️ Catatan Penting

| Hal | Keterangan |
|-----|-----------|
| **Status Valid** | `Hadir`, `Izin`, `Sakit`, `Alpha` — case-sensitive |
| **Idempotent POST** | Bersifat upsert, tidak membuat duplikat record |
| **Bulk vs Single** | Jika ada key `attendances[]` → bulk; jika tidak → single |
| **Anggota Aktif** | Hanya `status: "aktif"` yang bisa diabsen |
| **Format Tanggal** | Wajib `YYYY-MM-DD` (contoh: `2026-09-06`) |
| **Auth** | Cookie `token` dari login. Di Postman: aktifkan **Cookie Jar** |
