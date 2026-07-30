// src/pages/employee/profil/index.tsx
import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";
import { apiClient } from "@/services/api/api";
import { useAuthContext } from "@/auth/authContext";

interface Props { onNavigate?: (page: string) => void; }

export default function MyProfilePage({ onNavigate }: Props) {
  const { user, updateUser } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile fields state
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+62 812-3456-7890");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("Jakarta Head Office");
  const [simPhotoUrl, setSimPhotoUrl] = useState<string | null>(null);
  const [showSimLightbox, setShowSimLightbox] = useState(false);

  // Form states
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Password change states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Statistics States
  const [totalRequests, setTotalRequests] = useState(0);
  const [approvedRequests, setApprovedRequests] = useState(0);
  const [activeRequests, setActiveRequests] = useState(0);

  // Map roles and title for layout dynamically
  const roleDisplayMap: Record<string, string> = {
    admin: "Administrator",
    gahrd: "GA & HRD",
    approver: "Manager Approver",
    driver: "Driver",
    employee: "Employee"
  };

  const dashboardTitleMap: Record<string, string> = {
    admin: "Admin Dashboard",
    gahrd: "GAHRD Dashboard",
    approver: "Approver Dashboard",
    driver: "Driver Dashboard",
    employee: "Employee Dashboard"
  };

  const displayRole = roleDisplayMap[user?.role || "employee"] || "Employee";
  const displayTitle = dashboardTitleMap[user?.role || "employee"] || "Employee Dashboard";

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Fetch profile data
      const res = await apiClient.get("/profile");
      if (res.data?.status === "success") {
        const u = res.data.data;
        setName(u.name || "");
        setEmail(u.email || "");
        setDepartment(u.department_id || "Operations");
        setPhone(u.phone || "+62 812-3456-7890");
        setPosition(u.position || (u.roles?.[0] ? u.roles[0].toUpperCase() : "Staff"));
        setLocation(u.location || "Jakarta Head Office");
        setAvatar(u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=00236f&color=fff&size=120`);
        setSimPhotoUrl(u.sim_a_photo_url || null);
      }

      // Fetch requests data for stats and activity log
      const reqRes = await apiClient.get("/requests", { params: { per_page: 100 } });
      const list = Array.isArray(reqRes.data?.data) ? reqRes.data.data : [];
      setTotalRequests(list.length);
      
      const approved = list.filter((r: any) => 
        ["driver_assigned", "approved_hrd_ga", "approved_hrd"].includes(r.status)
      ).length;
      setApprovedRequests(approved);
      
      const active = list.filter((r: any) => r.status === "on_going").length;
      setActiveRequests(active);



    } catch (err: any) {
      console.error("Gagal memuat profil atau statistik:", err);
      setErrorMsg("Gagal sinkronisasi data dengan backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      let finalAvatarUrl = avatar;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        
        const avatarRes = await apiClient.post("/profile/avatar", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        if (avatarRes.data?.status === "success") {
          finalAvatarUrl = avatarRes.data.data.avatar_url;
          setAvatarFile(null);
        } else {
          throw new Error(avatarRes.data?.message || "Gagal mengunggah foto profil.");
        }
      }

      const payload: any = {
        name,
        email,
        phone,
        location,
      };
      if (newPassword) {
        payload.password = newPassword;
        payload.password_confirmation = confirmPassword;
      }
      
      const res = await apiClient.put("/profile", payload);
      
      if (res.data?.status === "success") {
        setSaved(true);
        setEditing(false);
        setNewPassword("");
        setConfirmPassword("");
        
        // Update context & local storage
        updateUser({
          name: res.data.data.name,
          email: res.data.data.email,
          avatar_url: finalAvatarUrl,
        });

        setName(res.data.data.name || "");
        setEmail(res.data.data.email || "");
        setPhone(res.data.data.phone || "");
        setLocation(res.data.data.location || "");
        setAvatar(finalAvatarUrl);

        setTimeout(() => setSaved(false), 2500);
      } else {
        setErrorMsg(res.data?.message || "Gagal memperbarui profil.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "Gagal memproses pembaruan profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
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
      topbarTitle={displayTitle}
      userName={name || user?.name || "User"}
      userRole={displayRole}
      searchPlaceholder="Search requests, vehicles..."
    >
      <div className="p-4 sm:p-6 animate-fadeup space-y-5">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">My Profile</h2>
            <p className="text-[13px] text-[#64748b] mt-0.5">Manage your personal information and account settings</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                if (editing) {
                  setName(user?.name || "");
                  setEmail(user?.email || "");
                }
                setEditing(!editing);
                setSaved(false);
                setErrorMsg("");
              }}
              className="h-10 px-5 border border-[#e2e8f0] bg-white rounded-xl text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors shadow-sm cursor-pointer"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            <button
              onClick={handleSave}
              disabled={!editing || saving}
              className={`h-10 px-6 rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40 cursor-pointer ${
                saved   ? "bg-[#1a6e3c] text-white" :
                saving  ? "bg-[#0f2a5e]/70 text-white cursor-wait" :
                          "bg-[#0f2a5e] hover:bg-[#1e3a8a] text-white"
              }`}
            >
              {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[12.5px] flex items-center gap-2">
            <Icon name="error" className="text-[16px] text-red-500" />
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00236f]"></div>
            <p className="mt-4 text-[13px] text-[#64748b]">Sinkronisasi profil...</p>
          </div>
        ) : (
          <>
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-[#eef2ff] to-[#f8fafc] rounded-2xl border border-[#e2e8f0] shadow-sm p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#e5eeff]">
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
                        className="absolute bottom-1 right-1 w-8 h-8 bg-[#0f2a5e] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#1e3a8a] transition-colors cursor-pointer"
                      >
                        <Icon name="photo_camera" className="text-[15px]" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </>
                  )}
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-1">
                    <h3 className="text-[20px] sm:text-[22px] font-bold text-[#0f172a]">{name}</h3>
                    <span className="flex items-center gap-1.5 bg-[#d4f4e2] text-[#1a6e3c] text-[11px] font-bold px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1a6e3c] animate-pulse" />
                      Active
                    </span>
                  </div>
                  <div className="text-[14px] sm:text-[15px] font-semibold text-[#00236f]">{position}</div>
                  <div className="text-[12px] text-[#64748b] mt-0.5">{department} • ID-{user?.id}</div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2.5 text-[12px] text-[#64748b]">
                    <Icon name="location_on" className="text-[14px] text-[#94a3b8]" />
                    <span>{location}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                  {[
                    { icon: "history",       label: "Total Requests",  value: String(totalRequests), color: "text-[#0f172a]"   },
                    { icon: "check_circle",  label: "Approved Requests", value: String(approvedRequests), color: "text-[#1a6e3c]"   },
                    { icon: "commute",       label: "Active Requests", value: String(activeRequests), color: "text-[#4059aa]"   },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl px-4 py-2 border border-[#e2e8f0] flex items-center gap-3 min-w-[160px] shadow-sm text-left">
                      <Icon name={s.icon} className="text-[#94a3b8] text-[16px]" />
                      <div>
                        <div className="text-[10px] text-[#94a3b8] font-semibold uppercase">{s.label}</div>
                        <div className={`text-[17px] font-extrabold ${s.color} leading-tight`}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form & Info Section */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 sm:p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-[#e5eeff] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="badge" className="text-[#00236f] text-[18px]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Personal Information</h3>
                  <p className="text-[11px] text-[#94a3b8]">Manage your account data and contact details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                  <input value={department} readOnly className={inputClass(false)} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Role / Position</label>
                  <input value={position} readOnly className={inputClass(false)} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Location</label>
                  <input
                    value={location} onChange={e => setLocation(e.target.value)} readOnly={!editing}
                    className={inputClass(editing)}
                  />
                </div>
              </div>

              {/* Dedicated SIM A Section for Driver (Read-Only) */}
              {(user?.role === "driver" || displayRole === "Driver" || simPhotoUrl) && (
                <div className="mt-5 pt-5 border-t border-[#f1f5f9]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="badge" className="text-[18px] text-[#00236f]" />
                      <h4 className="text-[13px] font-bold text-[#0f172a]">Dokumen SIM A Driver</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                      🔒 Read-Only (Hanya Lihat)
                    </span>
                  </div>

                  {simPhotoUrl ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                          <img src={simPhotoUrl} alt="SIM A" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-[12.5px] font-bold text-slate-800">Kartu SIM A Pengemudi</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Dokumen resmi pengemudi operasional PT Widatra Bhakti</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSimLightbox(true)}
                        className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-xl text-[11.5px] font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Icon name="visibility" className="text-[14px]" /> Lihat Foto SIM A
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                      <div className="text-[12px] font-bold text-slate-700">Foto SIM A Belum Diunggah</div>
                      <p className="text-[11px] text-slate-400">Dokumen SIM A dikelola langsung oleh Administrator di menu Management Driver.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* SIM A Lightbox Modal */}
      {showSimLightbox && simPhotoUrl && (
        <div className="fixed inset-0 bg-black/75 z-[99999] flex items-center justify-center p-4 animate-fadein" onClick={() => setShowSimLightbox(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-fadein" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Pratinjau SIM A Driver</h3>
                <p className="text-xs text-slate-400">{name} ({email})</p>
              </div>
              <button onClick={() => setShowSimLightbox(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 cursor-pointer">
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-2 min-h-[220px]">
              <img
                src={simPhotoUrl}
                alt={`SIM A ${name}`}
                className="max-h-[380px] w-auto object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400 italic">🔒 Dokumen dikelola & diunggah oleh Administrator.</span>
              <button
                onClick={() => setShowSimLightbox(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}