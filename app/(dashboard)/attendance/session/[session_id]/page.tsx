"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Search,
  Save,
  RotateCcw,
  Download,
  Edit2,
  Trash2,
  Loader2,
  CheckCheck,
  Check,
  Info,
} from "lucide-react";
import {
  AttendanceSession,
  MemberAttendanceItem,
  PresenceStatus,
} from "../../types";
import EditSessionModal from "../../components/EditSessionModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";

interface PageProps {
  params: Promise<{ session_id: string }>;
}

export default function SessionAttendancePage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const sessionId = resolvedParams.session_id;

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [members, setMembers] = useState<MemberAttendanceItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingBatch, setSavingBatch] = useState(false);
  const [savingSingleId, setSavingSingleId] = useState<string | null>(null);
  const [resettingSingleId, setResettingSingleId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Edit / Delete session modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Local draft state for attendance (tracking unsaved changes)
  // Map of userId -> { status: PresenceStatus | null, keterangan: string, dirty: boolean }
  const [drafts, setDrafts] = useState<
    Record<string, { status: PresenceStatus | null; keterangan: string; dirty: boolean }>
  >({});

  // Search and filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [kelasFilter, setKelasFilter] = useState<string>("semua");
  const [angkatanFilter, setAngkatanFilter] = useState<string>("semua");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch(`/api/attendance/sessions/${sessionId}`);
        const json = await res.json();

        if (ignore) return;

        if (!res.ok || !json.success || !json.data) {
          setFeedbackMsg({
            text: json.message || "Sesi kegiatan tidak ditemukan.",
            type: "error",
          });
          return;
        }

        setSession(json.data.session);
        setMembers(json.data.members || []);

        const initialDrafts: Record<
          string,
          { status: PresenceStatus | null; keterangan: string; dirty: boolean }
        > = {};
        (json.data.members || []).forEach((m: MemberAttendanceItem) => {
          initialDrafts[m.user_id] = {
            status: m.status,
            keterangan: m.keterangan || "",
            dirty: false,
          };
        });
        setDrafts(initialDrafts);
      } catch {
        if (!ignore) {
          setFeedbackMsg({
            text: "Terjadi kesalahan saat memuat data sesi kegiatan.",
            type: "error",
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [sessionId]);

  // Derive unique dropdown options
  const uniqueKelas = useMemo(() => {
    const list = Array.from(new Set(members.map((m) => m.kelas).filter(Boolean)));
    return list.sort();
  }, [members]);

  const uniqueAngkatan = useMemo(() => {
    const list = Array.from(new Set(members.map((m) => m.angkatan).filter(Boolean)));
    return list.sort();
  }, [members]);

  // Check how many items have unsaved changes
  const dirtyCount = useMemo(() => {
    return Object.values(drafts).filter((d) => d.dirty).length;
  }, [drafts]);

  // Live calculated stats based on current drafts
  const liveStats = useMemo(() => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpha = 0;
    let belum = 0;

    members.forEach((m) => {
      const d = drafts[m.user_id];
      const st = d ? d.status : m.status;
      if (st === "Hadir") hadir++;
      else if (st === "Izin") izin++;
      else if (st === "Sakit") sakit++;
      else if (st === "Alpha") alpha++;
      else belum++;
    });

    return { hadir, izin, sakit, alpha, belum, total: members.length };
  }, [members, drafts]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.nisn && m.nisn.includes(q)) ||
        (m.kelas && m.kelas.toLowerCase().includes(q));

      const d = drafts[m.user_id];
      const currentStatus = d ? d.status : m.status;

      let matchStatus = true;
      if (statusFilter === "Belum Absen") {
        matchStatus = currentStatus === null;
      } else if (statusFilter !== "semua") {
        matchStatus = currentStatus === statusFilter;
      }

      const matchKelas = kelasFilter === "semua" || m.kelas === kelasFilter;
      const matchAngkatan = angkatanFilter === "semua" || m.angkatan === angkatanFilter;

      return matchSearch && matchStatus && matchKelas && matchAngkatan;
    });
  }, [members, drafts, search, statusFilter, kelasFilter, angkatanFilter]);

  // Update status for an individual member in drafts
  const handleStatusChange = (userId: string, newStatus: PresenceStatus) => {
    setDrafts((prev) => {
      const cur = prev[userId] || { status: null, keterangan: "", dirty: false };
      // Toggle off if same clicked, or set new
      const nextStatus = cur.status === newStatus ? null : newStatus;
      return {
        ...prev,
        [userId]: {
          ...cur,
          status: nextStatus,
          dirty: true,
        },
      };
    });
  };

  // Update keterangan for an individual member in drafts
  const handleKeteranganChange = (userId: string, keterangan: string) => {
    setDrafts((prev) => {
      const cur = prev[userId] || { status: null, keterangan: "", dirty: false };
      return {
        ...prev,
        [userId]: {
          ...cur,
          keterangan,
          dirty: true,
        },
      };
    });
  };

  // Quick Action: Tandai Semua Hadir (menandai semua member yang statusnya belum diisi / atau semua)
  const handleMarkAllHadir = () => {
    setDrafts((prev) => {
      const updated = { ...prev };
      members.forEach((m) => {
        updated[m.user_id] = {
          status: "Hadir",
          keterangan: updated[m.user_id]?.keterangan || "",
          dirty: true,
        };
      });
      return updated;
    });
  };

  // Quick Action: Tandai yang Belum Absen jadi Alpha
  const handleMarkUnmarkedAsAlpha = () => {
    setDrafts((prev) => {
      const updated = { ...prev };
      members.forEach((m) => {
        const cur = updated[m.user_id];
        if (!cur || cur.status === null) {
          updated[m.user_id] = {
            status: "Alpha",
            keterangan: cur?.keterangan || "Tanpa Keterangan",
            dirty: true,
          };
        }
      });
      return updated;
    });
  };

  // Reset Drafts to server state
  const handleResetDrafts = () => {
    const freshDrafts: Record<
      string,
      { status: PresenceStatus | null; keterangan: string; dirty: boolean }
    > = {};
    members.forEach((m) => {
      freshDrafts[m.user_id] = {
        status: m.status,
        keterangan: m.keterangan || "",
        dirty: false,
      };
    });
    setDrafts(freshDrafts);
  };

  // Save Single Member Attendance to API
  const handleSaveSingle = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft || !draft.status) {
      alert("Pilih salah satu status (Hadir, Izin, Sakit, atau Alpha) terlebih dahulu.");
      return;
    }

    setSavingSingleId(userId);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          status: draft.status,
          keterangan: draft.keterangan || "",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFeedbackMsg({
          text: json.message || "Gagal menyimpan presensi anggota.",
          type: "error",
        });
        return;
      }

      // Mark this user as not dirty
      setDrafts((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], dirty: false },
      }));

      // Update members array
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === userId
            ? {
                ...m,
                status: draft.status,
                keterangan: draft.keterangan,
                updated_at: new Date().toISOString(),
              }
            : m
        )
      );

      setFeedbackMsg({
        text: json.message || "Presensi berhasil dicatat.",
        type: "success",
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({
        text: "Terjadi kesalahan jaringan saat menyimpan.",
        type: "error",
      });
    } finally {
      setSavingSingleId(null);
    }
  };

  // Reset / Delete Single Member Attendance Record (DELETE /api/attendance)
  const handleResetSinglePresence = async (userId: string) => {
    if (!confirm("Hapus catatan presensi anggota ini untuk sesi ini?")) return;

    setResettingSingleId(userId);
    setFeedbackMsg(null);

    try {
      const res = await fetch(
        `/api/attendance?session_id=${sessionId}&user_id=${userId}`,
        { method: "DELETE" }
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        setFeedbackMsg({
          text: json.message || "Gagal menghapus presensi.",
          type: "error",
        });
        return;
      }

      setDrafts((prev) => ({
        ...prev,
        [userId]: { status: null, keterangan: "", dirty: false },
      }));

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === userId
            ? { ...m, status: null, keterangan: "", updated_at: null }
            : m
        )
      );

      setFeedbackMsg({
        text: "Presensi anggota berhasil direset.",
        type: "success",
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({
        text: "Terjadi kesalahan jaringan saat mereset presensi.",
        type: "error",
      });
    } finally {
      setResettingSingleId(null);
    }
  };

  // Batch Save all members that have a selected status
  const handleSaveBatch = async () => {
    // Gather all members who have status selected
    const attendancesToSave: Array<{
      user_id: string;
      status: PresenceStatus;
      keterangan: string;
    }> = [];

    members.forEach((m) => {
      const d = drafts[m.user_id];
      if (d && d.status) {
        attendancesToSave.push({
          user_id: m.user_id,
          status: d.status,
          keterangan: d.keterangan || "",
        });
      }
    });

    if (attendancesToSave.length === 0) {
      alert("Belum ada anggota yang dipilih status kehadirannya.");
      return;
    }

    setSavingBatch(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          attendances: attendancesToSave,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFeedbackMsg({
          text: json.message || "Gagal menyimpan presensi massal.",
          type: "error",
        });
        return;
      }

      // Mark all saved drafts as clean
      setDrafts((prev) => {
        const next = { ...prev };
        attendancesToSave.forEach((item) => {
          if (next[item.user_id]) {
            next[item.user_id] = { ...next[item.user_id], dirty: false };
          }
        });
        return next;
      });

      // Update members
      setMembers((prev) =>
        prev.map((m) => {
          const saved = attendancesToSave.find((x) => x.user_id === m.user_id);
          if (saved) {
            return {
              ...m,
              status: saved.status,
              keterangan: saved.keterangan,
              updated_at: new Date().toISOString(),
            };
          }
          return m;
        })
      );

      setFeedbackMsg({
        text: json.message || "Seluruh presensi berhasil disimpan.",
        type: "success",
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch {
      setFeedbackMsg({
        text: "Terjadi kesalahan jaringan saat menyimpan presensi massal.",
        type: "error",
      });
    } finally {
      setSavingBatch(false);
    }
  };

  // Export CSV for this session
  const handleExportCSV = () => {
    if (!session) return;
    const headers = [
      "ID Sesi",
      "Nama Kegiatan",
      "Tanggal",
      "ID Anggota",
      "Nama Anggota",
      "Kelas",
      "Angkatan",
      "NISN",
      "Status Presensi",
      "Keterangan",
      "Waktu Terakhir Update",
    ];

    const rows = members.map((m) => {
      const d = drafts[m.user_id];
      const st = d ? d.status || "Belum Absen" : m.status || "Belum Absen";
      const ket = d ? d.keterangan || "-" : m.keterangan || "-";
      return [
        `"${session.session_id}"`,
        `"${session.nama_kegiatan.replace(/"/g, '""')}"`,
        `"${session.date}"`,
        `"${m.user_id}"`,
        `"${m.name.replace(/"/g, '""')}"`,
        `"${m.kelas || "-"}"`,
        `"${m.angkatan || "-"}"`,
        `"${m.nisn || "-"}"`,
        `"${st}"`,
        `"${ket.replace(/"/g, '""')}"`,
        `"${m.updated_at ? new Date(m.updated_at).toLocaleString("id-ID") : "-"}"`,
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute(
      "download",
      `Presensi_${session.session_id}_${session.date}.csv`
    );
    link.setAttribute("href", url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm font-semibold text-slate-300">
          Memuat sesi kegiatan dan daftar presensi anggota...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center space-y-4">
        <div className="p-8 bg-[#12172D] border border-slate-800 rounded-2xl max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white">Sesi Kegiatan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sesi dengan kode &ldquo;{sessionId}&rdquo; tidak ditemukan atau sudah dihapus.
          </p>
          <Link
            href="/attendance"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Presensi</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Breadcrumb and Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/attendance"
            className="p-2.5 rounded-xl border border-slate-700/80 bg-[#12172D] text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {session.session_id}
              </span>
              <span className="text-xs text-slate-400">Sesi Latihan Paskibra</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
              {session.nama_kegiatan}
            </h1>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs transition active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700/80 bg-[#12172D] hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Info Sesi</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
            title="Hapus Sesi Ini"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 transition animate-in fade-in ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Session Metadata & Live Counter Card */}
      <div className="bg-[#12172D] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs text-slate-300 leading-relaxed">
              {session.desc_kegiatan || "Tidak ada rincian agenda tambahan untuk sesi ini."}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-white font-medium">{session.date}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {session.waktu_mulai
                    ? `${session.waktu_mulai} - ${session.waktu_selesai || "Selesai"}`
                    : "Waktu tidak dicantumkan"}
                </span>
              </span>
              {session.created_by_name && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dibuat oleh: {session.created_by_name}</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Field Operations */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleMarkAllHadir}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold transition active:scale-[0.98] cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Semua Hadir</span>
            </button>

            <button
              type="button"
              onClick={handleMarkUnmarkedAsAlpha}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold transition active:scale-[0.98] cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Sisa jadi Alpha</span>
            </button>

            {dirtyCount > 0 && (
              <button
                type="button"
                onClick={handleResetDrafts}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Draft</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-center">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="text-xl font-black text-white">{liveStats.total}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Anggota</div>
          </div>

          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
            <div className="text-xl font-black text-emerald-400">{liveStats.hadir}</div>
            <div className="text-[10px] text-emerald-400/90 font-semibold uppercase">Hadir</div>
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl">
            <div className="text-xl font-black text-amber-400">{liveStats.izin}</div>
            <div className="text-[10px] text-amber-400/90 font-semibold uppercase">Izin</div>
          </div>

          <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl">
            <div className="text-xl font-black text-sky-400">{liveStats.sakit}</div>
            <div className="text-[10px] text-sky-400/90 font-semibold uppercase">Sakit</div>
          </div>

          <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl">
            <div className="text-xl font-black text-rose-400">{liveStats.alpha}</div>
            <div className="text-[10px] text-rose-400/90 font-semibold uppercase">Alpha</div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl">
            <div className="text-xl font-black text-slate-300">{liveStats.belum}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Belum Absen</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#12172D]/90 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama anggota / kelas..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
          >
            <option value="semua">Semua Status ({members.length})</option>
            <option value="Hadir">Hadir ({liveStats.hadir})</option>
            <option value="Izin">Izin ({liveStats.izin})</option>
            <option value="Sakit">Sakit ({liveStats.sakit})</option>
            <option value="Alpha">Alpha ({liveStats.alpha})</option>
            <option value="Belum Absen">Belum Absen ({liveStats.belum})</option>
          </select>

          {/* Kelas Filter */}
          {uniqueKelas.length > 0 && (
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
            >
              <option value="semua">Semua Kelas</option>
              {uniqueKelas.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          )}

          {/* Angkatan Filter */}
          {uniqueAngkatan.length > 0 && (
            <select
              value={angkatanFilter}
              onChange={(e) => setAngkatanFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
            >
              <option value="semua">Semua Angkatan</option>
              {uniqueAngkatan.map((a) => (
                <option key={a} value={a}>
                  Angkatan {a}
                </option>
              ))}
            </select>
          )}

          {(search || statusFilter !== "semua" || kelasFilter !== "semua" || angkatanFilter !== "semua") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("semua");
                setKelasFilter("semua");
                setAngkatanFilter("semua");
              }}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Roster Attendance Table / List */}
      <div className="bg-[#12172D] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-[#0E1326] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Daftar Anggota Aktif
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-semibold">
              Menampilkan {filteredMembers.length} dari {members.length}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 hidden sm:block">
            * Hanya anggota dengan status <span className="text-emerald-400 font-medium">&apos;aktif&apos;</span> yang dapat diabsen
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Info className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">
              Tidak ada anggota yang memenuhi kriteria pencarian / filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredMembers.map((member, index) => {
              const draft = drafts[member.user_id] || {
                status: member.status,
                keterangan: member.keterangan || "",
                dirty: false,
              };

              const currentStatus = draft.status;
              const isDirty = draft.dirty;
              const isSavingThis = savingSingleId === member.user_id;
              const isResettingThis = resettingSingleId === member.user_id;

              return (
                <div
                  key={member.user_id}
                  className={`p-4 transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isDirty
                      ? "bg-blue-950/20 border-l-4 border-l-blue-500"
                      : "hover:bg-slate-800/25"
                  }`}
                >
                  {/* Member Info */}
                  <div className="flex items-center gap-3.5 min-w-[280px]">
                    <span className="text-xs font-mono text-slate-500 w-6 text-center">
                      {index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-blue-400 border border-slate-700/80 font-bold text-xs flex items-center justify-center shrink-0">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{member.name}</span>
                        {isDirty && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Belum Disimpan
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{member.kelas ? `Kelas ${member.kelas}` : "-"}</span>
                        <span>•</span>
                        <span>{member.angkatan ? `Angkatan ${member.angkatan}` : ""}</span>
                        {member.nisn && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{member.nisn}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4-Way Presence Status Selector Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Hadir */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(member.user_id, "Hadir")}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        currentStatus === "Hadir"
                          ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/25 scale-[1.03]"
                          : "bg-emerald-950/20 text-emerald-400/80 border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Hadir</span>
                    </button>

                    {/* Izin */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(member.user_id, "Izin")}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        currentStatus === "Izin"
                          ? "bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/25 scale-[1.03]"
                          : "bg-amber-950/20 text-amber-400/80 border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-300"
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Izin</span>
                    </button>

                    {/* Sakit */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(member.user_id, "Sakit")}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        currentStatus === "Sakit"
                          ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/25 scale-[1.03]"
                          : "bg-sky-950/20 text-sky-400/80 border-sky-500/30 hover:bg-sky-500/20 hover:text-sky-300"
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Sakit</span>
                    </button>

                    {/* Alpha */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(member.user_id, "Alpha")}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        currentStatus === "Alpha"
                          ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/25 scale-[1.03]"
                          : "bg-rose-950/20 text-rose-400/80 border-rose-500/30 hover:bg-rose-500/20 hover:text-rose-300"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Alpha</span>
                    </button>
                  </div>

                  {/* Keterangan & Single Action Buttons */}
                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <input
                      type="text"
                      value={draft.keterangan}
                      onChange={(e) =>
                        handleKeteranganChange(member.user_id, e.target.value)
                      }
                      placeholder={
                        currentStatus && currentStatus !== "Hadir"
                          ? "Tulis keterangan / alasan..."
                          : "Keterangan opsional"
                      }
                      className="flex-1 lg:w-48 px-3 py-1.5 bg-slate-900/90 border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
                    />

                    {/* Single Save */}
                    {isDirty && (
                      <button
                        type="button"
                        onClick={() => handleSaveSingle(member.user_id)}
                        disabled={isSavingThis}
                        title="Simpan baris ini saja"
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isSavingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Reset single presence from DB if exists */}
                    {member.status && (
                      <button
                        type="button"
                        onClick={() => handleResetSinglePresence(member.user_id)}
                        disabled={isResettingThis}
                        title="Hapus / batalkan catatan kehadiran ini"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isResettingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Sticky Action Bar when there are unsaved changes */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#0E1326] border border-blue-500/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-bold text-white">
              {dirtyCount} perubahan belum disimpan
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDrafts}
              disabled={savingBatch}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={savingBatch}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {savingBatch ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Semua ({dirtyCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      <EditSessionModal
        session={session}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updated) => {
          setSession(updated);
          setFeedbackMsg({
            text: "Informasi sesi kegiatan berhasil diperbarui.",
            type: "success",
          });
          setTimeout(() => setFeedbackMsg(null), 3000);
        }}
      />

      {/* Delete Session Modal */}
      <DeleteConfirmModal
        session={session}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => {
          router.push("/attendance");
        }}
      />
    </div>
  );
}
