import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { UserType } from "../interface/auth";

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
  const { hasPermission, user, isAuthenticated } = useAuth();
  const { socket, connected, sendSignal } = useSocket();

  const navigate = useNavigate();
  useEffect(() => {
    if (!hasPermission("ROLE_USER") && !hasPermission("ROLE_SECRETARY")) {
      navigate(-1); // 🔙 quay lại trang trước
    }
  }, [hasPermission, navigate]);

  const sendCloseSignal = () => {
    if (socket && connected && !hasPermission("ROLE_ADMIN")) {
      sendSignal(
        {
          type: "user-action",
          from: user?.employeeCode || "",
          to: "dashboard",
          member: user as UserType,
          payload: {
            connected: false,
            timestamp: new Date().toISOString(),
          },
        },
        "dashboard"
      );
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      sendCloseSignal();
      event.returnValue = ""; // Chrome requires returnValue to be set
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Check if the user is logged out sending a close signal
    if (!isAuthenticated) {
      sendCloseSignal();
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      sendCloseSignal();
    };
  }, [socket, connected, hasPermission, isAuthenticated]);

  return hasPermission("ROLE_USER") || hasPermission("ROLE_SECRETARY") ? (
    <Outlet />
  ) : null;
};

export default ProtectRoutes;
