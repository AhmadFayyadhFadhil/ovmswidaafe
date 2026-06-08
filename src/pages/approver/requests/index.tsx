import React, { useState } from 'react';
import { Layout } from '@/components/layout/RoleLayout';
import { PriorityBadge } from '@/components/layout/PriorityBadge';
import type { PendingRequest } from '@/config/data';
import { PENDING_REQUESTS } from '@/config/data';

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
}: {
  req: PendingRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetail: (id: string) => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col ${
        req.isActive
          ? 'border-[#1e3a8a] shadow-md'
          : 'border-[#e2e8f0] hover:border-[#c7d7f7] hover:shadow-sm'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
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
      <div className="px-5 grid grid-cols-2 gap-x-6 gap-y-3 pb-4">
        <DetailField icon={<IconCalendar />} label="Date" value={req.date} />
        <DetailField icon={<IconClock />} label="Time" value={req.time} />
        <DetailField icon={<IconCar />} label="Vehicle Type" value={req.vehicleType} />
        <DetailField icon={<IconCheck />} label="Purpose" value={req.purpose} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons — only shown when isActive */}
      {req.isActive && (
        <div className="px-5 pb-5 pt-2 flex items-center gap-2 border-t border-[#f1f5f9] mt-2">
          <button
            onClick={() => onApprove(req.id)}
            className="flex-1 h-10 bg-[#1e3a8a] text-white text-[13px] font-bold rounded-xl hover:bg-[#1e40af] active:scale-95 transition-all"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(req.id)}
            className="flex-1 h-10 bg-white text-[#dc2626] border border-[#dc2626] text-[13px] font-bold rounded-xl hover:bg-[#fef2f2] active:scale-95 transition-all"
          >
            Reject
          </button>
          <button
            onClick={() => onViewDetail(req.id)}
            className="flex-1 h-10 bg-[#f8fafc] text-[#334155] border border-[#e2e8f0] text-[13px] font-bold rounded-xl hover:bg-[#f1f5f9] active:scale-95 transition-all"
          >
            View Detail
          </button>
        </div>
      )}
    </div>
  );
}


// ── Main Page ────────────────────────────────────────────────────────────────
export default function ApprovalManagement() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [priority, setPriority] = useState('All Priority');
  const [requests, setRequests] = useState<PendingRequest[]>(PENDING_REQUESTS);
  const [currentPage, setCurrentPage] = useState(1);
  const TOTAL = 24;
  const PER_PAGE = 4;
  const TOTAL_PAGES = Math.ceil(TOTAL / PER_PAGE);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      r.reqId.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase());
    const matchDept = department === 'All Departments' || r.department === department;
    const matchPri = priority === 'All Priority' || r.priority === priority.toUpperCase();
    return matchSearch && matchDept && matchPri;
  });

  const displayed = filtered.slice(0, PER_PAGE);

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };
  const handleReject = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };
  const handleViewDetail = (_id: string) => {
    alert('View Detail — connect to your router here');
  };
  const handleReset = () => {
    setDepartment('All Departments');
    setPriority('All Priority');
    setSearch('');
  };

  return (
    <Layout
      activeNav="Requests"
      topbarTitle="Approval Management"
      searchPlaceholder="Search requests..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-8 bg-[#f8f9ff] min-h-screen">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a] leading-tight">Approval Management</h2>
            <p className="text-[14px] text-[#64748b] mt-1">Review and manage vehicle requests across departments.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Department filter */}
            <div className="relative">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-10 pl-3 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-semibold text-[#334155] outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                <option>All Departments</option>
                <option>Logistics Department</option>
                <option>Sales &amp; Marketing</option>
                <option>Maintenance Unit</option>
                <option>Admin &amp; Facilities</option>
                <option>IT Department</option>
                <option>HR Division</option>
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Priority filter */}
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-10 pl-3 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-semibold text-[#334155] outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              >
                <option>All Priority</option>
                <option>URGENT</option>
                <option>NORMAL</option>
                <option>CRITICAL</option>
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Reset */}
            <button
              onClick={handleReset}
              className="h-10 px-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#1e3a8a] hover:bg-[#eff4ff] rounded-xl transition-colors"
            >
              <IconRefresh />
              Reset
            </button>
          </div>
        </div>

        {/* Cards grid */}
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-[#eff4ff] rounded-2xl flex items-center justify-center mb-4">
              <IconCheck />
            </div>
            <p className="text-[16px] font-bold text-[#0f172a]">No pending requests</p>
            <p className="text-[13px] text-[#64748b] mt-1">All requests have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {displayed.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>
        )}

        {/* Divider + pagination */}
        <div className="border-t border-[#e2e8f0] mt-8 pt-5 flex items-center justify-between">
          <span className="text-[13px] text-[#64748b]">
            Showing <strong>{Math.min(displayed.length, PER_PAGE)}</strong> of{' '}
            <strong>{TOTAL}</strong> pending requests
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors"
            >
              <IconChevron dir="left" />
            </button>
            {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-9 h-9 rounded-xl border text-[13px] font-bold transition-all ${
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
              disabled={currentPage === TOTAL_PAGES}
              className="w-9 h-9 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors"
            >
              <IconChevron dir="right" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}