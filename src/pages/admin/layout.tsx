"use client";

import type React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/admin/sidebar";
import Navbar from "../../components/Navbar";

const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 bg-gray-100/50">
        <div className="fixed top-0 left-0 right-0 z-10">
          <Navbar />
        </div>
        <div className="mt-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
