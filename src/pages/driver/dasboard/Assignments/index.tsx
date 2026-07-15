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
  pendingAssignments: Assignment[];
  activeAssignments: Assignment[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
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
  req, isPending, onApprove, onReject, onViewDetail, onStartTrip, onCompleteTrip
}: {
  req: Assignment;
  isPending: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
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
            <div className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider">Destination</div>
            <div className="text-[13px] font-bold text-[#0f172a]">{req.destination}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Date</div>
            <div className="font-bold text-[#0f172a]">{req.date}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Time</div>
            <div className="font-bold text-[#0f172a]">{req.time}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Vehicle Type</div>
            <div className="font-bold text-[#0f172a]">{req.vehicleType}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Purpose</div>
            <div className="font-bold text-[#0f172a]">{req.purpose}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 px-5 py-4 border-t border-[#f1f5f9] bg-[#fafbff] mt-auto">
        <button
          onClick={() => onViewDetail(cleanReqId)}
          className="w-full sm:flex-1 h-9 bg-white border border-[#e2e8f0] text-[#475569] text-[12px] font-bold rounded-xl hover:bg-[#f8fafc] active:scale-95 transition-all cursor-pointer"
        >
          View Detail
        </button>

        {isPending ? (
          <>
            <button
              onClick={() => onApprove(req.id)}
              className="w-full sm:flex-1 h-9 bg-[#1e3a8a] text-white text-[12px] font-bold rounded-xl hover:bg-[#1e40af] active:scale-95 transition-all cursor-pointer"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(req.id)}
              className="w-full sm:flex-1 h-9 bg-white border border-[#dc2626] text-[#dc2626] text-[12px] font-bold rounded-xl hover:bg-[#fef2f2] active:scale-95 transition-all cursor-pointer"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            {req.tripStatus === "driver_assigned" && onStartTrip && (
              <button
                onClick={() => onStartTrip(cleanReqId)}
                className="w-full sm:flex-1 h-9 bg-[#16a34a] text-white text-[12px] font-bold rounded-xl hover:bg-[#15803d] active:scale-95 transition-all cursor-pointer"
              >
                Mulai Perjalanan
              </button>
            )}
            {isOngoing && onCompleteTrip && (
              <button
                onClick={() => onCompleteTrip(cleanReqId)}
                className="w-full sm:flex-1 h-9 bg-indigo-600 text-white text-[12px] font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
              >
                Selesaikan
              </button>
            )}
            {!["driver_assigned", "on_going"].includes(req.tripStatus || "") && (
              <span className="text-[12px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                Menunggu Konfirmasi GA/HRD
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MyAssignmentsPage({
  pendingAssignments,
  activeAssignments,
  onApprove,
  onReject,
  onViewDetail,
  onStartTrip,
  onCompleteTrip
}: MyAssignmentsPageProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");
  const [search, setSearch] = useState("");

  const currentList = activeTab === "pending" ? pendingAssignments : activeAssignments;

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
        <h2 className="text-[20px] font-bold text-[#0f172a]">Daftar Tugas Driver</h2>
        <p className="text-[12.5px] text-[#64748b]">Kelola penugasan baru yang masuk dan pantau perjalanan yang sedang aktif.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-[#e2e8f0] pb-px">
        <button
          onClick={() => { setActiveTab("pending"); setSearch(""); }}
          className={`px-5 py-2.5 text-[13.5px] font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "pending"
              ? "border-[#1e3a8a] text-[#1e3a8a]"
              : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          <Icon name="assignment_late" className="text-lg" />
          <span>Tugas Baru ({pendingAssignments.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab("active"); setSearch(""); }}
          className={`px-5 py-2.5 text-[13.5px] font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "active"
              ? "border-[#1e3a8a] text-[#1e3a8a]"
              : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          <Icon name="commute" className="text-lg" />
          <span>Tugas Aktif ({activeAssignments.length})</span>
        </button>
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
          Menampilkan <span className="font-bold text-[#0f172a]">{filtered.length}</span> tugas
        </div>
      </div>

      {/* List Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <Icon name={activeTab === "pending" ? "assignment" : "commute"} className="text-[22px] text-[#94a3b8]" />
          </div>
          <p className="font-bold text-[#0f172a] text-[14px]">
            {activeTab === "pending" ? "Tidak ada tugas baru" : "Tidak ada tugas aktif"}
          </p>
          <p className="text-[12px] text-[#64748b] mt-1 max-w-xs">
            {activeTab === "pending"
              ? "Semua penugasan baru telah Anda proses."
              : "Belum ada perjalanan operasional yang sedang berjalan."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((req) => (
            <AssignmentCard
              key={req.id}
              req={req}
              isPending={activeTab === "pending"}
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
