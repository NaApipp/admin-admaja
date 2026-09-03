"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) {
        const user = JSON.parse(sessionUser);
        setName(user.name || "");
      }
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
    }
  }, []);

  return (
    <header className="p-4">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-white">
          Halo, <span className="font-bold text-blue-400">{name || "Admin"}</span>
        </h1>
      </div>
    </header>
  );
}
