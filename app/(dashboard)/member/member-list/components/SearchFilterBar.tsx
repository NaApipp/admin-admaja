"use client";

import { Search, X } from "lucide-react";
import { StatusFilter } from "./types";

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  angkatanFilter: string;
  onAngkatanChange: (value: string) => void;
  kelasFilter: string;
  onKelasChange: (value: string) => void;
  angkatanOptions: string[];
  kelasOptions: string[];
  totalFiltered: number;
  totalAll: number;
  onReset: () => void;
}

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "Semua", value: "semua" },
  { label: "Aktif", value: "aktif" },
  { label: "Tidak Aktif", value: "tidak aktif" },
  { label: "Purna", value: "purna" },
];

export default function SearchFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  angkatanFilter,
  onAngkatanChange,
  kelasFilter,
  onKelasChange,
  angkatanOptions,
  kelasOptions,
  totalFiltered,
  totalAll,
  onReset,
}: SearchFilterBarProps) {
  const hasActiveFilter =
    search || statusFilter !== "semua" || angkatanFilter || kelasFilter;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama, NISN..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2">
        {/* Status Filter Checkbox Pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                statusFilter === opt.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Angkatan Dropdown */}
        <select
          value={angkatanFilter}
          onChange={(e) => onAngkatanChange(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
        >
          <option value="">Semua Angkatan</option>
          {angkatanOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        {/* Kelas Dropdown */}
        <select
          value={kelasFilter}
          onChange={(e) => onKelasChange(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
        >
          <option value="">Semua Kelas</option>
          {kelasOptions.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {hasActiveFilter && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Result Count */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Menampilkan{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {totalFiltered}
        </span>{" "}
        dari{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {totalAll}
        </span>{" "}
        anggota
      </p>
    </div>
  );
}
