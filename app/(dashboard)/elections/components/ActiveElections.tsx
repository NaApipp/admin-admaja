"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Vote,
  Calendar,
  User,
  Quote,
  ListChecks,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash,
} from "lucide-react";
import Link from "next/link";

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
}

interface VisionMission {
  vision?: string;
  visi?: string;
  mission?: string[] | string;
  misi?: string[] | string;
}

interface CandidateData {
  name?: string;
  foto_url?: string;
  kelas?: string;
  angkatan?: string;
  bio?: string;
}

interface Candidate {
  _id?: string;
  candidates_id?: string;
  elections_id: string;
  serial_number: number | string;
  user?: string;
  candidate_data?: CandidateData;
  vision_mission?: VisionMission;
  visi_misi?: VisionMission;
}

export default function ActiveElections() {
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVision, setExpandedVision] = useState<Record<string, boolean>>(
    {},
  );

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const [electionsRes, candidatesRes] = await Promise.all([
        fetch("/api/elections", { credentials: "include" }),
        fetch("/api/candidates", { credentials: "include" }),
      ]);

      if (!electionsRes.ok) {
        throw new Error("Gagal mengambil data pemilihan");
      }
      if (!candidatesRes.ok) {
        throw new Error("Gagal mengambil data kandidat");
      }

      const electionsJson = await electionsRes.json();
      const candidatesJson = await candidatesRes.json();

      const allElections: Election[] = electionsJson.data || [];
      const allCandidates: Candidate[] = candidatesJson.data || [];

      // Filter hanya election dengan status 'dibuka'
      const openElections = allElections.filter(
        (election) => election.status?.toLowerCase() === "dibuka",
      );

      setActiveElections(openElections);
      setCandidates(allCandidates);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat memuat data pemilu.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        const [electionsRes, candidatesRes] = await Promise.all([
          fetch("/api/elections", { credentials: "include" }),
          fetch("/api/candidates", { credentials: "include" }),
        ]);

        if (!electionsRes.ok) throw new Error("Gagal mengambil data pemilihan");
        if (!candidatesRes.ok) throw new Error("Gagal mengambil data kandidat");

        const electionsJson = await electionsRes.json();
        const candidatesJson = await candidatesRes.json();

        if (!ignore) {
          const allElections: Election[] = electionsJson.data || [];
          const openElections = allElections.filter(
            (election) => election.status?.toLowerCase() === "dibuka",
          );
          setActiveElections(openElections);
          setCandidates(candidatesJson.data || []);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) setError(err.message);
          else setError("Terjadi kesalahan saat memuat data pemilu.");
          setLoading(false);
        }
      }
    }

    initialFetch();

    return () => {
      ignore = true;
    };
  }, []);

  const handleDeleteCandidate = async (candidates_id: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidates_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus kandidat.");
      }

      setCandidates((prev) =>
        prev.filter(
          (candidate) =>
            candidate.candidates_id !== candidates_id &&
            candidate._id !== candidates_id,
        ),
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat menghapus kandidat.");
      }
    }
  };

  const toggleExpand = (candidateId: string) => {
    setExpandedVision((prev) => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-xl bg-gray-100 dark:bg-gray-800/60 p-4 border border-gray-200 dark:border-gray-700/50"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
          Gagal Memuat Data Pemilu Aktif
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300 max-w-md mx-auto">
          {error}
        </p>
        <button
          onClick={() => loadData(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Empty State */}
      {activeElections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-[#14236F] dark:text-blue-400">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tidak Ada Pemilu yang Sedang Dibuka
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Saat ini belum ada periode pemilu yang berstatus aktif/dibuka.
              Silakan buka periode di menu Manajemen Pemilu.
            </p>
          </div>
        </div>
      ) : (
        /* Active Elections List */
        <div className="space-y-8">
          {activeElections.map((election) => {
            const electionId = election.elections_id || election._id || "";
            // Filter kandidat yang terhubung dengan election ini
            const electionCandidates = candidates.filter(
              (c) =>
                c.elections_id === electionId ||
                c.elections_id === election._id,
            );

            // Sort by serial number
            electionCandidates.sort(
              (a, b) => Number(a.serial_number) - Number(b.serial_number),
            );

            const startDate = election.date?.start || election.tanggal_mulai;
            const endDate = election.date?.end || election.tanggal_selesai;

            return (
              <div
                key={electionId}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Election Card Header */}
                <div className="bg-gradient-to-r from-[#14236F] via-[#1a2e8a] to-[#293681] p-6 text-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Status: Dibuka
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                        {election.name}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-blue-100 bg-black/20 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-1.5 font-medium">
                        <User className="w-4 h-4 text-blue-300" />
                        <span>
                          {electionCandidates.length} Kandidat Terdaftar
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidates Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Kandidat Calon Ketua
                    </h3>
                    <div className="flex gap-3">
                        <Link
                      href="/elections/add-candidates"
                      className="inline-flex items-center gap-2.5 bg-[#14236F] hover:bg-[#1a2e8a] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                      Review Pemilu
                    </Link>
                        <Link
                      href="/elections/add-candidates"
                      className="inline-flex items-center gap-2.5 bg-[#14236F] hover:bg-[#1a2e8a] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                      Tambah Kandidat
                    </Link>
                    </div>
                  </div>

                  {electionCandidates.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Belum ada kandidat yang didaftarkan untuk pemilihan ini.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {electionCandidates.map((candidate, idx) => {
                        const candidateId =
                          candidate.candidates_id ||
                          candidate._id ||
                          `${electionId}-candidate-${idx}`;
                        const candidateName =
                          candidate.candidate_data?.name ||
                          candidate.user ||
                          "Nama Kandidat";
                        const photoUrl = candidate.candidate_data?.foto_url;
                        const kelas = candidate.candidate_data?.kelas;
                        const angkatan = candidate.candidate_data?.angkatan;
                        const serialNum = candidate.serial_number;

                        // Vision and Mission extraction
                        const rawVision =
                          candidate.vision_mission?.vision ||
                          candidate.vision_mission?.visi ||
                          candidate.visi_misi?.visi ||
                          candidate.visi_misi?.vision ||
                          "";

                        const rawMission =
                          candidate.vision_mission?.mission ||
                          candidate.vision_mission?.misi ||
                          candidate.visi_misi?.misi ||
                          candidate.visi_misi?.mission ||
                          [];

                        const missionList: string[] = Array.isArray(rawMission)
                          ? rawMission
                          : typeof rawMission === "string" && rawMission.trim()
                            ? rawMission
                                .split("\n")
                                .filter((m) => m.trim().length > 0)
                            : [];

                        const isExpanded = !!expandedVision[candidateId];

                        return (
                          <div
                            key={candidateId}
                            className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700/50 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
                          >
                            {/* Candidate Header & Serial Badge */}
                            <div className="relative p-5 pb-3 flex items-start gap-4">
                              {/* Serial Number Badge */}
                              <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#14236F] to-[#293681] text-white shadow-sm border border-blue-400/20">
                                <span className="text-[10px] uppercase font-semibold text-blue-200 tracking-wider">
                                  Urutan
                                </span>
                                <span className="text-xl font-black leading-none">
                                  {String(serialNum).padStart(2, "0")}
                                </span>
                              </div>

                              {/* Candidate Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                                  {candidateName}
                                </h4>
                                {(kelas || angkatan) && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {[
                                      kelas,
                                      angkatan ? `Angkatan ${angkatan}` : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </p>
                                )}
                                <span className="inline-block mt-2 text-[11px] font-mono text-gray-400 dark:text-gray-500">
                                  {"ID Kandidat"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {photoUrl ? (
                                  <Image
                                    src={photoUrl}
                                    alt={candidateName}
                                    width={44}
                                    height={44}
                                    className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                                    unoptimized
                                  />
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const idToDelete =
                                      candidate.candidates_id || candidate._id;
                                    if (!idToDelete) return;
                                    if (
                                      window.confirm(
                                        `Apakah Anda yakin ingin menghapus kandidat ini ?`,
                                      )
                                    ) {
                                      handleDeleteCandidate(idToDelete);
                                    }
                                  }}
                                  title="Hapus Kandidat"
                                  className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Visi & Misi Box */}
                            <div className="flex-1 p-5 pt-2 space-y-4">
                              {/* Visi */}
                              {rawVision && (
                                <div className="rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-3.5 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#14236F] dark:text-blue-300 uppercase tracking-wide">
                                    <Quote className="w-3.5 h-3.5" />
                                    <span>Visi</span>
                                  </div>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                                    &ldquo;{rawVision}&rdquo;
                                  </p>
                                </div>
                              )}

                              {/* Misi */}
                              {missionList.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                      <ListChecks className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                      <span>Misi ({missionList.length})</span>
                                    </div>
                                    {missionList.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleExpand(candidateId)
                                        }
                                        className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                      >
                                        <span>
                                          {isExpanded
                                            ? "Ringkas"
                                            : "Lihat Semua"}
                                        </span>
                                        {isExpanded ? (
                                          <ChevronUp className="w-3.5 h-3.5" />
                                        ) : (
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  <ul className="space-y-1.5">
                                    {(isExpanded
                                      ? missionList
                                      : missionList.slice(0, 2)
                                    ).map((misi, mIdx) => (
                                      <li
                                        key={mIdx}
                                        className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300"
                                      >
                                        <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                                          {mIdx + 1}
                                        </span>
                                        <span className="leading-snug">
                                          {misi}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
