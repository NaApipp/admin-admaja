"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Import Componets Sidebar
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return null; // loading spinner
  }

  return (
    <div className="flex h-screen bg-main overflow-hidden">
      <Navbar />
      <Sidebar />
      <main className="flex-1 flex flex-col justify-between overflow-y-auto pt-16 lg:pt-0">
        <div className="flex-1 p-4 md:p-6">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}