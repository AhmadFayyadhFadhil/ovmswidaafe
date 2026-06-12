import { useState, type ReactNode } from "react";
import { Layout } from "@/components/layout/RoleLayout";

const SETTING_SECTIONS = [
  { icon: "settings",        label: "General Settings" },
  { icon: "business",        label: "Company Info"     },
  { icon: "key",             label: "Authentication"   },
  { icon: "shield",          label: "Security"         },
  { icon: "notifications",   label: "Notifications"    },
  { icon: "cloud_upload",    label: "Backup & Storage" },
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
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 pl-3 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 appearance-none cursor-pointer">
        {options.map(o => <option key={o}>{o}</option>)}
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
  const [activeSection, setActiveSection] = useState("Company Info");
  const [saved,         setSaved]         = useState(false);
  const [resetDone,     setResetDone]     = useState(false);

  // General Settings state
  const [systemName, setSystemName]   = useState("OVMS Enterprise Hub");
  const [timezone,   setTimezone]     = useState("UTC (Coordinated Universal Time)");
  const [dateFormat, setDateFormat]   = useState("MM/DD/YYYY");
  const [language,   setLanguage]     = useState("English (United States)");

  // Company Info state
  const [companyName,  setCompanyName]  = useState("Global Logistics Solutions Inc.");
  const [supportEmail, setSupportEmail] = useState("support@gls-logistics.com");
  const [hqAddress,    setHqAddress]    = useState("1200 Enterprise Way, Tech District, San Francisco, CA 94105");

  // Auth state
  const [mfaEnabled,     setMfaEnabled]     = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [loginRetry,     setLoginRetry]     = useState("5 Attempts");

  // Security state
  const [ipWhitelist, setIpWhitelist]   = useState("10.42.100.5, 10.42.180.12, 192.174.4.21");
  const [encryption,  setEncryption]    = useState(true);
  const [twoFactor,   setTwoFactor]     = useState(false);

  // Notification state
  const [emailAlerts,  setEmailAlerts]  = useState(true);
  const [smsAlerts,    setSmsAlerts]    = useState(false);
  const [pushNotifs,   setPushNotifs]   = useState(true);
  const [digestMode,   setDigestMode]   = useState(false);

  // Backup state
  const [autoBackup,   setAutoBackup]   = useState(true);
  const [backupFreq,   setBackupFreq]   = useState("Every 6 Hours");
  const [retentionDays,setRetentionDays]= useState("30 Days");

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const handleReset = () => { setResetDone(true); setTimeout(() => setResetDone(false), 2000); };

  return (
    <Layout
      activeNav="System Settings"
      onNavigate={onNavigate}
      topbarTitle="System Settings"
      searchPlaceholder="Search settings..."
      userName="Admin User"
      userRole="Administrator"
    >
      <div className="flex-1 overflow-y-auto p-6">

          {/* Page header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[24px] font-bold text-[#0f172a]">System Settings</h2>
              <p className="text-[13px] text-[#64748b] mt-0.5">Manage system configuration, security, notifications, and operational settings.</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={handleReset}
                className={`h-10 px-5 border rounded-xl text-[13px] font-bold transition-all active:scale-95 ${
                  resetDone ? "bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]" : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc] shadow-sm"
                }`}>
                {resetDone ? "✓ Resetted" : "Reset Changes"}
              </button>
              <button onClick={handleSave}
                className={`h-10 px-6 rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-sm ${
                  saved ? "bg-[#16a34a] text-white" : "bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
                }`}>
                {saved ? "✓ Saved!" : "Save Settings"}
              </button>
            </div>
          </div>

          {/* System Status Bar */}
          <div className="grid grid-cols-6 gap-3 mb-5">
            {[
              { label:"MODULES",     value:"12",      sub:"All Active",      valueColor:"text-[#0f172a]", subColor:"text-[#16a34a]", icon:"apps",          bg:"bg-[#e8edf8]", iconCol:"text-[#1e3a8a]" },
              { label:"SECURITY",    value:"Secure",  sub:"Threat Level: Low",valueColor:"text-[#16a34a]",subColor:"text-[#64748b]", icon:"shield",        bg:"bg-[#dcfce7]", iconCol:"text-[#16a34a]" },
              { label:"BACKUP",      value:"Success", sub:"Last: 2h ago",     valueColor:"text-[#0f172a]",subColor:"text-[#64748b]", icon:"cloud_done",    bg:"bg-[#e0f2fe]", iconCol:"text-[#0369a1]" },
              { label:"NOTIFY",      value:"Active",  sub:"Services up",      valueColor:"text-[#0f172a]",subColor:"text-[#64748b]", icon:"notifications", bg:"bg-[#fef3c7]", iconCol:"text-[#d97706]" },
              { label:"SESSIONS",    value:"42",      sub:"Concurrent users",  valueColor:"text-[#0f172a]",subColor:"text-[#64748b]", icon:"group",         bg:"bg-[#ede9fe]", iconCol:"text-[#7c3aed]" },
              { label:"HEALTH",      value:"99.9%",   sub:"Optimal Uptime",   valueColor:"text-[#0f172a]",subColor:"text-[#16a34a]", icon:"favorite",      bg:"bg-[#dcfce7]", iconCol:"text-[#16a34a]" },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon name={c.icon} className={`${c.iconCol} text-[17px]`} />
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8]">{c.label}</div>
                <div className={`text-[17px] font-bold leading-tight mt-0.5 ${c.valueColor}`}>{c.value}</div>
                <div className={`text-[10px] font-medium mt-0.5 ${c.subColor}`}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Main 2-col layout */}
          <div className="flex gap-5">

            {/* ── Left Nav ── */}
            <div className="w-[220px] flex-shrink-0">
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-[#f1f5f9]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Navigation</span>
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
              <SectionCard title="General Settings" subtitle="Core application preferences and localization.">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">System Name</label>
                    <input value={systemName} onChange={e => setSystemName(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Timezone</label>
                    <Select value={timezone} onChange={setTimezone} options={["UTC (Coordinated Universal Time)","GMT +7 (Western Indonesia Time)","EST (Eastern Standard Time)","PST (Pacific Standard Time)"]} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Date Format</label>
                    <Select value={dateFormat} onChange={setDateFormat} options={["MM/DD/YYYY","DD/MM/YYYY","YYYY-MM-DD","DD-MMM-YYYY"]} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">System Language</label>
                    <Select value={language} onChange={setLanguage} options={["English (United States)","English (United Kingdom)","Bahasa Indonesia","Mandarin Chinese"]} />
                  </div>
                </div>
              </SectionCard>

              {/* COMPANY INFO */}
              <SectionCard title="Company Information" subtitle="Manage your organization's identity and contact details.">
                <div className="flex gap-5">
                  {/* Logo upload */}
                  <div className="w-[120px] h-[100px] flex-shrink-0 bg-[#f8fafc] border-2 border-dashed border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#1e3a8a]/40 hover:bg-[#eff6ff] transition-all group">
                    <Icon name="upload_file" className="text-[#94a3b8] group-hover:text-[#1e3a8a] text-[26px] transition-colors" />
                    <span className="text-[10px] font-semibold text-[#94a3b8] group-hover:text-[#1e3a8a] transition-colors">Upload Logo</span>
                  </div>
                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-2 gap-4 content-start">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Company Name</label>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Support Email</label>
                      <input value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Headquarters Address</label>
                      <textarea value={hqAddress} onChange={e => setHqAddress(e.target.value)} rows={2}
                        className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 resize-none transition-all" />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* AUTHENTICATION */}
              <SectionCard title="Authentication" subtitle="Control user access and session policies.">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-[#f8fafc]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#0f172a]">Multi-Factor Authentication (MFA)</div>
                      <div className="text-[12px] text-[#64748b] mt-0.5">Require a secondary verification code for all users.</div>
                    </div>
                    <Toggle checked={mfaEnabled} onChange={() => setMfaEnabled(p => !p)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Session Timeout (Minutes)</label>
                      <div className="flex items-center gap-2">
                        <input value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} type="number" min="5" max="120"
                          className="flex-1 h-10 px-3 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" />
                        <span className="text-[12px] font-semibold text-[#94a3b8] flex-shrink-0">min</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Login Retry Limit</label>
                      <Select value={loginRetry} onChange={setLoginRetry} options={["3 Attempts","5 Attempts","10 Attempts","Unlimited"]} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-[#f8fafc]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#0f172a]">Two-Factor Authentication (2FA)</div>
                      <div className="text-[12px] text-[#64748b] mt-0.5">Enable app-based TOTP for admin accounts.</div>
                    </div>
                    <Toggle checked={twoFactor} onChange={() => setTwoFactor(p => !p)} />
                  </div>
                </div>
              </SectionCard>

              {/* SECURITY */}
              <SectionCard title="Security" subtitle="Enhanced network and data protection settings.">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[13px] font-semibold text-[#0f172a]">IP Whitelist Restrictions</label>
                      <button className="text-[12px] font-bold text-[#1e3a8a] hover:underline flex items-center gap-1">
                        <Icon name="add" className="text-[14px]" />Add New IP
                      </button>
                    </div>
                    <textarea value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} rows={3}
                      className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-mono text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 resize-none transition-all" />
                    <p className="text-[11px] text-[#94a3b8] mt-1.5">Comma separated list of authorized IP addresses.</p>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-[#f8fafc]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#0f172a]">Advanced Data Encryption</div>
                      <div className="text-[12px] text-[#64748b] mt-0.5">Enable AES-256 bit encryption for all database records at rest.</div>
                    </div>
                    <Toggle checked={encryption} onChange={() => setEncryption(p => !p)} />
                  </div>
                </div>
              </SectionCard>

              {/* NOTIFICATIONS */}
              <SectionCard title="Notifications" subtitle="Configure how and when the system sends alerts.">
                <div className="space-y-0 divide-y divide-[#f8fafc]">
                  {[
                    { label:"Email Alerts",      sub:"Send critical alerts to admin email addresses.",     val:emailAlerts,  set:setEmailAlerts  },
                    { label:"SMS Alerts",         sub:"Send urgent notifications via SMS gateway.",         val:smsAlerts,    set:setSmsAlerts    },
                    { label:"Push Notifications", sub:"Enable in-app browser push notifications.",          val:pushNotifs,   set:setPushNotifs   },
                    { label:"Daily Digest Mode",  sub:"Bundle non-critical alerts into a daily email summary.", val:digestMode, set:setDigestMode },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-3.5">
                      <div>
                        <div className="text-[13px] font-semibold text-[#0f172a]">{item.label}</div>
                        <div className="text-[12px] text-[#64748b] mt-0.5">{item.sub}</div>
                      </div>
                      <Toggle checked={item.val} onChange={() => item.set((p: boolean) => !p)} />
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* BACKUP & STORAGE */}
              <SectionCard title="Backup & Storage" subtitle="Automated backup policies and retention configuration.">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-[#f8fafc]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#0f172a]">Automatic Backup</div>
                      <div className="text-[12px] text-[#64748b] mt-0.5">Enable scheduled cloud backups for all system data.</div>
                    </div>
                    <Toggle checked={autoBackup} onChange={() => setAutoBackup(p => !p)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Backup Frequency</label>
                      <Select value={backupFreq} onChange={setBackupFreq}
                        options={["Every Hour","Every 6 Hours","Every 12 Hours","Daily","Weekly"]} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Retention Period</label>
                      <Select value={retentionDays} onChange={setRetentionDays}
                        options={["7 Days","14 Days","30 Days","60 Days","90 Days"]} />
                    </div>
                  </div>
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3.5 flex items-start gap-3">
                    <Icon name="check_circle" className="text-[#16a34a] text-[20px] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13px] font-bold text-[#15803d]">Last backup completed successfully</div>
                      <div className="text-[12px] text-[#16a34a] mt-0.5">2 hours ago — 3.4 GB transferred to cloud storage</div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl border-2 border-[#fecdd3] shadow-sm p-5 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 bg-[#fee2e2] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon name="dangerous" className="text-[#dc2626] text-[20px]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#dc2626]">Danger Zone</h3>
                    <p className="text-[12px] text-[#64748b] mt-0.5">These actions are irreversible. Please proceed with extreme caution.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label:"Flush All Caches",      sub:"Clear application and CDN caches. Services will regenerate cache on next request.", btn:"Flush Cache",   btnColor:"border-[#fca5a5] text-[#dc2626] hover:bg-[#fff1f2]" },
                    { label:"Reset System to Default",sub:"Restore all settings to factory defaults. This will log out all active users.",    btn:"Reset System",  btnColor:"border-[#fca5a5] text-[#dc2626] hover:bg-[#fff1f2]" },
                    { label:"Purge Audit Logs",       sub:"Permanently delete all audit log entries older than 90 days.",                   btn:"Purge Logs",    btnColor:"border-[#fca5a5] text-[#dc2626] hover:bg-[#fff1f2]" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#fff1f2] last:border-0">
                      <div>
                        <div className="text-[13px] font-semibold text-[#0f172a]">{item.label}</div>
                        <div className="text-[12px] text-[#64748b] mt-0.5 max-w-sm">{item.sub}</div>
                      </div>
                      <button className={`flex-shrink-0 ml-4 h-9 px-4 border-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${item.btnColor}`}>
                        {item.btn}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* end right content */}
          </div>{/* end 2-col */}
        </div>{/* end canvas */}

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