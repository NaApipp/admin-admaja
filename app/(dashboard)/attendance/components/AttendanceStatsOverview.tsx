"use client";

import { CheckCircle2, AlertCircle, HelpCircle, XCircle, Users, Activity } from "lucide-react";
import { AttendanceOverallStats } from "../types";

interface AttendanceStatsOverviewProps {
  stats: AttendanceOverallStats | null;
  totalSessions: number;
  totalActiveMembers: number;
  loading: boolean;
}

export default function AttendanceStatsOverview({
  stats,
  totalSessions,
  totalActiveMembers,
  loading,
}: AttendanceStatsOverviewProps) {
  const hadir = stats?.hadir || 0;
  const izin = stats?.izin || 0;
  const sakit = stats?.sakit || 0;
  const alpha = stats?.alpha || 0;
  const total = stats?.total_presences || (hadir + izin + sakit + alpha);

  const hadirPercent = total > 0 ? Math.round((hadir / total) * 100) : 0;
  const izinPercent = total > 0 ? Math.round((izin / total) * 100) : 0;
  const sakitPercent = total > 0 ? Math.round((sakit / total) * 100) : 0;
  const alphaPercent = total > 0 ? Math.round((alpha / total) * 100) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#12172D]/90 border border-slate-800 rounded-2xl p-4 animate-pulse h-28 flex flex-col justify-between"
          >
            <div className="w-8 h-8 bg-slate-800 rounded-xl"></div>
            <div className="space-y-1.5">
              <div className="w-12 h-5 bg-slate-800 rounded-sm"></div>
              <div className="w-20 h-3 bg-slate-800/60 rounded-sm"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Presensi */}
        <div className="bg-[#12172D] border border-slate-700/60 rounded-2xl p-4 hover:border-slate-600 transition shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Total Absen</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{total.toLocaleString("id-ID")}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Semua catatan log</div>
          </div>
        </div>

        {/* Hadir */}
        <div className="bg-[#12172D] border border-emerald-500/30 rounded-2xl p-4 hover:border-emerald-500/50 transition shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-400">Hadir</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400">{hadir.toLocaleString("id-ID")}</div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5 font-medium">{hadirPercent}% dari total</div>
          </div>
        </div>

        {/* Izin */}
        <div className="bg-[#12172D] border border-amber-500/30 rounded-2xl p-4 hover:border-amber-500/50 transition shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-400">Izin</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400">{izin.toLocaleString("id-ID")}</div>
            <div className="text-[10px] text-amber-300/80 mt-0.5 font-medium">{izinPercent}% dari total</div>
          </div>
        </div>

        {/* Sakit */}
        <div className="bg-[#12172D] border border-sky-500/30 rounded-2xl p-4 hover:border-sky-500/50 transition shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-sky-400">Sakit</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-sky-400">{sakit.toLocaleString("id-ID")}</div>
            <div className="text-[10px] text-sky-300/80 mt-0.5 font-medium">{sakitPercent}% dari total</div>
          </div>
        </div>

        {/* Alpha */}
        <div className="bg-[#12172D] border border-rose-500/30 rounded-2xl p-4 hover:border-rose-500/50 transition shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-400">Alpha</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-400">{alpha.toLocaleString("id-ID")}</div>
            <div className="text-[10px] text-rose-300/80 mt-0.5 font-medium">{alphaPercent}% dari total</div>
          </div>
        </div>

        {/* Anggota & Sesi */}
        <div className="bg-[#12172D] border border-indigo-500/30 rounded-2xl p-4 hover:border-indigo-500/50 transition shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-400">Sesi & Anggota</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{totalSessions} <span className="text-xs font-normal text-slate-400">sesi</span></div>
            <div className="text-[10px] text-indigo-300/90 mt-0.5 font-medium">{totalActiveMembers} anggota aktif</div>
          </div>
        </div>
      </div>

      {/* Mini Progress Bar Ratio */}
      {total > 0 && (
        <div className="bg-[#12172D]/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-2">
            <span>Rasio Distribusi Kehadiran Organisasi:</span>
            <span className="text-emerald-400 font-bold">{hadirPercent}% Tingkat Kehadiran (Hadir)</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${hadirPercent}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Hadir: ${hadir} (${hadirPercent}%)`}
            />
            <div
              style={{ width: `${izinPercent}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`Izin: ${izin} (${izinPercent}%)`}
            />
            <div
              style={{ width: `${sakitPercent}%` }}
              className="bg-sky-500 transition-all duration-500"
              title={`Sakit: ${sakit} (${sakitPercent}%)`}
            />
            <div
              style={{ width: `${alphaPercent}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`Alpha: ${alpha} (${alphaPercent}%)`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
