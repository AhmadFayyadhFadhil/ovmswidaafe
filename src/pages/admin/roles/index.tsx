import { useState } from "react";
import { Layout, Icon } from "../../../components/layout/RoleLayout";
const ROLES = [
  { icon:"gavel",                   label:"Approver",         sub:"Financial & asset approvals" },
  { icon:"admin_panel_settings",    label:"Administrator",    sub:"Full system access & control" },
  { icon:"directions_car",          label:"Driver",           sub:"Vehicle data access only" },
  { icon:"work",                    label:"Employee",         sub:"Standard view permissions" },
];

const MODULES = ["Dashboard","Vehicles","Requests","Reports"];
const ACTIONS = ["VIEW","CREATE","EDIT","DELETE","APPROVE","MANAGE"];

const DEFAULT_PERMS: Record<string, Record<string, boolean>> = {
  Dashboard: { VIEW:true, CREATE:false, EDIT:false, DELETE:false, APPROVE:false, EXPORT:false, MANAGE:true },
  Vehicles:  { VIEW:true, CREATE:true,  EDIT:true,  DELETE:false, APPROVE:false, EXPORT:true,  MANAGE:false },
  Requests:  { VIEW:true, CREATE:true,  EDIT:true,  DELETE:false, APPROVE:true,  EXPORT:true,  MANAGE:false },
  Reports:   { VIEW:true, CREATE:false, EDIT:false, DELETE:false, APPROVE:false, EXPORT:true,  MANAGE:false },
};

const USERS = [
  { name:"Sarah Connor", sub:"sarah.c@ovms.com",   dept:"Global Operations", role:"Administrator", roleColor:"bg-[#dbeafe] text-[#1d4ed8]", img:"https://i.pravatar.cc/32?img=44" },
  { name:"James Wilson", sub:"j.wilson@ovms.com",  dept:"Finance",          role:"Approver",      roleColor:"bg-[#dcfce7] text-[#16a34a]", img:"https://i.pravatar.cc/32?img=55" },
  { name:"Emily Blunt",  sub:"e.blunt@ovms.com",   dept:"Logistics",        role:"Driver",        roleColor:"bg-[#f1f5f9] text-[#475569]",  img:"https://i.pravatar.cc/32?img=66" },
];

