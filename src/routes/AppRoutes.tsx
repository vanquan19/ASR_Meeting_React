import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { Suspense } from "react";

import ProtectRoutes from "./ProtectRoutes";
import Login from "../pages/Login";
import MeetingRoom from "../pages/MeetingRoom";
import Home from "../pages/Home";
import Container from "../pages/Container";
import DashboardPage from "../pages/admin/dashboard-page";
import AdminLayout from "../pages/admin/layout";
import RoomsPage from "../pages/admin/rooms-page";
import AccountsPage from "../pages/admin/account-page";
import MeetingsPage from "../pages/admin/meeting-page";
import ProfilePage from "../pages/admin/profile-page";

const AppRoutes = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            {/* Protect routes */}
            <Route element={<ProtectRoutes />}>
              <Route path="/meeting-room" element={<Container />}>
                <Route index element={<MeetingRoom />} />
              </Route>

              <Route path="/dashboard" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="rooms" element={<RoomsPage />} />
                <Route path="accounts" element={<AccountsPage />} />
                <Route path="meetings" element={<MeetingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;
