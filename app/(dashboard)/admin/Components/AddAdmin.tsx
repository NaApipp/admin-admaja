"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function AddAdmin() {

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);


  const [formData, setFormData] = useState({
    name: "",
    angkatan: "",
    password: "",
    role: "",
    status: "",
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if(!res.ok){
        throw new Error(data.message || "Gagal menambahkan admin");
      }

      setMessage({
        type: "success",
        text: "Admin berhasil ditambahkan",
      });
      setFormData({
        name: "",
        angkatan: "",
        password: "",
        role: "",
        status: "",
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message,
      });
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="flex items-center justify-center">
      <div className="relative py-3 sm:max-w-xs sm:mx-auto">
        <form onSubmit={handleAddUser} className="min-h-96 px-8 py-6 mt-4 text-left bg-white dark:bg-gray-900 rounded-xl shadow-lg">
          <div className="flex flex-col justify-center items-center h-full select-none">
            <div className="flex flex-col items-center justify-center gap-2 mb-8">
              <Image src="/logo-v2.png" alt="Logo" width={50} height={50} />
              <p className="m-0 text-[16px] font-semibold dark:text-white">
                Tambah User Admin
              </p>
              <span className="m-0 text-xs max-w-[90%] text-center text-[#8B8E98]">
                Masukan data - data user admin yang ingin ditambahkan
              </span>
            </div>
            {/* form data */}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Name */}
            <div className="w-full flex flex-col gap-2 mb-5">
              <label className="font-semibold text-xs text-gray-400">
                Nama
              </label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nama"
                className="border rounded-lg px-3 py-2 text-sm w-full outline-none dark:border-gray-500 dark:bg-gray-900"
              />
            </div>

            {/* Angktan */}
            <div className="w-full flex flex-col gap-2 mb-5">
              <label className="font-semibold text-xs text-gray-400">
                Angkatan
              </label>
              <input
                type="angkatan "
                value={formData.angkatan }
                onChange={(e) =>
                  setFormData({ ...formData, angkatan : e.target.value })
                }
                placeholder="Angkatan"
                className="border rounded-lg px-3 py-2 text-sm w-full outline-none dark:border-gray-500 dark:bg-gray-900"
              />
            </div>
            
            {/* Sttaus */}
            <div className="w-full flex flex-col gap-2 mb-5">
              <label className="font-semibold text-xs text-gray-400">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm w-full outline-none dark:border-gray-500 dark:bg-gray-900"
              >
                <option value="">Pilih Status Admin</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Non Aktif</option>
                <option value="purnabakti">Purnabakti</option>
              </select>
            </div>

            {/* Role */}
            <div className="w-full flex flex-col gap-2 mb-5">
              <label className="font-semibold text-xs text-gray-400">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm w-full outline-none dark:border-gray-500 dark:bg-gray-900"
              >
                <option value="">Pilih Role Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            </div>

            {/* Password */}
            <div className="w-full flex flex-col gap-2 mb-5">
              <label className="font-semibold text-xs text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  required
                  className="border rounded-lg px-3 py-2 text-sm w-full outline-none dark:border-gray-500 dark:bg-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-4 text-xs font-medium ${
              message.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-2 px-8 bg-blue-500 hover:bg-blue-800 focus:ring-offset-blue-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg cursor-pointer select-none disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Tambah User Admin"}
          </button>

          
        </form>
      </div>
    </div>
  );
}