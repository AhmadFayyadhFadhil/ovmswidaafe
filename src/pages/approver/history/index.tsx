import React, { useState } from 'react';
import { Layout } from '@/components/layout/RoleLayout';
import { useApi } from '@/hooks/useApi';
import { requestService } from '@/services/modules/requestService';
import { RequestDetailModal } from '@/components/ui/RequestDetailModal';
import type { FleetRequest } from '@/types';
import { useAuthContext } from "@/auth/authContext";

type Priority = "URGENT" | "NORMAL" | "CRITICAL";
type HistoryStatus = "APPROVED" | "REJECTED";

interface HistoryItem {
  id: string;
  reqId: string;
  title: string;
  requester: string;
  datetime: string;
  priority: Priority;
  status: HistoryStatus;
  statusLabel: string;
  decidedBy?: string;
  notes?: string;
}

// ── Icons ────────────────────────────────────────────────────────────────────
function IconList() {
  return (  
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="2" rx="1" fill="#1e3a8a"/>
      <rect x="3" y="11" width="18" height="2" rx="1" fill="#1e3a8a"/>
      <rect x="3" y="17" width="18" height="2" rx="1" fill="#1e3a8a"/>
    </svg>
  );
}
function IconApproved() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="#1e3a8a"/>
      <path d="m9 12 2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconRejected() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="#fee2e2"/>
      <path d="m15 9-6 6M9 9l6 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconExport() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="17 8 12 3 7 8" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="15" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconReport() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <rect x="5" y="2" width="14" height="20" rx="2" stroke="#fff" strokeWidth="2"/>
      <path d="M9 7h6M9 11h6M9 15h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
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

// ── Priority chip for history ─────────────────────────────────────────────────
const PRI_MAP: Record<Priority, { label: string; cls: string }> = {
  CRITICAL: { label: 'CRITICAL PRIORITY', cls: 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]' },
  URGENT:   { label: 'URGENT PRIORITY',   cls: 'bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]' },
  NORMAL:   { label: 'NORMAL PRIORITY',   cls: 'bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]' },
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col gap-3">
      <div className="w-11 h-11 bg-[#f0f4ff] rounded-xl flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1">{label}</div>
        <div className="text-[28px] font-bold text-[#0f172a] leading-none">{value}</div>
      </div>
    </div>
  );
}

