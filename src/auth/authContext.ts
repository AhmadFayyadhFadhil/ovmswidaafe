import { createContext, useContext } from "react";

export type UserRole = "admin" | "employee" | "approver" | "driver" | "gahrd";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  token: string;
  department_id?: string;
  is_department_head?: boolean;
  availability_status?: 'available' | 'unavailable' | 'on_trip' | 'assigned';
  avatar_url?: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updated: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
