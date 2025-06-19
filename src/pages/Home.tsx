import { useNavigate } from "react-router-dom";
import logo from "../assets/images/Logo.png";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoaded, user } = useAuth();
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "ROLE_ADMIN") {
        navigate("/dashboard");
      } else {
        navigate("/meeting-room");
      }
    }
  }, [isAuthenticated, navigate, user?.role]);
  if (!isLoaded) return <div>Loading...</div>;
  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="h-20 bg-white flex items-center justify-between py-4 px-10 shadow-xl">
        <img src={logo} alt="logo" className="size-16" />
        <button
          onClick={() => navigate("/login")}
          type="button"
          id="login"
          className="bg-orange-500 text-white py-2 px-6 rounded hover:bg-orange-600 md:cursor-pointer transition duration-300"
        >
          Đăng nhập
        </button>
      </header>
      <main className="bg-gray-100/15 h-full flex relative justify-between xl:px-44 lg:px-32 md:px-20 px-10  gap-10 items-center lg:flex-row flex-col ">
        <div className="flex flex-col lg:gap-0 lg:relative absolute bottom-5 lg:w-1/2 w-full lg:items-start items-center">
          <div className="xl:text-7xl lg:text-5xl text-4xl flex flex-col gap-3 font-bold text-gray-800 mb-4 lg:text-left text-center">
            <h1>Họp Online</h1>
            <h1>Chọn KMA Meet</h1>
          </div>
          <span className="xl:text-2xl lg:text-xl text-gray-600 font-medium lg:text-left text-center">
            Ứng dụng quản lý lịch họp và tài liệu
          </span>
          <br />
          <button
            onClick={() => navigate("/login")}
            className="bg-red-500 hover:bg-red-600 transition-all duration-300 md:cursor-pointer py-3 px-6 text-white rounded-lg mt-5 "
          >
            Tham gia ngay
          </button>
        </div>
        <img
          src={logo}
          alt="logo"
          className="xl:size-[35vw] lg:size-[40vw] md:size-[50vw] sm:size-[60vw] size-[80vw] lg:relative m-auto absolute -z-10"
          style={{ animation: "bounceNew 1.5s linear infinite" }}
        />
      </main>
    </div>
  );
}
