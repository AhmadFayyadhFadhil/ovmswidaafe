import { NAV_MAIN, NAV_ADMIN } from "./navData";
import { Icon } from "./Icon";

export function Sidebar({ activeNav, onNavigate }: { activeNav: string; onNavigate?: (p: string) => void }) {
  const go = (label: string) => { onNavigate?.(label); };
  const btn = (item: { icon: string; label: string }) => (
    <button key={item.label} onClick={() => go(item.label)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
        activeNav === item.label
          ? "bg-[#1e3a8a] text-white shadow-sm scale-[1.01]"
          : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b] hover:translate-x-0.5"
      }`}>
      <Icon name={item.icon} className={`text-[21px] flex-shrink-0 ${activeNav === item.label ? "text-white" : "text-[#64748b]"}`} />
      <span className="text-[13.5px] font-semibold truncate">{item.label}</span>
    </button>
  );
  return (
    <aside className="w-[220px] flex-shrink-0 bg-white border-r border-[#e2e8f0] flex flex-col overflow-y-auto">
      <div className="flex items-center gap-3 px-5 pt-6 pb-6">
        <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-sm">
          <Icon name="directions_car" className="text-white text-[22px]" />
        </div>
        <div>
          <div className="text-[17px] font-bold text-[#0f172a] leading-tight">OVMS</div>
          <div className="text-[11px] text-[#94a3b8] font-medium">Enterprise Fleet</div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_MAIN.map(btn)}
        <div className="pt-4 pb-2 px-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Administration</span>
        </div>
        {NAV_ADMIN.map(btn)}
      </nav>
      <div className="h-4" />
    </aside>
  );
}