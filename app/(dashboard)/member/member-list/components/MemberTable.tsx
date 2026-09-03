"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Member } from "./types";
import { StatusDropdown } from "./StatusBadge";

interface MemberTableProps {
  members: Member[];
  updatingId: string | null;
  deletingId: string | null;
  onStatusUpdate: (userId: string, status: Member["status"]) => void;
  onDelete: (userId: string, name: string) => void;
}

export default function MemberTable({
  members,
  updatingId,
  deletingId,
  onStatusUpdate,
  onDelete,
}: MemberTableProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
        <p className="text-base font-semibold">Tidak ada data anggota</p>
        <p className="text-sm mt-1">Coba ubah filter atau tambahkan anggota baru.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full text-sm">
        {/* Header */}
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
              Nama
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
              NISN
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell">
              Angkatan
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell">
              Kelas
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
          {members.map((member, idx) => {
            const isUpdating = updatingId === member.user_id;
            const isDeleting = deletingId === member.user_id;
            const isDisabled = isUpdating || isDeleting;

            return (
              <tr
                key={member.user_id}
                className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  isDisabled ? "opacity-60" : ""
                }`}
              >
                {/* No */}
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                  {idx + 1}
                </td>

                {/* Nama */}
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {member.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 md:hidden">
                    Angkatan {member.angkatan} · {member.kelas}
                  </p>
                </td>

                {/* NISN */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {member.nisn}
                  </span>
                </td>

                {/* Angkatan */}
                <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-300 text-xs font-medium">
                  {member.angkatan}
                </td>

                {/* Kelas */}
                <td className="px-4 py-3 hidden lg:table-cell text-slate-600 dark:text-slate-300 text-xs">
                  {member.kelas}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusDropdown
                    userId={member.user_id}
                    currentStatus={member.status}
                    onUpdate={onStatusUpdate}
                    isLoading={isUpdating}
                  />
                </td>

                {/* Aksi */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => onDelete(member.user_id, member.name)}
                      disabled={isDisabled}
                      title="Hapus anggota"
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-950/40 hover:text-rose-400 border border-transparent hover:border-rose-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
