import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

const ProtectRoutes = () => {
  const { isAuthenticated, isLoaded } = useAuth();
  if (!isLoaded) return <div>Loading...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminProtectRoutes = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!hasPermission("ROLE_ADMIN")) {
      navigate(-1); // 🔙 quay lại trang trước
    }
  }, [hasPermission, navigate]);

  return hasPermission("ROLE_ADMIN") ? <Outlet /> : null;
};

export const UserProtectRoutes = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!hasPermission("ROLE_USER") && !hasPermission("ROLE_SECRETARY")) {
      navigate(-1); // 🔙 quay lại trang trước
    }
  }, [hasPermission, navigate]);

  return hasPermission("ROLE_USER") || hasPermission("ROLE_SECRETARY") ? (
    <Outlet />
  ) : null;
};

export default ProtectRoutes;
