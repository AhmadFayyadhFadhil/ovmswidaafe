import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout as RoleLayout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";
import { requestService } from "@/services/modules/requestService";
import { useAuthContext } from "@/auth/authContext";
import { apiClient } from "@/services/api/api";
import { departmentService } from "@/services/modules/departmentService";
import type { Department } from "@/services/modules/departmentService";
import { driverService } from "@/services/modules/driverService";
import { vehicleService } from "@/services/modules/vehicleService";

export default function CreateUrgentRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [purpose, setPurpose] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationPlace, setDestinationPlace] = useState("");
  
  const getTodayTimeStr = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };
  const [departureTime, setDepartureTime] = useState(getTodayTimeStr());
  
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [isExternal, setIsExternal] = useState(false);
  const [externalTripType, setExternalTripType] = useState("round_trip");
  const [thirdPartyCost, setThirdPartyCost] = useState("0");
  const [externalDepartureCost, setExternalDepartureCost] = useState("0");
  const [externalReturnCost, setExternalReturnCost] = useState("0");
  const [externalFleetInfo, setExternalFleetInfo] = useState("");
  const [externalDriverName, setExternalDriverName] = useState("");
  const [externalLicensePlate, setExternalLicensePlate] = useState("");
  const [notes, setNotes] = useState("");
  const [passengers, setPassengers] = useState<{ name: string; department_id: string | number; user_id?: number | null }[]>([]);
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; email: string; department_id: string | number; department_name?: string }[]>([]);
  const [activePassengerIndex, setActivePassengerIndex] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    departmentService.getAll().then(res => {
      if (res.data) setDepartments(res.data);
    }).catch(err => console.error("Failed to load departments", err));

    driverService.getAll({ per_page: 1000 }).then(res => {
      const available = (res.data || []).filter((d: any) => d.status === "AVAILABLE" || d.status === "available");
      setDrivers(available);
    }).catch(err => console.error("Failed to load drivers", err));

    vehicleService.getAll({ per_page: 1000 }).then(res => {
      const available = (res.data || []).filter((v: any) => v.status === "AVAILABLE" || v.status === "available" || v.backendStatus === "Available");
      setVehicles(available);
    }).catch(err => console.error("Failed to load vehicles", err));
  }, []);

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

  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handlePreSubmitCheck = () => {
    if (!purpose || !destinationCity || !destinationPlace || !departureTime) {
      setFormError("Keperluan, kota tujuan, tempat tujuan, dan jam keberangkatan harus diisi.");
      return;
    }
    setFormError("");
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!purpose || !destinationCity || !destinationPlace || !departureTime) {
      setFormError("Keperluan, kota tujuan, tempat tujuan, dan jam keberangkatan harus diisi.");
      return;
    }
    setIsConfirmOpen(false);
    setSubmitting(true);
    setFormError("");

    try {
      const todayDate = getTodayDateStr();
      const startTime = `${todayDate} ${departureTime}:00`;
      const endTime = `${todayDate} 16:30:00`;

      const validPassengers = passengers.filter(p => p.name.trim() !== "");
      const payload = {
        purpose,
        destination_city: destinationCity,
        destination_place: destinationPlace,
        start_time: startTime,
        end_time: endTime,
        passenger_count: validPassengers.length > 0 ? validPassengers.length : 1,
        priority: "Urgent",
        notes: notes || null,
        passengers: validPassengers.map(p => ({
          name: p.name,
          department_id: p.department_id ? Number(p.department_id) : null,
          user_id: p.user_id || null
        })),
        driver_id: isExternal ? null : (selectedDriverId ? Number(selectedDriverId) : null),
        vehicle_id: isExternal ? null : (selectedVehicleId ? Number(selectedVehicleId) : null),
        is_external: isExternal,
        external_trip_type: isExternal ? externalTripType : null,
        third_party_cost: isExternal ? Number(thirdPartyCost) : null,
        external_departure_cost: isExternal ? Number(externalDepartureCost) : null,
        external_return_cost: isExternal ? Number(externalReturnCost) : null,
        external_fleet_info: isExternal ? externalFleetInfo : null,
        external_driver_name: isExternal ? externalDriverName : null,
        external_license_plate: isExternal ? externalLicensePlate : null,
      };

      await requestService.create(payload);
      setSubmitted(true);
      setTimeout(() => navigate("/gahrd/requests"), 1500);
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || "Gagal mengirimkan pengajuan.");
    } finally {
      setSubmitting(false);
    }
  };

  const formattedToday = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <RoleLayout
      activeNav="Requests"
      onNavigate={p => {
        if (p === "Requests") navigate("/gahrd/requests");
        else if (p === "Dashboard") navigate("/gahrd/dashboard");
      }}
      topbarTitle="Buat Pengajuan Urgent"
      userName={user?.name || "GAHRD User"}
      userRole="GA/HRD"
      searchPlaceholder="Cari..."
    >
      <div className="p-4 sm:p-6 animate-fadeup">
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-[26px] font-bold text-slate-800">New Urgent Request (GA)</h2>
            <p className="text-[13px] text-slate-500 mt-1">Formulir darurat untuk pengajuan operasional hari ini. Bypas persetujuan Kadep.</p>
          </div>
          <button
            onClick={() => navigate("/gahrd/requests")}
            className="flex items-center gap-1.5 text-[13px] font-bold text-[#1e3a8a] hover:underline"
          >
            <Icon name="arrow_back" className="text-base" /> Kembali ke Request
          </button>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {formError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[13px] font-semibold flex items-center gap-2 border border-red-100 shadow-sm">
              <Icon name="error" className="text-[18px]" />
              {formError}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="warning" className="text-red-600 text-[20px]" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#0f172a]">Keperluan / Tujuan Perjalanan</h3>
                <p className="text-[12px] text-[#64748b]">Jelaskan alasan pengajuan mendesak ini.</p>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Keperluan Trip <span className="text-red-500">*</span></label>
              <input
                required
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Tulis native keperluan trip urgent di sini..."
                className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-[#ffd9d5] rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="schedule" className="text-[#ba1a1a] text-[20px]" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#0f172a]">Tujuan &amp; Waktu</h3>
                <p className="text-[12px] text-[#64748b]">Pengajuan untuk hari ini. Selesai otomatis jam 16:30.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Kota Tujuan <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Icon name="location_city" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px]" />
                    <input
                      required
                      value={destinationCity}
                      onChange={e => setDestinationCity(e.target.value)}
                      placeholder="Contoh: Jakarta"
                      className="w-full h-10 pl-9 pr-4 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Tempat Tujuan <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Icon name="location_on" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px]" />
                    <input
                      required
                      value={destinationPlace}
                      onChange={e => setDestinationPlace(e.target.value)}
                      placeholder="Contoh: Kantor Cabang Sudirman"
                      className="w-full h-10 pl-9 pr-4 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Tanggal Perjalanan (Hari Ini)</label>
                  <input
                    disabled
                    value={formattedToday}
                    className="w-full h-10 px-3 border border-slate-100 rounded-xl text-[13px] text-slate-400 bg-slate-50 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Jam Keberangkatan <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={e => setDepartureTime(e.target.value)}
                    className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Perkiraan Selesai (Otomatis)</label>
                  <input
                    disabled
                    value="16:30 WIB"
                    className="w-full h-10 px-3 border border-slate-100 rounded-xl text-[13px] text-slate-400 bg-slate-50 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-bold text-[#0f172a]">Daftar Penumpang</h3>
                <p className="text-[12px] text-[#64748b]">Daftarkan penumpang secara fleksibel.</p>
              </div>
              <button
                onClick={() => setPassengers(p => [...p, { name: "", department_id: "" }])}
                disabled={passengers.length >= 12}
                className="flex items-center gap-1.5 text-[12px] font-bold text-[#1e3a8a] hover:underline disabled:opacity-40"
              >
                <Icon name="person_add" className="text-[15px]" /> Tambah Penumpang
              </button>
            </div>

            <div className="space-y-2 min-h-[60px]">
              {passengers.length === 0 ? (
                <p className="text-[12px] text-[#94a3b8] text-center py-4">Belum ada penumpang ditambahkan.</p>
              ) : (
                passengers.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={p.name}
                        onChange={e => handlePassengerNameChange(i, e.target.value)}
                        onFocus={() => {
                          if (p.name.trim()) handlePassengerNameChange(i, p.name);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setActivePassengerIndex(null);
                            setSuggestions([]);
                          }, 250);
                        }}
                        placeholder="Nama Lengkap Penumpang"
                        className="w-full h-9 px-3 border border-[#e2e8f0] rounded-lg text-[12px] text-[#0f172a] bg-white focus:outline-none"
                      />
                      {activePassengerIndex === i && (suggestions.length > 0 || searchLoading) && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                          {searchLoading ? (
                            <div className="p-3 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
                              <span className="animate-spin text-sm text-[#1e3a8a] font-extrabold">&#x21bb;</span>
                              Mencari...
                            </div>
                          ) : (
                            suggestions.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleSelectSuggestion(i, item)}
                                className="px-3 py-2 text-[12px] text-slate-700 hover:bg-blue-50/50 hover:text-[#1e3a8a] cursor-pointer flex justify-between items-center transition-all border-b border-slate-50 last:border-0"
                              >
                                <span className="font-semibold">{item.name}</span>
                                <span className="text-[10px] bg-blue-100/60 text-[#1e3a8a] px-1.5 py-0.5 rounded-md font-bold uppercase">
                                  {item.department_name || item.department_id}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <div className="w-1/3">
                      <select
                        value={p.department_id}
                        onChange={e => {
                          const next = [...passengers];
                          next[i] = { ...next[i], department_id: e.target.value };
                          setPassengers(next);
                        }}
                        className="w-full h-9 px-3 border border-[#e2e8f0] rounded-lg text-[12px] text-[#0f172a] bg-white focus:outline-none"
                      >
                        <option value="">Pilih Departemen</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => setPassengers(prev => prev.filter((_, j) => j !== i))}
                      className="text-[#94a3b8] hover:text-[#ef4444] transition-colors"
                    >
                      <Icon name="close" className="text-[16px]" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="commute" className="text-indigo-600 text-[20px]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Penugasan Langsung (Opsional)</h3>
                  <p className="text-[12px] text-[#64748b]">Tugaskan driver &amp; armada internal, atau gunakan armada pihak ketiga.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#475569]">Pihak Ketiga (Sewa)</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsExternal(!isExternal);
                    setSelectedDriverId("");
                    setSelectedVehicleId("");
                  }}
                  className={`w-11 h-6 rounded-full transition-all relative outline-none flex items-center ${isExternal ? "bg-rose-600" : "bg-[#cbd5e1]"}`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${isExternal ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            </div>

            {isExternal ? (
              <div className="space-y-4 animate-fadein">
                {/* Trip Type Selector */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-2">Tipe Perjalanan Sewa</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="urgent_external_trip_type"
                        checked={externalTripType === "round_trip"}
                        onChange={() => setExternalTripType("round_trip")}
                        className="w-4 h-4 accent-rose-600"
                      />
                      Pulang Pergi (Round Trip)
                    </label>
                    <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="urgent_external_trip_type"
                        checked={externalTripType === "one_way"}
                        onChange={() => setExternalTripType("one_way")}
                        className="w-4 h-4 accent-rose-600"
                      />
                      Sekali Jalan (One Way)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Nama Vendor / Keterangan Armada <span className="text-red-500">*</span></label>
                    <input
                      required={isExternal}
                      value={externalFleetInfo}
                      onChange={e => setExternalFleetInfo(e.target.value)}
                      placeholder="Contoh: Bluebird / Toyota Avanza"
                      className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Nama Driver Pihak Ketiga <span className="text-red-500">*</span></label>
                    <input
                      required={isExternal}
                      value={externalDriverName}
                      onChange={e => setExternalDriverName(e.target.value)}
                      placeholder="Nama Driver"
                      className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">No. Plat Mobil Sewa <span className="text-red-500">*</span></label>
                    <input
                      required={isExternal}
                      value={externalLicensePlate}
                      onChange={e => setExternalLicensePlate(e.target.value)}
                      placeholder="Contoh: B 1234 CD"
                      className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  {externalTripType === "round_trip" ? (
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Total Biaya Sewa (Pihak Ketiga) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required={isExternal && externalTripType === "round_trip"}
                        value={thirdPartyCost}
                        onChange={e => setThirdPartyCost(e.target.value)}
                        placeholder="Biaya sewa"
                        className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-rose-700"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#475569] mb-1.5">Biaya Pergi <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          required={isExternal && externalTripType === "one_way"}
                          value={externalDepartureCost}
                          onChange={e => setExternalDepartureCost(e.target.value)}
                          placeholder="Biaya pergi"
                          className="w-full h-10 px-2.5 border border-[#e2e8f0] rounded-xl text-[12px] text-rose-700 bg-[#f8fafc] focus:bg-white focus:outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#475569] mb-1.5">Biaya Pulang <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          required={isExternal && externalTripType === "one_way"}
                          value={externalReturnCost}
                          onChange={e => setExternalReturnCost(e.target.value)}
                          placeholder="Biaya pulang"
                          className="w-full h-10 px-2.5 border border-[#e2e8f0] rounded-xl text-[12px] text-rose-700 bg-[#f8fafc] focus:bg-white focus:outline-none font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadein">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Pilih Kendaraan (Tersedia)</label>
                    <select
                      value={selectedVehicleId}
                      onChange={e => setSelectedVehicleId(e.target.value)}
                      className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                    >
                      <option value="">-- Pilih Kendaraan (Bisa Dikosongkan) --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          [{v.plate}] {v.model} ({v.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Pilih Driver (Tersedia)</label>
                    <select
                      value={selectedDriverId}
                      onChange={e => setSelectedDriverId(e.target.value)}
                      className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                    >
                      <option value="">-- Pilih Driver (Bisa Dikosongkan) --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(drivers.length === 0 || vehicles.length === 0) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 animate-fadein">
                    <Icon name="warning" className="text-amber-600 text-lg mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      <span className="font-bold">Armada/Driver Internal Penuh!</span>
                      <p className="mt-0.5 text-amber-700">
                        {drivers.length === 0 && vehicles.length === 0
                          ? "Seluruh armada dan driver internal sedang tidak tersedia hari ini."
                          : drivers.length === 0
                          ? "Seluruh driver internal sedang bertugas hari ini."
                          : "Seluruh kendaraan internal sedang digunakan hari ini."}{" "}
                        Anda disarankan menggunakan opsi <span className="font-bold text-rose-700 underline cursor-pointer hover:text-rose-950" onClick={() => setIsExternal(true)}>Pihak Ketiga (Sewa)</span> untuk keperluan mendesak ini.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-[#0f172a]">Catatan Tambahan (Opsional)</h3>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Catatan rute atau instruksi khusus..."
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 resize-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 flex-wrap">
            <button
              onClick={handlePreSubmitCheck}
              disabled={submitting || submitted}
              className={`h-10 px-6 rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white disabled:opacity-40`}
            >
              {submitted ? "✓ Berhasil Diajukan!" : submitting ? "Mengirim..." : "Kirim Pengajuan Urgent"}
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
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="assignment_late" className="text-3xl" />
              </div>
              <h3 className="text-[18px] font-extrabold text-slate-800">Cek Kembali Pengajuan Urgent</h3>
              <p className="text-xs text-slate-400 mt-2">
                Permintaan ini berstatus otomatis **Urgent** dan akan langsung diteruskan ke Kepala HRD &amp; GA.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 mb-6 max-h-[300px] overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Keperluan:</span>
                <span className="font-semibold text-slate-800 text-left sm:text-right mt-0.5 sm:mt-0">{purpose}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Tujuan:</span>
                <span className="font-semibold text-slate-800">{destinationPlace}, {destinationCity}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Jam Keberangkatan:</span>
                <span className="font-semibold text-slate-800">{departureTime} WIB (Hari Ini)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-400">Jam Kepulangan:</span>
                <span className="font-semibold text-slate-800">16:30 WIB (Hari Ini)</span>
              </div>
              {isExternal ? (
                <>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-400">Pihak Ketiga:</span>
                    <span className="font-semibold text-rose-600">Ya (Sewa Pihak Ketiga)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-400">Tipe Trip Sewa:</span>
                    <span className="font-semibold text-slate-800">
                      {externalTripType === "round_trip" ? "Pulang Pergi (Round Trip)" : "Sekali Jalan (One Way)"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-400">Armada / Vendor:</span>
                    <span className="font-semibold text-slate-800">{externalFleetInfo}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-400">Nama Driver:</span>
                    <span className="font-semibold text-slate-800">{externalDriverName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-400">No. Plat Mobil:</span>
                    <span className="font-semibold text-slate-800">{externalLicensePlate}</span>
                  </div>
                  {externalTripType === "round_trip" ? (
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="font-bold text-slate-400">Biaya Sewa:</span>
                      <span className="font-extrabold text-rose-600">Rp {Number(thirdPartyCost).toLocaleString("id-ID")}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="font-bold text-slate-400">Biaya Pergi:</span>
                        <span className="font-extrabold text-rose-600">Rp {Number(externalDepartureCost).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="font-bold text-slate-400">Biaya Pulang:</span>
                        <span className="font-extrabold text-rose-600">Rp {Number(externalReturnCost).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="font-bold text-slate-400">Total Estimasi:</span>
                        <span className="font-extrabold text-rose-700">
                          Rp {(Number(externalDepartureCost) + Number(externalReturnCost)).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {selectedVehicleId && (
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="font-bold text-slate-400">Kendaraan:</span>
                      <span className="font-semibold text-[#1e3a8a]">
                        {vehicles.find(v => String(v.id) === String(selectedVehicleId))?.model || "Terpilih"}
                      </span>
                    </div>
                  )}
                  {selectedDriverId && (
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="font-bold text-slate-400">Driver:</span>
                      <span className="font-semibold text-[#1e3a8a]">
                        {drivers.find(d => String(d.id) === String(selectedDriverId))?.name || "Terpilih"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3 bg-[#1e3a8a] text-white font-bold rounded-xl hover:bg-[#1e40af] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Icon name="check" className="text-base" /> Ya, Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}