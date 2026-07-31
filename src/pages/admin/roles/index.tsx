import { useState, useMemo } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { userService } from "@/services/modules/userService";

const ROLES = [
  { icon: "gavel", label: "Approver", sub: "Financial & asset approvals" },
  { icon: "admin_panel_settings", label: "Administrator", sub: "Full system access & control" },
  { icon: "assignment_ind", label: "GA", sub: "General Affairs & Operations" },
  { icon: "directions_car", label: "Driver", sub: "Vehicle data access only" },
  { icon: "work", label: "Employee", sub: "Standard view permissions" },
  { icon: "security", label: "Security", sub: "Security & QR Verification" },
];

const MODULES = ["Dashboard", "Vehicles", "Requests", "Reports"];
const ACTIONS = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "MANAGE"];

const DEFAULT_PERMS: Record<string, Record<string, boolean>> = {
  Dashboard: { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false, EXPORT: false, MANAGE: true },
  Vehicles: { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: false, EXPORT: true, MANAGE: false },
  Requests: { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true, EXPORT: true, MANAGE: false },
  Reports: { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false, EXPORT: true, MANAGE: false },
};

const FALLBACK_USERS = [
  { id: "1", name: "Sarah Connor", email: "sarah.c@ovms.com", dept: "Global Operations", role: "Administrator", roleColor: "bg-[#dbeafe] text-[#1d4ed8]", img: "https://i.pravatar.cc/32?img=44" },
  { id: "2", name: "James Wilson", email: "j.wilson@ovms.com", dept: "Finance", role: "Approver", roleColor: "bg-[#dcfce7] text-[#16a34a]", img: "https://i.pravatar.cc/32?img=55" },
  { id: "3", name: "Emily Blunt", email: "e.blunt@ovms.com", dept: "Logistics", role: "Driver", roleColor: "bg-[#f1f5f9] text-[#475569]", img: "https://i.pravatar.cc/32?img=66" },
];

const getRoleBadgeStyle = (role: string) => {
  const r = (role || "").toLowerCase();
  if (r.includes("admin")) return "bg-[#dbeafe] text-[#1d4ed8]";
  if (r.includes("approver")) return "bg-[#dcfce7] text-[#16a34a]";
  if (r.includes("driver")) return "bg-[#e0f2fe] text-[#0369a1]";
  if (r.includes("ga")) return "bg-[#fef3c7] text-[#d97706]";
  if (r.includes("security")) return "bg-[#fae8ff] text-[#a21caf]";
  return "bg-[#f1f5f9] text-[#475569]";
};

