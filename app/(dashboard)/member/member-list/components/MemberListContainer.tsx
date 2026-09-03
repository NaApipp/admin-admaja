"use client";

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Member, StatusFilter } from "./types";
import SearchFilterBar from "./SearchFilterBar";
import MemberTable from "./MemberTable";

export default function MemberListContainer() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [angkatanFilter, setAngkatanFilter] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/member");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMembers(data.data);
      } else {
        setError(data.message || "Gagal memuat data anggota");
      }
    } catch {
      setError("Terjadi kesalahan koneksi. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Derive unique dropdown options from data
  const angkatanOptions = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.angkatan))).sort(
      (a, b) => Number(b) - Number(a),
    );
  }, [members]);

  const kelasOptions = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.kelas))).sort();
  }, [members]);

  // Filtered result
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.nisn.includes(q);

      const matchStatus =
        statusFilter === "semua" ||
        m.status === statusFilter ||
        (statusFilter === "tidak aktif" &&
          (m.status === "tidak aktif" || m.status === "nonaktif"));

      const matchAngkatan = !angkatanFilter || m.angkatan === angkatanFilter;
      const matchKelas = !kelasFilter || m.kelas === kelasFilter;

      return matchSearch && matchStatus && matchAngkatan && matchKelas;
    });
  }, [members, search, statusFilter, angkatanFilter, kelasFilter]);

  const handleReset = () => {
    setSearch("");
    setStatusFilter("semua");
    setAngkatanFilter("");
    setKelasFilter("");
  };

  const handleStatusUpdate = async (userId: string, status: Member["status"]) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/member/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.user_id === userId ? { ...m, status } : m,
          ),
        );
      } else {
        alert(data.message || "Gagal memperbarui status.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus anggota "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;

    setDeletingId(userId);
    try {
      const res = await fetch(`/api/member/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      } else {
        alert(data.message || "Gagal menghapus anggota.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        angkatanFilter={angkatanFilter}
        onAngkatanChange={setAngkatanFilter}
        kelasFilter={kelasFilter}
        onKelasChange={setKelasFilter}
        angkatanOptions={angkatanOptions}
        kelasOptions={kelasOptions}
        totalFiltered={filteredMembers.length}
        totalAll={members.length}
        onReset={handleReset}
      />

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchMembers}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold hover:text-rose-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-slate-800/50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <MemberTable
          members={filteredMembers}
          updatingId={updatingId}
          deletingId={deletingId}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
