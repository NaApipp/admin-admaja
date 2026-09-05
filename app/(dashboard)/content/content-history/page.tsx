"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Trash2,
  Calendar,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  ImageIcon,
  X,
  FileText,
} from "lucide-react";

interface ContentItem {
  _id: string;
  content_id: string;
  title: string;
  content: string;
  label: string;
  image: string;
  times?: {
    createdAt?: string | Date;
    updatedAt?: string | Date;
  };
  relation?: {
    author?: string;
  };
  createdAt?: string | Date;
  author?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ContentHistoryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  // Modal delete state
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchContent = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        search: search.trim(),
      });

      const res = await fetch(`/api/content?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.data) {
        setItems(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data konten:", error);
      setNotification({
        type: "error",
        message: "Gagal memuat daftar berita. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContent(1, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContent(pagination.page, searchQuery);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    const targetId = itemToDelete.content_id || itemToDelete._id;

    try {
      const res = await fetch(`/api/content/${targetId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotification({
          type: "success",
          message: data.message || "Konten berhasil dihapus!",
        });
        setItemToDelete(null);
        // Refresh list
        fetchContent(pagination.page, searchQuery);
      } else {
        setNotification({
          type: "error",
          message: data.message || "Gagal menghapus konten.",
        });
      }
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error?.message || "Terjadi kesalahan saat menghapus konten.",
      });
    } finally {
      setDeleting(false);
      setTimeout(() => {
        setNotification(null);
      }, 4000);
    }
  };

  // Helper date formatter (WIB / Indonesian)
  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return "-";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "-";
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "-";
    }
  };

  // Available filter labels
  const uniqueLabels = useMemo(() => {
    const labels = new Set<string>();
    items.forEach((item) => {
      if (item.label) labels.add(item.label.trim());
    });
    return Array.from(labels);
  }, [items]);

  // Client-side filtering by selected label pill
  const filteredItems = useMemo(() => {
    if (selectedLabel === "all") return items;
    return items.filter(
      (item) => item.label?.toLowerCase() === selectedLabel.toLowerCase()
    );
  }, [items, selectedLabel]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/content"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Form Konten
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Riwayat & Daftar Berita
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Daftar seluruh artikel dan publikasi konten Paskibra Admaja
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Muat ulang data"
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          <Link
            href="/content"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Konten Baru</span>
          </Link>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm animate-fade-in ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{notification.message}</div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan judul berita..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Label Filters */}
        {uniqueLabels.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedLabel("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedLabel === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Semua ({items.length})
            </button>
            {uniqueLabels.map((lbl) => (
              <button
                key={lbl}
                onClick={() => setSelectedLabel(lbl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedLabel.toLowerCase() === lbl.toLowerCase()
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden animate-pulse flex flex-col h-[380px]"
            >
              <div className="w-full aspect-video bg-slate-800" />
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-5 bg-slate-800 rounded w-4/5" />
                  <div className="h-3.5 bg-slate-800 rounded w-full" />
                  <div className="h-3.5 bg-slate-800 rounded w-2/3" />
                </div>
                <div className="h-4 bg-slate-800 rounded w-1/2 pt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 my-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {searchQuery
              ? "Tidak ada berita yang cocok"
              : "Belum Ada Konten Berita"}
          </h3>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            {searchQuery
              ? `Tidak ditemukan berita dengan kata kunci "${searchQuery}". Silakan coba kata kunci lain.`
              : "Belum ada konten atau berita yang dipublikasikan. Mulai buat berita pertama Anda sekarang!"}
          </p>
          <Link
            href="/content"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Konten Baru</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const authorName = item.relation?.author || item.author || "Admin";
            const dateStr = formatDate(
              item.times?.createdAt || item.createdAt
            );

            return (
              <div
                key={item._id || item.content_id}
                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl"
              >
                {/* Card Image Cover */}
                <div className="relative w-full aspect-video bg-slate-950 overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
                      <ImageIcon className="w-10 h-10 mb-1 opacity-50" />
                      <span className="text-xs">Tidak ada gambar</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Label Badge */}
                  {item.label && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600/90 text-white backdrop-blur-md shadow-sm">
                        <Tag className="w-3 h-3" />
                        {item.label}
                      </span>
                    </div>
                  )}

                  {/* Delete Button (Quick Action on Image) */}
                  <button
                    onClick={() => setItemToDelete(item)}
                    title="Hapus berita"
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-red-600 text-white transition-all duration-200 backdrop-blur-md opacity-90 group-hover:opacity-100 hover:scale-105 shadow-md cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dateStr}</span>
                    </div>

                    {/* Title */}
                    <h2
                      title={item.title}
                      className="text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors"
                    >
                      {item.title}
                    </h2>

                    {/* Content Snippet */}
                    <p
                      title={item.content}
                      className="text-xs text-slate-400 line-clamp-3 leading-relaxed"
                    >
                      {item.content}
                    </p>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[140px] font-medium">
                        {authorName}
                      </span>
                    </div>

                    <button
                      onClick={() => setItemToDelete(item)}
                      className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => fetchContent(pagination.page - 1, searchQuery)}
            disabled={pagination.page <= 1 || loading}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Sebelumnya
          </button>
          <span className="text-xs text-slate-400 px-3">
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchContent(pagination.page + 1, searchQuery)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Hapus Konten Berita</h3>
                <p className="text-xs text-slate-400">Konfirmasi tindakan penghapusan</p>
              </div>
            </div>

            {/* Modal Body */}
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus konten{" "}
              <span className="font-semibold text-white">
                &ldquo;{itemToDelete.title}&rdquo;
              </span>
              ? Tindakan ini bersifat permanen dan tidak dapat dipulihkan.
            </p>

            {itemToDelete.image && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-5 bg-slate-950 border border-slate-800">
                <Image
                  src={itemToDelete.image}
                  alt={itemToDelete.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
