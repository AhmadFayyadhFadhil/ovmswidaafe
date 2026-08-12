import { useState, useEffect, useRef, type ReactNode } from "react";
import { Layout } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { systemConfigService } from "@/services/modules/systemConfigService";
import { tripPurposeService, type TripPurposeItem } from "@/services/modules/tripPurposeService";
import { destinationCityService, type DestinationCityItem } from "@/services/modules/destinationCityService";

const SETTING_SECTIONS = [
  { icon: "settings",        label: "General Settings" },
  { icon: "business",        label: "Company Info"     },
  { icon: "flag",            label: "Master Data Keperluan" },
  { icon: "location_city",   label: "Master Data Kota" },
  { icon: "notifications",   label: "Notifications"    },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined select-none leading-none notranslate ${className}`}
      translate="no"
      style={{ fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24" }}>
      {name}
    </span>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center flex-shrink-0 ${checked ? "bg-[#1e3a8a]" : "bg-[#e2e8f0]"}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 mx-0.5 ${checked ? "translate-x-6" : "translate-x-0"}`} />
    </button>
  );
}

function Select({ value, onChange, options, className = "" }: { value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full h-10 pl-3 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 appearance-none cursor-pointer notranslate"
        translate="no"
      >
        {options.map(o => (
          <option key={o} value={o} className="notranslate" translate="no">
            {o}
          </option>
        ))}
      </select>
      <Icon name="keyboard_arrow_down" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px] pointer-events-none" />
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-[16px] font-bold text-[#0f172a]">{title}</h3>
        <p className="text-[12.5px] text-[#64748b] mt-0.5">{subtitle}</p>
      </div>
      <div className="border-t border-[#f1f5f9]" />
      {children}
    </div>
  );
}

