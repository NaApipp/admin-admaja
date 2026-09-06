"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Shield,
  KeyRound,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Lock,
  History,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import VaultStats from "./Components/VaultStats";
import VaultList from "./Components/VaultList";
import VaultModal from "./Components/VaultModal";
import VaultAuditLog from "./Components/VaultAuditLog";

interface VaultItem {
  id?: string;
  vault_id?: string;
  _id?: string;
  account_name: string;
  platform: string;
  username: string;
  password?: string;
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PasswordSaverPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"credentials" | "audit">("credentials");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<VaultItem | null>(null);

  // Toast / Alert notification
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Check super_admin role from session
  useEffect(() => {
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) {
        const parsed = JSON.parse(sessionUser);
        if (parsed.role === "super_admin") {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      } else {
        setIsSuperAdmin(false);
      }
    } catch {
      setIsSuperAdmin(false);
    }
  }, []);

  // Fetch credentials from API
  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault");
      const data = await res.json();

      if (res.status === 403) {
        setIsSuperAdmin(false);
        return;
      }

      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data vault:", error);
      showToast("Gagal mengambil data kredensial dari server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin === true) {
      fetchCredentials();
    }
  }, [isSuperAdmin]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        item.account_name.toLowerCase().includes(query) ||
        item.platform.toLowerCase().includes(query) ||
        item.username.toLowerCase().includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query));

      const matchPlatform =
        selectedPlatform === "all" ||
        item.platform.toLowerCase() === selectedPlatform.toLowerCase();

      return matchSearch && matchPlatform;
    });
  }, [items, searchQuery, selectedPlatform]);

  // Available unique platforms for filter dropdown
  const platformOptions = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => i.platform)));
    return list;
  }, [items]);

  const handleCreateNew = () => {
    setSelectedItemForEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: VaultItem) => {
    setSelectedItemForEdit(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vault/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menghapus kredensial");
      }

      showToast("Kredensial berhasil dihapus dari brankas");
      fetchCredentials();
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan saat menghapus", "error");
    }
  };

  // Loading state awal pengecekan role
  if (isSuperAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400">Memverifikasi otorisasi Super Admin...</p>
        </div>
      </div>
    );
  }

  // Jika bukan super admin, tolak akses dengan tampilan rapi
  if (isSuperAdmin === false) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-[#12172D] border border-rose-500/30 rounded-3xl text-center text-white shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Akses Terbatas: Khusus Super Admin</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
          Modul Password Saver (Vault Kredensial) memuat data sensitif organisasi dan hanya dapat diakses
          oleh akun dengan peran <strong>Super Admin</strong>.
        </p>
        <Link
          href="/general"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-medium backdrop-blur-md ${
              notification.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/30 text-rose-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Password Saver
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Super Admin Vault
            </span>
          </div>
          <p className="text-xs text-blue-200/60 max-w-xl">
            Pusat penyimpanan kredensial akun media sosial & layanan resmi Paskibra SMKN 4 Kendal
            terenkripsi standar industri AES-256.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* <button
            onClick={fetchCredentials}
            disabled={loading}
            title="Muat ulang data brankas"
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button> */}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kredensial</span>
          </button>
        </div>
      </div>

      {/* Top Statistics */}
      <VaultStats items={items} />

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-[#12172D] p-3 rounded-2xl border border-white/10 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0c1020] rounded-xl border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab("credentials")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "credentials"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Daftar Kredensial ({items.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Audit Log</span>
          </button>
        </div>

        {/* Search and Platform Filter (Active on credentials tab) */}
        {activeTab === "credentials" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama akun, platform..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0c1020] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Platform Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 bg-[#0c1020] border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">Semua Platform</option>
                {platformOptions.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content View */}
      {activeTab === "credentials" ? (
        <VaultList
          items={filteredItems}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchCredentials}
        />
      ) : (
        <VaultAuditLog />
      )}

      {/* Add / Edit Modal */}
      <VaultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          showToast(
            selectedItemForEdit
              ? "Kredensial berhasil diperbarui"
              : "Kredensial baru berhasil disimpan"
          );
          fetchCredentials();
        }}
        initialData={selectedItemForEdit}
      />
    </div>
  );
}
