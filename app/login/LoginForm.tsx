"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login gagal");
      }

      setSuccess("Login berhasil! Mengalihkan...");

      // Simpan data user ke localStorage atau context jika diperlukan
      sessionStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        router.push("/general");
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat login");
      }
    } finally {
      setLoading(false);
    }
  };

  const message = `Halo,

Saya mengalami kendala saat mencoba login ke dashboard admin admaja. Apakah bisa dibantu untuk mengecek dan mengatasi kendala tersebut?

Terima kasih atas bantuannya.`;

  const whatsappUrl = `https://wa.me/6289531310903?text=${encodeURIComponent(
    message,
  )}`;

  return (
    <div className="flex items-center justify-center px-4 py-12 min-h-screen bg-main">
      <div className="max-w-md w-full">
        <div className="bg-sec rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-center text-xl md:text-2xl font-extrabold text-white">
              Dashboard Admin <span className="text-[#FF0000]">Admaja</span>
            </h2>
            <p className="mt-4 text-center text-gray-400">Silahkan Login</p>

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500 text-red-500 rounded-md text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500 text-green-500 rounded-md text-sm text-center">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                {/* name Field */}
                <div className="relative flex items-center rounded-lg border border-[#3b5299] bg-transparent focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all duration-200">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <input
                    placeholder="Name"
                    className="w-full bg-transparent py-3 pl-11 pr-4 text-white placeholder:text-slate-400 text-sm focus:outline-none"
                    required
                    autoComplete="name"
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Password Field */}
                <div className="relative flex items-center rounded-lg border border-[#3b5299] bg-transparent focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all duration-200">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <input
                    placeholder="Password"
                    className="w-full bg-transparent py-3 pl-11 pr-11 text-white placeholder:text-slate-400 text-sm focus:outline-none"
                    required
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 stroke-[1.75]" />
                    ) : (
                      <Eye className="w-5 h-5 stroke-[1.75]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <p className="font-medium text-white cursor-pointer">
                    Lupa Password?{" "}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white"
                    >
                      Hubungi Developer
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <button
                  disabled={loading}
                  className={`group relative w-full flex justify-center py-3 px-4 
                            border border-transparent text-sm font-semibold
                              text-[#14236F] bg-white hover:bg-white/80 focus:outline-none 
                              focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                loading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                  type="submit"
                >
                  {loading ? "Memproses..." : "Masuk"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="px-8 py-4 text-center flex justify-center gap-2">
          <span className="text-white">Belum punya akun?</span>{" "}
          <p className="font-medium text-[#FFDDB5]">Hubungi Admin</p>
        </div>
      </div>
    </div>
  );
}
