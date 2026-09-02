"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Vote,
  Loader2,
} from "lucide-react";

interface AddElectionsProps {
  onSuccess?: () => void;
}

export default function AddElections({ onSuccess }: AddElectionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    status: "draft",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpen = () => {
    setFormData({
      name: "",
      tanggal_mulai: "",
      tanggal_selesai: "",
      status: "draft",
    });
    setMessage({ type: "", text: "" });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validasi Sederhana
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Nama periode pemilu wajib diisi" });
      return;
    }
    if (formData.name.length < 3 || formData.name.length > 50) {
      setMessage({
        type: "error",
        text: "Nama kategori minimal 3 dan maksimal 50 karakter",
      });
      return;
    }
    if (!formData.tanggal_mulai || !formData.tanggal_selesai) {
      setMessage({
        type: "error",
        text: "Tanggal mulai dan tanggal selesai wajib diisi",
      });
      return;
    }

    if (new Date(formData.tanggal_mulai) > new Date(formData.tanggal_selesai)) {
      setMessage({
        type: "error",
        text: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/elections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          tanggal_mulai: formData.tanggal_mulai,
          tanggal_selesai: formData.tanggal_selesai,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: "success",
          text: data.message || "Periode pemilu berhasil ditambahkan!",
        });
        setFormData({
          name: "",
          tanggal_mulai: "",
          tanggal_selesai: "",
          status: "draft",
        });

        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          setIsOpen(false);
          if (!onSuccess) {
            window.location.reload();
          }
        }, 1500);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Gagal menambahkan periode pemilu.",
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "error", text: "Terjadi kesalahan koneksi server." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2.5 bg-[#14236F] hover:bg-[#1a2e8a] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <span>Tambah Pemilu Baru</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => !loading && setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800 my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Buat Periode Pemilu Baru
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Isi detail periode pemilihan ketua untuk dipublikasikan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Area */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nama Pemilu */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  Nama Periode Pemilihan <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    maxLength={50}
                    placeholder="Contoh: Pemilihan Ketua Paskibra 2026/2027"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Minimal 3 karakter</span>
                  <span>{formData.name.length}/50</span>
                </div>
              </div>

              {/* Tanggal Mulai & Tanggal Selesai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="tanggal_mulai"
                    className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="tanggal_mulai"
                      name="tanggal_mulai"
                      required
                      value={formData.tanggal_mulai}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="tanggal_selesai"
                    className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Tanggal Selesai <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="tanggal_selesai"
                      name="tanggal_selesai"
                      required
                      value={formData.tanggal_selesai}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Status Pemilu */}
              <div className="space-y-1.5">
                <label
                  htmlFor="status"
                  className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status Awal
                </label>
                <div className="relative">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="draft">Draft (Disimpan sementara / belum aktif)</option>
                    <option value="dibuka">Dibuka (Langsung dapat divoting)</option>
                    <option value="ditutup">Ditutup (Arsip pemilu)</option>
                  </select>
                </div>
              </div>

              {/* Alert Feedback Message */}
              {message.text && (
                <div
                  className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200 ${
                    message.type === "error"
                      ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                  }`}
                >
                  {message.type === "error" ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#14236F] hover:bg-[#1a2e8a] active:scale-[0.98] text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Periode Pemilu</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}