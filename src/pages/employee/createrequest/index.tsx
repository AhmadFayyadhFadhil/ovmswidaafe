// src/pages/employee/create-request/index.tsx
import { useState, useRef } from "react";
import { Layout as RoleLayout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";

interface Props { onNavigate?: (page: string) => void; }

const APPROVAL_STEPS = [
  { label: "Request Submitted",    sub: "Completed",                    done: true,   active: false },
  { label: "Dept. Head Approval",  sub: "Automatic routing · In Progress", done: false, active: true  },
  { label: "Driver Assigned",      sub: "",                             done: false,  active: false },
  { label: "Vehicle Selected",     sub: "",                             done: false,  active: false },
];

export default function CreateRequestPage({ onNavigate = () => {} }: Props) {
  const [purpose,    setPurpose]    = useState("");
  const [destination,setDestination]= useState("");
  const [departure,  setDeparture]  = useState("");
  const [estReturn,  setEstReturn]  = useState("");
  const [notes,      setNotes]      = useState("");
  const [passengers, setPassengers] = useState<string[]>([]);
  const [files,      setFiles]      = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passengerCount = passengers.length;

  const handleSubmit = async () => {
    if (!purpose || !destination || !departure) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => onNavigate?.("My Requests"), 1500);
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
      userName="Andi Sullivan"
      userRole="Employee"
      searchPlaceholder="Search requests, vehicles..."
    >
      <div className="p-6 animate-fadeup">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#94a3b8] mb-4">
          <span className="hover:text-[#00236f] cursor-pointer" onClick={() => onNavigate?.("Dashboard")}>Portal</span>
          <Icon name="chevron_right" className="text-[15px]" />
          <span className="text-[#0f172a] font-semibold">Create Vehicle Request</span>
        </div>

        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Create Vehicle Request</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Submit operational transportation requests efficiently for internal company activities.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#64748b]">Draft</span>
            <button className="h-10 px-5 border border-[#e2e8f0] bg-white rounded-xl text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors shadow-sm">
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={!purpose || !destination || !departure || submitting || submitted}
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

        <div className="flex gap-5">
          {/* ── LEFT: Form Sections ── */}
          <div className="flex-1 min-w-0 space-y-4">

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
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Search Destination</label>
                  <div className="relative">
                    <Icon name="location_on" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px]" />
                    <input
                      value={destination} onChange={e => setDestination(e.target.value)}
                      placeholder="Enter city or office branch..."
                      className="w-full h-10 pl-9 pr-4 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Departure Date &amp; Time</label>
                    <input type="datetime-local" value={departure} onChange={e => setDeparture(e.target.value)}
                      className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Estimated Return</label>
                    <input type="datetime-local" value={estReturn} onChange={e => setEstReturn(e.target.value)}
                      className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Passengers */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-[#0f172a]">Passengers</h3>
                <button
                  onClick={() => setPassengers(p => [...p, `Passenger ${p.length + 1}`])}
                  disabled={passengers.length >= 5}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-[#00236f] hover:underline disabled:opacity-40"
                >
                  <Icon name="person_add" className="text-[15px]" /> Add
                </button>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {passengers.length === 0 ? (
                  <p className="text-[12px] text-[#94a3b8] text-center py-4">Belum ada penumpang ditambahkan</p>
                ) : (
                  passengers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-[#dce1ff] rounded-full flex items-center justify-center text-[11px] font-bold text-[#00236f]">
                          {p[0]}
                        </div>
                        <span className="text-[13px] font-medium text-[#0f172a]">{p}</span>
                      </div>
                      <button onClick={() => setPassengers(prev => prev.filter((_, j) => j !== i))}
                        className="text-[#94a3b8] hover:text-[#ef4444] transition-colors">
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

          </div>

          {/* ── RIGHT: Summary + Workflow ── */}
          <div className="w-[260px] flex-shrink-0 space-y-4">

            {/* Request Summary */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
              <h3 className="text-[14px] font-bold text-[#0f172a] mb-4">Request Summary</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#f1f5f9] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="location_on" className="text-[#64748b] text-[16px]" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">Destination</div>
                    <div className="text-[12px] font-semibold text-[#0f172a]">{destination || "—"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#f1f5f9] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="calendar_today" className="text-[#64748b] text-[16px]" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">Schedule</div>
                    <div className="text-[12px] font-semibold text-[#0f172a]">
                      {departure ? new Date(departure).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#f1f5f9] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="groups" className="text-[#64748b] text-[16px]" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">Occupancy</div>
                    <div className="text-[12px] font-semibold text-[#0f172a]">
                      {passengerCount === 0 ? "No passengers" : `${passengerCount} Passenger${passengerCount > 1 ? "s" : ""}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Workflow */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Approval Workflow</p>
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#e2e8f0]" />
                <div className="space-y-4">
                  {APPROVAL_STEPS.map((s, i) => (
                    <div key={i} className="relative">
                      <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        s.done ? "bg-[#1a6e3c] border-[#1a6e3c]" :
                        s.active ? "bg-[#ff8c00] border-[#ff8c00]" :
                        "bg-white border-[#e2e8f0]"
                      }`}>
                        {s.done && <Icon name="check" className="text-white text-[10px]" />}
                      </div>
                      <div className={`text-[12px] font-bold ${s.done ? "text-[#1a6e3c]" : s.active ? "text-[#ff8c00]" : "text-[#94a3b8]"}`}>
                        {s.label}
                      </div>
                      {s.sub && <div className="text-[10px] text-[#94a3b8] mt-0.5">{s.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </RoleLayout>
  );
}