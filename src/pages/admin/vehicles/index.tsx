import { useState } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { vehicleService } from "@/services/modules/vehicleService";

const getVehicleImage = (imageType: string) => {
  const map: Record<string, string> = {
    tesla: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=80&h=60&fit=crop",
    truck: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=60&fit=crop",
    rav4: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=80&h=60&fit=crop",
    ranger: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=80&h=60&fit=crop",
    generic: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=80&h=60&fit=crop",
  };
  return map[imageType] || map.generic;
};

const getStatusColor = (status: string) => {
  return status === "AVAILABLE" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#dbeafe] text-[#1d4ed8]";
};

export default function Vehicle({ onNavigate = () => {} }: { onNavigate?: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: statsData, refetch: refetchStats } = useApi(() => vehicleService.getAll({ per_page: 1000 }));
  const { data: paginatedData, loading, error, refetch: refetchPaginated } = useApi(
    () => vehicleService.getAll({
      page: currentPage,
      per_page: PAGE_SIZE,
      search: search || undefined,
      status: status === "All Statuses" ? undefined : status,
    }),
    true,
    [currentPage, search, status]
  );

  const refetch = () => {
    refetchStats();
    refetchPaginated();
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    model: "",
    plate: "",
    type: "Sedan",
    capacity: 5,
    odometer: 0,
    status: "Available",
  });
  const [adding, setAdding] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [formError, setFormError] = useState("");

  // Edit States
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    model: "",
    plate: "",
    type: "Sedan",
    capacity: 5,
    odometer: 0,
    status: "Available",
  });
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string>("");
  const [editFormError, setEditFormError] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await vehicleService.delete(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete vehicle", err);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (v: any) => {
    setEditingVehicle(v);
    setEditFormData({
      model: v.model,
      plate: v.plate,
      type: v.type || "Sedan",
      capacity: v.capacity || 5,
      odometer: v.odometer || 0,
      status: v.backendStatus || "Available",
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(v.photoUrl || "");
    setEditFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhotoFile(file);
      setEditPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.model || !editFormData.plate) {
      setEditFormError("Model and plate number are required.");
      return;
    }
    setUpdating(true);
    setEditFormError("");
    try {
      const data = new FormData();
      data.append("name", editFormData.model);
      data.append("plate_number", editFormData.plate);
      data.append("type", editFormData.type);
      data.append("capacity", String(editFormData.capacity));
      data.append("odometer", String(editFormData.odometer));
      data.append("status", editFormData.status);
      if (editPhotoFile) {
        data.append("photo", editPhotoFile);
      }

      await vehicleService.update(editingVehicle.id, data);
      setIsEditModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      setEditFormError(err.response?.data?.message || "Failed to update vehicle.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model || !formData.plate) {
      setFormError("Model and plate number are required.");
      return;
    }
    setAdding(true);
    setFormError("");
    try {
      const data = new FormData();
      data.append("name", formData.model);
      data.append("plate_number", formData.plate);
      data.append("type", formData.type);
      data.append("capacity", String(formData.capacity));
      data.append("odometer", String(formData.odometer));
      data.append("status", formData.status);
      if (photoFile) {
        data.append("photo", photoFile);
      }

      await vehicleService.create(data);
      setIsModalOpen(false);
      setFormData({
        model: "",
        plate: "",
        type: "Sedan",
        capacity: 5,
        odometer: 0,
        status: "Available",
      });
      setPhotoFile(null);
      setPhotoPreview("");
      refetch();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to add vehicle.");
    } finally {
      setAdding(false);
    }
  };

  const list = paginatedData || [];
  const pagination = (paginatedData as any)?.pagination || { total: 0, currentPage: 1, lastPage: 1, from: null, to: null };

  const handleSearchChange = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleStatusChange = (val: string) => { setStatus(val); setCurrentPage(1); };

  const statsList = statsData || [];
  const totalVehiclesCount = (statsList as any)?.pagination?.total ?? statsList.length;
  const availableCount = statsList.filter(v => v.status === "AVAILABLE").length;
  const inTransitCount = statsList.filter(v => v.status === "IN TRANSIT").length;

  return (
    <Layout
      activeNav="Vehicle Management"
      onNavigate={onNavigate}
      topbarTitle="Vehicle Management"
      searchPlaceholder="Search vehicles..."
    >
      <div className="p-4 sm:p-6 space-y-5 animate-fadein">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Vehicle Fleet</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Real-time oversight and asset optimization for your enterprise fleet.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Icon name="add" className="text-[18px]" />
            Add Vehicle
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Vehicles", value: totalVehiclesCount,  badgeColor: "bg-[#dcfce7] text-[#16a34a]", icon: "directions_car" },
            { label: "Active / In Transit", value: inTransitCount, badgeColor: "bg-[#dbeafe] text-[#1d4ed8]", icon: "commute" },
            { label: "Available", value: availableCount,           badgeColor: "bg-[#dcfce7] text-[#16a34a]", icon: "check_circle" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#e8edf8] rounded-xl flex items-center justify-center">
                  <Icon name={c.icon} className="text-[#1e3a8a] text-[20px]" />
                </div>
              </div>
              <div className="text-[13px] text-[#64748b] font-medium">{c.label}</div>
              <div className="text-[32px] font-bold text-[#0f172a] leading-tight">{loading ? "..." : c.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[16px]" />
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search fleet by ID, driver or model..."
                className="w-full h-9 pl-9 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none"
            >
              {["All Statuses", "AVAILABLE", "IN TRANSIT"].map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none">
              <option>All Types</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Truck</option>
            </select>
            <button
              onClick={() => { setSearch(""); setStatus("All Statuses"); setCurrentPage(1); }}
              className="h-9 px-4 border border-[#e2e8f0] rounded-lg text-[12px] font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center text-[14px] text-[#64748b]">Loading vehicles...</div>
          ) : error ? (
            <div className="p-8 text-center text-[14px] text-red-500">Failed to load vehicles data.</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["VEHICLE INFO", "TYPE", "STATUS", "ODOMETER", "ACTIONS"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(v => (
                  <tr key={v.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group animate-slidein">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={getVehicleImage(v.imageType)}
                          alt=""
                          className="w-14 h-10 rounded-lg object-cover border border-[#e2e8f0]"
                          onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='40'%3E%3Crect width='56' height='40' fill='%23e2e8f0'/%3E%3C/svg%3E"; }}
                        />
                        <div>
                          <div className="text-[13px] font-bold text-[#0f172a]">{v.model}</div>
                          <div className="text-[11px] text-[#94a3b8]">{v.plate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#475569]">{v.type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(v.status)}`}>{v.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-[#0f172a]">{v.odometer.toLocaleString()} km</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(v)}
                          className="w-8 h-8 rounded-lg hover:bg-[#eff6ff] flex items-center justify-center transition-colors"
                        >
                          <Icon name="edit" className="text-[#1e3a8a] text-[17px]" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="w-8 h-8 rounded-lg hover:bg-[#fff1f2] flex items-center justify-center transition-colors"
                        >
                          <Icon name="delete" className="text-[#ef4444] text-[17px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.lastPage > 1 && (
            <div className="px-5 py-3 border-t border-[#f1f5f9] flex items-center justify-between bg-[#fafbfc]">
              <span className="text-[12px] text-[#94a3b8]">Showing <b>{pagination.from ?? 0}–{pagination.to ?? 0}</b> of <b>{pagination.total}</b> vehicles</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={pagination.currentPage <= 1}
                  className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center disabled:opacity-40 hover:bg-[#f1f5f9]"
                >
                  <Icon name="chevron_left" className="text-[18px]" />
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
                  <Icon name="chevron_right" className="text-[18px]" />
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
              <h3 className="text-[16px] font-bold text-[#0f172a]">Add New Vehicle</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Model / Name</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g. Toyota Camry"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Plate Number</label>
                  <input
                    type="text"
                    required
                    value={formData.plate}
                    onChange={e => setFormData({ ...formData, plate: e.target.value })}
                    placeholder="e.g. B 1234 CD"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Vehicle Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["Sedan", "SUV", "Van", "Truck", "Electric"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Odometer (km)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.odometer}
                    onChange={e => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["Available", "In Use", "Maintenance", "Retired"].map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Vehicle Photo</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
                    <Icon name="upload" className="text-[16px]" />
                    Upload Image
                  </label>
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="w-12 h-10 rounded-lg object-cover border border-[#e2e8f0]" />
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
                  {adding ? "Adding..." : "Add Vehicle"}
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
              <h3 className="text-[16px] font-bold text-[#0f172a]">Edit Vehicle</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <form onSubmit={handleEditVehicle} className="p-6 space-y-4">
              {editFormError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {editFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Model / Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.model}
                    onChange={e => setEditFormData({ ...editFormData, model: e.target.value })}
                    placeholder="e.g. Toyota Camry"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Plate Number</label>
                  <input
                    type="text"
                    required
                    value={editFormData.plate}
                    onChange={e => setEditFormData({ ...editFormData, plate: e.target.value })}
                    placeholder="e.g. B 1234 CD"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Vehicle Type</label>
                  <select
                    value={editFormData.type}
                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["Sedan", "SUV", "Van", "Truck", "Electric"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editFormData.capacity}
                    onChange={e => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Odometer (km)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editFormData.odometer}
                    onChange={e => setEditFormData({ ...editFormData, odometer: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Vehicle Status</label>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["Available", "In Use", "Maintenance", "Retired"].map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Vehicle Photo (Optional)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditPhotoChange}
                    className="hidden"
                    id="edit-photo-upload"
                  />
                  <label htmlFor="edit-photo-upload" className="cursor-pointer h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
                    <Icon name="upload" className="text-[16px]" />
                    Upload Image
                  </label>
                  {editPhotoPreview && (
                    <img src={editPhotoPreview} alt="Preview" className="w-12 h-10 rounded-lg object-cover border border-[#e2e8f0]" />
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