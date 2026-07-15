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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#dc2626] mb-2">Access Denied</h1>
          <p className="text-[#475569] mb-4">You do not have permission to access this page.</p>
          <a href="/login" className="text-[#1e3a8a] underline">Return to login</a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
