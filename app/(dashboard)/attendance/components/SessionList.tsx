"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  UserCheck,
  Search,
  Edit2,
  Trash2,
  ArrowRight,
  User,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { AttendanceSession } from "../types";

interface SessionListProps {
  sessions: AttendanceSession[];
  loading: boolean;
  onEdit: (session: AttendanceSession) => void;
  onDelete: (session: AttendanceSession) => void;
  onExportSession: (session: AttendanceSession) => void;
  onCreateNew: () => void;
}

export default function SessionList({
  sessions,
  loading,
  onEdit,
  onDelete,
  onExportSession,
  onCreateNew,
}: SessionListProps) {
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Derive unique months for filter
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    sessions.forEach((s) => {
      if (s.date) {
        const ym = s.date.substring(0, 7); // YYYY-MM
        months.add(ym);
      }
    });
    return Array.from(months).sort().reverse();
  }, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.nama_kegiatan.toLowerCase().includes(q) ||
        s.session_id.toLowerCase().includes(q) ||
        s.date.includes(q) ||
        (s.created_by_name && s.created_by_name.toLowerCase().includes(q));

      const matchMonth =
        selectedMonth === "all" || s.date.startsWith(selectedMonth);

      return matchSearch && matchMonth;
    });
  }, [sessions, search, selectedMonth]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-slate-800/80 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#12172D] border border-slate-800 rounded-2xl p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="w-24 h-4 bg-slate-800 rounded"></div>
                <div className="w-16 h-4 bg-slate-800 rounded"></div>
              </div>
              <div className="w-3/4 h-6 bg-slate-800 rounded"></div>
              <div className="w-full h-12 bg-slate-800/50 rounded-xl"></div>
              <div className="w-full h-9 bg-slate-800 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#12172D]/90 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kegiatan / ID sesi..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {monthOptions.length > 0 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Semua Bulan</option>
              {monthOptions.map((ym) => (
                <option key={ym} value={ym}>
                  Bulan {ym}
                </option>
              ))}
            </select>
          )}

          {(search || selectedMonth !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedMonth("all");
              }}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredSessions.length === 0 ? (
        <div className="bg-[#12172D] border border-dashed border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              {search || selectedMonth !== "all"
                ? "Tidak ada sesi yang cocok dengan filter"
                : "Belum Ada Sesi Kegiatan Latihan"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {search || selectedMonth !== "all"
                ? "Coba ubah kata kunci pencarian atau pilih bulan lain."
                : "Buat sesi latihan baru untuk mulai menginput dan memantau kehadiran anggota paskibra."}
            </p>
          </div>
          {!search && selectedMonth === "all" && (
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <span>Buat Sesi Pertama</span>
            </button>
          )}
        </div>
      ) : (
        /* Sessions Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const rekap = session.rekap || {
              hadir: 0,
              izin: 0,
              sakit: 0,
              alpha: 0,
              total_absen: 0,
              total_anggota_aktif: 0,
            };

            const belumAbsen = Math.max(
              0,
              (rekap.total_anggota_aktif || 0) - (rekap.total_absen || 0)
            );

            return (
              <div
                key={session.session_id}
                className="bg-[#12172D] border border-slate-700/70 hover:border-slate-600 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg shadow-black/20 group"
              >
                <div>
                  {/* Top Badge: Date & Code */}
                  <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-medium text-[11px] bg-slate-800 text-blue-400 border border-slate-700/80">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      {session.date}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {session.session_id}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                    {session.nama_kegiatan}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px] leading-relaxed">
                    {session.desc_kegiatan || "Tidak ada keterangan tambahan kegiatan."}
                  </p>

                  {/* Time and Creator Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {session.waktu_mulai
                          ? `${session.waktu_mulai} - ${session.waktu_selesai || "Selesai"}`
                          : "Jam belum diset"}
                      </span>
                    </div>
                    {session.created_by_name && (
                      <div className="flex items-center gap-1 text-slate-400 max-w-[140px] truncate" title={`Dibuat oleh: ${session.created_by_name}`}>
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{session.created_by_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Attendance Stats Pills */}
                  <div className="grid grid-cols-4 gap-1.5 mt-4 p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-center">
                    <div className="p-1 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                      <div className="text-xs font-bold text-emerald-400">{rekap.hadir}</div>
                      <div className="text-[9px] text-emerald-400/80 uppercase font-semibold">Hadir</div>
                    </div>
                    <div className="p-1 rounded-lg bg-amber-950/30 border border-amber-500/20">
                      <div className="text-xs font-bold text-amber-400">{rekap.izin}</div>
                      <div className="text-[9px] text-amber-400/80 uppercase font-semibold">Izin</div>
                    </div>
                    <div className="p-1 rounded-lg bg-sky-950/30 border border-sky-500/20">
                      <div className="text-xs font-bold text-sky-400">{rekap.sakit}</div>
                      <div className="text-[9px] text-sky-400/80 uppercase font-semibold">Sakit</div>
                    </div>
                    <div className="p-1 rounded-lg bg-rose-950/30 border border-rose-500/20">
                      <div className="text-xs font-bold text-rose-400">{rekap.alpha}</div>
                      <div className="text-[9px] text-rose-400/80 uppercase font-semibold">Alpha</div>
                    </div>
                  </div>

                  {belumAbsen > 0 && (
                    <div className="text-[10px] text-amber-400/90 flex items-center justify-end gap-1 mt-1.5 font-medium pr-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{belumAbsen} anggota belum diabsen</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800">
                  <Link
                    href={`/attendance/session/${session.session_id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition active:scale-[0.98] cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Buka Absensi</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => onExportSession(session)}
                    title="Export Rekap Sesi Ini"
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition cursor-pointer border border-slate-700/60"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(session)}
                    title="Edit Informasi Sesi"
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition cursor-pointer border border-slate-700/60"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(session)}
                    title="Hapus Sesi Kegiatan"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer border border-slate-700/60"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
