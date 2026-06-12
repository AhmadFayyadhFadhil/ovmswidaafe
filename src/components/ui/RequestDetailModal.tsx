import { Icon } from "./Icon";
import { PriorityBadge } from "../layout/PriorityBadge";
import type { FleetRequest } from "../../types";

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FleetRequest | null;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
}

export function RequestDetailModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}: RequestDetailModalProps) {
  if (!isOpen || !request) return null;

  const getStatusStyle = (rawStatus: string | undefined) => {
    switch (rawStatus) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "on_going":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "driver_assigned":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "approved_hrd_ga":
      case "approved_hrd":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getApprovalRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      dept_head: "Kepala Departemen",
      hrd_head: "Kepala HRD",
      ga_head: "Kepala GA",
    };
    return labels[role] || role;
  };

  const getStageLabel = (rawStatus: string | undefined, mappedStatus: string) => {
    switch (rawStatus) {
      case "submitted":
        return "MENUNGGU DEPT HEAD";
      case "approved_department":
        return "MENUNGGU K.DEP HRD&GA";
      case "approved_hrd_ga":
      case "approved_hrd":
        return "MENUNGGU PENUGASAN DRIVER";
      case "waiting_driver":
        return "MENUNGGU KONFIRMASI DRIVER";
      case "driver_assigned":
        return "TERJADWAL";
      case "on_going":
        return "BERJALAN";
      case "completed":
        return "SELESAI";
      case "rejected":
        return "DITOLAK";
      default:
        return mappedStatus;
    }
  };

  const passengers = request.passengers || [];
  const approvals = request.approvals || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadein">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-bold text-slate-800">Detail Permintaan</span>
            <span className="text-[12px] font-extrabold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
              #REQ-{request.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side: Requester & Trip Details */}
            <div className="space-y-5">
              {/* Requester Profile */}
              <div>
                <h4 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-3">
                  Informasi Pemohon
                </h4>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-[16px]">
                    {request.employee[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-slate-800">{request.employee}</div>
                    <div className="text-[12px] text-slate-500">{request.email || "No Email"}</div>
                    <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      Departemen: {request.department}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip details */}
              <div>
                <h4 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
                  Detail Perjalanan
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tujuan</div>
                    <div className="text-[14px] font-semibold text-slate-800 flex items-start gap-1 mt-0.5">
                      <Icon name="location_on" className="text-[16px] text-blue-800 mt-0.5 flex-shrink-0" />
                      {request.destination}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Keperluan</div>
                    <div className="text-[13px] font-medium text-slate-700 mt-0.5 pl-5">
                      {request.purpose || "Tidak ada keperluan khusus"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jadwal Perjalanan</div>
                      <div className="text-[13px] font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Icon name="calendar_month" className="text-[15px] text-slate-500" />
                        {request.date} {request.time || "09:00"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kendaraan & Driver</div>
                      <div className="text-[13px] font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Icon name="directions_car" className="text-[15px] text-slate-500" />
                        {request.vehicleModel}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 pl-5">
                        Driver: {request.driverName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passengers */}
              <div>
                <h4 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
                  Daftar Penumpang ({passengers.length} Orang)
                </h4>
                {passengers.length === 0 ? (
                  <div className="text-[12px] text-slate-500 italic p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    Hanya pemohon sendiri.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {passengers.map((p: any, idx: number) => (
                      <div key={p.id || idx} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-[13px] transition-colors">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          {p.name}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          {p.department_id || request.department}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Status, Priority, Approval Progress */}
            <div className="space-y-5">
              {/* Status and Priority */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase">Prioritas</span>
                  <PriorityBadge priority={((request.priority === "HIGH" || request.priority === "URGENT") ? "URGENT" : "NORMAL") as any} size="sm" />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase">Status Sistem</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${getStatusStyle(request.rawStatus)}`}>
                    {getStageLabel(request.rawStatus, request.status)}
                  </span>
                </div>
              </div>

              {/* Approval Workflow timeline */}
              <div>
                <h4 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-3">
                  Alur Persetujuan (Workflow)
                </h4>
                {approvals.length === 0 ? (
                  <div className="text-[12px] text-slate-500 italic p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    Belum ada riwayat persetujuan.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 pl-4 ml-3 space-y-5">
                    {approvals.map((app: any, idx: number) => {
                      const isApproved = app.status === "approved";
                      return (
                        <div key={app.id || idx} className="relative">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                            isApproved ? "bg-green-500" : "bg-red-500"
                          }`} />

                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] font-extrabold text-slate-700">
                                {getApprovalRoleLabel(app.role)}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                                isApproved ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                              Oleh: {app.approver?.name || "System"} • {new Date(app.created_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            {app.notes && (
                              <div className="mt-1 text-[12px] text-slate-600 bg-white p-2 border border-slate-100 rounded-lg italic">
                                "{app.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
          {request.canApprove && onApprove && onReject ? (
            <>
              <button
                onClick={async () => {
                  await onReject(request.id);
                  onClose();
                }}
                className="h-10 px-4 text-[#dc2626] border border-[#dc2626] rounded-xl text-[13px] font-bold bg-white hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
              >
                Tolak Permintaan
              </button>
              <button
                onClick={async () => {
                  await onApprove(request.id);
                  onClose();
                }}
                className="h-10 px-5 bg-blue-800 text-white rounded-xl text-[13px] font-bold hover:bg-blue-900 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Icon name="check_circle" className="text-[16px]" />
                Setujui Permintaan
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="h-10 px-5 bg-slate-800 text-white rounded-xl text-[13px] font-bold hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
