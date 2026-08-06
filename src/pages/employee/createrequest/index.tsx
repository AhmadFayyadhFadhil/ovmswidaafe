// src/pages/employee/create-request/index.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout as RoleLayout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";
import { requestService } from "@/services/modules/requestService";
import { useAuthContext } from "@/auth/authContext";
import { apiClient } from "@/services/api/api";

import { departmentService } from "@/services/modules/departmentService";
import type { Department } from "@/services/modules/departmentService";

interface Props { onNavigate?: (page: string) => void; }

export default function CreateRequestPage({ onNavigate }: Props) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    departmentService.getAll().then(res => {
      if (res.data) setDepartments(res.data);
    }).catch(err => console.error("Failed to load departments", err));
  }, []);
  const [purpose,    setPurpose]    = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationPlace, setDestinationPlace] = useState("");
  const [departure,  setDeparture]  = useState("");
  const [estReturn,  setEstReturn]  = useState("");
  const [priority,   setPriority]   = useState("Normal");
  const [notes,      setNotes]      = useState("");
  const [itineraries, setItineraries] = useState<{
    date: string;
    morning_time: string;
    morning_destination: string;
    afternoon_time: string;
    afternoon_destination: string;
    passengers_notes: string;
  }[]>([]);
  const [passengers, setPassengers] = useState<{ name: string; department_id: string | number; user_id?: number | null; is_pic?: boolean }[]>([]);
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; email: string; department_id: string | number; department_name?: string }[]>([]);
  const [activePassengerIndex, setActivePassengerIndex] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const handlePassengerNameChange = (index: number, value: string) => {
    const next = [...passengers];
    next[index] = { ...next[index], name: value };
    setPassengers(next);

    if (!value.trim()) {
      setSuggestions([]);
      setActivePassengerIndex(null);
      return;
    }

    setActivePassengerIndex(index);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiClient.get(`/users-search?search=${encodeURIComponent(value)}`);
        if (res.data?.status === "success") {
          setSuggestions(res.data.data || []);
        }
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (passengerIndex: number, userItem: { id: number; name: string; department_id: string | number }) => {
    const isDuplicate = passengers.some((p, idx) => idx !== passengerIndex && p.name.trim().toLowerCase() === userItem.name.trim().toLowerCase());
    if (isDuplicate) {
      const next = [...passengers];
      next[passengerIndex] = { name: "", department_id: "" };
      setPassengers(next);
      setSuggestions([]);
      setActivePassengerIndex(null);
      alert("Penumpang tersebut sudah dipilih.");
      return;
    }

    const next = [...passengers];
    next[passengerIndex] = {
      name: userItem.name,
      department_id: userItem.department_id,
      user_id: userItem.id,
    };
    setPassengers(next);
    setSuggestions([]);
    setActivePassengerIndex(null);
  };

  const [files,      setFiles]      = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate itinerary rows when departure & estReturn span multiple days
  useEffect(() => {
    if (!departure || !estReturn) return;
    const depDateStr = departure.split('T')[0];
    const retDateStr = estReturn.split('T')[0];
    if (!depDateStr || !retDateStr || depDateStr >= retDateStr) {
      setItineraries([]);
      return;
    }

    const start = new Date(depDateStr);
    const end = new Date(retDateStr);
    const dateList: string[] = [];

    let curr = new Date(start);
    while (curr <= end) {
      dateList.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    setItineraries(prev => {
      return dateList.map((d, idx) => {
        const existing = prev.find(item => item.date === d);
        if (existing) return existing;
        return {
          date: d,
          morning_time: idx === 0 ? (departure.split('T')[1]?.substring(0, 5) || "08:00") : "08:00",
          morning_destination: destinationPlace || "",
          afternoon_time: idx === dateList.length - 1 ? (estReturn.split('T')[1]?.substring(0, 5) || "16:00") : "16:00",
          afternoon_destination: destinationPlace || "",
          passengers_notes: "",
        };
      });
    });
  }, [departure, estReturn]);

  const [formError,  setFormError]  = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const [minLeadTimeHours, setMinLeadTimeHours] = useState(24);

  useEffect(() => {
    const cached = localStorage.getItem("ovms_branding_config");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.minLeadTimeHours !== undefined && parsed.minLeadTimeHours !== null) {
          setMinLeadTimeHours(parsed.minLeadTimeHours);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handlePreSubmitCheck = () => {
    if (!purpose || !destinationCity || !destinationPlace || !departure || !estReturn) {
      const errMsg = "Tujuan perjalanan, kota, tempat tujuan, waktu keberangkatan, dan estimasi waktu kembali wajib diisi.";
      setFormError(errMsg);
      showAlert(errMsg);
      return;
    }

    const depDate = new Date(departure);
    const now = new Date();
    const diffHours = (depDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    const isGAUser = user?.role === "gahrd" || user?.role === "admin";
    if (!isGAUser && diffHours < (minLeadTimeHours - 0.25)) {
      const errMsg = "Waktu keberangkatan kurang dari 24 jam. Silakan menghubungi GA KOORDINATOR (Bu Melodi) untuk pengajuan urgent.";
      setFormError(errMsg);
      showAlert(errMsg);
      return;
    }

    const retDate = new Date(estReturn);
    if (retDate <= depDate) {
      const errMsg = "Waktu kembali harus setelah waktu keberangkatan.";
      setFormError(errMsg);
      showAlert(errMsg);
      return;
    }

    // Passengers validation
    const validPassengers = passengers.filter(p => p.name.trim() !== "");
    if (validPassengers.length === 0) {
      const errMsg = "Penumpang wajib diisi. Silakan tambahkan minimal satu penumpang.";
      setFormError(errMsg);
      showAlert(errMsg);
      return;
    }

    const hasEmptyField = passengers.some(p => !p.name.trim() || !p.department_id);
    if (hasEmptyField) {
      const errMsg = "Silakan lengkapi nama dan departemen untuk setiap penumpang yang ditambahkan.";
      setFormError(errMsg);
      showAlert(errMsg);
      return;
    }

    setFormError("");
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!purpose || !destinationCity || !destinationPlace || !departure || !estReturn) {
      const errMsg = "Tujuan perjalanan, kota, tempat tujuan, waktu keberangkatan, dan estimasi waktu kembali wajib diisi.";
      setFormError(errMsg);
      showAlert(errMsg);
      return;
    }

    const validPassengers = passengers.filter(p => p.name.trim() !== "");
    if (validPassengers.length === 0) {
      const errMsg = "Penumpang wajib diisi. Silakan tambahkan minimal satu penumpang.";
      setFormError(errMsg);
      showAlert(errMsg);
      return;
    }

    const hasEmptyField = passengers.some(p => !p.name.trim() || !p.department_id);
    if (hasEmptyField) {
      const errMsg = "Silakan lengkapi nama dan departemen untuk setiap penumpang yang ditambahkan.";
      setFormError(errMsg);
      showAlert(errMsg);
      return;
    }

    const passengerNames = validPassengers.map(p => p.name.trim().toLowerCase());
    const hasDuplicateName = passengerNames.some((val, i) => passengerNames.indexOf(val) !== i);
    if (hasDuplicateName) {
      const errMsg = "Nama penumpang tidak boleh diduplikasi dalam satu pengajuan.";
      setFormError(errMsg);
      showAlert(errMsg);
      return;
    }

    setIsConfirmOpen(false);
    setSubmitting(true);
    try {
      const formatDateTimeForBackend = (dtStr: string): string => {
        if (!dtStr) return '';
        const d = new Date(dtStr);
        if (isNaN(d.getTime())) {
          return dtStr.includes('T') ? dtStr.replace('T', ' ').substring(0, 19) : dtStr;
        }
        const YYYY = d.getFullYear();
        const MM = String(d.getMonth() + 1).padStart(2, '0');
        const DD = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
      };

      const formattedStartTime = formatDateTimeForBackend(departure);
      const formattedEndTime = estReturn ? formatDateTimeForBackend(estReturn) : null;

      const firstDeptId = validPassengers[0]?.department_id;
      let parsedMainDeptId: any = null;
      if (firstDeptId) {
        const num = Number(firstDeptId);
        parsedMainDeptId = !isNaN(num) && num > 0 ? num : firstDeptId;
      } else if ((user as any)?.department_id) {
        const num = Number((user as any).department_id);
        parsedMainDeptId = !isNaN(num) && num > 0 ? num : (user as any).department_id;
      }

      const payload: any = {
        purpose,
        destination_city: destinationCity,
        destination_place: destinationPlace,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        passenger_count: validPassengers.length,
        priority,
        department_id: parsedMainDeptId,
        notes: notes || null,
        passengers: validPassengers.map((p, idx) => {
          let deptIdVal: any = null;
          if (p.department_id) {
            const num = Number(p.department_id);
            deptIdVal = !isNaN(num) && num > 0 ? num : p.department_id;
          }
          return {
            name: p.name,
            department_id: deptIdVal,
            user_id: p.user_id || null,
            is_pic: p.is_pic || (!validPassengers.some(px => px.is_pic) && idx === 0)
          };
        }),
        itineraries: itineraries.length > 0 ? itineraries : undefined,
        itinerary_file: (files && files.length > 0) ? files[0] : undefined,
      };

      const response = await requestService.create(payload);
      if (response.data?.id && files.length > 0) {
        const fileMetaPromises = files.map(async f => {
          try {
            const dataUrl = f.size < 1.5 * 1024 * 1024 ? await fileToBase64(f) : "";
            return { name: f.name, size: f.size, type: f.type, dataUrl };
          } catch (e) {
            return { name: f.name, size: f.size, type: f.type, dataUrl: "" };
          }
        });
        const fileMeta = await Promise.all(fileMetaPromises);
        localStorage.setItem(`request_attachments_${response.data.id}`, JSON.stringify(fileMeta));
      }
      setSubmitted(true);
      setTimeout(() => navigate("/employee/myrequests"), 1500);
    } catch (err: any) {
      console.error("Create request error:", err);
      let errMsg = "";
      
      if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.response?.data?.errors && typeof err.response.data.errors === "object") {
        const errs = err.response.data.errors;
        const firstKey = Object.keys(errs)[0];
        if (firstKey && Array.isArray(errs[firstKey]) && errs[firstKey][0]) {
          errMsg = errs[firstKey][0];
        } else if (typeof errs === "string") {
          errMsg = errs;
        }
      } else if (err.response?.data?.error) {
        errMsg = err.response.data.error;
      } else if (err.message) {
        errMsg = err.message;
      }

      if (!errMsg || errMsg === "Server Error" || errMsg === "Request failed with status code 500" || errMsg === "Request failed with status code 422") {
        if (err.response?.status === 401) {
          errMsg = "Sesi Anda telah berakhir. Silakan re-login untuk melanjutkan pengajuan.";
        } else if (err.response?.status === 403) {
          errMsg = "Akun Anda tidak memiliki izin untuk membuat pengajuan. Silakan hubungi GA Koordinator.";
        } else if (err.response?.status === 422) {
          errMsg = "Data pengajuan belum sesuai format. Silakan periksa kembali kelengkapan tanggal dan data penumpang.";
        } else {
          errMsg = "Terjadi kendala pada server API saat menyimpan pengajuan. Silakan coba beberapa saat lagi.";
        }
      }
      setFormError(errMsg);
      showAlert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  return (
    <RoleLayout
      activeNav="Create Request"
      onNavigate={p => onNavigate?.(p)}
      topbarTitle="Create Fleet Request"
      userName={user?.name || "Employee"}
      userRole={user?.role === "approver" ? "Manager Approver" : "Employee"}
      searchPlaceholder="Search requests, vehicles..."
    >
      <div className="p-4 sm:p-6 animate-fadeup">


        {/* Page Header */}
        <div className="max-w-4xl mx-auto mb-6">
          <h2 className="text-[26px] font-bold text-[#0f172a]">Create Vehicle Request</h2>
          <p className="text-[13px] text-[#64748b] mt-1">Submit operational transportation requests efficiently for internal company activities.</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
            {formError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[13px] font-semibold flex items-center gap-2 border border-red-100 shadow-sm">
                <Icon name="error" className="text-[18px]" />
                {formError}
              </div>
            )}

            {/* 1. Request Information */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-[#e5eeff] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="info" className="text-[#00236f] text-[20px]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Request Information</h3>
                  <p className="text-[12px] text-[#64748b]">Basic details about the purpose of your transportation request.</p>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Purpose of Trip</label>
                <input
                  value={purpose} onChange={e => setPurpose(e.target.value)}
                  placeholder="e.g. Client Site Visit - Tech Park"
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all"
                />
              </div>
            </div>

            {/* 2. Destination & Schedule */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-[#ffd9d5] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="location_on" className="text-[#ba1a1a] text-[20px]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Destination &amp; Schedule</h3>
                  <p className="text-[12px] text-[#64748b]">Specify where and when you need the vehicle.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Destination City <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Icon name="location_city" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px]" />
                      <input
                        required
                        value={destinationCity} onChange={e => setDestinationCity(e.target.value)}
                        placeholder="e.g. Jakarta"
                        className="w-full h-10 pl-9 pr-4 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Destination Place <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Icon name="location_on" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px]" />
                      <input
                        required
                        value={destinationPlace} onChange={e => setDestinationPlace(e.target.value)}
                        placeholder="e.g. Sudirman Office"
                        className="w-full h-10 pl-9 pr-4 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Departure Date &amp; Time <span className="text-red-500">*</span></label>
                    <input type="datetime-local" value={departure} onChange={e => setDeparture(e.target.value)}
                      className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Estimated Return <span className="text-red-500">*</span></label>
                    <input type="datetime-local" value={estReturn} onChange={e => setEstReturn(e.target.value)}
                      className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all">
                    {["Normal", "Urgent", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Multi-Day Daily Itinerary Builder & Upload Attachment (Only if multi-day) */}
            {itineraries.length > 0 && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-[#00236f] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon name="calendar_month" className="text-[22px]" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#0f172a] flex items-center gap-2">
                        Rincian Itinerary Per-Hari
                        <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                          {itineraries.length} Hari
                        </span>
                      </h3>
                      <p className="text-[12px] text-[#64748b]">Atur rincian waktu dan tujuan per-sesi untuk setiap tanggal perjalanan.</p>
                    </div>
                  </div>
                </div>

                {/* Daily Rows */}
                <div className="space-y-3 pt-1">
                  {itineraries.map((it, idx) => (
                    <div key={it.date} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-[12px] font-extrabold text-[#00236f] uppercase tracking-wider flex items-center gap-1.5">
                          <Icon name="event" className="text-base text-blue-600" />
                          Hari ke-{idx + 1}: {new Date(it.date).toLocaleDateString("id-ID", { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                        {/* Schedule 1 */}
                        <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="font-bold text-slate-700 text-[11.5px]">
                            Jadwal / Sesi 1
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="time"
                              value={it.morning_time}
                              onChange={e => {
                                const val = e.target.value;
                                setItineraries(prev => prev.map((item, i) => i === idx ? { ...item, morning_time: val } : item));
                              }}
                              className="col-span-1 h-8 px-2 border border-slate-200 rounded-md text-[11.5px] bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={it.morning_destination}
                              onChange={e => {
                                const val = e.target.value;
                                setItineraries(prev => prev.map((item, i) => i === idx ? { ...item, morning_destination: val } : item));
                              }}
                              placeholder="Tujuan 1 (misal: Pabrik / Site)"
                              className="col-span-2 h-8 px-2 border border-slate-200 rounded-md text-[11.5px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {/* Schedule 2 */}
                        <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="font-bold text-slate-700 text-[11.5px]">
                            Jadwal / Sesi 2
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="time"
                              value={it.afternoon_time}
                              onChange={e => {
                                const val = e.target.value;
                                setItineraries(prev => prev.map((item, i) => i === idx ? { ...item, afternoon_time: val } : item));
                              }}
                              className="col-span-1 h-8 px-2 border border-slate-200 rounded-md text-[11.5px] bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={it.afternoon_destination}
                              onChange={e => {
                                const val = e.target.value;
                                setItineraries(prev => prev.map((item, i) => i === idx ? { ...item, afternoon_destination: val } : item));
                              }}
                              placeholder="Tujuan 2 (misal: Hotel / Bandara)"
                              className="col-span-2 h-8 px-2 border border-slate-200 rounded-md text-[11.5px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Passengers */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-[#0f172a]">Passengers</h3>
                <button
                  onClick={() => setPassengers(p => [...p, { name: "", department_id: "" }])}
                  disabled={passengers.length >= 12}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-[#00236f] hover:underline disabled:opacity-40"
                >
                  <Icon name="person_add" className="text-[15px]" /> Add Passenger
                </button>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {passengers.length === 0 ? (
                  <p className="text-[12px] text-[#94a3b8] text-center py-4">No passengers added yet.</p>
                ) : (
                  passengers.map((p, i) => {
                    const filteredSuggestions = suggestions.filter(
                      (item) => !passengers.some((pOther, idx) => idx !== i && pOther.name.trim().toLowerCase() === item.name.trim().toLowerCase())
                    );
                    return (
                      <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={p.name}
                            onChange={e => handlePassengerNameChange(i, e.target.value)}
                            onFocus={() => {
                              if (p.name.trim()) {
                                handlePassengerNameChange(i, p.name);
                              }
                            }}
                          onBlur={() => {
                            setTimeout(() => {
                              setActivePassengerIndex(null);
                              setSuggestions([]);
                            }, 250);
                          }}
                          placeholder="Passenger Full Name"
                          className="w-full h-9 px-3 border border-[#e2e8f0] rounded-lg text-[12px] text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20"
                        />
                        {activePassengerIndex === i && (filteredSuggestions.length > 0 || searchLoading) && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                            {searchLoading ? (
                              <div className="p-3 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
                                <span className="animate-spin text-sm text-[#00236f] font-extrabold">&#x21bb;</span>
                                Searching...
                              </div>
                            ) : (
                              filteredSuggestions.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => handleSelectSuggestion(i, item)}
                                  className="px-3 py-2 text-[12px] text-slate-700 hover:bg-blue-50/50 hover:text-[#00236f] cursor-pointer flex justify-between items-center transition-all border-b border-slate-50 last:border-0"
                                  title={item.name}
                                >
                                  <span className="font-semibold">{item.name}</span>
                                  <span className="text-[10px] bg-blue-100/60 text-[#00236f] px-1.5 py-0.5 rounded-md font-bold uppercase">
                                    {item.department_name || item.department_id}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                          <button
                            type="button"
                            onClick={() => {
                              setPassengers(prev => prev.map((item, idx) => ({
                                ...item,
                                is_pic: idx === i
                              })));
                            }}
                            className={`px-2.5 h-9 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${
                              (p.is_pic || (!passengers.some(px => px.is_pic) && i === 0))
                                ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-sm'
                                : 'bg-white text-slate-500 border border-[#e2e8f0] hover:bg-amber-50/50 hover:text-amber-700'
                            }`}
                            title="Tunjuk sebagai PIC Penanggung Jawab Penumpang"
                          >
                             {(p.is_pic || (!passengers.some(px => px.is_pic) && i === 0)) ? 'PIC Penumpang' : 'Set PIC'}
                          </button>
                          <select
                            value={p.department_id}
                            onChange={e => {
                              const next = [...passengers];
                              next[i] = { ...next[i], department_id: e.target.value };
                              setPassengers(next);
                            }}
                            className="flex-1 min-w-0 h-9 px-2 border border-[#e2e8f0] rounded-lg text-[11.5px] text-[#0f172a] bg-white focus:outline-none truncate"
                          >
                            <option value="">Pilih Departemen</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => setPassengers(prev => prev.filter((_, j) => j !== i))}
                            className="p-1.5 text-[#94a3b8] hover:text-[#ef4444] rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 cursor-pointer"
                            title="Hapus Penumpang"
                          >
                            <Icon name="close" className="text-[18px]" />
                          </button>
                        </div>
                    </div>
                  );
                })
                )}
              </div>
              {passengers.length < 12 && (
                <p className="text-[11px] text-[#94a3b8] mt-2">+ {12 - passengers.length} more can be added</p>
              )}
            </div>

            {/* 4. Supporting Documents */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-[#e5eeff] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="attach_file" className="text-[#00236f] text-[20px]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Supporting Documents</h3>
                  <p className="text-[12px] text-[#64748b]">Upload meeting invites or travel authorization forms.</p>
                </div>
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging ? "border-[#00236f] bg-[#eff4ff]" : "border-[#e2e8f0] hover:border-[#b6c4ff] hover:bg-[#f8fafc]"
                }`}
              >
                <Icon name="cloud_upload" className="text-[#94a3b8] text-[40px] mb-2" />
                <p className="text-[13px] font-semibold text-[#475569]">Drag and drop files here</p>
                <p className="text-[11px] text-[#94a3b8] mt-1">PDF, PNG, JPG (Max 10MB)</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 h-9 px-5 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors"
                >Browse Files</button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} />
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                      <div className="flex items-center gap-2">
                        <Icon name="description" className="text-[#00236f] text-[18px]" />
                        <div>
                          <div className="text-[12px] font-semibold text-[#0f172a]">{f.name}</div>
                          <div className="text-[10px] text-[#94a3b8]">{(f.size / 1024 / 1024).toFixed(1)} MB</div>
                        </div>
                      </div>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        className="text-[#94a3b8] hover:text-[#ef4444] transition-colors">
                        <Icon name="close" className="text-[16px]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Additional Notes */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-bold text-[#0f172a]">Additional Notes (Optional)</h3>
                <span className="text-[11px] text-[#94a3b8]">{notes.length} / 500 characters</span>
              </div>
              <textarea
                value={notes} onChange={e => notes.length < 500 && setNotes(e.target.value)}
                rows={4}
                placeholder="Provide any additional instructions for the driver or fleet manager..."
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 resize-none transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 flex-wrap">
              <button
                onClick={handlePreSubmitCheck}
                disabled={!purpose || !destinationCity || !destinationPlace || !departure || submitting || submitted}
                className={`h-10 px-6 rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-sm ${
                  submitted ? "bg-[#1a6e3c] text-white" :
                  submitting ? "bg-[#0f2a5e]/70 text-white cursor-wait" :
                  "bg-[#0f2a5e] hover:bg-[#1e3a8a] text-white disabled:opacity-40"
                }`}
              >
                {submitted ? "✓ Submitted!" : submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>

        </div>
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs animate-fadein p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 w-full max-w-lg shadow-2xl relative animate-fadein">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-xl" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 text-[#0f2a5e] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="assignment_turned_in" className="text-3xl" />
              </div>
              <h3 className="text-[18px] font-extrabold text-slate-800">Cek Kembali Pengajuan Anda</h3>
              <p className="text-xs text-slate-400 mt-2">
                Pastikan detail informasi perjalanan dinas Anda sudah benar sebelum dikirimkan.
              </p>
            </div>

            {/* Request Summary details */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 mb-6 max-h-[300px] overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Keperluan / Tujuan:</span>
                <span className="font-semibold text-slate-800 text-left sm:text-right mt-0.5 sm:mt-0">{purpose}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Kota Tujuan:</span>
                <span className="font-semibold text-slate-800">{destinationCity}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Tempat Tujuan:</span>
                <span className="font-semibold text-slate-800">{destinationPlace}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Keberangkatan:</span>
                <span className="font-semibold text-slate-800">
                  {departure ? departure.replace("T", " ") : "-"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Estimasi Kembali:</span>
                <span className="font-semibold text-slate-800">
                  {estReturn ? estReturn.replace("T", " ") : "-"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Prioritas:</span>
                <span className={`font-extrabold ${priority === "Critical" ? "text-red-600" : priority === "Urgent" ? "text-amber-600" : "text-blue-600"}`}>{priority}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Jumlah Penumpang:</span>
                <span className="font-semibold text-slate-800">
                  {passengers.filter(p => p.name.trim() !== "").length} Pax
                </span>
              </div>
              {passengers.filter(p => p.name.trim() !== "").length > 0 && (
                <div className="border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-400 block mb-1">Daftar Penumpang:</span>
                  <div className="space-y-1 pl-2">
                    {passengers.filter(p => p.name.trim() !== "").map((p, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-500">
                        <span>• {p.name}</span>
                        <span className="font-bold uppercase text-[9px]">
                          {departments.find(d => String(d.id) === String(p.department_id))?.name || p.department_id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {files.length > 0 && (
                <div className="border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-400 block mb-1">Dokumen Lampiran:</span>
                  <div className="space-y-0.5 pl-2 text-[11px] text-slate-500">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>• {f.name}</span>
                        <span>({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="font-bold text-slate-400 block mb-1">Catatan Tambahan:</span>
                <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                  "{notes || "Tidak ada catatan tambahan."}"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3 bg-[#0f2a5e] text-white font-bold rounded-xl hover:bg-[#1e3a8a] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm"
              >
                <Icon name="check" className="text-base" /> Ya, Kirim
              </button>
            </div>
          </div>
        </div>
      )}
      {alertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs animate-fadein p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-scaleup text-center">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="error" className="text-3xl" />
            </div>
            <h3 className="text-[17px] font-extrabold text-slate-800">Pengajuan Ditolak</h3>
            <p className="text-[13px] font-semibold text-slate-500 mt-2 leading-relaxed">
              {alertMessage}
            </p>
            <button
              onClick={() => setAlertOpen(false)}
              className="mt-6 w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}