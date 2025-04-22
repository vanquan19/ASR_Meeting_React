import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { MeetingType } from "../interface/meeting";
import {
  getAllMeeting,
  getAllMemberInMeeting,
} from "../services/meetingService";
import { useSocket } from "../context/SocketContext";
import { ChatType } from "../interface/chat";
import VideoRoom, { SignalMessage } from "./Room";
import { IMessage } from "@stomp/stompjs";
import { MemberType } from "../interface/member";
import { UserType } from "../interface/auth";
import {
  DotIcon,
  FileText,
  MessageCircleMore,
  Paperclip,
  SendHorizontal,
  Users,
} from "lucide-react";
import { cn } from "../lib/utils";
import { ROLE_MEETING } from "../constants/meeting";
import {
  decryptFile,
  decryptText,
  encryptFile,
  encryptText,
} from "../utils/aes";
import leavingMeetingSound from "../assets/sounds/leaving-meeting.mp3";
import { exportFilePDF, exportFileWords } from "../services/textService";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { name: "chat", label: "Tin nhắn" },
  { name: "files", label: "Tài liệu" },
];

const status = {
  UPCOMING: () => (
    <button className="text-blue-500 px-2 py-2 rounded-sm">Sắp diễn ra</button>
  ),
  ONGOING: (item?: MeetingType, join?: (item: MeetingType) => void) => (
    <button
      onClick={() => {
        if (item) {
          join?.(item);
        }
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
    <button className=" text-red-500 px-2 py-2 rounded-sm">Đã kết thúc</button>
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
const DetailMeeting = () => {
  const query = new URLSearchParams(window.location.search);
  const meetingCode = query.get("meeting");
  const tabParam = query.get("tab");
  const [user] = useState<UserType | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? (JSON.parse(storedUser) as UserType) : null;
  });
  const [me, setMe] = useState<MemberType>({
    id: user?.id,
    name: user?.name || "",
    email: user?.email || "",
    img: user?.img || "",
    employeeCode: user?.employeeCode || "",
    peerId: uuid(),
  });

  const [tab, setTab] = useState(tabParam || tabs[0].name);
  const [meeting, setMeeting] = useState<MeetingType>();
  const [members, setMembers] = useState<MemberType[]>([]);
  const [showMember, setShowMember] = useState(true);
  const [showRoom, setShowRoom] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      const response = await getAllMeeting();
      if (response.code !== 200) {
        console.error("Error fetching meetings");
        return;
      }
      const meetings = response.result;
      const meetingData = meetings.find(
        (meeting) => meeting.meetingCode === meetingCode
      );
      if (meetingData) {
        setMeeting(meetingData);
      }
    };
    fetchData();
  }, [meetingCode]);
  useEffect(() => {
    const fetchMembers = async () => {
      // Fetch members for the meeting
      if (meeting?.id) {
        const response = await getAllMemberInMeeting(meeting.id);
        if (response.code !== 200) {
          console.error("Error fetching members");
          return;
        }
        const members = response.result as unknown as MemberType[];
        setMembers(members);
        const me = members.find(
          (member) => member.user?.employeeCode === user?.employeeCode
        );
        if (me) {
          setMe((prev) => ({
            ...prev,
            meetingRole: me.meetingRole,
          }));
        }
      }
    };
    fetchMembers();
  }, [meeting]);

  const handleTabChange = (selectedTab: string) => {
    setTab(selectedTab);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">{meeting?.name}</h1>
        <div className="flex gap-2">
          <div className="flex space-x-4">
            {tab === "chat" && (
              <button
                onClick={() => handleTabChange("files")}
                className={`px-4 py-2 rounded transition-all duration-150 bg-gray-200 md:cursor-pointer`}
              >
                <FileText />
              </button>
            )}
            {tab === "files" && (
              <button
                onClick={() => handleTabChange("chat")}
                className={`px-4 py-2 rounded transition-all duration-150 bg-gray-200 md:cursor-pointer`}
              >
                <MessageCircleMore />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowMember(!showMember)}
            className={`px-4 py-2 rounded transition-all duration-150 md:cursor-pointer ${
              showMember ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {showMember ? <Users /> : <Users />}
          </button>
          {meeting?.status &&
            status[meeting.status as keyof typeof status](
              meeting,
              meeting.status === "ONGOING"
                ? () => {
                    // Handle join meeting logic here
                    setShowRoom(true);
                  }
                : undefined
            )}
        </div>
      </div>
      <div className="flex justify-between gap-4 mt-4">
        <div className="flex flex-col flex-grow p-4 space-y-4 w-full border-r border-gray-200">
          {tab === "chat" && meetingCode && (
            <ChatMeetingTab meetingCode={meetingCode} me={me} />
          )}
          {tab === "files" && meetingCode && (
            <FileMeetingTab meetingCode={meetingCode} />
          )}
        </div>
        {showMember && (
          <div className="p-4 min-w-96 flex flex-col space-y-2">
            <h2 className="text-lg font-bold text-center">
              Thành viên ({members.filter((member) => !!member.active).length}/
              {members.length})
            </h2>
            <ul>
              {members.map((member) => (
                <li key={member.id} className="py-2 flex justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {member.user?.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {member.user?.employeeCode}
                    </p>
                  </div>
                  <button
                    className={`${
                      member.active ? "text-green-500" : "text-red-500"
                    } flex items-center`}
                  >
                    <DotIcon className="size-12" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {showRoom && (
        <VideoRoom
          meetingCode={meetingCode || ""}
          user={(() => {
            const storedUser = localStorage.getItem("user");
            return JSON.parse(storedUser || "{}") as UserType;
          })()}
          currentMeeting={meeting as MeetingType}
          handleLeave={() => {
            setShowRoom(false);
            const audio = new Audio(leavingMeetingSound);
            audio.volume = 1;
            audio.play();
          }}
        />
      )}
    </div>
  );
};
export default DetailMeeting;

const ChatMeetingTab = ({
  meetingCode,
  me,
}: {
  meetingCode: string;
  me: MemberType;
}) => {
  const { socket, sendSignal } = useSocket();
  const [chats, setChats] = useState<ChatType[]>([]);
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fixed useEffect to prevent infinite loops
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  useEffect(() => {
    console.log("socket", socket);
    if (socket && socket.connected) {
      socket.subscribe(
        `/topic/room/${meetingCode}/signal`,
        async (message: IMessage) => {
          const signal: SignalMessage = JSON.parse(message.body);
          if (signal.type === "chat") {
            const chat: ChatType = {
              id: Date.now(),
              sender: signal.member,
              receiver: signal.to,
              message: decryptText(
                signal.payload.message,
                import.meta.env.VITE_AES_KEY
              ),
              type: signal.payload.type,
              timestamp: signal.payload.timestamp,
            };
            if (signal.payload.type !== "text" && signal.payload.file.data) {
              const encriptedFile = btoa(
                new Uint8Array(signal.payload.file.data).reduce(
                  (data, byte) => data + String.fromCharCode(byte),
                  ""
                )
              );
              const blob = new Blob([encriptedFile]);
              const file = new File([blob], signal.payload.file.name);
              const decryptedFile = await decryptFile(
                file,
                import.meta.env.VITE_AES_KEY
              );

              const blobDecryptedFile = new Blob([decryptedFile.data]);
              chat.file = blobDecryptedFile;
              chat.fileName = decryptedFile.name;
            }
            console.log("chat", chat);
            setChats((prev) => (prev ? [...prev, chat] : [chat]));
          }
        }
      );
    }
  }, [meetingCode, socket]);

  const handleSend = () => {
    if (message.trim() === "" && !file) {
      return;
    }

    try {
      let type = "text";
      let messageToSend = message;

      if (file) {
        type = file.type.split("/")[0];
        encryptFile(file, import.meta.env.VITE_AES_KEY).then(
          (encriptedFile) => {
            if (!encriptedFile) {
              console.error("Error encrypting file");
              return;
            }

            if (messageToSend) {
              messageToSend = encryptText(
                messageToSend,
                import.meta.env.VITE_AES_KEY
              );
            }

            const base64File = btoa(
              new Uint8Array(encriptedFile.data).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            );

            sendSignal(
              {
                type: "chat",
                from: me.employeeCode,
                to: meetingCode,
                member: me,
                payload: {
                  type: type,
                  message: messageToSend,
                  file: {
                    name: encriptedFile.name,
                    data: base64File,
                  },
                  timestamp: new Date().toISOString(),
                },
              },
              meetingCode
            );
            console.log("encriptedFile", encriptedFile);
          }
        );
      } else {
        // Encrypt the message
        messageToSend = encryptText(
          messageToSend,
          import.meta.env.VITE_AES_KEY
        );
        sendSignal(
          {
            type: "chat",
            from: me.employeeCode + "",
            to: meetingCode,
            member: me,
            payload: {
              type: type,
              message: messageToSend,
              timestamp: new Date().toISOString(),
            },
          },
          meetingCode
        );
      }

      // Clear input after sending
      setMessage("");
      setFile(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return "🖼️";
    } else if (fileType.startsWith("video/")) {
      return "🎬";
    } else if (fileType.startsWith("audio/")) {
      return "🎵";
    } else {
      return "📄";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-100 rounded">
      {/* Messages area - taking up all available space */}
      <div
        id="scroll-container"
        className="flex-1 overflow-y-auto no-scrollbar min-h-[70vh]"
      >
        <div className="p-4 space-y-4">
          {chats.map((chat, index) => {
            const isCurrentUser = chat.sender.employeeCode === me.employeeCode;

            return (
              <div
                key={index}
                className={cn(
                  "flex gap-2",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                    {chat.sender.img ? (
                      <img
                        src={chat.sender.img || "/placeholder.svg"}
                        alt={chat.sender.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-medium text-white">
                        {chat.sender.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col max-w-[75%]">
                  {!isCurrentUser && (
                    <span className="text-xs text-gray-400 mb-1">
                      {chat.sender.name} [{" "}
                      {
                        ROLE_MEETING.find(
                          (role) => role.id === chat.sender.meetingRole
                        )?.name
                      }
                      ]
                    </span>
                  )}

                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isCurrentUser
                        ? "bg-blue-600 text-white rounded-tr-none ml-auto"
                        : "bg-gray-200 text-gray-800 rounded-tl-none"
                    )}
                  >
                    {chat.message && (
                      <p className="break-words">{chat.message}</p>
                    )}
                    {chat.file && chat.type === "image" && (
                      <div className="flex items-center gap-2 mt-2">
                        <img
                          src={URL.createObjectURL(chat.file)}
                          alt={chat.fileName}
                          className="h-32 w-32 object-cover"
                        />
                      </div>
                    )}

                    <div className="text-xs mt-1 opacity-70 text-right text-white">
                      {formatTime(chat.timestamp)}
                    </div>
                  </div>
                </div>

                {isCurrentUser && (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-blue-700">
                    {chat.sender.img ? (
                      <img
                        src={chat.sender.img || "/placeholder.svg"}
                        alt={chat.sender.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-medium text-white">
                        {chat.sender.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* preview file if exits */}
      {file && (
        <div className="flex items-center gap-2 p-2 bg-gray-800 border-t border-gray-700 text-white">
          <span>{getFileIcon(file.type)}</span>
          <span className="text-sm truncate max-w-[150px]">{file.name}</span>
        </div>
      )}

      {/* Input area - matching the exact style from the screenshot */}
      <div className="p-2 mt-auto border-t border-gray-300">
        <div className="flex items-center gap-2  text-gray-900 rounded-full bg-gray-50 px-4 py-2">
          <input
            type="file"
            className="hidden"
            id="file-input"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0]);
              }
            }}
          />

          <label
            htmlFor="file-input"
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <Paperclip className="h-5 w-5" />
          </label>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aa..."
            className="flex-1 bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />

          <button
            onClick={handleSend}
            disabled={message.trim() === "" && !file}
            className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <SendHorizontal className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
const FileMeetingTab = ({ meetingCode }: { meetingCode: string }) => {
  const { socket } = useSocket();
  const { hasPermission } = useAuth();
  const [docx, setDocx] = useState<{
    name: string;
    data: string;
  } | null>(null);
  const [pdf, setPdf] = useState<{
    name: string;
    data: string;
  } | null>(null);
  const [files, setFiles] = useState<ChatType[]>([]);
  useEffect(() => {
    const initialFile = async () => {
      // Initialize file component here
      const response = await exportFileWords(meetingCode);
      if (response.code !== 200) {
        console.error("Error fetching file");
        return;
      }
      //base64 decode
      const fileName = response.result.fileName;
      const fileData =
        "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64," +
        response.result.fileContent;
      console.log("fileData", fileData);
      setDocx({ name: fileName, data: fileData });
    };
    const fetchFilePDF = async () => {
      const response = await exportFilePDF(meetingCode);
      if (response.code !== 200) {
        console.error("Error fetching file");
        return;
      }
      //base64 decode
      const fileName = response.result.fileName;
      const fileData =
        "data:application/pdf;base64," + response.result.fileContent;

      setPdf({ name: fileName, data: fileData });
    };
    initialFile();
    fetchFilePDF();
  }, [meetingCode]);
  useEffect(() => {
    if (socket && socket.connected) {
      socket.subscribe(
        `/topic/room/${meetingCode}/signal`,
        (message: IMessage) => {
          const signal: SignalMessage = JSON.parse(message.body);
          if (signal.type === "chat") {
            if (signal.payload.type !== "file") return;
            const file: ChatType = {
              id: Date.now(),
              sender: signal.member,
              receiver: signal.to,
              message: signal.payload.message,
              type: signal.payload.type,
              timestamp: signal.payload.timestamp,
            };
            setFiles((prev) => (prev ? [...prev, file] : [file]));
          }
        }
      );
    }
  }, [meetingCode, socket]);
  return (
    <div>
      <h2 className="text-base">Tài liệu cuộc họp</h2>
      <div className="flex items-start gap-2 flex-col">
        {docx && hasPermission("ROLE_SECRETARY") && (
          <>
            <button
              onClick={() => {
                if (docx) {
                  const a = document.createElement("a");
                  a.href = docx.data;
                  a.download = docx.name;
                  a.click();
                }
              }}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 border border-gray-600 px-4 py-2 rounded"
            >
              <FileText className="h-4 w-4 text-blue-500" />
              {docx.name}
            </button>
          </>
        )}
        {pdf && hasPermission("ROLE_SECRETARY") && (
          <>
            <button
              onClick={() => {
                if (pdf) {
                  const a = document.createElement("a");
                  a.href = pdf.data;
                  a.download = pdf.name;
                  a.click();
                }
              }}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 border border-red-400  px-4 py-2 rounded"
            >
              <FileText className="h-4 w-4 text-red-400" />
              {pdf.name}
            </button>
          </>
        )}
      </div>
      <h2 className="text-base mt-4">Tài liệu đã gửi</h2>
      <div className="flex flex-col space-y-4">
        {files.map((file) => (
          <div key={file.id} className="flex items-center space-x-4">
            <img
              src={file.sender.img}
              alt={file.sender.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex flex-col">
              <span className="font-bold">{file.sender.name}</span>
              <span>{file.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
