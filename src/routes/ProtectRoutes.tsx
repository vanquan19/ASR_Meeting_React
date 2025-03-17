import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectRoutes = () => {
  const { isAuthenticated, isLoaded } = useAuth();
  if (!isLoaded) return <div>Loading...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectRoutes;
