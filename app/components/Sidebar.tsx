"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Vote,
  CalendarCheck,
  Users,
  ShieldAlert,
  LogOut,
  Lock,
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) {
        const parsed = JSON.parse(sessionUser);
        return parsed.role || null;
      }
    } catch {
      return null;
    }
    return null;
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const sessionUser = sessionStorage.getItem("user");
        if (sessionUser) {
          const parsed = JSON.parse(sessionUser);
          setRole(parsed.role || null);
        }
      } catch {
        setRole(null);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const menuItems = [
    {
      name: "General",
      href: "/general",
      icon: LayoutDashboard,
    },
    {
      name: "Pemilu",
      href: "/elections",
      icon: Vote,
    },
    {
      name: "Absensi",
      href: "/attendance",
      icon: CalendarCheck,
    },
    {
      name: "Member / Anggota",
      href: "/members",
      icon: Users,
    },
    {
      name: "Admin",
      href: "/admin",
      icon: ShieldAlert,
    },
    {
      name: "Password Saver",
      href: "/password_saver",
      icon: Lock,
      roles: ["super_admin"],
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  });

  // Handle Logout
  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      sessionStorage.removeItem("user");
      router.push("/login");
    }
  };

  return (
    <aside className="hidden lg:flex flex-col justify-between h-screen w-64 border-r border-[#1e3388] bg-sec text-white shrink-0">
      {/* Header & Navigation */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 px-2 mb-8">
          <Image
            src="/logo-v2.png"
            alt="Logo Admaja"
            width={48}
            height={48}
            className="w-12 h-auto object-contain"
            priority
          />
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">
              Dashboard
            </h1>
            <span className="text-sm font-semibold text-red-500 tracking-wide">
              Admaja
            </span>
          </div>
        </div>

        <nav>
          <ul className="space-y-1.5">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
            //   const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all 
                    text-blue-100/80 hover:bg-white/10 hover:text-white duration-200`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleLogout}>
          <button
            type="submit"
            disabled={loggingOut}
            className="group flex w-full h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold bg-white text-[#1e3388] hover:bg-white/90 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
