import { useState } from "react";
import { Layout, Icon } from "../../../components/layout/RoleLayout";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HCV_H  = [120,180,150,220,200,210,190];
const SED_H  = [80, 100,90, 110,120,100,130];

function MiniBar({ vals, color }: { vals: number[]; color: string }) {
  const max = Math.max(...vals);
  return (
    <div className="flex items-end gap-0.5 h-10 mt-2">
      {vals.map((v,i) => (
        <div key={i} className={`flex-1 rounded-sm ${i===vals.length-1?color+"80":color} transition-all`} style={{height:`${(v/max)*100}%`}} />
      ))}
    </div>
  );
}

function DonutChart() {
  const r = 60, cx = 80, cy = 80, stroke = 18;
  const circ = 2*Math.PI*r;
  const approved = circ*0.69, pending = circ*0.19, rejected = circ*0.12;
  return (
    <svg viewBox="0 0 160 160" width="160" height="160">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF0000" strokeWidth={stroke}
        strokeDasharray={`${rejected} ${circ}`} strokeDashoffset={0} transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF9D23" strokeWidth={stroke}
        strokeDasharray={`${pending} ${circ}`} strokeDashoffset={-rejected} transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#16a34a" strokeWidth={stroke}
        strokeDasharray={`${approved} ${circ}`} strokeDashoffset={-(rejected+pending)} transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy-6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a" fontFamily="Inter,sans-serif">842</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8" fontFamily="Inter,sans-serif">TOTAL</text>
    </svg>
  );
}

export default function Reports({ onNavigate }: { onNavigate?: (p:string)=>void }) {
  const [dept,   setDept]   = useState("All Departments");
  const [type,   setType]   = useState("All Vehicles");
  const [status, setStatus] = useState("Any Status");
  const [generated, setGenerated] = useState(false);

  return (
    <Layout activeNav="Reports & Analytics" onNavigate={onNavigate} topbarTitle="Reports & Analytics" searchPlaceholder="Search reports..." userRole="Administrator">
      <div className="p-6 space-y-5 animate-fadein">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Reports &amp; Analytics</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Real-time performance tracking and fleet efficiency insights.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-2 h-10 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f1f5f9] shadow-sm">
              <Icon name="calendar_today" className="text-[16px]" />
              Oct 01, 2023 – Oct 31, 2023
              <Icon name="keyboard_arrow_down" className="text-[16px]" />
            </button>
            <button className="flex items-center gap-2 h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] shadow-sm">
              <Icon name="download" className="text-[16px]" />Export
            </button>
            <button onClick={()=>setGenerated(true)}
              className="flex items-center gap-2 h-10 px-5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold shadow-sm active:scale-95 transition-all">
              <Icon name="bar_chart" className="text-[17px]" />
              {generated?"Report Ready!":"Generate Report"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
          <div className="grid grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Department</label>
              <select value={dept} onChange={e=>setDept(e.target.value)} className="w-full h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20">
                <option>All Departments</option><option>Logistics</option><option>Operations</option><option>Finance</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Vehicle Type</label>
              <select value={type} onChange={e=>setType(e.target.value)} className="w-full h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20">
                <option>All Vehicles</option><option>Sedan</option><option>SUV</option><option>Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Status</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20">
                <option>Any Status</option><option>Active</option><option>Completed</option><option>Pending</option>
              </select>
            </div>
            <button onClick={()=>{setDept("All Departments");setType("All Vehicles");setStatus("Any Status");}}
              className="h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[13px] font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors">
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Mini KPI Cards */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label:"Vehicle Usage", value:"12,480", unit:"hrs", vals:[60,70,55,80,65,90,100], color:"bg-[#bfdbfe]" },
            { label:"Requests",      value:"842",    unit:"",    vals:[50,60,55,70,65,80,75],  color:"bg-[#bfdbfe]" },
            { label:"Avg Utilization",value:"76.4",  unit:"%",   vals:[80,75,70,65,72,68,76], color:"bg-[#bfdbfe]" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] leading-tight">{c.label}</div>
              </div>
              <div className="mt-2 text-[20px] font-bold text-[#0f172a] leading-tight">{c.value}<span className="text-[13px] text-[#94a3b8] font-medium ml-0.5">{c.unit}</span></div>
              <MiniBar vals={c.vals} color={c.color} />
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-4">
          {/* Bar Chart */}
          <div className="col-span-8 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-bold text-[#0f172a]">Fleet Utilization Trends</h3>
                <p className="text-[12px] text-[#64748b]">Daily operational hours per vehicle category</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#1e3a8a]" /><span className="text-[12px] text-[#475569]">HCV</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#93c5fd]" /><span className="text-[12px] text-[#475569]">Sedan</span></div>
              </div>
            </div>
            <div className="flex items-end gap-3 h-[200px]">
              {DAYS.map((day,i) => {
                const maxTotal = Math.max(...DAYS.map((_,j)=>HCV_H[j]+SED_H[j]));
                const hh = (HCV_H[i]/maxTotal)*180;
                const sh = (SED_H[i]/maxTotal)*180;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-0">
                    <div className="w-full flex flex-col justify-end" style={{height:180}}>
                      <div className="w-full bg-[#1e3a8a] rounded-t-sm transition-all hover:opacity-80" style={{height:hh}} />
                      <div className="w-full bg-[#93c5fd] transition-all hover:opacity-80" style={{height:sh}} />
                    </div>
                    <div className="text-[11px] text-[#94a3b8] mt-2 font-medium">{day}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="col-span-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
            <h3 className="text-[15px] font-bold text-[#0f172a] mb-4">Request Status</h3>
            <div className="flex justify-center"><DonutChart /></div>
            <div className="mt-4 space-y-2">
              {[
                { label:"Approved", count:"580 (69%)", color:"bg-[#16a34a]" },
                { label:"Pending",  count:"162 (19%)", color:"bg-[#FF9D23]" },
                { label:"Rejected", count:"100 (12%)", color:"bg-[#FF0000]" },
              ].map(item=>(
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-[13px] text-[#475569]">{item.label}</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#0f172a]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
