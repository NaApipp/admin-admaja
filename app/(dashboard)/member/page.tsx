import Link from "next/link";
import AddMember from "./AddMember";
import { Menu } from "lucide-react";

export default function MembersPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-y-4">
      <div className="">
        <h1 className="text-xl font-extrabold underline underline-offset-12">Halaman Member / Anggota</h1>
      </div>
      <div className="flex flex-col md:flex-row justify-center items-center gap-y-4 gap-x-4 md:mt-5">
        <AddMember />
        <Link href="/member/member-list">
          <button
            type="button"
            className="inline-flex items-center gap-2.5 bg-[#14236F] hover:bg-[#1a2e8a] active:scale-[0.98] text-white px-10 py-7.5  rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white">
              <Menu className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span>Daftar Member / Anggota</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
