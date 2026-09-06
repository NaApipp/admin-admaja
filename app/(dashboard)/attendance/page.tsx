"use client";

import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Layers,
  Users,
  AlertCircle,
} from "lucide-react";
import { AttendanceSession, AttendanceOverallStats } from "./types";
import AttendanceStatsOverview from "./components/AttendanceStatsOverview";
import SessionList from "./components/SessionList";
import MemberAttendanceDirectory from "./components/MemberAttendanceDirectory";
import CreateSessionModal from "./components/CreateSessionModal";
import EditSessionModal from "./components/EditSessionModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import ExportModal from "./components/ExportModal";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"sessions" | "members">(
    "sessions",
  );

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [overallStats, setOverallStats] =
    useState<AttendanceOverallStats | null>(null);
  const [totalActiveMembers, setTotalActiveMembers] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const [selectedSessionForEdit, setSelectedSessionForEdit] =
    useState<AttendanceSession | null>(null);
  const [selectedSessionForDelete, setSelectedSessionForDelete] =
    useState<AttendanceSession | null>(null);

  // Fetch all sessions & global stats for manual refresh
  const fetchData = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const sessionsRes = await fetch("/api/attendance/sessions");
      const sessionsJson = await sessionsRes.json();

      if (sessionsJson.success && Array.isArray(sessionsJson.data)) {
        setSessions(sessionsJson.data);
        if (sessionsJson.data.length > 0 && sessionsJson.data[0].rekap) {
          setTotalActiveMembers(
            sessionsJson.data[0].rekap.total_anggota_aktif || 0,
          );
        }
      } else {
        setError(sessionsJson.message || "Gagal mengambil daftar sesi");
      }

      const statsRes = await fetch("/api/attendance");
      const statsJson = await statsRes.json();
      if (statsJson.success && statsJson.data) {
        setOverallStats(statsJson.data);
      }
    } catch {
      setError("Terjadi kesalahan koneksi saat mengambil data presensi.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [sessionsRes, statsRes] = await Promise.all([
          fetch("/api/attendance/sessions"),
          fetch("/api/attendance"),
        ]);

        const sessionsJson = await sessionsRes.json();
        const statsJson = await statsRes.json();

        if (ignore) return;

        if (sessionsJson.success && Array.isArray(sessionsJson.data)) {
          setSessions(sessionsJson.data);
          if (sessionsJson.data.length > 0 && sessionsJson.data[0].rekap) {
            setTotalActiveMembers(
              sessionsJson.data[0].rekap.total_anggota_aktif || 0,
            );
          }
        } else {
          setError(sessionsJson.message || "Gagal mengambil daftar sesi");
        }

        if (statsJson.success && statsJson.data) {
          setOverallStats(statsJson.data);
        }
      } catch {
        if (!ignore) {
          setError("Terjadi kesalahan koneksi saat mengambil data presensi.");
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
  }, []);

  // Handlers for session modal events
  const handleSessionCreated = (newSession: AttendanceSession) => {
    setSessions((prev) => [newSession, ...prev]);
    fetchData();
  };

  const handleSessionUpdated = (updatedSession: AttendanceSession) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.session_id === updatedSession.session_id ? updatedSession : s,
      ),
    );
    fetchData();
  };

  const handleSessionDeleted = (deletedId: string) => {
    setSessions((prev) => prev.filter((s) => s.session_id !== deletedId));
    fetchData();
  };

  const handleOpenExportForSession = () => {
    setExportModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Presensi & Absensi Kegiatan
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistem manajemen sesi latihan dan rekap kehadiran anggota Paskibra
              SMKN 4 Kendal
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs transition active:scale-[0.98] cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Laporan</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Sesi Latihan</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          {/* <button
            type="button"
            onClick={() => fetchData(true)}
            className="underline font-semibold hover:text-white cursor-pointer"
          >
            Coba Lagi
          </button> */}
        </div>
      )}

      {/* Global Stat Cards */}
      <AttendanceStatsOverview
        stats={overallStats}
        totalSessions={sessions.length}
        totalActiveMembers={totalActiveMembers}
        loading={loading}
      />

      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "sessions"
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sesi Kegiatan Latihan</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {sessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "members"
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Riwayat per Anggota</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "sessions" ? (
        <SessionList
          sessions={sessions}
          loading={loading}
          onEdit={(session) => {
            setSelectedSessionForEdit(session);
            setEditModalOpen(true);
          }}
          onDelete={(session) => {
            setSelectedSessionForDelete(session);
            setDeleteModalOpen(true);
          }}
          onExportSession={handleOpenExportForSession}
          onCreateNew={() => setCreateModalOpen(true)}
        />
      ) : (
        <MemberAttendanceDirectory />
      )}

      {/* Modals */}
      <CreateSessionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleSessionCreated}
      />

      <EditSessionModal
        session={selectedSessionForEdit}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedSessionForEdit(null);
        }}
        onUpdated={handleSessionUpdated}
      />

      <DeleteConfirmModal
        session={selectedSessionForDelete}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedSessionForDelete(null);
        }}
        onDeleted={handleSessionDeleted}
      />

      <ExportModal
        sessions={sessions}
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
}
