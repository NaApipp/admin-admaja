import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MemberListContainer from "./components/MemberListContainer";

export default function MemberListPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/member">
              <button
                type="button"
                className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-white">
                Daftar Anggota
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola data seluruh anggota Paskibra
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <MemberListContainer />

      </div>
    </div>
  );
}
