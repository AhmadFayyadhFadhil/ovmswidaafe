import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/auth/authContext";
import { Icon } from "@/components/ui/Icon";
import { notificationService } from "@/services/modules/notificationService";
import { GuideButton } from "@/components/guide/GuideButton";

export function Topbar({ 
  title, 
  userName = "Admin User", 
  userRole = "Administrator", 
  avatarUrl,
  searchPlaceholder = "Quick search...", 
  searchValue, 
  onSearchChange,
  showSearch = false,
  onMenuClick,
  onProfileClick
}: { 
  title: string; 
  userName?: string; 
  userRole?: string; 
  avatarUrl?: string | null;
  searchPlaceholder?: string; 
  searchValue?: string; 
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  onMenuClick?: () => void;
  onProfileClick?: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.role) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await notificationService.getAll();
        if (res.data && Array.isArray(res.data)) {
          const unread = res.data.filter((n: any) => !n.isRead);
          setUnreadCount(unread.length);
        } else {
          setUnreadCount(0);
        }
      } catch (err) {
        console.error("Failed to fetch unread count", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 8000);

    // Re-fetch immediately when user returns to tab (e.g. navigates back from notifications page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Re-fetch immediately when any notification is marked as read (custom event)
    const handleNotifRead = () => fetchUnreadCount();
    window.addEventListener('ovms-notif-read', handleNotifRead);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('ovms-notif-read', handleNotifRead);
    };
  }, [user]);

  const handleNotificationClick = () => {
    if (!user?.role) return;
    const role = user.role.toLowerCase();
    if (role === "security") return;
    navigate(`/${role}/notifications`);
  };
  return (
    <header className="bg-white border-b border-[#e2e8f0] px-4 sm:px-8 h-[68px] flex items-center justify-between flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {/* Hamburger menu button for mobile */}
        <button 
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e3a8a] lg:hidden transition-colors cursor-pointer flex-shrink-0"
        >
          <Icon name="menu" className="text-[24px]" />
        </button>

        <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0f172a] truncate">{title}</h1>
        
        {/* Render search bar ONLY on History / Audit pages */}
        {(showSearch || window.location.pathname.includes('/history') || window.location.pathname.includes('/audit')) && (
          <div className="relative hidden md:block">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
            <input type="text" value={searchValue} onChange={e => onSearchChange?.(e.target.value)} placeholder={searchPlaceholder}
              className="h-9 pl-9 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-full text-[13px] text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 w-56" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <GuideButton />

        {user && user.role?.toLowerCase() !== "security" && (
          <button 
            onClick={handleNotificationClick}
            className="p-2 text-slate-500 hover:text-[#1e3a8a] hover:bg-slate-100 rounded-xl relative cursor-pointer transition-all flex items-center justify-center"
            title="Notifications"
            data-guide="notifications"
          >
            <Icon name="notifications" className="text-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        <button 
          onClick={onProfileClick}
          className="flex items-center gap-2.5 cursor-pointer text-left hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className="text-right hidden sm:block">
            <div className="text-[13px] font-bold text-[#0f172a] leading-tight">{userName}</div>
            <div className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider">{userRole}</div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1e3a8a] border-2 border-[#e2e8f0] flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={userName} 
                className="w-full h-full object-cover" 
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=00236f&color=fff&size=120`; 
                }} 
              />
            ) : (
              <Icon name="person" className="text-white text-[18px] sm:text-[20px]" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
}