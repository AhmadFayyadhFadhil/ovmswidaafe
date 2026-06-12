import { useState } from 'react';
import { Layout, Icon } from '@/components/layout/RoleLayout';

export interface LogisticRequest {
  id: string;
  employeeName: string;
  employeeDept: string;
  employeeAvatar?: string;
  destination: string;
  driverName?: string;
  dateTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
}

const SAMPLE_REQUESTS: LogisticRequest[] = [
  { id: 'REQ-001', employeeName: 'Andi Sullivan', employeeDept: 'Engineering', destination: 'Soekarno-Hatta Airport', driverName: 'John Doe', dateTime: 'Oct 28, 2023 14:30', status: 'COMPLETED' },
  { id: 'REQ-002', employeeName: 'Sarah Johnson', employeeDept: 'Marketing', destination: 'Tech Park Building B', driverName: 'Michael Chen', dateTime: 'Oct 24, 2023 09:00', status: 'APPROVED' },
  { id: 'REQ-003', employeeName: 'David Kim', employeeDept: 'Finance', destination: 'Central Jakarta Office', dateTime: 'Oct 20, 2023 11:00', status: 'REJECTED' },
  { id: 'REQ-004', employeeName: 'Lisa Wang', employeeDept: 'Operations', destination: 'Sudirman Business District', driverName: 'Robert Lee', dateTime: 'Oct 18, 2023 15:00', status: 'COMPLETED' },
  { id: 'REQ-005', employeeName: 'Marcus Chen', employeeDept: 'IT', destination: 'Kuningan City Mall', dateTime: 'Oct 15, 2023 10:30', status: 'PENDING' },
];

function StatusBadge({ status }: { status: LogisticRequest['status'] }) {
  const cfg: Record<LogisticRequest['status'], string> = {
    APPROVED:  'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]',
    PENDING:   'bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]',
    REJECTED:  'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]',
    COMPLETED: 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit ${cfg[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function HistoryPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [requests] = useState<LogisticRequest[]>(SAMPLE_REQUESTS);

  const filtered = requests.filter(req => {
    const matchSearch =
      req.id.toLowerCase().includes(search.toLowerCase()) ||
      req.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      req.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
  const rejectedCount  = requests.filter(r => r.status === 'REJECTED').length;
  const approvedCount  = requests.filter(r => r.status === 'APPROVED').length;

  return (
    <Layout
      activeNav="History"
      onNavigate={onNavigate}
      topbarTitle="Logistics History"
      userRole="GA/HRD"
      searchPlaceholder="Search history..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-4 sm:p-8">
        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-[26px] font-bold text-[#0f172a]">Logistics History Log</h2>
          <p className="text-[14px] text-[#64748b] mt-1">Archive log of historical request activity, review of completed or rejected requests.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
              <Icon name="task_alt" className="text-[24px] text-[#16a34a]" />
            </div>
            <div>
              <div className="text-[12px] text-[#64748b] font-medium">Completed</div>
              <div className="text-[28px] font-bold text-[#0f172a]">{986 + completedCount}</div>
            </div>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center">
              <Icon name="check_circle" className="text-[24px] text-[#2563eb]" />
            </div>
            <div>
              <div className="text-[12px] text-[#64748b] font-medium">Approved</div>
              <div className="text-[28px] font-bold text-[#0f172a]">{approvedCount}</div>
            </div>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#fef2f2] flex items-center justify-center">
              <Icon name="cancel" className="text-[24px] text-[#dc2626]" />
            </div>
            <div>
              <div className="text-[12px] text-[#64748b] font-medium">Rejected</div>
              <div className="text-[28px] font-bold text-[#0f172a]">{119 + rejectedCount}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Request ID or Name..."
              className="w-full pl-9 pr-4 py-2 text-[13px] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-[13px] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[#475569] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            <option value="COMPLETED">Status: Completed</option>
            <option value="APPROVED">Status: Approved</option>
            <option value="REJECTED">Status: Rejected</option>
            <option value="PENDING">Status: Pending</option>
          </select>
          <button
            onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
            className="p-2 border border-[#e2e8f0] rounded-xl text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
            title="Reset filters"
          >
            <Icon name="refresh" className="text-[20px]" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Request ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Employee</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Destination</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Driver</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Schedule</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#94a3b8]">
                      <Icon name="search_off" className="text-[40px] text-[#e2e8f0] mb-2" />
                      <p className="font-bold text-[#475569]">No records found</p>
                      <p className="text-[12px] mt-1">Try changing the filter or search term.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(req => {
                    const initials = getInitials(req.employeeName);
                    return (
                      <tr key={req.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-6 py-4 font-bold font-mono text-[#0f172a]">#{req.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {req.employeeAvatar ? (
                              <img src={req.employeeAvatar} alt={req.employeeName} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#e5eeff] text-[#1e3a8a] flex items-center justify-center text-[11px] font-bold">
                                {initials}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-[#0f172a]">{req.employeeName}</div>
                              <div className="text-[11px] text-[#94a3b8]">{req.employeeDept}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#475569] max-w-[160px] truncate">
                          <div className="flex items-center gap-1.5">
                            <Icon name="location_on" className="text-[14px] text-[#94a3b8] flex-shrink-0" />
                            <span className="truncate">{req.destination}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#475569]">
                          {req.driverName ? (
                            <span className="font-semibold text-[#0f172a]">{req.driverName}</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#f59e0b] bg-[#fef9c3] px-2 py-0.5 rounded">Pending Assignment</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#475569]">{req.dateTime}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button className="text-[12px] font-bold text-[#1e3a8a] hover:underline">Detail</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-4 sm:px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-[#94a3b8]">
              Showing <strong className="text-[#475569]">1 - {filtered.length}</strong> of{' '}
              <strong className="text-[#475569]">{filtered.length}</strong>
            </p>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#94a3b8]">
                <Icon name="chevron_left" className="text-[16px]" />
              </button>
              <button className="h-7 w-7 text-[12px] font-bold rounded flex items-center justify-center bg-[#1e3a8a] text-white">1</button>
              <button className="p-1.5 rounded border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#94a3b8]">
                <Icon name="chevron_right" className="text-[16px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
