import { DepartmentType } from "./department";

export interface UserType {
  id: number;
  address?: string;
  bankName?: string;
  bankNumber?: string;
  degree?: string;
  email: string;
  dob?: string;
  employeeCode?: string;
  identification?: string;
  name: string;
  phoneNumber?: string;
  role: string;
  img?: string;
  department?: DepartmentType;
}

export type UserRole = "ROLE_ADMIN" | "ROLE_USER" | "ROLE_SECRETARY";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: UserType | undefined;
  isLoaded: boolean;
  login: (username: string, password: string) => Promise<{ isAuthenticated: boolean; user: UserType }>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean
  setUser: (user: UserType) => void;
}