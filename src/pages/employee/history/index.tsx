import React, { useState } from 'react';
import { Layout } from '@/components/layout/RoleLayout';
import { useApi } from '@/hooks/useApi';
import { requestService } from '@/services/modules/requestService';
import { RequestDetailModal } from '@/components/ui/RequestDetailModal';
import type { FleetRequest } from '@/types';
import { useAuthContext } from "@/auth/authContext";

type Priority = "URGENT" | "NORMAL" | "CRITICAL";
type HistoryStatus = "COMPLETED" | "REJECTED" | "CANCELLED";

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
  rating?: number | null;
  ratingNotes?: string | null;
  driverName?: string;
  rawRequest?: any;
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
function IconChevronDown() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
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
function HistoryRow({ item, onViewDetail, onRateClick }: { item: HistoryItem; onViewDetail: (id: string) => void; onRateClick: (req: any) => void }) {
  const [open, setOpen] = useState(false);
  const isCompleted = item.status === 'COMPLETED';
  const pri = PRI_MAP[item.priority] || PRI_MAP.NORMAL;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden transition-all shadow-2xs hover:shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 sm:gap-4 p-3.5 sm:px-6 sm:py-4 hover:bg-[#f8faff] transition-colors text-left cursor-pointer"
      >
        {/* Status icon */}
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
          isCompleted ? 'bg-[#f0fdf4]' : item.status === 'CANCELLED' ? 'bg-[#f1f5f9]' : 'bg-[#fef2f2]'
        }`}>
          {isCompleted
            ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="m9 12 2 2 4-4" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#15803d" strokeWidth="2"/></svg>
            : item.status === 'CANCELLED'
            ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="m15 9-6 6M9 9l6 6" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#dc2626" strokeWidth="2"/></svg>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[12px] sm:text-[14px] font-black text-[#1e3a8a] whitespace-nowrap">{item.reqId}</span>
            <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap ${pri.cls}`}>
              {item.priority}
            </span>
          </div>
          <div className="text-[13px] sm:text-[15px] font-bold text-[#0f172a] truncate">{item.title}</div>
          <div className="text-[10.5px] sm:text-[12px] text-[#94a3b8] truncate mt-0.5">
            {item.requester} • {item.datetime}
          </div>
        </div>

        {/* Status + chevron */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto text-right">
          <div>
            <div className={`text-[11px] sm:text-[14px] font-extrabold whitespace-nowrap ${isCompleted ? 'text-[#15803d]' : 'text-[#dc2626]'}`}>
              {item.status}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#94a3b8] hidden sm:block">{item.statusLabel}</div>
          </div>
          <div className={`transition-transform duration-200 text-slate-400 ${open ? 'rotate-180 text-blue-900' : ''}`}>
            <IconChevronDown />
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-[#f1f5f9] p-4 sm:px-6 sm:py-4 bg-[#f8faff] animate-fadein">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] sm:text-[13px]">
            <div>
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-0.5">Requester</div>
              <div className="font-semibold text-[#0f172a]">{item.requester}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-0.5">DateTime</div>
              <div className="font-semibold text-[#0f172a]">{item.datetime}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-0.5">Decision Process</div>
              <div className="font-semibold text-[#0f172a] leading-snug">{item.notes || 'Processed via OVMS Platform.'}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200/60">
            <button 
              type="button"
              onClick={() => onViewDetail(item.id)}
              className="w-full sm:w-auto h-9 px-4 bg-[#1e3a8a] text-white text-[12px] font-bold rounded-xl hover:bg-[#1e40af] transition-colors cursor-pointer text-center"
            >
              View Full Detail
            </button>

            {isCompleted && (
              item.rating ? (
                <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-xs font-bold text-amber-900 w-full sm:w-auto">
                  <span className="text-amber-500 text-sm">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</span>
                  <span>({item.rating}/5)</span>
                  {item.ratingNotes && <span className="text-slate-600 font-normal italic truncate max-w-[150px] sm:max-w-[200px]">"{item.ratingNotes}"</span>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onRateClick(item.rawRequest)}
                  className="w-full sm:w-auto h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-extrabold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>⭐</span> Beri Rating & Ulasan Driver
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab filter ─────────────────────────────────────────────────────────────────
type TabFilter = 'All History' | 'Completed' | 'Rejected' | 'Cancelled';

export default function EmployeeHistoryPage() {
  const { user } = useAuthContext();
  const [tab, setTab] = useState<TabFilter>('All History');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FleetRequest | null>(null);

  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    request: any | null;
    rating: number;
    notes: string;
  }>({
    isOpen: false,
    request: null,
    rating: 5,
    notes: "",
  });
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const PER_PAGE = 5;

  const { data: fetchedRequests, loading, error, refetch } = useApi(async () => {
    const res = await requestService.getAll({ per_page: 1000 });
    return { data: res.data || [] };
  }, true, []);

  const handleRatingSubmit = async () => {
    if (!ratingModal.request) return;
    setRatingSubmitting(true);
    try {
      await requestService.rateDriver(ratingModal.request.id, {
        rating: ratingModal.rating,
        rating_notes: ratingModal.notes,
      });
      requestService.clearCache();
      refetch();
      setRatingModal({ isOpen: false, request: null, rating: 5, notes: "" });
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyimpan rating driver.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const requestsList = fetchedRequests || [];

  // Filter completed, rejected, and cancelled requests for the logged-in employee
  const historyItems: HistoryItem[] = requestsList
    .filter(r => ["completed", "rejected", "cancelled"].includes(r.rawStatus || ""))
    .map(r => {
      const isCompleted = r.rawStatus === "completed";
      const isCancelled = r.rawStatus === "cancelled";
      const lastApproval = r.approvals && r.approvals.length > 0 
        ? r.approvals[r.approvals.length - 1] 
        : null;
      const notes = lastApproval?.notes ? `Approval notes: ${lastApproval.notes}` : "Processed via OVMS platform.";

      return {
        id: r.id,
        reqId: `REQ-${r.id}`,
        title: `Trip to ${r.destination}`,
        requester: r.employee || user?.name || "Staff",
        datetime: `${r.date} ${r.time}`,
        priority: (r.priority === "URGENT" || r.priority === "HIGH" ? "URGENT" : "NORMAL") as Priority,
        status: (isCompleted ? "COMPLETED" : isCancelled ? "CANCELLED" : "REJECTED") as HistoryStatus,
        statusLabel: isCompleted ? "Finished Successfully" : isCancelled ? "Request Cancelled" : "Request Rejected",
        notes: notes,
        rating: r.rating,
        ratingNotes: (r as any).rating_notes ?? r.ratingNotes,
        driverName: r.driverName || "Driver",
        rawRequest: r,
      };
    });

  const handleViewDetail = (id: string) => {
    const found = requestsList.find(r => r.id === id);
    if (found) {
      setSelectedRequest(found);
      setDetailModalOpen(true);
    }
  };

  const handleRateClick = (req: any) => {
    setRatingModal({
      isOpen: true,
      request: req,
      rating: 5,
      notes: "",
    });
  };

  const filtered = historyItems.filter((item) => {
    const matchTab =
      tab === 'All History' ||
      (tab === 'Completed' && item.status === 'COMPLETED') ||
      (tab === 'Rejected' && item.status === 'REJECTED') ||
      (tab === 'Cancelled' && item.status === 'CANCELLED');
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
  const completedCount = historyItems.filter(h => h.status === 'COMPLETED').length;
  const rejectedCount = historyItems.filter(h => h.status === 'REJECTED').length;
  const cancelledCount = historyItems.filter(h => h.status === 'CANCELLED').length;

  return (
    <Layout
      activeNav="History"
      topbarTitle="My Requests History"
      userRole={user?.role === "approver" ? "Manager Approver" : "Employee"}
      searchPlaceholder="Search history..."
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v);
        setCurrentPage(1);
      }}
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-2.5 sm:p-8">
        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-[26px] font-bold text-[#0f172a]">My Requests History</h2>
          <p className="text-[14px] text-[#64748b] mt-1">Archive log of your completed or rejected travel requests.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-7">
          <StatCard
            icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            label="Total Requests"
            value={String(totalCount)}
          />
          <StatCard
            icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="m9 12 2 2 4-4" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="2"/></svg>}
            label="Completed"
            value={String(completedCount)}
          />
          <StatCard
            icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="m15 9-6 6M9 9l6 6" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#dc2626" strokeWidth="2"/></svg>}
            label="Rejected"
            value={String(rejectedCount)}
          />
          <StatCard
            icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            label="Cancelled"
            value={String(cancelledCount)}
          />
        </div>

        {/* Filters and List */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Header & Tabs */}
          <div className="border-b border-[#e2e8f0] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <IconList />
              <span className="font-bold text-[#0f172a] text-[16px]">History log ({filtered.length})</span>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#f1f5f9] p-1 rounded-xl w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar scrollbar-none flex-nowrap self-start sm:self-auto">
              {(['All History', 'Completed', 'Rejected', 'Cancelled'] as TabFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setCurrentPage(1);
                  }}
                  className={`whitespace-nowrap flex-shrink-0 px-3.5 sm:px-4 py-2 text-[12px] font-bold rounded-lg transition-all cursor-pointer ${
                    tab === t ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* List content */}
          <div className="p-2.5 sm:p-6 space-y-3.5">
            {loading ? (
              <div className="py-12 text-center text-slate-400 font-medium">Loading history...</div>
            ) : error ? (
              <div className="py-12 text-center text-red-500 font-medium">Error loading history logs.</div>
            ) : paginatedHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium">No history items match the filters.</div>
            ) : (
              paginatedHistory.map((item) => (
                <HistoryRow key={item.id} item={item} onViewDetail={handleViewDetail} onRateClick={handleRateClick} />
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && filtered.length > 0 && (
            <div className="border-t border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
              <div className="text-[12px] text-[#94a3b8] font-bold">
                Showing {startIndex + 1} to {Math.min(filtered.length, startIndex + PER_PAGE)} of {filtered.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <IconChevron dir="left" />
                </button>
                <span className="text-[13px] font-bold text-[#0f172a]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <IconChevron dir="right" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailModalOpen && selectedRequest && (
        <RequestDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}

      {/* Rating Driver Modal */}
      {ratingModal.isOpen && ratingModal.request && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 animate-fadein" onClick={() => setRatingModal({ isOpen: false, request: null, rating: 5, notes: "" })}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fadein" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Rating & Evaluasi Driver</h3>
                  <p className="text-xs text-slate-500">Request #{ratingModal.request.id} • {ratingModal.request.driverName || "Driver"}</p>
                </div>
              </div>
              <button
                onClick={() => setRatingModal({ isOpen: false, request: null, rating: 5, notes: "" })}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Beri Rating Pelayanan Driver
                </label>
                <div className="flex justify-center items-center gap-2 text-3xl cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingModal(prev => ({ ...prev, rating: star }))}
                      className="hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                    >
                      <span className={star <= ratingModal.rating ? "text-amber-400 drop-shadow-xs" : "text-slate-200"}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <div className="text-xs font-extrabold text-amber-800">
                  {ratingModal.rating === 5 && "Sangat Memuaskan (5/5)"}
                  {ratingModal.rating === 4 && "Memuaskan (4/5)"}
                  {ratingModal.rating === 3 && "Cukup (3/5)"}
                  {ratingModal.rating === 2 && "Kurang Memuaskan (2/5)"}
                  {ratingModal.rating === 1 && "Buruk (1/5)"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulasan & Catatan/Saran (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={ratingModal.notes}
                  onChange={e => setRatingModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Tuliskan masukan atau pujian untuk driver..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRatingModal({ isOpen: false, request: null, rating: 5, notes: "" })}
                className="flex-1 h-10 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRatingSubmit}
                disabled={ratingSubmitting}
                className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {ratingSubmitting ? "Menyimpan..." : "Kirim Rating ⭐"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
