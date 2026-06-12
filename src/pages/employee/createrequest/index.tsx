// src/pages/employee/create-request/index.tsx
import { useState, useRef } from "react";
import { Layout as RoleLayout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";
import { requestService } from "@/services/modules/requestService";
import { useAuthContext } from "@/auth/authContext";

interface Props { onNavigate?: (page: string) => void; }

const DEPARTMENTS = ["IT", "FA", "HR&GA", "QC", "QA", "HRD", "GA", "TECHNICAL", "ENGINEERING", "SUPPLY CHAIN", "HSE", "PRODUKSI", "HRD&GA"];



export default function CreateRequestPage({ onNavigate = () => {} }: Props) {
  const { user } = useAuthContext();
  const [purpose,    setPurpose]    = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationPlace, setDestinationPlace] = useState("");
  const [departure,  setDeparture]  = useState("");
  const [estReturn,  setEstReturn]  = useState("");
  const [priority,   setPriority]   = useState("Normal");
  const [notes,      setNotes]      = useState("");
  const [passengers, setPassengers] = useState<{ name: string; department_id: string }[]>([]);
  const [files,      setFiles]      = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formError,  setFormError]  = useState("");

  const handleSubmit = async () => {
    if (!purpose || !destinationCity || !destinationPlace || !departure) {
      setFormError("Purpose, destination city, destination place, and departure time are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        purpose,
        destination_city: destinationCity,
        destination_place: destinationPlace,
        start_time: departure.replace('T', ' ') + ':00',
        end_time: estReturn ? estReturn.replace('T', ' ') + ':00' : null,
        passenger_count: passengers.length + 1,
        priority,
        notes: notes || null,
        passengers: passengers.filter(p => p.name.trim() !== ""),
      };

      await requestService.create(payload);
      setSubmitted(true);
      setTimeout(() => onNavigate?.("My Requests"), 1500);
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to submit request.");
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
      userRole="Employee"
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
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Estimated Return</label>
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

            {/* 3. Passengers */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-[#0f172a]">Passengers</h3>
                <button
                  onClick={() => setPassengers(p => [...p, { name: "", department_id: "IT" }])}
                  disabled={passengers.length >= 5}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-[#00236f] hover:underline disabled:opacity-40"
                >
                  <Icon name="person_add" className="text-[15px]" /> Add Passenger
                </button>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {passengers.length === 0 ? (
                  <p className="text-[12px] text-[#94a3b8] text-center py-4">No extra passengers added yet.</p>
                ) : (
                  passengers.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={p.name}
                          onChange={e => {
                            const next = [...passengers];
                            next[i] = { ...next[i], name: e.target.value };
                            setPassengers(next);
                          }}
                          placeholder="Passenger Full Name"
                          className="w-full h-9 px-3 border border-[#e2e8f0] rounded-lg text-[12px] text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20"
                        />
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
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
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
              {passengers.length < 5 && (
                <p className="text-[11px] text-[#94a3b8] mt-2">+ {5 - passengers.length} more can be added</p>
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
                onClick={handleSubmit}
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
    </RoleLayout>
  );
}