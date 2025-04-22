import { createContext, useContext, useEffect, useState } from "react";
import { checkAuth, logoutService } from "../services/authService";
import { loginService } from "../services/authService";
import { AuthContextType, UserRole, UserType } from "../interface/auth";

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

  interface LoginResponse {
    isAuthenticated: boolean;
    user: UserType;
  }

  const login = async (
    username: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await loginService(username, password);
    // Kiểm tra nếu `response` không tồn tại hoặc `code` không phải 200
    if (!response || response.code !== 200) {
      console.error("Login failed:", response);
      return {
        isAuthenticated: false,
        user: {} as UserType,
      };
    }
    localStorage.setItem("token", response.result?.token || "");
    localStorage.setItem("user", JSON.stringify(response.result?.user));
    setIsAuthenticated(response.result?.authenticated || false);
    setUser(response.result?.user);
    return {
      isAuthenticated: true,
      user: response.result?.user as UserType,
    };
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

  // Check if user has required role
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    // Direct role match
    return user.role === requiredRole;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        isLoaded,
        user,
        hasPermission,
        setUser,
      }}
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
