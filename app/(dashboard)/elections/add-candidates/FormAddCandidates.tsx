"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  Users,
  Quote,
  ListChecks,
  Hash,
  Vote,
  GraduationCap,
  UploadCloud,
  X,
} from "lucide-react";

interface Election {
  _id?: string;
  elections_id: string;
  name: string;
  status: string;
}

export default function FormAddCandidates() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [electionsLoading, setElectionsLoading] = useState(true);
  const [elections, setElections] = useState<Election[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  const [formData, setFormData] = useState({
    elections_id: "",
    user: "",
    kelas: "",
    serial_number: "",
    vision: "",
    image: "",
  });
  const [missionList, setMissionList] = useState<string[]>([""]);

  // Fetch daftar elections (hanya yang statusnya dibuka)
  useEffect(() => {
    let ignore = false;

    async function loadElections() {
      try {
        const res = await fetch("/api/elections", { credentials: "include" });
        const json = await res.json();
        if (!ignore) {
          const all: Election[] = json.data || [];
          setElections(
            all.filter(
              (e) => e.status?.toLowerCase() === "dibuka" || e.status === "draft",
            ),
          );
        }
      } catch {
        // silently fail
      } finally {
        if (!ignore) setElectionsLoading(false);
      }
    }

    loadElections();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Image Upload & Base64 Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "File yang diunggah harus berupa gambar (JPG, PNG, WebP).",
      });
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Ukuran gambar maksimal 5MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
        setMessage({ type: "", text: "" });
      }
    };
    reader.onerror = () => {
      setMessage({
        type: "error",
        text: "Gagal membaca file gambar.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Mission list handlers
  const handleMissionChange = (index: number, value: string) => {
    setMissionList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addMissionItem = () => {
    setMissionList((prev) => [...prev, ""]);
  };

  const removeMissionItem = (index: number) => {
    if (missionList.length <= 1) return;
    setMissionList((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      elections_id: "",
      user: "",
      kelas: "",
      serial_number: "",
      vision: "",
      image: "",
    });
    setMissionList([""]);
    setMessage({ type: "", text: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validasi Form
    if (!formData.elections_id) {
      setMessage({
        type: "error",
        text: "Pilih periode pemilihan terlebih dahulu.",
      });
      return;
    }
    if (!formData.user.trim()) {
      setMessage({ type: "error", text: "Nama kandidat wajib diisi." });
      return;
    }
    if (!formData.kelas.trim()) {
      setMessage({ type: "error", text: "Kelas kandidat wajib diisi." });
      return;
    }
    if (!formData.serial_number || isNaN(Number(formData.serial_number))) {
      setMessage({ type: "error", text: "Nomor urut harus berupa angka." });
      return;
    }
    if (!formData.image) {
      setMessage({ type: "error", text: "Foto kandidat wajib diunggah." });
      return;
    }
    if (!formData.vision.trim()) {
      setMessage({ type: "error", text: "Visi kandidat wajib diisi." });
      return;
    }
    const missions = missionList
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
    if (missions.length === 0) {
      setMessage({ type: "error", text: "Minimal 1 misi wajib diisi." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          elections_id: formData.elections_id,
          user: formData.user.trim(),
          kelas: formData.kelas.trim(),
          serial_number: Number(formData.serial_number),
          vision: formData.vision.trim(),
          mission: missions,
          image: formData.image,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: "success",
          text: data.message || "Kandidat berhasil ditambahkan!",
        });
        resetForm();
        setTimeout(() => router.push("/elections"), 1500);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Gagal menambahkan kandidat.",
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tambah Kandidat Baru
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Daftarkan kandidat beserta visi, misi, dan foto untuk periode pemilihan ketua.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="divide-y divide-gray-100 dark:divide-gray-800"
        >
          {/* Section 1: Identitas Kandidat */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#14236F] dark:text-blue-400" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Identitas Kandidat
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Pilih Periode Pemilu */}
            <div className="space-y-1.5">
              <label
                htmlFor="elections_id"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Periode Pemilihan <span className="text-red-500">*</span>
              </label>
              {electionsLoading ? (
                <div className="flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memuat daftar pemilu...</span>
                </div>
              ) : (
                <div className="relative">
                  <Vote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    id="elections_id"
                    name="elections_id"
                    required
                    value={formData.elections_id}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">— Pilih Periode Pemilihan —</option>
                    {elections.map((election) => (
                      <option
                        key={election.elections_id}
                        value={election.elections_id}
                      >
                        {election.name} ({election.elections_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {elections.length === 0 && !electionsLoading && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Tidak ada periode pemilihan yang berstatus draft atau terbuka. Buka periode
                  pemilihan terlebih dahulu.
                </p>
              )}
            </div>

            {/* Nama Kandidat */}
            <div className="space-y-1.5">
              <label
                htmlFor="user"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Nama Lengkap Kandidat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="user"
                name="user"
                required
                placeholder="Contoh: Ahmad Fauzi"
                value={formData.user}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Kelas Kandidat */}
            <div className="space-y-1.5">
              <label
                htmlFor="kelas"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Kelas Kandidat <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  id="kelas"
                  name="kelas"
                  required
                  placeholder="Contoh: XI PPLG 1"
                  value={formData.kelas}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Nomor Urut */}
            <div className="space-y-1.5">
              <label
                htmlFor="serial_number"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Nomor Urut <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  id="serial_number"
                  name="serial_number"
                  required
                  min={1}
                  placeholder="Contoh: 1"
                  value={formData.serial_number}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all [appearance:textfield]"
                />
              </div>
            </div>
            </div>

            {/* Foto Kandidat */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Foto Kandidat <span className="text-red-500">*</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="candidate-photo-input"
              />

              {formData.image ? (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 bg-gray-100 dark:bg-gray-800 shadow-xs">
                    <Image
                      src={formData.image}
                      alt="Preview Foto Kandidat"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      Foto berhasil dipilih
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Klik ganti jika ingin memilih foto lain
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-[#14236F] dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Ganti Foto
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs font-semibold text-red-500 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#14236F] dark:hover:border-blue-500 rounded-xl bg-gray-50/60 dark:bg-gray-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100/70 dark:bg-blue-900/40 flex items-center justify-center text-[#14236F] dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Klik untuk unggah foto kandidat
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Format: JPG, PNG, atau WebP (Maks. 5MB)
                  </p>
                </div>
              )}
              <h3 className="mt-1"><span className="text-lg text-red-500 font-extrabold">*Note:</span> Gunakan foto dengan ukuran rasio 1:1</h3>
            </div>
          </div>

          {/* Section 2: Visi */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Quote className="w-4 h-4 text-[#14236F] dark:text-blue-400" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Visi
              </h2>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="vision"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Pernyataan Visi <span className="text-red-500">*</span>
              </label>
              <textarea
                id="vision"
                name="vision"
                required
                rows={3}
                placeholder="Tuliskan visi kandidat..."
                value={formData.vision}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Section 3: Misi */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#14236F] dark:text-blue-400" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  Misi
                </h2>
                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md">
                  {missionList.filter((m) => m.trim()).length} item
                </span>
              </div>

              <button
                type="button"
                onClick={addMissionItem}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14236F] dark:text-blue-400 hover:text-[#1a2e8a] dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Tambah Misi
              </button>
            </div>

            <div className="space-y-3">
              {missionList.map((misi, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  {/* Nomor Misi */}
                  <div className="shrink-0 flex items-center justify-center w-7 h-7 mt-1.5 rounded-full bg-[#14236F] text-white text-xs font-bold">
                    {idx + 1}
                  </div>

                  {/* Input Misi */}
                  <input
                    type="text"
                    placeholder={`Misi ke-${idx + 1}...`}
                    value={misi}
                    onChange={(e) => handleMissionChange(idx, e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14236F] dark:focus:ring-blue-500 transition-all"
                  />

                  {/* Remove button */}
                  <button
                    type="button"
                    disabled={missionList.length <= 1}
                    onClick={() => removeMissionItem(idx)}
                    className="shrink-0 p-2 mt-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Masukkan poin-poin misi kandidat secara terpisah. Minimal 1 misi
              wajib diisi.
            </p>
          </div>

          {/* Feedback Message */}
          {message.text && (
            <div
              className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-1 duration-200 ${
                message.type === "error"
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
                  : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle className="w-5 h-5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Submit Footer */}
          <div className="px-6 py-4 bg-gray-50/60 dark:bg-gray-800/30 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={loading || electionsLoading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#14236F] hover:bg-[#1a2e8a] active:scale-[0.98] text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kandidat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