export default function Role({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [selectedRole, setSelectedRole] = useState("Approver");
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [selectAll, setSelectAll] = useState(true);
  const [saved, setSaved] = useState(false);

  // User Assignment Filter State
  const [userRoleFilter, setUserRoleFilter] = useState("All Roles");

  // Edit User Assignment Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState("Employee");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [editRoleError, setEditRoleError] = useState("");

  // Fetch real users list
  const { data: apiUsersData, refetch: refetchUsers } = useApi(() => userService.getAll({ per_page: 1000 }));
  const rawUsers = useMemo(() => {
    const list = apiUsersData || [];
    return list.length > 0 ? list : FALLBACK_USERS;
  }, [apiUsersData]);

  // Filtered Users based on User Assignment Filter
  const filteredUsers = useMemo(() => {
    if (userRoleFilter === "All Roles") return rawUsers;
    const q = userRoleFilter.toLowerCase();
    return rawUsers.filter((u: any) => {
      const r = (u.roleName || u.role || "").toLowerCase();
      if (q === "administrator" || q === "admin") return r.includes("admin");
      return r.includes(q);
    });
  }, [rawUsers, userRoleFilter]);

  const togglePerm = (mod: string, action: string) => {
    setPerms(prev => ({ ...prev, [mod]: { ...prev[mod], [action]: !prev[mod][action] } }));
    setSaved(false);
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    setSelectedNewRole(user.roleName || user.role || "Employee");
    setEditRoleError("");
    setIsEditModalOpen(true);
  };

  const handleSaveUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdatingRole(true);
    setEditRoleError("");
    try {
      await userService.update(editingUser.id, {
        roleName: selectedNewRole,
      });
      setIsEditModalOpen(false);
      refetchUsers();
    } catch (err: any) {
      console.error("Failed to update user role:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      setEditRoleError(msg || "Gagal mengubah role user.");
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <Layout activeNav="Role Management" onNavigate={onNavigate} topbarTitle="Role Management" searchPlaceholder="Search roles..." userName="Admin User" userRole="Administrator">
      <div className="p-4 sm:p-6 space-y-5 animate-fadein pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-bold text-[#0f172a]">Role Management</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Manage system roles, permissions, and access control across the enterprise.</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setSaved(true)} className="flex items-center gap-2 h-10 px-5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold shadow-sm active:scale-95 transition-all cursor-pointer">
              <Icon name="save" className="text-[17px]" />{saved ? "Changes Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          {[
            { label: "Total Roles", value: "5", icon: "shield", bg: "bg-[#e8edf8]", color: "text-[#1e3a8a]" },
            { label: "Active Permissions", value: "124", icon: "key", bg: "bg-[#dcfce7]", color: "text-[#16a34a]" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon name={c.icon} className={`${c.color} text-[18px]`} />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">{c.label}</div>
              <div className="text-[22px] font-bold text-[#0f172a]">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: System Roles */}
          <div className="col-span-1 lg:col-span-4 space-y-3">
            <h3 className="text-[15px] font-bold text-[#0f172a]">System Roles</h3>
            {ROLES.map(r => (
              <button key={r.label} onClick={() => { setSelectedRole(r.label); setSaved(false); }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  selectedRole === r.label
                    ? "border-[#1e3a8a] bg-[#eff6ff] shadow-sm"
                    : "border-[#e2e8f0] bg-white hover:border-[#bfdbfe] hover:bg-[#f8fafc]"
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === r.label ? "bg-[#dbeafe]" : "bg-[#f1f5f9]"}`}>
                  <Icon name={r.icon} className={`text-[20px] ${selectedRole === r.label ? "text-[#1d4ed8]" : "text-[#64748b]"}`} />
                </div>
                <div>
                  <div className={`text-[13px] font-bold ${selectedRole === r.label ? "text-[#1e3a8a]" : "text-[#0f172a]"}`}>{r.label}</div>
                  <div className="text-[11px] text-[#94a3b8]">{r.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Permission Matrix */}
          <div className="col-span-1 lg:col-span-8">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Permission Matrix</h3>
                  <p className="text-[12px] text-[#64748b]">Configure action-level access for <b>{selectedRole}</b> role.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#475569]">Select All Actions</span>
                  <button onClick={() => setSelectAll(p => !p)} className={`w-11 h-6 rounded-full transition-all cursor-pointer ${selectAll ? "bg-[#1e3a8a]" : "bg-[#e2e8f0]"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${selectAll ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f8fafc]">
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide">Module</th>
                      {ACTIONS.map(a => <th key={a} className="px-2 py-3 text-center text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide">{a}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(mod => (
                      <tr key={mod} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3.5 flex items-center gap-2.5">
                          <Icon name={mod === "Dashboard" ? "dashboard" : mod === "Vehicles" ? "directions_car" : mod === "Requests" ? "assignment" : "analytics"} className="text-[#64748b] text-[18px]" />
                          <span className="text-[13px] font-semibold text-[#0f172a]">{mod}</span>
                        </td>
                        {ACTIONS.map(action => (
                          <td key={action} className="px-2 py-3.5 text-center">
                            <button onClick={() => togglePerm(mod, action)}
                              className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-all cursor-pointer ${
                                perms[mod][action] ? "bg-[#1e3a8a]" : "border-2 border-[#e2e8f0] hover:border-[#1e3a8a]/40"
                              }`}>
                              {perms[mod][action] && <Icon name="check" className="text-white text-[12px]" />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* User Assignment Card */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-[#0f172a]">User Assignment</h3>
                  <select
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value)}
                    className="h-7 px-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[11px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 cursor-pointer"
                  >
                    <option value="All Roles">All Roles</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Approver">Approver</option>
                    <option value="Driver">Driver</option>
                    <option value="Employee">Employee</option>
                    <option value="GA">GA</option>
                  </select>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {filteredUsers.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-[#94a3b8]">Tidak ada user dengan role ini.</div>
                  ) : (
                    filteredUsers.map((u: any) => {
                      const name = u.fullName || u.name;
                      const dept = u.department || u.dept || "Department";
                      const role = u.roleName || u.role || "Employee";
                      const initials = name.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <div key={u.id || name} className="flex items-center gap-3 py-2 border-b border-[#f1f5f9] last:border-0 hover:bg-[#fafbfc] px-1 rounded-lg transition-colors">
                          {u.img || u.avatarUrl ? (
                            <img src={u.img || u.avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover border border-[#e2e8f0]" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#e2e8f0] text-[#475569] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-bold text-[#0f172a] truncate">{name}</div>
                            <div className="text-[10px] text-[#94a3b8] truncate">{dept}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${getRoleBadgeStyle(role)}`}>
                            {role}
                          </span>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="w-7 h-7 rounded-lg hover:bg-[#eff6ff] flex items-center justify-center transition-colors text-[#1e3a8a] cursor-pointer"
                            title="Edit User Assignment Role"
                          >
                            <Icon name="edit" className="text-[15px]" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Audit Timeline */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-[#0f172a]">Audit Timeline</h3>
                  <button className="text-[11px] font-bold text-[#1e3a8a] hover:underline cursor-pointer">View History</button>
                </div>
                <div className="space-y-3.5">
                  {[
                    { title: "Role Modification", desc: "Alex Rivera updated 'Delete' permission for Approver role.", time: "2 hours ago • Session #9921", color: "border-[#dc2626]" },
                    { title: "User Assignment", desc: "Emily Blunt was assigned the Driver role.", time: "Yesterday, 14:32 • Auto-sync", color: "border-[#1e3a8a]" },
                    { title: "Emergency Access", desc: "System auto-revoked temporary Super Admin access for User #405.", time: "3 days ago • Security Policy", color: "border-[#d97706]" },
                  ].map((ev, i) => (
                    <div key={i} className={`pl-3 border-l-2 ${ev.color}`}>
                      <div className="text-[12px] font-bold text-[#0f172a]">{ev.title}</div>
                      <div className="text-[11px] text-[#475569] mt-0.5">{ev.desc}</div>
                      <div className="text-[10px] text-[#94a3b8] mt-0.5">{ev.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT USER ASSIGNMENT MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadein">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-[#94a3b8] hover:text-[#0f172a] transition-colors p-1 cursor-pointer"
            >
              <Icon name="close" className="text-[20px]" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#1e3a8a] flex items-center justify-center">
                <Icon name="manage_accounts" className="text-[22px]" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#0f172a]">Edit User Role Assignment</h3>
                <p className="text-[12px] text-[#64748b]">Ubah penetapan role akses untuk user ini.</p>
              </div>
            </div>

            {editRoleError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-xl font-semibold">
                {editRoleError}
              </div>
            )}

            <form onSubmit={handleSaveUserRole} className="space-y-4">
              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1e3a8a] text-white font-bold flex items-center justify-center text-[12px]">
                  {(editingUser.fullName || editingUser.name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-[#0f172a] truncate">{editingUser.fullName || editingUser.name}</div>
                  <div className="text-[11px] text-[#64748b] truncate">{editingUser.email || "No Email"} • NIK: {editingUser.nik || "-"}</div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Pilih Role Akses Baru</label>
                <select
                  value={selectedNewRole}
                  onChange={e => setSelectedNewRole(e.target.value)}
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] font-bold text-[#1e3a8a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 cursor-pointer"
                >
                  <option value="Administrator">Administrator (Akses Penuh Sistem)</option>
                  <option value="Approver">Approver (Penyetuju Request & Aset)</option>
                  <option value="GA">GA (General Affairs / Admin Operasional)</option>
                  <option value="Driver">Driver (Pengemudi Operasional)</option>
                  <option value="Employee">Employee (Karyawan Pemohon)</option>
                  <option value="Security">Security (Petugas Keamanan / Pos)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updatingRole}
                  className="h-10 px-5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[12px] font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {updatingRole ? "Saving..." : "Simpan Role Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