export default function SystemSettingsView({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [activeSection, setActiveSection] = useState("General Settings");
  const [saved,         setSaved]         = useState(false);
  const [resetDone,     setResetDone]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [uploading,     setUploading]     = useState(false);

  // Cropper states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Hidden File Input Ref
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Fetch data settings from API (contains both settings and stats)
  const { data: apiData, loading, refetch, setData } = useApi(() => systemConfigService.get());
  const statsData = (apiData as any)?.stats || null;
  const refetchStats = refetch;

  // Form State
  const [formData, setFormData] = useState<any | null>(null);

  // Master Data Trip Purposes & Destination Cities State
  const [purposes, setPurposes] = useState<TripPurposeItem[]>([]);
  const [newPurposeName, setNewPurposeName] = useState("");
  const [editingPurpose, setEditingPurpose] = useState<TripPurposeItem | null>(null);

  const [cities, setCities] = useState<DestinationCityItem[]>([]);
  const [newCityName, setNewCityName] = useState("");
  const [newCityProvince, setNewCityProvince] = useState("");
  const [editingCity, setEditingCity] = useState<DestinationCityItem | null>(null);
  const [citySearchTerm, setCitySearchTerm] = useState("");

  const loadPurposes = () => {
    tripPurposeService.getAll({ all: true }).then((res) => {
      if (res.data) setPurposes(res.data);
    }).catch(err => console.error("Failed to load purposes", err));
  };

  const loadCities = () => {
    destinationCityService.getAll({ all: true }).then((res) => {
      if (res.data) setCities(res.data);
    }).catch(err => console.error("Failed to load cities", err));
  };

  useEffect(() => {
    loadPurposes();
    loadCities();
  }, []);

  const handleAddPurpose = async () => {
    if (!newPurposeName.trim()) return;
    try {
      await tripPurposeService.create({ name: newPurposeName.trim() });
      setNewPurposeName("");
      loadPurposes();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal menambah Purpose of Trip");
    }
  };

  const handleUpdatePurpose = async () => {
    if (!editingPurpose || !editingPurpose.name.trim()) return;
    try {
      await tripPurposeService.update(editingPurpose.id, {
        name: editingPurpose.name.trim(),
        is_active: editingPurpose.is_active,
      });
      setEditingPurpose(null);
      loadPurposes();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal memperbarui Purpose of Trip");
    }
  };

  const handleDeletePurpose = async (id: number) => {
    if (!confirm("Yakin ingin menghapus Master Data Purpose ini?")) return;
    try {
      await tripPurposeService.delete(id);
      loadPurposes();
    } catch (err: any) {
      alert("Gagal menghapus Purpose");
    }
  };

  const handleAddCity = async () => {
    if (!newCityName.trim()) return;
    try {
      await destinationCityService.create({
        name: newCityName.trim(),
        province: newCityProvince.trim() || undefined,
      });
      setNewCityName("");
      setNewCityProvince("");
      loadCities();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal menambah Kota Tujuan");
    }
  };

  const handleUpdateCity = async () => {
    if (!editingCity || !editingCity.name.trim()) return;
    try {
      await destinationCityService.update(editingCity.id, {
        name: editingCity.name.trim(),
        province: editingCity.province || undefined,
        is_active: editingCity.is_active,
      });
      setEditingCity(null);
      loadCities();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal memperbarui Kota Tujuan");
    }
  };

  const handleDeleteCity = async (id: number) => {
    if (!confirm("Yakin ingin menghapus Master Data Kota ini?")) return;
    try {
      await destinationCityService.delete(id);
      loadCities();
    } catch (err: any) {
      alert("Gagal menghapus Kota");
    }
  };

  useEffect(() => {
    if (apiData) {
      const updated = { ...apiData };
      if (!updated.hqAddress || !updated.hqAddress.includes("Kecamatan Pandaan")) {
        updated.hqAddress = "Jl. Stadion / Jl. Sidomukti No. 1, Sidomukti, Kecamatan Pandaan, Kabupaten Pasuruan, Jawa Timur 67156";
      }
      setFormData(updated);
    }
  }, [apiData]);

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      const res = await systemConfigService.update(formData);
      if (res && res.data) {
        setData(res.data);
        
        // Sync Sidebar branding cache instantly
        const branding = {
          systemName: res.data.systemName || "OVMS",
          companyName: res.data.companyName || "Enterprise Fleet",
          companyLogo: res.data.companyLogo || ""
        };
        localStorage.setItem("ovms_branding_config", JSON.stringify(branding));
        localStorage.setItem("ovms_branding_last_fetch", Date.now().toString());
        // Trigger Sidebar custom event update
        window.dispatchEvent(new Event("branding-update"));
      }
      setSaved(true);
      refetchStats(); // Refresh status bar
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const freshData = await refetch();
      if (freshData) {
        setFormData({ ...freshData });
      }
      setResetDone(true);
      setTimeout(() => setResetDone(false), 2000);
    } catch (err) {
      console.error("Failed to reset settings", err);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setCropModalOpen(true);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const saveCroppedImage = () => {
    if (!imageSrc) return;
    setUploading(true);
    setCropModalOpen(false);

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = 240 * scale;
    canvas.height = 200 * scale;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setUploading(false);
      return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      ctx.save();
      ctx.translate(120 * scale, 100 * scale);
      ctx.translate(position.x * scale, position.y * scale);
      ctx.scale(zoom, zoom);

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const hRatio = 240 / imgWidth;
      const vRatio = 200 / imgHeight;
      const fitRatio = Math.min(hRatio, vRatio);

      const w = imgWidth * fitRatio * scale;
      const h = imgHeight * fitRatio * scale;

      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (!blob) {
          setUploading(false);
          return;
        }

        const croppedFile = new File([blob], "logo_cropped.png", { type: "image/png" });
        systemConfigService.uploadLogo(croppedFile)
          .then((res) => {
            if (res && res.data && res.data.logo_url) {
              setFormData((prev: any) => prev ? { ...prev, companyLogo: res.data.logo_url } : null);
              const cached = localStorage.getItem("ovms_branding_config");
              const branding = cached ? JSON.parse(cached) : { systemName: "OVMS", companyName: "Enterprise Fleet" };
              branding.companyLogo = res.data.logo_url;
              localStorage.setItem("ovms_branding_config", JSON.stringify(branding));
              window.dispatchEvent(new Event("branding-update"));
            }
          })
          .catch((err) => {
            console.error("Failed to upload logo", err);
            const errMsg = err.response?.data?.message || err.response?.data?.errors?.logo?.[0] || "Gagal mengunggah logo.";
            alert(errMsg);
          })
          .finally(() => {
            setUploading(false);
          });
      }, "image/png");
    };
  };

  const handleEditCurrentLogo = () => {
    if (!formData || !formData.companyLogo) return;
    setImageSrc(formData.companyLogo);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setCropModalOpen(true);
  };

  const handleFlushCache = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua cache aplikasi?")) {
      try {
        await systemConfigService.flushCache();
        alert("Cache aplikasi berhasil dibersihkan.");
      } catch (err) {
        console.error("Failed to flush cache", err);
        alert("Gagal membersihkan cache.");
      }
    }
  };

  const handlePurgeLogs = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua audit log secara permanen? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        await systemConfigService.purgeLogs();
        refetchStats(); // Update the audit logs count in status bar
        alert("Semua audit log berhasil dihapus.");
      } catch (err) {
        console.error("Failed to purge logs", err);
        alert("Gagal menghapus audit log.");
      }
    }
  };

  if (loading || !formData) {
    return (
      <Layout
        activeNav="System Settings"
        onNavigate={onNavigate}
        topbarTitle="System Settings"
        userName="jokowi"
        userRole="Administrator"
      >
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[13px] font-semibold text-[#475569]">Loading settings...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      activeNav="System Settings"
      onNavigate={onNavigate}
      topbarTitle="System Settings"
      searchPlaceholder="Search settings..."
      userName="jokowi"
      userRole="Administrator"
    >
      <div className="flex-1 overflow-y-auto p-6">

          {/* Page header */}
          <div data-guide="system-settings" className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[24px] font-bold text-[#0f172a]">Pengaturan Sistem</h2>
              <p className="text-[13px] text-[#64748b] mt-0.5">Kelola konfigurasi sistem, keamanan, notifikasi, dan pengaturan operasional.</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={handleReset}
                className={`h-10 px-5 border rounded-xl text-[13px] font-bold transition-all active:scale-95 ${
                  resetDone ? "bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]" : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc] shadow-sm"
                }`}>
                {resetDone ? "✓ Resetted" : "Reset Changes"}
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`h-10 px-6 rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-sm ${
                  saved ? "bg-[#16a34a] text-white" : "bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
                } ${saving ? "opacity-75 cursor-not-allowed" : ""}`}>
                {saving ? "Saving..." : (saved ? "✓ Saved!" : "Save Settings")}
              </button>
            </div>
          </div>

          {/* System Status Bar (Real stats from backend) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            {[
              { 
                label: "USERS", 
                value: statsData?.total_users !== undefined ? `${statsData.total_users} Users` : "-", 
                sub: "Akun Pengguna", 
                valueColor: "text-[#0f172a]", 
                subColor: "text-[#64748b]", 
                icon: "group", 
                bg: "bg-[#ede9fe]", 
                iconCol: "text-[#7c3aed]" 
              },
              { 
                label: "VEHICLES", 
                value: statsData?.total_vehicles !== undefined ? `${statsData.total_vehicles} Unit` : "-", 
                sub: "Armada Aktif", 
                valueColor: "text-[#0f172a]", 
                subColor: "text-[#64748b]", 
                icon: "directions_car", 
                bg: "bg-[#e8edf8]", 
                iconCol: "text-[#1e3a8a]" 
              },
              { 
                label: "SESSIONS", 
                value: statsData?.active_sessions !== undefined ? `${statsData.active_sessions} Sesi` : "-", 
                sub: "Pengguna Bersama", 
                valueColor: "text-[#0f172a]", 
                subColor: "text-[#64748b]", 
                icon: "key", 
                bg: "bg-[#e0f2fe]", 
                iconCol: "text-[#0369a1]" 
              },
              { 
                label: "DATABASE", 
                value: statsData?.db_status || "-", 
                sub: "Status Koneksi", 
                valueColor: statsData?.db_status === "Connected" ? "text-[#16a34a]" : "text-[#dc2626]", 
                subColor: "text-[#64748b]", 
                icon: "database", 
                bg: "bg-[#dcfce7]", 
                iconCol: statsData?.db_status === "Connected" ? "text-[#16a34a]" : "text-[#dc2626]" 
              },
              { 
                label: "AUDIT LOGS", 
                value: statsData?.total_audit_logs !== undefined ? `${statsData.total_audit_logs} Log` : "-", 
                sub: "Aktivitas Tercatat", 
                valueColor: "text-[#0f172a]", 
                subColor: "text-[#64748b]", 
                icon: "history", 
                bg: "bg-[#fef3c7]", 
                iconCol: "text-[#d97706]" 
              },
              { 
                label: "TIMEZONE", 
                value: statsData?.timezone ? (statsData.timezone.includes("Asia/Jakarta") || statsData.timezone.includes("GMT") ? "WIB (GMT+7)" : statsData.timezone) : "WIB (GMT+7)", 
                sub: "Zona Waktu Sistem", 
                valueColor: "text-[#0f172a]", 
                subColor: "text-[#16a34a]", 
                icon: "schedule", 
                bg: "bg-[#dcfce7]", 
                iconCol: "text-[#16a34a]" 
              },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon name={c.icon} className={`${c.iconCol} text-[17px]`} />
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8]">{c.label}</div>
                <div className={`text-[15px] font-bold leading-tight mt-0.5 ${c.valueColor}`}>{c.value}</div>
                <div className={`text-[10px] font-medium mt-0.5 ${c.subColor}`}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Main 2-col layout */}
          <div className="flex flex-col lg:flex-row gap-5">

            {/* ── Left Nav ── */}
            <div className="w-full lg:w-[220px] flex-shrink-0">
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-[#f1f5f9]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Navigasi</span>
                </div>
                <nav className="p-2 space-y-0.5">
                  {SETTING_SECTIONS.map(s => (
                    <button key={s.label} onClick={() => setActiveSection(s.label)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                        activeSection === s.label
                          ? "bg-[#eff6ff] text-[#1e3a8a] border border-[#bfdbfe]"
                          : "text-[#475569] hover:bg-[#f8fafc] hover:translate-x-0.5"
                      }`}>
                      <Icon name={s.icon} className={`text-[19px] flex-shrink-0 ${activeSection === s.label ? "text-[#1e3a8a]" : "text-[#94a3b8]"}`} />
                      <span className="text-[13px] font-semibold">{s.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* ── Right Content ── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* GENERAL SETTINGS */}
              {activeSection === "General Settings" && (
                <SectionCard title="Pengaturan Umum" subtitle="Pengaturan preferensi aplikasi inti dan lokalisasi.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Nama Sistem</label>
                      <input 
                        value={formData.systemName || ""} 
                        onChange={e => setFormData({ ...formData, systemName: e.target.value })}
                        className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Zona waktu</label>
                      <Select 
                        value={formData.timezone || ""} 
                        onChange={v => setFormData({ ...formData, timezone: v })} 
                        options={["UTC (Waktu Universal Terkoordinasi)", "GMT +7 (Western Indonesia Time)", "EST (Eastern Standard Time)", "PST (Pacific Standard Time)"]} 
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Format Tanggal</label>
                      <Select 
                        value={formData.dateFormat || ""} 
                        onChange={v => setFormData({ ...formData, dateFormat: v })} 
                        options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "DD-MMM-YYYY"]} 
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Bahasa Sistem</label>
                      <Select 
                        value={formData.systemLanguage || ""} 
                        onChange={v => setFormData({ ...formData, systemLanguage: v })} 
                        options={["English (United States)", "English (United Kingdom)", "Bahasa Indonesia", "Mandarin Chinese"]} 
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2 border-t border-[#f1f5f9] pt-4 mt-2">
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1">Batas Minimal Waktu Pengajuan (Lead Time dalam Jam)</label>
                      <p className="text-[11px] text-[#64748b] mb-2">Tentukan minimal jam pengajuan sebelum berangkat (contoh: masukkan 24 untuk wajib H-1 penuh berdasarkan jam, atau 0 untuk bebas).</p>
                      <input 
                        type="number"
                        min="0"
                        value={formData.minLeadTimeHours !== undefined && formData.minLeadTimeHours !== null ? formData.minLeadTimeHours : 24} 
                        onChange={e => setFormData({ ...formData, minLeadTimeHours: parseInt(e.target.value, 10) || 0 })}
                        className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all max-w-xs" 
                      />
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* COMPANY INFO */}
              {activeSection === "Company Info" && (
                <SectionCard title="Informasi Perusahaan" subtitle="Kelola identitas dan detail kontak organisasi Anda.">
                  <div className="flex flex-col sm:flex-row gap-5">
                                         <div 
                      onClick={() => !formData.companyLogo && logoInputRef.current?.click()}
                      className={`w-[120px] h-[100px] flex-shrink-0 bg-[#f8fafc] border-2 border-dashed border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center gap-1.5 overflow-hidden relative ${!formData.companyLogo ? "cursor-pointer hover:border-[#1e3a8a]/40 hover:bg-[#eff6ff] transition-all group" : ""}`}
                    >
                      {uploading ? (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                          <div className="w-5 h-5 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : null}
                      
                      {formData.companyLogo ? (
                        <div className="w-full h-full relative group/logo">
                          <img src={formData.companyLogo} alt="Logo Perusahaan" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCurrentLogo();
                              }}
                              className="w-8 h-8 rounded-full bg-white text-[#1e3a8a] flex items-center justify-center hover:scale-110 transition-transform shadow-md cursor-pointer"
                              title="Sesuaikan Ulang"
                            >
                              <Icon name="edit" className="text-[16px]" />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                logoInputRef.current?.click();
                              }}
                              className="w-8 h-8 rounded-full bg-white text-slate-600 flex items-center justify-center hover:scale-110 transition-transform shadow-md cursor-pointer"
                              title="Ganti Gambar"
                            >
                              <Icon name="upload" className="text-[16px]" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Icon name="upload_file" className="text-[#94a3b8] group-hover:text-[#1e3a8a] text-[26px] transition-colors" />
                          <span className="text-[10px] font-semibold text-[#94a3b8] group-hover:text-[#1e3a8a] transition-colors">Upload Logo</span>
                        </>
                      )}
                    </div>
                    
                    {/* Hidden File Input */}
                    <input 
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Fields */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                      <div>
                        <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Nama Perusahaan</label>
                        <input 
                          value={formData.companyName || ""} 
                          onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Email Layanan</label>
                        <input 
                          value={formData.supportEmail || ""} 
                          onChange={e => setFormData({ ...formData, supportEmail: e.target.value })}
                          className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Alamat Kantor Pusat</label>
                        <textarea 
                          value={formData.hqAddress || ""} 
                          onChange={e => setFormData({ ...formData, hqAddress: e.target.value })} 
                          rows={2}
                          className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 resize-none transition-all" 
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* MASTER DATA KEPERLUAN */}
              {activeSection === "Master Data Keperluan" && (
                <SectionCard
                  title="Master Data Purpose of Trip"
                  subtitle="Kelola daftar pilihan keperluan perjalanan dinas yang dapat dipilih pengguna saat mengajukan armada."
                >
                  <div className="space-y-4">
                    {/* Add Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPurposeName}
                        onChange={(e) => setNewPurposeName(e.target.value)}
                        placeholder="Tambah Purpose Baru (contoh: Inspeksi Lapangan)..."
                        className="flex-1 h-10 px-3 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        onClick={handleAddPurpose}
                        className="h-10 px-4 bg-blue-700 hover:bg-blue-800 text-white text-[12.5px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Icon name="add" className="text-base" /> Tambah
                      </button>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <div className="col-span-1">#</div>
                        <div className="col-span-7">Nama Keperluan / Purpose</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2 text-right">Aksi</div>
                      </div>

                      {purposes.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 italic text-[12.5px]">
                          Belum ada Master Data Purpose.
                        </div>
                      ) : (
                        purposes.map((p, idx) => {
                          const isEdit = editingPurpose?.id === p.id;
                          return (
                            <div
                              key={p.id}
                              className="px-4 py-2.5 grid grid-cols-12 items-center text-[12.5px] hover:bg-slate-50/50"
                            >
                              <div className="col-span-1 font-mono font-bold text-slate-400">
                                {idx + 1}
                              </div>
                              <div className="col-span-7 font-medium text-slate-800">
                                {isEdit ? (
                                  <input
                                    value={editingPurpose.name}
                                    onChange={(e) =>
                                      setEditingPurpose({ ...editingPurpose, name: e.target.value })
                                    }
                                    className="w-full px-2 py-1 border border-blue-400 rounded-lg text-[12.5px]"
                                  />
                                ) : (
                                  p.name
                                )}
                              </div>
                              <div className="col-span-2 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    p.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {p.is_active ? "Aktif" : "Non-Aktif"}
                                </span>
                              </div>
                              <div className="col-span-2 flex items-center justify-end gap-1.5">
                                {isEdit ? (
                                  <>
                                    <button
                                      onClick={handleUpdatePurpose}
                                      className="p-1 text-green-600 hover:text-green-800 cursor-pointer"
                                      title="Simpan"
                                    >
                                      <Icon name="check" className="text-lg" />
                                    </button>
                                    <button
                                      onClick={() => setEditingPurpose(null)}
                                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                      title="Batal"
                                    >
                                      <Icon name="close" className="text-lg" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setEditingPurpose(p)}
                                      className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                                      title="Edit"
                                    >
                                      <Icon name="edit" className="text-base" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePurpose(p.id)}
                                      className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                      title="Hapus"
                                    >
                                      <Icon name="delete" className="text-base" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* MASTER DATA KOTA */}
              {activeSection === "Master Data Kota" && (
                <SectionCard
                  title="Master Data Destination City (Kota Tujuan)"
                  subtitle="Kelola daftar Kota & Kabupaten se-Indonesia yang dapat dicari/dipilih pengguna saat mengajukan armada."
                >
                  <div className="space-y-4">
                    {/* Add Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newCityName}
                        onChange={(e) => setNewCityName(e.target.value)}
                        placeholder="Nama Kota / Kabupaten (misal: Surabaya)..."
                        className="h-10 px-3 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <input
                        type="text"
                        value={newCityProvince}
                        onChange={(e) => setNewCityProvince(e.target.value)}
                        placeholder="Provinsi (misal: Jawa Timur)..."
                        className="h-10 px-3 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        onClick={handleAddCity}
                        className="h-10 px-4 bg-blue-700 hover:bg-blue-800 text-white text-[12.5px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Icon name="add" className="text-base" /> Tambah Kota
                      </button>
                    </div>

                    {/* Filter Search */}
                    <div className="relative">
                      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                      <input
                        type="text"
                        value={citySearchTerm}
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        placeholder="Cari nama kota atau provinsi..."
                        className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[12px]"
                      />
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
                      <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Nama Kota / Kabupaten</div>
                        <div className="col-span-4">Provinsi</div>
                        <div className="col-span-2 text-right">Aksi</div>
                      </div>

                      {(() => {
                        const filtered = cities.filter(c => 
                          c.name.toLowerCase().includes(citySearchTerm.toLowerCase()) || 
                          (c.province && c.province.toLowerCase().includes(citySearchTerm.toLowerCase()))
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="p-4 text-center text-slate-400 italic text-[12.5px]">
                              Tidak ada kota yang cocok.
                            </div>
                          );
                        }

                        return filtered.map((c, idx) => {
                          const isEdit = editingCity?.id === c.id;
                          return (
                            <div
                              key={c.id}
                              className="px-4 py-2.5 grid grid-cols-12 items-center text-[12.5px] hover:bg-slate-50/50"
                            >
                              <div className="col-span-1 font-mono font-bold text-slate-400">
                                {idx + 1}
                              </div>
                              <div className="col-span-5 font-bold text-slate-800">
                                {isEdit ? (
                                  <input
                                    value={editingCity.name}
                                    onChange={(e) =>
                                      setEditingCity({ ...editingCity, name: e.target.value })
                                    }
                                    className="w-full px-2 py-1 border border-blue-400 rounded-lg text-[12.5px]"
                                  />
                                ) : (
                                  c.name
                                )}
                              </div>
                              <div className="col-span-4 text-slate-600">
                                {isEdit ? (
                                  <input
                                    value={editingCity.province || ""}
                                    onChange={(e) =>
                                      setEditingCity({ ...editingCity, province: e.target.value })
                                    }
                                    className="w-full px-2 py-1 border border-blue-400 rounded-lg text-[12.5px]"
                                  />
                                ) : (
                                  c.province || "-"
                                )}
                              </div>
                              <div className="col-span-2 flex items-center justify-end gap-1.5">
                                {isEdit ? (
                                  <>
                                    <button
                                      onClick={handleUpdateCity}
                                      className="p-1 text-green-600 hover:text-green-800 cursor-pointer"
                                      title="Simpan"
                                    >
                                      <Icon name="check" className="text-lg" />
                                    </button>
                                    <button
                                      onClick={() => setEditingCity(null)}
                                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                      title="Batal"
                                    >
                                      <Icon name="close" className="text-lg" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setEditingCity(c)}
                                      className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                                      title="Edit"
                                    >
                                      <Icon name="edit" className="text-base" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCity(c.id)}
                                      className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                      title="Hapus"
                                    >
                                      <Icon name="delete" className="text-base" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* NOTIFICATIONS */}
              {activeSection === "Notifications" && (
                <SectionCard title="Notifikasi" subtitle="Konfigurasikan bagaimana dan kapan sistem mengirimkan peringatan.">
                  <div className="space-y-0 divide-y divide-[#f8fafc]">
                    {[
                      { 
                        key: "emailAlerts",
                        label: "Email Alerts", 
                        sub: "Kirim peringatan kritis ke alamat email admin.", 
                        val: formData.emailAlerts
                      },
                      { 
                        key: "smsAlerts",
                        label: "SMS Alerts", 
                        sub: "Kirim notifikasi mendesak via SMS gateway.", 
                        val: formData.smsAlerts
                      },
                      { 
                        key: "pushNotifs",
                        label: "Push Notifications", 
                        sub: "Aktifkan notifikasi push browser dalam aplikasi.", 
                        val: formData.pushNotifs
                      },
                      { 
                        key: "digestMode",
                        label: "Daily Digest Mode", 
                        sub: "Bundel peringatan non-kritis ke dalam ringkasan email harian.", 
                        val: formData.digestMode
                      },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between py-3.5">
                        <div>
                          <div className="text-[13px] font-semibold text-[#0f172a]">{item.label}</div>
                          <div className="text-[12px] text-[#64748b] mt-0.5">{item.sub}</div>
                        </div>
                        <Toggle 
                          checked={!!item.val} 
                          onChange={() => setFormData({ ...formData, [item.key]: !item.val })} 
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl border-2 border-[#fecdd3] shadow-sm p-5 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 bg-[#fee2e2] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon name="dangerous" className="text-[#dc2626] text-[20px]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#dc2626]">Danger Zone</h3>
                    <p className="text-[12px] text-[#64748b] mt-0.5">Tindakan ini tidak dapat dibatalkan. Harap lanjutkan dengan sangat hati-hati.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { 
                      label: "Flush All Caches", 
                      sub: "Bersihkan cache aplikasi dan CDN. Layanan akan memuat ulang data segar pada request berikutnya.", 
                      btn: "Flush Cache", 
                      btnColor: "border-[#fca5a5] text-[#dc2626] hover:bg-[#fff1f2]",
                      action: handleFlushCache
                    },
                    { 
                      label: "Purge Audit Logs", 
                      sub: "Hapus semua log aktivitas secara permanen dari database sistem.", 
                      btn: "Purge Logs", 
                      btnColor: "border-[#fca5a5] text-[#dc2626] hover:bg-[#fff1f2]",
                      action: handlePurgeLogs
                    },
                  ].map(item => (
                    <div key={item.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-[#fff1f2] last:border-0">
                      <div>
                        <div className="text-[13px] font-semibold text-[#0f172a]">{item.label}</div>
                        <div className="text-[12px] text-[#64748b] mt-0.5 max-w-sm">{item.sub}</div>
                      </div>
                      <button 
                        onClick={item.action}
                        className={`flex-shrink-0 ml-4 h-9 px-4 border-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${item.btnColor}`}
                      >
                        {item.btn}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* end right content */}
          </div>{/* end 2-col */}
        </div>{/* end canvas */}

      {/* ── IMAGE CROPPER MODAL ── */}
      {cropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-slate-800">Sesuaikan Logo</h3>
                <p className="text-[11.5px] text-slate-400">Geser untuk memindahkan, gunakan slider di bawah untuk zoom.</p>
              </div>
              <button onClick={() => setCropModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            {/* Modal Body / Crop Container */}
            <div className="p-6 flex flex-col items-center justify-center bg-slate-50">
              <div 
                className="w-[240px] h-[200px] border-2 border-[#1e3a8a] rounded-xl overflow-hidden relative cursor-move bg-white shadow-inner select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img 
                  id="crop-preview-img"
                  src={imageSrc} 
                  alt="Crop Preview" 
                  className="w-full h-full object-contain pointer-events-none select-none"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transformOrigin: 'center center'
                  }}
                />
                
                {/* Visual crop guidelines helper */}
                <div className="absolute inset-0 pointer-events-none border border-dashed border-slate-300/40 rounded-lg"></div>
              </div>

              {/* Zoom Control */}
              <div className="w-full mt-5 flex items-center gap-3 px-2">
                <Icon name="zoom_out" className="text-slate-400 text-[18px]" />
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.05"
                  value={zoom} 
                  onChange={e => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]"
                />
                <Icon name="zoom_in" className="text-[#1e3a8a] text-[18px]" />
                <span className="text-[11px] font-bold text-slate-500 w-8 text-right">{Math.round(zoom * 100)}%</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button 
                onClick={() => setCropModalOpen(false)}
                className="px-4 h-9 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={saveCroppedImage}
                className="px-4 h-9 rounded-xl bg-[#1e3a8a] text-[12px] font-semibold text-white hover:bg-[#1e3a8a]/90 transition-colors flex items-center gap-1.5 shadow-md shadow-blue-900/10"
              >
                <Icon name="check" className="text-[16px]" />
                Crop & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined{font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;vertical-align:middle;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px;}
        select{appearance:none;-webkit-appearance:none;}
      `}</style>
    </Layout>
  );
}