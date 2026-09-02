"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Vote,
  Users,
  Search,
  RefreshCw,
  Award,
  ChevronRight,
  AlertCircle,
  Clock,
  Download,
  Filter,
  ArrowLeft,
  UserCheck,
  TrendingUp,
} from "lucide-react";

interface Election {
  _id?: string;
  elections_id: string;
  name: string;
  status: "draft" | "dibuka" | "ditutup";
  tanggal_mulai?: string | Date;
  tanggal_selesai?: string | Date;
}

interface VoterRecord {
  id_vote: string;
  voter_id: string;
  waktu_vote: string | Date;
  name: string;
  nipd: string;
  kelas: string;
  angkatan: string;
}

interface CandidateResult {
  candidates_id: string;
  serial_number: number | string;
  user: string;
  kelas?: string;
  foto_url?: string;
  vision_mission?: {
    vision?: string;
    mission?: string[] | string;
  };
  total_votes: number;
  percentage: string;
  voters: VoterRecord[];
}

interface ElectionReviewData {
  elections_id: string;
  election_name: string | null;
  election_status: string | null;
  total_votes: number;
  candidate_results: CandidateResult[];
  votes: {
    id_vote: string;
    elections_id: string;
    candidates_id: string;
    voter_id: string;
    waktu_vote: string | Date;
    voter?: {
      name: string;
      nipd: string;
      kelas: string;
      angkatan: string;
    } | null;
  }[];
}

