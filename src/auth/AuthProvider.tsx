import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./authContext";
import type { AuthContextType, AuthUser, UserRole } from "./authContext";
import { apiClient } from "../services/api/api";

function getRoleFromEmail(email: string): UserRole {
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes("employee")) return "employee";
  if (lowerEmail.includes("approver")) return "approver";
  if (lowerEmail.includes("driver")) return "driver";
  if (lowerEmail.includes("gahrd")) return "gahrd";
  return "admin";
}

function generateMockToken(email: string): string {
  return `token_${email}_${Date.now()}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("auth_user");
    const token = sessionStorage.getItem("token");

    const verifySession = async (storedUser: AuthUser) => {
      try {
        if (import.meta.env.VITE_ENABLE_MOCK !== "true" && token) {
          const res = await apiClient.get("/profile");
          if (res.data?.status === "success" && res.data.data) {
            const apiUser = res.data.data;
            let role: UserRole = "employee";
            const apiRole = apiUser.roles?.[0];
            if (apiRole) {
              const lowerRole = apiRole.toLowerCase();
              if (lowerRole === "admin") role = "admin";
              else if (lowerRole === "ga") role = "gahrd";
              else if (lowerRole === "approver") role = "approver";
              else if (lowerRole === "driver") role = "driver";
              else role = "employee";
            }

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
            setLoading(false);
            return;
          }
        }
        setUser(storedUser);
      } catch (err) {
        console.error("Session verification failed, logging out:", err);
        setUser(null);
        sessionStorage.removeItem("auth_user");
        sessionStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        verifySession(parsed);
      } catch {
        sessionStorage.removeItem("auth_user");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    if (!email || !password) {
      throw new Error("Email dan password wajib diisi.");
    }

    if (import.meta.env.VITE_ENABLE_MOCK === "true") {
      const role = getRoleFromEmail(email);
      const token = generateMockToken(email);

      const authUser: AuthUser = {
        id: `user_${Date.now()}`,
        email,
        name: email.split("@")[0].toUpperCase(),
        role,
        token,
        department_id: email.includes("approver") ? "HRD&GA" : "IT",
        is_department_head: email.includes("approver"),
        availability_status: 'available',
      };

      setUser(authUser);
      sessionStorage.setItem("auth_user", JSON.stringify(authUser));
      sessionStorage.setItem("token", token);
      return role;
    } else {
      try {
        const response = await apiClient.post("/login", { email, password });
        if (response.data?.status === "success") {
          const { user: apiUser, token } = response.data.data;

          // Map Spatie roles from Laravel API to frontend UserRole
          let role: UserRole = "employee";
          const apiRole = apiUser.roles?.[0]; // Assuming single role
          if (apiRole) {
            const lowerRole = apiRole.toLowerCase();
            if (lowerRole === "admin") {
              role = "admin";
            } else if (lowerRole === "ga") {
              role = "gahrd";
            } else if (lowerRole === "approver") {
              role = "approver";
            } else if (lowerRole === "driver") {
              role = "driver";
            } else {
              role = "employee";
            }
          }

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

