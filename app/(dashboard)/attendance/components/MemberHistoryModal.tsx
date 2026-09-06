"use client";

import { useState, useEffect } from "react";
import { X, Calendar, CheckCircle2, AlertCircle, HelpCircle, XCircle, Loader2 } from "lucide-react";
import { MemberAttendanceHistoryItem } from "../types";

interface MemberHistoryModalProps {
  member: { user_id: string; name: string; kelas?: string; nisn?: string; angkatan?: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberHistoryModal({
  member,
  isOpen,
  onClose,
}: MemberHistoryModalProps) {
  const [history, setHistory] = useState<MemberAttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member && isOpen) {
      const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/attendance?user_id=${member.user_id}`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setHistory(json.data);
          } else {
            setError(json.message || "Gagal mengambil histori kehadiran");
          }
        } catch {
          setError("Gagal menghubungi server");
        } finally {
          setLoading(false);
        }
      };

      fetchHistory();
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  // Calculate personal stats
  const hadirCount = history.filter((h) => h.status === "Hadir").length;
  const izinCount = history.filter((h) => h.status === "Izin").length;
  const sakitCount = history.filter((h) => h.status === "Sakit").length;
  const alphaCount = history.filter((h) => h.status === "Alpha").length;
  const total = history.length;
  const rate = total > 0 ? Math.round((hadirCount / total) * 100) : 0;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Hadir":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hadir
          </span>
        );
      case "Izin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Izin
          </span>
        );
      case "Sakit":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <HelpCircle className="w-3.5 h-3.5" />
            Sakit
          </span>
        );
      case "Alpha":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Alpha
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#12172D] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0E1326]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20">
              {member.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{member.name}</h2>
              <p className="text-xs text-slate-400">
                {member.kelas ? `Kelas ${member.kelas}` : ""} {member.angkatan ? `• Angkatan ${member.angkatan}` : ""} {member.nisn ? `• NISN ${member.nisn}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Personal Summary Stats */}
        <div className="p-5 border-b border-slate-800/80 bg-[#101528] grid grid-cols-5 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-lg font-black text-white">{total}</div>
            <div className="text-[10px] text-slate-400">Total Sesi</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
            <div className="text-lg font-black text-emerald-400">{hadirCount}</div>
            <div className="text-[10px] text-emerald-300">Hadir</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20">
            <div className="text-lg font-black text-amber-400">{izinCount}</div>
            <div className="text-[10px] text-amber-300">Izin</div>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-500/20">
            <div className="text-lg font-black text-sky-400">{sakitCount}</div>
            <div className="text-[10px] text-sky-300">Sakit</div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20">
            <div className="text-lg font-black text-rose-400">{alphaCount}</div>
            <div className="text-[10px] text-rose-300">Alpha</div>
          </div>
        </div>

        {/* History Table Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Log Riwayat Absensi ({total})
            </h3>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Kehadiran: {rate}%
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              <p className="text-xs">Memuat histori kehadiran anggota...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium">Belum ada catatan presensi</p>
              <p className="text-xs text-slate-600 mt-1">
                Anggota ini belum pernah tercatat dalam sesi kegiatan manapun.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              {history.map((item, idx) => (
                <div
                  key={item.presences_id || idx}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {item.nama_kegiatan}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({item.session_id})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{item.date}</span>
                      {item.keterangan && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-300 italic">&ldquo;{item.keterangan}&rdquo;</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>{renderStatusBadge(item.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0E1326] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
