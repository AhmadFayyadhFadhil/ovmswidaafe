import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/RoleLayout';
import { PriorityBadge } from '@/components/layout/PriorityBadge';
import { useApi } from '@/hooks/useApi';
import { requestService } from '@/services/modules/requestService';
import { RequestDetailModal } from '@/components/ui/RequestDetailModal';
import { Icon } from '@/components/ui/Icon';
import type { FleetRequest } from '@/types';
import { useAuthContext } from "@/auth/authContext";

interface PendingRequest {
  id: string;
  reqId: string;
  requesterName: string;
  role: string;
  department: string;
  avatar: string;
  priority: "URGENT" | "NORMAL" | "CRITICAL";
  destination: string;
  schedule: string;
  passengers: string;
  date: string;
  time: string;
  vehicleType: string;
  purpose: string;
  isActive?: boolean;
  rawStatus?: string;
  canApprove?: boolean;
  approvals?: any[];
}

// ── Status Mapping Helpers ──────────────────────────────────────────────────
function getStageLabel(rawStatus: string | undefined) {
  switch (rawStatus) {
    case "submitted":
      return "MENUNGGU DEPT HEAD";
    case "approved_department":
      return "MENUNGGU GA KOORDINATOR";
    case "waiting_driver":
      return "MENUNGGU KONFIRMASI DRIVER";
    case "assigned_by_ga":
      return "MENUNGGU APPROVAL HRD&GA HEAD";
    case "driver_assigned":
      return "TERJADWAL";
    case "on_going":
      return "BERJALAN";
    case "completed":
      return "SELESAI";
    case "rejected":
      return "DITOLAK";
    default:
      return rawStatus?.toUpperCase() || "PENDING";
  }
}

function getStatusBadgeStyle(rawStatus: string | undefined) {
  switch (rawStatus) {
    case "completed":
      return "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]";
    case "rejected":
      return "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]";
    case "on_going":
      return "bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe]";
    case "driver_assigned":
      return "bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]";
    case "approved_hrd_ga":
    case "approved_hrd":
      return "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]";
    default:
      return "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]";
  }
}

// ── Icons ────────────────────────────────────────────────────────────────────
function IconCalendar() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#64748b" strokeWidth="2"/>
      <path d="M16 2v4M8 2v4M3 10h18" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="#64748b" strokeWidth="2"/>
      <path d="M12 7v5l3 3" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconCar() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
      <path d="M5 11l1.5-5h11L19 11M5 11H3v5h2v2h2v-2h10v2h2v-2h2v-5h-2M5 11h14" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7.5" cy="11" r="1" fill="#64748b"/>
      <circle cx="16.5" cy="11" r="1" fill="#64748b"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="#64748b" strokeWidth="2"/>
      <path d="m9 12 2 2 4-4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#1e3a8a" strokeWidth="2"/>
      <circle cx="12" cy="9" r="2.5" stroke="#1e3a8a" strokeWidth="2"/>
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 3v5h5" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconChevron(props: { dir?: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      {props.dir === 'left'
        ? <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        : <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    </svg>
  );
}

// ── Detail field inside a card ───────────────────────────────────────────────
function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0 text-[#64748b]">{icon}</span>
      <div>
        <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">{label}</div>
        <div className="text-[13px] font-semibold text-[#1e293b] leading-tight">{value}</div>
      </div>
    </div>
  );
}

