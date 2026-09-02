# Design System Guide

> Dokumen ini adalah sumber kebenaran (single source of truth) untuk desain UI di seluruh project. Ditulis agar bisa dibaca dan diikuti langsung oleh AI coding agent (Claude Code, Cursor, dll) saat generate atau mengubah komponen UI. Ikuti aturan di sini secara konsisten — jangan menciptakan token, warna, atau pola baru di luar yang didefinisikan tanpa alasan kuat.

## 1. Ringkasan

- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Mode:** Dark mode default (light mode opsional, ikuti token yang sama dengan varian terang jika ditambahkan nanti)
- **Filosofi:** Bersih, spesifik sesuai domain produk, hindari tampilan generic SaaS/glassmorphism, hierarki visual jelas, konsisten di semua halaman

---

## 2. Design Tokens

### 2.1 Warna

Definisikan sebagai CSS variable di `globals.css` dan mapping di `tailwind.config.ts`, jangan hardcode hex di komponen.

| Token | Hex | Peran |
|---|---|---|
| `--color-primary` | `#293681` | Brand utama — tombol utama, indikator aktif, ikon aksen |
| `--color-secondary` | `#14236F` | Pendukung primary — gradient, elemen sekunder, hover state |
| `--color-accent` | `#5B6EE8` | Varian terang dari primary — teks/ikon di atas dark surface, focus ring |
| `--color-bg` | `#0A0E1F` | Background halaman (page canvas) |
| `--color-surface` | `#11162B` | Background card, sidebar, panel |
| `--color-surface-alt` | `#161C36` | Hover state di atas surface |
| `--color-border` | `#1E2544` | Border/divider default |
| `--color-text-primary` | `#E9EBF5` | Teks utama |
| `--color-text-muted` | `#8890B3` | Teks sekunder/label/placeholder |
| `--color-success` | `#34D399` | Status berhasil/positif |
| `--color-warning` | `#FBBF24` | Status peringatan |
| `--color-danger` | `#F87171` | Status error/negatif |

**Aturan:**
- Jangan pakai warna semantic (success/warning/danger) untuk elemen non-status.
- Primary hanya untuk satu CTA utama per layar — elemen lain pakai secondary/outline/ghost.
- Kontras teks terhadap background minimal rasio 4.5:1 (WCAG AA).

### 2.2 Tipografi

| Level | Ukuran | Weight | Penggunaan |
|---|---|---|---|
| `text-2xl` (24px) | 500 | Judul halaman/angka statistik besar |
| `text-lg` (18px) | 500 | Judul section/card |
| `text-base` (16px) | 400 | Body text |
| `text-sm` (14px) | 400 | Teks sekunder, label form |
| `text-xs` (12px) | 400 | Caption, metadata, badge |

- Satu font family (sans-serif sistem/Inter). Jangan tambah font display tanpa alasan.
- Hindari huruf kapital semua (ALL CAPS) untuk label kecuali singkatan resmi.
- Line-height body: 1.6–1.7. Line length maksimal ±80 karakter untuk paragraf panjang.

### 2.3 Spacing & Radius

- Skala spacing ikut Tailwind default (4px increment): `p-1` s/d `p-8` untuk kebanyakan kasus.
- Radius: `rounded-lg` (8px) untuk button/input, `rounded-xl` (12px) untuk card, `rounded-full` untuk avatar/badge/pill.
- Gap antar card dalam grid: `gap-4` (16px). Padding dalam card: `p-4` s/d `p-5`.

### 2.4 Breakpoint

| Breakpoint | Lebar | Perilaku layout |
|---|---|---|
| `base` (mobile) | <1024px | Sidebar tersembunyi, top navbar + drawer overlay |
| `lg` | ≥1024px | Sidebar tetap tampil (fixed), collapsible |

---

## 3. Aturan Komponen

### 3.1 Button
- Varian: `primary` (fill `--color-primary`), `secondary` (border, transparent bg), `ghost` (tanpa border, hover surface-alt).
- Maksimal satu button `primary` per section/view.
- Ukuran default tinggi 40px (`h-10`), padding horizontal `px-4`.
- Selalu ada `focus-visible` ring (`--color-accent`) untuk aksesibilitas keyboard.

