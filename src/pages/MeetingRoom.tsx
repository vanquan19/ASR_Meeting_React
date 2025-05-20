import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import {
  addMemberToMeeting,
  cancelMeeting,
  createMeeting,
  deleteMeeting,
  deleteMemberInMeeting,
  getAllMeeting,
  getAllMeetingForUser,
  getAllMemberInMeeting,
  postponeMeeting,
  updateMeeting,
  updateMemberInMeeting,
} from "../services/meetingService";
import {
  MeetingMemberType,
  MeetingType,
  RequestAddMember,
} from "../interface/meeting";
import {
  ChevronDown,
  FileText,
  PencilLine,
  PlusCircle,
  Users2,
} from "lucide-react";
import WebcamComponent from "../components/ui/video";
import leavingMeetingSound from "../assets/sounds/leaving-meeting.mp3";

import Room from "./Room";
import { getAllRooms } from "../services/roomService";
import { getAllDepartments } from "../services/departmentService";
import { RoomType } from "../interface/room";
import { DepartmentType } from "../interface/department";
import { useAuth } from "../context/AuthContext";
import { getAllUsers } from "../services/userService";
import { UserType } from "../interface/auth";
import { toast } from "react-toastify";
import { ROLE_MEETING } from "../constants/meeting";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { saveNotification } from "../services/notificationService";
import { v4 as uuid } from "uuid";

const colors = [
  "bg-blue-500",
  "bg-red-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-indigo-500",
];

