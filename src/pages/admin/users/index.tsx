import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { userService } from "@/services/modules/userService";
import { departmentService } from "@/services/modules/departmentService";
import type { Department } from "@/services/modules/departmentService";

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-[#dcfce7] text-[#16a34a]",
  INACTIVE: "bg-[#f1f5f9] text-[#64748b]",
  SUSPENDED: "bg-[#fee2e2] text-[#991b1b]"
};

export default function User({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [roleFilter, setRoleFilter] = useState("All Roles");

  const mapDeptToCategory = (dept: string) => {
    if (dept === "All Departments") return undefined;
    return dept.toUpperCase();
  };

  const { data: statsData, refetch: refetchStats } = useApi(() => userService.getAll({ per_page: 1000 }));
  const { data: paginatedData, loading, error, refetch: refetchPaginated } = useApi(
    () => userService.getAll({
      page: currentPage,
      per_page: PAGE_SIZE,
      search: search || undefined,
      category: mapDeptToCategory(deptFilter),
      role: roleFilter === "All Roles" ? undefined : roleFilter
    }),
    true,
    [currentPage, search, deptFilter, roleFilter]
  );

  const refetch = () => {
    refetchStats();
    refetchPaginated();
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nik: "",
    name: "",
    email: "",
    password: "password",
    role: "Employee",
    rank: "",
    department: "",
    isDepartmentHead: false,
  });
  const [simFile, setSimFile] = useState<File | null>(null);
  const [simPreview, setSimPreview] = useState("");
  const [formError, setFormError] = useState("");
  const [addClicked, setAddClicked] = useState(false);

  // Edit States
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nik: "",
    name: "",
    email: "",
    password: "",
    role: "Employee",
    rank: "",
    department: "",
    isDepartmentHead: false,
  });
  const [editSimFile, setEditSimFile] = useState<File | null>(null);
  const [editSimPreview, setEditSimPreview] = useState("");
  const [editFormError, setEditFormError] = useState("");
  const [editClicked, setEditClicked] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    departmentService.getAll().then(res => {
      if (res.data) {
        setDepartments(res.data);
      }
    }).catch(err => console.error(err));
  }, []);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: any | null;
    deleting: boolean;
    error: string | null;
  }>({
    isOpen: false,
    user: null,
    deleting: false,
    error: null,
  });

  const handleOpenDeleteModal = (u: any) => {
    setDeleteModal({
      isOpen: true,
      user: u,
      deleting: false,
      error: null,
    });
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteModal.user) return;
    setDeleteModal(prev => ({ ...prev, deleting: true, error: null }));
    try {
      await userService.delete(deleteModal.user.id, deleteModal.user);
      setDeleteModal({ isOpen: false, user: null, deleting: false, error: null });
      refetch();
    } catch (err: any) {
      console.error("Failed to delete user", err);
      let msg = err.response?.data?.message || err.response?.data?.error || err.message;
      if (!msg || msg === "Server Error" || msg.includes("status code 422")) {
        msg = "User ini memiliki data riwayat di database. Silakan klik Edit untuk mengubah statusnya menjadi NONAKTIF.";
      }
      setDeleteModal(prev => ({
        ...prev,
        deleting: false,
        error: msg
      }));
    }
  };

  const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSimFile(file);
      setSimPreview(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (u: any) => {
    setEditingUser(u);
    setEditFormData({
      nik: u.nik || "",
      name: u.fullName,
      email: u.email,
      password: "", // Biarkan kosong jika tidak ingin ganti password
      role: u.roleName || "Employee",
      rank: u.position && u.roleName === "Approver" ? u.position : "",
      department: u.department_id ? String(u.department_id) : "",
      isDepartmentHead: !!u.isDepartmentHead,
    });
    setEditSimFile(null);
    setEditSimPreview(u.simPhoto || "");
    setEditFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditSimFile(file);
      setEditSimPreview(URL.createObjectURL(file));
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editFormData.name || !editFormData.email || !editFormData.role) {
      setEditFormError("Name, email and role are required.");
      return;
    }
    if (editFormData.role === "Approver" && !editFormData.rank) {
      setEditFormError("Rank is required for Approver role.");
      return;
    }

    setEditClicked(true);
    setEditFormError("");
    try {
      const data = new FormData();
      if (editFormData.nik) {
        data.append("nik", editFormData.nik.trim());
      }
      data.append("name", editFormData.name.trim());
      data.append("email", editFormData.email.trim());
      if (editFormData.password) {
        data.append("password", editFormData.password);
      }
      data.append("role", editFormData.role);
      
      const parsedDeptId = editFormData.department ? parseInt(editFormData.department) : (departments[0]?.id || 1);
      data.append("department_id", String(isNaN(parsedDeptId) ? 1 : parsedDeptId));

      data.append("is_department_head", editFormData.isDepartmentHead ? "1" : "0");
      if (editFormData.role === "Approver") {
        data.append("rank", editFormData.rank);
      }
      if (editFormData.role === "Driver" && editSimFile) {
        data.append("sim_a_photo", editSimFile);
      }

      await userService.update(editingUser.id, data);
      setIsEditModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error("Edit user error:", err);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      if (status === 422) {
        setEditFormError(serverMsg || "Data user tidak valid atau NIK/Email sudah terdaftar.");
      } else if (status === 500) {
        setEditFormError(serverMsg ? `Server Error: ${serverMsg}` : "Gagal memperbarui user di server.");
      } else {
        setEditFormError(serverMsg || "Failed to update user.");
      }
    } finally {
      setEditClicked(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setFormError("Name, email, password and role are required.");
      return;
    }
    if (formData.role === "Approver" && !formData.rank) {
      setFormError("Rank is required for Approver role.");
      return;
    }
    setAddClicked(true);
    setFormError("");
    try {
      const data = new FormData();
      if (formData.nik) {
        data.append("nik", formData.nik.trim());
      }
      data.append("name", formData.name.trim());
      data.append("email", formData.email.trim());
      data.append("password", formData.password);
      data.append("role", formData.role);
      
      const parsedDeptId = formData.department ? parseInt(formData.department) : (departments[0]?.id || 1);
      data.append("department_id", String(isNaN(parsedDeptId) ? 1 : parsedDeptId));

      data.append("is_department_head", formData.isDepartmentHead ? "1" : "0");
      if (formData.role === "Approver") {
        data.append("rank", formData.rank);
      }
      if (formData.role === "Driver" && simFile) {
        data.append("sim_a_photo", simFile);
      }

      await userService.create(data);
      setIsModalOpen(false);
      setFormData({
        nik: "",
        name: "",
        email: "",
        password: "password",
        role: "Employee",
        rank: "",
        department: departments[0]?.id ? String(departments[0].id) : "",
        isDepartmentHead: false,
      });
      setSimFile(null);
      setSimPreview("");
      refetch();
    } catch (err: any) {
      console.error("Add user error:", err);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      if (status === 422) {
        setFormError(serverMsg || "Data user tidak valid atau NIK/Email sudah terdaftar.");
      } else if (status === 500) {
        setFormError(serverMsg ? `Server Error: ${serverMsg}` : "Gagal menyimpan user. Pastikan NIK & Email belum terdaftar di sistem.");
      } else {
        setFormError(serverMsg || "Failed to add user.");
      }
    } finally {
      setAddClicked(false);
    }
  };

  const list = paginatedData || [];
  const pagination = (paginatedData as any)?.pagination || { total: 0, currentPage: 1, lastPage: 1, from: null, to: null };

  const handleSearchChange = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleDeptFilter   = (val: string) => { setDeptFilter(val); setCurrentPage(1); };

  const statsList = statsData || [];
  const totalUsersCount = statsList.length;
  const driversCount    = statsList.filter(u => u.roleName === "Driver").length;
  const approversCount  = statsList.filter(u => u.roleName === "Approver").length;

  return (
    <Layout
      activeNav="User Management"
      onNavigate={onNavigate}
      topbarTitle="User Management"
      searchPlaceholder="Search users..."
      userRole="Administrator"
    >
      <div className="p-4 sm:p-6 space-y-5 animate-fadein">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">User Management</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Manage employees, drivers, approvers, and administrator access.</p>
          </div>
          <div className="flex gap-2.5 flex-shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 h-10 px-5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold shadow-sm active:scale-95 transition-all"
            >
              <Icon name="add" className="text-[17px]" />
              Add User
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Total Users", value: totalUsersCount, icon: "groups", bg: "bg-[#e8edf8]", color: "text-[#1e3a8a]" },
            { label: "Drivers", value: driversCount,        icon: "directions_car", bg: "bg-[#e0f2fe]", color: "text-[#0369a1]" },
            { label: "Approvers", value: approversCount,    icon: "approval", bg: "bg-[#fef3c7]", color: "text-[#d97706]" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <Icon name={c.icon} className={`${c.color} text-[18px]`} />
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full $`}></span>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">{c.label}</div>
              <div className="text-[22px] font-bold text-[#0f172a] leading-tight">{loading ? "..." : c.value}</div>
            </div>
          ))}
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-[16px] font-bold text-[#0f172a]">All Employees</h3>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[15px]" />
                <input
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search..."
                  className="h-8 pl-9 pr-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 w-full sm:w-48"
                />
              </div>
              <select
                value={deptFilter}
                onChange={e => handleDeptFilter(e.target.value)}
                className="h-8 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                <option value="All Departments">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
                <option value="Driver">Driver</option>
              </select>
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="h-8 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                <option>All Roles</option>
                <option>Admin</option>
                <option>GA</option>
                <option>Approver</option>
                <option>Employee</option>
                <option>Driver</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-[14px] text-[#64748b]">Loading users...</div>
          ) : error ? (
            <div className="p-8 text-center text-[14px] text-red-500">Failed to load users data.</div>
          ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["ID", "NIK", "FULL NAME", "EMAIL", "DEPARTMENT", "ROLE", "STATUS", "LAST LOGIN", "ACTIONS"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(e => (
                  <tr key={e.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-4 py-3.5 text-[12px] font-bold text-[#1e3a8a]">{e.id}</td>
                    <td className="px-4 py-3.5 text-[12px] font-medium text-[#475569]">{e.nik || "-"}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[11px] font-bold text-[#475569] flex-shrink-0 uppercase">
                          {e.fullName.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-semibold text-[#0f172a] capitalize whitespace-nowrap">
                          {e.fullName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#64748b]">{e.email}</td>
                    <td className="px-4 py-3.5 text-[13px] text-[#475569]">{e.department}</td>
                    <td className="px-4 py-3.5 text-[13px] text-[#475569]">{e.roleName}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle[e.status]}`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#475569]">{e.lastLogin}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEditClick(e)}
                          className="flex items-center gap-2 h-8 px-3 bg-white border border-[#e2e8f0] rounded-lg text-[12px] text-[#475569] hover:bg-[#f8fafc]"
                        >
                          <Icon name="edit" className="text-[15px]" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(e)}
                          className="flex items-center gap-2 h-8 px-3 bg-white border border-[#e2e8f0] rounded-lg text-[12px] text-[#dc2626] hover:bg-[#fee2e2]"
                        >
                          <Icon name="delete" className="text-[15px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          {pagination.lastPage > 1 && (
            <div className="px-5 py-3 border-t border-[#f1f5f9] flex items-center justify-between bg-[#fafbfc]">
              <span className="text-[12px] text-[#94a3b8]">
                Showing <b>{pagination.from ?? 0}–{pagination.to ?? 0}</b> of <b>{pagination.total}</b> entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={pagination.currentPage <= 1}
                  className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center disabled:opacity-40 hover:bg-[#f1f5f9]"
                >
                  <Icon name="chevron_left" className="text-[16px]" />
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`w-7 h-7 rounded text-[12px] font-semibold border transition-colors ${
                      n === pagination.currentPage ? "bg-[#1e3a8a] text-white border-[#1e3a8a]" : "border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"
                    }`}
                  >{n}</button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.lastPage, p + 1))}
                  disabled={pagination.currentPage >= pagination.lastPage}
                  className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center disabled:opacity-40 hover:bg-[#f1f5f9]"
                >
                  <Icon name="chevron_right" className="text-[16px]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-4">
          {/* User Distribution */}
          <div className="col-span-7 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
            <h3 className="text-[15px] font-bold text-[#0f172a] mb-4">Distribusi Pengguna</h3>
            {loading ? (
              <div className="text-center text-[#94a3b8] text-[13px] py-4">Memuat data...</div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Total Semua Pengguna", value: totalUsersCount, color: "bg-[#1e3a8a]", pct: 100 },
                  { label: "Driver", value: driversCount, color: "bg-[#0369a1]", pct: totalUsersCount ? Math.round((driversCount / totalUsersCount) * 100) : 0 },
                  { label: "Approver", value: approversCount, color: "bg-[#d97706]", pct: totalUsersCount ? Math.round((approversCount / totalUsersCount) * 100) : 0 },
                  { label: "Employee", value: list.filter(u => u.roleName === "Employee").length, color: "bg-[#16a34a]", pct: totalUsersCount ? Math.round((list.filter(u => u.roleName === "Employee").length / totalUsersCount) * 100) : 0 },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="font-semibold text-[#475569]">{item.label}</span>
                      <span className="font-bold text-[#0f172a]">{item.value}</span>
                    </div>
                    <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Access Roles */}
          <div className="col-span-5 bg-[#0f2a5e] rounded-2xl p-5 shadow-sm">
            <h3 className="text-[15px] font-bold text-white mb-1">Manajemen Akses</h3>
            <p className="text-[12px] text-[#93c5fd] mb-4">Kelola hak akses dan pemetaan departemen untuk setiap role pengguna.</p>
            <div className="space-y-2.5">
              {[
                { label: "Kelola Permissions", icon: "admin_panel_settings", path: "/admin/roles" },
                { label: "Audit Logs", icon: "history", path: "/admin/audit" },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-4 py-3 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    <Icon name={item.icon} className="text-[18px]" />
                    {item.label}
                  </div>
                  <Icon name="arrow_forward" className="text-[18px]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc]">
              <h3 className="text-[16px] font-bold text-[#0f172a]">Add New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">NIK (Employee ID)</label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={e => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="e.g. 1393"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. john@ovms.test"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">System Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["Employee", "Approver", "GA", "Driver", "Admin"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {formData.role === "Approver" && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Rank (Approver Title)</label>
                  <input
                    type="text"
                    required
                    value={formData.rank}
                    onChange={e => setFormData({ ...formData, rank: e.target.value })}
                    placeholder="e.g. Department Head, Director"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Department</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    <option value="">Pilih Departemen</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-6 pl-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isDepartmentHead}
                      onChange={e => setFormData({ ...formData, isDepartmentHead: e.target.checked })}
                      className="w-4 h-4 text-[#1e3a8a] border-[#e2e8f0] rounded focus:ring-[#1e3a8a]/20"
                    />
                    <span className="text-[12px] font-semibold text-[#475569]">Is Department Head</span>
                  </label>
                </div>
              </div>

              {formData.role === "Driver" && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">SIM A Photo</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSimChange}
                      className="hidden"
                      id="user-sim-upload"
                    />
                    <label htmlFor="user-sim-upload" className="cursor-pointer h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
                      <Icon name="upload" className="text-[16px]" />
                      Upload SIM A Image
                    </label>
                    {simPreview && (
                      <img src={simPreview} alt="SIM Preview" className="w-12 h-10 rounded-lg object-cover border border-[#e2e8f0]" />
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-5 border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl text-[13px] font-bold text-[#475569] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addClicked}
                  className="h-10 px-6 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
                >
                  {addClicked ? "Adding..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc]">
              <h3 className="text-[16px] font-bold text-[#0f172a]">Edit User</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
              {editFormError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {editFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">NIK (Employee ID)</label>
                  <input
                    type="text"
                    value={editFormData.nik}
                    onChange={e => setEditFormData({ ...editFormData, nik: e.target.value })}
                    placeholder="e.g. 1393"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="e.g. john@ovms.test"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">New Password (Optional)</label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Leave empty to keep current"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">System Role</label>
                  <select
                    value={editFormData.role}
                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["Employee", "Approver", "GA", "Driver", "Admin"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {editFormData.role === "Approver" && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Rank (Approver Title)</label>
                  <input
                    type="text"
                    required
                    value={editFormData.rank}
                    onChange={e => setEditFormData({ ...editFormData, rank: e.target.value })}
                    placeholder="e.g. Department Head, Director"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Department</label>
                  <select
                    value={editFormData.department}
                    onChange={e => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    <option value="">Pilih Departemen</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-6 pl-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editFormData.isDepartmentHead}
                      onChange={e => setEditFormData({ ...editFormData, isDepartmentHead: e.target.checked })}
                      className="w-4 h-4 text-[#1e3a8a] border-[#e2e8f0] rounded focus:ring-[#1e3a8a]/20"
                    />
                    <span className="text-[12px] font-semibold text-[#475569]">Is Department Head</span>
                  </label>
                </div>
              </div>

              {editFormData.role === "Driver" && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">SIM A Photo</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditSimChange}
                      className="hidden"
                      id="edit-user-sim-upload"
                    />
                    <label htmlFor="edit-user-sim-upload" className="cursor-pointer h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
                      <Icon name="upload" className="text-[16px]" />
                      Upload SIM A Image
                    </label>
                    {editSimPreview && (
                      <img src={editSimPreview} alt="SIM Preview" className="w-12 h-10 rounded-lg object-cover border border-[#e2e8f0]" />
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-10 px-5 border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl text-[13px] font-bold text-[#475569] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editClicked}
                  className="h-10 px-6 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
                >
                  {editClicked ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.user && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadein">
          <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setDeleteModal({ isOpen: false, user: null, deleting: false, error: null })}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#64748b] cursor-pointer"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-50 text-[#dc2626] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="delete" className="text-[28px]" />
              </div>
              <h3 className="text-[18px] font-extrabold text-[#0f172a]">Konfirmasi Hapus User</h3>
              <p className="text-[13px] text-[#64748b] mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus user <strong>{deleteModal.user.fullName}</strong> ({deleteModal.user.email}) dari sistem?
              </p>
            </div>

            {deleteModal.error && (
              <div className="mb-5 p-4 bg-red-50/90 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-700 text-[12px] leading-relaxed">
                <Icon name="error" className="text-[18px] text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5 text-red-800">Tidak Dapat Menghapus</span>
                  {deleteModal.error}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={deleteModal.deleting}
                onClick={() => setDeleteModal({ isOpen: false, user: null, deleting: false, error: null })}
                className="flex-1 py-3 border border-[#e2e8f0] text-[#475569] font-bold rounded-xl hover:bg-[#f8fafc] transition-colors cursor-pointer text-[13px]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteModal.deleting}
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-[13px] transition-all"
              >
                {deleteModal.deleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon name="delete" className="text-[16px]" />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