// ── Single request card ──────────────────────────────────────────────────────
function RequestCard({
  req,
  onApprove,
  onReject,
  onViewDetail,
  onSelect,
}: {
  req: PendingRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetail: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onSelect(req.id)}
      className={`bg-white rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col ${
        req.isActive
          ? 'border-[#1e3a8a] shadow-md ring-1 ring-[#1e3a8a]/20'
          : 'border-[#e2e8f0] hover:border-[#c7d7f7] hover:shadow-sm'
      }`}
    >
      {/* Card header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={req.avatar}
              alt={req.requesterName}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#e2e8f0]"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requesterName)}&background=1e3a8a&color=fff`; }}
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#0f172a] leading-tight">{req.requesterName}</div>
            <div className="text-[12px] text-[#64748b]">{req.department}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <PriorityBadge priority={req.priority} />
          {req.rawStatus && (
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md mt-0.5 border ${getStatusBadgeStyle(req.rawStatus)}`}>
              {getStageLabel(req.rawStatus)}
            </span>
          )}
          <span className="text-[11px] text-[#94a3b8] font-medium">ID: {req.reqId}</span>
        </div>
      </div>

      {/* Destination row */}
      <div className="mx-5 mb-4 bg-[#f8faff] border border-[#e5eeff] rounded-xl px-3 py-2.5 flex items-center gap-2">
        <div className="w-7 h-7 bg-[#eff4ff] rounded-lg flex items-center justify-center flex-shrink-0">
          <IconMapPin />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Destination</div>
          <div className="text-[13px] font-bold text-[#0f172a]">{req.destination}</div>
        </div>
      </div>

      {/* Detail grid */}
      <div className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pb-4">
        <DetailField icon={<IconCalendar />} label="Date" value={req.date} />
        <DetailField icon={<IconClock />} label="Time" value={req.time} />
        <DetailField icon={<IconCar />} label="Vehicle" value={req.vehicleType} />
        <DetailField icon={<IconCheck />} label="Purpose" value={req.purpose} />
      </div>

      {/* Approvals Checklist */}
      {(() => {
        const approvals = req.approvals || [];
        const isDeptHeadApproved = approvals.some((a: any) => a.role === 'dept_head' && a.status === 'approved');
        const isHrdApproved = approvals.some((a: any) => a.role === 'hrd_head' && a.status === 'approved');
        return (
          <div className="mx-5 mb-3 px-3 py-2 bg-[#fafbfc] border border-[#f1f5f9] rounded-xl flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[#64748b]">Persetujuan:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isDeptHeadApproved ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                <span className={isDeptHeadApproved ? "text-green-800 font-bold" : "text-gray-500 font-normal"}>Dept Head</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isHrdApproved ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                <span className={isHrdApproved ? "text-green-800 font-bold" : "text-gray-500 font-normal"}>GA & HRD Head</span>
              </span>
            </div>
          </div>
        );
      })()}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons — only shown when isActive */}
      {req.isActive && (
        <div className="px-5 pb-5 pt-3 border-t border-[#f1f5f9] mt-2" onClick={e => e.stopPropagation()}>
          {req.canApprove ? (
            <div className="flex items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={() => onReject(req.id)}
                className="h-10 px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[12.5px] font-bold hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Icon name="close" className="text-[16px]" />
                <span>Tolak</span>
              </button>
              <button
                type="button"
                onClick={() => onApprove(req.id)}
                className="flex-1 h-10 bg-[#1e3a8a] text-white rounded-xl text-[12.5px] font-bold hover:bg-[#1e40af] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Icon name="fact_check" className="text-[17px]" />
                <span>Tinjau & Setujui</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onViewDetail(req.id)}
              className="w-full h-10 bg-[#f8fafc] text-[#334155] border border-[#e2e8f0] text-[12.5px] font-bold rounded-xl hover:bg-[#f1f5f9] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Icon name="visibility" className="text-[17px] text-[#64748b]" />
              <span>Lihat Detail Pengajuan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ApprovalManagement() {
  const { user } = useAuthContext();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [priority, setPriority] = useState('All Priority');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FleetRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; requestId: string | null; reason: string }>({
    isOpen: false,
    requestId: null,
    reason: "",
  });
  const PER_PAGE = 4;

  const isHrGaHead = user?.role === "approver" && 
    (user?.department_id === "HR&GA" || user?.department_id === "HRD&GA" || user?.department_id === "HRD & GA" || user?.department_name === "HRD & GA") && 
    !!user?.is_department_head;

  const { data: fetchedRequests, loading, error, refetch, setData } = useApi(async () => {
    const res = await requestService.getAll({ per_page: 1000 });
    return { data: res.data || [] };
  }, true, []);

  const requestsList = fetchedRequests || [];

  // Map pending requests from database (filtered by canApprove and status)
  const mappedRequests: PendingRequest[] = requestsList
    .filter(r => {
      if (["completed", "rejected", "cancelled"].includes(r.rawStatus || "")) {
        return false;
      }
      if (isHrGaHead) {
        return r.canApprove || ["assigned_by_ga", "approved_hrd_ga", "approved_hrd", "waiting_driver", "driver_assigned", "on_going"].includes(r.rawStatus || "");
      }
      return r.canApprove || r.rawStatus === "submitted";
    })
    .map(r => ({
      id: r.id,
      reqId: `#RQ-${r.id}`,
      requesterName: r.employee || "Staff",
      role: "Staff Member",
      department: r.department || "IT Department",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.employee || "Staff")}&background=1e3a8a&color=fff`,
      priority: r.priority === "URGENT" || r.priority === "HIGH" ? "URGENT" : "NORMAL",
      destination: r.destination,
      schedule: `${r.date} ${r.time}`,
      passengers: `${r.passengers?.length || 0} Person`,
      date: r.date || "Today",
      time: r.time || "09:00",
      vehicleType: r.vehicleModel || "Unassigned",
      purpose: r.purpose || "Operational Trip",
      rawStatus: r.rawStatus,
      canApprove: !!r.canApprove,
      approvals: r.approvals || [],
    }));

  // Auto-open request detail if ?open_request=X or ?req_id=X is present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('open_request') || params.get('req_id') || params.get('id');
    if (targetId && requestsList.length > 0) {
      const found = requestsList.find(r => String(r.id) === String(targetId));
      if (found) {
        setSelectedRequest(found);
        setDetailModalOpen(true);
        setActiveCardId(found.id);
      }
    }
  }, [requestsList]);

  // Auto-set the first mapped request as active if none is selected
  useEffect(() => {
    if (mappedRequests.length > 0 && !activeCardId) {
      setActiveCardId(mappedRequests[0].id);
    }
  }, [mappedRequests, activeCardId]);

  const filtered = mappedRequests.filter((r) => {
    const matchSearch =
      r.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      r.reqId.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase());
    const matchDept = department === 'All Departments' || r.department === department;
    const matchPri = priority === 'All Priority' || r.priority === priority.toUpperCase();
    return matchSearch && matchDept && matchPri;
  });

  const TOTAL = filtered.length;
  const TOTAL_PAGES = Math.max(1, Math.ceil(TOTAL / PER_PAGE));

  const startIdx = (currentPage - 1) * PER_PAGE;
  const displayed = filtered.slice(startIdx, startIdx + PER_PAGE).map(r => ({
    ...r,
    isActive: r.id === activeCardId
  }));

  const handleApprove = async (id: string) => {
    try {
      setDetailModalOpen(false);
      setSelectedRequest(null);
      setActiveCardId(null);
      setData((prev: any) => (Array.isArray(prev) ? prev.filter((r: any) => String(r.id) !== String(id)) : []));
      requestService.clearCache();
      await requestService.approve(id, "Disetujui");
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
      await refetch();
    } catch (err) {
      console.error("Gagal menyetujui request", err);
      await refetch();
    }
  };

  const handleReject = async (id: string, notes: string = "Ditolak") => {
    try {
      setDetailModalOpen(false);
      setSelectedRequest(null);
      setActiveCardId(null);
      setRejectModal({ isOpen: false, requestId: null, reason: "" });
      setData((prev: any) => (Array.isArray(prev) ? prev.filter((r: any) => String(r.id) !== String(id)) : []));
      requestService.clearCache();
      await requestService.reject(id, notes);
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
      await refetch();
    } catch (err) {
      console.error("Gagal menolak request", err);
      await refetch();
    }
  };

  const handleViewDetail = (id: string) => {
    const found = requestsList.find(r => r.id === id);
    if (found) {
      setSelectedRequest(found);
      setDetailModalOpen(true);
    }
  };

  const handleReset = () => {
    setDepartment('All Departments');
    setPriority('All Priority');
    setSearch('');
    setCurrentPage(1);
  };

  // Get distinct departments from database requests for dynamic dropdown options
  const uniqueDepts = Array.from(new Set(mappedRequests.map(r => r.department)));

  return (
    <Layout
      activeNav="Pending Requests"
      topbarTitle="Approval Management"
      searchPlaceholder="Search requests..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-4 sm:p-8 bg-[#f8f9ff] min-h-screen">
        {/* Page header */}
        <div data-guide="approver-requests-list" className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a] leading-tight">Approval Management</h2>
            <p className="text-[14px] text-[#64748b] mt-1">Review and manage vehicle requests across departments.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Department filter */}
            <div className="relative">
              <select
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setCurrentPage(1); }}
                className="h-10 pl-3 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-semibold text-[#334155] outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                <option>All Departments</option>
                {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Priority filter */}
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => { setPriority(e.target.value); setCurrentPage(1); }}
                className="h-10 pl-3 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-semibold text-[#334155] outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                <option>All Priority</option>
                <option>URGENT</option>
                <option>NORMAL</option>
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Reset */}
            <button
              onClick={handleReset}
              className="h-10 px-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#1e3a8a] hover:bg-[#eff4ff] rounded-xl transition-colors cursor-pointer"
            >
              <IconRefresh />
              Reset
            </button>
          </div>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[16px] font-bold text-[#0f172a]">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[16px] font-bold text-red-500">Failed to load requests from backend.</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-[#eff4ff] rounded-2xl flex items-center justify-center mb-4 text-[#1e3a8a]">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[16px] font-bold text-[#0f172a]">No pending requests</p>
            <p className="text-[13px] text-[#64748b] mt-1">All requests have been processed.</p>
          </div>
        ) : (
          <div data-guide="approver-requests-list" className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayed.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onApprove={handleViewDetail}
                onReject={(id) => setRejectModal({ isOpen: true, requestId: id, reason: "" })}
                onViewDetail={handleViewDetail}
                onSelect={setActiveCardId}
              />
            ))}
          </div>
        )}

        {/* Divider + pagination */}
        {TOTAL_PAGES > 1 && (
          <div className="border-t border-[#e2e8f0] mt-8 pt-5 flex items-center justify-between">
            <span className="text-[13px] text-[#64748b]">
              Showing <strong>{TOTAL === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + PER_PAGE, TOTAL)}</strong> of{' '}
              <strong>{TOTAL}</strong> pending requests
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="w-9 h-9 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <IconChevron dir="left" />
              </button>
              {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-xl border text-[13px] font-bold transition-all cursor-pointer ${
                    currentPage === p
                      ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-sm'
                      : 'border-[#e2e8f0] bg-white text-[#475569] hover:border-[#93c5fd] hover:text-[#1e3a8a]'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1))}
                disabled={currentPage === TOTAL_PAGES || loading}
                className="w-9 h-9 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <IconChevron dir="right" />
              </button>
            </div>
          </div>
        )}
      </div>
      <RequestDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Custom Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm animate-fadein p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setRejectModal({ isOpen: false, requestId: null, reason: "" })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-xl" />
            </button>
            
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-50 text-[#ba1a1a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="block" className="text-3xl" />
              </div>
              <h3 className="text-[18px] font-extrabold text-slate-800">Tolak Permintaan Kendaraan</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Silakan masukkan alasan penolakan untuk dikirimkan kembali ke pemohon tiket.
              </p>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!rejectModal.requestId || !rejectModal.reason.trim()) return;
                await handleReject(rejectModal.requestId, rejectModal.reason.trim());
                setRejectModal({ isOpen: false, requestId: null, reason: "" });
              }} 
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Contoh: Kuota kendaraan habis / tujuan tidak sesuai agenda dinas..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-slate-400 resize-none font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ isOpen: false, requestId: null, reason: "" })}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={!rejectModal.reason.trim()}
                  className="flex-1 py-3 bg-[#ba1a1a] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-sm"
                >
                  Tolak Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}