import { useState, useEffect, useRef } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";
import { driverService } from "@/services/modules/driverService";
import { assignmentService } from "@/services/modules/assignmentService";
import { departmentService } from "@/services/modules/departmentService";
import type { Department } from "@/services/modules/departmentService";
import { apiClient } from "@/services/api/api";

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-[#dcfce7] text-[#16a34a]";
    case "ONGOING":
      return "bg-[#dbeafe] text-[#1d4ed8]";
    case "PENDING":
      return "bg-[#fef3c7] text-[#d97706]";
    case "COMPLETED":
      return "bg-[#e2e8f0] text-[#475569]";
    case "REJECTED":
      return "bg-[#fee2e2] text-[#991b1b]";
    default:
      return "bg-[#f1f5f9] text-[#64748b]";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "text-red-600 font-bold";
    case "HIGH":
      return "text-orange-600 font-semibold";
    default:
      return "text-gray-600";
  }
};

export default function Request({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: statsData, refetch: refetchStats } = useApi(() => requestService.getAll({ per_page: 1000 }));
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    departmentService.getAll().then(res => {
      if (res.data) setDepartments(res.data);
    }).catch(err => console.error(err));
  }, []);

  const { data: paginatedData, loading, error, refetch: refetchPaginated } = useApi(
    () => requestService.getAll({
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
    purpose: "",
    destinationCity: "",
    destinationPlace: "",
    startTime: "",
    endTime: "",
    passengerCount: 1,
    priority: "Normal",
    notes: "",
  });
  const [adding, setAdding] = useState(false);
  const [passengers, setPassengers] = useState<{ name: string; department_id: string }[]>([]);
  const [formError, setFormError] = useState("");

  // Passenger Autocomplete States (Create)
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activePassengerIndex, setActivePassengerIndex] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const handlePassengerNameChange = (index: number, value: string) => {
    const next = [...passengers];
    next[index] = { ...next[index], name: value };
    setPassengers(next);

    if (!value.trim()) {
      setSuggestions([]);
      setActivePassengerIndex(null);
      return;
    }

    setActivePassengerIndex(index);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiClient.get(`/users-search?search=${encodeURIComponent(value)}`);
        if (res.data?.status === "success") {
          setSuggestions(res.data.data || []);
        }
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (passengerIndex: number, userItem: any) => {
    const next = [...passengers];
    next[passengerIndex] = {
      name: userItem.name,
      department_id: String(userItem.department_id),
    };
    setPassengers(next);
    setSuggestions([]);
    setActivePassengerIndex(null);
  };

  // Passenger Autocomplete States (Edit)
  const [editSuggestions, setEditSuggestions] = useState<any[]>([]);
  const [activeEditPassengerIndex, setActiveEditPassengerIndex] = useState<number | null>(null);
  const [editSearchLoading, setEditSearchLoading] = useState(false);
  const editSearchTimeoutRef = useRef<any>(null);

  const handleEditPassengerNameChange = (index: number, value: string) => {
    const next = [...editPassengers];
    next[index] = { ...next[index], name: value };
    setEditPassengers(next);

    if (!value.trim()) {
      setEditSuggestions([]);
      setActiveEditPassengerIndex(null);
      return;
    }

    setActiveEditPassengerIndex(index);

    if (editSearchTimeoutRef.current) {
      clearTimeout(editSearchTimeoutRef.current);
    }

    editSearchTimeoutRef.current = setTimeout(async () => {
      setEditSearchLoading(true);
      try {
        const res = await apiClient.get(`/users-search?search=${encodeURIComponent(value)}`);
        if (res.data?.status === "success") {
          setEditSuggestions(res.data.data || []);
        }
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setEditSearchLoading(false);
      }
    }, 300);
  };

  const handleSelectEditSuggestion = (passengerIndex: number, userItem: any) => {
    const next = [...editPassengers];
    next[passengerIndex] = {
      name: userItem.name,
      department_id: String(userItem.department_id),
    };
    setEditPassengers(next);
    setEditSuggestions([]);
    setActiveEditPassengerIndex(null);
  };

  // Edit States
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    purpose: "",
    destinationCity: "",
    destinationPlace: "",
    startTime: "",
    endTime: "",
    passengerCount: 1,
    priority: "Normal",
    notes: "",
  });
  const [editPassengers, setEditPassengers] = useState<{ name: string; department_id: string }[]>([]);
  const [editFormError, setEditFormError] = useState("");
  const [updating, setUpdating] = useState(false);

  // Assignment States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignRequest, setAssignRequest] = useState<any | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  const handleOpenAssignModal = async (req: any) => {
    setAssignRequest(req);
    setSelectedDriverId("");
    setAssignNotes("");
    setAssignError("");
    setIsAssignModalOpen(true);
    
    try {
      const res = await driverService.getAll({ per_page: 1000 });
      const available = (res.data || []).filter((d: any) => d.status === "AVAILABLE");
      setDrivers(available);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !assignRequest) return;
    
    setAssigning(true);
    setAssignError("");
    try {
      await assignmentService.create({
        request_id: assignRequest.id,
        driver_id: selectedDriverId,
        notes: assignNotes || undefined,
      });
      setIsAssignModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      setAssignError(err.response?.data?.message || "Gagal menugaskan driver.");
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelAssignment = async (requestId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan penugasan driver untuk request ini?")) return;
    try {
      const res = await assignmentService.getAll({ per_page: 1000 });
      const assignment = (res.data || []).find((a: any) => String(a.request?.id) === String(requestId) && a.status === 'pending_driver');
      if (assignment) {
        await assignmentService.cancel(assignment.id);
        refetch();
      } else {
        alert("Assignment tidak ditemukan.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal membatalkan penugasan.");
    }
  };

  const handleAddPassenger = () => {
    setPassengers([...passengers, { name: "", department_id: departments[0]?.id ? String(departments[0].id) : "" }]);
  };

  const handleRemovePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handlePassengerChange = (index: number, field: "name" | "department_id", value: string) => {
    const next = [...passengers];
    next[index][field] = value;
    setPassengers(next);
  };

  const handleEditClick = (r: any) => {
    if (r.status !== "PENDING") return;
    
    setEditingRequest(r);
    
    const formatDateTime = (str: string) => {
      if (!str) return "";
      return str.substring(0, 16).replace(" ", "T");
    };

    setEditFormData({
      purpose: r.purpose || "",
      destinationCity: r.rawDestinationCity || "",
      destinationPlace: r.rawDestinationPlace || "",
      startTime: formatDateTime(r.startTime),
      endTime: formatDateTime(r.endTime),
      passengerCount: r.passengerCount || 1,
      priority: r.rawPriority || "Normal",
      notes: r.notes || "",
    });
    setEditPassengers(
      Array.isArray(r.passengers)
        ? r.passengers.map((p: any) => ({ name: p.name || "", department_id: p.department_id ? String(p.department_id) : "" }))
        : []
    );
    setEditFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditPassengerChange = (index: number, field: "name" | "department_id", value: string) => {
    const next = [...editPassengers];
    next[index][field] = value;
    setEditPassengers(next);
  };

  const handleAddEditPassenger = () => {
    setEditPassengers([...editPassengers, { name: "", department_id: departments[0]?.id ? String(departments[0].id) : "" }]);
  };

  const handleRemoveEditPassenger = (index: number) => {
    setEditPassengers(editPassengers.filter((_, i) => i !== index));
  };

  const handleEditRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    if (!editFormData.purpose || !editFormData.destinationCity || !editFormData.destinationPlace || !editFormData.startTime) {
      setEditFormError("Purpose, destination city, destination place, and departure time are required.");
      return;
    }

    setUpdating(true);
    setEditFormError("");
    try {
      const payload = {
        purpose: editFormData.purpose,
        destination_city: editFormData.destinationCity,
        destination_place: editFormData.destinationPlace,
        start_time: editFormData.startTime.replace("T", " ") + ":00",
        end_time: editFormData.endTime ? editFormData.endTime.replace("T", " ") + ":00" : null,
        passenger_count: editFormData.passengerCount,
        priority: editFormData.priority,
        notes: editFormData.notes || null,
        passengers: editPassengers.filter(p => p.name.trim() !== ""),
      };

      await requestService.update(editingRequest.id, payload);
      setIsEditModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      setEditFormError(err.response?.data?.message || "Failed to update request.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purpose || !formData.destinationCity || !formData.destinationPlace || !formData.startTime) {
      setFormError("Purpose, destination city, destination place, and departure time are required.");
      return;
    }

    setAdding(true);
    setFormError("");
    try {
      const payload = {
        purpose: formData.purpose,
        destination_city: formData.destinationCity,
        destination_place: formData.destinationPlace,
        start_time: formData.startTime.replace("T", " ") + ":00",
        end_time: formData.endTime ? formData.endTime.replace("T", " ") + ":00" : null,
        passenger_count: formData.passengerCount,
        priority: formData.priority,
        notes: formData.notes || null,
        passengers: passengers.filter(p => p.name.trim() !== ""),
      };

      await requestService.create(payload);
      setIsModalOpen(false);
      setFormData({
        purpose: "",
        destinationCity: "",
        destinationPlace: "",
        startTime: "",
        endTime: "",
        passengerCount: 1,
        priority: "Normal",
        notes: "",
      });
      setPassengers([]);
      refetch();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to create request.");
    } finally {
      setAdding(false);
    }
  };

  const list = paginatedData || [];
  const pagination = (paginatedData as any)?.pagination || { total: 0, currentPage: 1, lastPage: 1, from: null, to: null };

  const handleSearchChange = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleStatusChange = (val: string) => { setStatusFilter(val); setCurrentPage(1); };

  const statsList = statsData || [];
  const totalRequestsCount = (statsList as any)?.pagination?.total ?? statsList.length;
  const pendingCount = statsList.filter(r => r.status === "PENDING").length;
  const ongoingCount = statsList.filter(r => r.status === "ONGOING").length;
  const completedCount = statsList.filter(r => r.status === "COMPLETED").length;

  return (
    <Layout
      activeNav="Request Monitoring"
      onNavigate={onNavigate}
      topbarTitle="Request Monitoring"
      searchPlaceholder="Search requests..."
      userRole="Administrator"
    >
      <div className="p-4 sm:p-6 space-y-5 animate-fadein">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Request Monitoring</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Real-time oversight of vehicle dispatch and mission status across the enterprise.</p>
          </div>
          <div className="flex gap-2.5 flex-shrink-0">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-[#e2e8f0] bg-white rounded-xl text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc] shadow-sm">
              <Icon name="download" className="text-[17px]" />Export
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-sm active:scale-95 transition-all"
            >
              <Icon name="add" className="text-[17px]" />
              New Request
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests",    value: totalRequestsCount, icon: "assignment",      bg: "bg-blue-50",     color: "text-blue-800" },
            { label: "Pending Approval",  value: pendingCount,       icon: "pending_actions", bg: "bg-orange-50",   color: "text-orange-700" },
            { label: "Active Missions",   value: ongoingCount,       icon: "commute",         bg: "bg-sky-50",      color: "text-sky-700" },
            { label: "Completed Today",   value: completedCount,     icon: "task_alt",        bg: "bg-emerald-50",  color: "text-emerald-700" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <Icon name={c.icon} className={`${c.color} text-[20px]`} />
                </div>
              </div>
              <div className="text-[32px] font-bold text-[#0f172a] leading-none">{loading ? "..." : c.value}</div>
              <div className="text-[12px] font-semibold text-[#475569] mt-1.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center gap-3 flex-wrap">
            <div className="relative w-full sm:flex-1">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[16px]" />
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search Requests..."
                className="w-full h-9 pl-9 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => handleStatusChange(e.target.value)}
              className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none"
            >
              {["All", "APPROVED", "PENDING", "ONGOING", "COMPLETED", "REJECTED"].map(s => <option key={s} value={s}>Status: {s}</option>)}
            </select>
            <select className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none">
              <option>Priority: All</option>
              <option>HIGH</option>
              <option>URGENT</option>
              <option>NORMAL</option>
              <option>LOW</option>
            </select>
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] text-[#475569] whitespace-nowrap">
              <Icon name="calendar_today" className="text-[15px]" />
              {(() => {
                const start = new Date();
                start.setDate(start.getDate() - 3);
                const end = new Date();
                end.setDate(end.getDate() + 7);
                const format = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return `${format(start)} – ${format(end)}`;
              })()}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[14px] text-[#64748b]">Loading requests...</div>
          ) : error ? (
            <div className="p-8 text-center text-[14px] text-red-500">Failed to load requests.</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["REQUEST ID", "REQUESTER", "VEHICLE & DRIVER", "DESTINATION", "SCHEDULE", "PRIORITY", "STATUS", "ACTIONS"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-4 py-4 text-[13px] font-bold text-[#1e3a8a]">{r.id}</td>
                    <td className="px-4 py-4">
                      <div className="text-[13px] font-bold text-[#0f172a]">{r.employee}</div>
                      <div className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider">{r.department}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[12px] font-bold text-[#0f172a]">{r.vehicleModel}</div>
                      <div className="text-[11px] text-[#94a3b8]">Driver: {r.driverName}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[13px] text-[#0f172a]">{r.destination}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-[12px] text-[#0f172a] whitespace-nowrap">{r.date}</div>
                      <div className="text-[11px] text-[#94a3b8] whitespace-nowrap">{r.time || "All day"}</div>
                    </td>
                    <td className="px-4 py-4 text-[12px]">
                      <span className={getPriorityColor(r.priority)}>{r.priority}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {r.rawStatus === "submitted" || r.rawStatus === "approved_department" ? (
                          <button
                            onClick={() => handleEditClick(r)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#eef2ff] text-[#1e3a8a] text-[12px] font-semibold hover:bg-[#dbeafe] transition cursor-pointer"
                          >
                            <Icon name="edit" className="text-[14px]" />Edit
                          </button>
                        ) : (
                          <button
                            disabled
                            title="Hanya dapat mengedit request yang belum diproses lanjut"
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#f1f5f9] text-[#94a3b8] text-[12px] font-semibold cursor-not-allowed opacity-50"
                          >
                            <Icon name="edit" className="text-[14px]" />Edit
                          </button>
                        )}

                        {(r.rawStatus === "approved_hrd_ga" || r.rawStatus === "approved_hrd" || r.rawStatus === "approved_department") && (
                          <button
                            onClick={() => handleOpenAssignModal(r)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#f0fdf4] text-[#16a34a] text-[12px] font-semibold hover:bg-[#dcfce7] transition cursor-pointer"
                          >
                            <Icon name="person_add" className="text-[14px]" />Assign
                          </button>
                        )}

                        {r.rawStatus === "waiting_driver" && (
                          <button
                            onClick={() => handleCancelAssignment(r.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#fef2f2] text-[#dc2626] text-[12px] font-semibold hover:bg-[#fee2e2] transition cursor-pointer"
                          >
                            <Icon name="cancel" className="text-[14px]" />Cancel
                          </button>
                        )}
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
                Showing {pagination.from ?? 0} to {pagination.to ?? 0} of {pagination.total} requests
              </span>
              <div className="flex gap-1.5">
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
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc] flex-shrink-0">
              <h3 className="text-[16px] font-bold text-[#0f172a]">Create New Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <form onSubmit={handleAddRequestSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Purpose of Trip</label>
                <input
                  type="text"
                  required
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g. Regional HQ Transfer"
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Destination City</label>
                  <input
                    type="text"
                    required
                    value={formData.destinationCity}
                    onChange={e => setFormData({ ...formData, destinationCity: e.target.value })}
                    placeholder="e.g. Jakarta"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Destination Place</label>
                  <input
                    type="text"
                    required
                    value={formData.destinationPlace}
                    onChange={e => setFormData({ ...formData, destinationPlace: e.target.value })}
                    placeholder="e.g. Sudirman Office"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Departure Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Estimated Return (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Passenger Count</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.passengerCount}
                    onChange={e => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 1 })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["Normal", "Urgent", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Needs luggage space"
                  rows={2}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 resize-none"
                />
              </div>

              {/* Dynamic Passengers */}
              <div className="border-t border-[#f1f5f9] pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[13px] font-bold text-[#0f172a]">Passenger Details</h4>
                  <button
                    type="button"
                    onClick={handleAddPassenger}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-[#1e3a8a] hover:underline"
                  >
                    <Icon name="person_add" className="text-[15px]" /> Add Passenger
                  </button>
                </div>
                <div className="space-y-2">                   {passengers.map((passenger, index) => (
                    <div key={index} className="flex gap-3 items-center bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          required
                          value={passenger.name}
                          onChange={e => handlePassengerNameChange(index, e.target.value)}
                          onFocus={() => {
                            if (passenger.name.trim()) {
                              handlePassengerNameChange(index, passenger.name);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setActivePassengerIndex(null);
                              setSuggestions([]);
                            }, 250);
                          }}
                          placeholder="Passenger Full Name"
                          className="w-full h-9 px-3 border border-[#e2e8f0] rounded-lg text-[12px] text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                        />
                        {activePassengerIndex === index && (suggestions.length > 0 || searchLoading) && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                            {searchLoading ? (
                              <div className="p-3 text-xs text-slate-400 text-center">Searching...</div>
                            ) : (
                              suggestions.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => handleSelectSuggestion(index, item)}
                                  className="px-3 py-2 text-[12px] text-slate-700 hover:bg-blue-50/50 hover:text-[#1e3a8a] cursor-pointer flex justify-between items-center transition-all border-b border-slate-50 last:border-0"
                                >
                                  <span className="font-semibold">{item.name}</span>
                                  <span className="text-[10px] bg-blue-100/60 text-[#1e3a8a] px-1.5 py-0.5 rounded-md font-bold uppercase">
                                    {item.department_name || item.department_id}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <div className="w-1/3">
                        <select
                          value={passenger.department_id}
                          onChange={e => handlePassengerChange(index, "department_id", e.target.value)}
                          className="w-full h-9 px-3 border border-[#e2e8f0] rounded-lg text-[12px] text-[#0f172a] bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="">Pilih Departemen</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePassenger(index)}
                        className="text-[#94a3b8] hover:text-red-500 cursor-pointer"
                      >
                        <Icon name="close" className="text-[18px]" />
                      </button>
                    </div>
                  ))}
                  {passengers.length === 0 && (
                    <p className="text-[12px] text-[#94a3b8] text-center py-2">No extra passengers added.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f5f9] flex-shrink-0">
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
                  {adding ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc] flex-shrink-0">
              <h3 className="text-[16px] font-bold text-[#0f172a]">Edit Request</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b]">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <form onSubmit={handleEditRequestSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {editFormError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {editFormError}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Purpose of Trip</label>
                <input
                  type="text"
                  required
                  value={editFormData.purpose}
                  onChange={e => setEditFormData({ ...editFormData, purpose: e.target.value })}
                  placeholder="e.g. Regional HQ Transfer"
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Destination City</label>
                  <input
                    type="text"
                    required
                    value={editFormData.destinationCity}
                    onChange={e => setEditFormData({ ...editFormData, destinationCity: e.target.value })}
                    placeholder="e.g. Jakarta"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Destination Place</label>
                  <input
                    type="text"
                    required
                    value={editFormData.destinationPlace}
                    onChange={e => setEditFormData({ ...editFormData, destinationPlace: e.target.value })}
                    placeholder="e.g. Sudirman Office"
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Departure Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={editFormData.startTime}
                    onChange={e => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Estimated Return (Optional)</label>
                  <input
                    type="datetime-local"
                    value={editFormData.endTime}
                    onChange={e => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Passenger Count</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editFormData.passengerCount}
                    onChange={e => setEditFormData({ ...editFormData, passengerCount: parseInt(e.target.value) || 1 })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Priority</label>
                  <select
                    value={editFormData.priority}
                    onChange={e => setEditFormData({ ...editFormData, priority: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    {["Normal", "Urgent", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Notes (Optional)</label>
                <textarea
                  value={editFormData.notes}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="e.g. Needs luggage space"
                  rows={2}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 resize-none"
                />
              </div>

              {/* Dynamic Passengers */}
              <div className="border-t border-[#f1f5f9] pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[13px] font-bold text-[#0f172a]">Passenger Details</h4>
                  <button
                    type="button"
                    onClick={handleAddEditPassenger}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-[#1e3a8a] hover:underline"
                  >
                    <Icon name="person_add" className="text-[15px]" /> Add Passenger
                  </button>
                </div>
                <div className="space-y-2">                   {editPassengers.map((passenger, index) => (
                    <div key={index} className="flex gap-3 items-center bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          required
                          value={passenger.name}
                          onChange={e => handleEditPassengerNameChange(index, e.target.value)}
                          onFocus={() => {
                            if (passenger.name.trim()) {
                              handleEditPassengerNameChange(index, passenger.name);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setActiveEditPassengerIndex(null);
                              setEditSuggestions([]);
                            }, 250);
                          }}
                          placeholder="Passenger Full Name"
                          className="w-full h-9 px-3 border border-[#e2e8f0] rounded-lg text-[12px] text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                        />
                        {activeEditPassengerIndex === index && (editSuggestions.length > 0 || editSearchLoading) && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                            {editSearchLoading ? (
                              <div className="p-3 text-xs text-slate-400 text-center">Searching...</div>
                            ) : (
                              editSuggestions.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => handleSelectEditSuggestion(index, item)}
                                  className="px-3 py-2 text-[12px] text-slate-700 hover:bg-blue-50/50 hover:text-[#1e3a8a] cursor-pointer flex justify-between items-center transition-all border-b border-slate-50 last:border-0"
                                >
                                  <span className="font-semibold">{item.name}</span>
                                  <span className="text-[10px] bg-blue-100/60 text-[#1e3a8a] px-1.5 py-0.5 rounded-md font-bold uppercase">
                                    {item.department_name || item.department_id}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <div className="w-1/3">
                        <select
                          value={passenger.department_id}
                          onChange={e => handleEditPassengerChange(index, "department_id", e.target.value)}
                          className="w-full h-9 px-3 border border-[#e2e8f0] rounded-lg text-[12px] text-[#0f172a] bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="">Pilih Departemen</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditPassenger(index)}
                        className="text-[#94a3b8] hover:text-red-500 cursor-pointer"
                      >
                        <Icon name="close" className="text-[18px]" />
                      </button>
                    </div>
                  ))}
                  {editPassengers.length === 0 && (
                    <p className="text-[12px] text-[#94a3b8] text-center py-2">No extra passengers added.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f5f9] flex-shrink-0">
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

      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc] flex-shrink-0">
              <h3 className="text-[16px] font-bold text-[#0f172a]">Assign Driver to Request #{assignRequest?.id}</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b] cursor-pointer">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {assignError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {assignError}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Select Available Driver</label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={e => setSelectedDriverId(e.target.value)}
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.email})
                    </option>
                  ))}
                </select>
                {drivers.length === 0 && (
                  <p className="text-[11px] text-red-500 mt-1">No drivers are currently available.</p>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Assignment Notes (Optional)</label>
                <textarea
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                  placeholder="e.g. Tolong jemput di depan lobi"
                  rows={3}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="h-10 px-5 border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl text-[13px] font-bold text-[#475569] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedDriverId}
                  className="h-10 px-6 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {assigning ? "Assigning..." : "Assign Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
