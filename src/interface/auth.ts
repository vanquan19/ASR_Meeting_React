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

export interface AuthContextType {
  isAuthenticated: boolean;
  user: UserType | undefined;
  isLoaded: boolean;
  login: (username: string, password: string) => Promise<{ isAuthenticated: boolean; user: UserType }>;
  logout: () => Promise<void>;
}