import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Container() {
  return (
    <div>
      <Navbar />
      <div className="flex md:flex-row flex-col-reverse">
        <Sidebar />
        <div className="pt-6 md:mx-16 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
