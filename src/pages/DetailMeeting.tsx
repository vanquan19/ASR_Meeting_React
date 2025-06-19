import type React from "react";

import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import type { MeetingType } from "../interface/meeting";
import {
  getAllMeeting,
  getAllMeetingForUser,
  getAllMemberInMeeting,
} from "../services/meetingService";
import { useSocket } from "../context/SocketContext";
import type { ChatType } from "../interface/chat";
import VideoRoom, { type SignalMessage } from "./Room";
import type { IMessage } from "@stomp/stompjs";
import type { MemberType } from "../interface/member";
import type { UserType } from "../interface/auth";
import {
  DotIcon,
  FileText,
  MessageCircleMore,
  SendHorizontal,
  Users,
  X,
  Menu,
  Download,
  FileAudio,
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
import DocxViewer from "../components/doc-view";
import DocxEditor from "../components/doc-editor";
import { getChatToMeeting, saveChat } from "../services/chatService";
import { handleDownload } from "../utils/download";
import { useNavigate } from "react-router-dom";
import { mergeAudio } from "../services/audioService";

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
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState(tabParam || tabs[0].name);
  const [meeting, setMeeting] = useState<MeetingType>();
  const [members, setMembers] = useState<MemberType[]>([]);
  const [showMember, setShowMember] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      let response = hasPermission("ROLE_SECRETARY")
        ? await getAllMeeting()
        : await getAllMeetingForUser(user?.id + "" || "");
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

  const navigate = useNavigate();
  const handleTabChange = (selectedTab: string) => {
    setTab(selectedTab);
    navigate(
      `/meeting-room/detail?meeting=${meetingCode}${
        selectedTab ? `&tab=${selectedTab}` : ""
      }`
    );
    // Close mobile menu when changing tabs on mobile
    setMobileMenuOpen(false);
  };

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close member panel on mobile when changing tabs
  useEffect(() => {
    if (window.innerWidth < 768) {
      setShowMember(false);
    }
  }, [tab]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <button
            className="md:hidden mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold truncate max-w-[200px] md:max-w-full">
            {meeting?.name}
          </h1>
        </div>

        {/* Desktop controls */}
        <div className="hidden md:flex gap-2">
          <div className="flex space-x-4">
            {tab === "chat" && (
              <button
                onClick={() => handleTabChange("files")}
                className="px-4 py-2 rounded transition-all duration-150 bg-gray-200 md:cursor-pointer"
                aria-label="Switch to files tab"
              >
                <FileText className="h-5 w-5" />
              </button>
            )}
            {tab === "files" && (
              <button
                onClick={() => handleTabChange("chat")}
                className="px-4 py-2 rounded transition-all duration-150 bg-gray-200 md:cursor-pointer"
                aria-label="Switch to chat tab"
              >
                <MessageCircleMore className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowMember(!showMember)}
            className={`px-4 py-2 rounded transition-all duration-150 md:cursor-pointer ${
              showMember ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            aria-label={showMember ? "Hide members" : "Show members"}
          >
            <Users className="h-5 w-5" />
          </button>
          {meeting?.status &&
            status[meeting.status as keyof typeof status](
              meeting,
              meeting.status === "ONGOING"
                ? () => {
                    setShowRoom(true);
                  }
                : undefined
            )}
        </div>

        {/* Mobile status button - always visible */}
        <div className="md:hidden">
          {meeting?.status &&
            meeting.status === "ONGOING" &&
            status[meeting.status as keyof typeof status](meeting, () => {
              setShowRoom(true);
              setMobileMenuOpen(false);
            })}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => handleTabChange("chat")}
              className={`px-4 py-2 rounded transition-all duration-150 ${
                tab === "chat" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              <MessageCircleMore className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleTabChange("files")}
              className={`px-4 py-2 rounded transition-all duration-150 ${
                tab === "files" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              <FileText className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => {
              setShowMember(!showMember);
              setMobileMenuOpen(false);
            }}
            className={`px-4 py-2 rounded transition-all duration-150 ${
              showMember ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            <Users className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div
          className={`flex-grow ${
            showMember ? "hidden md:block md:flex-grow-0 md:w-3/5" : "w-full"
          } overflow-hidden`}
        >
          <div className="h-full overflow-y-auto no-scrollbar mt-4">
            {tab === "chat" && meetingCode && (
              <ChatMeetingTab meetingCode={meetingCode} me={me} />
            )}
            {tab === "files" && meetingCode && (
              <FileMeetingTab
                meetingCode={meetingCode}
                meetingName={meeting?.name || ""}
              />
            )}
          </div>
        </div>

        {/* Members panel - full screen on mobile when active */}
        {showMember && (
          <div className="fixed inset-0 z-10 md:static md:z-0 bg-white md:w-2/5 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden pt-[80px] md:pt-0">
              <h2 className="text-lg font-bold">Thành viên</h2>
              <button
                onClick={() => setShowMember(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto no-scrollbar flex-1">
              <h2 className="text-lg font-bold text-center md:mb-4 hidden md:block">
                Thành viên
              </h2>
              <ul className="space-y-2 md:mt-4">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="py-2 flex justify-between items-center border-b border-gray-100"
                  >
                    <div>
                      <h4 className="text-base md:text-lg font-semibold text-gray-800">
                        {member.user?.name}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-500">
                        {member.user?.employeeCode}
                      </p>
                    </div>
                    <div
                      className={`${
                        member.active ? "text-green-500" : "text-red-500"
                      } flex items-center`}
                    >
                      <DotIcon className="size-8 md:size-12" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Video Room */}
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  useEffect(() => {
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
              message: signal.payload.message,
              type: signal.payload.type,
              timestamp: signal.payload.timestamp,
            };
            // Save chat to database
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

            // Decrypt the message
            const decryptedText = decryptText(
              signal.payload.message,
              import.meta.env.VITE_AES_KEY
            );
            chat.message = decryptedText;
            setChats((prev) => (prev ? [...prev, chat] : [chat]));
          }
        }
      );
    }
  }, [meetingCode, socket]);

  useEffect(() => {
    const fetchChat = async () => {
      const response = await getChatToMeeting(meetingCode);
      if (response.code !== 200) {
        console.error("Error fetching chat messages");
        return;
      }
      const chats = response.result as unknown as ChatType[];
      setChats(
        chats.map((chat: ChatType) => {
          const decryptedText = decryptText(
            chat.message,
            import.meta.env.VITE_AES_KEY
          );
          return {
            ...chat,
            message: decryptedText,
          };
        })
      );
    };
    fetchChat();
  }, [meetingCode]);

  const handleSend = async () => {
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
        const SignalChat: SignalMessage = {
          type: "chat",
          from: me.employeeCode + "",
          to: meetingCode,
          member: me,
          payload: {
            type: type,
            message: messageToSend,
            timestamp: new Date().toISOString(),
          },
        };
        sendSignal(SignalChat, meetingCode);

        await saveChat({
          id: new Date().getTime(),
          sender: SignalChat.from,
          receiver: SignalChat.to,
          message: SignalChat.payload.message,
          type: SignalChat.payload.type,
          timestamp: SignalChat.payload.timestamp,
        } as ChatType).catch((error) => {
          console.error("Error saving chat:", error);
        });
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
    <div className="flex flex-col h-full w-full bg-gray-100 rounded md:pb-0 pb-20">
      {/* Messages area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar min-h-[60vh] md:min-h-[70vh] "
      >
        <div className="p-2 md:p-4 space-y-3 md:space-y-4 ">
          {chats.map((chat, index) => {
            const isCurrentUser =
              typeof chat.sender !== "string" &&
              chat.sender.employeeCode === me.employeeCode;

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
                    {typeof chat.sender !== "string" && chat.sender.img ? (
                      <img
                        src={chat.sender.img || "/placeholder.svg"}
                        alt={chat.sender.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-medium text-white">
                        {typeof chat.sender !== "string"
                          ? chat.sender.name.substring(0, 2).toUpperCase()
                          : chat.sender.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col max-w-[70%] md:max-w-[75%]">
                  {!isCurrentUser && (
                    <span className="text-xs text-gray-400 mb-1">
                      {typeof chat.sender !== "string"
                        ? chat.sender.name
                        : chat.sender}{" "}
                      [{" "}
                      {
                        ROLE_MEETING.find(
                          (role) =>
                            typeof chat.sender !== "string" &&
                            role.id === chat.sender.meetingRole
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
                      <p className="break-words text-sm md:text-base">
                        {chat.message}
                      </p>
                    )}
                    {chat.file && chat.type === "image" && (
                      <div className="flex items-center gap-2 mt-2">
                        <img
                          src={
                            URL.createObjectURL(chat.file) || "/placeholder.svg"
                          }
                          alt={chat.fileName}
                          className="h-24 w-24 md:h-32 md:w-32 object-cover rounded"
                        />
                      </div>
                    )}

                    <div className="text-xs mt-1 opacity-70 text-right">
                      {formatTime(chat.timestamp)}
                    </div>
                  </div>
                </div>

                {isCurrentUser && (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-blue-700">
                    {typeof chat.sender !== "string" && chat.sender.img ? (
                      <img
                        src={chat.sender.img || "/placeholder.svg"}
                        alt={chat.sender.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-medium text-white">
                        {typeof chat.sender !== "string"
                          ? chat.sender.name.substring(0, 2).toUpperCase()
                          : chat.sender.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* File preview */}
      {file && (
        <div className="flex items-center gap-2 p-2 bg-gray-800 border-t border-gray-700 text-white">
          <span>{getFileIcon(file.type)}</span>
          <span className="text-sm truncate max-w-[150px] md:max-w-[250px]">
            {file.name}
          </span>
          <button
            onClick={() => setFile(null)}
            className="ml-auto text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-2 mt-auto border-t border-gray-300">
        <div className="flex items-center gap-2 text-gray-900 rounded-full bg-gray-50 px-3 py-2">
          {/* <input
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
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <Paperclip className="h-5 w-5" />
          </label> */}

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aa..."
            className="flex-1 bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none text-sm md:text-base"
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

const FileMeetingTab = ({
  meetingCode,
  meetingName,
}: {
  meetingCode: string;
  meetingName: string;
}) => {
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
  const [showEdit, setShowEdit] = useState(false);

  const fetchDocuments = async () => {
    // Fetch docx file
    const docxResponse = await exportFileWords(meetingCode);
    if (docxResponse.code === 200) {
      const fileName = docxResponse.result.fileName;
      const fileData =
        "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64," +
        docxResponse.result.fileContent;
      setDocx({ name: fileName, data: fileData });
    } else {
      console.error("Error fetching docx file");
    }

    // Fetch PDF file
    const pdfResponse = await exportFilePDF(meetingCode);
    if (pdfResponse.code === 200) {
      const fileName = pdfResponse.result.fileName;
      const fileData =
        "data:application/pdf;base64," + pdfResponse.result.fileContent;
      setPdf({ name: fileName, data: fileData });
    } else {
      console.error("Error fetching PDF file");
    }
  };

  useEffect(() => {
    fetchDocuments();
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

  const handleDownloadAudio = async () => {
    if (!meetingCode) return;

    const response = await mergeAudio(meetingCode);
    const base64Data = response.audio_base64;

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Tạo Blob từ binary
    const audioBlob = new Blob([bytes], { type: "audio/ogg" });

    // Tạo link tải xuống
    const audioUrl = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${meetingName}.ogx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(audioUrl);
  };

  const handleSaveSuccess = () => {
    // Refresh documents after saving
    fetchDocuments();
  };

  return (
    <>
      {showEdit && docx && hasPermission("ROLE_SECRETARY") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 w-full h-full">
          <div className="bg-white rounded-lg w-screen h-screen flex flex-col">
            <DocxEditor
              base64Docx={docx.data.split(",")[1]}
              meetingCode={meetingCode}
              onClose={() => setShowEdit(false)}
              onSave={handleSaveSuccess}
            />
          </div>
        </div>
      )}
      <div className="md:pb-4 px-4 pb-24">
        <div
          className="flex items-start gap-2 flex-col docx-viewer"
          onDoubleClick={() => {
            if (hasPermission("ROLE_SECRETARY")) {
              setShowEdit(true);
            } else {
              const viewer = document.querySelector(".docx-viewer");
              if (viewer) {
                handleDownload(viewer.innerHTML, meetingName);
              }
            }
          }}
        >
          <div className="flex justify-between gap-2 w-full">
            <h2 className="text-base mt-4 uppercase font-bold py-3">
              BIÊN BẢN CUỘC HỌP {meetingName}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleDownloadAudio();
                }}
                className="md:cursor-pointer"
              >
                <FileAudio className="h-5 w-5 text-gray-500" />
              </button>
              <button
                onClick={() => {
                  const viewer = document.querySelector(".docx-viewer");
                  if (viewer) {
                    handleDownload(viewer.innerHTML, meetingName);
                  }
                }}
                className="md:cursor-pointer"
              >
                <Download className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
          {/* display docx in div */}
          {docx && <DocxViewer base64Docx={docx.data.split(",")[1]} />}
        </div>

        <h2 className="text-base mt-4 uppercase font-semibold py-3">
          Tài liệu
        </h2>

        <div className="flex flex-col space-y-4">
          {pdf && (
            <button
              onClick={() => {
                if (pdf) {
                  const a = document.createElement("a");
                  a.href = pdf.data;
                  a.download = pdf.name;
                  a.click();
                }
              }}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 border border-red-400 px-4 py-2 rounded w-full md:w-auto"
            >
              <FileText className="h-4 w-4 text-red-400" />
              <span className="truncate">{pdf.name} (Bản gốc)</span>
            </button>
          )}

          {}

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-4 p-2 border-b border-gray-100"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                {typeof file.sender !== "string" && file.sender.img ? (
                  <img
                    src={file.sender.img || "/placeholder.svg"}
                    alt={file.sender.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm font-medium text-white">
                    {typeof file.sender !== "string"
                      ? file.sender.name.substring(0, 2).toUpperCase()
                      : file.sender.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-sm truncate">
                  {typeof file.sender !== "string"
                    ? file.sender.name
                    : file.sender}
                </span>
                <span className="text-sm truncate">{file.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
