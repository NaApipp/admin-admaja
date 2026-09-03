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
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Admin
          </span>
        );
      case "super_admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold  bg-red-950/40 text-red-400 border border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Super Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {status || "-"}
          </span>
        );
    }
  };

  return (
    <>
      <div className="hidden md:flex overflow-x-auto mt-3 rounded-lg border border-lime-200 bg-white shadow-sm dark:border-lime-900/40 dark:bg-slate-900">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-lime-50 text-lime-900 dark:bg-slate-800 dark:text-lime-200">
            <tr>
              <th className="px-2 py-2 text-left font-semibold sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                User Id
              </th>
              <th className="px-2 py-2 text-left font-semibold sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                Nama
              </th>
              <th className="hidden px-3 py-2.5 text-left font-semibold sm:table-cell md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                Username
              </th>
              <th className="px-2 py-2 text-left font-semibold sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                Role
              </th>
            </tr>
          </thead>
          {users.map((user) => (
            <tbody className="divide-y divide-lime-100 dark:divide-slate-800">
              <tr
                key={user.user_id}
                className="transition hover:bg-lime-50 dark:hover:bg-slate-800/70"
              >
                {/* User ID */}
                <td className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {user.user_id}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                    {user.angkatan}
                  </div>
                </td>
                {/* Nama */}
                <td className="hidden px-3 py-2.5 text-slate-600 dark:text-slate-400 sm:table-cell md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                  {user.name}
                </td>
                {/* Role */}
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                  <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-lime-800 dark:text-lime-300 sm:bg-transparent sm:px-0 sm:py-0 sm:font-normal sm:text-slate-700 sm:dark:text-slate-300">
                    {user.username || "Admin123"}
                  </span>
                </td>
                {/* Role */}
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-3.5">
                  {getRoleStyle(user.role)}
                </td>
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}
