import { useEffect, useState } from "react";
import { Bell, User } from "lucide-react";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { IMessage } from "@stomp/stompjs";
import { SignalMessage } from "../interface/websocket";
import { v4 as uuid } from "uuid";
import { UserType } from "../interface/auth";
import { Notification } from "../interface/notification";
import {
  getAllNotification,
  markAsReadNotification,
} from "../services/notificationService";

const NotificationPage = () => {
  const { socket, sendSignal, connected } = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const notiData = await getAllNotification(user?.employeeCode || "");
      console.log(notiData);
      if (notiData.code !== 200) return;
      setNotifications(
        notiData.result.map((notification: Notification) => ({
          ...notification,
          id: notification.notificationId,
          timestamp: new Date(notification.timestamp),
          sender: null,
        }))
      );
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      socket.subscribe(
        `/topic/room/${user?.employeeCode}/signal`,
        async (message: IMessage) => {
          const signal: SignalMessage = JSON.parse(message.body);
          if (signal.type !== "notification") return;
          const data: Notification = {
            id: uuid(),
            sender: signal.member as UserType,
            content: signal.payload.reason,
            timestamp: new Date(signal.payload.timestamp),
            read: false,
          };

          setNotifications((prevNotifications) => {
            const existingNotification = prevNotifications.find(
              (notification) => notification.id === data.id
            );
            if (existingNotification) {
              return prevNotifications.map((notification) =>
                notification.id === data.id
                  ? { ...data, read: false }
                  : notification
              );
            } else {
              return [data, ...prevNotifications];
            }
          });
        }
      );
      sendSignal(
        {
          type: "read-notification",
          from: user?.employeeCode || "",
          to: user?.employeeCode || "",
          member: null,
          payload: {
            reason: "Đã đọc thông báo",
            timestamp: new Date(),
          },
        },
        user?.employeeCode || ""
      );
    }
  }, [socket, connected, user?.employeeCode]);
  // Format time function
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffInHours =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Within 24 hours, show "x hours ago"
      if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60);
        return `${minutes} phút trước`;
      }
      return `${Math.floor(diffInHours)} giờ trước`;
    } else {
      // More than 24 hours, show actual time
      return timestamp.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  // Mark notification as read when clicked
  const markAsRead = async (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    await markAsReadNotification(user?.employeeCode || "");
  };

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h1 className="text-xl font-bold">Thông báo</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} mới
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              className="text-sm text-blue-600 hover:text-blue-800 "
              onClick={() =>
                setNotifications(
                  notifications.map((n) => ({ ...n, read: true }))
                )
              }
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <Separator className="my-2" />

        <ScrollArea className="h-[70vh]">
          {notifications.length > 0 ? (
            <div className="flex flex-col gap-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-md transition-colors ${
                    notification.read ? "bg-gray-50 " : "bg-blue-50 "
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {notification.sender && (
                      <div className="flex-shrink-0">
                        {typeof notification.sender !== "string" &&
                        notification.sender.img ? (
                          <Avatar>
                            <img
                              src={
                                notification.sender.img || "/placeholder.svg"
                              }
                              alt={notification.sender.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200  flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500 " />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-col">
                        <div className="flex items-start justify-between">
                          <p className="font-medium">
                            {typeof notification.sender !== "string" &&
                              notification.sender?.name}
                          </p>
                          <span className="text-xs text-gray-500  ml-2">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600  mt-1">
                          {notification.content}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!notification.read && (
                    <div className="flex justify-end mt-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600 "></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 ">
                Không có thông báo
              </h3>
              <p className="text-sm text-gray-500  mt-1">
                Bạn sẽ nhận được thông báo khi có hoạt động mới.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default NotificationPage;
