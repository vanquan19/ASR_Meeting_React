import { Link } from "react-router-dom";
import {
  Bell,
  MessageCircleMore,
  UsersRound,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";

const objSidebar = [
  {
    icon: Bell,
    title: "Hoạt động",
    link: "/meeting-room/active",
  },
  {
    icon: MessageCircleMore,
    title: "Tin nhắn",
    link: "/meeting-room/message",
  },
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
  const [current, setCurrent] = useState<number>(2);
  return (
    <div className="w-20">
      <nav className="p-4 bg-gray-100/70 h-screen fixed pt-6">
        <ul className="flex flex-col gap-4">
          {objSidebar.map((item, index) => (
            <li
              key={index}
              className="flex flex-col items-center group"
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
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
