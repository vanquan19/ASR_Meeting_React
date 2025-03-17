import { createContext, useContext, useEffect, useState } from "react";
import { checkAuth, logoutService } from "../services/authService";
import { loginService } from "../services/authService";

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
  department?: {
    id: number;
    name: string;
    departmentCode: string;
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserType | undefined;
  isLoaded: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [user, setUser] = useState<UserType>();

  useEffect(() => {
    const ckeckToken = async () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (user) {
        setUser(JSON.parse(user));
      }
      if (token) {
        const response = await checkAuth(token);
        // const response = true;
        setIsAuthenticated(response);
      }
      setIsLoaded(true);
    };
    ckeckToken();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await loginService(username, password);
    console.log(response);
    // Kiểm tra nếu `response` không tồn tại hoặc `code` không phải 200
    if (!response || response.code !== 200) {
      console.error("Login failed:", response);
      return false;
    }
    localStorage.setItem("token", response.result?.token || "");
    localStorage.setItem("user", JSON.stringify(response.result?.user));
    setIsAuthenticated(response.result?.authenticated || false);
    setUser(response.result?.user);
    return true;
  };

  const logout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      await logoutService(token);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(undefined);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, isLoaded, user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};
