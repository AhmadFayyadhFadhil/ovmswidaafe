import { useState } from "react";
import { Icon } from "./Icon";
import { PriorityBadge } from "../layout/PriorityBadge";
import type { FleetRequest } from "../../types";
import { useAuthContext } from "@/auth/authContext";

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
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  if (!isOpen || !request) return null;

  const formatScanTime = (dtStr: string | null | undefined) => {
    if (!dtStr) return "";
    try {
      const utcStr = dtStr.includes('Z') ? dtStr : `${dtStr.replace(' ', 'T')}Z`;
      const date = new Date(utcStr);
      if (isNaN(date.getTime())) {
        return dtStr;
      }
      const pad = (n: number) => String(n).padStart(2, '0');
      const d = pad(date.getDate());
      const m = pad(date.getMonth() + 1);
      const y = date.getFullYear();
      const h = pad(date.getHours());
      const min = pad(date.getMinutes());
      return `${d}-${m}-${y} ${h}:${min}`;
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

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Surat Tugas / Tiket Perjalanan #REQ-${esc(request.id)}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #334155; }
            .ticket { border: 2px dashed #94a3b8; padding: 30px; border-radius: 16px; max-width: 600px; margin: 0 auto; background: #fff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; margin: 0; color: #1e3a8a; letter-spacing: 0.5px; }
            .subtitle { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 4px; }
            .row { display: flex; margin-bottom: 12px; border-bottom: 1px solid #f8fafc; padding-bottom: 8px; }
            .label { font-weight: bold; width: 180px; text-transform: uppercase; font-size: 11px; color: #94a3b8; letter-spacing: 0.5px; }
            .value { font-size: 13.5px; color: #334155; font-weight: 600; }
            .qr { text-align: center; margin-top: 25px; border-top: 2px dashed #e2e8f0; pt: 20px; padding-top: 20px; }
            .qr img { border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h2 class="title">SURAT TUGAS LAYANAN KENDARAAN (OVMS)</h2>
              <div class="subtitle">PT. Widatra Bhakti</div>
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
              <p style="font-size: 10px; color: #94a3b8; margin-top: 8px; font-family: monospace; font-weight: bold;">${esc(request.qr_code_token || `REQ-${request.id}`)}</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleConfirmRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim() || !onReject) return;
    await onReject(request.id, rejectReason.trim());
    setIsConfirmRejectOpen(false);
    setRejectReason("");
    onClose();
  };

  const passengers = request.passengers || [];
  const approvals = request.approvals || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-fadein">
      <div className="bg-white w-full max-w-4xl lg:max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
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
          <div className="flex items-center gap-1.5">
            {/* Print Button */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Requester & Trip Details (Span 2) */}
            <div className="md:col-span-2 space-y-5">
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
                    {request.userPhone && (
                      <a
                        href={`https://wa.me/${request.userPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors mt-1.5"
                      >
                        💬 Hubungi WA ({request.userPhone})
                      </a>
                    )}
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
                              const vName = (request.vehicleModel || "Armada Belum Dipilih").replace(/\s*\(\s*\)/g, '').trim();

                              return driverNames.map((dName: string, dIdx: number) => {
                                const dInitials = dName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                                return (
                                  <div key={dIdx} className="p-3 bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-9 h-9 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-sm border border-blue-900">
                                        {dInitials}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-[12.5px] font-bold text-slate-800 truncate">{dName}</div>
                                        <div className="text-[11px] font-medium text-slate-600 truncate flex items-center gap-1 mt-0.5">
                                          <Icon name="directions_car" className="text-xs text-slate-400" />
                                          <span>{vName}</span>
                                        </div>
                                        {request.driverPhone && (
                                          <a
                                            href={`https://wa.me/${request.driverPhone.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-[10.5px] font-bold transition-colors mt-1"
                                          >
                                            💬 Hubungi WA ({request.driverPhone})
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 shrink-0">
                                      Driver Internal
                                    </span>
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
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {passengers.map((p: any, idx: number) => {
                      const isPicPassenger = p.is_pic || (!passengers.some((px: any) => px.is_pic) && idx === 0);
                      return (
                        <div key={p.id || idx} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-[13px] transition-colors">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            {p.name}
                            {isPicPassenger && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                PIC Penumpang
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase">
                            {p.department_name || p.department_id || request.department}
                          </span>
                        </div>
                      );
                    })}
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
                              time: it.morning_checked_in_at || it.security_checked_in_at || it.updated_at || request.completed_at || new Date().toISOString(),
                              by: it.morning_checkin_by || it.security_checkin_by || request.security_checkin_by || "System",
                              notes: it.morning_checkin_notes || it.security_checkin_notes || request.security_checkin_notes,
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
                              time: it.afternoon_checked_in_at || it.security_checked_in_at || it.updated_at || request.completed_at || new Date().toISOString(),
                              by: it.afternoon_checkin_by || it.security_checkin_by || request.security_checkin_by || "System",
                              notes: it.afternoon_checkin_notes || it.security_checkin_notes || request.security_checkin_notes,
                            });
                          }

                          return (
                            <div key={it.id || idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                              {/* Day Header */}
                              <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                                  <span>📅</span> {dayLabel}
                                </span>
                                <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md ${
                                  isDone ? 'bg-emerald-100 text-emerald-800' :
                                  isOngoing ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                  'bg-slate-200 text-slate-600'
                                }`}>
                                  {isDone ? '✓ Completed' : isOngoing ? '⚡ On Going' : 'Scheduled'}
                                </span>
                              </div>

                              {/* Log List for this day */}
                              <div className="p-2 space-y-1.5 text-xs">
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

                if (!request.security_checked_out_at && !request.security_checked_in_at) return null;

                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Icon name="verified" className="text-sm text-emerald-600" />
                      Log Keamanan Security
                    </div>
                    <div className="text-xs space-y-2">
                      {request.security_checked_out_at && (
                        <div className="bg-white p-2 border border-slate-100 rounded-lg">
                          <div className="flex justify-between items-start gap-2">
                            <div className="font-bold text-amber-700 text-[12.5px] leading-tight">Scan Berangkat (Checkout)</div>
                            <span className="text-[10.5px] text-slate-400 font-bold font-mono whitespace-nowrap flex-shrink-0 mt-0.5">
                              {formatScanTime(request.security_checked_out_at)}
                            </span>
                          </div>
                          <div className="text-slate-500 font-medium mt-0.5">Petugas: {request.security_checkout_by}</div>
                          {request.security_checkout_notes && (
                            <div className="mt-1 text-[11px] text-slate-600 italic">" {request.security_checkout_notes} "</div>
                          )}
                        </div>
                      )}
                      {request.security_checked_in_at && (
                        <div className="bg-white p-2 border border-slate-100 rounded-lg">
                          <div className="flex justify-between items-start gap-2">
                            <div className="font-bold text-emerald-700 text-[12.5px] leading-tight">Scan Kembali (Checkin)</div>
                            <span className="text-[10.5px] text-slate-400 font-bold font-mono whitespace-nowrap flex-shrink-0 mt-0.5">
                              {formatScanTime(request.security_checked_in_at)}
                            </span>
                          </div>
                          <div className="text-slate-500 font-medium mt-0.5">Petugas: {request.security_checkin_by}</div>
                          {request.security_checkin_notes && (
                            <div className="mt-1 text-[11px] text-slate-600 italic">" {request.security_checkin_notes} "</div>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          {request.canApprove && onApprove && onReject ? (
            <>
              <button
                onClick={() => setIsConfirmRejectOpen(true)}
                className="w-full sm:w-auto h-10 px-4 text-[#dc2626] border border-[#dc2626] rounded-xl text-[13px] font-bold bg-white hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
              >
                Tolak Permintaan
              </button>
              <button
                onClick={async () => {
                  await onApprove(request.id);
                  onClose();
                }}
                className="w-full sm:w-auto h-10 px-5 bg-blue-800 text-white rounded-xl text-[13px] font-bold hover:bg-blue-900 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Icon name="check_circle" className="text-[16px]" />
                Setujui Permintaan
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

