"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
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
    <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 sm:px-8 lg:px-12">
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden flex items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#dbeafe]">
            <img
              src="https://admajaskanifo.org/logo-v2.png"
              alt="Logo Admaja"
            />
          </div>
          <span>
            <p className=" text-xs font-bold tracking-[0.2em] text-[#1E3E62]">
            ADMAJA
          </p>
          <p className=" text-sm text-slate-500">Paskibra SMKN 4 Kendal</p>
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.06] sm:p-9">
          <div className="mb-8">
            <p className="text-sm font-semibold text-[#1E3E62]">
              DASHBOARD ADMIN
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#101320] sm:text-3xl">
              Selamat datang
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Masuk untuk melanjutkan pengelolaan organisasi Admaja.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Username
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-300 bg-white transition-colors focus-within:border-[#1E3E62] focus-within:ring-4 focus-within:ring-[#1E3E62]/10">
                  <User
                    aria-hidden="true"
                    className="absolute left-3.5 h-5 w-5 text-slate-400"
                  />
                  <input
                    className="w-full rounded-xl bg-transparent py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    placeholder="Masukkan username"
                    required
                    autoComplete="username"
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Kata sandi
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-300 bg-white transition-colors focus-within:border-[#1E3E62] focus-within:ring-4 focus-within:ring-[#1E3E62]/10">
                  <Lock
                    aria-hidden="true"
                    className="absolute left-3.5 h-5 w-5 text-slate-400"
                  />
                  <input
                    placeholder="Masukkan kata sandi"
                    className="w-full rounded-xl bg-transparent py-3.5 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
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
                    className="absolute right-1.5 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-[#1E3E62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3E62]"
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      <Eye aria-hidden="true" className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end text-sm">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#1E3E62] underline-offset-4 hover:underline"
              >
                Lupa kata sandi?
              </a>
            </div>

            <button
              disabled={loading}
              className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3E62] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1E3E62]/20 transition-colors hover:bg-[#173451] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E3E62]/25 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
            >
              {loading ? "Memproses..." : "Masuk ke dashboard"}
              {!loading && (
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Belum memiliki akun?{" "}
          <span className="font-medium text-[#1E3E62]">Hubungi admin.</span>
        </p>
      </div>
    </section>
  );
}
