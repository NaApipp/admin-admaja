"use client";

import { ShieldCheck, KeyRound, Globe, Clock } from "lucide-react";

interface VaultItem {
  id?: string;
  vault_id?: string;
  account_name: string;
  platform: string;
  username: string;
  password?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface VaultStatsProps {
  items: VaultItem[];
}

export default function VaultStats({ items }: VaultStatsProps) {
  const totalCredentials = items.length;
  const uniquePlatforms = new Set(items.map((i) => i.platform.toLowerCase())).size;

  const latestUpdate = items.length > 0 && items[0].updated_at
    ? new Date(items[0].updated_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Total Credentials */}
      <div className="relative group overflow-hidden bg-gradient-to-br from-[#1e3a8a]/60 to-[#172554]/60 border border-blue-500/20 p-5 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-blue-500/40">
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            Vault Total
          </span>
        </div>
        <div className="mt-4">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Total Kredensial
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {totalCredentials}
            </h3>
            <span className="text-white/40 text-xs">Akun Tersimpan</span>
          </div>
        </div>
      </div>

      {/* Unique Platforms */}
      <div className="relative group overflow-hidden bg-gradient-to-br from-[#1e293b]/60 to-[#0f172a]/60 border border-slate-700/50 p-5 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-slate-600">
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Platform
          </span>
        </div>
        <div className="mt-4">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Platform Terhubung
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {uniquePlatforms}
            </h3>
            <span className="text-white/40 text-xs">Layanan</span>
          </div>
        </div>
      </div>

      {/* Security Engine */}
      {/* <div className="relative group overflow-hidden bg-gradient-to-br from-[#1e1b4b]/60 to-[#0f172a]/60 border border-indigo-500/20 p-5 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/40">
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            Enkripsi
          </span>
        </div>
        <div className="mt-4">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Sistem Keamanan
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-lg font-bold text-white tracking-tight truncate">
              AES-256-GCM
            </h3>
          </div>
          <span className="text-indigo-300/60 text-[11px] font-medium block mt-0.5">
            Key Terisolasi di Env
          </span>
        </div>
      </div> */}

      {/* Last Updated */}
      <div className="relative group overflow-hidden bg-gradient-to-br from-[#1e293b]/60 to-[#0f172a]/60 border border-slate-700/50 p-5 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-slate-600">
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Aktivitas
          </span>
        </div>
        <div className="mt-4">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Terakhir Diperbarui
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-lg font-bold text-white tracking-tight">
              {latestUpdate}
            </h3>
          </div>
          <span className="text-white/40 text-[11px] block mt-0.5">
            Sinkronisasi Otomatis
          </span>
        </div>
      </div>
    </div>
  );
}
