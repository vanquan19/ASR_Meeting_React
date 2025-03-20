import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { getAllMeetingForUser } from "../services/meetingService";
import { MeetingType } from "../interface/meeting";
import { Camera, CameraOff, FileText } from "lucide-react";
import WebcamComponent from "../components/ui/Video";
// import AudioComponent from "../components/ui/Micro";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { Message } from "@stomp/stompjs";

const colors = [
  "bg-blue-500",
  "bg-red-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-indigo-500",
];

export default function MeetingRoom() {
  const [dataMeetingRoom, setDataMeetingRoom] = useState<MeetingType[]>([]);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingType | null>(
    null
  );
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
  useEffect(() => {
    const getData = async () => {
      const response = await getAllMeetingForUser(user.id);
      console.log(response);
      setDataMeetingRoom(response?.result || []);
    };
    getData();
  }, [user.id]);
  return (
    <div className="w-full pt-8">
      <h1 className="text-lg  text-gray-700 py-4">Cuộc họp</h1>
      <div className="grid xl:grid-cols-3 gap-4 md:grid-cols-2 grid-cols-1 w-full">
        {dataMeetingRoom.map((item, index) => (
          <div key={index} className="w-full">
            <Card
              cardKey={"" + index}
              className="p-4 items-center w-full shadow-lg"
            >
              <div className="flex gap-4 items-center w-full">
                <div
                  className={`min-w-16 size-16 items-center flex justify-center text-2xl font-semibold text-gray-200 rounded-sm ${
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

              <div className="flex justify-end gap-4 items-center mt-3">
                <a href="#">
                  <FileText />
                </a>
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
      {showPreview && (
        <PreviewJoinMeeting
          setShowPreview={setShowPreview}
          meeting={currentMeeting || ({} as MeetingType)}
        />
      )}
    </div>
  );
}

const PreviewJoinMeeting = ({
  meeting,
  setShowPreview,
}: {
  meeting: MeetingType;
  setShowPreview: (value: boolean) => void;
}) => {
  const socket = useSocket();
  const [isTurnOnCamera, setIsTurnOnCamera] = useState<boolean>(true);
  //   const [isTurnOnMicro, setIsTurnOnMicro] = useState<boolean>(false);
  const navigate = useNavigate();

  // emit join meeting request
  const handleJoinMeeting = (meeting: MeetingType) => {
    socket.publish({
      destination: "/app/join-room",
      body: JSON.stringify({
        meetingCode: meeting.meetingCode,
        isTurnOnCamera,
      }),
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  };

  const handleJoinRoom = useCallback(
    (data: Message) => {
      const dataBody = JSON.parse(data.body);
      const { room, isC } = dataBody;
      navigate(`/meeting?meeting=${room}&isC=${isC}`);
    },
    [navigate]
  );

  useEffect(() => {
    // receive join room response
    socket.subscribe("/user/queue/join", handleJoinRoom);
    return () => {
      socket.unsubscribe("/user/queue/join");
    };
  }, [socket, handleJoinRoom]);
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/70 z-50 flex items-center justify-center">
      <div className="bg-white p-8 shadow-md rounded-xl lg:w-[70%] h-[50%] flex gap-8 items-center">
        <div className="w-full h-full">
          <WebcamComponent isCameraOn={isTurnOnCamera} />
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

          <div className="flex justify-center gap-4">
            <button
              className={`${
                isTurnOnCamera ? "bg-primary" : "bg-gray-500"
              } text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4`}
              onClick={() => setIsTurnOnCamera(!isTurnOnCamera)}
            >
              {!isTurnOnCamera ? <CameraOff /> : <Camera />}
            </button>
            {/* <button
              className={`${
                isTurnOnMicro ? "bg-primary" : "bg-gray-500"
              } text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4`}
              onClick={() => setIsTurnOnMicro(!isTurnOnMicro)}
            >
              {!isTurnOnMicro ? <MicOff /> : <Mic />}
            </button> */}
          </div>

          <div className="flex justify-center gap-4">
            <button
              className="bg-gray-300 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
              onClick={() => setShowPreview(false)}
            >
              Hủy bỏ
            </button>
            <button
              className="bg-green-500 text-white text-base md:cursor-pointer px-4 py-2 rounded-sm mt-4"
              onClick={() => handleJoinMeeting(meeting)}
            >
              Tham gia ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
