import { Button } from "../components/ui/button.tsx";
import {
  Card,
  CardContainer,
  CardNote,
  CardParagraph,
  CardTitle,
} from "../components/ui/card.tsx";
import bgLogin from "../assets/images/bg_login.jpg";
import logo from "../assets/images/Logo.png";
import calendar from "../assets/images/calendar.png";
import { CircleX } from "lucide-react";
import { Input } from "../components/ui/input";
import { useState } from "react";
import Validation from "../utils/validate.ts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { ErrorValidateLogin } from "../interface/validate.ts";

export default function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<ErrorValidateLogin>({});
  const navigate = useNavigate();
  const { login, hasPermission } = useAuth();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError({
      username: "",
      password: "",
      genaral: "",
    });

    const newErrors: { username?: string; password?: string } = {};

    // Validate username
    if (!Validation.validateUsername(username)) {
      newErrors.username = "Tên người dùng không được để trống";
    }

    // Validate password
    if (password.length < 1) {
      newErrors.password = "Mật khẩu không hợp lệ";
    }

    // Nếu có lỗi, cập nhật state và dừng submit
    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    // Login
    const response = await login(username, password);
    if (!response.isAuthenticated) {
      setError({
        genaral: "Tài khoản hoặc mật khẩu không chính xác",
      });
      return;
    }
    if (response && hasPermission("ROLE_ADMIN")) {
      navigate("/dashboard");
    } else if (response) {
      navigate("/meeting-room");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-blue-200/50">
      <CardContainer className="lg:grid-cols-5 grid-cols-4  w-full  xl:mx-40 lg:mx-32 md:mx-24 sm:mx-16">
        <Card className="w-full shadow-none md:col-span-2 col-span-4 border-none">
          <div className="">
            <div className="mb-8">
              <img src={logo} className="size-24" alt="logo" />
            </div>
            <div
              className="mb-4 text-center p-4"
              style={{ marginBottom: "1.5rem" }}
            >
              <h2 className="text-2xl font-bold">Đăng nhập</h2>
              <p className="text-gray-500">Đăng nhập vào hệ thống</p>
            </div>
            <form className="flex flex-col lg:px-12" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className={`block text-sm font-medium uppercase text-gray-500 ml-4 mb-2 ${
                    error.username ? "text-red-500" : ""
                  }`}
                >
                  Tài khoản
                </label>
                <Input
                  type="text"
                  id="username"
                  onChange={(e) => setUsername(e.target.value)}
                  className={`border border-gray-300 px-3 py-2 w-full ${
                    error.username ? "border-red-500" : ""
                  }`}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className={`block text-sm font-medium uppercase text-gray-500 ml-4 mb-2 ${
                    error.password ? "text-red-500" : ""
                  }`}
                >
                  Mật khẩu
                </label>
                <Input
                  type="password"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  className={`border border-gray-300 px-3 py-2 w-full ${
                    error.password ? "border-red-500" : ""
                  }`}
                />
              </div>
              {error.genaral && (
                <p className="text-red-500 text-sm mb-4">{error.genaral}</p>
              )}
              <Button className="mt-3" type="submit">
                Đăng nhập
              </Button>
              <div className="mt-16 flex justify-between w-full px-4">
                {/* <a href="#" className="text-blue-500 underline text-base">
                  Quên mật khẩu?
                </a> */}
                <a
                  href="#"
                  className="text-blue-500 underline text-base ml-auto block"
                >
                  Điều khoản và Dịch vụ
                </a>
              </div>
            </form>
          </div>
        </Card>
        <Card className="w-full shadow-none lg:col-span-3 md:col-span-2 md:block hidden border-none ">
          <div
            className="bg-cover bg-center h-full w-full rounded-2xl relative"
            style={{ backgroundImage: `url(${bgLogin})` }}
          >
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-white flex items-center justify-center rounded-4xl rounded-tr-none">
              <button
                onClick={() => navigate("/")}
                className="p-2 md:cursor-pointer"
              >
                <CircleX size={24} />
              </button>
            </div>
            <div className="absolute w-full top-10 left-10 opacity-90 xl:block hidden">
              <div className="relative p-4">
                <CardNote className="bg-primary absolute z-10">
                  <CardTitle>Xem lại nhiệm vụ với đội nhóm</CardTitle>
                  <CardParagraph>9:30 AM - 10:30 PM</CardParagraph>
                </CardNote>
                <CardNote className="bg-gray-700 absolute top-14 left-14">
                  <CardTitle>Xem lại nhiệm vụ với đội nhóm</CardTitle>
                  <CardParagraph>9:30 AM - 10:30 PM</CardParagraph>
                </CardNote>
              </div>
            </div>
            <div>
              <div className="absolute w-fit bottom-0 left-1/3 opacity-50 xl:block hidden">
                <img src={calendar} className="size-54" alt="" />
              </div>
            </div>
          </div>
        </Card>
      </CardContainer>
    </div>
  );
}
