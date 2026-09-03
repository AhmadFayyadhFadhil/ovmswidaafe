import { useState, useEffect, useMemo } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { apiClient } from "@/services/api/api";
import { userService } from "@/services/modules/userService";
import { departmentService, type Department } from "@/services/modules/departmentService";
import { useAuthContext } from "@/auth/authContext";

interface UserItem {
  id: string;
  nik: string;
  name: string;
  email: string;
  department_id?: string;
  department_name?: string;
  roles: string[];
  is_active: boolean;
  can_request: boolean;
  rank?: string;
  is_department_head?: boolean;
  avatar_url?: string;
  sim_type?: string;
  sim_number?: string;
  sim_expiry_date?: string;
  sim_status?: string;
  sim_expiry_days_left?: number | null;
}

export default function GAHRDUsersPage() {
  const { user: currentUser } = useAuthContext();

  // Tab State
  const [activeTab, setActiveTab] = useState<"users" | "guards">("users");

  // Users Data State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  // Departments List State
  const [departments, setDepartments] = useState<Department[]>([]);

  // Security Guards State
  const [guards, setGuards] = useState<any[]>([]);
  const [newGuardName, setNewGuardName] = useState("");
  const [guardsLoading, setGuardsLoading] = useState(false);
  const [guardsError, setGuardsError] = useState<string | null>(null);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: UserItem | null;
    deleting: boolean;
    error: string | null;
  }>({
    isOpen: false,
    user: null,
    deleting: false,
    error: null,
  });

  // Add User Form State
  const [addForm, setAddForm] = useState({
    nik: "",
    name: "",
    email: "",
    password: "",
    role: "Employee",
    rank: "",
    department_id: "",
    is_department_head: false,
    sim_type: "SIM A",
    sim_number: "",
    sim_expiry_date: "",
  });
  const [addSimFile, setAddSimFile] = useState<File | null>(null);
  const [addFormError, setAddFormError] = useState("");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    nik: "",
    name: "",
    email: "",
    password: "",
    role: "Employee",
    rank: "",
    department_id: "",
    is_department_head: false,
    sim_type: "SIM A",
    sim_number: "",
    sim_expiry_date: "",
  });
  const [editSimFile, setEditSimFile] = useState<File | null>(null);
  const [editFormError, setEditFormError] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Toast / Alert Notification State
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/users", {
        params: { search: search || undefined, per_page: 200 }
      });
      if (res.data && res.data.status === "success") {
        const rawData = res.data.data || [];
        const mapped = rawData.map((u: any) => ({
          id: String(u.id),
          nik: u.nik || "-",
          name: u.name || "No Name",
          email: u.email || "",
          department_id: u.department_id ? String(u.department_id) : "",
          department_name: u.department_name || "-",
          roles: Array.isArray(u.roles) ? u.roles : ["Employee"],
          is_active: u.is_active !== undefined ? Boolean(u.is_active) : (u.availability_status === "available" || u.availability_status === "ACTIVE"),
          can_request: u.can_request !== undefined ? Boolean(u.can_request) : true,
          rank: u.rank || "",
          is_department_head: Boolean(u.is_department_head),
          avatar_url: u.sim_a_photo_url || u.avatar_url,
          sim_type: u.sim_type || "SIM A",
          sim_number: u.sim_number || "",
          sim_expiry_date: u.sim_expiry_date || "",
          sim_status: u.sim_status || (u.sim_expiry_date ? "valid" : "not_set"),
          sim_expiry_days_left: u.sim_expiry_days_left ?? null,
        }));
        setUsers(mapped);
      } else {
        setError("Gagal memuat daftar pengguna.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal terhubung ke server untuk mengambil data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      const res = await departmentService.getAll();
      if (res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat daftar departemen:", err);
    }
  };

  // Fetch Security Guards
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
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchGuards();
    }
  }, [activeTab]);

  // Quick Action: Toggle Active Status
  const handleToggleActive = async (targetUser: UserItem) => {
    try {
      const res = await apiClient.post(`/users/${targetUser.id}/toggle-active`);
      if (res.data && res.data.status === "success") {
        setUsers(prev =>
          prev.map(u => (u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u))
        );
        showToast(`Status pengguna ${targetUser.name} berhasil diperbarui.`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Gagal mengubah status aktivasi pengguna.", "error");
    }
  };

  // Quick Action: Toggle Can Request Privilege
  const handleToggleRequest = async (targetUser: UserItem) => {
    try {
      const res = await apiClient.post(`/users/${targetUser.id}/toggle-request`);
      if (res.data && res.data.status === "success") {
        setUsers(prev =>
          prev.map(u => (u.id === targetUser.id ? { ...u, can_request: !u.can_request } : u))
        );
        showToast(`Hak pengajuan ${targetUser.name} berhasil diperbarui.`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Gagal mengubah hak akses pengajuan.", "error");
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError("");

    if (!addForm.name.trim() || !addForm.email.trim()) {
      setAddFormError("Nama dan Email wajib diisi.");
      return;
    }
    if (!addForm.password || addForm.password.length < 6) {
      setAddFormError("Password minimal 6 karakter.");
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const formData = new FormData();
      if (addForm.nik.trim()) formData.append("nik", addForm.nik.trim());
      formData.append("name", addForm.name.trim());
      formData.append("email", addForm.email.trim());
      formData.append("password", addForm.password);
      formData.append("role", addForm.role);
      if (addForm.role === "Driver" || addForm.role === "Driver Coordinator") {
        formData.append("sim_type", addForm.sim_type || "SIM A");
        if (addForm.sim_number.trim()) formData.append("sim_number", addForm.sim_number.trim());
        if (addForm.sim_expiry_date) formData.append("sim_expiry_date", addForm.sim_expiry_date);
        if (addSimFile) formData.append("sim_a_photo", addSimFile);
      }

      await userService.create(formData);
      showToast("Pengguna baru berhasil ditambahkan!");
      setIsAddModalOpen(false);
      setAddForm({
        nik: "",
        name: "",
        email: "",
        password: "",
        role: "Employee",
        rank: "",
        department_id: "",
        is_department_head: false,
        sim_type: "SIM A",
        sim_number: "",
        sim_expiry_date: "",
      });
      setAddSimFile(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setAddFormError(err.response?.data?.message || err.message || "Gagal membuat pengguna baru.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (userItem: UserItem) => {
    setEditingUser(userItem);
    setEditForm({
      nik: userItem.nik === "-" ? "" : userItem.nik,
      name: userItem.name,
      email: userItem.email,
      password: "",
      role: userItem.roles[0] || "Employee",
      rank: userItem.rank || "",
      department_id: userItem.department_id || "",
      is_department_head: Boolean(userItem.is_department_head),
      sim_type: userItem.sim_type || "SIM A",
      sim_number: userItem.sim_number || "",
      sim_expiry_date: userItem.sim_expiry_date || "",
    });
    setEditSimFile(null);
    setEditFormError("");
    setIsEditModalOpen(true);
  };

  // Handle Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditFormError("");

    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditFormError("Nama dan Email wajib diisi.");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      if (editForm.nik.trim()) formData.append("nik", editForm.nik.trim());
      formData.append("name", editForm.name.trim());
      formData.append("email", editForm.email.trim());
      if (editForm.password.trim()) formData.append("password", editForm.password.trim());
      formData.append("role", editForm.role);
      if (editForm.rank.trim()) formData.append("rank", editForm.rank.trim());
      if (editForm.department_id) formData.append("department_id", editForm.department_id);
      formData.append("is_department_head", editForm.is_department_head ? "1" : "0");
      if (editForm.role === "Driver" || editForm.role === "Driver Coordinator") {
        formData.append("sim_type", editForm.sim_type || "SIM A");
        if (editForm.sim_number.trim()) formData.append("sim_number", editForm.sim_number.trim());
        if (editForm.sim_expiry_date) formData.append("sim_expiry_date", editForm.sim_expiry_date);
        if (editSimFile) formData.append("sim_a_photo", editSimFile);
      }

      await userService.update(editingUser.id, formData);
      showToast(`Data pengguna ${editForm.name} berhasil diperbarui!`);
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setEditFormError(err.response?.data?.message || err.message || "Gagal memperbarui pengguna.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Confirm Delete User
  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return;

    setDeleteModal(prev => ({ ...prev, deleting: true, error: null }));
    try {
      await userService.delete(deleteModal.user.id, {
        fullName: deleteModal.user.name,
        email: deleteModal.user.email,
        roleName: deleteModal.user.roles[0],
        department_id: deleteModal.user.department_id,
      });
      showToast(`Pengguna ${deleteModal.user.name} berhasil dihapus/dinonaktifkan.`);
      setDeleteModal({ isOpen: false, user: null, deleting: false, error: null });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setDeleteModal(prev => ({
        ...prev,
        deleting: false,
        error: err.response?.data?.message || "Gagal menghapus pengguna. Silakan coba lagi.",
      }));
    }
  };

  // Security Guards Handlers
  const handleAddGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardName.trim()) return;

    try {
      const res = await apiClient.post("/security-guards", {
        name: newGuardName.trim()
      });
      if (res.data && res.data.status === "success") {
        setNewGuardName("");
        showToast("Petugas Security berhasil ditambahkan.");
        fetchGuards();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Gagal menambahkan petugas security.", "error");
    }
  };

  const handleDeleteGuard = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus petugas ini dari daftar Security?")) return;

    try {
      const res = await apiClient.delete(`/security-guards/${id}`);
      if (res.data && res.data.status === "success") {
        showToast("Petugas Security berhasil dihapus.");
        fetchGuards();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Gagal menghapus petugas security.", "error");
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.nik.toLowerCase().includes(search.toLowerCase());

      const matchesDept =
        deptFilter === "ALL" ||
        u.department_id === deptFilter ||
        u.department_name?.toLowerCase() === deptFilter.toLowerCase();

      const matchesRole =
        roleFilter === "ALL" ||
        u.roles.some(r => r.toLowerCase() === roleFilter.toLowerCase());

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [users, search, deptFilter, roleFilter]);

  // Calculated Stats
  const activeUsersCount = useMemo(() => users.filter(u => u.is_active).length, [users]);
  const inactiveUsersCount = useMemo(() => users.filter(u => !u.is_active).length, [users]);

  return (
    <Layout
      activeNav="User Management"
      topbarTitle="Kelola Pengguna & Hak Akses"
      searchPlaceholder={activeTab === "users" ? "Cari nama, email, NIK..." : undefined}
      searchValue={activeTab === "users" ? search : ""}
      onSearchChange={activeTab === "users" ? setSearch : undefined}
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-4 sm:p-8 space-y-6" data-guide="gahrd-users-header">
        
        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-bold text-white transition-all animate-bounce ${
              toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            <Icon name={toast.type === "success" ? "check_circle" : "error"} className="text-xl" />
            {toast.msg}
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Kelola Pengguna & Hak Akses</h1>
            <p className="text-xs sm:text-sm text-[#64748b] mt-1">
              Kelola data karyawan, pendaftaran pengguna baru, hak pengajuan, dan nama petugas jaga Security.
            </p>
          </div>
          {activeTab === "users" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-[#1e3a8a] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-blue-900 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icon name="person_add" className="text-lg" />
              + Tambah User Baru
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-800 rounded-xl flex items-center justify-center font-bold text-xl">
              <Icon name="group" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Total Karyawan</div>
              <div className="text-xl font-bold text-[#0f172a]">{loading ? "-" : users.length}</div>
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-bold text-xl">
              <Icon name="check_circle" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">User Aktif</div>
              <div className="text-xl font-bold text-[#0f172a]">{loading ? "-" : activeUsersCount}</div>
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center font-bold text-xl">
              <Icon name="pending_actions" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Butuh Aktivasi</div>
              <div className="text-xl font-bold text-[#0f172a]">{loading ? "-" : inactiveUsersCount}</div>
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center font-bold text-xl">
              <Icon name="shield" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Petugas Security</div>
              <div className="text-xl font-bold text-[#0f172a]">{guardsLoading ? "-" : guards.length}</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "users"
                ? "border-blue-800 text-blue-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon name="badge" className="text-lg" />
            Kelola Data Pengguna
          </button>
          <button
            onClick={() => setActiveTab("guards")}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "guards"
                ? "border-blue-800 text-blue-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon name="security" className="text-lg" />
            Kelola Petugas Security
          </button>
        </div>

        {/* Tab 1: Users Table */}
        {activeTab === "users" ? (
          <div className="space-y-4" data-guide="gahrd-users-table">
            {/* Filter Toolbar */}
            <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex-1 relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, email, atau NIK karyawan..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Department Filter */}
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="ALL">Semua Departemen</option>
                  {departments.map(d => (
                    <option key={d.id} value={String(d.id)}>{d.name}</option>
                  ))}
                </select>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="ALL">Semua Peran (Role)</option>
                  <option value="Employee">Employee</option>
                  <option value="Approver">Approver</option>
                  <option value="Driver">Driver</option>
                  <option value="GA">GA Koordinator</option>
                  <option value="Security">Security</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Table State Handling */}
            {loading ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl py-20 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-3" />
                <p className="text-xs sm:text-sm text-[#64748b] font-medium">Memuat data daftar pengguna...</p>
              </div>
            ) : error ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-3 text-red-600 text-sm font-semibold">
                <Icon name="error" className="text-xl" />
                {error}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center">
                <Icon name="group_off" className="text-4xl text-[#cbd5e1] mb-2" />
                <p className="font-bold text-[#0f172a]">Tidak ada pengguna ditemukan</p>
                <p className="text-xs text-[#64748b] mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm min-w-[750px]">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Karyawan</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Departemen & Jabatan</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Peran (Role)</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8] text-center">Status Aktivasi</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8] text-center">Akses Request</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8] text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f8fafc]">
                      {filteredUsers.map((u) => {
                        const isEmployee = u.roles.some(r => r.toLowerCase() === "employee");
                        const isAdminUser = u.roles.some(r => r.toLowerCase() === "admin");
                        const isSelf = currentUser && String(currentUser.id) === String(u.id);

                        return (
                          <tr key={u.id} className="hover:bg-[#f8fafc]/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-100 text-blue-900 font-bold rounded-full flex items-center justify-center text-xs shrink-0">
                                  {u.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-[#0f172a] flex items-center gap-1.5">
                                    {u.name}
                                    {isSelf && (
                                      <span className="px-1.5 py-0.5 text-[9px] bg-blue-100 text-blue-800 font-extrabold rounded">Anda</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#94a3b8] font-mono">NIK: {u.nik} | {u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-[#334155]">{u.department_name}</div>
                              <div className="text-[11px] text-[#64748b]">
                                {u.rank || "Staff"} {u.is_department_head ? "(Head of Dept)" : ""}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {u.roles.map(r => (
                                  <span
                                    key={r}
                                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                                      r.toLowerCase() === "admin"
                                        ? "bg-purple-100 text-purple-800 border-purple-200"
                                        : r.toLowerCase() === "driver"
                                        ? "bg-amber-100 text-amber-800 border-amber-200"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleToggleActive(u)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  u.is_active
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                                    : "bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200"
                                }`}
                              >
                                {u.is_active ? "Aktif" : "Non-aktif (Aktivasi)"}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEmployee ? (
                                <button
                                  onClick={() => handleToggleRequest(u)}
                                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    u.can_request
                                      ? "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                                  }`}
                                >
                                  {u.can_request ? "Bisa Request" : "Hanya View"}
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-xs">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isAdminUser && currentUser?.role?.toLowerCase() !== "admin" ? (
                                  <button
                                    disabled
                                    className="p-1.5 text-slate-300 cursor-not-allowed opacity-50"
                                    title="Akun Admin dilindungi"
                                  >
                                    <Icon name="edit" className="text-lg" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenEditModal(u)}
                                    className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit User"
                                  >
                                    <Icon name="edit" className="text-lg" />
                                  </button>
                                )}
                                {isSelf || (isAdminUser && currentUser?.role?.toLowerCase() !== "admin") ? (
                                  <button
                                    disabled
                                    className="p-1.5 text-slate-300 cursor-not-allowed opacity-50"
                                    title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Akun Admin dilindungi"}
                                  >
                                    <Icon name="delete" className="text-lg" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setDeleteModal({ isOpen: true, user: u, deleting: false, error: null })}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus User"
                                  >
                                    <Icon name="delete" className="text-lg" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Security Guards */
          <div className="space-y-6 animate-fadein">
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
                    placeholder="Nama Petugas Security (Contoh: Sutrisno)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-xs sm:text-sm font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1e3a8a] text-white font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  <Icon name="add" className="text-lg" />
                  Tambah
                </button>
              </form>
            </div>

            {guardsLoading ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl py-12 flex flex-col items-center justify-center max-w-xl">
                <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-3" />
                <p className="text-xs text-[#64748b] font-medium">Memuat daftar petugas...</p>
              </div>
            ) : guardsError ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-3 text-red-600 text-xs sm:text-sm font-semibold max-w-xl">
                <Icon name="error" className="text-lg" />
                {guardsError}
              </div>
            ) : guards.length === 0 ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl py-12 flex flex-col items-center max-w-xl">
                <Icon name="verified_user" className="text-4xl text-[#cbd5e1] mb-2" />
                <p className="font-bold text-[#0f172a]">Belum ada petugas jaga terdaftar</p>
                <p className="text-xs text-[#64748b] mt-1">Gunakan form di atas untuk menambahkan nama petugas security.</p>
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
                        <div className="font-bold text-slate-700 text-xs sm:text-sm">{guard.name}</div>
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

        {/* Modal: Tambah User Baru */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-scalein">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <Icon name="person_add" className="text-blue-800" />
                  Tambah Pengguna Baru
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <Icon name="close" className="text-xl" />
                </button>
              </div>

              {addFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-lg shrink-0" />
                  {addFormError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Contoh: Ahmad Fayyadh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">NIK (Nomor Induk Karyawan)</label>
                    <input
                      type="text"
                      value={addForm.nik}
                      onChange={(e) => setAddForm({ ...addForm, nik: e.target.value })}
                      placeholder="Contoh: 2024001"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      placeholder="nama@perusahaan.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role) *</label>
                    <select
                      value={addForm.role}
                      onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Approver">Approver</option>
                      <option value="Driver">Driver</option>
                      <option value="Driver Coordinator">Driver Coordinator</option>
                      <option value="GA">GA Koordinator</option>
                      <option value="Security">Security</option>
                      {currentUser?.role?.toLowerCase() === "admin" && (
                        <option value="Admin">Admin</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Departemen</label>
                    <select
                      value={addForm.department_id}
                      onChange={(e) => setAddForm({ ...addForm, department_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="">Pilih Departemen...</option>
                      {departments.map(d => (
                        <option key={d.id} value={String(d.id)}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan / Rank</label>
                    <input
                      type="text"
                      value={addForm.rank}
                      onChange={(e) => setAddForm({ ...addForm, rank: e.target.value })}
                      placeholder="Contoh: Manager / Supervisor"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {(addForm.role === "Driver" || addForm.role === "Driver Coordinator") && (
                  <div className="space-y-3 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl">
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Icon name="badge" className="text-sm" />
                      Informasi Dokumen SIM Driver
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Golongan SIM</label>
                        <select
                          value={addForm.sim_type || "SIM A"}
                          onChange={(e) => setAddForm({ ...addForm, sim_type: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                        >
                          <option value="SIM A">SIM A (Penumpang / MPV)</option>
                          <option value="SIM B1">SIM B1 (Truk / Bus &gt; 3.5 Ton)</option>
                          <option value="SIM B2">SIM B2 (Truk Gandeng)</option>
                          <option value="SIM C">SIM C (Sepeda Motor)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Masa Berlaku SIM</label>
                        <input
                          type="date"
                          value={addForm.sim_expiry_date || ""}
                          onChange={(e) => setAddForm({ ...addForm, sim_expiry_date: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nomor SIM</label>
                      <input
                        type="text"
                        value={addForm.sim_number || ""}
                        onChange={(e) => setAddForm({ ...addForm, sim_number: e.target.value })}
                        placeholder="Contoh: 3507123456780001"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Upload Foto SIM Driver</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAddSimFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="add_dept_head"
                    checked={addForm.is_department_head}
                    onChange={(e) => setAddForm({ ...addForm, is_department_head: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="add_dept_head" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Pengguna ini merupakan Kepala Departemen (Head of Dept)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdd}
                    className="px-5 py-2 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingAdd ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Pengguna"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit User */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-scalein">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <Icon name="edit" className="text-blue-800" />
                  Edit Data Pengguna
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <Icon name="close" className="text-xl" />
                </button>
              </div>

              {editFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-lg shrink-0" />
                  {editFormError}
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">NIK</label>
                    <input
                      type="text"
                      value={editForm.nik}
                      onChange={(e) => setEditForm({ ...editForm, nik: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password Baru (Opsional)</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Kosongkan jika tidak ubah"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role) *</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Approver">Approver</option>
                      <option value="Driver">Driver</option>
                      <option value="Driver Coordinator">Driver Coordinator</option>
                      <option value="GA">GA Koordinator</option>
                      <option value="Security">Security</option>
                      {currentUser?.role?.toLowerCase() === "admin" && (
                        <option value="Admin">Admin</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Departemen</label>
                    <select
                      value={editForm.department_id}
                      onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="">Pilih Departemen...</option>
                      {departments.map(d => (
                        <option key={d.id} value={String(d.id)}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan / Rank</label>
                    <input
                      type="text"
                      value={editForm.rank}
                      onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {(editForm.role === "Driver" || editForm.role === "Driver Coordinator") && (
                  <div className="space-y-3 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl">
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Icon name="badge" className="text-sm" />
                      Informasi Dokumen SIM Driver
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Golongan SIM</label>
                        <select
                          value={editForm.sim_type || "SIM A"}
                          onChange={(e) => setEditForm({ ...editForm, sim_type: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                        >
                          <option value="SIM A">SIM A (Penumpang / MPV)</option>
                          <option value="SIM B1">SIM B1 (Truk / Bus &gt; 3.5 Ton)</option>
                          <option value="SIM B2">SIM B2 (Truk Gandeng)</option>
                          <option value="SIM C">SIM C (Sepeda Motor)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Masa Berlaku SIM</label>
                        <input
                          type="date"
                          value={editForm.sim_expiry_date || ""}
                          onChange={(e) => setEditForm({ ...editForm, sim_expiry_date: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nomor SIM</label>
                      <input
                        type="text"
                        value={editForm.sim_number || ""}
                        onChange={(e) => setEditForm({ ...editForm, sim_number: e.target.value })}
                        placeholder="Contoh: 3507123456780001"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Perbarui Foto SIM Driver</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditSimFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="edit_dept_head"
                    checked={editForm.is_department_head}
                    onChange={(e) => setEditForm({ ...editForm, is_department_head: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="edit_dept_head" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Pengguna ini merupakan Kepala Departemen (Head of Dept)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-5 py-2 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingEdit ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        Memperbarui...
                      </>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Konfirmasi Hapus User */}
        {deleteModal.isOpen && deleteModal.user && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scalein text-center">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
                <Icon name="warning" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">Konfirmasi Hapus Pengguna</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-800">{deleteModal.user.name}</span> ({deleteModal.user.email})?
                </p>
              </div>

              {deleteModal.error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                  {deleteModal.error}
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: false, user: null, deleting: false, error: null })}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={deleteModal.deleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {deleteModal.deleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    "Hapus Pengguna"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
