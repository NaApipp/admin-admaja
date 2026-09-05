import Link from "next/link";
import ContentForm from "./ContentForm";

export default function ContentPage() {
  return (
    <div className="w-full min-h-[calc(100vh-120px)] p-4 sm:p-6 lg:p-8 flex flex-col justify-start items-center">
      <div className="w-full max-w-4xl mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Manajemen Konten
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Kelola dan terbitkan artikel, berita, serta dokumentasi kegiatan
              Paskibra Admaja.
            </p>
          </div>
          <Link
            href={"/content/content-history"}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <span>History Konten</span>
          </Link>
        </div>
      </div>

      <ContentForm />
    </div>
  );
}
