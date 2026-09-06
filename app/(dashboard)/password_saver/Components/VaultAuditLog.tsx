"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw, ShieldAlert, CheckCircle2, Edit2, Trash2 } from "lucide-react";

interface AuditLog {
  _id?: string;
  audit_id: string;
  vault_id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | string;
  performed_by: string;
  performed_by_name?: string;
  details: string;
  timestamp: string;
}

export default function VaultAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault?type=audit");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil audit log:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            CREATE
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Edit2 className="w-3 h-3" />
            UPDATE
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3 h-3" />
            DELETE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#12172D] border border-white/10 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          {/* <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <History className="w-5 h-5" />
          </div> */}
          <div>
            <h3 className="text-base font-bold text-white">Riwayat Audit Log Vault</h3>
            <p className="text-xs text-slate-400">
              Pencatatan otomatis setiap aksi perubahan kredensial untuk keamanan & akuntabilitas
            </p>
          </div>
        </div>
        {/* <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan</span>
        </button> */}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <RefreshCw className="w-7 h-7 text-blue-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Mengambil catatan audit log...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <ShieldAlert className="w-8 h-8 text-slate-500 mb-2" />
          <p className="text-sm font-semibold text-white">Belum Ada Aktivitas Audit</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Semua penambahan, pembaruan, atau penghapusan kredensial akan tercatat di sini secara otomatis.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Waktu (WIB)</th>
                <th className="py-3 px-3">Aksi</th>
                <th className="py-3 px-3">Pelaksana</th>
                <th className="py-3 px-3">Detail Aktivitas</th>
                <th className="py-3 px-3 text-right">ID Vault</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {logs.map((log) => (
                <tr key={log.audit_id || log._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-white">
                      {log.performed_by_name || "Super Admin"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {log.performed_by}
                    </div>
                  </td>
                  <td className="py-3 px-3 max-w-md">
                    <span className="text-slate-200">{log.details}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[10px] text-blue-400 whitespace-nowrap">
                    {log.vault_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
