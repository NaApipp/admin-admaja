import {
  ArrowUpRight,
  CalendarCheck2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

export default function SplashScreen() {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#101320] text-white lg:col-span-2 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -top-32 h-[30rem] w-[30rem] rounded-full border border-white/10"
      >
        <div className="absolute inset-10 rounded-full border border-white/10" />
        <div className="absolute inset-24 rounded-full bg-[#1E3E62]/40 blur-3xl" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-[#1E3E62]/30 blur-3xl"
      />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#dbeafe]">
          <img src="https://admajaskanifo.org/logo-v2.png" alt="Logo Admaja" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-[0.2em]">ADMAJA</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Paskibra SMKN 4 Kendal
          </p>
        </div>
      </div>

      <div className="relative my-16 max-w-xl xl:my-0">
        
        <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
          Satu ruang untuk mengelola{" "}
          <span className="text-red-700">Admaja.</span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
          Kelola data anggota, presensi kegiatan, dan pemilihan ketua dengan
          lebih terarah dalam satu dashboard.
        </p>

        {/* <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
            <UsersRound
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-blue-200"
            />
            <span className="text-sm text-slate-200">Data anggota</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
            <CalendarCheck2
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-blue-200"
            />
            <span className="text-sm text-slate-200">Presensi kegiatan</span>
          </div>
        </div> */}
      </div>

      <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-400">
        <span>Dashboard Admin Admaja</span>
        <Link href={"http://portal.admajaskanifo.org/"} target="blank">
          <span className="inline-flex items-center gap-1.5">
            Akses Portal Admaja
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </aside>
  );
}
