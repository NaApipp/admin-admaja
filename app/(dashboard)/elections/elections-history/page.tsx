import ElectionsHistory from "./HistoryElections";
import AddElections from "./AddElections";

export default function ElectionsHistoryPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Riwayat & Manajemen Pemilu
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Kelola status dan pantau seluruh periode pemilihan ketua.
          </p>
        </div>

        <AddElections />
      </div>

      <ElectionsHistory />
    </div>
  );
}
