import type React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Button
      variant="outline"
      className="w-full justify-center hover:bg-blue-200 md:cursor-pointer transition duration-300"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
};

export default LogoutButton;
