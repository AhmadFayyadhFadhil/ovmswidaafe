import { useState, useEffect } from 'react';
import { Layout, Icon } from '@/components/layout/RoleLayout';
import { requestService } from '@/services/modules/requestService';
import { RequestDetailModal } from '@/components/ui/RequestDetailModal';
import { exportToCSV } from '@/utils/exportHelper';

function StatusBadge({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'ONGOING' | 'CANCELLED' }) {
  const cfg: Record<string, string> = {
    APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED:  'bg-rose-50 text-rose-700 border-rose-200',
    COMPLETED: 'bg-sky-50 text-sky-700 border-sky-200',
    ONGOING:   'bg-indigo-50 text-indigo-700 border-indigo-200',
    CANCELLED: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return (
    <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 w-fit ${cfg[status] || cfg.PENDING}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function getInitials(name: string) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  return parts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function HistoryPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rawRequests, setRawRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await requestService.getAll({ per_page: 1000 });
      setRawRequests(res.data || []);
    } catch (err) {
      console.error("Gagal memuat log riwayat pengajuan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const handleConfigUpdate = () => {
      requestService.clearCache();
      fetchHistory();
    };
    window.addEventListener("system-config-update", handleConfigUpdate);
    return () => {
      window.removeEventListener("system-config-update", handleConfigUpdate);
    };
  }, []);

  const historyOnly = rawRequests.filter(req => 
    ["completed", "rejected", "cancelled"].includes(req.rawStatus || "") ||
    ["COMPLETED", "REJECTED", "CANCELLED"].includes(req.status || "")
  );

  const filtered = historyOnly.filter(req => {
    const matchSearch =
      String(req.id).toLowerCase().includes(search.toLowerCase()) ||
      (req.employee || '').toLowerCase().includes(search.toLowerCase()) ||
      (req.destination || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const completedCount = historyOnly.filter(r => r.status === 'COMPLETED' || r.rawStatus === 'completed').length;
  const rejectedCount  = historyOnly.filter(r => r.status === 'REJECTED' || r.rawStatus === 'rejected').length;
  const cancelledCount = historyOnly.filter(r => r.status === 'CANCELLED' || r.rawStatus === 'cancelled').length;
  const totalFinishedCount = historyOnly.length;

  return (
    <Layout
      activeNav="History"
      onNavigate={onNavigate}
      topbarTitle="Riwayat Operasional"
      userRole="GA/HRD"
      searchPlaceholder="Cari riwayat..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-4 sm:p-8">
        {/* Page header */}
        <div data-guide="gahrd-history" className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-[24px] font-extrabold text-[#0f172a] tracking-tight">Riwayat Operasional Kendaraan</h2>
            <p className="text-[13.5px] text-[#64748b] mt-0.5">Arsip riwayat perjalanan dinas, persetujuan, dan pengajuan yang selesai atau ditolak.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => {
                const headers = ["ID Request", "Pemohon", "Departemen", "Tujuan", "Driver", "Waktu", "Status"];
                const rows = rawRequests.map(r => [r.id, r.employee, r.department, r.destination, r.driverName || 'Belum Ditugaskan', r.date, r.status]);
                exportToCSV("Riwayat_Operasional_Armada_GA.csv", headers, rows);
              }}
              className="flex items-center gap-2 h-9 px-4 bg-[#1e3a8a] text-white rounded-xl text-[12px] font-bold hover:bg-[#1e40af] shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Icon name="download" className="text-[16px]" /> Export Laporan
            </button>
            <button 
              onClick={fetchHistory}
              className="flex items-center gap-2 h-9 px-4 border border-slate-200 bg-white rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer w-fit"
            >
              <Icon name="refresh" className="text-[16px] text-slate-500" /> Segarkan Data
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Completed Trips", value: completedCount, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100", icon: "task_alt" },
            { label: "Total Riwayat", value: totalFinishedCount, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: "history" },
            { label: "Rejected Trips", value: rejectedCount, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", icon: "cancel" },
            { label: "Cancelled Trips", value: cancelledCount, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100", icon: "block" },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.border} border flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                  <Icon name={card.icon} className={`text-[22px] ${card.color}`} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                  <h3 className="text-[28px] font-black text-slate-800 leading-tight mt-0.5">{card.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-3 shadow-2xs">
          <div className="relative w-full sm:flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari berdasarkan ID Request, Karyawan, atau Tujuan..."
              className="w-full pl-9 pr-4 py-2 text-[13px] bg-[#f8fafc] border border-slate-200 rounded-xl text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-[13px] bg-[#f8fafc] border border-slate-200 rounded-xl text-[#475569] focus:outline-none cursor-pointer font-semibold"
          >
            <option value="ALL">Status: Semua</option>
            <option value="COMPLETED">Status: Completed</option>
            <option value="APPROVED">Status: Approved</option>
            <option value="ONGOING">Status: Ongoing</option>
            <option value="REJECTED">Status: Rejected</option>
            <option value="CANCELLED">Status: Cancelled</option>
            <option value="PENDING">Status: Pending</option>
          </select>
          <button
            onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
            className="p-2 border border-slate-200 rounded-xl text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors cursor-pointer"
            title="Reset filter"
          >
            <Icon name="refresh" className="text-[20px]" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-[13px] table-fixed">
              <colgroup>
                <col className="w-[100px]" />
                <col className="w-[230px]" />
                <col className="w-[220px]" />
                <col className="w-[180px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[110px]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">ID</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Destination</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Driver</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Schedule</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a] mx-auto mb-3"></div>
                      <span className="font-semibold text-sm">Memuat data riwayat perjalanan...</span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <Icon name="search_off" className="text-[40px] text-slate-200 mb-2" />
                      <p className="font-bold text-slate-500">Data Tidak Ditemukan</p>
                      <p className="text-[12px] mt-1">Coba ubah kata pencarian atau filter status.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(req => {
                    const initials = getInitials(req.employee);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 font-bold font-mono text-slate-800 text-[12.5px]">#RQ-{req.id}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-[12px] font-bold flex-shrink-0 shadow-3xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 text-[13px] truncate" title={req.employee}>{req.employee}</div>
                              <div className="text-[11px] text-slate-400 font-semibold truncate" title={req.department}>{req.department}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 min-w-0" title={req.destination}>
                            <Icon name="location_on" className="text-[15px] text-slate-400 flex-shrink-0" />
                            <span className="truncate font-semibold text-[12.5px]">{req.destination}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {req.driverName && req.driverName !== 'Not Assigned' ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[12.5px] truncate" title={req.driverName}>
                              <Icon name="person" className="text-[15px] text-slate-400 flex-shrink-0" />
                              <span className="truncate">{req.driverName}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending Assignment
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <div className="font-semibold text-slate-700 text-[12.5px]">{req.date}</div>
                            <div className="text-[11px] text-slate-400 font-bold mt-0.5">{req.time}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button 
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsDetailOpen(true);
                            }}
                            className="inline-flex items-center gap-1 h-8 px-3 border border-blue-600/30 text-blue-600 rounded-lg text-[12px] font-bold hover:bg-blue-50 active:scale-95 transition-all cursor-pointer shadow-3xs"
                          >
                            <Icon name="visibility" className="text-[14px]" />
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-slate-400 font-medium">
              Menampilkan <strong className="text-slate-600">1 - {filtered.length}</strong> dari{' '}
              <strong className="text-slate-600">{filtered.length}</strong> data riwayat
            </p>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 cursor-pointer">
                <Icon name="chevron_left" className="text-[16px]" />
              </button>
              <button className="h-7 w-7 text-[12px] font-bold rounded flex items-center justify-center bg-[#1e3a8a] text-white">1</button>
              <button className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 cursor-pointer">
                <Icon name="chevron_right" className="text-[16px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Request */}
      <RequestDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </Layout>
  );
}