### 3.2 Card
- Background `--color-surface`, border `--color-border` 1px, radius `rounded-xl`, padding `p-4`–`p-5`.
- Jangan tumpuk shadow tebal — cukup border tipis untuk membedakan dari background.
- Metric/stat card: label kecil (`text-xs`, muted) di atas, angka besar (`text-2xl`, medium) di bawah, indikator perubahan (naik/turun) di kanan.

### 3.3 Tabel
- Header row: `text-xs`, `text-muted`, tanpa background solid, border-bottom saja.
- Row: border-top tipis antar baris, hover `--color-surface-alt`.
- Status pakai badge pill (`rounded-full`, bg tint semantic color, teks warna semantic yang sama, bukan hitam/putih polos).
- Untuk tabel lebar di layar sempit: bungkus dengan `overflow-x-auto`, jangan paksa compress kolom.

### 3.4 Form & Input
- Tinggi input konsisten dengan button (`h-10`), border `--color-border`, focus ring `--color-accent`.
- Label selalu di atas input (bukan placeholder-only), `text-sm`.
- Error state: border `--color-danger` + teks error di bawah field, bahasa jelas dan actionable (bukan pesan generik).

### 3.5 Navigasi (Sidebar/Navbar)
- Item aktif: indikator garis kiri (3px, `--color-accent`) + background tint primary, bukan background solid penuh.
- Ikon konsisten satu set (lucide-react), ukuran 18–20px.
- Sidebar desktop: collapsible ke mode icon-only (~76px). Mobile: drawer overlay dengan backdrop gelap, bisa ditutup via tap luar atau tombol close.

---

## 4. Struktur Folder & Konvensi Kode (Next.js + TS + Tailwind)

```
src/
  app/                  # routing (App Router)
    (dashboard)/
      page.tsx
      layout.tsx
  components/
    ui/                 # komponen dasar reusable (Button, Card, Input, Badge)
  lib/                  # utilitas, helper, fetcher
  styles/
    globals.css         # deklarasi CSS variable/token
  types/                # shared TypeScript types
```

**Konvensi:**
- Komponen UI dasar (`components/ui/`) tidak boleh mengandung logic bisnis — hanya presentasi + props.
- Nama komponen `PascalCase`, file sama dengan nama komponen (`DashboardLayout.tsx`).
- Semua komponen client interaktif diberi `"use client"` eksplisit di baris pertama.
- Warna, radius, spacing selalu lewat token/utility class Tailwind — dilarang inline hex baru di luar Section 2.1 kecuali disetujui dan ditambahkan ke token.
- Import ikon hanya dari satu library (`lucide-react`) untuk konsistensi visual.

---

## 5. Responsive & Aksesibilitas

- Mobile-first: desain default untuk layar sempit, lalu tambahkan `lg:` untuk desktop.
- Semua elemen interaktif (button, link, input) wajib punya state `hover`, `focus-visible`, dan `disabled` yang jelas secara visual.
- Kontras warna teks vs background minimal AA (4.5:1 untuk body text, 3:1 untuk teks besar/ikon).
- Gambar/ikon dekoratif: `aria-hidden="true"`. Ikon fungsional tanpa label teks: wajib `aria-label`.
- Motion/transisi maksimal 200ms, hormati `prefers-reduced-motion` — jangan animasi berlebihan di setiap elemen.

---

## 6. Panduan untuk AI Agent

Saat generate atau mengubah UI di project ini:

1. **Selalu cek dokumen ini dulu** sebelum menentukan warna, spacing, atau pola komponen baru.
2. **Jangan duplikasi komponen** — cek `components/ui/` dan `components/layout/` dulu sebelum membuat komponen baru yang mirip.
3. **Jangan mengubah token di Section 2** tanpa instruksi eksplisit dari user.
4. Saat ragu antara dua pendekatan desain, pilih yang lebih konsisten dengan pola yang sudah ada di codebase, bukan yang paling umum/generic di internet.
5. Setiap komponen baru yang dibuat wajib responsive (mobile + desktop) sesuai breakpoint di Section 2.4, tanpa perlu diminta ulang.
