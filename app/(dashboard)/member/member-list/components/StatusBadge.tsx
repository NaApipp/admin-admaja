"use client";

import { Member } from "./types";

interface StatusBadgeProps {
  status: Member["status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status?.toLowerCase()) {
    case "aktif":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Aktif
        </span>
      );
    case "tidak aktif":
    case "nonaktif":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-400 border border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Tidak Aktif
        </span>
      );
    case "purna":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/60 text-slate-400 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Purna
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          {status || "-"}
        </span>
      );
  }
}

interface StatusDropdownProps {
  userId: string;
  currentStatus: Member["status"];
  onUpdate: (userId: string, status: Member["status"]) => void;
  isLoading: boolean;
}

export function StatusDropdown({
  userId,
  currentStatus,
  onUpdate,
  isLoading,
}: StatusDropdownProps) {
  return (
    <select
      value={currentStatus}
      disabled={isLoading}
      onChange={(e) =>
        onUpdate(userId, e.target.value as Member["status"])
      }
      className="text-xs font-medium rounded-lg border border-slate-600 bg-slate-800 text-slate-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="aktif">Aktif</option>
      <option value="tidak aktif">Tidak Aktif</option>
      <option value="purna">Purna</option>
    </select>
  );
}
