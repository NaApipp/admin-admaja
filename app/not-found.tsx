"use client";

import { ArrowLeft, CircleGauge } from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "./components/Footer";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-main px-4">
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-white text-9xl font-black">404</h1>
          <p className="text-white text-2xl font-bold mb-4 mt-8">
            Halaman tidak ditemukan
          </p>
          <p className="text-white text-lg mb-4">
            Maaf, halaman yang ada cari mungkin telah dipindahkan atau tidak ada
            lagi.
          </p>
          <div className="flex md:flex-row flex-col justify-between gap-5 mb-12">
            {/* Button Kembali */}
            <button
              onClick={() => router.back()}
              className="border w-full h-[4rem] flex justify-center items-center rounded-md bg-white flex items-center gap-2 text-[#293681]
                      hover:bg-white/90 transition-all duration-300 ease-in-out cursor-pointer"
            >
              <ArrowLeft />
              Kembali
            </button>

            {/* Button Report */}
            <a
              href="mailto:support@admajaskanifo.org"
              className="border w-full h-[4rem] flex justify-center items-center rounded-md
                      hover:bg-white/10 transition-all duration-300 ease-in-out"
            >
              <span className="flex items-center gap-2 text-white">
                <CircleGauge />
                Laporkan Masalah
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
