import { useState, useEffect } from 'react';
import { Layout, Icon } from '@/components/layout/RoleLayout';
import { requestService } from '@/services/modules/requestService';
import { RequestDetailModal } from '@/components/ui/RequestDetailModal';
import { exportToExcel } from '@/utils/exportHelper';

function StatusBadge({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'ONGOING' | 'CANCELLED' }) {
  const cfg: Record<string, string> = {
    APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED:  'bg-rose-50 text-rose-700 border-rose-200',
    COMPLETED: 'bg-sky-50 text-sky-700 border-sky-200',
    ONGOING:   'bg-indigo-50 text-indigo-700 border-indigo-200',
    CANCELLED: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  const labelMap: Record<string, string> = {
    APPROVED: 'DISETUJUI',
    PENDING: 'MENUNGGU',
    REJECTED: 'DITOLAK',
    COMPLETED: 'SELESAI',
    ONGOING: 'BERJALAN',
    CANCELLED: 'DIBATALKAN',
  };
  return (
    <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 w-fit ${cfg[status] || cfg.PENDING}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labelMap[status] || status}
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

  const completedCount = rawRequests.filter(r => r.status === 'COMPLETED' || r.rawStatus === 'completed').length;
  const pendingCount   = rawRequests.filter(r => r.status === 'PENDING' || ['submitted', 'approved_department', 'waiting_driver', 'assigned_by_ga'].includes(r.rawStatus || '')).length;
  const cancelledCount = rawRequests.filter(r => r.status === 'CANCELLED' || r.rawStatus === 'cancelled').length;
  const rejectedCount  = rawRequests.filter(r => r.status === 'REJECTED' || r.rawStatus === 'rejected').length;
  const totalCount     = rawRequests.length;

  const filtered = rawRequests.filter(req => {
    const s = search.toLowerCase().trim();
    const matchSearch =
      !s ||
      String(req.id).toLowerCase().includes(s) ||
      (req.employee || '').toLowerCase().includes(s) ||
      (req.destination || '').toLowerCase().includes(s) ||
      (req.department || '').toLowerCase().includes(s) ||
      (req.driverName || '').toLowerCase().includes(s) ||
      (req.purpose || '').toLowerCase().includes(s);

    if (!matchSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'COMPLETED') return req.status === 'COMPLETED' || req.rawStatus === 'completed';
    if (statusFilter === 'PENDING') return req.status === 'PENDING' || ['submitted', 'approved_department', 'waiting_driver', 'assigned_by_ga'].includes(req.rawStatus || '');
    if (statusFilter === 'CANCELLED') return req.status === 'CANCELLED' || req.rawStatus === 'cancelled';
    if (statusFilter === 'REJECTED') return req.status === 'REJECTED' || req.rawStatus === 'rejected';
    if (statusFilter === 'ONGOING') return req.status === 'ONGOING' || req.rawStatus === 'on_going';
    return req.status === statusFilter;
  });

  return (
    <Layout
      activeNav="Riwayat"
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
                const headers = [
                  "No",
                  "ID Request",
                  "Jadwal Keberangkatan",
                  "Pemohon",
                  "Departemen",
                  "No. HP / WA",
                  "Tujuan",
                  "Keperluan",
                  "Daftar Penumpang",
                  "Jumlah Penumpang",
                  "Driver / Supir",
                  "Armada / Plat Kendaraan",
                  "KM Keluar (Awal)",
                  "KM Masuk (Akhir)",
                  "Total Tempuh (KM)",
                  "Waktu Scan Berangkat",
                  "Waktu Scan Kembali",
                  "Status"
                ];

                const rows = filtered.map((r, index) => {
                  let passengerNames = "";
                  if (Array.isArray(r.passengers) && r.passengers.length > 0) {
                    passengerNames = r.passengers.map((p: any, i: number) => {
                      const name = typeof p === 'string' ? p : (p.name || p.employee_name || `Penumpang ${i+1}`);
                      const isPic = typeof p === 'object' && (p.is_pic === true || p.is_pic === 1 || p.is_pic === '1' || i === 0);
                      return `${name}${isPic ? ' (PIC)' : ''}`;
                    }).join(", ");
                  } else {
                    passengerNames = `${r.employee || 'Staff'} (PIC)`;
                  }

                  const startKmVal = r.start_km ?? r.operational_trip?.start_km ?? (Array.isArray(r.operational_trips) && r.operational_trips[0]?.start_km) ?? (Array.isArray(r.itineraries) && r.itineraries[0]?.start_km);
                  const endKmVal = r.end_km ?? r.operational_trip?.end_km ?? (Array.isArray(r.operational_trips) && r.operational_trips[0]?.end_km) ?? (Array.isArray(r.itineraries) && r.itineraries[r.itineraries.length - 1]?.end_km);
                  const totalKmVal = r.total_km ?? r.operational_trip?.total_km ?? (Array.isArray(r.operational_trips) && r.operational_trips[0]?.total_km) ?? ((startKmVal && endKmVal) ? Math.max(0, Number(endKmVal) - Number(startKmVal)) : null);

                  const driverStr = r.is_external 
                    ? (r.external_driver_name ? `${r.external_driver_name} (Sewa)` : "Sewa Eksternal")
                    : (r.driverName && r.driverName !== 'Not Assigned' ? r.driverName : 'Belum Ditugaskan');

                  const vehicleStr = r.is_external
                    ? (r.external_license_plate ? `${r.external_provider || 'Sewa'} (${r.external_license_plate})` : (r.external_provider || 'Sewa Eksternal'))
                    : (r.vehicleModel && r.vehicleModel !== 'Not Assigned' ? r.vehicleModel : '-');

                  return [
                    index + 1,
                    `#REQ-${r.id}`,
                    `${r.date} ${r.time || ''}`.trim(),
                    r.employee || "-",
                    r.department || "-",
                    r.userPhone || r.email || "-",
                    r.destination || "-",
                    r.purpose || "-",
                    passengerNames,
                    r.passengerCount || (Array.isArray(r.passengers) ? r.passengers.length : 1),
                    driverStr,
                    vehicleStr,
                    startKmVal !== null && startKmVal !== undefined ? Number(startKmVal) : "-",
                    endKmVal !== null && endKmVal !== undefined ? Number(endKmVal) : "-",
                    totalKmVal !== null && totalKmVal !== undefined ? Number(totalKmVal) : "-",
                    r.security_checked_out_at ? r.security_checked_out_at : "-",
                    r.security_checked_in_at ? r.security_checked_in_at : "-",
                    r.status || r.rawStatus || "-"
                  ];
                });

                const dateStr = new Date().toISOString().slice(0, 10);
                exportToExcel(`Riwayat_Operasional_Armada_GA_${dateStr}.xlsx`, headers, rows, "Riwayat Operasional");
              }}
              className="flex items-center gap-2 h-9 px-4 bg-[#1e3a8a] text-white rounded-xl text-[12px] font-bold hover:bg-[#1e40af] shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Icon name="download" className="text-[16px]" /> Ekspor Laporan (.xlsx)
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
          {[
            { label: "Perjalanan Selesai", value: completedCount, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100", activeBorder: "ring-2 ring-sky-500", icon: "task_alt", filterKey: "COMPLETED" },
            { label: "Menunggu / Pending", value: pendingCount, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", activeBorder: "ring-2 ring-amber-500", icon: "hourglass_top", filterKey: "PENDING" },
            { label: "Perjalanan Dibatalkan", value: cancelledCount, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100", activeBorder: "ring-2 ring-slate-500", icon: "block", filterKey: "CANCELLED" },
            { label: "Perjalanan Ditolak", value: rejectedCount, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", activeBorder: "ring-2 ring-rose-500", icon: "cancel", filterKey: "REJECTED" },
            { label: "Total Riwayat", value: totalCount, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", activeBorder: "ring-2 ring-emerald-500", icon: "history", filterKey: "ALL" },
          ].map((card, i) => (
            <div 
              key={i} 
              onClick={() => setStatusFilter(card.filterKey)}
              className={`bg-white border rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-98 ${
                statusFilter === card.filterKey ? `${card.border} ${card.activeBorder}` : 'border-slate-100'
              }`}
              title={`Klik untuk filter: ${card.label}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.border} border flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                  <Icon name={card.icon} className={`text-[20px] ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{card.label}</p>
                  <h3 className="text-[22px] font-black text-slate-800 leading-tight mt-0.5">{card.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Filter Tabs & Search Bar */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-5 space-y-3.5 shadow-2xs">
          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[12px] font-bold scrollbar-none">
            {[
              { key: 'ALL', label: 'Semua Status', count: totalCount, icon: 'list_alt' },
              { key: 'COMPLETED', label: 'Selesai', count: completedCount, icon: 'check_circle' },
              { key: 'PENDING', label: 'Menunggu / Pending', count: pendingCount, icon: 'hourglass_empty' },
              { key: 'CANCELLED', label: 'Dibatalkan', count: cancelledCount, icon: 'block' },
              { key: 'REJECTED', label: 'Ditolak', count: rejectedCount, icon: 'cancel' },
            ].map(tab => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon name={tab.icon} className="text-[14px]" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar & Dropdown */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <div className="relative w-full sm:flex-1">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari berdasarkan ID Request, Karyawan, Tujuan, Departemen, atau Driver..."
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-[#f8fafc] border border-slate-200 rounded-xl text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-[13px] bg-[#f8fafc] border border-slate-200 rounded-xl text-[#475569] focus:outline-none cursor-pointer font-semibold"
            >
              <option value="ALL">Status: Semua ({totalCount})</option>
              <option value="COMPLETED">Status: Selesai ({completedCount})</option>
              <option value="PENDING">Status: Menunggu ({pendingCount})</option>
              <option value="CANCELLED">Status: Dibatalkan ({cancelledCount})</option>
              <option value="REJECTED">Status: Ditolak ({rejectedCount})</option>
              <option value="ONGOING">Status: Berjalan ({rawRequests.filter(r => r.status === 'ONGOING' || r.rawStatus === 'on_going').length})</option>
            </select>
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
              className="p-2 border border-slate-200 rounded-xl text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors cursor-pointer"
              title="Reset filter"
            >
              <Icon name="refresh" className="text-[20px]" />
            </button>
          </div>
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
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Karyawan</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Tujuan</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Driver</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Jadwal</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-[10.5px] font-bold uppercase tracking-wider text-center">Aksi</th>
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
                              Belum Ditugaskan
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
