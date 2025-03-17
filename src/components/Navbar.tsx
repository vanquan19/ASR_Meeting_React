import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/Logo.png";
import { SearchInput } from "./ui/Input";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
export default function Navbar() {
  const { user, logout } = useAuth();
  const [show, setShow] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <div className="h-16">
      <nav className="py-3 px-12 bg-white shadow-md fixed z-50 w-full">
        <ul className="flex justify-between">
          <li>
            <Link to="/">
              <img src={logo} alt="logo" className="size-12" />
            </Link>
          </li>
          <li className="w-1/2 flex">
            <SearchInput placeholder="Tìm kiếm" />
          </li>
          <li className="relative group">
            <div>
              {user && (
                <img
                  src={user.img}
                  alt="logo user"
                  className="size-12 rounded-full"
                  onClick={() => setShow(!show)}
                />
              )}
            </div>
            <ul
              className={`absolute w-94 top-full -right-8 bg-white shadow-md rounded-lg p-4 ${
                show ? "block" : "hidden"
              } transition-all duration-500 transform translate-y-2`}
            >
              <li className="flex items-center w-full gap-4 justify-between pb-2">
                <h4 className="font-semibold">Học viện kỹ thuật mật mã</h4>
                <button
                  className="md:cursor-pointer text-red-700 text-base"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </li>
              <li className="flex items-center w-full gap-4">
                {user && (
                  <img
                    src={user.img}
                    alt="logo user"
                    className="size-12 rounded-full"
                  />
                )}
                <Link to="/profile" className="hover:bg-gray-100 w-full p-1">
                  <span className="text-base uppercase font-bold ">
                    {user && user.name}
                  </span>
                  <br />
                  <span className="text-sm">{user && user.email}</span>
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
