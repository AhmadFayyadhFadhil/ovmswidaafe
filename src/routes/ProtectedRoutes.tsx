import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "@/auth/authContext";
import { canAccessRoute } from "@/auth/roleGuard";

// SECURITY NOTE: This frontend route guard provides UX-level access control only.
// All sensitive operations MUST also be validated server-side via Laravel API middleware.
// Frontend guards can be bypassed by manipulating sessionStorage in the browser console.
export default function ProtectedRoutes() {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div>
          <p className="mt-4 text-[#475569]">Loading...</p>
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
    // Graceful fallback (Popular Web Apps standard): redirect user to their primary default dashboard
    const targetDashboard = user.role === 'admin' ? '/admin/dashboard' :
      (user.role === 'gahrd' ? '/gahrd/dashboard' :
      (user.role === 'approver' || user.is_department_head ? '/approver/dashboard' :
      (user.role === 'driver' ? '/driver/dashboard' :
      (user.role === 'security' ? '/security/dashboard' : '/employee/dashboard'))));

    return <Navigate to={targetDashboard} replace />;
  }

  return <Outlet />;
}
