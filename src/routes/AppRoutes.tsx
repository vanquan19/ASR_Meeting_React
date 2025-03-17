import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { Suspense } from "react";

import ProtectRoutes from "./ProtectRoutes";
import Login from "../pages/Login";
import MeetingRoom from "../pages/MeetingRoom";
import Home from "../pages/Home";
import Container from "../pages/Container";

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
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;
