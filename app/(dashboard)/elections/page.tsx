import Link from "next/link";
import ActiveElections from "./components/ActiveElections";

export default function ElectionsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pemilu Yang Sedang Berlangsung
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Daftar periode pemilu berstatus dibuka beserta kandidat calon ketua.
          </p>
        </div>
        <Link
          href={"/elections/elections-history"}
          className="inline-flex items-center gap-2.5 bg-[#14236F] hover:bg-[#1a2e8a] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          Histori Pemilu
        </Link>
      </div>
      <ActiveElections />
    </div>
  );
}
