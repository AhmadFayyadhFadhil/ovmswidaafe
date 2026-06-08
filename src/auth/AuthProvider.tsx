import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./authContext";
import type { AuthContextType, AuthUser, UserRole } from "./authContext";

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
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email dan password wajib diisi.");
    }

    const role = getRoleFromEmail(email);
    const token = generateMockToken(email);

    const authUser: AuthUser = {
      id: `user_${Date.now()}`,
      email,
      role,
      token,
    };

    setUser(authUser);
    localStorage.setItem("auth_user", JSON.stringify(authUser));
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("token");
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
