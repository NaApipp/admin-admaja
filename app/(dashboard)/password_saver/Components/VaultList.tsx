"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit3,
  Trash2,
  Globe,
  Lock,
  User,
  FileText,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface VaultItem {
  id?: string;
  vault_id?: string;
  _id?: string;
  account_name: string;
  platform: string;
  username: string;
  password?: string;
  notes?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface VaultListProps {
  items: VaultItem[];
  loading: boolean;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export default function VaultList({
  items,
  loading,
  onEdit,
  onDelete,
  onRefresh,
}: VaultListProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<VaultItem | null>(null);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch (err) {
      console.error("Gagal menyalin:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteModal) return;
    const targetId = confirmDeleteModal.vault_id || confirmDeleteModal.id || confirmDeleteModal._id;
    if (!targetId) return;

    setDeletingId(targetId);
    try {
      await onDelete(targetId);
      setConfirmDeleteModal(null);
    } finally {
      setDeletingId(null);
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("instagram")) {
      return "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border-pink-500/30";
    }
    if (p.includes("tiktok")) {
      return "bg-slate-800 text-cyan-300 border-cyan-500/30";
    }
    if (p.includes("email") || p.includes("gmail") || p.includes("google")) {
      return "bg-red-500/15 text-red-300 border-red-500/30";
    }
    if (p.includes("website") || p.includes("portal")) {
      return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    }
    if (p.includes("youtube")) {
      return "bg-red-600/20 text-red-400 border-red-600/30";
    }
    if (p.includes("facebook")) {
      return "bg-blue-600/20 text-blue-400 border-blue-600/30";
    }
    return "bg-slate-700/40 text-slate-300 border-slate-600/40";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#12172D] border border-white/10 rounded-2xl">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Memuat kredensial dari brankas terenkripsi...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#12172D] border border-dashed border-white/15 rounded-2xl">
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-3">
          <Lock className="w-7 h-7" />
        </div>
        <h4 className="text-base font-semibold text-white">Tidak ada kredensial ditemukan</h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
          Belum ada akun yang disimpan atau tidak ada data yang cocok dengan kata kunci pencarian Anda.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => {
          const itemId = item.vault_id || item.id || item._id || Math.random().toString();
          const isRevealed = Boolean(visiblePasswords[itemId]);
          const pwdKey = `pwd-${itemId}`;
          const usrKey = `usr-${itemId}`;

          return (
            <div
              key={itemId}
              className="group flex flex-col justify-between bg-[#12172D] border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all duration-200"
            >
              <div>
                {/* Header: Platform & Action buttons */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${getPlatformBadgeColor(
                      item.platform
                    )}`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>{item.platform}</span>
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(item)}
                      title="Edit Kredensial"
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteModal(item)}
                      title="Hapus Kredensial"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <h4 className="text-base font-bold text-white mb-3 truncate" title={item.account_name}>
                  {item.account_name}
                </h4>

                {/* Username / ID */}
                <div className="mb-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-400" />
                      Username / Email
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.username, usrKey)}
                      className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      {copiedKey === usrKey ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="px-3 py-2 bg-[#0d1224] border border-white/5 rounded-xl text-xs font-mono text-slate-200 select-all truncate">
                    {item.username}
                  </div>
                </div>

                {/* Password field with Show/Hide and Copy */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      Password Terenkripsi
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePasswordVisibility(itemId)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Sembunyi</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.password || "", pwdKey)}
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        {copiedKey === pwdKey ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[#0d1224] border border-white/5 rounded-xl text-xs font-mono text-slate-200 select-all">
                    <span className="truncate">
                      {isRevealed ? item.password || "(Kosong)" : "••••••••••••••••"}
                    </span>
                  </div>
                </div>

                {/* Notes if available */}
                {item.notes && (
                  <div className="mb-3 p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <FileText className="w-2.5 h-2.5" />
                      <span>Catatan</span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {item.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="pt-3 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  Update:{" "}
                  {item.updated_at
                    ? new Date(item.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </span>
                <span className="font-mono text-blue-400/60 text-[9px]">
                  {item.vault_id || "AES-256"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Delete Dialog */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#12172D] border border-rose-500/30 rounded-2xl shadow-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Hapus Kredensial?</h3>
                <p className="text-xs text-slate-400">
                  Tindakan ini permanen dan akan dicatat di audit log.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 bg-[#0d1224] p-3 rounded-xl border border-white/5">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-white">{confirmDeleteModal.account_name}</strong> (
              {confirmDeleteModal.platform})?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {deletingId ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Kredensial</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
