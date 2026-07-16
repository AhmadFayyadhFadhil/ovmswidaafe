import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./authContext";
import type { AuthContextType, AuthUser, UserRole } from "./authContext";
import { apiClient } from "../services/api/api";



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("auth_user");
    const token = sessionStorage.getItem("token");

    const verifySession = async () => {
      try {
        if (import.meta.env.VITE_ENABLE_MOCK !== "true" && token) {
          const res = await apiClient.get("/profile");
          if (res.data?.status === "success" && res.data.data) {
            const apiUser = res.data.data;
            let role: UserRole = "employee";
            const userRoles = apiUser.roles || [];
            const lowerRoles = userRoles.map((r: string) => r.toLowerCase());
            if (lowerRoles.includes("admin")) role = "admin";
            else if (lowerRoles.includes("ga")) role = "gahrd";
            else if (lowerRoles.includes("approver")) role = "approver";
            else if (lowerRoles.includes("driver")) role = "driver";
            else if (lowerRoles.includes("security")) role = "security";
            else role = "employee";

            const updatedUser: AuthUser = {
              id: String(apiUser.id),
              email: apiUser.email,
              name: apiUser.name || apiUser.email.split("@")[0],
              role,
              token,
              department_id: apiUser.department_id,
              is_department_head: !!apiUser.is_department_head,
              availability_status: apiUser.availability_status,
              avatar_url: apiUser.avatar_url,
            };
            setUser(updatedUser);
            sessionStorage.setItem("auth_user", JSON.stringify(updatedUser));
            return;
          }
        }
      } catch (err) {
        console.error("Session verification failed, logging out:", err);
        setUser(null);
        sessionStorage.removeItem("auth_user");
        sessionStorage.removeItem("token");
      }
    };

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setLoading(false); // Render dashboard immediately
        verifySession(); // Revalidate in background
      } catch {
        sessionStorage.removeItem("auth_user");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (nik: string, password: string): Promise<UserRole> => {
    if (!nik || !password) {
      throw new Error("NIK dan password wajib diisi.");
    }

    if (import.meta.env.VITE_ENABLE_MOCK === "true" && import.meta.env.MODE !== "production") {
      const role = nik === "SA12345" ? "admin" : "employee";
      const token = `mock_token_${nik}`;

      const authUser: AuthUser = {
        id: `user_${Date.now()}`,
        email: `${nik}@example.com`,
        nik,
        name: `MOCK_${nik}`,
        role,
        token,
        department_id: "Information and Technology",
        is_department_head: false,
        availability_status: 'available',
      };

      setUser(authUser);
      sessionStorage.setItem("auth_user", JSON.stringify(authUser));
      sessionStorage.setItem("token", token);
      return role;
    } else {
      try {
        const response = await apiClient.post("/login", { nik, password });
        if (response.data?.status === "success") {
          const { user: apiUser, token } = response.data.data;

          // Map Spatie roles from Laravel API to frontend UserRole
          let role: UserRole = "employee";
          const userRoles = apiUser.roles || [];
          const lowerRoles = userRoles.map((r: string) => r.toLowerCase());
          if (lowerRoles.includes("admin")) role = "admin";
          else if (lowerRoles.includes("ga")) role = "gahrd";
          else if (lowerRoles.includes("approver")) role = "approver";
          else if (lowerRoles.includes("driver")) role = "driver";
          else if (lowerRoles.includes("security")) role = "security";
          else role = "employee";

          const authUser: AuthUser = {
            id: String(apiUser.id),
            email: apiUser.email,
            name: apiUser.name || apiUser.email.split("@")[0],
            role,
            token,
            department_id: apiUser.department_id,
            is_department_head: !!apiUser.is_department_head,
            availability_status: apiUser.availability_status,
            avatar_url: apiUser.avatar_url,
          };

          setUser(authUser);
          sessionStorage.setItem("auth_user", JSON.stringify(authUser));
          sessionStorage.setItem("token", token);
          return role;
        } else {
          throw new Error(response.data?.message || "Login gagal.");
        }
      } catch (error: any) {
        throw new Error(
          error.response?.data?.message || 
          "Login gagal. Periksa kembali email, password, atau koneksi ke backend Anda."
        );
      }
    }
  };

  const logout = async () => {
    if (import.meta.env.VITE_ENABLE_MOCK !== "true") {
      try {
        await apiClient.post("/logout");
      } catch (error) {
        console.error("Gagal logout dari API backend:", error);
      }
    }
    setUser(null);
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("token");
  };

  const updateUser = (updated: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      sessionStorage.setItem("auth_user", JSON.stringify(next));
      return next;
    });
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

