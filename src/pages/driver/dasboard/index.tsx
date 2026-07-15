import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useAuthContext } from "@/auth/authContext";
import { assignmentService } from "@/services/modules/assignmentService";
import { requestService } from "@/services/modules/requestService";
import { vehicleService } from "@/services/modules/vehicleService";
import { apiClient } from "@/services/api/api";
import { RequestDetailModal } from "@/components/ui/RequestDetailModal";

import MyAssignmentsPage from "./Assignments";
import type { Assignment } from "./Assignments";
import TripSchedulePage from "./scheldules";
import type { TripHistory } from "./scheldules";
import VehiclePage from "./vahicle";
import type { Vehicle } from "./vahicle";
import CalendarView from "./CalendarView";
import type { CalendarEvent } from "./CalendarView";

function PriBadge({ p }: { p: string }) {
  const map: Record<string, string> = {
    URGENT:   "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]",
    NORMAL:   "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]",
    CRITICAL: "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]",
  };
  const hasDot = p !== "NORMAL";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${map[p] ?? map.NORMAL}`}>
      {hasDot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {p}
    </span>
  );
}

function RequestCard({
  req, onApprove, onReject, onViewDetail,
}: { req: Assignment; onApprove: (id: string) => void; onReject: (id: string) => void; onViewDetail: (reqId: string) => void }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#c7d7f7] hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={req.avatar} alt={req.requesterName}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#e2e8f0]"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requesterName)}&background=1e3a8a&color=fff`; }}
          />
          <div>
            <div className="text-[14px] font-bold text-[#0f172a]">
              {req.requesterName}
            </div>
            <div className="text-[11px] text-[#94a3b8]">{req.department}</div>
          </div>
        </div>
        <PriBadge p={req.priority} />
      </div>

      {/* Destination */}
      <div className="bg-[#f8faff] border border-[#e5eeff] rounded-xl px-3 py-2.5 flex items-center gap-2">
        <div className="w-7 h-7 bg-[#eff4ff] rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name="location_on" className="text-[16px] text-[#1e3a8a]" />
        </div>
        <div>
          <div className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider">Destination</div>
          <div className="text-[13px] font-bold text-[#0f172a]">{req.destination}</div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Date</div>
          <div className="font-semibold text-[#334155]">{req.date}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Time</div>
          <div className="font-semibold text-[#334155]">{req.time}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Vehicle Type</div>
          <div className="font-semibold text-[#334155]">{req.vehicleType}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Purpose</div>
          <div className="font-semibold text-[#334155]">{req.purpose}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#f1f5f9]">
        <button
          onClick={() => onViewDetail(req.reqId.replace('#REQ-', ''))}
          className="w-full sm:flex-1 h-9 bg-white border border-[#e2e8f0] text-[#475569] text-[12px] font-bold rounded-xl hover:bg-[#f8fafc] active:scale-95 transition-all cursor-pointer"
        >
          View Detail
        </button>
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
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const { user, updateUser } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeNav, setActiveNav] = useState(() => {
    if (tabParam === "vehicle") return "My Vehicle";
    if (tabParam === "schedule") return "History";
    if (tabParam === "calendar") return "Calendar";
    if (tabParam === "assignments" || tabParam === "tasks") return "My Tasks";
    return "Dashboard";
  });

  useEffect(() => {
    if (tabParam === "vehicle") {
      setActiveNav("My Vehicle");
    } else if (tabParam === "schedule") {
      setActiveNav("History");
    } else if (tabParam === "calendar") {
      setActiveNav("Calendar");
    } else if (tabParam === "assignments" || tabParam === "tasks") {
      setActiveNav("My Tasks");
    } else {
      setActiveNav("Dashboard");
    }
  }, [tabParam]);

  const [rawAssignments, setRawAssignments] = useState<any[]>([]);
  const [rawRequests, setRawRequests] = useState<any[]>([]);
  const [rawVehicles, setRawVehicles] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAssignmentForAccept, setSelectedAssignmentForAccept] = useState<Assignment | null>(null);
  
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [zoomedQrUrl, setZoomedQrUrl] = useState<string | null>(null);

  const handleViewDetail = async (reqId: string) => {
    setDetailLoading(true);
    try {
      const res = await requestService.getById(reqId);
      if (res.data) {
        setSelectedRequestForDetail(res.data);
      }
    } catch (err: any) {
      alert("Gagal memuat detail permintaan: " + (err.response?.data?.message || err.message));
    } finally {
      setDetailLoading(false);
    }
  };
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "start" | "complete" | "reject";
    targetId: string;
    rejectReason?: string;
  }>({
    isOpen: false,
    type: "start",
    targetId: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignRes, requestRes, vehicleRes] = await Promise.all([
        assignmentService.getAll(),
        requestService.getAll(),
        vehicleService.getAll(),
      ]);
      setRawAssignments(assignRes.data || []);
      setRawRequests(requestRes.data || []);
      setRawVehicles(vehicleRes.data || []);

      if (import.meta.env.VITE_ENABLE_MOCK !== "true") {
        const profileRes = await apiClient.get("/profile");
        if (profileRes.data?.status === "success" && profileRes.data.data) {
          updateUser({ availability_status: profileRes.data.data.availability_status });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat data dari server. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);





  const handleReject = (assignmentId: string) => {
    setConfirmModal({
      isOpen: true,
      type: "reject",
      targetId: assignmentId,
      rejectReason: "",
    });
  };

  const handleApproveClick = async (id: string) => {
    setActionLoading(true);
    try {
      await assignmentService.respond(id, {
        response: "accepted",
      });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyetujui tugas.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectVehicle = async (vehicleId: string) => {
    if (!selectedAssignmentForAccept) return;
    setActionLoading(true);
    try {
      await assignmentService.respond(selectedAssignmentForAccept.id, {
        response: "accepted",
        vehicle_id: vehicleId,
      });
      setSelectedAssignmentForAccept(null);
      setSearchParams({});
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyetujui tugas.");
    } finally {
      setActionLoading(false);
    }
  };

  // Mappers
  const mapAssignment = (a: any): Assignment => {
    const req = a.request || {};
    const name = req.requested_by?.name || "Staff";
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff`;
    const priority = (req.priority || "NORMAL").toUpperCase() as "URGENT" | "NORMAL" | "CRITICAL";
    
    let dateStr = "Today";
    let timeStr = "09:00";
    if (req.start_time) {
      const parts = req.start_time.includes('T') ? req.start_time.split('T') : req.start_time.split(" ");
      if (parts[0]) {
        const dateSubparts = parts[0].split('-');
        dateStr = dateSubparts.length === 3 ? `${dateSubparts[2]}-${dateSubparts[1]}-${dateSubparts[0]}` : parts[0];
      }
      if (parts[1]) timeStr = parts[1].substring(0, 5);
    }
    
    return {
      id: a.id,
      avatar,
      requesterName: name,
      department: req.department_id || "IT Department",
      priority,
      reqId: `#REQ-${req.id || a.request_id}`,
      destination: req.destination_city && req.destination_place ? `${req.destination_city} - ${req.destination_place}` : req.destination_city || "",
      date: dateStr,
      time: timeStr,
      vehicleType: req.vehicle_model || "Unassigned",
      purpose: req.purpose || "Operational Trip",
    };
  };

  const mapTripHistory = (r: any): TripHistory => {
    const name = r.employee || "Staff";
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff`;
    
    let dateStr = "Today";
    if (r.date) {
      dateStr = `${r.date} ${r.time || '09:00'}`;
    }
    
    return {
      id: r.id,
      tripId: `#REQ-${r.id}`,
      datetime: dateStr,
      passenger: name,
      passengerAvatar: avatar,
      vehicleType: r.vehicleModel || "Unassigned",
      route: `${r.destination_city || ""} - ${r.destination_place || ""}`,
      status: r.rawStatus === "completed" ? "Completed" : r.rawStatus === "rejected" ? "Rejected" : r.status,
    };
  };

  const mapVehicle = (v: any): Vehicle => {
    const statusMap: Record<string, string> = {
      AVAILABLE: "Available",
      "IN TRANSIT": "On Trip",
      "IN USE": "In Use",
      MAINTENANCE: "In Use",
    };
    const status = (statusMap[v.status?.toUpperCase()] || v.status || "Available") as any;
    
    return {
      id: v.id,
      name: v.model || "Operational Car",
      plate: v.plate || "Unknown Plate",
      transmission: v.transmission || "Automatic",
      seats: v.capacity || 4,
      fuel: v.fuel_level || 100,
      image: v.photoUrl || (v.imageType === 'truck' ? "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=160&fit=crop" : v.imageType === 'tesla' ? "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=160&fit=crop" : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=160&fit=crop"),
      status,
      location: v.location || "Pool A",
    };
  };

  // Filtered lists
  const pendingAssignments = rawAssignments
    .filter((a) => a.status === "pending_driver")
    .map(mapAssignment);

  const activeTrips = rawRequests.filter(
    (r) => {
      const isMatchedStatus = 
        r.rawStatus === "driver_assigned" || 
        r.rawStatus === "on_going" ||
        r.rawStatus === "waiting_driver" ||
        r.rawStatus === "assigned_by_ga";
      if (!isMatchedStatus) return false;
      
      const asg = rawAssignments.find(
        (a) => String(a.request?.id) === String(r.id) && String(a.driver?.id) === String(user?.id)
      );
      return asg && asg.status === "accepted";
    }
  );
  
  const historyTrips = rawRequests
    .filter((r) => r.rawStatus === "completed" || r.rawStatus === "rejected")
    .map(mapTripHistory);

  const mappedVehicles = rawVehicles.map(mapVehicle);

  const calendarEvents: CalendarEvent[] = [
    ...activeTrips.map(r => {
      let dateStr = "";
      if (r.startTime) {
        dateStr = r.startTime.includes('T') ? r.startTime.split('T')[0] : r.startTime.split(" ")[0];
      }
      return {
        id: String(r.id),
        tripId: `#REQ-${r.id}`,
        title: `Trip to ${r.destination}`,
        datetime: r.startTime ? r.startTime.substring(0, 16).replace('T', ' ') : `${r.date} ${r.time}`,
        dateStr: dateStr,
        route: r.destination,
        passenger: r.employee || "Staff",
        status: r.rawStatus === "on_going" ? "Sedang Berjalan" : "Terjadwal",
      };
    }),
    ...rawRequests.filter(r => r.rawStatus === "completed" || r.rawStatus === "rejected").map(r => {
      let dateStr = "";
      if (r.startTime) {
        dateStr = r.startTime.includes('T') ? r.startTime.split('T')[0] : r.startTime.split(" ")[0];
      }
      return {
        id: String(r.id),
        tripId: `#REQ-${r.id}`,
        title: `Trip to ${r.destination}`,
        datetime: r.startTime ? r.startTime.substring(0, 16).replace('T', ' ') : `${r.date} ${r.time}`,
        dateStr: dateStr,
        route: r.destination,
        passenger: r.employee || "Staff",
        status: r.rawStatus === "completed" ? "Completed" : "Rejected",
      };
    })
  ];

  const activeAssignments = activeTrips.map(r => {
    const asg = rawAssignments.find(
      (a) => String(a.request?.id) === String(r.id) && String(a.driver?.id) === String(user?.id)
    );
    const name = r.employee || "Staff";
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff`;
    
    return {
      id: asg?.id || String(r.id),
      avatar,
      requesterName: name,
      department: r.department || "IT Department",
      priority: (r.priority === "URGENT" || r.priority === "HIGH" ? "URGENT" : "NORMAL") as "URGENT" | "NORMAL" | "CRITICAL",
      reqId: `#REQ-${r.id}`,
      destination: r.destination || "",
      date: r.date || "",
      time: r.time || "",
      vehicleType: r.vehicleModel || "Unassigned",
      purpose: r.purpose || "Operational Trip",
      tripStatus: r.rawStatus,
      requestId: String(r.id),
    };
  });

  // Current active trip hero (on_going priority, then driver_assigned, then assigned_by_ga, then waiting_driver)
  const currentTrip = 
    activeTrips.find(t => t.rawStatus === "on_going") || 
    activeTrips.find(t => t.rawStatus === "driver_assigned") ||
    activeTrips.find(t => t.rawStatus === "assigned_by_ga") ||
    activeTrips.find(t => t.rawStatus === "waiting_driver");

  const totalCompletedCount = rawRequests.filter(r => r.rawStatus === "completed").length;
  const upcomingCount = activeTrips.length;

  const renderActiveTabContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin" />
          <p className="text-[13px] text-[#64748b] font-semibold">Memuat data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[13px] flex items-center gap-2">
          <Icon name="error" className="text-[18px]" />
          {error}
        </div>
      );
    }

    switch (activeNav) {
      case "Dashboard": {
         const getHeroStatusConfig = (status: string) => {
          switch (status) {
            case "on_going":
              return { label: "Berjalan", color: "bg-green-400 animate-pulse" };
            case "completed":
              return { label: "Selesai", color: "bg-emerald-500" };
            case "driver_assigned":
            case "pending":
              return { label: "Terjadwal (Siap Jalan)", color: "bg-[#7c3aed]" };
            case "assigned_by_ga":
              return { label: "Menunggu Head HRD", color: "bg-blue-400 animate-pulse" };
            case "waiting_driver":
              return { label: "Menunggu Driver Lain", color: "bg-amber-400 animate-pulse" };
            default:
              return { label: "Terjadwal", color: "bg-gray-400" };
          }
        };

        const driverTripStatus = (() => {
          if (!currentTrip) return null;
          if (currentTrip.is_external) {
            return currentTrip.rawStatus;
          }
          const myTripDetails = currentTrip.operational_trips?.find(
            (ot: any) => String(ot.driver?.id) === String(user?.id)
          );
          if (myTripDetails) {
            return myTripDetails.status; // 'pending' / 'on_going' / 'completed'
          }
          return currentTrip.rawStatus;
        })();

        const heroStatus = currentTrip ? getHeroStatusConfig(driverTripStatus || currentTrip.rawStatus) : null;

        return (
          <div className="p-4 sm:p-8 space-y-6">
            {/* Hero current assignment */}
            {currentTrip ? (
              <div className="relative bg-[#0f1f3d] rounded-2xl p-6 sm:p-7 overflow-hidden text-white shadow-lg">
                <div className="absolute right-0 top-0 w-64 h-64 bg-[#1e3a8a]/30 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute right-20 bottom-0 w-40 h-40 bg-[#1e3a8a]/20 rounded-full translate-y-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-[#1a2d4f] border border-[#2a4a7f] text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
                      <span className={`w-2 h-2 rounded-full ${heroStatus?.color}`} />
                      {heroStatus?.label}
                    </div>

                    <div>
                      <h2 className="text-[28px] font-extrabold leading-tight">{currentTrip.employee || "Staff"}</h2>
                      <div className="text-[11px] font-bold text-[#8ca3c4] uppercase tracking-widest mt-0.5">
                        {currentTrip.department || "Internal Staff"}
                      </div>
                    </div>

                    <div className="bg-[#1a2d4f]/60 border border-[#2a4a7f] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8ca3c4] uppercase tracking-wider mb-1">
                          <Icon name="location_on" className="text-[14px]" />
                          Destination
                        </div>
                        <div className="text-[14px] font-bold truncate max-w-[150px]" title={currentTrip.destination}>
                          {currentTrip.destination}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8ca3c4] uppercase tracking-wider mb-1">
                          <Icon name="schedule" className="text-[14px]" />
                          Departure
                        </div>
                        <div className="text-[14px] font-bold">{currentTrip.time || "09:00"}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8ca3c4] uppercase tracking-wider mb-1">
                          <Icon name="group" className="text-[14px]" />
                          Passengers
                        </div>
                        <div className="text-[14px] font-bold">{currentTrip.passengerCount || 1} Person</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end justify-between h-full gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#8ca3c4] font-bold">
                        Ref: #REQ-{currentTrip.id}
                      </span>
                      <button
                        onClick={() => handleViewDetail(String(currentTrip.id))}
                        className="text-[11px] font-bold text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg cursor-pointer transition-all hover:underline"
                      >
                        View Detail
                      </button>
                    </div>

                    {["driver_assigned", "pending", "on_going"].includes(driverTripStatus || "") && currentTrip.qr_code_token && (
                      <div 
                        onClick={() => setZoomedQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${currentTrip.qr_code_token}`)}`)}
                        className="bg-white p-2.5 rounded-xl border border-slate-700 shadow-sm flex flex-col items-center cursor-zoom-in hover:border-blue-500 transition-all hover:scale-105"
                        title="Klik untuk memperbesar"
                      >
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${currentTrip.qr_code_token}`)}`}
                          alt="Security Scan QR"
                          className="w-[80px] h-[80px] object-contain"
                        />
                        <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">
                          {currentTrip.qr_code_token}
                        </span>
                      </div>
                    )}

                    {(driverTripStatus === "driver_assigned" || driverTripStatus === "pending") && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-[#1a2d4f]/60 border border-[#2a4a7f] px-3.5 py-2 rounded-xl max-w-xs">
                        <Icon name="info" className="text-[15px] text-blue-400" />
                        <span className="font-semibold text-blue-300">Tunjukkan QR Code di samping ke Security saat berangkat</span>
                      </div>
                    )}

                    {driverTripStatus === "on_going" && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-[#1a2d4f]/60 border border-[#2a4a7f] px-3.5 py-2 rounded-xl max-w-xs">
                        <Icon name="info" className="text-[15px] text-green-400 animate-pulse" />
                        <span className="font-semibold text-green-300">Tunjukkan QR Code di samping ke Security saat kembali</span>
                      </div>
                    )}

                    {driverTripStatus === "completed" && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-emerald-950/60 border border-emerald-500/50 px-3.5 py-2 rounded-xl max-w-xs">
                        <Icon name="check_circle" className="text-[15px] text-emerald-400 animate-bounce" />
                        <span className="font-semibold text-emerald-300">Perjalanan Anda telah selesai</span>
                      </div>
                    )}

                    {currentTrip.rawStatus === "waiting_driver" && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-[#1a2d4f]/60 border border-[#2a4a7f] px-3.5 py-2 rounded-xl">
                        <Icon name="hourglass_empty" className="text-[15px] text-amber-400 animate-spin" />
                        <span className="font-semibold text-amber-300">Menunggu persetujuan driver kedua</span>
                      </div>
                    )}

                    {currentTrip.rawStatus === "assigned_by_ga" && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-[#1a2d4f]/60 border border-[#2a4a7f] px-3.5 py-2 rounded-xl">
                        <Icon name="hourglass_empty" className="text-[15px] text-blue-400 animate-pulse" />
                        <span className="font-semibold text-blue-300">Menunggu persetujuan akhir Head HRD & GA</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0f1f3d] rounded-2xl p-6 sm:p-7 text-white text-center shadow-lg relative overflow-hidden">
                <Icon name="commute" className="text-[48px] text-white/30 mb-2" />
                <h3 className="text-[16px] font-bold">Tidak ada Perjalanan Aktif</h3>
                <p className="text-[12.5px] text-white/60 mt-1 max-w-sm mx-auto">
                  Belum ada penugasan yang perlu dimulai. Terima tugas baru dari daftar di bawah untuk memulai trip.
                </p>
              </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Tugas Baru", value: String(pendingAssignments.length).padStart(2, "0"), icon: "assignment_late", bg: "bg-[#fffbeb]", color: "text-[#d97706]" },
                { label: "Trip Selesai (Total)", value: String(totalCompletedCount).padStart(2, "0"), icon: "task_alt", bg: "bg-[#f0fdf4]", color: "text-[#16a34a]" },
                { label: "Jadwal Mendatang", value: String(upcomingCount).padStart(2, "0"), icon: "calendar_month", bg: "bg-[#eff6ff]", color: "text-[#2563eb]" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[12px] text-[#64748b] font-medium mb-1">{s.label}</div>
                    <div className="text-2xl font-bold text-[#0f172a]">{s.value}</div>
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon name={s.icon} className={`text-[20px] ${s.color}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent requests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[17px] font-bold text-[#0f172a]">Daftar Tugas Baru</div>
                  <div className="text-[13px] text-[#64748b]">Terima atau tolak penugasan kendaraan operasional</div>
                </div>
                {pendingAssignments.length > 0 && (
                  <button
                    onClick={() => setActiveNav("My Assignments")}
                    className="text-[13px] font-semibold text-[#1e3a8a] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Lihat Semua
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </button>
                )}
              </div>

              {pendingAssignments.length === 0 ? (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl py-12 flex flex-col items-center">
                  <Icon name="check_circle" className="text-[36px] text-green-400 mb-2" />
                  <p className="font-bold text-[#0f172a] text-[14px]">Semua tugas telah diproses</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pendingAssignments.slice(0, 2).map((req) => (
                    <RequestCard
                      key={req.id} req={req}
                      onApprove={handleApproveClick}
                      onReject={handleReject}
                      onViewDetail={handleViewDetail}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case "My Tasks":
      case "My Assignments":
      case "Pending Requests":
        return (
          <MyAssignmentsPage
            pendingAssignments={pendingAssignments}
            activeAssignments={activeAssignments}
            onApprove={handleApproveClick}
            onReject={handleReject}
            onViewDetail={handleViewDetail}
            onStartTrip={(reqId) => {
              setConfirmModal({
                isOpen: true,
                type: "start",
                targetId: reqId,
              });
            }}
            onCompleteTrip={(reqId) => {
              setConfirmModal({
                isOpen: true,
                type: "complete",
                targetId: reqId,
              });
            }}
          />
        );

      case "My Vehicle":
        return (
          <VehiclePage
            vehicles={mappedVehicles}
            onSelectVehicle={handleSelectVehicle}
            selectedAssignmentId={selectedAssignmentForAccept?.id}
            selectedAssignmentRef={selectedAssignmentForAccept?.reqId}
          />
        );

      case "History":
      case "My Schedule":
      case "Schedule":
        return <TripSchedulePage trips={historyTrips} onViewDetail={handleViewDetail} />;

      case "Calendar":
        return <CalendarView events={calendarEvents} onViewDetail={handleViewDetail} />;

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (activeNav) {
      case "My Vehicle":
        return "Select Vehicle";
      case "History":
      case "My Schedule":
      case "Schedule":
        return "History";
      case "My Tasks":
      case "My Assignments":
      case "Pending Requests":
        return "My Tasks";
      case "Calendar":
        return "Calendar";
      default:
        return "Driver Portal";
    }
  };

  return (
    <Layout
      activeNav={activeNav}
      onNavigate={(nav) => {
        if (nav === "Dashboard") setSearchParams({});
        else if (nav === "My Vehicle") setSearchParams({ tab: "vehicle" });
        else if (nav === "History" || nav === "My Schedule") setSearchParams({ tab: "schedule" });
        else if (nav === "Calendar") setSearchParams({ tab: "calendar" });
        else if (nav === "My Tasks" || nav === "My Assignments" || nav === "Pending Requests") setSearchParams({ tab: "assignments" });
        else setActiveNav(nav);
      }}
      topbarTitle={getTitle()}
      userName={user?.name || "Driver"}
      userRole="Driver"
    >
      <div className="min-h-full bg-[#f8f9ff]">
        {renderActiveTabContent()}
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc] flex-shrink-0">
              <h3 className="text-[15px] font-bold text-[#0f172a]">
                {confirmModal.type === "start" && "Mulai Perjalanan"}
                {confirmModal.type === "complete" && "Selesaikan Perjalanan"}
                {confirmModal.type === "reject" && "Tolak Penugasan"}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: "start", targetId: "" })}
                className="text-[#94a3b8] hover:text-[#64748b] cursor-pointer"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[13px] text-[#475569]">
                {confirmModal.type === "start" && "Apakah Anda yakin ingin memulai perjalanan operasional ini?"}
                {confirmModal.type === "complete" && "Apakah Anda yakin telah menyelesaikan perjalanan operasional ini?"}
                {confirmModal.type === "reject" && "Silakan masukkan alasan penolakan tugas berikut:"}
              </p>

              {confirmModal.type === "reject" && (
                <div>
                  <textarea
                    required
                    value={confirmModal.rejectReason || ""}
                    onChange={(e) => setConfirmModal(prev => ({ ...prev, rejectReason: e.target.value }))}
                    placeholder="Contoh: Kendaraan sedang diservis / sakit..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, type: "start", targetId: "" })}
                  className="w-full sm:w-auto h-10 px-5 border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl text-[12.5px] font-bold text-[#475569] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading || (confirmModal.type === "reject" && !confirmModal.rejectReason?.trim())}
                  onClick={async () => {
                    const id = confirmModal.targetId;
                    setActionLoading(true);
                    try {
                      if (confirmModal.type === "start") {
                        await requestService.start(id);
                      } else if (confirmModal.type === "complete") {
                        await requestService.complete(id);
                      } else if (confirmModal.type === "reject") {
                        await assignmentService.respond(id, {
                          response: "rejected",
                          reject_reason: confirmModal.rejectReason,
                        });
                      }
                      setConfirmModal({ isOpen: false, type: "start", targetId: "" });
                      await fetchData();
                    } catch (err: any) {
                      console.error(err);
                      alert(err.response?.data?.message || "Terjadi kesalahan saat memproses aksi.");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className={`w-full sm:w-auto h-10 px-6 text-white rounded-xl text-[12.5px] font-bold transition-all disabled:opacity-50 cursor-pointer ${
                    confirmModal.type === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-[#1e3a8a] hover:bg-[#1e40af]"
                  }`}
                >
                  {actionLoading ? "Memproses..." : (
                    confirmModal.type === "start" ? "Mulai" : (
                      confirmModal.type === "complete" ? "Selesaikan" : "Tolak Tugas"
                    )
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRequestForDetail && (
        <RequestDetailModal
          isOpen={!!selectedRequestForDetail}
          onClose={() => setSelectedRequestForDetail(null)}
          request={selectedRequestForDetail}
        />
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-3 shadow-lg">
            <div className="w-10 h-10 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin" />
            <p className="text-[13px] text-[#64748b] font-semibold">Memuat detail...</p>
          </div>
        </div>
      )}

      {zoomedQrUrl && (
        <div 
          className="fixed inset-0 bg-black/85 z-[99999] flex flex-col items-center justify-center p-4 cursor-pointer animate-fadein"
          onClick={() => setZoomedQrUrl(null)}
        >
          <div 
            className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center max-w-sm w-full shadow-2xl relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setZoomedQrUrl(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-2xl" />
            </button>
            <div className="text-[13px] font-extrabold text-[#1e3a8a] mb-4 uppercase tracking-widest text-center mt-2">Pindai QR Code Tiket</div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-[#e2e8f0]">
              <img
                src={zoomedQrUrl}
                alt="Zoomed Ticket QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
            <div className="text-xs text-slate-400 font-semibold mt-4 text-center">
              Tunjukkan QR Code ini ke Security untuk dipindai saat berangkat/kembali.
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
