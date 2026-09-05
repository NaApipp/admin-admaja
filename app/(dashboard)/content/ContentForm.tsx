"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  FileText,
  Tag,
  User,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  RotateCcw,
} from "lucide-react";

interface ContentFormProps {
  onSuccess?: (data?: any) => void;
  onCancel?: () => void;
}

const COMMON_LABELS = [
  "Berita",
  "Kegiatan",
  "Pengumuman",
  "Prestasi",
  "Edukasi",
  "Dokumentasi",
];

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CHARS = 150;

export default function ContentForm({ onSuccess, onCancel }: ContentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [label, setLabel] = useState("");
  const [author, setAuthor] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-fill author from logged-in session if available
  useEffect(() => {
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) {
        const parsed = JSON.parse(sessionUser);
        if (parsed?.name && !author) {
          setAuthor(parsed.name);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Cleanup object URL preview when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Handle file selection & validation
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({
        ...prev,
        image: "File yang diunggah harus berupa gambar (JPG, PNG, WebP).",
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFieldErrors((prev) => ({
        ...prev,
        image: `Ukuran gambar maksimal ${MAX_FILE_SIZE_MB}MB. Ukuran file: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB.`,
      }));
      return;
    }

    // Clear previous error
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = "Judul wajib diisi.";
    } else if (trimmedTitle.length < 3) {
      errors.title = "Judul minimal 3 karakter.";
    } else if (trimmedTitle.length > MAX_CHARS) {
      errors.title = `Judul maksimal ${MAX_CHARS} karakter.`;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      errors.content = "Konten wajib diisi.";
    } else if (trimmedContent.length < 3) {
      errors.content = "Konten minimal 3 karakter.";
    } else if (trimmedContent.length > MAX_CHARS) {
      errors.content = `Konten maksimal ${MAX_CHARS} karakter.`;
    }

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      errors.label = "Label / kategori wajib diisi.";
    } else if (trimmedLabel.length < 1) {
      errors.label = "Label minimal 1 karakter.";
    } else if (trimmedLabel.length > MAX_CHARS) {
      errors.label = `Label maksimal ${MAX_CHARS} karakter.`;
    }

    const trimmedAuthor = author.trim();
    if (!trimmedAuthor) {
      errors.author = "Penulis wajib diisi.";
    } else if (trimmedAuthor.length < 1) {
      errors.author = "Penulis minimal 1 karakter.";
    } else if (trimmedAuthor.length > MAX_CHARS) {
      errors.author = `Penulis maksimal ${MAX_CHARS} karakter.`;
    }

    if (!imageFile) {
      errors.image = "Gambar konten wajib diunggah.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = () => {
    setTitle("");
    setContent("");
    setLabel("");
    handleRemoveImage();
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("label", label.trim());
      formData.append("author", author.trim());
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/content", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Handle validation errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          const backendErrors: Record<string, string> = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            backendErrors[err.field] = err.message;
          });
          setFieldErrors(backendErrors);
          setGeneralError("Harap periksa kembali isian formulir.");
        } else {
          setGeneralError(data.error || "Gagal menyimpan konten. Silakan coba lagi.");
        }
        return;
      }

      // Success
      setSuccessMessage("Konten berhasil dibuat dan dipublikasikan!");
      handleReset();

      if (onSuccess) {
        onSuccess(data.data);
      }
    } catch (err: any) {
      setGeneralError(
        err?.message || "Terjadi kesalahan jaringan atau server tidak merespons."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#101320] via-[#12172D] to-[#1e3388] text-white">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Tambah Konten Baru
              </h2>
              <p className="text-sm text-blue-100/80 mt-1">
                Publikasikan artikel, berita, atau informasi terkini untuk Portal Admaja
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* General Alert */}
          {generalError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-medium">{generalError}</div>
              <button
                type="button"
                onClick={() => setGeneralError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
              <div className="flex-1 font-medium">{successMessage}</div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Form Inputs */}
            <div className="space-y-5">
              {/* Title */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Judul Konten <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-xs ${
                      title.length > MAX_CHARS
                        ? "text-red-500 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {title.length}/{MAX_CHARS}
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  maxLength={MAX_CHARS}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.title;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Contoh: Latihan Rutin & Persiapan Lomba Paskibra"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white ${
                    fieldErrors.title
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-slate-200 dark:border-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  }`}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              {/* Label / Kategori */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Label / Kategori <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-xs ${
                      label.length > MAX_CHARS
                        ? "text-red-500 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {label.length}/{MAX_CHARS}
                  </span>
                </div>
                <input
                  type="text"
                  value={label}
                  maxLength={MAX_CHARS}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    if (fieldErrors.label) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.label;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Ketik atau pilih label kategori..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white ${
                    fieldErrors.label
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-slate-200 dark:border-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  }`}
                />

                {/* Quick Selection Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400">Pilihan cepat:</span>
                  {COMMON_LABELS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setLabel(item);
                        if (fieldErrors.label) {
                          setFieldErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.label;
                            return copy;
                          });
                        }
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        label === item
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-gray-700 hover:bg-slate-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {fieldErrors.label && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.label}
                  </p>
                )}
              </div>

              {/* Author */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Penulis / Author <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-xs ${
                      author.length > MAX_CHARS
                        ? "text-red-500 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {author.length}/{MAX_CHARS}
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={author}
                  maxLength={MAX_CHARS}
                  onChange={(e) => {
                    setAuthor(e.target.value);
                    if (fieldErrors.author) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.author;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Nama pembuat konten"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white ${
                    fieldErrors.author
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-slate-200 dark:border-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  }`}
                />
                {fieldErrors.author && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.author}
                  </p>
                )}
              </div>

              {/* Content Description */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Isi Konten / Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-xs ${
                      content.length > MAX_CHARS
                        ? "text-red-500 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {content.length}/{MAX_CHARS}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={content}
                  maxLength={MAX_CHARS}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (fieldErrors.content) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.content;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Tuliskan ringkasan atau detail isi konten di sini..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white resize-none ${
                    fieldErrors.content
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-slate-200 dark:border-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  }`}
                />
                {fieldErrors.content && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.content}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Image Upload & Preview */}
            <div className="space-y-4 flex flex-col">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Foto / Gambar Konten <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-red-500">
                  Disarankan Ratio 4:3 Horizontal
                </p>
              </div>

              {/* Hidden Native Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {/* Dropzone or Preview */}
              {!imagePreview ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 min-h-[260px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]"
                      : fieldErrors.image
                      ? "border-red-300 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10 hover:border-red-400"
                      : "border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Klik untuk memilih atau seret gambar ke sini
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    Mendukung JPG, PNG, atau WebP. Maksimal ukuran file 2MB untuk menjaga performa portal.
                  </p>
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-slate-200 shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-gray-600 transition-colors"
                  >
                    Pilih File Gambar
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col border border-slate-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-gray-800 p-3">
                  <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-900">
                    <Image
                      src={imagePreview}
                      alt="Preview Konten"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Hapus gambar"
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors backdrop-blur-sm cursor-pointer shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-300">
                    <div className="truncate pr-2">
                      <p className="font-medium truncate">{imageFile?.name}</p>
                      <p className="text-slate-400">
                        {imageFile && (imageFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold shrink-0 cursor-pointer"
                    >
                      Ganti Gambar
                    </button>
                  </div>
                </div>
              )}

              {fieldErrors.image && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.image}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-gray-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Form
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span>Mengunggah Konten...</span>
                </>
              ) : (
                <>
                  <span>Publikasikan Konten</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
