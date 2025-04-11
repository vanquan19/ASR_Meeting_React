import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import {
  addMemberToMeeting,
  createMeeting,
  deleteMemberInMeeting,
  getAllMeeting,
  getAllMeetingForUser,
  getAllMemberInMeeting,
  updateMeeting,
  updateMemberInMeeting,
} from "../services/meetingService";
import {
  MeetingMemberType,
  MeetingType,
  RequestAddMember,
} from "../interface/meeting";
import { FileText, PencilLine, PlusCircle, Users2 } from "lucide-react";
import WebcamComponent from "../components/ui/Video";
import leavingMeetingSound from "../assets/sounds/leaving-meeting.mp3";

import Room from "./Room";
import { getAllRooms } from "../services/roomService";
import { getAllDepartments } from "../services/departmentService";
import { RoomType } from "../interface/room";
import { DepartmentType } from "../interface/department";
import { useAuth } from "../context/AuthContext";
import { getAllUsers } from "../services/userService";
import { UserType } from "../interface/auth";

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

  const handleUpdatePaticipantsCount = (meetingCode: string, count: number) => {
    setDataMeetingRoom((prev) =>
      prev.map((item) =>
        item.meetingCode === meetingCode ? { ...item, count } : item
      )
    );
  };

  console.log("dataMeetingRoom", dataMeetingRoom);

  useEffect(() => {
    const getData = async () => {
      let response;
      if (hasPermission("ROLE_SECRETARY")) {
        response = await getAllMeeting();
      } else {
        response = await getAllMeetingForUser(user.id);
      }
      console.log(response);
      setDataMeetingRoom(response?.result || []);
    };
    getData();
  }, [user.id, load]);
  return (
    <>
      <div className="w-full pt-8">
        <div className="flex justify-between items-center w-full px-4 mb-3">
          <h1 className="text-lg  text-gray-700 py-4">Cuộc họp</h1>
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
        <div className="grid xl:grid-cols-3 gap-4 md:grid-cols-2 grid-cols-1 w-full">
          {dataMeetingRoom.map((item, index) => (
            <div key={index} className="w-full">
              <Card className="p-4 items-center w-full shadow-lg">
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
      console.log(departmentResponse);
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
      alert("Tạo cuộc họp thành công");
      setLoad(!load);
      setShowCreateMeeting(false);
      // Set current meeting
      setCurrentMeeting(response.result);
      // Show add member modal
      setShowAddMember(true);
    } else {
      alert("Tạo cuộc họp thất bại");
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
        <div className="bg-white p-8 shadow-md rounded-xl lg:w-[60%] h-fit flex gap-8 items-center">
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
                <div className="flex gap-2">
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
                <div className="flex gap-2">
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

                <div className="flex justify-end gap-4">
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
  const ROLE_MEETING = [
    { id: "COMMISSIONER", name: "Ủy viên" },
    { id: "CRITIC", name: "Phê bình" },
    { id: "GUEST", name: "Khách mời" },
    { id: "PRESIDENT", name: "Chủ trì" },
    { id: "SECRETARY", name: "Thư ký" },
  ];
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
    console.log(meeting);
    const fetchData = async () => {
      const response = await getAllUsers();
      const responseMemberInMeeting = await getAllMemberInMeeting(
        meeting.id,
        debounceSearch
      );
      if (response.code !== 200) {
        alert("Lấy danh sách người dùng thất bại");
        return;
      }
      if (responseMemberInMeeting.code !== 200) {
        alert("Lấy danh sách người dùng trong cuộc họp thất bại");
        return;
      }
      console.log("responseMemberInMeeting", responseMemberInMeeting.result);
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
    console.log(
      "value",
      e.target.parentElement?.parentElement?.getElementsByTagName("select")[0]
        .value
    );
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
      console.log("memberInMeeting", memberInMeeting);
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

    console.log("membersToAdd", membersToAdd);
    console.log("membersToRemove", membersToRemove);
    console.log("membersToUpdate", membersToUpdate);

    try {
      //send request to add member to meeting
      for (const member of membersToAdd) {
        //check This member has duplicate time

        //if not then add member to meeting
        const response = await addMemberToMeeting({
          userId: member.userId,
          meetingId: meeting.id,
          meetingRole: member.meetingRole,
        });
        if (response.code !== 200) {
          alert("Thêm thành viên thất bại");
          return;
        }
        console.log("response", response);
      }
      //send request to remove member from meeting
      for (const member of membersToRemove) {
        const response = await deleteMemberInMeeting({
          userId: member.userId,
          meetingId: meeting.id,
        });
        if (response.code !== 200) {
          alert("Xóa thành viên thất bại");
          return;
        }
        console.log("response", response);
      }
      //send request to update member in meeting
      for (const member of membersToUpdate) {
        const response = await updateMemberInMeeting({
          userId: member.userId,
          meetingId: meeting.id,
          meetingRole: member.meetingRole,
        });
        if (response.code !== 200) {
          alert("Cập nhật thành viên thất bại");
          return;
        }
        console.log("response", response);
      }
      //if success then alert
      alert("Cập nhật thành công");
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
      alert("Cập nhật thất bại");
    }
  };

  return (
    <>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/70 z-50 flex items-center justify-center">
        <div className="bg-white p-8 shadow-md rounded-xl lg:w-[60%] h-fit flex gap-8 items-center">
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
                <div className="gap-4 grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
                  {membersInDepartment.map((member) => (
                    <div
                      key={member.member.id}
                      className="flex justify-between items-center gap-2 py-2 px-4 bg-gray-100 rounded-lg"
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
                            "-" +
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
                <div className="gap-2 grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1">
                  {members.map((member) => (
                    <div
                      key={member.member.id}
                      className="flex gap-2 items-center justify-between py-2 px-4 bg-gray-100 rounded-lg"
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
                            "-" +
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
              <div className="flex justify-end gap-4 mt-4">
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

  useEffect(() => {
    const fetchData = async () => {
      // Fetch data for room and department
      const departmentResponse = await getAllDepartments();
      console.log(departmentResponse);
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
      alert("Cập nhật cuộc họp thành công");
      setLoad(!load);
      setShowUpdateMeeting(false);
    } else {
      alert("Cập nhật cuộc họp thất bại");
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
  return (
    <>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/70 z-50 flex items-center justify-center">
        <div className="bg-white p-8 shadow-md rounded-xl lg:w-[60%] h-fit flex gap-8 items-center">
          <div className="w-full h-full">
            <h1
              className="text-2xl font-bold
 text-gray-600 mb-3"
            >
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
                <div className="flex gap-2">
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
                <div className="flex gap-2">
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
                <div className="flex justify-end gap-4">
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
                    Cập nhật ngay
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
