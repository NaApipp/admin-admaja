"use client";

import { useState } from "react";
import { X, Download, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import { AttendanceSession, MemberAttendanceItem } from "../types";

interface ExportModalProps {
  sessions: AttendanceSession[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({
  sessions,
  isOpen,
  onClose,
}: ExportModalProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const rows: Array<{
        session_id: string;
        nama_kegiatan: string;
        tanggal: string;
        user_id: string;
        nama_anggota: string;
        kelas: string;
        angkatan: string;
        nisn: string;
        status: string;
        keterangan: string;
        waktu_update: string;
      }> = [];

      if (selectedSessionId === "all") {
        // Ambil data untuk semua sesi (maksimal 15 sesi terbaru agar cepat dan efisien)
        const targetSessions = sessions.slice(0, 15);
        if (targetSessions.length === 0) {
          setError("Belum ada sesi kegiatan untuk diexport.");
          setExporting(false);
          return;
        }

        for (const s of targetSessions) {
          const res = await fetch(`/api/attendance/sessions/${s.session_id}`);
          const json = await res.json();
          if (json.success && json.data && Array.isArray(json.data.members)) {
            json.data.members.forEach((m: MemberAttendanceItem) => {
              rows.push({
                session_id: s.session_id,
                nama_kegiatan: s.nama_kegiatan,
                tanggal: s.date,
                user_id: m.user_id,
                nama_anggota: m.name,
                kelas: m.kelas || "-",
                angkatan: m.angkatan || "-",
                nisn: m.nisn || "-",
                status: m.status || "Belum Absen",
                keterangan: m.keterangan || "-",
                waktu_update: m.updated_at ? new Date(m.updated_at).toLocaleString("id-ID") : "-",
              });
            });
          }
        }
      } else {
        const s = sessions.find((item) => item.session_id === selectedSessionId);
        const res = await fetch(`/api/attendance/sessions/${selectedSessionId}`);
        const json = await res.json();
        if (!json.success || !json.data || !Array.isArray(json.data.members)) {
          setError("Gagal mengambil data sesi untuk diexport.");
          setExporting(false);
          return;
        }

        json.data.members.forEach((m: MemberAttendanceItem) => {
          rows.push({
            session_id: selectedSessionId,
            nama_kegiatan: s?.nama_kegiatan || json.data.session.nama_kegiatan,
            tanggal: s?.date || json.data.session.date,
            user_id: m.user_id,
            nama_anggota: m.name,
            kelas: m.kelas || "-",
            angkatan: m.angkatan || "-",
            nisn: m.nisn || "-",
            status: m.status || "Belum Absen",
            keterangan: m.keterangan || "-",
            waktu_update: m.updated_at ? new Date(m.updated_at).toLocaleString("id-ID") : "-",
          });
        });
      }

      if (rows.length === 0) {
        setError("Tidak ada data presensi yang ditemukan untuk opsi ini.");
        setExporting(false);
        return;
      }

      // Format CSV string with BOM for Excel compatibility
      const headers = [
        "ID Sesi",
        "Nama Kegiatan",
        "Tanggal Kegiatan",
        "ID Anggota",
        "Nama Anggota",
        "Kelas",
        "Angkatan",
        "NISN",
        "Status Kehadiran",
        "Keterangan",
        "Waktu Terakhir Update",
      ];

      const csvContent =
        "\uFEFF" +
        [
          headers.join(";"),
          ...rows.map((r) =>
            [
              `"${r.session_id}"`,
              `"${r.nama_kegiatan.replace(/"/g, '""')}"`,
              `"${r.tanggal}"`,
              `"${r.user_id}"`,
              `"${r.nama_anggota.replace(/"/g, '""')}"`,
              `"${r.kelas}"`,
              `"${r.angkatan}"`,
              `"${r.nisn}"`,
              `"${r.status}"`,
              `"${r.keterangan.replace(/"/g, '""')}"`,
              `"${r.waktu_update}"`,
            ].join(";")
          ),
        ].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename =
        selectedSessionId === "all"
          ? `Rekap_Presensi_Paskibra_Semua_Sesi_${new Date().toISOString().split("T")[0]}.csv`
          : `Presensi_Paskibra_${selectedSessionId}_${new Date().toISOString().split("T")[0]}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onClose();
    } catch {
      setError("Terjadi kesalahan saat mengekspor data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#12172D] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0E1326]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Laporan Presensi</h2>
              <p className="text-xs text-slate-400">Download rekap data absensi format CSV / Excel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Sumber Data Presensi
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={exporting}
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-hidden focus:border-emerald-500 transition"
            >
              <option value="all">📊 Rekap Gabungan (Seluruh Sesi Terbaru)</option>
              {sessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  📅 {s.date} - {s.nama_kegiatan} ({s.session_id})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-white font-medium">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Format Kompatibel Excel & Spreadsheet</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400 pl-6">
              File CSV yang dihasilkan menggunakan delimiter titik-koma (;) dan UTF-8 BOM, sehingga otomatis terbuka rapi di Microsoft Excel, WPS Office, maupun Google Spreadsheet tanpa karakter rusak.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={exporting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengekspor...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
