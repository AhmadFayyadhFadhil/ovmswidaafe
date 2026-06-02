import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
export { Icon } from "./Icon";
export { Sidebar } from "./Sidebar";
export { Topbar } from "./Topbar";

export function Layout({ activeNav, onNavigate, topbarTitle, userName, userRole, searchPlaceholder, searchValue, onSearchChange, children }:
  { activeNav: string; onNavigate?: (p:string)=>void; topbarTitle: string; userName?: string; userRole?: string; searchPlaceholder?: string; searchValue?: string; onSearchChange?: (value: string) => void; children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden animate-fadein" style={{ fontFamily:"'Inter',sans-serif" }}>
      <Sidebar activeNav={activeNav} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={topbarTitle} userName={userName} userRole={userRole} searchPlaceholder={searchPlaceholder} searchValue={searchValue} onSearchChange={onSearchChange} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined{font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;vertical-align:middle;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px;}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .animate-fadein{animation:fadein 0.25s ease-out;}
        @keyframes slidein{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        .animate-slidein{animation:slidein 0.2s ease-out;}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
        .animate-pulse-dot{animation:pulse-dot 1.5s ease-in-out infinite;}
      `}</style>
    </div>
  );
}
