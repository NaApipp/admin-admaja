"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Vote,
  CalendarCheck,
  Users,
  ShieldAlert,
  LogOut,
  Lock,
  Menu,
  X,
  Book,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
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
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) {
        const parsed = JSON.parse(sessionUser);
        setRole(parsed.role || null);
        setUserName(parsed.name || parsed.email || null);
      }
    } catch {
      setRole(null);
      setUserName(null);
    }

    const handleStorage = () => {
      try {
        const sessionUser = sessionStorage.getItem("user");
        if (sessionUser) {
          const parsed = JSON.parse(sessionUser);
          setRole(parsed.role || null);
          setUserName(parsed.name || parsed.email || null);
        }
      } catch {
        setRole(null);
        setUserName(null);
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
      name: "Manage Content",
      href: "/content",
      icon: Book,
    },
    {
      name: "Member / Anggota",
      href: "/member",
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
    <>
      <header className="lg:hidden fixed inset-x-0 top-0 z-50 h-16 border-b border-[#1e3388] bg-sec text-white">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          {/* Logo & Brand */}
          <Link
            href="/general"
            className="flex items-center gap-2.5 focus:outline-none"
          >
            <Image
              src="/logo-v2.png"
              alt="Logo Admaja"
              width={36}
              height={36}
              className="w-9 h-auto object-contain"
              priority
            />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white leading-tight">
                Dashboard
              </span>
              <span className="font-bold text-sm text-red-500">
                Admaja
              </span>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">

            {/* Hamburger Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 focus:outline-none transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Dropdown */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs">
          <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-sec border-b border-[#1e3388] text-white p-5 flex flex-col justify-between">
            {/* Nav Menu */}
            <div className="space-y-4">
              <nav>
                <ul className="space-y-1.5">
                  {visibleMenuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all`}
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
            <div className="pt-6 border-t border-white/10 mt-6">
              <form onSubmit={handleLogout}>
                <button
                  type="submit"
                  disabled={loggingOut}
                  className="group flex w-full h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white text-[#1e3388] hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>{loggingOut ? "Keluar..." : "Keluar dari Akun"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

