import { useState } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { driverService } from "@/services/modules/driverService";

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-[#dcfce7] text-[#16a34a]";
    case "ON DUTY":
      return "bg-[#dbeafe] text-[#1d4ed8]";
    default:
      return "bg-[#f1f5f9] text-[#64748b]";
  }
};

const getAvatarUrl = (id: string, gender: 'men' | 'women' = 'men') => {
  const num = parseInt(id.replace(/\D/g, '')) || 1;
  return `https://randomuser.me/api/portraits/thumb/${gender}/${num % 100}.jpg`;
};

export default function Driver({ onNavigate = () => {} }: { onNavigate?: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: statsData, refetch: refetchStats } = useApi(() => driverService.getAll({ per_page: 1000 }));
  const { data: paginatedData, loading, error, refetch: refetchPaginated } = useApi(
    () => driverService.getAll({
      page: currentPage,
      per_page: PAGE_SIZE,
      search: search || undefined,
      status: statusFilter === "All" ? undefined : statusFilter,
    }),
    true,
    [currentPage, search, statusFilter]
  );

  const refetch = () => {
    refetchStats();
    refetchPaginated();
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "password",
    department: "IT",
  });
  const [adding, setAdding] = useState(false);
  const [simFile, setSimFile] = useState<File | null>(null);
  const [simPreview, setSimPreview] = useState("");
  const [formError, setFormError] = useState("");

  // Edit States
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "IT",
  });
  const [editSimFile, setEditSimFile] = useState<File | null>(null);
  const [editSimPreview, setEditSimPreview] = useState("");
  const [editFormError, setEditFormError] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await driverService.delete(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete driver", err);
    }
  };

  const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSimFile(file);
      setSimPreview(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (d: any) => {
    setEditingDriver(d);
    setEditFormData({
      name: d.name,
      email: d.email || "",
      password: "", // dikosongkan kecuali ingin ganti
      department: d.department || "IT",
    });
    setEditSimFile(null);
    setEditSimPreview(d.avatarUrl || "");
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

  const handleEditDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;

    if (!editFormData.name || !editFormData.email) {
      setEditFormError("Name and email are required.");
      return;
    }

    setUpdating(true);
    setEditFormError("");
    try {
      const data = new FormData();
      data.append("name", editFormData.name);
      data.append("email", editFormData.email);
      if (editFormData.password) {
        data.append("password", editFormData.password);
      }
      data.append("role", "Driver");
      data.append("department_id", editFormData.department);
      if (editSimFile) {
        data.append("sim_a_photo", editSimFile);
      }

      await driverService.update(editingDriver.id, data);
      setIsEditModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      setEditFormError(err.response?.data?.message || "Failed to update driver.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setFormError("Name, email, and password are required.");
      return;
    }
    if (!simFile) {
      setFormError("Foto SIM A wajib diupload untuk Driver.");
      return;
    }
    setAdding(true);
    setFormError("");
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("role", "Driver");
      data.append("department_id", formData.department);
      data.append("sim_a_photo", simFile);

      await driverService.create(data);
      setIsModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "password",
        department: "IT",
      });
      setSimFile(null);
      setSimPreview("");
      refetch();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to add driver.");
    } finally {
      setAdding(false);
    }
  };

  const list = paginatedData || [];
  const pagination = (paginatedData as any)?.pagination || { total: 0, currentPage: 1, lastPage: 1, from: null, to: null };

  const handleSearchChange = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleStatusChange = (val: string) => { setStatusFilter(val); setCurrentPage(1); };

  const statsList = statsData || [];
  const totalDriversCount = (statsList as any)?.pagination?.total ?? statsList.length;
  const onDutyCount = statsList.filter(d => d.status === "ON DUTY").length;
  const expiringSoonCount = 0; // Hardcoded or calculated if needed

  return (
    <Layout
      activeNav="Driver Management"
      onNavigate={onNavigate}
      topbarTitle="Driver Management"
      searchPlaceholder="Search drivers..."
      userRole="Administrator"
    >
      <div className="p-4 sm:p-6 space-y-5 animate-fadein">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Driver Management</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Manage and monitor driver assignments, certifications, and availability.</p>
          </div>
          <div className="flex gap-2.5 flex-shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm active:scale-95"
            >
              <Icon name="person_add" className="text-[17px]" />
              Add Driver
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Drivers", value: totalDriversCount, sub: "+4% vs last month", icon: "groups", color: "text-[#1e3a8a]", bg: "bg-[#e8edf8]" },
            { label: "Active / On Duty", value: onDutyCount, sub: `${totalDriversCount ? Math.round((onDutyCount / totalDriversCount) * 100) : 0}%`, icon: "commute", color: "text-[#0369a1]", bg: "bg-[#e0f2fe]", bar: true, barVal: totalDriversCount ? Math.round((onDutyCount / totalDriversCount) * 100) : 0 },
            { label: "Expiring Soon", value: expiringSoonCount, sub: "Requires immediate action", icon: "notification_important", color: "text-[#dc2626]", bg: "bg-[#fee2e2]", border: "border-[#fecdd3]", urgent: expiringSoonCount > 0 },
          ].map(c => (
            <div key={c.label} className={`bg-white rounded-2xl p-5 border ${c.border || "border-[#e2e8f0]"} shadow-sm hover:shadow-md transition-shadow ${c.urgent ? "border-l-4 border-l-[#dc2626]" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <Icon name={c.icon} className={`${c.color} text-[20px]`} />
                </div>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">{c.label}</div>
              <div className={`text-[32px] font-bold leading-tight ${c.urgent ? "text-[#dc2626]" : "text-[#0f172a]"}`}>{loading ? "..." : c.value}</div>
              {c.bar ? (
                <div className="mt-2">
                  <div className="h-[3px] bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div className="bg-[#0ea5e9] h-full rounded-full" style={{ width: `${c.barVal}%` }} />
                  </div>
                  <div className="text-[11px] text-[#64748b] mt-1">{c.sub}</div>
                </div>
              ) : (
                <div className={`text-[11px] mt-1 ${c.urgent ? "text-[#dc2626] font-semibold" : "text-[#64748b]"}`}>{c.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[16px]" />
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search Driver or ID..."
                className="w-full h-9 pl-9 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => handleStatusChange(e.target.value)}
              className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none"
            >
              {["All", "AVAILABLE", "ON DUTY", "OFF DUTY"].map(s => <option key={s} value={s}>Status: {s}</option>)}
            </select>
            <select className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none">
              <option>License Type</option>
              <option>Class A</option>
              <option>Class B</option>
            </select>
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); setCurrentPage(1); }}
              className="h-9 px-4 border border-[#e2e8f0] rounded-lg text-[12px] font-bold text-[#475569] hover:bg-[#f1f5f9]"
            >
              Reset
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[14px] text-[#64748b]">Loading drivers...</div>
          ) : error ? (
            <div className="p-8 text-center text-[14px] text-red-500">Failed to load drivers data.</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["DRIVER", "STATUS", "ASSIGNED VEHICLE", "SIM A", "ACTIONS"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(d => (
                  <tr key={d.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={d.avatarUrl || getAvatarUrl(d.id, d.name.includes("Sarah") || d.name.includes("Elena") ? 'women' : 'men')}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-[#e2e8f0]"
                        />
                        <div>
                          <div className="text-[13px] font-bold text-[#0f172a]">{d.name}</div>
                          <div className="text-[11px] text-[#94a3b8]">{d.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(d.status)}`}>{d.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-[#0f172a]">
                      {d.assignedVehicleId || "Unassigned"}
                    </td>
                    <td className="px-5 py-3.5">
                      {d.avatarUrl ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#dcfce7] text-[#16a34a]">✓ Uploaded</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#991b1b]">Not Uploaded</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(d)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#eef2ff] text-[#1e3a8a] text-[12px] font-semibold hover:bg-[#dbeafe] transition"
                        >
                          <Icon name="edit" className="text-[14px]" />Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#fee2e2] text-[#b91c1c] text-[12px] font-semibold hover:bg-[#fecaca] transition"
                        >
                          <Icon name="delete" className="text-[14px]" />Delete
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
              <span className="text-[12px] text-[#94a3b8]">Showing <b>{pagination.from ?? 0}–{pagination.to ?? 0}</b> of <b>{pagination.total}</b> entries</span>
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

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc]">
              <h3 className="text-[16px] font-bold text-[#0f172a]">Add New Driver</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <form onSubmit={handleAddDriverSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Marco Verratti"
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. marco@ovms.test"
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Department</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["IT", "FA", "HR&GA", "QC", "QA", "HRD", "GA", "TECHNICAL", "ENGINEERING", "SUPPLY CHAIN", "HSE", "PRODUKSI", "HRD&GA"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">SIM A Photo (Required)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSimChange}
                    className="hidden"
                    id="sim-upload"
                  />
                  <label htmlFor="sim-upload" className="cursor-pointer h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
                    <Icon name="upload" className="text-[16px]" />
                    Upload Image
                  </label>
                  {simPreview && (
                    <img src={simPreview} alt="SIM Preview" className="w-12 h-10 rounded-lg object-cover border border-[#e2e8f0]" />
                  )}
                </div>
              </div>

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
                  disabled={adding}
                  className="h-10 px-6 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add Driver"}
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
              <h3 className="text-[16px] font-bold text-[#0f172a]">Edit Driver</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <form onSubmit={handleEditDriverSubmit} className="p-6 space-y-4">
              {editFormError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {editFormError}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. Marco Verratti"
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="e.g. marco@ovms.test"
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Department</label>
                  <select
                    value={editFormData.department}
                    onChange={e => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["IT", "FA", "HR&GA", "QC", "QA", "HRD", "GA", "TECHNICAL", "ENGINEERING", "SUPPLY CHAIN", "HSE", "PRODUKSI", "HRD&GA"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">SIM A Photo (Optional)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditSimChange}
                    className="hidden"
                    id="edit-sim-upload"
                  />
                  <label htmlFor="edit-sim-upload" className="cursor-pointer h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
                    <Icon name="upload" className="text-[16px]" />
                    Upload Image
                  </label>
                  {editSimPreview && (
                    <img src={editSimPreview} alt="SIM Preview" className="w-12 h-10 rounded-lg object-cover border border-[#e2e8f0]" />
                  )}
                </div>
              </div>

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
                  disabled={updating}
                  className="h-10 px-6 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
