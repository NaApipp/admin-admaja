"use client";

import { useEffect, useState } from "react";

export default function DataAdmin() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const adminUsers = data.data.filter((user: any) => user.role === "admin");
        setUsers(adminUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleDelete = async (user_id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return;

    try {
      const res = await fetch(`/api/admin/${user_id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-lime-200 bg-white shadow-sm dark:border-lime-900/40 dark:bg-slate-900">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-lime-50 text-lime-900 dark:bg-slate-800 dark:text-lime-200">
            <tr>
              <th className=" px-3 py-2.5 text-left font-semibold sm:table-cell md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                Name
              </th>
              <th className="px-2 py-2 text-left font-semibold sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                Angkatan
              </th>
              <th className="px-2 py-2 text-left font-semibold sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                Role
              </th>
              <th className="hidden px-2 py-2 text-left font-semibold sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                Status
              </th>
              <th className="px-2 py-2 text-center font-semibold sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                Kontrol
              </th>
            </tr>
          </thead>

          {users.map((user) => (
            <tbody className="divide-y divide-lime-100 dark:divide-slate-800">
              <tr className="transition hover:bg-lime-50 dark:hover:bg-slate-800/70">
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 sm:table-cell md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                  {user.name}
                </td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                  <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-lime-800 dark:text-lime-300 sm:bg-transparent sm:px-0 sm:py-0 sm:font-normal sm:text-slate-700 sm:dark:text-slate-300">
                    {user.angkatan}
                  </span>
                </td>
                <td className="px-2 py-2 text-right sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                  <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-lime-800 dark:text-lime-300 sm:bg-transparent sm:px-0 sm:py-0 sm:font-normal sm:text-slate-700 sm:dark:text-slate-300">
                    {user.role}
                  </span>
                </td>
                <td className="hidden px-2 py-2 text-right sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                  <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-lime-800 dark:text-lime-300 sm:bg-transparent sm:px-0 sm:py-0 sm:font-normal sm:text-slate-700 sm:dark:text-slate-300">
                    {user.status}
                  </span>
                </td>
                <td className="px-2 py-2 text-right sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-end sm:gap-1.5">
                    <button
                      onClick={() => handleDelete(user.user_id)}
                      className="cursor-pointer rounded-lg bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-900/60 sm:px-3 sm:py-1.5 sm:text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
