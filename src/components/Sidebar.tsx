import { Link } from "react-router-dom";
import {
  // Bell,
  // MessageCircleMore,
  UsersRound,
  CalendarDays,
  Bell,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { IMessage } from "@stomp/stompjs";
import { SignalMessage } from "../interface/websocket";

const objSidebar = [
  {
    icon: Bell,
    title: "Thông báo",
    link: "/meeting-room/notification",
  },
  // {
  //   icon: MessageCircleMore,
  //   title: "Tin nhắn",
  //   link: "/meeting-room/message",
  // },
  {
    icon: UsersRound,
    title: "Nhóm",
    link: "/meeting-room",
  },
  {
    icon: CalendarDays,
    title: "Lịch",
    link: "/meeting-room/calendar",
  },
];

export default function Sidebar() {
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const [notification, setNotification] = useState<number>(0);
  const [current, setCurrent] = useState<number>(
    objSidebar.findIndex((item) => item.link === window.location.pathname)
      ? objSidebar.findIndex((item) => item.link === window.location.pathname)
      : 0
  );
  useEffect(() => {
    if (socket && connected) {
      console.log("Connected to WebSocket for notifications");
      socket.subscribe(
        `/topic/room/${user?.employeeCode}/signal`,
        async (message: IMessage) => {
          const signal: SignalMessage = JSON.parse(message.body);
          if (signal.type === "notification") {
            setNotification((prev) => prev + 1);
          }
          if (signal.type === "read-notification") {
            setNotification(0);
          }
        }
      );
    }
  }, [socket, connected, user?.employeeCode]);
  return (
    <div className="md:w-20 w-full">
      <nav className="md:p-4 bg-gray-100 md:h-screen md:w-auto md:mt-16 md:pt-8 w-full py-4 md:top-0 bottom-0 left-0 fixed z-40 ">
        <ul className="flex md:flex-col flex-row md:gap-4 gap-12 justify-center">
          {objSidebar.map((item, index) => (
            <li
              key={index}
              className="flex flex-col items-center group relative"
              onClick={() => setCurrent(index)}
            >
              <Link
                to={item.link}
                className="text-xs font-medium items-center flex flex-col gap-1"
              >
                <item.icon
                  size={28}
                  className={` group-hover:stroke-blue-500 transition-all ${
                    index === current ? "stroke-blue-500" : "stroke-gray-600"
                  }`}
                />
                <span
                  className={`group-hover:text-blue-500 transition-all ${
                    index === current ? "text-blue-500" : "text-gray-500"
                  }`}
                >
                  {item.title}
                </span>
              </Link>
              {item.title === "Thông báo" && notification > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {notification}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
