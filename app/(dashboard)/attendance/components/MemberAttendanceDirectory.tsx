"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, History, Users, Loader2, AlertCircle } from "lucide-react";
import MemberHistoryModal from "./MemberHistoryModal";

interface MemberItem {
  user_id: string;
  name: string;
  nisn?: string;
  kelas?: string;
  angkatan?: string;
  status_member?: string;
}

export default function MemberAttendanceDirectory() {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/attendance/members");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMembers(json.data);
        } else {
          setError(json.message || "Gagal memuat daftar anggota aktif");
        }
      } catch {
        setError("Gagal terhubung ke server");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.nisn && m.nisn.includes(q)) ||
        (m.kelas && m.kelas.toLowerCase().includes(q)) ||
        (m.angkatan && String(m.angkatan).includes(q))
    );
  }, [members, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#12172D]/90 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama anggota / kelas / NISN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-auto px-1">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>{filteredMembers.length} anggota aktif terdaftar</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          <p className="text-xs">Memuat direktori anggota aktif...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-10 text-center text-slate-500 bg-[#12172D] border border-dashed border-slate-800 rounded-2xl">
          Tidak ada anggota yang cocok dengan kata kunci &ldquo;{search}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMembers.map((member) => (
            <div
              key={member.user_id}
              className="bg-[#12172D] border border-slate-700/70 hover:border-blue-500/50 p-4 rounded-2xl transition flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20 font-bold text-xs flex items-center justify-center shrink-0">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition truncate">
                    {member.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {member.kelas ? `Kelas ${member.kelas}` : "Kelas -"} •{" "}
                    {member.angkatan ? `Angkatan ${member.angkatan}` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMember(member)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border border-slate-700/70 hover:border-blue-500/40 rounded-xl text-xs font-medium transition cursor-pointer shrink-0"
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Riwayat Modal */}
      <MemberHistoryModal
        member={selectedMember}
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}