export default function Role({ onNavigate }: { onNavigate?: (p:string)=>void }) {
  const [selectedRole, setSelectedRole] = useState("Approver");
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [selectAll, setSelectAll] = useState(true);
  const [saved, setSaved] = useState(false);

  const togglePerm = (mod: string, action: string) => {
    setPerms(prev => ({ ...prev, [mod]: { ...prev[mod], [action]: !prev[mod][action] } }));
    setSaved(false);
  };

  return (
    <Layout activeNav="Role Management" onNavigate={onNavigate} topbarTitle="Role Management" searchPlaceholder="Search roles..." userName="Admin User" userRole="Administrator">
      <div className="p-6 space-y-5 animate-fadein pb-12">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[24px] font-bold text-[#0f172a]">Role Management</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Manage system roles, permissions, and access control across the enterprise.</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={()=>setSaved(true)} className="flex items-center gap-2 h-10 px-5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold shadow-sm active:scale-95 transition-all">
              <Icon name="save" className="text-[17px]" />{saved?"Changes Saved!":"Save Changes"}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label:"Total Roles",       value:"5",   icon:"shield",          bg:"bg-[#e8edf8]", color:"text-[#1e3a8a]" },
            { label:"Active Permissions",value:"124", icon:"key",             bg:"bg-[#dcfce7]", color:"text-[#16a34a]" },
          ].map(c=>(
            <div key={c.label} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon name={c.icon} className={`${c.color} text-[18px]`} />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">{c.label}</div>
              <div className="text-[22px] font-bold text-[#0f172a]">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left: System Roles */}
          <div className="col-span-4 space-y-3">
            <h3 className="text-[15px] font-bold text-[#0f172a]">System Roles</h3>
            {ROLES.map(r=>(
              <button key={r.label} onClick={()=>{setSelectedRole(r.label);setSaved(false);}}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  selectedRole===r.label
                    ? "border-[#1e3a8a] bg-[#eff6ff] shadow-sm"
                    : "border-[#e2e8f0] bg-white hover:border-[#bfdbfe] hover:bg-[#f8fafc]"
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole===r.label?"bg-[#dbeafe]":"bg-[#f1f5f9]"}`}>
                  <Icon name={r.icon} className={`text-[20px] ${selectedRole===r.label?"text-[#1d4ed8]":"text-[#64748b]"}`} />
                </div>
                <div>
                  <div className={`text-[13px] font-bold ${selectedRole===r.label?"text-[#1e3a8a]":"text-[#0f172a]"}`}>{r.label}</div>
                  <div className="text-[11px] text-[#94a3b8]">{r.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Permission Matrix */}
          <div className="col-span-8">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Permission Matrix</h3>
                  <p className="text-[12px] text-[#64748b]">Configure action-level access for <b>{selectedRole}</b> role.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#475569]">Select All Actions</span>
                  <button onClick={()=>setSelectAll(p=>!p)} className={`w-11 h-6 rounded-full transition-all ${selectAll?"bg-[#1e3a8a]":"bg-[#e2e8f0]"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${selectAll?"translate-x-5":"translate-x-0"}`} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-[#f8fafc]">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide">Module</th>
                    {ACTIONS.map(a=><th key={a} className="px-2 py-3 text-center text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide">{a}</th>)}
                  </tr></thead>
                  <tbody>
                    {MODULES.map(mod=>(
                      <tr key={mod} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3.5 flex items-center gap-2.5">
                          <Icon name={mod==="Dashboard"?"dashboard":mod==="Vehicles"?"directions_car":mod==="Requests"?"assignment":"analytics"} className="text-[#64748b] text-[18px]" />
                          <span className="text-[13px] font-semibold text-[#0f172a]">{mod}</span>
                        </td>
                        {ACTIONS.map(action=>(
                          <td key={action} className="px-2 py-3.5 text-center">
                            <button onClick={()=>togglePerm(mod,action)}
                              className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-all ${
                                perms[mod][action] ? "bg-[#1e3a8a]" : "border-2 border-[#e2e8f0] hover:border-[#1e3a8a]/40"
                              }`}>
                              {perms[mod][action] && <Icon name="check" className="text-white text-[12px]" />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* User Assignment */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-[#0f172a]">User Assignment</h3>
                  <select className="h-7 px-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[11px] font-semibold text-[#475569] focus:outline-none">
                    <option>All Roles</option><option>Administrator</option><option>Approver</option><option>Driver</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {USERS.map(u=>(
                    <div key={u.name} className="flex items-center gap-3 py-2 border-b border-[#f1f5f9] last:border-0">
                      <img src={u.img} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-[#0f172a] truncate">{u.name}</div>
                        <div className="text-[10px] text-[#94a3b8]">{u.dept}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.roleColor}`}>{u.role}</span>
                      <button className="w-6 h-6 rounded hover:bg-[#f1f5f9] flex items-center justify-center">
                        <Icon name="edit" className="text-[#94a3b8] text-[14px]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Timeline */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-[#0f172a]">Audit Timeline</h3>
                  <button className="text-[11px] font-bold text-[#1e3a8a] hover:underline">View History</button>
                </div>
                <div className="space-y-3.5">
                  {[
                    { title:"Role Modification", desc:"Alex Rivera updated 'Delete' permission for Approver role.", time:"2 hours ago • Session #9921", color:"border-[#dc2626]" },
                    { title:"User Assignment",   desc:"Emily Blunt was assigned the Driver role.", time:"Yesterday, 14:32 • Auto-sync", color:"border-[#1e3a8a]" },
                    { title:"Emergency Access",  desc:"System auto-revoked temporary Super Admin access for User #405.", time:"3 days ago • Security Policy", color:"border-[#d97706]" },
                  ].map((ev,i)=>(
                    <div key={i} className={`pl-3 border-l-2 ${ev.color}`}>
                      <div className="text-[12px] font-bold text-[#0f172a]">{ev.title}</div>
                      <div className="text-[11px] text-[#475569] mt-0.5">{ev.desc}</div>
                      <div className="text-[10px] text-[#94a3b8] mt-0.5">{ev.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
