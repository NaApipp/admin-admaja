"use client";

import { useEffect, useState, useMemo } from "react";
import {
  History,
  Search,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  ChevronDown,
  Loader2,
  Trash,
} from "lucide-react";

interface ElectionDate {
  start?: string | Date;
  end?: string | Date;
}

interface Election {
  _id?: string;
  elections_id: string;
  name: string;
  date?: ElectionDate;
  tanggal_mulai?: string | Date;
  tanggal_selesai?: string | Date;
  status: "draft" | "dibuka" | "ditutup";
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

type StatusType = "draft" | "dibuka" | "ditutup";

export default function ElectionsHistory() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Row loading states for individual status changes
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchElections = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/elections", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil data riwayat pemilihan");
      }

      const json = await res.json();
      setElections(json.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat memuat data.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function initialLoad() {
      try {
        const res = await fetch("/api/elections", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Gagal mengambil data pemilihan");

        const json = await res.json();
        if (!ignore) {
          setElections(json.data || []);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) setError(err.message);
          else setError("Terjadi kesalahan saat memuat data.");
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      ignore = true;
    };
  }, []);

  const handleStatusChange = async (
    electionId: string,
    newStatus: StatusType,
  ) => {
    setUpdatingId(electionId);
    setError(null);
    setSuccessToast(null);

    try {
      const res = await fetch(`/api/elections/${electionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal mengubah status pemilu");
      }

      // Update state locally
      setElections((prev) =>
        prev.map((item) =>
          item.elections_id === electionId || item._id === electionId
            ? {
                ...item,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      setSuccessToast(
        `Status pemilu (${electionId}) berhasil diubah menjadi "${newStatus}"`,
      );
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal memperbarui status.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return "-";
    try {
      const date = new Date(dateInput);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return String(dateInput);
    }
  };

  const handleDeleteElections = async (elections_id: string) => {
    try {
      const res = await fetch(`/api/elections/${elections_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus pemilihan.");
      }

      setElections((prev) =>
        prev.filter(
          (election) =>
            election.elections_id !== elections_id &&
            election._id !== elections_id,
        ),
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat menghapus pemilihan.");
      }
    }
  };

  const filteredElections = useMemo(() => {
    return elections.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.elections_id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        item.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [elections, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "dibuka":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Dibuka
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Draft
          </span>
        );
      case "ditutup":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Ditutup
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {status || "-"}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      

      {/* Notifications / Toast */}
      {successToast && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-medium">{successToast}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
        

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-medium text-gray-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { label: "Semua", value: "all" },
            { label: "Dibuka", value: "dibuka" },
            { label: "Draft", value: "draft" },
            { label: "Ditutup", value: "ditutup" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.value
                  ? "bg-[#14236F] text-white shadow-xs"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#14236F] dark:text-blue-400 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Memuat data riwayat pemilu...
            </p>
          </div>
        ) : filteredElections.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Tidak Ada Data Pemilu Ditemukan
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Tidak ada data yang cocok dengan kriteria pencarian/filter."
                : "Belum ada periode pemilu yang dibuat di sistem."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                  <th className="py-3.5 px-6">ID Pemilihan</th>
                  <th className="py-3.5 px-6">Nama Periode</th>
                  <th className="py-3.5 px-6">Periode Tanggal</th>
                  <th className="py-3.5 px-6">Status Saat Ini</th>
                  <th className="py-3.5 px-6">Ubah Status</th>
                  <th className="py-3.5 px-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredElections.map((election) => {
                  const electionId =
                    election.elections_id || election._id || "";
                  const startDate =
                    election.date?.start || election.tanggal_mulai;
                  const endDate =
                    election.date?.end || election.tanggal_selesai;
                  const isUpdating = updatingId === electionId;

                  return (
                    <tr
                      key={electionId}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* ID Pemilihan */}
                      <td className="py-4 px-6 align-middle font-mono text-xs font-semibold text-[#14236F] dark:text-blue-400">
                        <span className="bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-900/50">
                          {election.elections_id}
                        </span>
                      </td>

                      {/* Nama Periode */}
                      <td className="py-4 px-6 align-middle">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {election.name}
                        </div>
                        {election.createdAt && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Dibuat: {formatDate(election.createdAt)}
                          </div>
                        )}
                      </td>

                      {/* Periode Tanggal */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>
                            {formatDate(startDate)} &mdash;{" "}
                            {formatDate(endDate)}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6 align-middle">
                        {getStatusBadge(election.status)}
                      </td>

                      {/* Dropdown Ubah Status */}
                      <td className="py-4 px-6 align-middle">
                        <div className="relative inline-block w-40">
                          <select
                            disabled={isUpdating}
                            value={election.status}
                            onChange={(e) =>
                              handleStatusChange(
                                electionId,
                                e.target.value as StatusType,
                              )
                            }
                            className={`w-full appearance-none bg-white dark:bg-gray-800 border rounded-xl py-2 pl-3 pr-8 text-xs font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                              election.status === "dibuka"
                                ? "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                                : election.status === "draft"
                                  ? "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                                  : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <option value="draft">Draft</option>
                            <option value="dibuka">Dibuka</option>
                            <option value="ditutup">Ditutup</option>
                          </select>
                          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#14236F] dark:text-blue-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            const idToDelete = election.elections_id;
                            if (!idToDelete) return;
                            if (
                              window.confirm(
                                `Apakah Anda yakin ingin menghapus pemilihan ini?`,
                              )
                            ) {
                              handleDeleteElections(idToDelete);
                            }
                          }}
                          title="Hapus Pemilihan"
                          className="text-center p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer / Summary */}
        {!loading && filteredElections.length > 0 && (
          <div className="py-3.5 px-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Menampilkan <strong>{filteredElections.length}</strong> dari total{" "}
              <strong>{elections.length}</strong> periode pemilu
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
