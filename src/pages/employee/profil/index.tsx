// src/pages/employee/profile/index.tsx
import { useState, useRef } from "react";
import { Layout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";

interface Props { onNavigate?: (page: string) => void; }

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center flex-shrink-0 ${checked ? "bg-[#00236f]" : "bg-[#e2e8f0]"}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 mx-0.5 ${checked ? "translate-x-6" : "translate-x-0"}`} />
    </button>
  );
}

export default function MyProfilePage({ onNavigate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [avatar,     setAvatar]     = useState("https://i.pravatar.cc/120?img=60");
  const [name,       setName]       = useState("Andi Sullivan");
  const [email,      setEmail]      = useState("andi.sullivan@kinetic-ovms.com");
  const [phone,      setPhone]      = useState("+1 (512) 445-9821");
  const [department, setDepartment] = useState("Operations Dept");
  const [position,   setPosition]   = useState("Senior Fleet Operator");
  const [location,   setLocation]   = useState("Austin Hub B");

  // Alert preferences
  const [emergency, setEmergency] = useState(true);
  const [reqStatus, setReqStatus] = useState(true);
  const [sysUpdate, setSysUpdate] = useState(false);

  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
    }
  };

  const inputClass = (active: boolean) =>
    `w-full h-10 px-3 border rounded-xl text-[13px] transition-all focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 ${
      active
        ? "border-[#00236f]/40 bg-white text-[#0f172a]"
        : "border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a] cursor-default"
    }`;

  return (
    <Layout
      activeNav="My Profile"
      onNavigate={p => onNavigate?.(p)}
      topbarTitle="Employee Dashboard"
      userName={name}
      userRole="Employee"
      searchPlaceholder="Search requests, vehicles..."
    >
      <div className="p-6 animate-fadeup space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#94a3b8]">
          <span className="hover:text-[#00236f] cursor-pointer" onClick={() => onNavigate?.("Dashboard")}>Portal</span>
          <Icon name="chevron_right" className="text-[15px]" />
          <span className="text-[#0f172a] font-semibold">My Profile</span>
        </div>

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">My Profile</h2>
            <p className="text-[13px] text-[#64748b] mt-0.5">Manage your employee information and operational preferences</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => { setEditing(!editing); setSaved(false); }}
              className="h-10 px-5 border border-[#e2e8f0] bg-white rounded-xl text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors shadow-sm"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            <button
              onClick={handleSave}
              disabled={!editing || saving}
              className={`h-10 px-6 rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40 ${
                saved   ? "bg-[#1a6e3c] text-white" :
                saving  ? "bg-[#0f2a5e]/70 text-white cursor-wait" :
                          "bg-[#0f2a5e] hover:bg-[#1e3a8a] text-white"
              }`}
            >
              {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ── Hero Card ── */}
        <div className="bg-gradient-to-br from-[#eef2ff] to-[#f8fafc] rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#e5eeff]">
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00236f&color=fff&size=120`; }}
                />
              </div>
              {editing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-8 h-8 bg-[#0f2a5e] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#1e3a8a] transition-colors"
                  >
                    <Icon name="photo_camera" className="text-[15px]" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-[22px] font-bold text-[#0f172a]">{name}</h3>
                <span className="flex items-center gap-1.5 bg-[#d4f4e2] text-[#1a6e3c] text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1a6e3c] animate-pulse" />
                  Active
                </span>
              </div>
              <div className="text-[15px] font-semibold text-[#00236f]">{position}</div>
              <div className="text-[12.5px] text-[#64748b] mt-0.5">{department} • EMP-2023-089</div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[#64748b]">
                <Icon name="location_on" className="text-[14px] text-[#94a3b8]" />
                <span>{location === "Austin Hub B" ? "Austin Corporate Hub" : location}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {[
                { icon: "history",       label: "Total Requests",  value: "42", color: "text-[#0f172a]"   },
                { icon: "check_circle",  label: "Approved",        value: "38", color: "text-[#1a6e3c]"   },
                { icon: "calendar_month",label: "Active Schedules",value: "3",  color: "text-[#0f172a]"   },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl px-4 py-2.5 border border-[#e2e8f0] flex items-center gap-3 min-w-[160px] shadow-sm">
                  <Icon name={s.icon} className="text-[#94a3b8] text-[16px]" />
                  <div>
                    <div className="text-[10px] text-[#94a3b8] font-medium">{s.label}</div>
                    <div className={`text-[18px] font-bold ${s.color} leading-tight`}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Row: Form + Smart Alerts ── */}
        <div className="grid grid-cols-12 gap-5 pb-4">
          {/* Personal Information Form */}
          <div className="col-span-8 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-[#e5eeff] rounded-xl flex items-center justify-center">
                <Icon name="badge" className="text-[#00236f] text-[18px]" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#0f172a]">Personal Information</h3>
                <p className="text-[11px] text-[#94a3b8]">Manage your employee data and contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Full Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)} readOnly={!editing}
                  className={inputClass(editing)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Email Address</label>
                <input
                  value={email} onChange={e => setEmail(e.target.value)} readOnly={!editing} type="email"
                  className={inputClass(editing)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Phone Number</label>
                <input
                  value={phone} onChange={e => setPhone(e.target.value)} readOnly={!editing}
                  className={inputClass(editing)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Department</label>
                {editing ? (
                  <div className="relative">
                    <select
                      value={department} onChange={e => setDepartment(e.target.value)}
                      className={`${inputClass(true)} appearance-none pr-8`}
                    >
                      {["Operations Dept","Logistics","Finance","Engineering","System Admin"].map(d => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                    <Icon name="keyboard_arrow_down" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[16px] pointer-events-none" />
                  </div>
                ) : (
                  <input value={department} readOnly className={inputClass(false)} />
                )}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Position</label>
                <input
                  value={position} onChange={e => setPosition(e.target.value)} readOnly={!editing}
                  className={inputClass(editing)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Location</label>
                <input
                  value={location} onChange={e => setLocation(e.target.value)} readOnly={!editing}
                  className={inputClass(editing)}
                />
              </div>
            </div>

            {editing && (
              <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
                <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Change Password</label>
                <div className="grid grid-cols-2 gap-4">
                  <input type="password" placeholder="New password"
                    className="w-full h-10 px-3 border border-[#e2e8f0] bg-[#f8fafc] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00236f]/20" />
                  <input type="password" placeholder="Confirm new password"
                    className="w-full h-10 px-3 border border-[#e2e8f0] bg-[#f8fafc] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00236f]/20" />
                </div>
              </div>
            )}
          </div>

          {/* Right: Smart Alerts + Activity */}
          <div className="col-span-4 space-y-4">
            {/* Smart Alerts */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
              <h3 className="text-[13px] font-bold text-[#0f172a] uppercase tracking-wider mb-4">Smart Alerts</h3>
              <div className="space-y-4">
                {[
                  { label: "Emergency Dispatch", checked: emergency, toggle: () => setEmergency(p => !p) },
                  { label: "Request Status",     checked: reqStatus, toggle: () => setReqStatus(p => !p) },
                  { label: "System Updates",     checked: sysUpdate, toggle: () => setSysUpdate(p => !p) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#0f172a]">{item.label}</span>
                    <Toggle checked={item.checked} onChange={item.toggle} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
              <h3 className="text-[13px] font-bold text-[#0f172a] mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { icon: "task_alt",  color: "text-[#1a6e3c]", bg: "bg-[#d4f4e2]", text: "Request #REQ-8291 approved",      time: "2h ago"  },
                  { icon: "send",      color: "text-[#00236f]", bg: "bg-[#e5eeff]", text: "New request submitted #REQ-9012", time: "1d ago"  },
                  { icon: "person_add",color: "text-[#006591]", bg: "bg-[#e0f4fe]", text: "Driver assigned: Michael Chen",   time: "2d ago"  },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 ${a.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon name={a.icon} className={`${a.color} text-[14px]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-[#0f172a] leading-tight truncate">{a.text}</div>
                      <div className="text-[10px] text-[#94a3b8]">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl border border-[#fecdd3] shadow-sm p-4">
              <h3 className="text-[12px] font-bold text-[#ba1a1a] mb-3 flex items-center gap-2">
                <Icon name="warning" className="text-[16px]" />
                Account Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full py-2 border border-[#fecdd3] text-[#ba1a1a] rounded-xl text-[11px] font-bold hover:bg-[#fff1f2] transition-colors">
                  Deactivate Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}