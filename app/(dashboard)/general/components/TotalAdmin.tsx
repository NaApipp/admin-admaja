"use client";

import { ArrowUpRight, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function TotalMemberActive() {
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/admin");
        const result = await response.json();
        if (result.success) {
          setTotal(result.total || 0);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
  if (loading) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100 animate-pulse">
        <div className="text-gray-400 font-medium tracking-wide">
          Memuat data...
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="relative group overflow-hidden bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] p-6 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-blue-500/20 hover:-translate-y-1 w-full">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-[0.05] rounded-full blur-3xl group-hover:opacity-10 transition-opacity" />

        <div className="relative flex items-center justify-between">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
            <Users className="w-6 h-6 text-white" />
          </div>
          <Link href="/admin">
            <div className="flex items-center gap-1 text-white/70 text-xs font-semibold bg-white/5 px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
              <span>Detail</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </Link>
        </div>

        <div className="relative mt-6">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
            Total Admin
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-4xl font-extrabold text-white tracking-tight">
              {total}
            </h2>
            <span className="text-white/40 text-sm font-medium">Admin</span>
          </div>
        </div>

        <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 opacity-50" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 opacity-20" />
          </div>
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-tighter">
            Live Status
          </span>
        </div>
      </div>
    </>
  );
}
