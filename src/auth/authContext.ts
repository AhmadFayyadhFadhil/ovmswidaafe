import { createContext, useContext } from "react";

export type UserRole = "admin" | "employee" | "approver" | "driver" | "gahrd";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
