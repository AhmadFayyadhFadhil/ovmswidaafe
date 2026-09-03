import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/auth/authContext";
import { canAccessRoute } from "@/auth/roleGuard";
import { Icon } from "@/components/ui/Icon";

export default function ProtectedRoutes() {
  const { user, loading, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSwitchPrompt, setShowSwitchPrompt] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div>
          <p className="mt-4 text-[#475569] font-medium text-sm">Memuat sesi pengguna...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // Check role-based access
  const accessResult = canAccessRoute(user, location.pathname);
  
  if (accessResult === 'forbidden') {
    const targetDashboard = user.role === 'admin' ? '/admin/dashboard' :
      (user.role === 'gahrd' ? '/gahrd/dashboard' :
      (user.role === 'approver' || user.is_department_head ? '/approver/dashboard' :
      (user.role === 'driver' ? '/driver/dashboard' :
      (user.role === 'security' ? '/security/dashboard' : '/employee/dashboard'))));

    // Get human-readable role labels
    const getRoleName = (path: string) => {
      if (path.startsWith('/approver')) return 'Kepala Departemen (Approver)';
      if (path.startsWith('/gahrd')) return 'GA & HRD Coordinator';
      if (path.startsWith('/driver')) return 'Driver Operasional';
      if (path.startsWith('/security')) return 'Petugas Security';
      if (path.startsWith('/admin')) return 'Administrator';
      return 'Role Khusus';
    };

    const getCurrentRoleName = (roleStr: string) => {
      if (user.is_driver_coordinator || user.roles?.includes('driver coordinator')) {
        return 'Koordinator Driver';
      }
      switch (roleStr) {
        case 'admin': return 'Administrator';
        case 'gahrd': return 'GA & HRD';
        case 'approver': return 'Kepala Departemen (Approver)';
        case 'driver': return 'Driver Operasional';
        case 'security': return 'Petugas Security';
        default: return 'Karyawan (Pemohon)';
      }
    };

    const requiredRole = getRoleName(location.pathname);
    const currentRole = getCurrentRoleName(user.role);

    const handleSwitchAccount = async () => {
      const redirectTarget = location.pathname + location.search;
      await logout();
      window.location.href = `/login?redirect=${encodeURIComponent(redirectTarget)}`;
    };

    const handleStayCurrent = () => {
      setShowSwitchPrompt(false);
      navigate(targetDashboard, { replace: true });
    };

    if (showSwitchPrompt) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-7 text-center transform transition-all animate-scale-up">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Icon name="swap_horiz" size={32} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Perlu Hak Akses Khusus
            </h3>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Halaman atau permohonan ini ditujukan untuk akun <strong className="text-slate-900 font-semibold">{requiredRole}</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-left text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Akun Saat Ini:</span>
                <span className="font-semibold text-slate-900">{user.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Peran Aktif:</span>
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px]">{currentRole}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="text-slate-700 font-mono text-[11px] truncate max-w-[200px]">{user.email}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSwitchAccount}
                className="w-full py-2.5 px-4 bg-[#1e3a8a] hover:bg-[#172554] text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icon name="login" size={18} />
                <span>Ganti Akun & Masuk sebagai {requiredRole.split(' ')[0]}</span>
              </button>

              <button
                onClick={handleStayCurrent}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all cursor-pointer"
              >
                Tetap di Akun Saya (Batal)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <Navigate to={targetDashboard} replace />;
  }

  return <Outlet />;
}
