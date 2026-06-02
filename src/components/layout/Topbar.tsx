import { Icon } from "./Icon";

export function Topbar({ title, userName = "Admin User", userRole = "Administrator", searchPlaceholder = "Quick search...", searchValue, onSearchChange }:
  { title: string; userName?: string; userRole?: string; searchPlaceholder?: string; searchValue?: string; onSearchChange?: (value: string) => void }) {
  return (
    <header className="bg-white border-b border-[#e2e8f0] px-8 h-[68px] flex items-center justify-between flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-6">
        <h1 className="text-[18px] font-bold text-[#0f172a]">{title}</h1>
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
          <input type="text" value={searchValue} onChange={e => onSearchChange?.(e.target.value)} placeholder={searchPlaceholder}
            className="h-9 pl-9 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-full text-[13px] text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 w-56" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f1f5f9]">
          <Icon name="notifications" className="text-[#475569] text-[22px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ef4444] rounded-full border-2 border-white" />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f1f5f9]">
          <Icon name="warning" className="text-[#475569] text-[22px]" />
        </button>
        <div className="w-px h-7 bg-[#e2e8f0] mx-2" />
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="text-right">
            <div className="text-[13px] font-bold text-[#0f172a] leading-tight">{userName}</div>
            <div className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider">{userRole}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#1e3a8a] border-2 border-[#e2e8f0] overflow-hidden">
            <img src="https://i.pravatar.cc/40?img=12" alt="" className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        </div>
      </div>
    </header>
  );
}