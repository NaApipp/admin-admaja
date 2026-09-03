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

interface AddMemberProps {
  onSuccess?: () => void;
}

export default function AddMember({ onSuccess }: AddMemberProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    angkatan: "",
    nisn: "",
    kelas: "",
    status: "",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpen = () => {
    setFormData({
      name: "",
      angkatan: "",
      nisn: "",
      kelas: "",
      status: "",
    });
    setMessage({ type: "", text: "" });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validasi Sederhana
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Nama anggota wajib diisi" });
      return;
    }
    if (formData.name.length < 3 || formData.name.length > 50) {
      setMessage({
        type: "error",
        text: "Nama minimal 3 dan maksimal 50 karakter",
      });
      return;
    }

    if (!formData.nisn.trim()) {
      setMessage({ type: "error", text: "NISN wajib diisi" });
      return;
    }
    if (formData.nisn.length < 10 || formData.nisn.length > 10) {
      setMessage({
        type: "error",
        text: "NISN minimal 10 dan maksimal 10 karakter",
      });
      return;
    }

    if (!formData.angkatan.trim()) {
      setMessage({ type: "error", text: "Angkatan wajib diisi" });
      return;
    }

    if (!formData.kelas.trim()) {
      setMessage({ type: "error", text: "Kelas wajib diisi" });
      return;
    }
    if (formData.kelas.length < 1 || formData.kelas.length > 10) {
      setMessage({
        type: "error",
        text: "Kelas minimal 1 dan maksimal 10 karakter",
      });
      return;
    }

    if (!formData.status.trim()) {
      setMessage({ type: "error", text: "Status wajib diisi" });
      return;
    }
    if (formData.status.length < 1 || formData.status.length > 10) {
      setMessage({
        type: "error",
        text: "Status minimal 1 dan maksimal 10 karakter",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          angkatan: formData.angkatan,
          nisn: formData.nisn,
          kelas: formData.kelas,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: "success",
          text: data.message || "Data anggota berhasil ditambahkan!",
        });
        setFormData({
          name: "",
          angkatan: "",
          nisn: "",
          kelas: "",
          status: "",
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        setMessage({
          type: "error",
          text: data.message || "Gagal menambahkan periode anggota.",
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "error",
          text: "Terjadi kesalahan koneksi server.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nisn: "",
      kelas: "",
      angkatan: "",
      status: "",
    });
    setMessage({ type: "", text: "" });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2.5 bg-[#14236F] hover:bg-[#1a2e8a] active:scale-[0.98] text-white px-10 py-7.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <span>Tambah Anggota Baru</span>
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
                    Tambah Anggota Baru
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Isi detail data anggota untuk ditambahkan.
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
                  Nama Anggota <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    maxLength={50}
                    placeholder="Yaying"
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

              {/* NISN & ANGKATAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="nisn"
                    className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    NISN <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="nisn"
                      name="nisn"
                      required
                      maxLength={10}
                      placeholder="1254678121"
                      value={formData.nisn}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Minimal 10 karakter</span>
                    <span>{formData.nisn.length}/10</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="angkatan"
                    className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Angkatan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="angkatan"
                      name="angkatan"
                      required
                      maxLength={4}
                      placeholder="Contoh: 2026 / 27"
                      value={formData.angkatan}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Minimal 2 karakter</span>
                    <span>{formData.angkatan.length}/4</span>
                  </div>
                </div>
              </div>

              {/* Kelas  Anggota */}
              <div className="space-y-1.5">
                <label
                  htmlFor="status"
                  className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  Kelas
                </label>
                <div className="relative">
                  <select
                    id="kelas"
                    name="kelas"
                    value={formData.kelas}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    {/* Option Menu Kelas */}
                    {/* Kelas x */}
                    <option value="X RPL 1">X RPL 1</option>
                    <option value="X RPL 2">X RPL 2</option>
                    <option value="X RPL 3">X RPL 3</option>
                    <option value="X TKJ 1">X TKJ 1</option>
                    <option value="X TKJ 2">X TKJ 2</option>
                    <option value="X KULINER 2">X KULINER 2</option>
                    <option value="X KULINER 1">X KULINER 1</option>
                    <option value="X TO 1">X TO 1</option>
                    <option value="X TO 2">X TO 2</option>
                    <option value="X TO 3">X TO 3</option>
                    <option value="X APAT 1">X APAT 1</option>
                    <option value="X APAT 2">X APAT 2</option>
                    <option value="X NKPI 1">X NKPI 1</option>
                    <option value="X NKPI 2">X NKPI 2</option>
                    {/* Kelas XI */}
                    <option value="XI RPL 1">XI RPL 1</option>
                    <option value="XI RPL 2">XI RPL 2</option>
                    <option value="XI RPL 3">XI RPL 3</option>
                    <option value="XI TKJ 1">XI TKJ 1</option>
                    <option value="XI TKJ 2">XI TKJ 2</option>
                    <option value="XI KULINER 2">XI KULINER 2</option>
                    <option value="XI KULINER 1">XI KULINER 1</option>
                    <option value="XI TO 1">XI TO 1</option>
                    <option value="XI TO 2">XI TO 2</option>
                    <option value="XI TO 3">XI TO 3</option>
                    <option value="XI APAT 1">XI APAT 1</option>
                    <option value="XI APAT 2">XI APAT 2</option>
                    <option value="XI NKPI 1">XI NKPI 1</option>
                    <option value="XI NKPI 2">XI NKPI 2</option>
                    {/* Kelas XII */}
                    <option value="XII RPL 1">XII RPL 1</option>
                    <option value="XII RPL 2">XII RPL 2</option>
                    <option value="XII RPL 3">XII RPL 3</option>
                    <option value="XII TKJ 1">XII TKJ 1</option>
                    <option value="XII TKJ 2">XII TKJ 2</option>
                    <option value="XII KULINER 2">XII KULINER 2</option>
                    <option value="XII KULINER 1">XII KULINER 1</option>
                    <option value="XII TO 1">XII TO 1</option>
                    <option value="XII TO 2">XII TO 2</option>
                    <option value="XII TO 3">XII TO 3</option>
                    <option value="XII APAT 1">XII APAT 1</option>
                    <option value="XII APAT 2">XII APAT 2</option>
                    <option value="XII NKPI 1">XII NKPI 1</option>
                    <option value="XII NKPI 2">XII NKPI 2</option>
                  </select>
                </div>
              </div>

              {/* Status  Anggota */}
              <div className="space-y-1.5">
                <label
                  htmlFor="status"
                  className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status Keanggotaan
                </label>
                <div className="relative">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">Pilih Status Keanggotaan</option>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif" disabled>Non-Aktif</option>
                    <option value="nonaktif" disabled>Purna</option>
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
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                {/* Button Reset Forn */}
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Reset Form
                </button>
                <div className="">
                  {/* Button Cancel */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  {/* Button Submit */}
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
                      <span>Simpan Anggota</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
