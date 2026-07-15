import { useState, useEffect } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { apiClient } from "@/services/api/api";

interface User {
  id: number;
  name: string;
  email: string;
  department_id?: string;
  department_name?: string;
  roles: string[];
  is_active: boolean;
  can_request: boolean;
}

export default function GAHRDUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Tabs management
  const [activeTab, setActiveTab] = useState<"users" | "guards">("users");

  // Guards states
  const [guards, setGuards] = useState<any[]>([]);
  const [newGuardName, setNewGuardName] = useState("");
  const [guardsLoading, setGuardsLoading] = useState(false);
  const [guardsError, setGuardsError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/users", {
        params: { search: search || undefined, per_page: 100 }
      });
      if (res.data && res.data.status === "success") {
        setUsers(res.data.data);
      } else {
        setError("Gagal memuat daftar user.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGuards = async () => {
    setGuardsLoading(true);
    setGuardsError(null);
    try {
      const res = await apiClient.get("/security-guards");
      if (res.data && res.data.status === "success") {
        setGuards(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setGuardsError("Gagal memuat daftar petugas Security.");
    } finally {
      setGuardsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchGuards();
    }
  }, [search, activeTab]);

  const handleToggleActive = async (user: User) => {
    try {
      const res = await apiClient.post(`/users/${user.id}/toggle-active`);
      if (res.data && res.data.status === "success") {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal mengubah status aktif.");
    }
  };

  const handleToggleRequest = async (user: User) => {
    try {
      const res = await apiClient.post(`/users/${user.id}/toggle-request`);
      if (res.data && res.data.status === "success") {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, can_request: !u.can_request } : u));
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal mengubah hak request.");
    }
  };

  const handleAddGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardName.trim()) return;

    try {
      const res = await apiClient.post("/security-guards", {
        name: newGuardName.trim()
      });
      if (res.data && res.data.status === "success") {
        setNewGuardName("");
        fetchGuards();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menambahkan petugas security.");
    }
  };

  const handleDeleteGuard = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus petugas ini dari daftar?")) return;

    try {
      const res = await apiClient.delete(`/security-guards/${id}`);
      if (res.data && res.data.status === "success") {
        fetchGuards();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus petugas security.");
    }
  };

  return (
    <Layout
      activeNav="User Activation"
      topbarTitle="Aktivasi & Hak Akses Pengguna"
      searchPlaceholder={activeTab === "users" ? "Cari nama atau email..." : undefined}
      searchValue={activeTab === "users" ? search : ""}
      onSearchChange={activeTab === "users" ? setSearch : undefined}
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-4 sm:p-8">
        <div className="text-[18px] font-bold text-[#0f172a] mb-1">Aktivasi & Akses Karyawan</div>
        <div className="text-[13px] text-[#64748b] mb-6 max-w-2xl">
          Aktifkan pendaftaran karyawan baru, berikan hak akses pengajuan, atau kelola nama petugas jaga Security.
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "users"
                ? "border-blue-800 text-blue-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Aktivasi Karyawan
          </button>
          <button
            onClick={() => setActiveTab("guards")}
            className={`px-6 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "guards"
                ? "border-blue-800 text-blue-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Kelola Petugas Security
          </button>
        </div>

        {activeTab === "users" ? (
          loading ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-3" />
              <p className="text-[13px] text-[#64748b] font-medium">Memuat data user...</p>
            </div>
          ) : error ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-3 text-red-600 text-[13.5px] font-semibold">
              <Icon name="error" className="text-[20px]" />
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center">
              <Icon name="group_off" className="text-[40px] text-[#cbd5e1] mb-2" />
              <p className="font-bold text-[#0f172a]">Tidak ada user ditemukan</p>
              <p className="text-[13px] text-[#64748b] mt-1">Coba kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[600px]">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Nama Karyawan</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Departemen</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Peran (Role)</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8] text-center">Status Aktivasi</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8] text-center">Akses Request</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f8fafc]">
                    {users.map((u) => {
                      const isEmployee = u.roles.some(r => r.toLowerCase() === "employee");
                      
                      return (
                        <tr key={u.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-[#0f172a]">{u.name}</div>
                            <div className="text-[11px] text-[#94a3b8] font-mono">{u.email}</div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-[#475569]">
                            {u.department_name || u.department_id || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map(r => (
                                <span key={r} className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleActive(u)}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                u.is_active
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200"
                              }`}
                            >
                              {u.is_active ? "Aktif" : "Non-aktif (Butuh Aktivasi)"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isEmployee ? (
                              <button
                                onClick={() => handleToggleRequest(u)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  u.can_request
                                    ? "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                {u.can_request ? "Bisa Request" : "Hanya View (View-Only)"}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-6 animate-fadein">
            {/* Form Tambah Petugas */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm max-w-xl">
              <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Icon name="person_add" className="text-blue-800 text-lg" />
                Tambah Petugas Jaga Baru
              </div>
              <form onSubmit={handleAddGuard} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Icon name="badge" className="text-lg" />
                  </span>
                  <input
                    type="text"
                    required
                    value={newGuardName}
                    onChange={(e) => setNewGuardName(e.target.value)}
                    placeholder="Masukkan Nama Petugas (Contoh: Sutrisno)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1e3a8a] text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <Icon name="add" className="text-lg" />
                  Tambah
                </button>
              </form>
            </div>

            {/* List Petugas */}
            {guardsLoading ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl py-12 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-3" />
                <p className="text-[13px] text-[#64748b] font-medium">Memuat daftar petugas...</p>
              </div>
            ) : guardsError ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-3 text-red-600 text-[13.5px] font-semibold">
                <Icon name="error" className="text-[20px]" />
                {guardsError}
              </div>
            ) : guards.length === 0 ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl py-12 flex flex-col items-center">
                <Icon name="verified_user" className="text-[40px] text-[#cbd5e1] mb-2" />
                <p className="font-bold text-[#0f172a]">Belum ada petugas jaga terdaftar</p>
                <p className="text-[13px] text-[#64748b] mt-1">Gunakan form di atas untuk menambahkan petugas.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm max-w-xl">
                <div className="px-6 py-4 bg-[#f8fafc] border-b border-[#f1f5f9] text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">
                  Daftar Petugas Security Terdaftar
                </div>
                <div className="divide-y divide-[#f1f5f9]">
                  {guards.map((guard: any) => (
                    <div key={guard.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 text-blue-800 rounded-lg flex items-center justify-center font-bold text-xs">
                          {guard.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="font-bold text-slate-700 text-sm">{guard.name}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteGuard(guard.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Petugas"
                      >
                        <Icon name="delete" className="text-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
