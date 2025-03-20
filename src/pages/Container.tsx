import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Container() {
  return (
    <div>
      <Navbar />
      <div className="flex gap-8">
        <Sidebar />
        <div className="pt-6 mx-16 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
