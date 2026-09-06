"use client";

import { useState, useEffect } from "react";
import { X, Eye, EyeOff, KeyRound, RefreshCw, Check, Shield, AlertCircle } from "lucide-react";

interface VaultItem {
  id?: string;
  vault_id?: string;
  account_name: string;
  platform: string;
  username: string;
  password?: string;
  notes?: string;
}

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: VaultItem | null;
}

const POPULAR_PLATFORMS = [
  "Instagram",
  "TikTok",
  "Email Sekolah",
  "Google Workspace",
  "Website Sekolah",
  "YouTube",
  "Facebook",
  "Twitter / X",
  "Lainnya",
];

export default function VaultModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: VaultModalProps) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    account_name: "",
    platform: "Instagram",
    custom_platform: "",
    username: "",
    password: "",
    notes: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      const isCustom = !POPULAR_PLATFORMS.includes(initialData.platform);
      setFormData({
        account_name: initialData.account_name || "",
        platform: isCustom ? "Lainnya" : initialData.platform,
        custom_platform: isCustom ? initialData.platform : "",
        username: initialData.username || "",
        password: initialData.password || "",
        notes: initialData.notes || "",
      });
    } else {
      setFormData({
        account_name: "",
        platform: "Instagram",
        custom_platform: "",
        username: "",
        password: "",
        notes: "",
      });
    }
    setError(null);
    setShowPassword(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const generateRandomPassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]:;?><,./-=";
    let pwd = "";
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const effectivePlatform =
      formData.platform === "Lainnya"
        ? formData.custom_platform.trim() || "Lainnya"
        : formData.platform;

    if (!formData.account_name.trim()) {
      setError("Nama akun wajib diisi");
      setLoading(false);
      return;
    }

    if (!formData.username.trim()) {
      setError("Username / Email wajib diisi");
      setLoading(false);
      return;
    }

    if (!isEditing && !formData.password) {
      setError("Password wajib diisi");
      setLoading(false);
      return;
    }

    try {
      const targetId = initialData?.vault_id || initialData?.id;
      const url = isEditing ? `/api/vault/${targetId}` : "/api/vault";
      const method = isEditing ? "PUT" : "POST";

      const payload: any = {
        account_name: formData.account_name.trim(),
        platform: effectivePlatform,
        username: formData.username.trim(),
        notes: formData.notes.trim(),
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memproses kredensial");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan pada server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#12172D] border border-blue-900/50 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161c38]">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">
                {isEditing ? "Edit Kredensial Vault" : "Tambah Kredensial Baru"}
              </h3>
              <p className="text-xs text-blue-200/60">
                Password akan dienkripsi secara simetris dengan AES-256-GCM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Name */}
          <div>
            <label className="block mb-1.5 text-xs font-medium text-blue-200">
              Nama Akun / Deskripsi <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Instagram Official Paskibra"
              value={formData.account_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, account_name: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 bg-[#0e1326] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Platform Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-xs font-medium text-blue-200">
                Platform <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.platform}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, platform: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-[#0e1326] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {POPULAR_PLATFORMS.map((plat) => (
                  <option key={plat} value={plat} className="bg-[#12172D]">
                    {plat}
                  </option>
                ))}
              </select>
            </div>

            {formData.platform === "Lainnya" && (
              <div>
                <label className="block mb-1.5 text-xs font-medium text-blue-200">
                  Nama Platform Kustom <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ketik platform..."
                  value={formData.custom_platform}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      custom_platform: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#0e1326] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Username / Email */}
          <div>
            <label className="block mb-1.5 text-xs font-medium text-blue-200">
              Username / ID / Email <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: @paskibraskanifo / paskibra@gmail.com"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 bg-[#0e1326] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-blue-200">
                Password {isEditing ? "(Kosongkan jika tidak diubah)" : <span className="text-rose-400">*</span>}
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak Password Kuat</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isEditing ? "•••••••• (Password lama dipertahankan)" : "Masukkan password akun"}
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full pl-3.5 pr-11 py-2.5 bg-[#0e1326] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-1.5 text-xs font-medium text-blue-200">
              Catatan / Info Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: No pemulihan +62..., email cadangan admin..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full px-3.5 py-2 bg-[#0e1326] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none transition-all"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Perbarui Kredensial" : "Simpan Kredensial"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
