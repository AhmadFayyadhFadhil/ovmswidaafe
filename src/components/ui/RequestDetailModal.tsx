import { useState } from "react";
import { Icon } from "./Icon";
import { PriorityBadge } from "../layout/PriorityBadge";
import type { FleetRequest } from "../../types";
import { useAuthContext } from "@/auth/authContext";
import { downloadItemPDF } from "@/utils/exportHelper";
import { requestService } from "@/services/modules/requestService";

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FleetRequest | any | null;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, notes: string) => Promise<void>;
}

export function RequestDetailModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}: RequestDetailModalProps) {
  const { user } = useAuthContext();
  const [isConfirmRejectOpen, setIsConfirmRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isConfirmCompleteOpen, setIsConfirmCompleteOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  if (!isOpen || !request) return null;

  const formatScanTime = (dtStr: string | null | undefined) => {
    if (!dtStr) return "";
    try {
      if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(dtStr)) return dtStr;
      const cleanStr = String(dtStr).replace('Z', '').replace('T', ' ');
      const [datePart, timePart] = cleanStr.split(' ');
      if (datePart && timePart) {
        const [y, m, d] = datePart.split('-');
        const [h, min] = timePart.split(':');
        if (y && m && d && h && min) {
          return `${d}-${m}-${y} ${h}:${min}`;
        }
      }
      return dtStr;
    } catch (e) {
      return dtStr;
    }
  };

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
      case "assigned_by_ga":
        return "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]";
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
      case "approved_department":
        return "MENUNGGU PENUGASAN GA";
      case "assigned_by_ga":
        return "MENUNGGU KONFIRMASI";
      case "waiting_driver":
        return "MENUNGGU KONFIRMASI DRIVER";
      case "driver_assigned":
        return "TERJADWAL / SIAP JALAN";
      case "on_going":
        return "SEDANG PERJALANAN";
      case "completed":
        return "SELESAI";
      case "rejected":
        return "DITOLAK";
      default:
        return mappedStatus;
    }
  };

  const handlePrint = () => {
    const esc = (s: any) => {
      if (s === undefined || s === null) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surat Tugas / Tiket Perjalanan #REQ-${esc(request.id)}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #334155; }
            .ticket { border: 2px dashed #94a3b8; padding: 25px; border-radius: 16px; max-width: 650px; margin: 0 auto; background: #fff; }
            .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: 800; margin: 0; color: #1e3a8a; letter-spacing: 0.5px; }
            .subtitle { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 4px; }
            .row { display: flex; margin-bottom: 10px; border-bottom: 1px solid #f8fafc; padding-bottom: 6px; }
            .label { font-weight: bold; width: 180px; text-transform: uppercase; font-size: 11px; color: #64748b; letter-spacing: 0.5px; }
            .value { font-size: 13px; color: #0f172a; font-weight: 600; }
            .qr { text-align: center; margin-top: 20px; border-top: 2px dashed #e2e8f0; padding-top: 16px; }
            .qr img { border: 1px solid #e2e8f0; padding: 6px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h2 class="title">SURAT TUGAS LAYANAN KENDARAAN (OVMS)</h2>
              <div class="subtitle">PT. WIDATRA BHAKTI</div>
            </div>
            <div class="row"><div class="label">ID Request</div><div class="value">#REQ-${esc(request.id)}</div></div>
            <div class="row"><div class="label">Nama Pemohon</div><div class="value">${esc(request.employee)} (${esc(request.department)})</div></div>
            <div class="row"><div class="label">Tujuan Perjalanan</div><div class="value">${esc(request.destination)}</div></div>
            <div class="row"><div class="label">Jadwal Keberangkatan</div><div class="value">${esc(request.date)} ${esc(request.time || "09:00")}</div></div>
            
            ${Array.isArray(request.itineraries) && request.itineraries.length > 0 ? `
              <div class="row"><div class="label">Tipe Request</div><div class="value" style="color: #1e3a8a; font-weight: bold;">MULTI-DAY ITINERARY (${request.itineraries.length} HARI)</div></div>
              <div style="margin-top: 15px; margin-bottom: 15px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                <div style="font-weight: bold; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Rincian Penugasan Daily Itinerary:</div>
                ${request.itineraries.map((it: any, idx: number) => `
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 12px;">
                    <div style="font-weight: bold; color: #1e3a8a;">Hari ${idx + 1} (${esc(it.date)}):</div>
                    <div style="margin-top: 4px;">Sesi 1: ${esc(it.morning_time || "-")} - ${esc(it.morning_destination || "-")}</div>
                    <div>Sesi 2: ${esc(it.afternoon_time || "-")} - ${esc(it.afternoon_destination || "-")}</div>
                    <div style="margin-top: 4px; font-weight: bold; color: #334155;">Armada: ${esc(it.is_external ? `Pihak Ke-3 (${it.external_driver_name || "Sewa"})` : (it.driver_name ? `${it.driver_name} (${it.vehicle_name || ""})` : "Belum Ditugaskan"))}</div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="row"><div class="label">Penyedia Armada</div><div class="value">${request.is_external ? "Pihak Ketiga (Sewa Eksternal)" : "Armada Internal"}</div></div>
              ${!request.is_external ? `
                <div class="row"><div class="label">Driver Internal</div><div class="value">${esc(request.driverName || "-")}</div></div>
                <div class="row"><div class="label">Kendaraan Internal</div><div class="value">${esc(request.vehicleModel || "-")}</div></div>
              ` : `
                <div class="row"><div class="label">Estimasi Biaya Sewa</div><div class="value">Rp ${Number(request.third_party_cost || 0).toLocaleString('id-ID')}</div></div>
              `}
            `}

            <div class="row"><div class="label">Tujuan / Keperluan</div><div class="value">${esc(request.purpose)}</div></div>
            <div class="row"><div class="label">Jumlah Penumpang</div><div class="value">${esc(request.passengerCount)} Orang</div></div>
            <div class="row"><div class="label">Estimasi Lama Perjalanan</div><div class="value">${esc(request.estimated_duration ? `${request.estimated_duration} Jam` : "-")}</div></div>
            <div class="qr">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${request.qr_code_token || `REQ-${request.id}`}`)}" />
              <p style="font-size: 10px; color: #94a3b8; margin-top: 6px; font-family: monospace; font-weight: bold;">${esc(request.qr_code_token || `REQ-${request.id}`)}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Print window error", e);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 3000);
      }
    }, 300);
  };

  const handleConfirmRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim() || !onReject) return;
    await onReject(request.id, rejectReason.trim());
    setIsConfirmRejectOpen(false);
    setRejectReason("");
    onClose();
  };

  const isExternalOneWay = !!(request.is_external && (request.external_trip_type === "one_way" || !request.is_return_to_factory));
  const isTripEnRoute = request.rawStatus === "on_going" || request.status === "on_going" || !!request.security_checked_out_at;
  const isEligibleToComplete = isExternalOneWay && isTripEnRoute;
  const canUserComplete = !!(
    user?.id === request.userId ||
    user?.id === request.user_id ||
    user?.id === request.requestedById ||
    user?.role === "GA" ||
    user?.role === "Administrator" ||
    user?.role === "Superadmin" ||
    user?.role === "HRD"
  );

  const handleConfirmCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompleting(true);
    try {
      await requestService.complete(request.id);
      alert("Perjalanan sewa eksternal (drop-off) berhasil diselesaikan!");
      setIsConfirmCompleteOpen(false);
      onClose();
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyelesaikan perjalanan.");
    } finally {
      setIsCompleting(false);
    }
  };

  const passengers = request.passengers || [];
  const approvals = request.approvals || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-fadein">
      <div className="bg-white w-full max-w-4xl lg:max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 relative my-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[16px] sm:text-[18px] font-extrabold text-slate-800">Detail Permintaan</span>
            <span className="text-[11px] sm:text-[12px] font-extrabold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
              #REQ-{request.id}
            </span>
            {Array.isArray(request.itineraries) && request.itineraries.length > 0 ? (
              <span className="text-[10px] sm:text-[11px] font-extrabold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Icon name="event_repeat" className="text-[14px]" /> MULTI-DAY ({request.itineraries.length} HARI)
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                Reguler (1 Hari)
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
            {/* Direct PDF Download Button */}
            <button
              onClick={() => {
                downloadItemPDF(`Surat_Tugas_REQ_${request.id}`, {
                  "Request ID": `REQ-${request.id}`,
                  "Nama Pemohon": `${request.employee || ''} (${request.department || ''})`,
                  "Tujuan Perjalanan": request.destination || '',
                  "Jadwal Keberangkatan": `${request.date || ''} ${request.time || '09:00'}`,
                  "Tipe Request": Array.isArray(request.itineraries) && request.itineraries.length > 0 ? `Multi-Day (${request.itineraries.length} Hari)` : (request.is_external ? "Sewa Pihak Ke-3" : "Armada Internal"),
                  "Driver / Pengemudi": request.is_external ? (request.external_driver_name || "Sewa Eksternal") : (request.driverName || "Internal"),
                  "Kendaraan / Armada": request.is_external ? (request.external_provider || "Eksternal") : (request.vehicleModel || "Internal"),
                  "Jumlah Penumpang": `${request.passengerCount || 1} Orang`,
                  "Keperluan Perjalanan": request.purpose || "-",
                  "Status Pengajuan": request.rawStatus || request.status || "APPROVED"
                });
              }}
              title="Download PDF Langsung (1-Touch)"
              className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors text-[11px] font-bold cursor-pointer shadow-2xs"
            >
              <Icon name="picture_as_pdf" className="text-[15px] text-red-600" />
              <span>Download PDF</span>
            </button>

            {/* Print Ticket Button */}
            {request.qr_code_token && (
              ["driver_assigned", "on_going", "completed"].includes(request.rawStatus) ||
              (request.is_external && request.rawStatus === "assigned_by_ga")
            ) && (
              <button
                onClick={handlePrint}
                title="Cetak Tiket / Surat Tugas"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Icon name="print" className="text-[19px]" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
            >
              <Icon name="close" className="text-[19px]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Review Banner for Approver */}
          {request.canApprove && onApprove && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3.5 text-blue-900 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Icon name="fact_check" className="text-[22px]" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[13.5px] text-[#0f2a5e]">Pengecekan Ulang Pengajuan Kendaraan</div>
                <div className="text-blue-700 font-medium mt-0.5 leading-relaxed">
                  Silakan periksa kembali rincian perjalanan, jadwal keberangkatan, dan daftar penumpang di bawah ini sebelum memberikan persetujuan resmi.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Requester & Trip Details (Span 2) */}
            <div className="md:col-span-2 space-y-5">
              {/* Rejection / Cancellation Alert Banner */}
              {(request.rawStatus === "rejected" || request.rawStatus === "cancelled" || request.rejected_reason || request.rejectedReason) && (() => {
                const isCancelled = request.rawStatus === "cancelled";
                let actorName = "";
                let reasonText = request.rejected_reason || request.rejectedReason || "";

                if (isCancelled) {
                  let rawActor = request.cancelled_by_name || request.cancelledByName || request.cancelled_by?.name || "";
                  const rejApproval = request.approvals?.find((a: any) => a.status === "rejected" || a.status === "cancelled");
                  
                  if (rejApproval && rejApproval.approver?.name) {
                    actorName = `${rejApproval.approver.name} (${getApprovalRoleLabel(rejApproval.role)})`;
                    if (!reasonText && rejApproval.notes) reasonText = rejApproval.notes;
                  } else if (rawActor) {
                    const reqName = request.employee || request.requested_by?.name || "";
                    if (reqName && rawActor.toLowerCase().trim() === reqName.toLowerCase().trim()) {
                      actorName = `${rawActor} (Pemohon)`;
                    } else {
                      actorName = rawActor;
                    }
                  } else {
                    actorName = request.employee || request.requested_by?.name || "Pemohon";
                  }
                } else {
                  let rawActor = request.cancelled_by_name || request.cancelledByName || request.cancelled_by?.name || "";
                  const rejApproval = request.approvals?.find((a: any) => a.status === "rejected" || a.status === "cancelled");
                  const rejAssignment = request.assignments?.find((a: any) => a.status === "rejected");

                  if (rejApproval && rejApproval.approver?.name) {
                    actorName = `${rejApproval.approver.name} (${getApprovalRoleLabel(rejApproval.role)})`;
                    if (!reasonText && rejApproval.notes) reasonText = rejApproval.notes;
                  } else if (rejAssignment && rejAssignment.driver_name) {
                    actorName = `${rejAssignment.driver_name} (Driver)`;
                    if (!reasonText && rejAssignment.reject_reason) reasonText = rejAssignment.reject_reason;
                  } else if (rawActor) {
                    actorName = rawActor;
                  } else {
                    actorName = "Kepala Departemen / GA";
                  }
                }

                if (!reasonText) {
                  reasonText = request.notes || "Tidak ada catatan alasan tertulis.";
                }

                return (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl mb-2 shadow-xs">
                    <div className="flex items-center gap-2 text-red-800 font-bold text-[14px] mb-1.5">
                      <Icon name="cancel" className="text-[20px] text-red-600" />
                      <span>{isCancelled ? "Permintaan Dibatalkan" : "Permintaan Ditolak"}</span>
                    </div>
                    <div className="text-[12.5px] text-red-800 font-medium leading-relaxed pl-7 space-y-0.5">
                      <div>
                        <span className="font-bold">Di{isCancelled ? "batalkan" : "tolak"} Oleh: </span>
                        <span className="font-semibold text-red-950">{actorName}</span>
                      </div>
                      <div>
                        <span className="font-bold">Alasan: </span>
                        <span className="italic font-semibold text-red-900">"{reasonText}"</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Requester Profile */}
              <div>
                <h4 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
                  Informasi Pemohon
                </h4>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-[16px]">
                    {request.employee ? request.employee[0].toUpperCase() : "E"}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-slate-800">{request.employee}</div>
                    <div className="text-[12px] text-slate-500">{request.email || "No Email"}</div>
                    <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      Departemen: {request.department}
                    </div>
                    {(() => {
                      const reqPhone = request.userPhone || request.requested_by?.phone || request.user_phone || request.phone || '';
                      const cleanReqPhone = reqPhone ? String(reqPhone).replace(/[^0-9]/g, '') : '';
                      return (
                        <a
                          href={cleanReqPhone ? `https://wa.me/${cleanReqPhone}` : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all mt-1.5 cursor-pointer ${
                            cleanReqPhone
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          }`}
                          onClick={(e) => { if (!cleanReqPhone) e.preventDefault(); }}
                        >
                          <Icon name="chat" className="text-xs" />
                          <span>Hubungi WA Pemohon {cleanReqPhone ? `(${reqPhone})` : '(No HP tidak ada)'}</span>
                        </a>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Trip details */}
              <div>
                <h4 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
                  Detail Perjalanan
                </h4>
                <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tujuan</div>
                    <div className="text-[14px] font-semibold text-slate-800 flex items-start gap-1 mt-0.5">
                      <Icon name="location_on" className="text-[16px] text-blue-800 mt-0.5 flex-shrink-0" />
                      {request.destination}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jadwal Perjalanan</div>
                      <div className="text-[13px] font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Icon name="calendar_month" className="text-[15px] text-slate-500" />
                        {request.date} {request.time || "09:00"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Penyedia Fleet / Tipe</div>
                      <div className="text-[13px] font-semibold text-slate-800 mt-0.5">
                        {Array.isArray(request.itineraries) && request.itineraries.length > 0 
                          ? `Multi-Day Itinerary (${request.itineraries.length} Hari)`
                          : (request.is_external ? "Pihak Ketiga (Sewa)" : "Armada Internal")
                        }
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Keperluan</div>
                      <div className="text-[13px] font-semibold text-slate-700 mt-0.5">
                        {request.purpose || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {user?.role === "driver" ? "Catatan Penugasan (GA Notes)" : "Catatan Tambahan (Notes)"}
                      </div>
                      <div className="text-[13px] font-semibold text-slate-700 mt-0.5">
                        {(() => {
                          if (user?.role === "driver" && request.assignments) {
                            const myAsg = request.assignments.find((a: any) => String(a.driver_id) === String(user.id));
                            if (myAsg) return myAsg.notes || "-";
                          }
                          return request.notes || "-";
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100/50 mt-2">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dokumen Terlampir</div>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      {(() => {
                        const stored = localStorage.getItem(`request_attachments_${request.id}`);
                        const files = stored ? JSON.parse(stored) : [];
                        if (files.length === 0) {
                          return (
                            <span className="text-[11.5px] text-slate-400 italic">Tidak ada dokumen dilampirkan.</span>
                          );
                        }
                        return files.map((f: any, fi: number) => (
                          <div 
                            key={fi} 
                            onClick={() => setPreviewFile(f)}
                            className="flex items-center gap-1.5 text-[11px] text-[#00236f] bg-[#e5eeff] px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] cursor-pointer hover:bg-[#d4e4ff] transition-colors"
                            title="Klik untuk pratinjau dokumen"
                          >
                            <Icon name="attach_file" className="text-[13px] text-[#00236f]" />
                            <span className="font-semibold">{f.name}</span>
                            <span className="text-[9px] text-[#64748b]">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                        ));
                      })()}

                      {request.itinerary_file_url && (
                        <a
                          href={request.itinerary_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-bold"
                        >
                          <Icon name="assignment" className="text-[14px]" />
                          <span>Lihat Form Physical Itinerary</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Overtime Badge if present */}
                  {request.is_overtime && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900 text-[12px]">
                      <div className="flex items-center gap-2 font-bold">
                        <Icon name="more_time" className="text-amber-600 text-lg" />
                        <span>Perjalanan Ini Memiliki Jam Lembur (Terhitung Setelah 16:30 WIB)</span>
                      </div>
                      <span className="bg-amber-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase">
                        {request.overtime_formatted}
                      </span>
                    </div>
                  )}

                  {/* Multi-Day Itinerary List Breakdown */}
                  {Array.isArray(request.itineraries) && request.itineraries.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-blue-900 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <Icon name="calendar_month" className="text-base text-blue-600" /> Rincian Itinerary Multi-Hari ({request.itineraries.length} Hari)
                        </div>
                      </div>
                      <div className="space-y-2">
                        {request.itineraries.map((it: any, idx: number) => {
                          const isOverallCompleted = request.rawStatus === 'completed' || request.status === 'completed';
                          const mStatus = isOverallCompleted ? 'completed' : (it.morning_status || (it.status === 'completed' ? 'completed' : 'scheduled'));
                          const aStatus = isOverallCompleted ? 'completed' : (it.afternoon_status || (it.status === 'completed' ? 'completed' : 'scheduled'));

                          return (
                          <div key={it.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[12px]">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                              <span className="font-extrabold text-[#00236f] flex items-center gap-1">
                                📅 Hari ke-{idx + 1}: {it.date ? new Date(it.date).toLocaleDateString("id-ID", { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }) : `Hari ${idx+1}`}
                              </span>
                              {it.is_overtime && (
                                <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                  <Icon name="schedule" className="text-[11px]" /> Lembur {it.overtime_formatted}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* Schedule 1 */}
                              <div className="p-2 bg-white rounded-lg border border-slate-100 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-[10px] text-slate-400 font-bold uppercase">Jadwal / Sesi 1 (Pagi)</div>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                    mStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                    mStatus === 'on_going' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {mStatus === 'completed' ? 'Completed' : mStatus === 'on_going' ? 'On Going' : 'Scheduled'}
                                  </span>
                                </div>
                                <div className="font-semibold text-slate-700">{it.morning_time || "N.A"} - {it.morning_destination || "N.A"}</div>
                              </div>
                              {/* Schedule 2 */}
                              <div className="p-2 bg-white rounded-lg border border-slate-100 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-[10px] text-slate-400 font-bold uppercase">Jadwal / Sesi 2 (Sore)</div>
                                  {it.afternoon_destination ? (
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                      aStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                      aStatus === 'on_going' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                      'bg-slate-100 text-slate-500'
                                    }`}>
                                      {aStatus === 'completed' ? 'Completed' : aStatus === 'on_going' ? 'On Going' : 'Scheduled'}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic">N/A</span>
                                  )}
                                </div>
                                <div className="font-semibold text-slate-700">{it.afternoon_time || "N.A"} - {it.afternoon_destination || "-"}</div>
                              </div>
                            </div>

                            <div className="pt-2 text-[11.5px] border-t border-slate-100 flex justify-between items-center text-slate-600">
                              <div>
                                <span className="font-bold text-slate-500 uppercase text-[10px]">Armada: </span>
                                {it.is_external ? (
                                  <span className="font-bold text-purple-700">Pihak Ke-3 ({it.external_driver_name || "Sewa"}{it.external_license_plate ? ` - ${it.external_license_plate}` : ""})</span>
                                ) : it.driver_name ? (
                                  <span className="font-bold text-blue-900">
                                    {it.driver_name} {it.vehicle_name && it.vehicle_name.replace(/\s*\(\s*\)/g, '').trim() ? `• ${it.vehicle_name.replace(/\s*\(\s*\)/g, '').trim()}` : ""}
                                  </span>
                                ) : (
                                  <span className="italic text-slate-400">Belum Ditugaskan GA</span>
                                )}
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(!Array.isArray(request.itineraries) || request.itineraries.length === 0) && (
                    <div className="grid grid-cols-1 gap-4 pt-1 border-t border-slate-100 pt-3">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Kendaraan & Driver</div>
                        {request.is_external ? (
                          <div className="space-y-3">
                            <div className="text-[12px] font-bold text-slate-700">
                              Penyedia Pihak Ketiga (Sewa) - {request.external_provider || "Provider Tidak Diketahui"}
                            </div>
                            
                            {request.external_trip_type === "round_trip" ? (
                              /* PP: Round Trip vehicles list */
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                                {/* Mobil 1 */}
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                                  <div className="font-extrabold text-blue-900">Mobil 1 (Cost: Rp {Number(request.third_party_cost || 0).toLocaleString('id-ID')})</div>
                                  <div className="font-semibold text-slate-600 space-y-0.5 pl-1.5">
                                    {request.external_driver_name && <div>Driver: {request.external_driver_name}</div>}
                                    {request.external_license_plate && <div>Plat: {request.external_license_plate}</div>}
                                    {request.external_fleet_info && <div className="text-slate-500 font-medium">Detail: {request.external_fleet_info}</div>}
                                  </div>
                                  {request.external_photo_url && (
                                    <a href={request.external_photo_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-700 hover:underline font-bold inline-flex items-center gap-1 pl-1.5 mt-1">
                                      <Icon name="image" className="text-sm" /> Lihat Foto
                                    </a>
                                  )}
                                </div>
                                
                                {/* Mobil 2 if passengerCount > 6 */}
                                {request.passengerCount > 6 && (
                                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                                    <div className="font-extrabold text-blue-900">Mobil 2 (Cost: Rp {Number(request.third_party_cost_2 || 0).toLocaleString('id-ID')})</div>
                                    <div className="font-semibold text-slate-600 space-y-0.5 pl-1.5">
                                      {request.external_driver_name_2 && <div>Driver: {request.external_driver_name_2}</div>}
                                      {request.external_license_plate_2 && <div>Plat: {request.external_license_plate_2}</div>}
                                      {request.external_fleet_info_2 && <div className="text-slate-500 font-medium">Detail: {request.external_fleet_info_2}</div>}
                                      {!request.external_driver_name_2 && !request.external_license_plate_2 && !request.external_fleet_info_2 && <div className="text-slate-400 italic">Belum ditugaskan.</div>}
                                    </div>
                                    {request.external_photo_url_2 && (
                                      <a href={request.external_photo_url_2} target="_blank" rel="noreferrer" className="text-[11px] text-blue-700 hover:underline font-bold inline-flex items-center gap-1 pl-1.5 mt-1">
                                        <Icon name="image" className="text-sm" /> Lihat Foto
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Sekali Jalan: Departure & Return fleets */
                              <div className="space-y-3">
                                {/* Keberangkatan */}
                                <div className="p-3 bg-white border border-blue-100 rounded-xl space-y-2">
                                  <div className="font-extrabold text-blue-900 text-[12px] border-b border-blue-50 pb-1 flex items-center gap-1">
                                    <span>🚙</span> Keberangkatan
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                                    <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg space-y-1">
                                      <div className="font-extrabold text-blue-900 text-[11px]">Mobil 1 (Cost: Rp {Number(request.external_departure_cost || 0).toLocaleString('id-ID')})</div>
                                      <div className="font-semibold text-slate-600 space-y-0.5 pl-1">
                                        {request.external_driver_name && <div>Driver: {request.external_driver_name}</div>}
                                        {request.external_license_plate && <div>Plat: {request.external_license_plate}</div>}
                                        {request.external_fleet_info && <div className="text-slate-500 font-medium">Detail: {request.external_fleet_info}</div>}
                                      </div>
                                      {request.external_photo_url && (
                                        <a href={request.external_photo_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline font-bold inline-flex items-center gap-1 mt-0.5">
                                          <Icon name="image" className="text-xs" /> Lihat Foto
                                        </a>
                                      )}
                                    </div>
                                    
                                    {request.passengerCount > 6 && (
                                      <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg space-y-1">
                                        <div className="font-extrabold text-blue-900 text-[11px]">Mobil 2 (Cost: Rp {Number(request.external_departure_cost_2 || 0).toLocaleString('id-ID')})</div>
                                        <div className="font-semibold text-slate-600 space-y-0.5 pl-1">
                                          {request.external_driver_name_2 && <div>Driver: {request.external_driver_name_2}</div>}
                                          {request.external_license_plate_2 && <div>Plat: {request.external_license_plate_2}</div>}
                                          {request.external_fleet_info_2 && <div className="text-slate-500 font-medium">Detail: {request.external_fleet_info_2}</div>}
                                          {!request.external_driver_name_2 && !request.external_license_plate_2 && !request.external_fleet_info_2 && <div className="text-slate-400 italic">Belum ditugaskan.</div>}
                                        </div>
                                        {request.external_photo_url_2 && (
                                          <a href={request.external_photo_url_2} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline font-bold inline-flex items-center gap-1 mt-0.5">
                                            <Icon name="image" className="text-xs" /> Lihat Foto
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Penjemputan / Pulang */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                  <div className="font-extrabold text-slate-700 text-[12px] border-b border-slate-200 pb-1 flex items-center gap-1">
                                    <span>🔄</span> Penjemputan / Pulang
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                                    <div className="p-2.5 bg-white border border-slate-100 rounded-lg space-y-1">
                                      <div className="font-extrabold text-slate-700 text-[11px]">Mobil 1 (Cost: Rp {Number(request.external_return_cost || 0).toLocaleString('id-ID')})</div>
                                      <div className="font-semibold text-slate-600 space-y-0.5 pl-1">
                                        {request.external_return_driver_name && <div>Driver: {request.external_return_driver_name}</div>}
                                        {request.external_return_license_plate && <div>Plat: {request.external_return_license_plate}</div>}
                                        {request.external_return_fleet_info && <div className="text-slate-500 font-medium">Detail: {request.external_return_fleet_info}</div>}
                                        {!request.external_return_driver_name && !request.external_return_license_plate && !request.external_return_fleet_info && <div className="text-slate-400 italic">Belum ditugaskan.</div>}
                                      </div>
                                      {request.external_return_photo_url && (
                                        <a href={request.external_return_photo_url} target="_blank" rel="noreferrer" className="text-[10px] text-slate-600 hover:underline font-bold inline-flex items-center gap-1 mt-0.5">
                                          <Icon name="image" className="text-xs" /> Lihat Foto
                                        </a>
                                      )}
                                    </div>
                                    
                                    {request.passengerCount > 6 && (
                                      <div className="p-2.5 bg-white border border-slate-100 rounded-lg space-y-1">
                                        <div className="font-extrabold text-slate-700 text-[11px]">Mobil 2 (Cost: Rp {Number(request.external_return_cost_2 || 0).toLocaleString('id-ID')})</div>
                                        <div className="font-semibold text-slate-600 space-y-0.5 pl-1">
                                          {request.external_return_driver_name_2 && <div>Driver: {request.external_return_driver_name_2}</div>}
                                          {request.external_return_license_plate_2 && <div>Plat: {request.external_return_license_plate_2}</div>}
                                          {request.external_return_fleet_info_2 && <div className="text-slate-500 font-medium">Detail: {request.external_return_fleet_info_2}</div>}
                                          {!request.external_return_driver_name_2 && !request.external_return_license_plate_2 && !request.external_return_fleet_info_2 && <div className="text-slate-400 italic">Belum ditugaskan.</div>}
                                        </div>
                                        {request.external_return_photo_url_2 && (
                                          <a href={request.external_return_photo_url_2} target="_blank" rel="noreferrer" className="text-[10px] text-slate-600 hover:underline font-bold inline-flex items-center gap-1 mt-0.5">
                                            <Icon name="image" className="text-xs" /> Lihat Foto
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="text-[11px] font-extrabold text-blue-900 border-t border-slate-100 pt-2 flex justify-between">
                              <span>Total Biaya Sewa:</span>
                              <span>Rp {(Number(request.third_party_cost || 0) + Number(request.third_party_cost_2 || 0)).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 mt-1">
                            {(() => {
                              const rawDriverName = request.driverName || "Belum Ditugaskan";
                              const driverNames = rawDriverName.includes(',') ? rawDriverName.split(',').map((s: string) => s.trim()) : [rawDriverName];
                              
                              const rawVehicleModel = request.vehicleModel || "Armada Belum Dipilih";
                              const vehicleModels = rawVehicleModel.includes(',') ? rawVehicleModel.split(',').map((s: string) => s.trim()) : [rawVehicleModel];

                              return driverNames.map((dName: string, dIdx: number) => {
                                const isAssigned = dName !== "Not Assigned" && dName !== "Belum Ditugaskan" && dName.trim() !== "";
                                const displayName = isAssigned ? dName : "Belum Ditugaskan";
                                const dInitials = isAssigned ? dName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : "GA";
                                const currentVehicle = (vehicleModels[dIdx] || vehicleModels[0] || (isAssigned ? "Armada Terdaftar" : "Belum Dipilih")).replace(/\s*\(\s*\)/g, '').trim();

                                return (
                                  <div key={dIdx} className="p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl space-y-2.5 shadow-2xs">
                                    {/* Top Header: Avatar + Driver Name on Left, Status Badge on Right */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-xs border ${
                                          isAssigned ? "bg-[#1e3a8a] text-white border-blue-900" : "bg-slate-200 text-slate-600 border-slate-300"
                                        }`}>
                                          {dInitials}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-[13.5px] font-extrabold text-slate-800 leading-tight">
                                            {displayName}
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            {isAssigned ? "Driver Terdaftar" : "Menunggu Alokasi GA"}
                                          </div>
                                        </div>
                                      </div>

                                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full self-start sm:self-center shrink-0 ${
                                        isAssigned 
                                          ? "bg-blue-100 text-blue-900 border border-blue-200" 
                                          : "bg-amber-100 text-amber-900 border border-amber-200"
                                      }`}>
                                        {isAssigned ? "Driver Internal" : "Menunggu Penugasan"}
                                      </span>
                                    </div>

                                    {/* Vehicle Info Row */}
                                    <div className="flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-xs">
                                      <span className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shrink-0 text-sm">
                                        🚘
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Armada / Kendaraan</div>
                                        <div className="text-[12.5px] font-extrabold text-slate-800 leading-snug break-words">
                                          {currentVehicle}
                                        </div>
                                      </div>
                                    </div>

                                    {/* WhatsApp Button Row */}
                                    {request.driverPhone && isAssigned && (
                                      <a
                                        href={`https://wa.me/${request.driverPhone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/90 rounded-xl text-[11.5px] font-extrabold transition-all shadow-2xs cursor-pointer active:scale-98"
                                        title="Hubungi WhatsApp Driver"
                                      >
                                        <Icon name="chat" className="text-sm text-emerald-600" />
                                        <span>Hubungi WA ({request.driverPhone})</span>
                                      </a>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimasi Kembali (Durasi)</div>
                        <div className="text-[13px] font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                          <Icon name="timer" className="text-[15px] text-slate-500" />
                          {request.estimated_duration ? `${request.estimated_duration} Jam` : "-"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating & Review Driver section if rated */}
              {request.rating && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Evaluasi & Rating Driver</span>
                    {request.ratedAt && (
                      <span className="text-[10px] text-amber-600 font-semibold">{new Date(request.ratedAt).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-extrabold text-base">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= request.rating ? "text-amber-500" : "text-slate-300"}>★</span>
                    ))}
                    <span className="text-amber-900 text-xs font-bold ml-1.5">{request.rating} / 5.0</span>
                  </div>
                  {request.ratingNotes && (
                    <p className="text-[12px] text-slate-700 italic font-medium pt-0.5">"{request.ratingNotes}"</p>
                  )}
                </div>
              )}

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
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {(() => {
                      const firstPicIndex = passengers.findIndex((px: any) => px.is_pic === true || px.is_pic === 1 || px.is_pic === '1');
                      const activePicIndex = firstPicIndex !== -1 ? firstPicIndex : 0;

                      return passengers.map((p: any, idx: number) => {
                        const isPicPassenger = idx === activePicIndex;
                        const rawPhone = p.phone || (isPicPassenger ? (request.userPhone || request.requested_by?.phone || request.user_phone || request.phone || '') : null);
                        const cleanPhone = rawPhone ? String(rawPhone).replace(/[^0-9]/g, '') : '';

                        return (
                          <div key={p.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-[13px] transition-all">
                            <div className="font-semibold text-slate-700 flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 border border-blue-200">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-900 text-[13.5px]">{p.name}</span>
                                {isPicPassenger && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                                    👑 PIC Penumpang
                                  </span>
                                )}
                              </div>
                              {(isPicPassenger || cleanPhone) && (
                                <a
                                  href={cleanPhone ? `https://wa.me/${cleanPhone}` : '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 shadow-2xs cursor-pointer ${
                                    cleanPhone
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                  }`}
                                  onClick={(e) => { if (!cleanPhone) e.preventDefault(); }}
                                  title={`Hubungi WhatsApp ${p.name}`}
                                >
                                  <Icon name="chat" className="text-xs" />
                                  <span>Hubungi WA {isPicPassenger ? 'PIC' : ''} {cleanPhone ? `(${rawPhone})` : ''}</span>
                                </a>
                              )}
                            </div>
                            <span className="text-[10.5px] font-extrabold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 uppercase self-start sm:self-center shrink-0">
                              {p.department_name || p.department_id || request.department}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Status, Priority, QR Ticket & Security logs */}
            <div className="space-y-5">
              {/* Status and Priority */}
              <div className="flex flex-col gap-3.5 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Prioritas</span>
                  <PriorityBadge priority={((request.priority === "HIGH" || request.priority === "URGENT" || request.priority === "Urgent") ? "URGENT" : (request.priority === "CRITICAL" || request.priority === "Critical" ? "CRITICAL" : "NORMAL")) as any} size="sm" />
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Status</span>
                  <span className={`inline-flex px-2.5 py-1.5 rounded-lg text-[10.5px] font-extrabold border leading-none ${getStatusStyle(request.rawStatus)}`}>
                    {getStageLabel(request.rawStatus, request.status)}
                  </span>
                </div>
              </div>
               {request.qr_code_token && (
                ["driver_assigned", "on_going"].includes(request.rawStatus) ||
                (request.is_external && request.rawStatus === "assigned_by_ga")
              ) && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">QR Code Tiket</div>
                  <div 
                    onClick={() => setIsQrZoomed(true)}
                    className="bg-slate-50 p-2 rounded-lg border border-slate-100 cursor-zoom-in hover:scale-105 hover:bg-slate-100 transition-all group relative"
                    title="Klik untuk memperbesar"
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${request.qr_code_token}`)}`}
                      alt="Ticket QR Code"
                      className="w-28 h-28 object-contain"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Icon name="zoom_in" className="text-slate-700 text-lg drop-shadow-sm bg-white/80 p-1.5 rounded-full" />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-400 mt-2">
                    {request.qr_code_token}
                  </span>
                </div>
              )}

              {/* Security Logs checkin/out if checked */}
              {(() => {
                const isMultiDay = Array.isArray(request.itineraries) && request.itineraries.length > 0;
                
                if (isMultiDay) {
                  return (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Icon name="verified" className="text-sm text-emerald-600" />
                        Log Keamanan Security ({request.itineraries.length} Hari)
                      </div>
                      
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {request.itineraries.map((it: any, idx: number) => {
                          const dateFormatted = it.date ? new Date(it.date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                          const dayLabel = `Hari ke-${idx + 1}${dateFormatted ? ` (${dateFormatted})` : ''}`;
                          
                          const isDone = it.status === 'completed' || (it.morning_status === 'completed' && (!it.afternoon_destination || it.afternoon_status === 'completed'));
                          const isOngoing = it.morning_status === 'on_going' || it.afternoon_status === 'on_going';
                          
                          const logs: any[] = [];
                          if (it.morning_checked_out_at) {
                            logs.push({
                              type: 'checkout',
                              title: 'Scan Berangkat Sesi 1 (Pagi)',
                              time: it.morning_checked_out_at,
                              by: it.morning_checkout_by || request.security_checkout_by,
                              notes: it.morning_checkout_notes || request.security_checkout_notes,
                            });
                          }
                          if (it.morning_checked_in_at || it.morning_status === 'completed') {
                            logs.push({
                              type: 'checkin',
                              title: 'Scan Kembali Sesi 1 (Pagi)',
                              time: it.morning_checked_in_at || it.updated_at,
                              by: it.morning_checkin_by || request.security_checkin_by || `${request.employee || 'Pemohon'} (Pemohon / Requestor)`,
                              notes: it.morning_checkin_notes || request.security_checkin_notes || 'Selesai Sesi 1',
                            });
                          }
                          if (it.afternoon_checked_out_at) {
                            logs.push({
                              type: 'checkout',
                              title: 'Scan Berangkat Sesi 2 (Sore)',
                              time: it.afternoon_checked_out_at,
                              by: it.afternoon_checkout_by || request.security_checkout_by,
                              notes: it.afternoon_checkout_notes || request.security_checkout_notes,
                            });
                          }
                          if (it.afternoon_checked_in_at || it.afternoon_status === 'completed') {
                            logs.push({
                              type: 'checkin',
                              title: 'Scan Kembali Sesi 2 (Sore)',
                              time: it.afternoon_checked_in_at || it.updated_at,
                              by: it.afternoon_checkin_by || request.security_checkin_by || `${request.employee || 'Pemohon'} (Pemohon / Requestor)`,
                              notes: it.afternoon_checkin_notes || request.security_checkin_notes || 'Selesai Sesi 2',
                            });
                          }

                          return (
                            <div key={it.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="font-extrabold text-[#00236f] text-[12px]">{dayLabel}</span>
                                <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase ${
                                  isDone ? 'bg-emerald-100 text-emerald-800' :
                                  isOngoing ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {isDone ? '✓ Completed' : isOngoing ? '⚡ On Going' : 'Scheduled'}
                                </span>
                              </div>
                              
                              <div className="space-y-1.5">
                                {logs.length > 0 ? (
                                  logs.map((log: any, li: number) => (
                                    <div key={li} className="p-2 bg-slate-50/80 border border-slate-100 rounded-lg space-y-0.5">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className={`font-bold text-[11.5px] flex items-center gap-1 ${log.type === 'checkout' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                          <span>{log.type === 'checkout' ? '🛫' : '🛬'}</span>
                                          {log.title}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-bold font-mono whitespace-nowrap shrink-0">
                                          {formatScanTime(log.time)}
                                        </span>
                                      </div>
                                      {log.by && (
                                        <div className="text-[10.5px] text-slate-600 font-medium pl-4">
                                          Petugas: <span className="font-bold text-slate-700">{log.by}</span>
                                        </div>
                                      )}
                                      {log.notes && (
                                        <div className="text-[10px] text-slate-500 italic pl-4">"{log.notes}"</div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="py-2 text-center text-[10.5px] text-slate-400 italic">
                                    Belum ada aktivitas scan security
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const isCompleted = request.rawStatus === 'completed' || request.status === 'completed';
                const checkinTime = request.security_checked_in_at || (isCompleted ? (request.completed_at || request.updated_at) : null);
                const checkinBy = request.security_checkin_by || (isCompleted ? `${request.employee || 'Pemohon'} (Pemohon / Requestor)` : null);
                const checkinNotes = request.security_checkin_notes || (isCompleted ? 'Diselesaikan secara mandiri oleh pemohon di lokasi tujuan (Sewa Eksternal / Drop-Off Only)' : null);

                if (!request.security_checked_out_at && !checkinTime) return null;

                const isSelfCompleted = String(checkinBy || '').includes('Pemohon') || String(checkinBy || '').includes('Requestor') || String(checkinBy || '').includes('GA') || String(checkinBy || '').includes('Admin');

                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Icon name="verified" className="text-sm text-emerald-600" />
                      Log Keamanan Security
                    </div>
                    <div className="text-xs space-y-2">
                      {request.security_checked_out_at && (
                        <div className="bg-white p-2.5 border border-slate-100 rounded-xl shadow-2xs">
                          <div className="flex justify-between items-start gap-2">
                            <div className="font-extrabold text-amber-800 text-[12px] flex items-center gap-1">
                              <span>🛫</span> Scan Berangkat (Checkout)
                            </div>
                            <span className="text-[10.5px] text-slate-400 font-bold font-mono whitespace-nowrap flex-shrink-0">
                              {formatScanTime(request.security_checked_out_at)}
                            </span>
                          </div>
                          <div className="text-slate-600 font-semibold text-[11.5px] mt-1">Petugas: <span className="font-bold text-slate-800">{request.security_checkout_by || "Security Pos Gerbang"}</span></div>
                          {request.security_checkout_notes && (
                            <div className="mt-1 text-[11px] text-slate-500 italic bg-amber-50/50 p-1.5 rounded-lg border border-amber-100/60">" {request.security_checkout_notes} "</div>
                          )}
                        </div>
                      )}

                      {checkinTime && (
                        <div className={`p-2.5 border rounded-xl shadow-2xs ${
                          isSelfCompleted ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-100'
                        }`}>
                          <div className="flex justify-between items-start gap-2">
                            <div className={`font-extrabold text-[12px] flex items-center gap-1 ${
                              isSelfCompleted ? 'text-emerald-900' : 'text-emerald-700'
                            }`}>
                              <span>{isSelfCompleted ? '🏁' : '🛬'}</span>
                              <span>{isSelfCompleted ? 'Penyelesaian Perjalanan (Checkin / Drop-Off)' : 'Scan Kembali (Checkin)'}</span>
                            </div>
                            <span className="text-[10.5px] text-slate-400 font-bold font-mono whitespace-nowrap flex-shrink-0">
                              {formatScanTime(checkinTime)}
                            </span>
                          </div>
                          <div className="text-slate-700 font-semibold text-[11.5px] mt-1">
                            Petugas / Oleh: <span className="font-extrabold text-slate-900">{checkinBy}</span>
                          </div>
                          {checkinNotes && (
                            <div className="mt-1 text-[11px] text-emerald-800 italic bg-white/80 p-2 rounded-lg border border-emerald-200/60 font-medium">
                              " {checkinNotes} "
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Approval Workflow timeline */}
              <div>
                <h4 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-3">
                  Workflow Persetujuan
                </h4>
                {approvals.length === 0 ? (
                  <div className="text-[12px] text-slate-500 italic p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    Belum ada riwayat approval.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 pl-4 ml-3 space-y-4">
                    {approvals.map((app: any, idx: number) => {
                      const isApproved = app.status === "approved";
                      return (
                        <div key={app.id || idx} className="relative">
                          <div className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                            isApproved ? "bg-green-500" : "bg-red-500"
                          }`} />

                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11.5px] font-bold text-slate-700">
                                {getApprovalRoleLabel(app.role)}
                              </span>
                              <span className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded ${
                                isApproved ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Oleh: {app.approver?.name || "System"}
                            </div>
                            {app.notes && (
                              <div className="mt-1 text-[11px] text-slate-600 bg-white p-1.5 border border-slate-100 rounded italic">
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

        {/* Confirm Reject Overlay dialog */}
        {isConfirmRejectOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-20 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl animate-fadein space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <Icon name="warning" className="text-2xl" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Tolak Permintaan Kendaraan?</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Harap masukkan alasan penolakan secara jelas. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <form onSubmit={handleConfirmRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Alasan Penolakan (Wajib)</label>
                  <textarea
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Jadwal bertabrakan dengan maintenance armada..."
                    rows={3}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmRejectOpen(false);
                      setRejectReason("");
                    }}
                    className="flex-1 py-2 text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"
                  >
                    Tolak Permintaan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Complete Overlay dialog */}
        {isConfirmCompleteOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-20 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl animate-fadein space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Icon name="check_circle" className="text-2xl" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Selesaikan Perjalanan External?</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Perjalanan sewa eksternal ini tidak kembali ke pabrik (*Drop-off Only*). Menandai selesai akan memperbarui status permintaan menjadi <b>COMPLETED</b>.
                </p>
              </div>

              <form onSubmit={handleConfirmCompleteSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan Penyelesaian (Opsional)</label>
                  <textarea
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Contoh: Penumpang telah diantar sampai Bandara Juanda jam 14:00..."
                    rows={3}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsConfirmCompleteOpen(false)}
                    className="flex-1 py-2 text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCompleting}
                    className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Icon name={isCompleting ? "sync" : "check"} className={`text-sm ${isCompleting ? "animate-spin" : ""}`} />
                    <span>{isCompleting ? "Memproses..." : "Selesaikan"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          {isEligibleToComplete && canUserComplete && (
            <button
              type="button"
              disabled={isCompleting}
              onClick={() => setIsConfirmCompleteOpen(true)}
              className="w-full sm:w-auto h-10 px-5 bg-emerald-600 text-white rounded-xl text-[13px] font-bold hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              <Icon name="check_circle" className="text-[17px]" />
              <span>Selesaikan Perjalanan (Drop-Off)</span>
            </button>
          )}

          {request.canApprove && onApprove && onReject ? (
            <>
              <button
                type="button"
                disabled={isApproving}
                onClick={onClose}
                className="w-full sm:w-auto h-10 px-4 border border-[#e2e8f0] text-[#475569] rounded-xl text-[13px] font-bold bg-white hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isApproving}
                onClick={() => setIsConfirmRejectOpen(true)}
                className="w-full sm:w-auto h-10 px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[13px] font-bold hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Icon name="close" className="text-[16px]" />
                Tolak Permintaan
              </button>
              <button
                type="button"
                disabled={isApproving}
                onClick={async () => {
                  setIsApproving(true);
                  try {
                    await onApprove(request.id);
                    onClose();
                  } finally {
                    setIsApproving(false);
                  }
                }}
                className="w-full sm:w-auto h-10 px-6 bg-[#1e3a8a] text-white rounded-xl text-[13px] font-bold hover:bg-[#1e40af] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                <Icon name={isApproving ? "sync" : "check_circle"} className={`text-[16px] ${isApproving ? "animate-spin" : ""}`} />
                {isApproving ? "Menyetujui..." : "Setujui Permintaan"}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full sm:w-auto h-10 px-5 bg-slate-800 text-white rounded-xl text-[13px] font-bold hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {previewFile && (
        <div 
          className="fixed inset-0 bg-black/80 z-[99999] flex flex-col items-center justify-center p-4 cursor-pointer animate-fadein"
          onClick={() => setPreviewFile(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 border border-slate-100 flex flex-col items-center max-w-2xl w-full shadow-2xl relative max-h-[85vh]" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-2xl" />
            </button>
            <div className="text-[14px] font-bold text-slate-800 mb-4 truncate max-w-[80%] text-center mt-1">
              Pratinjau Dokumen: {previewFile.name}
            </div>
            
            <div className="bg-slate-50 rounded-2xl border border-slate-200 w-full flex-1 overflow-auto flex items-center justify-center p-2 min-h-[300px] max-h-[60vh]">
              {previewFile.dataUrl ? (
                previewFile.type?.startsWith("image/") ? (
                  <img
                    src={previewFile.dataUrl}
                    alt={previewFile.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <iframe
                    src={previewFile.dataUrl}
                    title={previewFile.name}
                    className="w-full h-full border-0 min-h-[450px]"
                  />
                )
              ) : (
                <div className="text-center p-8 space-y-4 max-w-md">
                  <Icon name="description" className="text-5xl text-[#00236f] animate-pulse" />
                  <div className="font-bold text-slate-700 text-sm">Dokumen Simulasi Terlampir</div>
                  <div className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Dokumen ini adalah simulasi lampiran surat tugas PT Widatra Bhakti dengan nama file <span className="font-mono text-slate-600">{previewFile.name}</span> ({(previewFile.size / 1024 / 1024).toFixed(2)} MB).
                  </div>
                  <button
                    onClick={() => {
                      alert(`Mengunduh berkas simulasi: ${previewFile.name}`);
                      setPreviewFile(null);
                    }}
                    className="px-5 py-2 bg-[#00236f] text-white font-bold rounded-xl text-xs hover:bg-blue-900 transition-colors shadow-sm cursor-pointer"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
            
            <div className="text-[11px] text-slate-400 font-semibold mt-4 text-center">
              Klik tombol silang atau di luar area untuk menutup pratinjau.
            </div>
          </div>
        </div>
      )}

      {isQrZoomed && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fadein p-4"
          onClick={() => setIsQrZoomed(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative animate-scaleup flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrZoomed(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-xl" />
            </button>
            <div className="text-center mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">QR Code Tiket</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">Pindai kode ini pada pos keamanan</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/80 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${request.qr_code_token}`)}`}
                alt="Ticket QR Code Zoomed"
                className="w-56 h-56 object-contain"
              />
            </div>
            <span className="text-xs font-mono font-bold text-[#1e3a8a] bg-blue-50/80 border border-blue-100/60 px-3 py-1.5 rounded-lg mt-5 tracking-wider select-all">
              {request.qr_code_token}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

