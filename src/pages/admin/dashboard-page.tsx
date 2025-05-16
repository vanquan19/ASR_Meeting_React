import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  getCurrentMeeting,
  getStats,
  iUserStats,
} from "../../services/analysisService";
import { PieChart } from "../../components/chart";
import { MeetingType } from "../../interface/meeting";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { UserType } from "../../interface/auth";
import { Dot } from "lucide-react";

export default function DashboardPage() {
  const { socket, connected } = useSocket();
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState<{
    total: number;
    cancelled: number;
    upcoming: number;
    ended: number;
    ongoing: number;
    postponed: number;
    notStarted: number;
    unknown: number;
  }>({
    total: 0,
    cancelled: 0,
    upcoming: 0,
    ended: 0,
    ongoing: 0,
    postponed: 0,
    notStarted: 0,
    unknown: 0,
  });
  const [currentMeeting, setCurrentMeeting] = useState<MeetingType[] | null>(
    []
  );

  const [iUserAction, setIUserAction] = useState<number>(0);
  const [iTotalUser, setITotalUser] = useState<number>(0);

  const [actionUsers, setActionUsers] = useState<
    Array<UserType & { action?: boolean; timestamp?: string }>
  >([]);

  const fetchStats = async () => {
    const statsResponse = await getStats();
    if (statsResponse.code === 200) {
      setStats({
        total: statsResponse.result.total,
        cancelled: statsResponse.result.stats.CANCELLED,
        upcoming: statsResponse.result.stats.UPCOMING,
        ended: statsResponse.result.stats.ENDED,
        ongoing: statsResponse.result.stats.ONGOING,
        postponed: statsResponse.result.stats.POSTPONED,
        notStarted: statsResponse.result.stats.NOT_STARTED,
        unknown: statsResponse.result.stats.UNKNOWN,
      });
    } else {
      console.error("Error fetching stats");
    }
  };

  const fetchCurrentMeeting = async () => {
    const response = await getCurrentMeeting();
    if (response.code === 200) {
      setCurrentMeeting(response.result);
    } else {
      console.error("Error fetching current meeting");
    }
  };

  const fetchTotalUser = async () => {
    const response = await iUserStats();
    if (response.code === 200) {
      setITotalUser(response.result as number);
    } else {
      console.error("Error fetching total user stats");
    }
  };

  useEffect(() => {
    if (socket && connected && hasPermission("ROLE_ADMIN")) {
      socket.subscribe(`/topic/room/dashboard/signal`, (message) => {
        const signal = JSON.parse(message.body);
        if (signal.type === "user-action") {
          const userAction = signal.member as UserType;
          const action = signal.payload.connected;
          const timestamp = signal.payload.timestamp;
          setActionUsers((prevUsers) => {
            const existingUser = prevUsers.find(
              (user) => user.employeeCode === userAction.employeeCode
            );
            if (existingUser) {
              setIUserAction((prev) => (action ? prev + 1 : prev - 1));
              return prevUsers.map((user) =>
                user.employeeCode === userAction.employeeCode
                  ? { ...user, action, timestamp }
                  : user
              );
            } else {
              setIUserAction((prev) => (action ? prev + 1 : prev - 1));
              return [...prevUsers, { ...userAction, action, timestamp }];
            }
          });
        }
      });
    }
  }, [socket, connected, hasPermission]);

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "bg-green-100 text-green-800";
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      case "ENDED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "POSTPONED":
        return "bg-yellow-100 text-yellow-800";
      case "NOT_STARTED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to translate status
  const translateStatus = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "Đang diễn ra";
      case "UPCOMING":
        return "Sắp diễn ra";
      case "ENDED":
        return "Đã kết thúc";
      case "CANCELLED":
        return "Đã hủy";
      case "POSTPONED":
        return "Tạm hoãn";
      case "NOT_STARTED":
        return "Chưa bắt đầu";
      default:
        return "Không xác định";
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCurrentMeeting();
    fetchTotalUser();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 md:col-span-1">
          <CardHeader>
            <CardTitle>Trạng thái cuộc họp</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[300px] w-full max-w-[500px]">
              <PieChart
                data={[
                  {
                    label: "Chưa bắt đầu",
                    value: stats?.notStarted,
                    color: "#FF9F40",
                  },
                  {
                    label: "Sắp diễn ra",
                    value: stats?.upcoming,
                    color: "#36A2EB",
                  },
                  {
                    label: "Đang diễn ra",
                    value: stats?.ongoing,
                    color: "#4BC0C0",
                  },
                  {
                    label: "Đã kết thúc",
                    value: stats?.ended,
                    color: "#FFCE56",
                  },
                  {
                    label: "Tạm hoãn",
                    value: stats?.postponed,
                    color: "#9966FF",
                  },
                  {
                    label: "Đã hủy",
                    value: stats?.cancelled,
                    color: "#FF6384",
                  },
                  {
                    label: "Không xác định",
                    value: stats?.unknown,
                    color: "#C9CBCF",
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-1">
          <CardHeader>
            <CardTitle>Thống kê cuộc họp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "Chưa bắt đầu",
                  value: stats?.notStarted,
                  color: "#FF9F40",
                },
                {
                  label: "Sắp diễn ra",
                  value: stats?.upcoming,
                  color: "#36A2EB",
                },
                {
                  label: "Đang diễn ra",
                  value: stats?.ongoing,
                  color: "#4BC0C0",
                },
                { label: "Đã kết thúc", value: stats?.ended, color: "#FFCE56" },
                {
                  label: "Tạm hoãn",
                  value: stats?.postponed,
                  color: "#9966FF",
                },
                { label: "Đã hủy", value: stats?.cancelled, color: "#FF6384" },
                {
                  label: "Không xác định",
                  value: stats?.unknown,
                  color: "#C9CBCF",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-medium">{item.value || 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Cuộc họp gần đây</CardTitle>
            <CardDescription>
              Hiển thị danh sách các cuộc họp gần đây nhất
            </CardDescription>
            <p className="text-sm text-muted-foreground">
              Tổng số cuộc họp: {stats?.total}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentMeeting?.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex flex-col rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{meeting.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Phòng: {meeting.room.roomName} •{" "}
                        {meeting.department.name}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-2 py-1 text-xs ${getStatusColor(
                        meeting.status
                      )}`}
                    >
                      {translateStatus(meeting.status)}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Mã cuộc họp: {meeting.meetingCode}</span>
                      <span>
                        {new Date(meeting.startTime).toLocaleDateString(
                          "vi-VN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>
                        {new Date(meeting.startTime).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}{" "}
                        -{" "}
                        {new Date(meeting.endTime).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Người dùng gần đây</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tổng số người dùng: {iTotalUser}
            </p>
            <p className="text-sm text-muted-foreground">
              Người dùng đang hoạt động: {iUserAction}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actionUsers.length > 0 ? (
                actionUsers.slice(0, 7).map((user) => (
                  <div
                    key={user.employeeCode}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Mã nhân viên: {user.employeeCode}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-2 py-1 text-xs ${
                        user.action ? " text-green-800" : " text-gray-800"
                      }`}
                    >
                      <div className="flex items-center">
                        <Dot size={32} />
                        {user.action ? "Đang hoạt động" : "Không hoạt động"}
                      </div>
                      {user.timestamp && (
                        <span className="block text-xs mt-1 float-end">
                          {new Date(user.timestamp).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Không có người dùng đang hoạt động
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
