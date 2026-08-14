import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { requestService } from "@/services/modules/requestService";
import { driverService } from "@/services/modules/driverService";
import { vehicleService } from "@/services/modules/vehicleService";
import { assignmentService } from "@/services/modules/assignmentService";
import { useAuthContext } from "@/auth/authContext";
import { RequestDetailModal } from "@/components/ui/RequestDetailModal";
import { apiClient } from "@/services/api/api";

const formatNumberIndonesian = (value: string | number) => {
  if (value === undefined || value === null) return "";
  const clean = String(value).replace(/\D/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("id-ID").format(Number(clean));
};

const cleanNumber = (val: string | number) => {
  if (val === undefined || val === null || val === "") return 0;
  return Number(String(val).replace(/\D/g, ""));
};

export type Priority = "URGENT" | "NORMAL" | "CRITICAL";

export interface Driver {
  id: string;
  name: string;
  email?: string;
  status: "AVAILABLE" | "ON TRIP" | "OFF DUTY" | "ASSIGNED";
  avatar?: string;
}

type TabFilter = "All" | "Normal" | "Urgent" | "Critical";

function PriBadge({ p }: { p: string }) {
  const map: Record<string, string> = {
    URGENT:   "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]",
    CRITICAL: "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]",
    HIGH:     "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]",
    NORMAL:   "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]",
    LOW:      "bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]",
  };
  const display = p.toUpperCase();
  const badgeClass = map[display] || "bg-gray-100 text-gray-700 border border-gray-200";
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass}`}>{display}</span>
  );
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]";
    case "ONGOING":
      return "bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe]";
    case "PENDING":
      return "bg-[#fef3c7] text-[#d97706] border border-[#fde68a]";
    case "COMPLETED":
      return "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]";
    case "REJECTED":
      return "bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]";
    default:
      return "bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]";
  }
}

export default function GAHRDRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [tab, setTab] = useState<TabFilter>("All");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<any | null>(null);

  // Assignment Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId2, setSelectedDriverId2] = useState("");
  const [selectedVehicleId2, setSelectedVehicleId2] = useState("");
  const [isExternal, setIsExternal] = useState(false);
  const [thirdPartyCost, setThirdPartyCost] = useState("0");
  const [estimatedDuration, setEstimatedDuration] = useState("3");
  const [selectedPriority, setSelectedPriority] = useState("Normal");
  const [assignNotes, setAssignNotes] = useState("");
  const [externalFleetInfo, setExternalFleetInfo] = useState("");
  const [externalPhoto, setExternalPhoto] = useState<File | null>(null);
  const [externalTripType, setExternalTripType] = useState("round_trip");
  const [externalDepartureCost, setExternalDepartureCost] = useState("0");
  const [externalReturnCost, setExternalReturnCost] = useState("0");
  const [externalReturnFleetInfo, setExternalReturnFleetInfo] = useState("");
  const [externalReturnPhoto, setExternalReturnPhoto] = useState<File | null>(null);
  const [externalDriverName, setExternalDriverName] = useState("");
  const [externalLicensePlate, setExternalLicensePlate] = useState("");
  const [externalReturnDriverName, setExternalReturnDriverName] = useState("");
  const [externalReturnLicensePlate, setExternalReturnLicensePlate] = useState("");
  const [externalProvider, setExternalProvider] = useState("");
  
  // Second external vehicle states:
  const [externalDriverName2, setExternalDriverName2] = useState("");
  const [externalLicensePlate2, setExternalLicensePlate2] = useState("");
  const [externalFleetInfo2, setExternalFleetInfo2] = useState("");
  const [externalPhoto2, setExternalPhoto2] = useState<File | null>(null);
  const [externalDepartureCost2, setExternalDepartureCost2] = useState("0");
  const [externalReturnCost2, setExternalReturnCost2] = useState("0");
  const [externalReturnDriverName2, setExternalReturnDriverName2] = useState("");
  const [externalReturnLicensePlate2, setExternalReturnLicensePlate2] = useState("");
  const [externalReturnFleetInfo2, setExternalReturnFleetInfo2] = useState("");
  const [externalReturnPhoto2, setExternalReturnPhoto2] = useState<File | null>(null);
  const [thirdPartyCost2, setThirdPartyCost2] = useState("0");

  const [assignError, setAssignError] = useState("");
  const [cancelConfirmRequestId, setCancelConfirmRequestId] = useState<string | null>(null);
  const [deleteConfirmRequestId, setDeleteConfirmRequestId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [dailyAssignments, setDailyAssignments] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isEdit = !!(selectedRequest && (
    selectedRequest.driverName !== "Not Assigned" ||
    selectedRequest.vehicleModel !== "Not Assigned" ||
    selectedRequest.is_external
  ));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, driverRes, vehicleRes] = await Promise.all([
        requestService.getAll({ per_page: 100 }),
        driverService.getAll(),
        vehicleService.getAll({ per_page: 1000 }),
      ]);

      setRequests(reqRes.data || []);

      const mappedDrivers: Driver[] = (driverRes.data || []).map((d: any) => ({
        id: String(d.id),
        name: d.name,
        email: d.email,
        status: d.status === "AVAILABLE" ? "AVAILABLE" : (d.status === "ON DUTY" ? "ON TRIP" : (d.status === "ASSIGNED" ? "ASSIGNED" : "OFF DUTY")),
      } as Driver));
      setDrivers(mappedDrivers);

      setVehicles(vehicleRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/requests/${requestId}/reject`, {
        notes: reason,
        role: "hrd_head"
      });
      // Update local list
      setRequests(prev => prev.map(r => {
        if (String(r.id) === String(requestId)) {
          return {
            ...r,
            status: "REJECTED",
            rawStatus: "rejected",
            canReject: false,
            canApprove: false
          };
        }
        return r;
      }));
      setIsDetailModalOpen(false);
      setDetailRequest(null);
      showToast("Permintaan perjalanan berhasil ditolak!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal menolak permintaan.");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    if (idParam && requests.length > 0) {
      setSearch(idParam);
      const found = requests.find(r => String(r.id) === String(idParam));
      if (found) {
        setDetailRequest(found);
        setIsDetailModalOpen(true);
      }
      // Clear query parameter from the URL address bar
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [requests]);

  const handleOpenAssignModal = async (req: any) => {
    setSelectedRequest(req);
    setSelectedDriverId("");
    setSelectedVehicleId("");
    setSelectedDriverId2("");
    setSelectedVehicleId2("");
    setIsExternal(req.is_external || false);
    setThirdPartyCost(req.third_party_cost ? formatNumberIndonesian(String(Math.round(Number(req.third_party_cost)))) : "0");
    
    // Dynamically calculate estimated duration based on filled itinerary sessions (e.g. Sesi 1 + Sesi 2) or single-day active hours
    const durationHours = (() => {
      if (Array.isArray(req.itineraries) && req.itineraries.length > 0) {
        let totalSessionHours = 0;
        req.itineraries.forEach((it: any) => {
          if (it.morning_destination || it.morning_time) totalSessionHours += 2;
          if (it.afternoon_destination || it.afternoon_time) totalSessionHours += 2;
        });
        if (totalSessionHours > 0) return String(totalSessionHours);
      }

      if (req.startTime && req.rawEndTime) {
        const start = new Date(req.startTime);
        const end = new Date(req.rawEndTime);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffMs = end.getTime() - start.getTime();
          const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
          return String(Math.min(diffHours > 0 ? diffHours : 3, 9));
        }
      }
      return req.estimated_duration ? String(req.estimated_duration) : "3";
    })();
    setEstimatedDuration(durationHours);
    
    setSelectedPriority(req.rawPriority || "Normal");
    setAssignNotes("");
    setExternalFleetInfo(req.external_fleet_info || "");
    setExternalPhoto(null);
    setExternalTripType(req.external_trip_type || "round_trip");
    setExternalDepartureCost(req.external_departure_cost ? formatNumberIndonesian(String(Math.round(Number(req.external_departure_cost)))) : "0");
    setExternalReturnCost(req.external_return_cost ? formatNumberIndonesian(String(Math.round(Number(req.external_return_cost)))) : "0");
    setExternalReturnFleetInfo(req.external_return_fleet_info || "");
    setExternalReturnPhoto(null);
    setExternalDriverName(req.external_driver_name || "");
    setExternalLicensePlate(req.external_license_plate || "");
    setExternalReturnDriverName(req.external_return_driver_name || "");
    setExternalReturnLicensePlate(req.external_return_license_plate || "");

    if (Array.isArray(req.itineraries) && req.itineraries.length > 0) {
      setDailyAssignments(req.itineraries.map((it: any) => ({
        itinerary_id: it.id,
        date: it.date,
        driver_id: it.driver_id ? String(it.driver_id) : "",
        vehicle_id: it.vehicle_id ? String(it.vehicle_id) : "",
        is_external: !!it.is_external,
        external_driver_name: it.external_driver_name || "",
        external_license_plate: it.external_license_plate || "",
        external_fleet_info: it.external_fleet_info || "",
        third_party_cost: it.third_party_cost ? formatNumberIndonesian(String(Math.round(Number(it.third_party_cost)))) : "0",
      })));
    } else {
      setDailyAssignments([]);
    }
    setExternalProvider(req.external_provider || "");
 
    // Prefill second external vehicle states:
    setExternalDriverName2(req.external_driver_name_2 || "");
    setExternalLicensePlate2(req.external_license_plate_2 || "");
    setExternalFleetInfo2(req.external_fleet_info_2 || "");
    setExternalPhoto2(null);
    setExternalDepartureCost2(req.external_departure_cost_2 ? formatNumberIndonesian(String(Math.round(Number(req.external_departure_cost_2)))) : "0");
    setExternalReturnCost2(req.external_return_cost_2 ? formatNumberIndonesian(String(Math.round(Number(req.external_return_cost_2)))) : "0");
    setExternalReturnDriverName2(req.external_return_driver_name_2 || "");
    setExternalReturnLicensePlate2(req.external_return_license_plate_2 || "");
    setExternalReturnFleetInfo2(req.external_return_fleet_info_2 || "");
    setExternalReturnPhoto2(null);
    setThirdPartyCost2(req.third_party_cost_2 ? formatNumberIndonesian(String(Math.round(Number(req.third_party_cost_2)))) : "0");

    setAssignError("");
    setIsAssignModalOpen(true);

    // Fetch existing assignments if the request is already assigned to prefill the dropdowns
    if (req.driverName !== "Not Assigned" || req.vehicleModel !== "Not Assigned") {
      if (req.driver?.id) setSelectedDriverId(String(req.driver.id));
      if (req.vehicle?.id) setSelectedVehicleId(String(req.vehicle.id));

      try {
        const res = await apiClient.get(`/assignments?request_id=${req.id}`);
        const asgs = res.data?.data || [];
        if (asgs.length > 0) {
          // Prefill first driver and vehicle
          if (asgs[0]?.driver) setSelectedDriverId(String(asgs[0].driver.id));
          if (asgs[0]?.vehicle) setSelectedVehicleId(String(asgs[0].vehicle.id));
          
          // Prefill second driver and vehicle
          if (asgs[1]?.driver) setSelectedDriverId2(String(asgs[1].driver.id));
          if (asgs[1]?.vehicle) setSelectedVehicleId2(String(asgs[1].vehicle.id));
        }
      } catch (err) {
        console.error("Gagal memuat detail penugasan sebelumnya:", err);
      }
    }

    setLoadingVehicles(true);
    try {
      vehicleService.clearCache();
      const res = await vehicleService.getAll({ per_page: 1000 });
      const vList = res.data || [];
      console.log('[DEBUG-VEHICLES] Fresh fetch result:', JSON.stringify(vList.map((v: any) => ({ id: v.id, model: v.model, plate: v.plate, status: v.status }))));
      console.log('[DEBUG-VEHICLES] Total vehicles fetched:', vList.length);
      setVehicles(vList);
    } catch (err) {
      console.error("Gagal memuat kendaraan:", err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setActionLoading(true);
    setAssignError("");
    try {
      if (selectedRequest?.itineraries && selectedRequest.itineraries.length > 0 && dailyAssignments.length > 0) {
        const payload = dailyAssignments.map(asg => ({
          itinerary_id: asg.itinerary_id,
          driver_id: asg.is_external ? null : (asg.driver_id || null),
          vehicle_id: asg.is_external ? null : (asg.vehicle_id || null),
          is_external: asg.is_external,
          external_driver_name: asg.is_external ? (asg.external_driver_name || null) : null,
          external_license_plate: asg.is_external ? (asg.external_license_plate || null) : null,
          external_fleet_info: asg.is_external ? (asg.external_fleet_info || null) : null,
          third_party_cost: asg.is_external ? cleanNumber(asg.third_party_cost) : 0,
        }));
        await requestService.storeDailyAssignments(selectedRequest.id, payload);
        setIsAssignModalOpen(false);
        showToast("Penugasan harian berhasil disimpan!");
        await fetchData();
        return;
      }

      if (isExternal) {
        const formData = new FormData();
        formData.append("request_id", selectedRequest.id);
        formData.append("is_external", "1");
        
        let depCost = 0;
        let retCost = 0;
        let totalCost = 0;
        
        if (externalTripType === "round_trip") {
          totalCost = cleanNumber(thirdPartyCost);
          depCost = 0;
          retCost = 0;
        } else {
          depCost = cleanNumber(externalDepartureCost);
          retCost = cleanNumber(externalReturnCost);
          totalCost = depCost + retCost;
        }
        
        formData.append("third_party_cost", String(totalCost));
        formData.append("external_departure_cost", String(depCost));
        formData.append("external_return_cost", String(retCost));
        formData.append("external_trip_type", externalTripType);
        formData.append("priority", selectedPriority);
        if (assignNotes) formData.append("notes", assignNotes);
        if (externalFleetInfo) formData.append("external_fleet_info", externalFleetInfo);
        if (externalPhoto) formData.append("external_photo", externalPhoto);
        if (externalDriverName) formData.append("external_driver_name", externalDriverName);
        if (externalLicensePlate) formData.append("external_license_plate", externalLicensePlate);
        if (externalProvider) formData.append("external_provider", externalProvider);
        
        if (externalTripType === "one_way") {
          if (externalReturnFleetInfo) formData.append("external_return_fleet_info", externalReturnFleetInfo);
          if (externalReturnPhoto) formData.append("external_return_photo", externalReturnPhoto);
          if (externalReturnDriverName) formData.append("external_return_driver_name", externalReturnDriverName);
          if (externalReturnLicensePlate) formData.append("external_return_license_plate", externalReturnLicensePlate);
        }

        // Add second external vehicle fields if passenger count > 6
        if (selectedRequest.passengerCount > 6) {
          let depCost2 = 0;
          let retCost2 = 0;
          let totalCost2 = 0;
          
          if (externalTripType === "round_trip") {
            totalCost2 = cleanNumber(thirdPartyCost2);
          } else {
            depCost2 = cleanNumber(externalDepartureCost2);
            retCost2 = cleanNumber(externalReturnCost2);
            totalCost2 = depCost2 + retCost2;
          }
          
          formData.append("third_party_cost_2", String(totalCost2));
          formData.append("external_departure_cost_2", String(depCost2));
          formData.append("external_return_cost_2", String(retCost2));
          
          if (externalDriverName2) formData.append("external_driver_name_2", externalDriverName2);
          if (externalLicensePlate2) formData.append("external_license_plate_2", externalLicensePlate2);
          if (externalFleetInfo2) formData.append("external_fleet_info_2", externalFleetInfo2);
          if (externalPhoto2) formData.append("external_photo_2", externalPhoto2);
          
          if (externalTripType === "one_way") {
            if (externalReturnDriverName2) formData.append("external_return_driver_name_2", externalReturnDriverName2);
            if (externalReturnLicensePlate2) formData.append("external_return_license_plate_2", externalReturnLicensePlate2);
            if (externalReturnFleetInfo2) formData.append("external_return_fleet_info_2", externalReturnFleetInfo2);
            if (externalReturnPhoto2) formData.append("external_return_photo_2", externalReturnPhoto2);
          }
        }

        await assignmentService.create(formData);
      } else {
        if (!selectedDriverId || !selectedVehicleId) {
          setAssignError("WAJIB memilih Driver 1 dan Mobil 1.");
          setActionLoading(false);
          return;
        }

        const payload: any = {
          request_id: selectedRequest.id,
          is_external: false,
          estimated_duration: Number(estimatedDuration),
          priority: selectedPriority,
          notes: assignNotes || undefined,
          driver_id: selectedDriverId,
          vehicle_id: selectedVehicleId,
        };

        if (selectedDriverId2 && selectedVehicleId2) {
          if (selectedDriverId === selectedDriverId2) {
            setAssignError("Driver 1 dan Driver 2 tidak boleh orang yang sama.");
            setActionLoading(false);
            return;
          }
          if (selectedVehicleId === selectedVehicleId2) {
            setAssignError("Kendaraan 1 dan Kendaraan 2 tidak boleh unit mobil yang sama.");
            setActionLoading(false);
            return;
          }
          payload.driver_ids = [selectedDriverId, selectedDriverId2];
          payload.vehicle_ids = [selectedVehicleId, selectedVehicleId2];
        }

        await assignmentService.create(payload);
      }

      const isEditAction = selectedRequest?.driverName !== "Not Assigned" || selectedRequest?.vehicleModel !== "Not Assigned" || selectedRequest?.is_external;
      setIsAssignModalOpen(false);
      showToast(isEditAction ? "Perubahan penugasan berhasil disimpan!" : "Driver & Kendaraan berhasil ditugaskan!");
      await fetchData();
    } catch (err: any) {
      console.error("Assign error full object:", err);
      console.error("Assign error response data:", err.response?.data);
      let serverMsg = "";
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && typeof validationErrors === "object") {
        const firstKey = Object.keys(validationErrors)[0];
        if (firstKey && Array.isArray(validationErrors[firstKey]) && validationErrors[firstKey][0]) {
          serverMsg = validationErrors[firstKey][0];
        }
      }
      if (!serverMsg) {
        serverMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response?.data : null) || err.message;
      }
      setAssignError(serverMsg ? `Error Server: ${serverMsg}` : "Gagal menugaskan driver.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAssignment = async (requestId: string) => {
    setActionLoading(true);
    try {
      const res = await assignmentService.getAll({ per_page: 1000 });
      const assignment = (res.data || []).find(
        (a: any) => String(a.request?.id) === String(requestId) && a.status === 'pending_driver'
      );
      if (assignment) {
        await assignmentService.cancel(assignment.id);
        showToast("Penugasan driver berhasil dibatalkan!");
        await fetchData();
      } else {
        alert("Assignment tidak ditemukan.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal membatalkan penugasan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string, reason: string) => {
    setActionLoading(true);
    try {
      await requestService.delete(requestId, reason);
      showToast("Permintaan kendaraan berhasil dibatalkan!");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data?.errors?.rejected_reason?.[0] || "Gagal membatalkan permintaan.");
    } finally {
      setActionLoading(false);
    }
  };

  const readyDrivers = drivers.filter((d) => d.status === "AVAILABLE");

  const getAvailableDriversForRequest = (req: any) => {
    return drivers.filter((d) => 
      d.status === "AVAILABLE" || 
      String(d.id) === String(selectedDriverId) || 
      String(d.id) === String(selectedDriverId2) ||
      (req && (String(d.id) === String(req.driverId) || String(d.id) === String(req.driver_id)))
    );
  };

  const availableDrivers = getAvailableDriversForRequest(selectedRequest);

  const getAvailableVehiclesForRequest = (req: any) => {
    if (!Array.isArray(vehicles)) return [];
    return vehicles.filter(v => {
      const s = String(v.status || 'Available').toUpperCase();
      const isAvailable = s === "AVAILABLE";
      const isSelected = String(v.id) === String(selectedVehicleId) || String(v.id) === String(selectedVehicleId2);
      const isReqVehicle = req && (String(v.id) === String(req.vehicleId) || String(v.id) === String(req.vehicle_id));
      return isAvailable || isSelected || isReqVehicle;
    });
  };

  const availableVehicles = getAvailableVehiclesForRequest(selectedRequest);

  // Filter requests
  const filtered = useMemo(() => requests.filter((r) => {
    if (r.rawStatus === "completed" || r.rawStatus === "rejected" || r.rawStatus === "cancelled") {
      return false;
    }
    const priorityUpper = (r.priority || "NORMAL").toUpperCase();
    const matchTab =
      tab === "All" ||
      (tab === "Normal"   && priorityUpper === "NORMAL") ||
      (tab === "Urgent"   && (priorityUpper === "URGENT" || priorityUpper === "HIGH")) ||
      (tab === "Critical" && (priorityUpper === "CRITICAL" || priorityUpper === "URGENT"));

    const q = search.toLowerCase();
    const matchQ =
      (r.employee || "").toLowerCase().includes(q) ||
      (r.destination || "").toLowerCase().includes(q) ||
      (r.id || "").toLowerCase().includes(q) ||
      (r.purpose || "").toLowerCase().includes(q);

    return matchTab && matchQ;
  }), [requests, tab, search]);

  // Calculate statistics
  // Pending assignment: requests in APPROVED state (driver not assigned yet)
  const pendingAssignCount = useMemo(() => requests.filter(
    (r) => {
      const isUrgent = (r.priority || "").toUpperCase() === "URGENT" || (r.priority || "").toUpperCase() === "CRITICAL";
      return (
        r.rawStatus === "approved_department" ||
        r.rawStatus === "assigned_by_ga" ||
        (isUrgent && r.rawStatus === "submitted") ||
        (r.rawStatus === "driver_assigned" && r.driverName === "Not Assigned")
      );
    }
  ).length, [requests]);

  const activeTripCount = useMemo(() => requests.filter((r) => r.rawStatus === "on_going").length, [requests]);

  const criticalCount = useMemo(() => requests.filter(
    (r) => (r.priority || "").toUpperCase() === "CRITICAL" || (r.priority || "").toUpperCase() === "URGENT"
  ).length, [requests]);

  const urgentCount = useMemo(() => requests.filter(
    (r) => (r.priority || "").toUpperCase() === "URGENT" || (r.priority || "").toUpperCase() === "HIGH"
  ).length, [requests]);

  const isApprover = user?.role === "approver";

  return (
    <Layout
      activeNav={isApprover ? "Driver Assignment" : "Requests"}
      topbarTitle={isApprover ? "Driver Assignment" : "GAHRD Driver Assignment"}
      userName={user?.name || "GAHRD User"}
      userRole={isApprover ? "Manager Approver" : "GA/HRD"}
      searchPlaceholder="Cari request..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-4 sm:p-8">

        <div data-guide="gahrd-requests" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="text-[18px] font-bold text-[#0f172a] mb-1">Driver Assignment Center</div>
            <div className="text-[13px] text-[#64748b] max-w-2xl">
              Tugaskan driver yang tersedia ke permintaan perjalanan operasional yang sudah disetujui, dan kelola koordinasi transportasi di seluruh organisasi.
            </div>
          </div>
          {!isApprover && (
            <button
              onClick={() => navigate("/gahrd/requests/urgent")}
              className="flex items-center gap-2 h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Icon name="add_alert" className="text-[17px]" /> Urgent Request
            </button>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Pending */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
              <Icon name="pending_actions" className="text-[22px] text-[#3b82f6]" />
            </div>
            <div>
              <div className="text-[12px] text-[#64748b] font-medium">Menunggu Driver</div>
              <div className="text-[22px] font-bold text-[#0f172a]">{pendingAssignCount}</div>
            </div>
          </div>
          {/* Available drivers */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
              <Icon name="commute" className="text-[22px] text-[#16a34a]" />
            </div>
            <div>
              <div className="text-[12px] text-[#64748b] font-medium">Driver Tersedia</div>
              <div className="text-[22px] font-bold text-[#0f172a]">{readyDrivers.length}</div>
            </div>
          </div>
          {/* Active trips */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#1e3a8a] flex items-center justify-center flex-shrink-0">
              <Icon name="route" className="text-[22px] text-white" />
            </div>
            <div>
              <div className="text-[12px] text-[#64748b] font-medium">Trip Aktif</div>
              <div className="text-[22px] font-bold text-[#0f172a]">{activeTripCount}</div>
            </div>
          </div>
          {/* Critical */}
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#fecaca] flex items-center justify-center flex-shrink-0">
              <Icon name="error" className="text-[22px] text-[#dc2626]" />
            </div>
            <div>
              <div className="text-[12px] text-[#dc2626] font-semibold">Tingkat Kritis</div>
              <div className="text-[22px] font-bold text-[#dc2626]">{criticalCount}</div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="w-full space-y-5">
          {/* Tab filter */}
          <div className="overflow-x-auto max-w-full mb-5">
            <div className="flex gap-1 bg-white border border-[#e2e8f0] rounded-xl p-1 w-fit shadow-sm">
              {(["All", "Normal", "Urgent", "Critical"] as TabFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 h-9 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tab === t ? "bg-[#1e3a8a] text-white shadow-sm" : "text-[#64748b] hover:text-[#334155]"
                  }`}
                >
                  {t}
                  {t === "Urgent" && urgentCount > 0 && (
                    <span className={`w-2 h-2 rounded-full ${tab === "Urgent" ? "bg-white" : "bg-[#f97316]"}`} />
                  )}
                  {t === "Critical" && criticalCount > 0 && (
                    <span className={`w-2 h-2 rounded-full ${tab === "Critical" ? "bg-white" : "bg-[#dc2626]"}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Request list */}
          {loading ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-3" />
              <p className="text-[13px] text-[#64748b] font-medium">Memuat data permintaan...</p>
            </div>
          ) : error ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-3 text-red-600 text-[13.5px] font-semibold">
              <Icon name="error" className="text-[20px]" />
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl py-20 flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Icon name="inbox" className="text-3xl text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">Belum Ada Permintaan</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Tidak ada data permintaan kendaraan yang sesuai dengan filter atau pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((req) => {
                const isUrgentReq = (req.priority || "").toUpperCase() === "URGENT" || (req.priority || "").toUpperCase() === "CRITICAL";
                const showAssign =
                  req.rawStatus === "approved_department" ||
                  req.rawStatus === "assigned_by_ga" ||
                  req.rawStatus === "approved_hrd" ||
                  req.rawStatus === "approved_hrd_ga" ||
                  (isUrgentReq && req.rawStatus === "submitted") ||
                  (req.rawStatus === "driver_assigned" && req.driverName === "Not Assigned");
                const isPendingDeptHead = req.rawStatus === "submitted" && !isUrgentReq;
                const showCancel = req.rawStatus === "waiting_driver";
                const canCancelRequest = ["submitted", "approved_department", "waiting_driver", "driver_assigned"].includes(req.rawStatus);
                const showEdit =
                  (req.rawStatus === "waiting_driver" && !req.all_drivers_approved) ||
                  (req.is_external && ["assigned_by_ga", "on_going", "completed"].includes(req.rawStatus));

                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setDetailRequest(req);
                      setIsDetailModalOpen(true);
                    }}
                    className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden hover:border-[#1e3a8a] hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-[#f8fafc] bg-[#fafbfc]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a] font-bold text-[14px]">
                          {req.employee ? req.employee.charAt(0).toUpperCase() : "E"}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-bold text-[#0f172a] tracking-wide">{req.employee}</div>
                          <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">
                            REQUEST #{req.id} • {req.department}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriBadge p={req.priority} />
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(req.status)}`}>
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Tujuan Perjalanan</div>
                        <div className="flex items-center gap-1 text-[13.5px] font-semibold text-[#0f172a]">
                          <Icon name="location_on" className="text-[16px] text-blue-500" />
                          {req.destination}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Jadwal Keberangkatan</div>
                        <div className="text-[13px] font-semibold text-[#334155]">{req.date || "-"}</div>
                        <div className="text-[11px] text-[#94a3b8]">{req.time || "09:00"}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Keperluan & Penumpang</div>
                        <div className="text-[12.5px] text-[#475569] italic">"{req.purpose}"</div>
                        <div className="text-[11px] font-medium text-[#64748b] mt-1">
                          {req.passengerCount} Penumpang
                        </div>
                      </div>
                    </div>

                    {/* Info on Assigned Driver/Vehicle & Ticket QR */}
                    {(req.driverName !== "Not Assigned" || req.vehicleModel !== "Not Assigned" || req.qr_code_token) && (
                      <div className="px-6 py-2.5 bg-[#f8fafc] border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-4 text-[12px]">
                        <div className="flex items-center gap-6">
                          {req.driverName !== "Not Assigned" && (
                            <span className="text-[#475569]">
                              <strong>Driver:</strong> {req.driverName}
                            </span>
                          )}
                          {req.vehicleModel !== "Not Assigned" && (
                            <span className="text-[#475569]">
                              <strong>Kendaraan:</strong> {req.vehicleModel}
                            </span>
                          )}
                        </div>
                        {req.qr_code_token && (
                          ["driver_assigned", "on_going"].includes(req.rawStatus) ||
                          (req.is_external && req.rawStatus === "assigned_by_ga")
                        ) && (
                          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-3xs">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${req.qr_code_token}`)}`}
                              alt="Ticket QR Code"
                              className="w-6 h-6 object-contain"
                            />
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              {req.qr_code_token}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-6 pb-5 pt-3 border-t border-[#f8fafc] flex flex-wrap items-center justify-end gap-2">
                      {isPendingDeptHead && (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11.5px] font-bold rounded-xl flex items-center gap-1.5">
                          <Icon name="hourglass_empty" className="text-[15px]" />
                          Menunggu Persetujuan K.Dep Asal
                        </span>
                      )}

                      {showAssign && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignModal(req);
                          }}
                          disabled={actionLoading}
                          className="px-5 h-9 bg-green-600 text-white text-[12.5px] font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Icon name="person_add" className="text-[16px]" />
                          Tugaskan Driver
                        </button>
                      )}

                      {showEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignModal(req);
                          }}
                          disabled={actionLoading}
                          className="px-5 h-9 bg-[#1e3a8a] text-white text-[12.5px] font-bold rounded-xl hover:bg-[#1d4ed8] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Icon name="edit" className="text-[16px]" />
                          Edit Penugasan
                        </button>
                      )}

                      {showCancel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCancelConfirmRequestId(req.id);
                          }}
                          disabled={actionLoading}
                          className="px-5 h-9 bg-white border border-red-200 text-red-600 text-[12.5px] font-bold rounded-xl hover:bg-red-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Icon name="cancel" className="text-[16px]" />
                          Batalkan Penugasan
                        </button>
                      )}

                      {canCancelRequest && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteReason("");
                            setDeleteConfirmRequestId(req.id);
                          }}
                          disabled={actionLoading}
                          className="px-5 h-9 bg-white border border-red-200 text-red-600 text-[12.5px] font-bold rounded-xl hover:bg-red-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Icon name="delete" className="text-[16px]" />
                          Batalkan Pengajuan
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailRequest(req);
                          setIsDetailModalOpen(true);
                        }}
                        className="w-9 h-9 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                      >
                        <Icon name="info" className="text-[18px] text-[#64748b]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc] flex-shrink-0">
              <h3 className="text-[15px] font-bold text-[#0f172a]">
                {(selectedRequest?.driverName !== "Not Assigned" || selectedRequest?.vehicleModel !== "Not Assigned")
                  ? `Edit Penugasan Driver & Kendaraan ke Request #${selectedRequest?.id}`
                  : `Tugaskan Driver & Kendaraan ke Request #${selectedRequest?.id}`
                }
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b] cursor-pointer">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

              {assignError && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {assignError}
                </div>
              )}

              {selectedRequest?.passengerCount > 6 && !isExternal && (availableVehicles.length < 2 || availableDrivers.length < 2) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-900 text-[12px]">
                  <div className="flex items-center gap-2 font-bold min-w-0">
                    <Icon name="warning" className="text-amber-600 text-lg flex-shrink-0" />
                    <span>Perhatian: Stok armada/driver internal yang tersedia ({availableVehicles.length} mobil & {availableDrivers.length} driver) kurang untuk 2 mobil.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExternal(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer shadow-xs transition-all"
                  >
                    Ganti ke Sewa Pihak Ke-3
                  </button>
                </div>
              )}

              {/* Konfirmasi Prioritas */}
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Konfirmasi Prioritas</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => {
                    setSelectedPriority(e.target.value);
                    if (e.target.value === "Urgent" || e.target.value === "Critical") {
                      setIsExternal(false);
                    }
                  }}
                  disabled={isEdit}
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Multi-Day Segmented Assignment Mode */}
              {selectedRequest?.itineraries && selectedRequest.itineraries.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-900 text-[12.5px] font-bold">
                    <Icon name="calendar_month" className="text-blue-600 text-xl" />
                    <div>
                      <div>Penugasan Harian (Multi-Day Segmented Assignment)</div>
                      <div className="text-[11px] text-blue-700 font-normal">Tentukan Driver/Mobil internal atau Sewa Pihak Ke-3 untuk tiap tanggal perjalanan.</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {dailyAssignments.map((asg, idx) => {
                      const itDate = asg.date;
                      // Filter drivers available for this specific date
                      const dateAvailableDrivers = drivers.filter(d => {
                        if (d.status !== "AVAILABLE" && String(d.id) !== String(asg.driver_id)) return false;
                        // Check if driver has other assignment on itDate
                        const isBusy = requests.some(r => {
                          if (String(r.id) === String(selectedRequest.id)) return false;
                          if (["completed", "rejected", "cancelled"].includes(r.rawStatus)) return false;
                          if (r.startTime && r.startTime.substring(0, 10) === itDate && String(r.driverId) === String(d.id)) return true;
                          return false;
                        });
                        return !isBusy;
                      });

                      const dateAvailableVehicles = vehicles.filter(v => {
                        if (v.status !== "AVAILABLE" && String(v.id) !== String(asg.vehicle_id)) return false;
                        const isBusy = requests.some(r => {
                          if (String(r.id) === String(selectedRequest.id)) return false;
                          if (["completed", "rejected", "cancelled"].includes(r.rawStatus)) return false;
                          if (r.startTime && r.startTime.substring(0, 10) === itDate && String(r.vehicleId) === String(v.id)) return true;
                          return false;
                        });
                        return !isBusy;
                      });

                      return (
                        <div key={asg.itinerary_id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="font-extrabold text-[#00236f] text-[13px] flex items-center gap-1.5">
                              <Icon name="event" className="text-blue-600 text-base" />
                              Hari ke-{idx + 1}: {itDate ? new Date(itDate).toLocaleDateString("id-ID", { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }) : `Hari ${idx+1}`}
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] font-bold text-slate-600 cursor-pointer flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={asg.is_external}
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    setDailyAssignments(prev => prev.map((item, i) => i === idx ? { ...item, is_external: checked } : item));
                                  }}
                                  className="rounded text-blue-600"
                                />
                                Sewa Pihak Ke-3
                              </label>
                            </div>
                          </div>

                          {asg.is_external ? (
                            /* External Inputs for this date */
                            <div className="space-y-2 text-[12px] bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                              <div className="font-bold text-purple-900 text-[11px]">Mobil Sewa Pihak Ke-3 ({itDate})</div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={asg.external_driver_name}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setDailyAssignments(prev => prev.map((item, i) => i === idx ? { ...item, external_driver_name: val } : item));
                                  }}
                                  placeholder="Nama Driver Sewa"
                                  className="h-8 px-2 border border-slate-200 rounded-lg text-[11.5px] bg-white"
                                />
                                <input
                                  type="text"
                                  value={asg.external_license_plate}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setDailyAssignments(prev => prev.map((item, i) => i === idx ? { ...item, external_license_plate: val } : item));
                                  }}
                                  placeholder="Plat Nomor"
                                  className="h-8 px-2 border border-slate-200 rounded-lg text-[11.5px] bg-white"
                                />
                                <input
                                  type="text"
                                  value={asg.third_party_cost}
                                  onChange={e => {
                                    const val = formatNumberIndonesian(e.target.value);
                                    setDailyAssignments(prev => prev.map((item, i) => i === idx ? { ...item, third_party_cost: val } : item));
                                  }}
                                  placeholder="Biaya Sewa (Rp)"
                                  className="h-8 px-2 border border-slate-200 rounded-lg text-[11.5px] bg-white"
                                />
                              </div>
                            </div>
                          ) : (
                            /* Internal Fleet Dropdowns for this date */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver Internal ({itDate})</label>
                                <select
                                  value={asg.driver_id}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setDailyAssignments(prev => prev.map((item, i) => i === idx ? { ...item, driver_id: val } : item));
                                  }}
                                  className="w-full h-9 px-2 border border-slate-200 rounded-xl text-[12px] bg-white focus:outline-none"
                                >
                                  <option value="">-- Pilih Driver --</option>
                                  {dateAvailableDrivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobil Internal ({itDate})</label>
                                <select
                                  value={asg.vehicle_id}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setDailyAssignments(prev => prev.map((item, i) => i === idx ? { ...item, vehicle_id: val } : item));
                                  }}
                                  className="w-full h-9 px-2 border border-slate-200 rounded-xl text-[12px] bg-white focus:outline-none"
                                >
                                  <option value="">-- Pilih Mobil --</option>
                                  {dateAvailableVehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Single Day Request Form */
                <div className="space-y-4">
                  {/* Internal vs External Toggle */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Penyedia Kendaraan</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-[13px] text-slate-700 font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="fleet_type"
                          checked={!isExternal}
                          onChange={() => setIsExternal(false)}
                          disabled={isEdit}
                          className="text-[#1e3a8a] focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        Armada Internal
                      </label>
                      
                      <label className="flex items-center gap-2 text-[13px] font-medium text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="fleet_type"
                          checked={isExternal}
                          onChange={() => setIsExternal(true)}
                          disabled={isEdit}
                          className="text-[#1e3a8a] focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        Pihak Ketiga (Sewa Eksternal)
                      </label>
                    </div>
                    {(selectedPriority === "Urgent" || selectedPriority === "Critical") ? (
                      <p className="text-[10px] text-blue-600 font-semibold mt-1">
                        *Prioritas Urgent / Critical dapat menggunakan pihak ketiga jika armada internal penuh.
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        *Gunakan pihak ketiga jika armada internal penuh/tidak mencukupi.
                      </p>
                    )}
                  </div>

                  {isExternal ? (
                    /* Fields for Third Party */
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                      <div className="text-[12px] font-bold text-blue-800">Detail Sewa Pihak Ketiga</div>
                      <div>
                        <label className="block text-[11px] font-bold text-blue-700 mb-1">Nama Provider / Vendor</label>
                        <input
                          type="text"
                          required
                          value={externalProvider}
                          onChange={(e) => setExternalProvider(e.target.value)}
                          placeholder="Contoh: TRAC, Golden Bird, Grab, dll"
                          disabled={isEdit}
                          className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-blue-700 mb-1">Tipe Perjalanan</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-[12.5px] text-slate-700 font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="external_trip_type"
                              checked={externalTripType === "round_trip"}
                              onChange={() => setExternalTripType("round_trip")}
                              disabled={isEdit}
                              className="text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            Pulang Pergi (PP)
                          </label>
                          <label className="flex items-center gap-2 text-[12.5px] text-slate-700 font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="external_trip_type"
                              checked={externalTripType === "one_way"}
                              onChange={() => setExternalTripType("one_way")}
                              disabled={isEdit}
                              className="text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            Sekali Jalan (Hanya Berangkat)
                          </label>
                        </div>
                      </div>

                      {externalTripType === "round_trip" ? (
                        /* PP: 1 Cost & 1 Fleet Info */
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-blue-700 mb-1">Biaya Sewa PP (Cost - Rp)</label>
                            <input
                              type="text"
                              required
                              value={thirdPartyCost}
                              onChange={(e) => setThirdPartyCost(formatNumberIndonesian(e.target.value))}
                              placeholder="Contoh: 600.000"
                              disabled={isEdit}
                              className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-blue-700 mb-1">Nama Driver</label>
                              <input
                                type="text"
                                value={externalDriverName}
                                onChange={(e) => setExternalDriverName(e.target.value)}
                                placeholder="Contoh: Budi Santoso"
                                disabled={isEdit}
                                className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-blue-700 mb-1">Plat Nomor</label>
                              <input
                                type="text"
                                value={externalLicensePlate}
                                onChange={(e) => setExternalLicensePlate(e.target.value)}
                                placeholder="Contoh: B 1234 CD"
                                disabled={isEdit}
                                className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-blue-700 mb-1">Detail Tambahan (Opsional)</label>
                            <input
                              type="text"
                              value={externalFleetInfo}
                              onChange={(e) => setExternalFleetInfo(e.target.value)}
                              placeholder="Contoh: Toyota Avanza Silver, HP: 0812..."
                              disabled={isEdit}
                              className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-blue-700 mb-1">Upload Foto / Dokumen Armada (Opsional)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setExternalPhoto(e.target.files[0]);
                                }
                              }}
                              disabled={isEdit}
                              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {externalPhoto && (
                              <p className="text-[10px] text-blue-800 font-semibold mt-1">
                                Terpilih: {externalPhoto.name} ({(externalPhoto.size / 1024).toFixed(1)} KB)
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Sekali Jalan: 2 Separate Fleet Infos & 2 Separate Costs */
                        <div className="space-y-4">
                          {/* 1. Armada Berangkat */}
                          <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-2">
                            <div className="text-[11.5px] font-bold text-blue-800 flex items-center gap-1">
                              <span>🚙</span> Armada Keberangkatan
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Biaya Berangkat (Rp)</label>
                              <input
                                type="text"
                                required
                                value={externalDepartureCost}
                                onChange={(e) => setExternalDepartureCost(formatNumberIndonesian(e.target.value))}
                                placeholder="Contoh: 300.000"
                                disabled={isEdit}
                                className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Nama Driver Berangkat</label>
                                <input
                                  type="text"
                                  value={externalDriverName}
                                  onChange={(e) => setExternalDriverName(e.target.value)}
                                  placeholder="Nama driver..."
                                  disabled={isEdit}
                                  className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div>
                                <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Plat Nomor Berangkat</label>
                                <input
                                  type="text"
                                  value={externalLicensePlate}
                                  onChange={(e) => setExternalLicensePlate(e.target.value)}
                                  placeholder="Plat nomor..."
                                  disabled={isEdit}
                                  className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Detail Tambahan Berangkat (Opsional)</label>
                              <input
                                type="text"
                                value={externalFleetInfo}
                                onChange={(e) => setExternalFleetInfo(e.target.value)}
                                placeholder="Model mobil, HP driver..."
                                disabled={isEdit}
                                className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Foto Armada Berangkat (Opsional)</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setExternalPhoto(e.target.files[0]);
                                  }
                                }}
                                disabled={isEdit}
                                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              {externalPhoto && (
                                <p className="text-[10px] text-blue-800 font-semibold mt-0.5">
                                  Terpilih: {externalPhoto.name}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 2. Armada Penjemputan */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <div className="text-[11.5px] font-bold text-slate-700 flex items-center gap-1">
                              <span>🔄</span> Armada Penjemputan / Pulang
                              <span className="text-[9.5px] font-normal text-slate-400 ml-1">(Opsional - Bisa diisi nanti saat Edit)</span>
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Biaya Penjemputan (Rp)</label>
                              <input
                                type="text"
                                value={externalReturnCost}
                                onChange={(e) => setExternalReturnCost(formatNumberIndonesian(e.target.value))}
                                placeholder="Contoh: 300.000"
                                className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Nama Driver Penjemputan</label>
                                <input
                                  type="text"
                                  value={externalReturnDriverName}
                                  onChange={(e) => setExternalReturnDriverName(e.target.value)}
                                  placeholder="Nama driver..."
                                  className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Plat Nomor Penjemputan</label>
                                <input
                                  type="text"
                                  value={externalReturnLicensePlate}
                                  onChange={(e) => setExternalReturnLicensePlate(e.target.value)}
                                  placeholder="Plat nomor..."
                                  className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Detail Tambahan Penjemputan (Opsional)</label>
                              <input
                                type="text"
                                value={externalReturnFleetInfo}
                                onChange={(e) => setExternalReturnFleetInfo(e.target.value)}
                                placeholder="Model mobil, HP driver..."
                                className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Foto Armada Penjemputan (Opsional)</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setExternalReturnPhoto(e.target.files[0]);
                                  }
                                }}
                                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-600 file:text-white hover:file:bg-slate-700 cursor-pointer"
                              />
                              {externalReturnPhoto && (
                                <p className="text-[10px] text-slate-700 font-semibold mt-0.5">
                                  Terpilih: {externalReturnPhoto.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Second external vehicle details if passenger count > 6 */}
                      {selectedRequest?.passengerCount > 6 && (
                        <div className="pt-4 border-t border-blue-200 space-y-3">
                          <div className="text-[12px] font-bold text-blue-800 flex justify-between">
                            <span>🚙 Detail Sewa Pihak Ketiga - Mobil Kedua (Opsional)</span>
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded">
                              Bisa 2 Kendaraan
                            </span>
                          </div>

                          {externalTripType === "round_trip" ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[11px] font-bold text-blue-700 mb-1">Biaya Sewa PP Mobil 2 (Cost - Rp)</label>
                                <input
                                  type="text"
                                  value={thirdPartyCost2}
                                  onChange={(e) => setThirdPartyCost2(formatNumberIndonesian(e.target.value))}
                                  placeholder="Contoh: 600.000"
                                  disabled={isEdit}
                                  className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-blue-700 mb-1">Nama Driver Mobil 2</label>
                                  <input
                                    type="text"
                                    value={externalDriverName2}
                                    onChange={(e) => setExternalDriverName2(e.target.value)}
                                    placeholder="Contoh: Doni"
                                    disabled={isEdit}
                                    className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-blue-700 mb-1">Plat Nomor Mobil 2</label>
                                  <input
                                    type="text"
                                    value={externalLicensePlate2}
                                    onChange={(e) => setExternalLicensePlate2(e.target.value)}
                                    placeholder="Contoh: B 5678 EF"
                                    disabled={isEdit}
                                    className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-blue-700 mb-1">Detail Tambahan Mobil 2 (Opsional)</label>
                                <input
                                  type="text"
                                  value={externalFleetInfo2}
                                  onChange={(e) => setExternalFleetInfo2(e.target.value)}
                                  placeholder="Contoh: Suzuki Ertiga, Hitam"
                                  disabled={isEdit}
                                  className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-blue-700 mb-1">Upload Foto / Dokumen Mobil 2 (Opsional)</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setExternalPhoto2(e.target.files[0]);
                                    }
                                  }}
                                  disabled={isEdit}
                                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50"
                                />
                                {externalPhoto2 && (
                                  <p className="text-[10px] text-blue-800 font-semibold mt-1">
                                    Terpilih: {externalPhoto2.name} ({(externalPhoto2.size / 1024).toFixed(1)} KB)
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-2">
                                <div className="text-[11.5px] font-bold text-blue-800">🚙 Armada Keberangkatan Mobil 2</div>
                                <div>
                                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Biaya Berangkat Mobil 2 (Rp)</label>
                                  <input
                                    type="text"
                                    value={externalDepartureCost2}
                                    onChange={(e) => setExternalDepartureCost2(formatNumberIndonesian(e.target.value))}
                                    placeholder="Contoh: 300.000"
                                    disabled={isEdit}
                                    className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Nama Driver Berangkat Mobil 2</label>
                                    <input
                                      type="text"
                                      value={externalDriverName2}
                                      onChange={(e) => setExternalDriverName2(e.target.value)}
                                      placeholder="Nama driver..."
                                      disabled={isEdit}
                                      className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Plat Nomor Berangkat Mobil 2</label>
                                    <input
                                      type="text"
                                      value={externalLicensePlate2}
                                      onChange={(e) => setExternalLicensePlate2(e.target.value)}
                                      placeholder="Plat nomor..."
                                      disabled={isEdit}
                                      className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Detail Tambahan Berangkat Mobil 2</label>
                                  <input
                                    type="text"
                                    value={externalFleetInfo2}
                                    onChange={(e) => setExternalFleetInfo2(e.target.value)}
                                    placeholder="Model mobil..."
                                    disabled={isEdit}
                                    className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Foto Armada Berangkat Mobil 2</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        setExternalPhoto2(e.target.files[0]);
                                      }
                                    }}
                                    disabled={isEdit}
                                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50"
                                  />
                                  {externalPhoto2 && (
                                    <p className="text-[10px] text-blue-800 font-semibold mt-0.5">
                                      Terpilih: {externalPhoto2.name}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <div className="text-[11.5px] font-bold text-slate-700">🔄 Armada Penjemputan Mobil 2</div>
                                <div>
                                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Biaya Penjemputan Mobil 2 (Rp)</label>
                                  <input
                                    type="text"
                                    value={externalReturnCost2}
                                    onChange={(e) => setExternalReturnCost2(formatNumberIndonesian(e.target.value))}
                                    placeholder="Contoh: 300.000"
                                    className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Nama Driver Penjemputan Mobil 2</label>
                                    <input
                                      type="text"
                                      value={externalReturnDriverName2}
                                      onChange={(e) => setExternalReturnDriverName2(e.target.value)}
                                      placeholder="Nama driver..."
                                      className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Plat Nomor Penjemputan Mobil 2</label>
                                    <input
                                      type="text"
                                      value={externalReturnLicensePlate2}
                                      onChange={(e) => setExternalReturnLicensePlate2(e.target.value)}
                                      placeholder="Plat nomor..."
                                      className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Detail Tambahan Penjemputan Mobil 2</label>
                                  <input
                                    type="text"
                                    value={externalReturnFleetInfo2}
                                    onChange={(e) => setExternalReturnFleetInfo2(e.target.value)}
                                    placeholder="Model mobil..."
                                    className="w-full h-9 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[12.5px] text-[#0f172a] focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Foto Armada Penjemputan Mobil 2</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        setExternalReturnPhoto2(e.target.files[0]);
                                      }
                                    }}
                                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-600 file:text-white hover:file:bg-slate-700 cursor-pointer"
                                  />
                                  {externalReturnPhoto2 && (
                                    <p className="text-[10px] text-slate-700 font-semibold mt-0.5">
                                      Terpilih: {externalReturnPhoto2.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-2.5 bg-blue-50 border border-blue-200/50 rounded-xl flex justify-between items-center text-blue-900 text-[12px] font-bold">
                        <span>Total Biaya Sewa (Semua Mobil):</span>
                        <span className="text-[13.5px] font-extrabold">
                          Rp {(
                            externalTripType === "round_trip"
                              ? cleanNumber(thirdPartyCost) + (selectedRequest?.passengerCount > 6 ? cleanNumber(thirdPartyCost2) : 0)
                              : cleanNumber(externalDepartureCost) + cleanNumber(externalReturnCost) + (selectedRequest?.passengerCount > 6 ? (cleanNumber(externalDepartureCost2) + cleanNumber(externalReturnCost2)) : 0)
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Internal Fleet Fields */
                    <div className="space-y-4">
                      {/* Estimasi Durasi (Hanya Internal) */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Estimasi Lama Perjalanan (Jam)</label>
                        <input
                          type="number"
                          required={!isExternal}
                          min="1"
                          value={estimatedDuration}
                          onChange={(e) => setEstimatedDuration(e.target.value)}
                          placeholder="Contoh: 3"
                          disabled={isEdit}
                          className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Set 1 & 2: Driver & Vehicle */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                        <div className="text-[12px] font-bold text-slate-800 flex justify-between">
                          <span>Kendaraan & Driver Utama</span>
                          {selectedRequest?.passengerCount > 6 && (
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                              Penumpang: {selectedRequest?.passengerCount} (Bisa 2 Kendaraan)
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#475569] mb-1">Driver</label>
                            <select
                              required={!isExternal}
                              value={selectedDriverId}
                              onChange={(e) => setSelectedDriverId(e.target.value)}
                              className="w-full h-10 px-2 border border-[#e2e8f0] rounded-xl text-[12.5px] bg-white focus:outline-none"
                            >
                              <option value="">-- Pilih Driver --</option>
                              {availableDrivers.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#475569] mb-1">Kendaraan</label>
                            <select
                              required={!isExternal}
                              value={selectedVehicleId}
                              onChange={(e) => setSelectedVehicleId(e.target.value)}
                              className="w-full h-10 px-2 border border-[#e2e8f0] rounded-xl text-[12.5px] bg-white focus:outline-none"
                              disabled={loadingVehicles}
                            >
                              {loadingVehicles ? (
                                <option value="">-- Memuat Mobil... --</option>
                              ) : (
                                <>
                                  <option value="">-- Pilih Mobil --</option>
                                  {vehicles.map((v) => (
                                    <option key={v.id} value={v.id}>{v.model || v.name} ({v.plate || v.plate_number})</option>
                                  ))}
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Optional Driver & Vehicle if passengerCount > 6 */}
                      {selectedRequest?.passengerCount > 6 && (
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                          <div className="text-[12px] font-bold text-[#1e3a8a]">Kendaraan & Driver Kedua (Opsional)</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-blue-700 mb-1">Driver Kedua</label>
                              <select
                                value={selectedDriverId2}
                                onChange={(e) => setSelectedDriverId2(e.target.value)}
                                className="w-full h-10 px-2 border border-blue-200 rounded-xl text-[12.5px] bg-white focus:outline-none"
                              >
                                <option value="">-- Tanpa Driver 2 --</option>
                                {(availableDrivers && availableDrivers.length > 0 ? availableDrivers : drivers).filter(d => String(d.id) !== String(selectedDriverId)).map((d) => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-blue-700 mb-1">Mobil Kedua</label>
                              <select
                                value={selectedVehicleId2}
                                onChange={(e) => setSelectedVehicleId2(e.target.value)}
                                className="w-full h-10 px-2 border border-blue-200 rounded-xl text-[12.5px] bg-[#fff] focus:outline-none"
                                disabled={loadingVehicles}
                              >
                                {loadingVehicles ? (
                                  <option value="">-- Memuat Mobil... --</option>
                                ) : (
                                  <>
                                    <option value="">-- Tanpa Mobil 2 --</option>
                                    {vehicles
                                      .filter(v => String(v.id) !== String(selectedVehicleId))
                                      .map((v) => (
                                        <option key={v.id} value={v.id}>{v.model || v.name} ({v.plate || v.plate_number})</option>
                                      ))}
                                  </>
                                )}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Catatan Penugasan (Opsional)</label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Contoh: Tolong bawa dokumen penting di bagasi..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="h-10 px-5 border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl text-[12.5px] font-bold text-[#475569] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    actionLoading || 
                    (selectedRequest?.itineraries && selectedRequest.itineraries.length > 0
                      ? dailyAssignments.length === 0 || dailyAssignments.some(asg => !asg.is_external && (!asg.driver_id || !asg.vehicle_id))
                      : (!isExternal && (!selectedDriverId || !selectedVehicleId))
                    )
                  }
                  className="h-10 px-6 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[12.5px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading 
                    ? "Menyimpan..." 
                    : (selectedRequest?.driverName !== "Not Assigned" || selectedRequest?.vehicleModel !== "Not Assigned")
                      ? "Simpan Perubahan"
                      : "Tugaskan Pengemudi"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Request Details Modal */}
      <RequestDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailRequest(null);
        }}
        request={detailRequest}
        onReject={handleReject}
      />

      {/* Custom Confirm Cancel Assignment Modal */}
      {cancelConfirmRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fadein p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-fadein">
            <button
              onClick={() => setCancelConfirmRequestId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-xl" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Icon name="warning" className="text-3xl" />
              </div>
              <h3 className="text-[17px] font-extrabold text-slate-800">Batalkan Penugasan Driver?</h3>
              <p className="text-xs text-slate-400 mt-2">
                Apakah Anda yakin ingin membatalkan penugasan driver dan kendaraan untuk request ini? Status request akan dikembalikan menjadi Submitted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCancelConfirmRequestId(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const reqId = cancelConfirmRequestId;
                  setCancelConfirmRequestId(null);
                  await handleCancelAssignment(reqId);
                }}
                className="flex-1 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm"
              >
                <Icon name="check" className="text-base" /> Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Cancel Request Modal */}
      {deleteConfirmRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fadein p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-fadein">
            <button
              onClick={() => { setDeleteConfirmRequestId(null); setDeleteReason(""); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-xl" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Icon name="warning" className="text-3xl" />
              </div>
              <h3 className="text-[17px] font-extrabold text-slate-800">Batalkan Pengajuan Request?</h3>
              <p className="text-xs text-slate-400 mt-2">
                Mohon masukkan alasan pembatalan. Status request akan diubah menjadi Cancelled.
              </p>
            </div>

            {/* Reason Input */}
            <div className="mb-5">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Alasan Pembatalan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Contoh: Jadwal diubah dari manajemen / Kunjungan ditunda..."
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">{deleteReason.trim().length}/500 karakter (min. 5)</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setDeleteConfirmRequestId(null); setDeleteReason(""); }}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading || deleteReason.trim().length < 5}
                onClick={async () => {
                  const reqId = deleteConfirmRequestId;
                  const reason = deleteReason.trim();
                  setDeleteConfirmRequestId(null);
                  setDeleteReason("");
                  await handleDeleteRequest(reqId, reason);
                }}
                className="flex-1 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <Icon name="check" className="text-base" /> Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Success Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 border border-slate-800 animate-fadein">
          <Icon name="check_circle" className="text-emerald-500 text-[20px]" />
          <span className="text-[13px] font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Build Stamp for Verification */}
      <div className="text-[10px] text-slate-400 text-right mt-4 pr-4 font-mono pb-4">
        Build Version: 2026-08-07-v21 (Auto Cache Clean & Smooth Workflow)
      </div>
    </Layout>
  );
}