export default function ElectionsReview() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const [reviewData, setReviewData] = useState<ElectionReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter tab & search
  const [selectedCandidateTab, setSelectedCandidateTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  const handleElectionChange = (newElectionId: string) => {
    setSelectedElectionId(newElectionId);
    setSelectedCandidateTab("all");
    setSearchQuery("");
    setSelectedClassFilter("all");
  };

  // Fetch review data
  const fetchReviewData = useCallback(async (electionId: string, isRefresh = false) => {
    if (!electionId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/vote?elections_id=${encodeURIComponent(electionId)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal mengambil data review suara pemilu");
      const json = await res.json();
      setReviewData(json.data || null);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Terjadi kesalahan saat mengambil review suara");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch all elections for selector
  useEffect(() => {
    let ignore = false;
    async function loadElections() {
      try {
        const res = await fetch("/api/elections", { credentials: "include" });
        if (!res.ok) throw new Error("Gagal memuat daftar pemilihan");
        const json = await res.json();
        if (!ignore) {
          const list: Election[] = json.data || [];
          setElections(list);
          const active = list.find((e) => e.status === "dibuka") || list[0];
          if (active) {
            setSelectedElectionId(active.elections_id);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) setError(err.message);
          else setError("Terjadi kesalahan saat memuat data pemilihan");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadElections();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!selectedElectionId) return;

    async function loadData() {
      try {
        const res = await fetch(`/api/vote?elections_id=${encodeURIComponent(selectedElectionId)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Gagal mengambil data review suara pemilu");
        const json = await res.json();
        if (!ignore) {
          setReviewData(json.data || null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) setError(err.message);
          else setError("Terjadi kesalahan saat mengambil review suara");
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [selectedElectionId]);

  // Extract all unique classes for class filter dropdown
  const availableClasses = useMemo(() => {
    if (!reviewData?.candidate_results) return [];
    const classSet = new Set<string>();
    reviewData.candidate_results.forEach((cand) => {
      cand.voters?.forEach((v) => {
        if (v.kelas && v.kelas !== "-") classSet.add(v.kelas);
      });
    });
    return Array.from(classSet).sort();
  }, [reviewData]);

  // Filtered voters list based on selected candidate, search, and class
  const filteredVotersList = useMemo(() => {
    if (!reviewData?.candidate_results) return [];

    let list: Array<
      VoterRecord & {
        candidate_name: string;
        candidate_serial: number | string;
        candidate_id: string;
      }
    > = [];

    if (selectedCandidateTab === "all") {
      // Aggregate from all candidates
      reviewData.candidate_results.forEach((cand) => {
        cand.voters?.forEach((v) => {
          list.push({
            ...v,
            candidate_name: cand.user,
            candidate_serial: cand.serial_number,
            candidate_id: cand.candidates_id,
          });
        });
      });
    } else {
      // Specific candidate
      const cand = reviewData.candidate_results.find(
        (c) => c.candidates_id === selectedCandidateTab,
      );
      if (cand) {
        cand.voters?.forEach((v) => {
          list.push({
            ...v,
            candidate_name: cand.user,
            candidate_serial: cand.serial_number,
            candidate_id: cand.candidates_id,
          });
        });
      }
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.nipd.toLowerCase().includes(q) ||
          v.kelas.toLowerCase().includes(q) ||
          v.candidate_name.toLowerCase().includes(q),
      );
    }

    // Apply class filter
    if (selectedClassFilter !== "all") {
      list = list.filter((v) => v.kelas === selectedClassFilter);
    }

    // Sort by latest vote time
    return list.sort(
      (a, b) =>
        new Date(b.waktu_vote).getTime() - new Date(a.waktu_vote).getTime(),
    );
  }, [reviewData, selectedCandidateTab, searchQuery, selectedClassFilter]);

  // Helper date formatter
  const formatVoteTime = (dateStr?: string | Date) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(d);
    } catch {
      return String(dateStr);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredVotersList.length) return;

    const headers = [
      "No",
      "Nama Pemilih",
      "NIPD",
      "Kelas",
      "Angkatan",
      "Kandidat Dipilih",
      "Nomor Urut",
      "Waktu Voting",
    ];

    const rows = filteredVotersList.map((v, i) => [
      i + 1,
      `"${v.name}"`,
      `"${v.nipd}"`,
      `"${v.kelas}"`,
      `"${v.angkatan}"`,
      `"${v.candidate_name}"`,
      v.candidate_serial,
      `"${formatVoteTime(v.waktu_vote)}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `review_suara_${selectedElectionId}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case "dibuka":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sedang Dibuka
          </span>
        );
      case "ditutup":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Telah Ditutup
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link
                href="/elections"
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Kembali ke Pemilu Aktif"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                  Review & Audit Suara Pemilu
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pantau detail pemilih dan rincian suara per kandidat ketua secara transparan.
                </p>
              </div>
            </div>
          </div>

          {/* Action & Election Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Election Dropdown */}
            <div className="relative min-w-[240px]">
              <Vote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedElectionId}
                onChange={(e) => handleElectionChange(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-8 py-2.5 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 cursor-pointer"
              >
                {elections.map((elec) => (
                  <option key={elec.elections_id} value={elec.elections_id}>
                    {elec.name} ({elec.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchReviewData(selectedElectionId, true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Data Suara"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#14236F] dark:text-blue-400" : ""}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              disabled={filteredVotersList.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14236F] hover:bg-[#1a2e8a] active:scale-[0.98] text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800/60 animate-pulse border border-gray-200 dark:border-gray-800" />
            ))}
          </div>
          <div className="h-80 rounded-2xl bg-gray-100 dark:bg-gray-800/60 animate-pulse border border-gray-200 dark:border-gray-800" />
        </div>
      ) : !reviewData ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Vote className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            Data Pemilihan Tidak Ditemukan
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pilih periode pemilihan di atas untuk menampilkan rincian suara.
          </p>
        </div>
      ) : (
        <>
          {/* Candidates Summary & Votes Distribution Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#14236F] dark:text-blue-400" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Perolehan Suara Kandidat
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Total Suara:
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-[#14236F] dark:text-blue-400 font-bold text-xs">
                  {reviewData.total_votes} Suara
                </span>
                {getStatusBadge(reviewData.election_status)}
              </div>
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviewData.candidate_results.map((candidate) => {
                const isWinner =
                  reviewData.total_votes > 0 &&
                  candidate.total_votes ===
                    Math.max(...reviewData.candidate_results.map((c) => c.total_votes));

                const isSelected = selectedCandidateTab === candidate.candidates_id;

                return (
                  <div
                    key={candidate.candidates_id}
                    onClick={() =>
                      setSelectedCandidateTab(
                        isSelected ? "all" : candidate.candidates_id,
                      )
                    }
                    className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#14236F] dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-[#14236F]/20 dark:ring-blue-500/20 shadow-md"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-xs hover:shadow-md"
                    }`}
                  >
                    {isWinner && reviewData.total_votes > 0 && (
                      <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Award className="w-3 h-3" />
                        Unggul
                      </div>
                    )}

                    <div>
                      {/* Header Info */}
                      <div className="flex items-start gap-3.5 mb-4">
                        {/* Serial Number Badge */}
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#14236F] to-[#293681] text-white flex flex-col items-center justify-center shadow-xs">
                          <span className="text-[9px] uppercase font-bold text-blue-200">
                            Urut
                          </span>
                          <span className="text-lg font-black leading-none">
                            {candidate.serial_number}
                          </span>
                        </div>

                        {/* Candidate Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                            {candidate.user}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Kelas: {candidate.kelas || "-"}
                          </p>
                        </div>

                        {/* Foto Kandidat */}
                        {candidate.foto_url ? (
                          <div className="relative w-11 h-11 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                            <Image
                              src={candidate.foto_url}
                              alt={candidate.user}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* Vote Count & Percentage Bar */}
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-black text-gray-900 dark:text-white">
                            {candidate.total_votes}
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">
                              suara
                            </span>
                          </span>
                          <span className="text-sm font-bold text-[#14236F] dark:text-blue-400">
                            {candidate.percentage}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#14236F] to-blue-500 rounded-full transition-all duration-500"
                            style={{
                              width:
                                candidate.percentage === "0%"
                                  ? "0%"
                                  : candidate.percentage,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                      <span>
                        {isSelected ? "Sedang Difilter" : "Klik untuk filter"}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? "rotate-90 text-[#14236F] dark:text-blue-400" : ""
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voters Detail Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
            {/* Table Filter & Tab Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#14236F] dark:text-blue-400" />
                    Daftar Pemilih ({filteredVotersList.length} Suara)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Data siswa/anggota yang telah memberikan hak suara pada periode pemilihan ini.
                  </p>
                </div>

                {/* Candidate Selector Tabs */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <button
                    onClick={() => setSelectedCandidateTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCandidateTab === "all"
                        ? "bg-white dark:bg-gray-900 text-[#14236F] dark:text-blue-400 shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Semua ({reviewData.total_votes})
                  </button>
                  {reviewData.candidate_results.map((c) => (
                    <button
                      key={c.candidates_id}
                      onClick={() => setSelectedCandidateTab(c.candidates_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCandidateTab === c.candidates_id
                          ? "bg-white dark:bg-gray-900 text-[#14236F] dark:text-blue-400 shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Kandidat #{c.serial_number} ({c.total_votes})
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Class Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama pemilih, NIPD, atau kelas..."
                    className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Class Filter Dropdown */}
                {availableClasses.length > 0 && (
                  <div className="relative min-w-[160px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-6 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all">Semua Kelas</option>
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          Kelas {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Voters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">No</th>
                    <th className="py-3.5 px-6">Nama Pemilih</th>
                    <th className="py-3.5 px-6">NIPD</th>
                    <th className="py-3.5 px-6">Kelas / Angkatan</th>
                    <th className="py-3.5 px-6">Kandidat Yang Dipilih</th>
                    <th className="py-3.5 px-6 text-right">Waktu Memilih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {filteredVotersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold">Belum ada data pemilih yang sesuai</p>
                        <p className="text-[11px] mt-0.5">
                          {searchQuery
                            ? "Coba ubah kata kunci pencarian Anda."
                            : "Belum ada suara yang masuk untuk filter ini."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredVotersList.map((voter, index) => (
                      <tr
                        key={voter.id_vote || index}
                        className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors"
                      >
                        {/* No */}
                        <td className="py-4 px-6 font-mono text-gray-400">
                          {index + 1}
                        </td>

                        {/* Nama Pemilih */}
                        <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#14236F]/10 dark:bg-blue-900/30 text-[#14236F] dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                              {voter.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{voter.name}</span>
                          </div>
                        </td>

                        {/* NIPD */}
                        <td className="py-4 px-6 font-mono text-gray-600 dark:text-gray-300">
                          {voter.nipd || "-"}
                        </td>

                        {/* Kelas & Angkatan */}
                        <td className="py-4 px-6">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {voter.kelas || "-"}
                          </span>
                          {voter.angkatan && voter.angkatan !== "-" && (
                            <span className="block text-[11px] text-gray-400">
                              Angkatan {voter.angkatan}
                            </span>
                          )}
                        </td>

                        {/* Kandidat Yang Dipilih */}
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
                            <span className="w-5 h-5 rounded-full bg-[#14236F] text-white flex items-center justify-center text-[10px] font-black">
                              {voter.candidate_serial}
                            </span>
                            <span className="font-bold text-xs text-[#14236F] dark:text-blue-300">
                              {voter.candidate_name}
                            </span>
                          </div>
                        </td>

                        {/* Waktu Memilih */}
                        <td className="py-4 px-6 text-right font-medium text-gray-500 dark:text-gray-400">
                          <div className="flex items-center justify-end gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formatVoteTime(voter.waktu_vote)}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            {filteredVotersList.length > 0 && (
              <div className="py-3 px-6 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                <span>
                  Menampilkan <strong>{filteredVotersList.length}</strong> dari total{" "}
                  <strong>{reviewData.total_votes}</strong> suara masuk
                </span>
                <span className="font-mono text-[11px] text-gray-400">
                  ID Pemilu: {selectedElectionId}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
