import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export interface Assignment {
  id: string;
  avatar: string;
  requesterName: string;
  department: string;
  priority: "URGENT" | "NORMAL" | "CRITICAL";
  reqId: string;
  destination: string;
  date: string;
  time: string;
  vehicleType: string;
  purpose: string;
  tripStatus?: string; // e.g. "driver_assigned", "on_going", etc.
  requestId?: string;
}

interface MyAssignmentsPageProps {
  pendingAssignments?: Assignment[];
  activeAssignments: Assignment[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDetail: (reqId: string) => void;
  onStartTrip?: (reqId: string) => void;
  onCompleteTrip?: (reqId: string) => void;
}

function PriBadge({ p }: { p: Assignment["priority"] }) {
  const map: Record<Assignment["priority"], string> = {
    URGENT:   "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]",
    NORMAL:   "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]",
    CRITICAL: "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${map[p] || map.NORMAL}`}>{p}</span>
  );
}

function ReqIdBadge({ id }: { id: string }) {
  return (
    <span className="text-[10px] font-bold text-[#475569] bg-[#f1f5f9] border border-[#e2e8f0] px-2.5 py-1 rounded-lg">
      {id}
    </span>
  );
}

function AssignmentCard({
  req, onViewDetail
}: {
  req: Assignment;
  isPending?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDetail: (reqId: string) => void;
  onStartTrip?: (reqId: string) => void;
  onCompleteTrip?: (reqId: string) => void;
}) {
  const cleanReqId = req.reqId.replace('#REQ-', '');
  const isOngoing = req.tripStatus === "on_going";

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl flex flex-col overflow-hidden hover:border-[#c7d7f7] hover:shadow-sm transition-all">
      <div className="p-5 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={req.avatar} alt={req.requesterName}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#e2e8f0] flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requesterName)}&background=1e3a8a&color=fff`; }}
            />
            <div>
              <div className="text-[14px] font-bold text-[#0f172a]">
                {req.requesterName}
              </div>
              <div className="text-[11px] text-[#94a3b8]">{req.department}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <PriBadge p={req.priority} />
            <ReqIdBadge id={req.reqId} />
          </div>
        </div>

        <div className="bg-[#f8faff] border border-[#e5eeff] rounded-xl px-3 py-2.5 flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-[#eff4ff] rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="location_on" className="text-[15px] text-[#1e3a8a]" />
          </div>
          <div>
            <div className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider">Lokasi Tujuan</div>
            <div className="text-[13px] font-bold text-[#0f172a]">{req.destination}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Tanggal</div>
            <div className="font-bold text-[#0f172a]">{req.date}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Waktu</div>
            <div className="font-bold text-[#0f172a]">{req.time}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Tipe Kendaraan</div>
            <div className="font-bold text-[#0f172a]">{req.vehicleType}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Keperluan</div>
            <div className="font-bold text-[#0f172a]">{req.purpose}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-5 py-4 border-t border-[#f1f5f9] bg-[#fafbff] mt-auto">
        {isOngoing ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11.5px] font-bold rounded-lg self-start sm:self-auto shrink-0 whitespace-nowrap">
            <Icon name="sync" className="text-[14px] animate-spin" />
            Sedang Berjalan
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-[11.5px] font-bold rounded-lg self-start sm:self-auto shrink-0 whitespace-nowrap">
            <Icon name="check_circle" className="text-[14px]" />
            Terjadwal
          </span>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {isOngoing && onCompleteTrip && (
            <button
              type="button"
              onClick={() => onCompleteTrip(cleanReqId)}
              className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-xs"
              title="Selesaikan perjalanan & input KM Akhir"
            >
              <Icon name="check_circle" className="text-[15px]" />
              Selesaikan (Isi KM)
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewDetail(cleanReqId)}
            className="h-9 px-4 bg-[#2563eb] text-white text-[12px] font-bold rounded-xl hover:bg-[#1d4ed8] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <Icon name="visibility" className="text-[15px]" />
            Lihat Detail
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyAssignmentsPage({
  pendingAssignments = [],
  activeAssignments = [],
  onApprove,
  onReject,
  onViewDetail,
  onStartTrip,
  onCompleteTrip
}: MyAssignmentsPageProps) {
  const [search, setSearch] = useState("");

  // Only display assignments that belong to the active driver
  const currentList = activeAssignments.length > 0 ? activeAssignments : pendingAssignments;

  const filtered = currentList.filter(
    (a) =>
      a.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      a.destination.toLowerCase().includes(search.toLowerCase()) ||
      a.reqId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-[20px] font-bold text-[#0f172a]">Daftar Tugas Menyetir</h2>
        <p className="text-[12.5px] text-[#64748b]">Pantau dan kelola jadwal perjalanan operasional Anda yang aktif dan terjadwal.</p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan ID, pemohon, atau rute..."
            className="w-full h-10 pl-9 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
          />
        </div>
        <div className="text-[12px] text-[#64748b] font-medium self-end sm:self-auto">
          Menampilkan <span className="font-bold text-[#0f172a]">{filtered.length}</span> penugasan
        </div>
      </div>

      {/* List Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <Icon name="commute" className="text-[22px] text-[#94a3b8]" />
          </div>
          <p className="font-bold text-[#0f172a] text-[14px]">
            Tidak ada tugas menyetir
          </p>
          <p className="text-[12px] text-[#64748b] mt-1 max-w-xs">
            Belum ada jadwal perjalanan operasional yang ditugaskan kepada Anda saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((req) => (
            <AssignmentCard
              key={req.id}
              req={req}
              onApprove={onApprove}
              onReject={onReject}
              onViewDetail={onViewDetail}
              onStartTrip={onStartTrip}
              onCompleteTrip={onCompleteTrip}
            />
          ))}
        </div>
      )}
    </div>
  );
}
