"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";
import { AttendanceSession } from "../types";

interface DeleteConfirmModalProps {
  session: AttendanceSession | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (sessionId: string) => void;
}

export default function DeleteConfirmModal({
  session,
  isOpen,
  onClose,
  onDeleted,
}: DeleteConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance/sessions/${session.session_id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal menghapus sesi.");
        return;
      }

      onDeleted(session.session_id);
      onClose();
    } catch {
      setError("Terjadi kesalahan jaringan saat menghapus.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#12172D] border border-rose-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0E1326]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Hapus Sesi Kegiatan</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus sesi kegiatan{" "}
            <span className="font-bold text-white">&ldquo;{session.nama_kegiatan}&rdquo;</span>{" "}
            tanggal <span className="font-semibold text-slate-200">{session.date}</span>?
          </p>

          <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-[11px] text-rose-300 leading-relaxed">
            ⚠️ <span className="font-semibold">Peringatan:</span> Seluruh data catatan presensi anggota yang telah dimasukkan pada sesi ini juga akan ikut terhapus secara permanen.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition shadow-md shadow-rose-600/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Sesi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