export default function MeetingRoom() {
  const { hasPermission } = useAuth();
  const [dataMeetingRoom, setDataMeetingRoom] = useState<MeetingType[]>([]);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingType | null>(
    null
  );
  const [load, setLoad] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showCreateMeeting, setShowCreateMeeting] = useState<boolean>(false);
  const [showUpdateMeeting, setShowUpdateMeeting] = useState<boolean>(false);
  const [showAddMember, setShowAddMember] = useState<boolean>(false);
  const [joined, setJoined] = useState<boolean>(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [meetingCode, setMeetingCode] = useState<string>("");
  const [statusMeeting, setStatusMeeting] = useState<string>("");
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [departmentId, setDepartmentId] = useState<number | string>("");
  const navigate = useNavigate();

  const handleJoin = (meetingCode: string) => {
    setMeetingCode(meetingCode);
    setJoined(true);
  };

  const handleLeave = () => {
    setJoined(false);
    setMeetingCode("");
    setCurrentMeeting(null);
    setShowPreview(false);
    //add sound leave meeting
    const audio = new Audio(leavingMeetingSound);
    audio.volume = 1;
    audio.play();
  };

  const status = {
    UPCOMING: () => (
      <button className="text-blue-500 px-2 py-2 rounded-sm">
        Sắp diễn ra
      </button>
    ),
    ONGOING: (item?: MeetingType) => (
      <button
        onClick={() => {
          setCurrentMeeting(item || null);
          setShowPreview(true);
        }}
        className="bg-green-500 text-white px-2 py-2 rounded-sm md:cursor-pointer"
      >
        Tham gia
      </button>
    ),
    NOT_STARTED: () => (
      <button className="bg-yellow-500 text-white px-2 py-2 rounded-sm">
        Chưa bắt đầu
      </button>
    ),
    ENDED: () => (
      <button className=" text-red-500 px-2 py-2 rounded-sm">
        Đã kết thúc
      </button>
    ),
    CANCELLED: () => (
      <button className="text-red-500 px-2 py-2 rounded-sm">Đã hủy</button>
    ),
    POSTPONED: () => (
      <button className="text-red-500 px-2 py-2 rounded-sm">Đã hoãn</button>
    ),
    UNKNOWN: () => (
      <button className="text-yellow-500 px-2 py-2 rounded-sm">
        Không xác định
      </button>
    ),
  };

  const handleNavigateToMeeting = (
    pointerMeeting: MeetingType,
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    tab?: string
  ): void => {
    const target = e.target as HTMLElement;

    if (target.closest("button")) {
      // If the target is a button, do not navigate
      return;
    }
    navigateToMeeting(pointerMeeting, tab);
  };

  const navigateToMeeting = (meeting: MeetingType, tab?: string) => {
    navigate(
      `/meeting-room/detail?meeting=${meeting.meetingCode}${
        tab ? `&tab=${tab}` : ""
      }`
    );
  };
  useEffect(() => {
    const getData = async () => {
      let response;
      setDataMeetingRoom([]);
      if (hasPermission("ROLE_SECRETARY")) {
        response = await getAllMeeting(statusMeeting);
      } else {
        response = await getAllMeetingForUser(user.id, statusMeeting);
      }
      response?.result.map(async (item: MeetingType) => {
        const memberInMeeting = await getAllMemberInMeeting(item.id);
        if (memberInMeeting.code !== 200) {
          toast.error("Lấy danh sách thành viên thất bại");
          return;
        }
        const members = memberInMeeting.result;
        setDataMeetingRoom((prev) => {
          const updatedMeeting = {
            ...item,
            members: members,
          };
          if (!departmentId) return [...prev, updatedMeeting];
          else
            return [...prev, updatedMeeting].filter(
              (meeting) =>
                meeting.department.id === parseInt(departmentId as string)
            );
        });
      });
    };
    getData();
  }, [user.id, load, statusMeeting, departmentId]);
  useEffect(() => {
    const fetchDepartments = async () => {
      const response = await getAllDepartments();
      if (response.code === 200) {
        setDepartments(response.result);
      } else {
        toast.error("Lấy danh sách khoa thất bại");
      }
    };
    if (hasPermission("ROLE_SECRETARY")) {
      fetchDepartments();
    }
  }, []);

  return (
    <>
      <div className="w-full pt-8 pb-24 px-4">
        <div className="flex justify-between items-center w-full px-4 mb-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg text-gray-700 py-4 md:block hidden">
              Cuộc họp
            </h1>

            <div className="relative inline-block">
              <select
                name="meetingOptions"
                id="meetingOptions"
                className="appearance-none min-w-[6ch] max-w-[8ch] pr-6 truncate border-b border-gray-300 focus:border-blue-500 outline-none cursor-pointer"
                onChange={(e) => setStatusMeeting(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="UPCOMING">Sắp diễn ra</option>
                <option value="ONGOING">Đang diễn ra</option>
                <option value="NOT_STARTED">Chưa bắt đầu</option>
                <option value="ENDED">Đã kết thúc</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="POSTPONED">Đã hoãn</option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>

            {hasPermission("ROLE_SECRETARY") && (
              <div className="relative inline-block">
                <select
                  name="department"
                  id="department"
                  className="appearance-none min-w-[6ch] max-w-[8ch] pr-6 truncate border-b border-gray-300 focus:border-blue-500 outline-none cursor-pointer"
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            )}
          </div>
          {hasPermission("ROLE_SECRETARY") && (
            <button
              onClick={() => setShowCreateMeeting(true)}
              className="bg-green-500 flex items-center gap-2 text-white px-4 py-2 rounded-sm md:cursor-pointer"
            >
              <PlusCircle size={32} />
              <span className="text-sm font-semibold">Tạo cuộc họp</span>
            </button>
          )}
        </div>
        <div className="grid xl:grid-cols-3 gap-4 lg:grid-cols-2 grid-cols-1 w-full">
          {dataMeetingRoom
            .filter((item) => item.status === "UPCOMING")
            .map((item, index) => (
              <div
                key={index}
                className="w-full"
                onClick={(e) => handleNavigateToMeeting(item, e)}
              >
                <Card className="p-4 items-center w-full h-full shadow-lg flex flex-col justify-between">
                  <div className="flex gap-4 w-full">
                    <div
                      className={`min-w-16 size-16 items-center mt-4 flex justify-center text-2xl font-semibold text-gray-200 rounded-sm ${
                        colors[Math.floor(Math.random() * colors.length)]
                      }`}
                    >
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col justify-between h-full">
                      <h4 className="text-lg font-semibold flex items-center h-full">
                        <span className="my-auto line-clamp-2 overflow-hidden text-ellipsis py-1">
                          [{item.room.roomName}] {item.name}
                        </span>
                      </h4>
                      <p className="text-gray-500">
                        <span>Khoa: {item.department.name}</span>
                        <br />
                        <span>
                          Thời gian: {new Date(item.startTime).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-3 w-full items-center ">
                    {hasPermission("ROLE_SECRETARY") && (
                      <>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowAddMember(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <Users2 />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowUpdateMeeting(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <PencilLine />
                        </button>
                      </>
                    )}
                    <button
                      className="md:cursor-pointer"
                      onClick={() => navigateToMeeting(item, "files")}
                    >
                      <FileText />
                    </button>
                    {status[item.status as keyof typeof status](item) || (
                      <button className="bg-gray-500 text-white px-2 py-1 rounded-sm">
                        Không xác định
                      </button>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          {dataMeetingRoom
            .filter((item) => item.status === "ONGOING")
            .map((item, index) => (
              <div
                key={index}
                className="w-full"
                onClick={(e) => handleNavigateToMeeting(item, e)}
              >
                <Card className="p-4 items-center w-full h-full shadow-lg flex flex-col justify-between">
                  <div className="flex gap-4 w-full">
                    <div
                      className={`min-w-16 size-16 items-center mt-4 flex justify-center text-2xl font-semibold text-gray-200 rounded-sm ${
                        colors[Math.floor(Math.random() * colors.length)]
                      }`}
                    >
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col justify-between h-full">
                      <h4 className="text-lg font-semibold flex items-center h-full">
                        <span className="my-auto line-clamp-2 overflow-hidden text-ellipsis py-1">
                          [{item.room.roomName}] {item.name}
                        </span>
                      </h4>
                      <p className="text-gray-500">
                        <span>Khoa: {item.department.name}</span>
                        <br />
                        <span>
                          Thời gian: {new Date(item.startTime).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-3 w-full items-center">
                    {hasPermission("ROLE_SECRETARY") && (
                      <>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowAddMember(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <Users2 />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowUpdateMeeting(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <PencilLine />
                        </button>
                      </>
                    )}
                    <button
                      className="md:cursor-pointer"
                      onClick={() => navigateToMeeting(item, "files")}
                    >
                      <FileText />
                    </button>
                    {status[item.status as keyof typeof status](item) || (
                      <button className="bg-gray-500 text-white px-2 py-1 rounded-sm">
                        Không xác định
                      </button>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          {dataMeetingRoom
            .filter((item) => item.status === "NOT_STARTED")
            .map((item, index) => (
              <div
                key={index}
                className="w-full"
                onClick={(e) => handleNavigateToMeeting(item, e)}
              >
                <Card className="p-4 items-center w-full h-full shadow-lg flex flex-col justify-between">
                  <div className="flex gap-4 w-full">
                    <div
                      className={`min-w-16 size-16 items-center mt-4 flex justify-center text-2xl font-semibold text-gray-200 rounded-sm ${
                        colors[Math.floor(Math.random() * colors.length)]
                      }`}
                    >
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col justify-between h-full">
                      <h4 className="text-lg font-semibold flex items-center h-full">
                        <span className="my-auto line-clamp-2 overflow-hidden text-ellipsis py-1">
                          [{item.room.roomName}] {item.name}
                        </span>
                      </h4>
                      <p className="text-gray-500">
                        <span>Khoa: {item.department.name}</span>
                        <br />
                        <span>
                          Thời gian: {new Date(item.startTime).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-3 w-full">
                    {hasPermission("ROLE_SECRETARY") && (
                      <>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowAddMember(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <Users2 />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowUpdateMeeting(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <PencilLine />
                        </button>
                      </>
                    )}
                    <button
                      className="md:cursor-pointer"
                      onClick={() => navigateToMeeting(item, "files")}
                    >
                      <FileText />
                    </button>
                    {status[item.status as keyof typeof status](item) || (
                      <button className="bg-gray-500 text-white px-2 py-1 rounded-sm">
                        Không xác định
                      </button>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          {dataMeetingRoom
            .filter((item) => item.status === "ENDED")
            .map((item, index) => (
              <div
                key={index}
                className="w-full"
                onClick={(e) => handleNavigateToMeeting(item, e)}
              >
                <Card className="p-4 items-center w-full h-full shadow-lg flex flex-col justify-between">
                  <div className="flex gap-4 w-full">
                    <div
                      className={`min-w-16 size-16 items-center mt-4 flex justify-center text-2xl font-semibold text-gray-200 rounded-sm ${
                        colors[Math.floor(Math.random() * colors.length)]
                      }`}
                    >
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col justify-between h-full">
                      <h4 className="text-lg font-semibold flex items-center h-full">
                        <span className="my-auto line-clamp-2 overflow-hidden text-ellipsis py-1">
                          [{item.room.roomName}] {item.name}
                        </span>
                      </h4>
                      <p className="text-gray-500">
                        <span>Khoa: {item.department.name}</span>
                        <br />
                        <span>
                          Thời gian: {new Date(item.startTime).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-3 w-full items-center">
                    {hasPermission("ROLE_SECRETARY") && (
                      <>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowAddMember(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <Users2 />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowUpdateMeeting(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <PencilLine />
                        </button>
                      </>
                    )}
                    <button
                      className="md:cursor-pointer"
                      onClick={() => navigateToMeeting(item, "files")}
                    >
                      <FileText />
                    </button>
                    {status[item.status as keyof typeof status](item) || (
                      <button className="bg-gray-500 text-white px-2 py-1 rounded-sm">
                        Không xác định
                      </button>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          {dataMeetingRoom
            .filter(
              (item) =>
                item.status !== "ONGOING" &&
                item.status !== "UPCOMING" &&
                item.status !== "NOT_STARTED" &&
                item.status !== "ENDED"
            )
            .map((item, index) => (
              <div
                key={index}
                className="w-full"
                onClick={(e) => handleNavigateToMeeting(item, e)}
              >
                <Card className="p-4 items-center w-full h-full shadow-lg flex flex-col justify-between">
                  <div className="flex gap-4  w-full">
                    <div
                      className={`min-w-16 size-16 items-center mt-4 flex justify-center text-2xl font-semibold text-gray-200 rounded-sm ${
                        colors[Math.floor(Math.random() * colors.length)]
                      }`}
                    >
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col justify-between h-full">
                      <h4 className="text-lg font-semibold flex items-center h-full">
                        <span className="my-auto line-clamp-2 overflow-hidden text-ellipsis py-1">
                          [{item.room.roomName}] {item.name}
                        </span>
                      </h4>
                      <p className="text-gray-500">
                        <span>Khoa: {item.department.name}</span>
                        <br />
                        <span>
                          Thời gian: {new Date(item.startTime).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-3 w-full items-center">
                    {hasPermission("ROLE_SECRETARY") && (
                      <>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowAddMember(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <Users2 />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentMeeting(item);
                            setShowUpdateMeeting(true);
                          }}
                          className="md:cursor-pointer"
                        >
                          <PencilLine />
                        </button>
                      </>
                    )}
                    <button
                      className="md:cursor-pointer"
                      onClick={() => navigateToMeeting(item, "files")}
                    >
                      <FileText />
                    </button>
                    {status[item.status as keyof typeof status](item) || (
                      <button className="bg-gray-500 text-white px-2 py-1 rounded-sm">
                        Không xác định
                      </button>
                    )}
                  </div>
                </Card>
              </div>
            ))}
        </div>

        {!joined && showPreview && (
          <PreviewJoinMeeting
            onJoin={handleJoin}
            meeting={currentMeeting || ({} as MeetingType)}
            setShowPreview={setShowPreview}
          />
        )}

        {joined && (
          <Room
            currentMeeting={currentMeeting || ({} as MeetingType)}
            handleLeave={handleLeave}
            meetingCode={meetingCode}
            user={user}
          />
        )}
        {showCreateMeeting && (
          <ModalCreateMeeting
            setShowCreateMeeting={setShowCreateMeeting}
            setCurrentMeeting={setCurrentMeeting}
            setShowAddMember={setShowAddMember}
            load={load}
            setLoad={setLoad}
          />
        )}

        {showAddMember && (
          <AddMemberToMeeting
            setShowAddMember={setShowAddMember}
            meeting={currentMeeting || ({} as MeetingType)}
          />
        )}
        {showUpdateMeeting && (
          <ModalUpdateMeeting
            setShowUpdateMeeting={setShowUpdateMeeting}
            load={load}
            setLoad={setLoad}
            meeting={currentMeeting || ({} as MeetingType)}
          />
        )}
      </div>
    </>
  );
}

interface PreviewJoinMeetingProps {
  onJoin: (meetingCode: string) => void;
  meeting: MeetingType;
  setShowPreview?: (show: boolean) => void;
}

const PreviewJoinMeeting = ({
  onJoin,
  meeting,
  setShowPreview,
}: PreviewJoinMeetingProps) => {
  // emit join meeting request
  const handleJoinMeeting = () => {
    onJoin(meeting.meetingCode);
  };

  return (
    <>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/70 z-50 flex items-center justify-center">
        <div className="bg-white p-8 shadow-md rounded-xl lg:w-[70%] h-[50%] flex gap-8 items-center">
          <div className="w-full h-full">
            <WebcamComponent isCameraOn={true} />
            {/* <AudioComponent isMicOn={isTurnOnMicro} /> */}
          </div>
          <div className="text-center w-full">
            <h1 className="text-2xl font-bold text-gray-600">
              [{meeting.room.roomName}] {meeting.name}
              <br />
              <span className="text-base font-medium">
                Khoa: {meeting.department.name}
              </span>
            </h1>

            <div className="flex justify-center gap-4"></div>

            <div className="flex justify-center gap-4">
              <button
                className="bg-gray-300 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                onClick={() => setShowPreview && setShowPreview(false)}
              >
                Hủy bỏ
              </button>
              <button
                className="bg-green-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                onClick={() => handleJoinMeeting()}
              >
                Tham gia ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ModalCreateMeeting = ({
  setShowCreateMeeting,
  setCurrentMeeting,
  setShowAddMember,
  load,
  setLoad,
}: {
  setShowCreateMeeting: (show: boolean) => void;
  setCurrentMeeting: (meeting: MeetingType) => void;
  setShowAddMember: (show: boolean) => void;
  load: boolean;
  setLoad: (load: boolean) => void;
}) => {
  const [meetingCode, setMeetingCode] = useState<string>("");
  const [meetingName, setMeetingName] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch data for room and department
      const departmentResponse = await getAllDepartments();
      setDepartments(departmentResponse.result);
      const roomResponse = await getAllRooms();
      setRooms(roomResponse.result);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    const response = await createMeeting({
      meetingCode,
      roomId,
      departmentId,
      name: meetingName,
      startTime,
      endTime,
    });
    if (response.code === 200) {
      toast.success("Tạo cuộc họp thành công");
      setLoad(!load);
      setShowCreateMeeting(false);
      // Set current meeting
      setCurrentMeeting(response.result);
      // Show add member modal
      setShowAddMember(true);
    } else {
      toast.error("Tạo cuộc họp thất bại");
    }
    setMeetingCode("");
    setMeetingName("");
    setRoomId("");
    setDepartmentId("");
    setStartTime("");
    setEndTime("");
  };
  const handleClose = () => {
    setShowCreateMeeting(false);
  };
  return (
    <>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/70 z-50 flex items-center justify-center">
        <div className="bg-white p-8 shadow-md md:rounded-xl lg:w-[60%] w-full md:h-fit h-screen overflow-y-scroll flex gap-8 items-center">
          <div className="w-full h-full">
            <h1 className="text-2xl font-bold text-gray-600 mb-3">
              Tạo cuộc họp
            </h1>
            <form action="" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="meetingCode">Mã cuộc họp</label>
                  <input
                    type="text"
                    id="meetingCode"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    className="border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="meetingName">Tên cuộc họp</label>
                  <input
                    type="text"
                    id="meetingName"
                    value={meetingName}
                    onChange={(e) => setMeetingName(e.target.value)}
                    className="border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="flex gap-2 md:flex-row flex-col">
                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="roomId">Phòng họp</label>
                    <select
                      id="roomId"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="">Chọn phòng họp</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.roomName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="departmentId">Khoa</label>
                    <select
                      id="departmentId"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="">Chọn khoa</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 md:flex-row flex-col">
                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="startTime">Thời gian bắt đầu</label>
                    <input
                      type="datetime-local"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="longTime">Thời gian kết thúc</label>
                    <input
                      type="datetime-local"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-3 w-full">
                  <button
                    type="button"
                    className="bg-gray-300 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                    onClick={handleClose}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                  >
                    Tạo ngay
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

const AddMemberToMeeting = ({
  setShowAddMember,
  meeting,
}: {
  setShowAddMember: (show: boolean) => void;
  meeting: MeetingType;
}) => {
  const { socket, sendSignal, connected } = useSocket();
  const [members, setMembers] = useState<
    {
      member: UserType;
      meetingRole: string;
      isChecked?: boolean;
    }[]
  >([]);
  const [membersInDepartment, setMembersInDepartment] = useState<
    {
      member: UserType;
      meetingRole: string;
      isChecked?: boolean;
    }[]
  >([]);

  const [membersToAdd, setMembersToAdd] = useState<RequestAddMember[]>([]);
  const [membersToRemove, setMembersToRemove] = useState<
    {
      meetingId: number;
      userId: number;
    }[]
  >([]);
  const [membersToUpdate, setMembersToUpdate] = useState<RequestAddMember[]>(
    []
  );
  const [membersInMeeting, setMembersInMeeting] = useState<MeetingMemberType[]>(
    []
  );
  const [search, setSearch] = useState<string>("");
  const [debounceSearch, setDebounceSearch] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getAllUsers();
      const responseMemberInMeeting = await getAllMemberInMeeting(
        meeting.id,
        debounceSearch
      );
      if (response.code !== 200) {
        toast.error("Lấy danh sách người dùng thất bại");
        return;
      }
      if (responseMemberInMeeting.code !== 200) {
        toast.error("Lấy danh sách người dùng trong cuộc họp thất bại");
        return;
      }
      setMembersInMeeting(responseMemberInMeeting.result);
      //add checked if response.result has member in meeting
      const membersWithoutMeeting = response.result
        .filter((member: UserType) => member.role !== "ROLE_ADMIN")
        .map((member: UserType) => {
          let meetingRole = "GUEST";
          const isChecked = responseMemberInMeeting.result.some(
            (memberInMeeting) => {
              if (memberInMeeting.meetingRole) {
                meetingRole = memberInMeeting.meetingRole;
              }
              return memberInMeeting.user.id === member.id;
            }
          );

          return isChecked
            ? {
                member: member,
                meetingRole: meetingRole,
                isChecked: true,
              }
            : {
                member: member,
                meetingRole: "GUEST",
                isChecked: false,
              };
        });

      setMembers(
        membersWithoutMeeting.filter(
          (member: { member: UserType; isChecked?: boolean }) =>
            member.member.department?.id !== meeting.department.id
        )
      );
      setMembersInDepartment(
        membersWithoutMeeting.filter(
          (member: { member: UserType; isChecked?: boolean }) =>
            member.member.department?.id === meeting.department.id
        )
      );
    };
    fetchData();
  }, [debounceSearch]);

  const handleChangeMember = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const memberId = parseInt(value);

    // update isChecked in members
    setMembers((prev) =>
      prev.map((m) =>
        m.member.id === memberId ? { ...m, isChecked: checked } : m
      )
    );

    // update isChecked in membersInDepartment
    setMembersInDepartment((prev) =>
      prev.map((m) =>
        m.member.id === memberId ? { ...m, isChecked: checked } : m
      )
    );
    //if checked is false and memberId is in membersInMeeting then add to membersToRemove
    if (!checked) {
      const memberInMeeting = membersInMeeting.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (member: any) => member.user.id === memberId
      );
      if (memberInMeeting) {
        setMembersToRemove((prev) => [
          ...prev,
          {
            meetingId: meeting.id,
            userId: memberInMeeting.user.id,
          },
        ]);
      }
      const memberInMemberToAdd = membersToAdd.find(
        (member: RequestAddMember) => member.userId === memberId
      );
      if (memberInMemberToAdd) {
        setMembersToAdd((prev) =>
          prev.filter((member) => member.userId !== memberId)
        );
      }
      const memberInMemberToUpdate = membersToUpdate.find(
        (member: RequestAddMember) => member.userId === memberId
      );
      if (memberInMemberToUpdate) {
        setMembersToUpdate((prev) =>
          prev.filter((member) => member.userId !== memberId)
        );
      }
    }
    //if checked is true and memberId is not in membersInMeeting then add to membersToAdd
    else {
      const memberInMeeting = membersInMeeting.find(
        (member) => member.user.id === memberId
      );
      if (!memberInMeeting) {
        setMembersToAdd((prev) => [
          ...prev,
          {
            meetingId: meeting.id,
            userId: memberId,
            meetingRole:
              e.target.parentElement?.parentElement?.getElementsByTagName(
                "select"
              )[0].value || "GUEST",
          },
        ]);
      }
      const memberInMemberToRemove = membersToRemove.find(
        (member: { meetingId: number; userId: number }) =>
          member.userId === memberId
      );
      if (memberInMemberToRemove) {
        setMembersToRemove((prev) =>
          prev.filter((member) => member.userId !== memberId)
        );
      }
    }
  };
  const handleChangeRole = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const memberId = parseInt(e.target.id);
    // update isChecked in members
    setMembers((prev) =>
      prev.map((m) =>
        m.member.id === memberId ? { ...m, meetingRole: value } : m
      )
    );

    // update isChecked in membersInDepartment
    setMembersInDepartment((prev) =>
      prev.map((m) =>
        m.member.id === memberId ? { ...m, meetingRole: value } : m
      )
    );
    const target = e.target.parentElement?.getElementsByTagName("input")[0];
    const checked = target?.checked;
    const userId = parseInt(target?.value || "-1");
    //if checked is true and userId is in membersToAdd then update meetingRole
    //if checked is true and userId is in membersInMeeting then add to membersToUpdate
    if (checked) {
      const memberInMeeting = membersInMeeting.find(
        (member) => member.user.id === userId
      );
      if (memberInMeeting) {
        setMembersToUpdate((prev) => [
          ...prev,
          {
            meetingId: meeting.id,
            userId: memberInMeeting.user.id,
            meetingRole: value,
          },
        ]);
      }
      const memberInMemberToAdd = membersToAdd.find(
        (member: RequestAddMember) => member.userId === userId
      );
      if (memberInMemberToAdd) {
        setMembersToAdd((prev) =>
          prev.map((member) =>
            member.userId === userId
              ? { ...member, meetingRole: value }
              : member
          )
        );
      }
    }
    //if checked is false and userId is in membersToUpdate then remove from membersToUpdate
    //if checked is false and userId is in membersToRemove then remove from membersUpdate
    else {
      const memberInMemberToUpdate = membersToUpdate.find(
        (member: RequestAddMember) => member.userId === userId
      );
      if (memberInMemberToUpdate) {
        setMembersToUpdate((prev) =>
          prev.filter((member) => member.userId !== userId)
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      //send request to add member to meeting
      for (const member of membersToAdd) {
        //check This member has duplicate time
        const response = await addMemberToMeeting({
          userId: member.userId,
          meetingId: meeting.id,
          meetingRole: member.meetingRole,
        });

        if (response.code === 409) {
          let user;
          user = membersInDepartment.find(
            (memberInMeeting) => memberInMeeting.member.id === member.userId
          );
          if (!user) {
            user = members.find(
              (memberInMeeting) => memberInMeeting.member.id === member.userId
            );
          }
          const comfrim = window.confirm(
            `Thành viên ${
              user?.member.employeeCode + " - " + user?.member.name
            } đã có trong cuộc họp khác vào thời gian này. Bạn có muốn thêm thành viên này không?`
          );
          if (!comfrim) {
            continue;
          } else {
            const checkRespone = await addMemberToMeeting({
              userId: member.userId,
              meetingId: meeting.id,
              meetingRole: member.meetingRole,
              forceAdd: true,
            });
            if (checkRespone.code !== 200) {
              toast.error(
                `Chưa thể thêm thành viên ${
                  user?.member.employeeCode + " - " + user?.member.name
                } vào cuộc họp này`
              );
            } else
              toast.success(
                `Thêm thành viên ${
                  user?.member.employeeCode + " - " + user?.member.name
                } thành công`
              );
            //notification to user
            if (socket && connected) {
              const sender = JSON.parse(
                localStorage.getItem("user") || "{}"
              ) as UserType;
              sendSignal(
                {
                  type: "notification",
                  from: sender.employeeCode || "",
                  to: user?.member.employeeCode || "",
                  member: null,
                  payload: {
                    reason: `Bạn đã được thêm vào cuộc họp ${meeting.name}`,
                    timestamp: new Date(),
                  },
                },
                user?.member.employeeCode || ""
              );
              await saveNotification({
                id: uuid(),
                sender: sender.employeeCode || "",
                receiver: user?.member.employeeCode || "",
                timestamp: new Date(),
                content: `Bạn đã được thêm vào cuộc họp ${meeting.name}`,
                read: false,
              });
            }
          }
        } else if (response.code === 200) {
          toast.success(
            `Thêm thành viên ${
              response.result.user.employeeCode +
              " - " +
              response.result.user.name
            } thành công`
          );
          //notification to user
          if (socket && connected) {
            const sender = JSON.parse(
              localStorage.getItem("user") || "{}"
            ) as UserType;
            sendSignal(
              {
                type: "notification",
                from: sender.employeeCode || "",
                to: response.result.user.employeeCode || "",
                member: null,
                payload: {
                  reason: `Bạn đã được thêm vào cuộc họp ${meeting.name}`,
                  timestamp: new Date(),
                },
              },
              response.result.user.employeeCode || ""
            );
            await saveNotification({
              id: uuid(),
              sender: sender.employeeCode || "",
              receiver: response.result.user.employeeCode || "",
              timestamp: new Date(),
              content: `Bạn đã được thêm vào cuộc họp ${meeting.name}`,
              read: false,
            });
          }
        }
      }
      //send request to remove member from meeting
      for (const member of membersToRemove) {
        const response = await deleteMemberInMeeting({
          userId: member.userId,
          meetingId: meeting.id,
        });
        if (response.code !== 200) {
          toast.error("Xóa thành viên thất bại");
          return;
        } else {
          toast.success("Câp nhật thành viên thành công");
        }
      }
      //send request to update member in meeting
      for (const member of membersToUpdate) {
        const response = await updateMemberInMeeting({
          userId: member.userId,
          meetingId: meeting.id,
          meetingRole: member.meetingRole,
        });
        if (response.code !== 200) {
          toast.error("Cập nhật thành viên thất bại");
        } else
          toast.success(
            `Đã cập nhật thành viên ${
              response.result.user.employeeCode +
              " - " +
              response.result.user.name
            } thành ${
              ROLE_MEETING.find(
                (role) => role.id === response.result.meetingRole
              )?.name
            }`
          );
        //notification to user
        if (socket && connected) {
          const sender = JSON.parse(
            localStorage.getItem("user") || "{}"
          ) as UserType;

          sendSignal(
            {
              type: "notification",
              from: sender.employeeCode || "",
              to: response.result.user.employeeCode || "",
              member: null,
              payload: {
                reason: `Bạn đã được cập nhật vai trò thành ${
                  ROLE_MEETING.find(
                    (role) => role.id === response.result.meetingRole
                  )?.name
                } trong cuộc họp ${meeting.name}`,
                timestamp: new Date(),
              },
            },
            response.result.user.employeeCode || ""
          );
          await saveNotification({
            id: uuid(),
            sender: sender.employeeCode || "",
            receiver: response.result.user.employeeCode || "",
            timestamp: new Date(),
            content: `Bạn đã được cập nhật vai trò thành ${
              ROLE_MEETING.find(
                (role) => role.id === response.result.meetingRole
              )?.name
            } trong cuộc họp ${meeting.name}`,
            read: false,
          });
        }
      }

      setShowAddMember(false);
      //clear all state
      setMembers([]);
      setMembersInDepartment([]);
      setMembersToAdd([]);
      setMembersToRemove([]);
      setMembersToUpdate([]);
      setMembersInMeeting([]);
      setSearch("");
      setDebounceSearch("");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
    }
  };

  return (
    <>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/70 z-50 flex items-center justify-center">
        <div className="bg-white p-8 shadow-md rounded-xl lg:w-[80%] w-full lg:h-fit h-full overflow-y-scroll flex gap-8 items-center">
          <div className="w-full h-full">
            <input
              type="search"
              placeholder="Tìm kiếm thành viên"
              className="border border-gray-300 rounded-md p-2 w-full mb-4"
            />
            <form action="">
              <div>
                <div className="flex justify-between items-center w-full mb-3 gap-2">
                  <h2 className="text-base whitespace-nowrap text-gray-600 ">
                    Danh sách thành viên trong khoa
                  </h2>
                  <div className="w-full h-0.5 bg-gray-300"></div>
                </div>
                <div className="gap-4 grid lg:grid-cols-2 grid-cols-1">
                  {membersInDepartment.map((member) => (
                    <div
                      key={member.member.id}
                      className="flex justify-between sm:flex-row flex-col items-center gap-2 py-2 px-4 bg-gray-100 rounded-lg"
                    >
                      <div className="flex gap-2 ">
                        <input
                          checked={member?.isChecked}
                          type="checkbox"
                          id={"" + member.member.id}
                          value={member.member.id}
                          onChange={handleChangeMember}
                        />
                        <label
                          className="whitespace-nowrap"
                          htmlFor={member.member.employeeCode}
                        >
                          {member.member.employeeCode +
                            " - " +
                            member.member.name}
                        </label>
                      </div>
                      <select
                        value={member.meetingRole}
                        name="meetingRole"
                        id={member.member.id + ""}
                        className="border border-gray-300 rounded-md p-1"
                        onChange={handleChangeRole}
                      >
                        {ROLE_MEETING.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center w-full my-3 gap-2">
                  <h2 className="text-base whitespace-nowrap text-gray-600">
                    Danh sách thành viên khác
                  </h2>
                  <div className="w-full h-0.5 bg-gray-300"></div>
                </div>
                <div className="gap-2 grid lg:grid-cols-2 grid-cols-1">
                  {members.map((member) => (
                    <div
                      key={member.member.id}
                      className="flex gap-2 items-center justify-between sm:flex-row flex-col py-2 px-4 bg-gray-100 rounded-lg"
                    >
                      <div className="flex gap-2 items-center justify-between">
                        <input
                          type="checkbox"
                          id={"" + member.member.id}
                          value={member.member.id}
                          checked={member?.isChecked}
                          onChange={handleChangeMember}
                        />
                        <label
                          className="whitespace-nowrap"
                          htmlFor={member.member.employeeCode}
                        >
                          {member.member.employeeCode +
                            " - " +
                            member.member.name}
                        </label>
                      </div>
                      <select
                        value={member.meetingRole}
                        name="meetingRole"
                        id={member.member.id + ""}
                        className="border border-gray-300 rounded-md p-1"
                        onChange={handleChangeRole}
                      >
                        {ROLE_MEETING.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-4 w-full mt-4">
                <button
                  type="button"
                  className="bg-gray-300 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                  onClick={() => setShowAddMember(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                  onClick={handleSubmit}
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

const ModalUpdateMeeting = ({
  setShowUpdateMeeting,
  meeting,
  load,
  setLoad,
}: {
  setShowUpdateMeeting: (show: boolean) => void;
  meeting: MeetingType;
  load: boolean;
  setLoad: (load: boolean) => void;
}) => {
  const [meetingCode, setMeetingCode] = useState<string>(meeting.meetingCode);
  const [meetingName, setMeetingName] = useState<string>(meeting.name);
  const [roomId, setRoomId] = useState<string>(meeting.room.id + "");
  const [departmentId, setDepartmentId] = useState<string>(
    meeting.department.id + ""
  );
  const [startTime, setStartTime] = useState<string>(meeting.startTime);
  const [endTime, setEndTime] = useState<string>(meeting.endTime);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [showModelCancelMeeting, setShowModelCancelMeeting] =
    useState<boolean>(false);
  const [showModelPostponeMeeting, setShowModelPostponeMeeting] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch data for room and department
      const departmentResponse = await getAllDepartments();
      setDepartments(departmentResponse.result);
      const roomResponse = await getAllRooms();
      setRooms(roomResponse.result);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    const response = await updateMeeting({
      id: meeting.id,
      meetingCode,
      roomId,
      departmentId,
      name: meetingName,
      startTime,
      endTime,
    });
    if (response.code === 200) {
      toast.success("Cập nhật cuộc họp thành công");
      setLoad(!load);
      setShowUpdateMeeting(false);
    } else {
      toast.error("Cập nhật cuộc họp thất bại");
    }
    setMeetingCode("");
    setMeetingName("");
    setRoomId("");
    setDepartmentId("");
    setStartTime("");
    setEndTime("");
  };
  const handleClose = () => {
    setShowUpdateMeeting(false);
  };
  const handleDeleteMeeting = async () => {
    const confirm = window.confirm(
      "Bạn có chắc chắn muốn xóa cuộc họp này không? Cuộc họp sẽ bị xóa vĩnh viễn và không thể khôi phục lại."
    );
    if (confirm) {
      const response = await deleteMeeting(meeting.id);
      if (response.code !== 200) {
        toast.error("Xóa cuộc họp thất bại");
        return;
      }
      toast.success("Xóa cuộc họp thành công");
      setLoad(!load);
      setShowUpdateMeeting(false);
    }
  };
  return (
    <>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/70 z-50 flex items-center justify-center">
        <div className="bg-white p-8 shadow-md rounded-xl lg:w-[60%] w-full md:h-fit h-full overflow-y-scroll flex gap-8 items-center">
          <div className="w-full h-full">
            <h1 className="text-2xl font-bold text-gray-600 mb-3">
              Cập nhật cuộc họp
            </h1>
            <form action="" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="meetingCode">Mã cuộc họp</label>
                  <input
                    type="text"
                    id="meetingCode"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    className="border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="meetingName">Tên cuộc họp</label>
                  <input
                    type="text"
                    id="meetingName"
                    value={meetingName}
                    onChange={(e) => setMeetingName(e.target.value)}
                    className="border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="flex gap-2 md:flex-row flex-col">
                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="roomId">Phòng họp</label>
                    <select
                      id="roomId"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="">Chọn phòng họp</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.roomName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="departmentId">Khoa</label>
                    <select
                      id="departmentId"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="">Chọn khoa</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-3 w-full">
                  <button
                    type="button"
                    className="bg-gray-300 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                    onClick={handleClose}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    className="bg-red-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                    onClick={handleDeleteMeeting}
                  >
                    Xóa <span className="md:inline-block hidden">cuộc họp</span>
                  </button>
                  {(meeting.status === "UPCOMING" ||
                    meeting.status === "NOT_STARTED" ||
                    meeting.status === "POSTPONED") && (
                    <>
                      <button
                        type="button"
                        className="bg-blue-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                        onClick={() => setShowModelCancelMeeting(true)}
                      >
                        Hủy{" "}
                        <span className="md:inline-block hidden">cuộc họp</span>
                      </button>
                    </>
                  )}

                  {(meeting.status === "UPCOMING" ||
                    meeting.status === "NOT_STARTED" ||
                    meeting.status === "POSTPONED") && (
                    <>
                      <button
                        type="button"
                        className="bg-orange-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                        onClick={() => setShowModelPostponeMeeting(true)}
                      >
                        Rời{" "}
                        <span className="md:inline-block hidden">lịch họp</span>
                      </button>
                    </>
                  )}

                  <button
                    type="submit"
                    className="bg-green-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                  >
                    Cập nhật{" "}
                    <span className="md:inline-block hidden">ngay</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showModelPostponeMeeting && (
        <ModelPostponeMeeing
          setShowModelPostponeMeeting={setShowModelPostponeMeeting}
          meeting={meeting}
          setLoad={setLoad}
          setShowUpdateMeeting={setShowUpdateMeeting}
        />
      )}
      {showModelCancelMeeting && (
        <ModelCanelMeeting
          setShowModelCancelMeeting={setShowModelCancelMeeting}
          meeting={meeting}
          setLoad={setLoad}
          setShowUpdateMeeting={setShowUpdateMeeting}
        />
      )}
    </>
  );
};

const ModelPostponeMeeing = ({
  setShowModelPostponeMeeting,
  meeting,
  setLoad,
  setShowUpdateMeeting,
}: {
  setShowModelPostponeMeeting: (show: boolean) => void;
  meeting: MeetingType;
  setLoad: (load: boolean) => void;
  setShowUpdateMeeting: (show: boolean) => void;
}) => {
  const { socket, sendSignal, connected } = useSocket();
  const [startTime, setStartTime] = useState<string>(meeting.startTime);
  const [endTime, setEndTime] = useState<string>(meeting.endTime);
  const [reason, setReason] = useState<string>("");

  const [minStartTime, setMinStartTime] = useState("");

  // Format date to YYYY-MM-DDThh:mm format for datetime-local input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  // Update minimum start time on component mount and every minute
  useEffect(() => {
    const updateMinStartTime = () => {
      const now = new Date();
      setMinStartTime(formatDateForInput(now));

      // If startTime is empty or before current time, update it to current time
      if (!startTime || new Date(startTime) < now) {
        setStartTime(formatDateForInput(now));
      }
    };

    // Set initial values
    updateMinStartTime();

    // Update every minute to keep the minimum time current
    const intervalId = setInterval(updateMinStartTime, 60000);

    return () => clearInterval(intervalId);
  }, [startTime]);

  // Handle start time change
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);

    // If end time is empty or before new start time, update it
    if (!endTime || new Date(endTime) <= new Date(newStartTime)) {
      // Set end time to start time + 1 hour by default
      const newEndDate = new Date(newStartTime);
      newEndDate.setHours(newEndDate.getHours() + 1);
      setEndTime(formatDateForInput(newEndDate));
    }
  };

  // Handle end time change
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;

    // Only allow end time to be after start time
    if (new Date(newEndTime) > new Date(startTime)) {
      setEndTime(newEndTime);
    } else {
      // If invalid selection, reset to start time + 1 hour
      const newEndDate = new Date(startTime);
      newEndDate.setHours(newEndDate.getHours() + 1);
      setEndTime(formatDateForInput(newEndDate));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    const response = await postponeMeeting({
      meetingId: meeting.id,
      startTime,
      endTime,
    });
    if (response.code === 200) {
      toast.success("Rời lịch họp thành công");
      // Send signal to update meeting in socket
      const members = await getAllMemberInMeeting(meeting.id);
      if (members.code !== 200) {
        toast.error("Lấy danh sách thành viên thất bại");
        return;
      }
      members.result.forEach(async (member) => {
        if (socket && connected) {
          const sender = JSON.parse(
            localStorage.getItem("user") || "{}"
          ) as UserType;
          sendSignal(
            {
              type: "notification",
              from: sender.employeeCode ?? "",
              to: member.user.employeeCode ?? "",
              member: null,
              payload: {
                reason: `Cuôc họp ${
                  meeting.name
                } đã bị hoãn lại đến thời gian ${new Date(
                  startTime
                ).toLocaleString()} - ${new Date(
                  endTime
                ).toLocaleString()} với lý do: ${reason}`,
                timestamp: new Date().toISOString(),
              },
            },
            member.user.employeeCode ?? ""
          );
          await saveNotification({
            id: uuid(),
            sender: sender.employeeCode ?? "",
            receiver: member.user.employeeCode ?? "",
            content: `Cuôc họp ${
              meeting.name
            } đã bị hoãn lại đến thời gian ${new Date(
              startTime
            ).toLocaleString()} - ${new Date(
              endTime
            ).toLocaleString()} với lý do: ${reason}`,
            timestamp: new Date(),
            read: false,
          });
        }
      });
      setLoad(true);
      setShowModelPostponeMeeting(false);
    } else {
      toast.error("Rời lịch họp thất bại");
    }
    setStartTime("");
    setEndTime("");
    setReason("");
    setShowUpdateMeeting(false);
  };
  const handleClose = () => {
    setShowModelPostponeMeeting(false);
  };

  return (
    <>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/70 z-50 flex items-center justify-center">
        <div className="bg-white p-8 shadow-md rounded-xl lg:w-[60%] w-full md:h-fit h-full overflow-y-scroll flex gap-8 items-center">
          <div className="w-full h-full">
            <h1 className="text-2xl font-bold text-gray-600 mb-3">
              Rời lịch họp
            </h1>
            <form action="" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="startTime">Thời gian bắt đầu</label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    required
                    value={startTime}
                    min={minStartTime}
                    onChange={handleStartTimeChange}
                    className="border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="endTime">Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    required
                    value={endTime}
                    min={startTime} // End time must be after start time
                    onChange={handleEndTimeChange}
                    className="border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="reason">Lý do hoãn</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Nhập lý do hoãn cuộc họp"
                    required
                    className="border border-gray-300 rounded-md p-2 h-[100px]"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-4 mt-3 w-full">
                  <button
                    type="button"
                    className="bg-gray-300 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                    onClick={handleClose}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                  >
                    Rời lịch họp
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

const ModelCanelMeeting = ({
  setShowModelCancelMeeting,
  meeting,
  setLoad,
  setShowUpdateMeeting,
}: {
  setShowModelCancelMeeting: (show: boolean) => void;
  meeting: MeetingType;
  setLoad: (load: boolean) => void;
  setShowUpdateMeeting: (show: boolean) => void;
}) => {
  const { socket, sendSignal, connected } = useSocket();
  const [reason, setReason] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    const response = await cancelMeeting({
      meetingId: meeting.id,
      reason,
    });
    if (response.code === 200) {
      toast.success("Hủy cuộc họp thành công");
      // Send signal to update meeting in socket
      const members = await getAllMemberInMeeting(meeting.id);
      if (members.code !== 200) {
        toast.error("Lấy danh sách thành viên thất bại");
        return;
      }
      members.result.forEach((member) => {
        if (socket && connected) {
          const sender = JSON.parse(
            localStorage.getItem("user") || "{}"
          ) as UserType;
          sendSignal(
            {
              type: "notification",
              from: sender.employeeCode ?? "",
              to: member.user.employeeCode ?? "",
              member: null,
              payload: {
                reason: `Cuôc họp ${meeting.name} đã bị hủy với lý do: ${reason}`,
                timestamp: new Date().toISOString(),
              },
            },
            member.user.employeeCode ?? ""
          );
          saveNotification({
            id: uuid(),
            sender: sender.employeeCode ?? "",
            receiver: member.user.employeeCode ?? "",
            content: `Cuôc họp ${meeting.name} đã bị hủy với lý do: ${reason}`,
            timestamp: new Date(),
            read: false,
          });
        }
      });
      setLoad(true);
      setShowModelCancelMeeting(false);
      setShowUpdateMeeting(false);
    } else {
      toast.error("Hủy cuộc họp thất bại");
    }
    setReason("");
  };
  const handleClose = () => {
    setShowModelCancelMeeting(false);
  };
  return (
    <>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/70 z-50 flex items-center justify-center">
        <div className="bg-white p-8 shadow-md rounded-xl lg:w-[60%] w-full md:h-fit h-full overflow-y-scroll flex gap-8 items-center">
          <div className="w-full h-full">
            <h1 className="text-2xl font-bold text-gray-600 mb-3">
              Hủy cuộc họp
            </h1>
            <form action="" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="reason">Lý do hủy</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Nhập lý do hủy cuộc họp"
                    required
                    className="border border-gray-300 rounded-md p-2 h-[100px]"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-4 mt-3 w-full">
                  <button
                    type="button"
                    className="bg-gray-300 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                    onClick={handleClose}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
                  >
                    Hủy cuộc họp
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
