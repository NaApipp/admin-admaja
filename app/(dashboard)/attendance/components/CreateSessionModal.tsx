"use client";

import { useState } from "react";
import { X, Calendar, Clock, BookOpen, FileText, Loader2 } from "lucide-react";
import { AttendanceSession } from "../types";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newSession: AttendanceSession) => void;
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  onCreated,
}: CreateSessionModalProps) {
  // Format today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [descKegiatan, setDescKegiatan] = useState("");
  const [date, setDate] = useState(todayStr);
  const [waktuMulai, setWaktuMulai] = useState("15:30");
  const [waktuSelesai, setWaktuSelesai] = useState("17:30");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!namaKegiatan.trim() || namaKegiatan.trim().length < 3) {
      setError("Nama kegiatan minimal 3 karakter.");
      return;
    }

    if (!date) {
      setError("Tanggal kegiatan wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_kegiatan: namaKegiatan.trim(),
          desc_kegiatan: descKegiatan.trim(),
          date,
          waktu_mulai: waktuMulai || "",
          waktu_selesai: waktuSelesai || "",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal membuat sesi kegiatan.");
        return;
      }

      // Reset form
      setNamaKegiatan("");
      setDescKegiatan("");
      setDate(todayStr);
      setWaktuMulai("15:30");
      setWaktuSelesai("17:30");

      onCreated(json.data);
      onClose();
    } catch {
      setError("Terjadi kesalahan jaringan. Coba beberapa saat lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#12172D] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0E1326]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Buat Sesi Kegiatan Baru</h2>
              <p className="text-xs text-slate-400">Siapkan sesi latihan untuk absensi anggota aktif</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <span className="font-semibold">Perhatian:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Nama Kegiatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Kegiatan / Latihan <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Contoh: Latihan Rutin PBB Dasar"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
                required
              />
            </div>
          </div>

          {/* Tanggal & Waktu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tanggal Sesi <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mulai
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  <input
                    type="time"
                    value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="w-full pl-8 pr-2 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Selesai
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  <input
                    type="time"
                    value={waktuSelesai}
                    onChange={(e) => setWaktuSelesai(e.target.value)}
                    className="w-full pl-8 pr-2 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi Kegiatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Keterangan / Agenda Kegiatan (Opsional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                value={descKegiatan}
                onChange={(e) => setDescKegiatan(e.target.value)}
                placeholder="Contoh: Pemantapan formasi baris-berbaris dan evaluasi kerapian seragam..."
                rows={3}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md shadow-blue-600/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat Sesi...</span>
                </>
              ) : (
                <span>Simpan Sesi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