// ── History row ───────────────────────────────────────────────────────────────
function HistoryRow({ item, onViewDetail }: { item: HistoryItem; onViewDetail: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const isApproved = item.status === 'APPROVED';
  const pri = PRI_MAP[item.priority] || PRI_MAP.NORMAL;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#f8faff] transition-colors text-left cursor-pointer"
      >
        {/* Status icon */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isApproved ? 'bg-[#f0fdf4]' : 'bg-[#fef2f2]'
        }`}>
          {isApproved
            ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="m9 12 2 2 4-4" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#15803d" strokeWidth="2"/></svg>
            : <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="m15 9-6 6M9 9l6 6" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#dc2626" strokeWidth="2"/></svg>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[13px] font-bold text-[#1e3a8a]">{item.reqId}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pri.cls}`}>{pri.label}</span>
          </div>
          <div className="text-[14px] font-semibold text-[#0f172a] truncate">{item.title}</div>
          <div className="flex items-center gap-1 mt-0.5 text-[12px] text-[#94a3b8]">
            <IconUser />
            {item.requester} • {item.datetime}
          </div>
        </div>

        {/* Status + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className={`text-[14px] font-extrabold tracking-wide ${isApproved ? 'text-[#15803d]' : 'text-[#dc2626]'}`}>
              {item.status}
            </div>
            <div className="text-[11px] text-[#94a3b8] hidden sm:block">{item.statusLabel}</div>
          </div>
          <div className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            <IconChevronDown />
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-[#f1f5f9] px-6 py-4 bg-[#f8faff]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
            <div>
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Requester</div>
              <div className="font-semibold text-[#0f172a]">{item.requester}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Decision Date</div>
              <div className="font-semibold text-[#0f172a]">{item.datetime}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Decision By</div>
              <div className="font-semibold text-[#0f172a]">{item.decidedBy || 'Alex Rivera'}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button 
              onClick={() => onViewDetail(item.id)}
              className="h-8 px-4 bg-[#1e3a8a] text-white text-[12px] font-bold rounded-lg hover:bg-[#1e40af] transition-colors cursor-pointer"
            >
              View Full Detail
            </button>
            <button 
              onClick={() => alert('Downloading PDF...')}
              className="h-8 px-4 bg-white border border-[#e2e8f0] text-[#475569] text-[12px] font-bold rounded-lg hover:bg-[#f1f5f9] transition-colors cursor-pointer"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab filter ─────────────────────────────────────────────────────────────────
type TabFilter = 'All History' | 'Approved' | 'Rejected';

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { user } = useAuthContext();
  const [tab, setTab] = useState<TabFilter>('All History');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FleetRequest | null>(null);
  const PER_PAGE = 5;

  const { data: fetchedRequests, loading, error } = useApi(async () => {
    const res = await requestService.getAll({ per_page: 1000 });
    return { data: res.data || [] };
  }, true, []);

  const requestsList = fetchedRequests || [];

  // Map database requests to HistoryItems (requests that are not pending for the current user)
  const isHrGaHead = user?.role === "approver" && 
    (user?.department_id === "HR&GA" || user?.department_id === "HRD&GA" || user?.department_id === "HRD & GA" || user?.department_name === "HRD & GA") && 
    !!user?.is_department_head;

  const historyItems: HistoryItem[] = requestsList
    .filter(r => {
      if (isHrGaHead) {
        // Only show completed or rejected requests in history for HRD & GA Head
        return ["completed", "rejected"].includes(r.rawStatus || "");
      }
      return !r.canApprove;
    })
    .map(r => {
      // Cari log persetujuan untuk user saat ini, atau gunakan persetujuan terakhir sebagai cadangan
      const userApproval = r.approvals?.find(
        (a: any) => String(a.approver?.id) === String(user?.id)
      ) || (r.approvals && r.approvals.length > 0 ? r.approvals[r.approvals.length - 1] : null);

      const isRejected = r.rawStatus === "rejected" || (userApproval && userApproval.status === "rejected");
      const isApproved = !isRejected;

      let decisionDate = `${r.date} ${r.time}`;
      if (userApproval && userApproval.created_at) {
        try {
          const d = new Date(userApproval.created_at);
          decisionDate = d.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(/\//g, '-');
        } catch (e) {
          // fallback
        }
      }

      return {
        id: r.id,
        reqId: `REQ-${r.id}`,
        title: `Trip to ${r.destination}`,
        requester: r.employee || "Staff",
        datetime: decisionDate,
        priority: (r.priority === "URGENT" || r.priority === "HIGH" ? "URGENT" : "NORMAL") as Priority,
        status: (isApproved ? "APPROVED" : "REJECTED") as HistoryStatus,
        statusLabel: isApproved ? "Workflow Approved" : "Action Rejected",
        decidedBy: userApproval?.approver?.name || "Manager Approver",
        notes: userApproval?.notes || "Processed via OVMS platform."
      };
    });

  const handleViewDetail = (id: string) => {
    const found = requestsList.find(r => r.id === id);
    if (found) {
      setSelectedRequest(found);
      setDetailModalOpen(true);
    }
  };

  const filtered = historyItems.filter((item) => {
    const matchTab =
      tab === 'All History' ||
      (tab === 'Approved' && item.status === 'APPROVED') ||
      (tab === 'Rejected' && item.status === 'REJECTED');
    const matchSearch =
      item.reqId.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.requester.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const startIndex = (currentPage - 1) * PER_PAGE;
  const paginatedHistory = filtered.slice(startIndex, startIndex + PER_PAGE);

  const totalCount = historyItems.length;
  const approvedCount = historyItems.filter(h => h.status === 'APPROVED').length;
  const rejectedCount = historyItems.filter(h => h.status === 'REJECTED').length;

  return (
    <Layout
      activeNav="History"
      topbarTitle="Approval Decision History"
      searchPlaceholder="Search history..."
      searchValue={search}
      onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
    >
      <div className="p-4 sm:p-8 bg-[#f8f9ff] min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
          <div>
            <h2 className="text-[22px] font-bold text-[#0f172a]">Approval Decision History</h2>
            <p className="text-[13px] text-[#64748b] mt-1 max-w-md leading-relaxed">
              Track approval decisions, operational workflow progress, request outcomes, and department accountability.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert('Exporting history...')}
              className="h-11 px-5 flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-bold text-[#1e3a8a] hover:bg-[#f8faff] hover:border-[#93c5fd] transition-all shadow-sm cursor-pointer"
            >
              <IconExport />
              Export History
            </button>
            <button 
              onClick={() => alert('Generating report...')}
              className="h-11 px-5 flex items-center gap-2 bg-[#1e3a8a] rounded-xl text-[13px] font-bold text-white hover:bg-[#1e40af] transition-all shadow-sm cursor-pointer"
            >
              <IconReport />
              Generate Report
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <StatCard icon={<IconList />} label="Total Processed" value={loading ? "..." : String(totalCount)} />
          <StatCard icon={<IconApproved />} label="Total Approved" value={loading ? "..." : String(approvedCount)} />
          <StatCard icon={<IconRejected />} label="Total Rejected" value={loading ? "..." : String(rejectedCount)} />
        </div>

        {/* Tab bar */}
        <div className="overflow-x-auto max-w-full mb-6">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-2 flex gap-1 w-fit">
            {(['All History', 'Approved', 'Rejected'] as TabFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setCurrentPage(1); }}
                className={`px-5 h-10 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  tab === t
                    ? 'bg-[#1e3a8a] text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#334155] hover:bg-[#f8fafc]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center text-[#64748b] py-20 bg-white border border-[#e2e8f0] rounded-2xl">
              Loading decision history...
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-20 bg-white border border-[#e2e8f0] rounded-2xl">
              Failed to load decision history from backend.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#e2e8f0] rounded-2xl">
              <p className="text-[15px] font-bold text-[#0f172a]">No history found</p>
              <p className="text-[13px] text-[#64748b] mt-1">Try adjusting your filter or search.</p>
            </div>
          ) : (
            <>
              {paginatedHistory.map((item) => <HistoryRow key={item.id} item={item} onViewDetail={handleViewDetail} />)}
              
              {totalPages > 1 && (
                <div className="border-t border-[#e2e8f0] mt-8 pt-5 flex items-center justify-between">
                  <span className="text-[13px] text-[#64748b]">
                    Showing <strong>{filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PER_PAGE, filtered.length)}</strong> of{' '}
                    <strong>{filtered.length}</strong> items
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                      className="w-9 h-9 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <IconChevron dir="left" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || loading}
                      className="w-9 h-9 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <IconChevron dir="right" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <RequestDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        request={selectedRequest}
      />
    </Layout>
  );
}