import { useAuthContext } from "@/auth/authContext";

export function useAuth() {
  const context = useAuthContext();
  
  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    loading: context.loading,
    logout: context.logout,
  };
}
