import { createContext, useContext } from "react";

export type UserRole = "admin" | "employee" | "approver" | "driver" | "gahrd" | "security";

export interface AuthUser {
  id: string;
  email: string;
  nik?: string;
  name?: string;
  role: UserRole;
  roles?: string[];
  token: string;
  department_id?: string | number;
  department_name?: string;
  is_department_head?: boolean;
  availability_status?: 'available' | 'unavailable' | 'on_trip' | 'assigned';
  avatar_url?: string | null;
  sim_number?: string | null;
  sim_type?: string | null;
  sim_expiry_date?: string | null;
  sim_status?: string | null;
  sim_expiry_days_left?: number | null;
  sim_a_photo_url?: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (nik: string, password: string) => Promise<UserRole>;
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
