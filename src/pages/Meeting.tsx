"use client";

import VideoGrid from "../components/video-grid";
import VideoControls from "../components/video-controls";
import ChatPanel from "../components/chat-panel";
import ParticipantsList from "../components/participants-list";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useMediaQuery } from "../hooks/use-media-query";
import { use, useCallback, useEffect, useState } from "react";

import { useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { Message } from "@stomp/stompjs";
import peer from "../services/peerService";
import { UserType } from "../interface/auth";

interface Participant {
  user: UserType;
  stream: MediaStream;
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  isScreenSharing: boolean;
}

export default function Meeting() {
  const meetingCode =
    new URLSearchParams(useLocation().search).get("meeting") || "";
  const cameraEnabled =
    !!new URLSearchParams(useLocation().search).get("isC") || false;
  const socket = useSocket();

  const [micEnabled, setMicEnabled] = useState(false);
  const [isTurnOnCamera, setIsTurnOnCamera] = useState<boolean>(cameraEnabled);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeSpeaker, setActiveSpeaker] = useState("user1");
  const [sidebarTab, setSidebarTab] = useState<"chat" | "participants">("chat");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [remoteSocketId, setRemoteSocketId] = useState<string[] | null>([]);
  const [mystream, setMystream] = useState<Participant | null>(null);
  const [remoteStream, setRemoteStream] = useState<Participant[] | null>([]);
  const [myProfile, setMyProfile] = useState<UserType | null>(null);

  const participants = [
    {
      id: "user1",
      name: "You",
      isSpeaking: false,
      isMuted: !micEnabled,
      isScreenSharing: false,
      avatar: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "user2",
      name: "John Doe",
      isSpeaking: true,
      isMuted: false,
      isScreenSharing: false,
      avatar: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "user3",
      name: "Jane Smith",
      isSpeaking: false,
      isMuted: true,
      isScreenSharing: isScreenSharing,
      avatar: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "user4",
      name: "Alex Johnson",
      isSpeaking: false,
      isMuted: false,
      isScreenSharing: false,
      avatar: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "user5",
      name: "Sarah Williams",
      isSpeaking: false,
      isMuted: true,
      isScreenSharing: false,
      avatar: "/placeholder.svg?height=100&width=100",
    },
  ];

  const handleUserCall = useCallback(
    async (user: UserType) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const offer = await peer.getOffer();
      console.log("Offer =>", offer);

      //gui offer toi nguoi danh sach nguoi dung tham gia
      socket.publish({
        destination: "/app/user-call",
        body: JSON.stringify({
          offer,
          meetingCode,
        }),
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      //set stream cho minh de hien thi video
      setMystream({
        user,
        stream,
        isCameraEnabled: isTurnOnCamera,
        isMicEnabled: false,
        isScreenSharing: false,
      });
      setMyProfile(user);
    },
    [isTurnOnCamera, meetingCode, socket]
  );

  //Nhan thong tin nguoi dung tham gia
  const handleUserJoin = useCallback(
    (data: Message) => {
      const dataBody = JSON.parse(data.body);
      console.log("User Join =>", dataBody);
      const { users, id } = dataBody;
      console.log(users.name, " Join room");
      //gan tat ca nguoi tham gia vao danh sach remote
      setRemoteSocketId((prev) => [...(prev || []), id]);
      handleUserCall(users);
    },
    [handleUserCall]
  );

  //xu ly offer tu nguoi gui den
  const handleIncomingCall = useCallback(
    async (data: Message) => {
      console.log("Incoming call =>", data);
      const dataBody = JSON.parse(data.body);
      const { offer, user, isM, isC, isS } = dataBody;
      //lay stream tu camera va mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      //them nguoi gui vao danh sach remote
      setRemoteStream((prev) => [
        ...(prev || []),
        {
          user,
          stream,
          isCameraEnabled: isC,
          isMicEnabled: isM,
          isScreenSharing: isS,
        },
      ]);

      setMystream({
        user: myProfile as UserType,
        stream,
        isCameraEnabled: isTurnOnCamera,
        isMicEnabled: micEnabled,
        isScreenSharing: isScreenSharing,
      });

      console.log("Incoming call =>", offer);
      const answer = await peer.getAnswer(offer);
      //nguoi nhan chap nhan cuoc goi va gui lai offer cho nguoi gui
      socket.publish({
        destination: "/app/user-accept-call",
        body: JSON.stringify({
          offer: answer,
          to: user.employeeCode,
        }),
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    },
    [socket]
  );

  //nguoi gui nhan lai offer tu nguoi nhan
  const handeAcceptCall = useCallback((data: Message) => {
    console.log("Accept call =>", data);
    const dataBody = JSON.parse(data.body);
    const { answer, user, isM, isC, isS } = dataBody;

    setRemoteStream((prev) => [
      ...(prev || []),
      {
        user: user as UserType,
        stream: answer,
        isCameraEnabled: isC,
        isMicEnabled: isM,
        isScreenSharing: isS,
      },
    ]);
  }, []);

  useEffect(() => {
    socket.subscribe("/topic/room/" + meetingCode, handleUserJoin);
    socket.subscribe("/user/incoming-call", handleIncomingCall);
    socket.subscribe("/user/accept-call", handeAcceptCall);

    return () => {
      socket.unsubscribe("/topic/room/" + meetingCode);
      socket.unsubscribe("/user/incoming-call");
      socket.unsubscribe("/user/accept-call");
    };
  }, [
    handeAcceptCall,
    handleIncomingCall,
    handleUserCall,
    handleUserJoin,
    meetingCode,
    socket,
  ]);

  // Simulate active speaker changes
  useEffect(() => {
    const interval = setInterval(() => {
      const speakerIds = ["user1", "user2", "user4"];
      const randomSpeaker =
        speakerIds[Math.floor(Math.random() * speakerIds.length)];
      setActiveSpeaker(randomSpeaker);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Toggle sidebar visibility on mobile
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
    }
  }, [isMobile]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Main content area */}
      <div
        className={`flex flex-col ${
          showSidebar && !isMobile ? "w-3/4" : "w-full"
        } h-full`}
      >
        {/* Video grid */}
        <div className="flex-1 overflow-hidden">
          <VideoGrid
            participants={participants}
            activeSpeaker={activeSpeaker}
            isScreenSharing={isScreenSharing}
          />
        </div>

        {/* Controls */}
        <VideoControls
          micEnabled={micEnabled}
          setMicEnabled={setMicEnabled}
          cameraEnabled={isTurnOnCamera}
          setCameraEnabled={setIsTurnOnCamera}
          isScreenSharing={isScreenSharing}
          setIsScreenSharing={setIsScreenSharing}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          setSidebarTab={setSidebarTab}
        />
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div
          className={`${
            isMobile ? "absolute right-0 top-0 bottom-0 z-10" : "relative"
          } w-full md:w-1/4 h-full border-l border-border bg-card`}
        >
          <Tabs
            defaultValue={sidebarTab}
            onValueChange={(value) =>
              setSidebarTab(value as "chat" | "participants")
            }
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <TabsList>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="participants">
                  Participants ({participants.length})
                </TabsTrigger>
              </TabsList>
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 rounded-full hover:bg-accent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-x"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>

            <TabsContent value="chat" className="h-[calc(100%-60px)]">
              <ChatPanel />
            </TabsContent>

            <TabsContent value="participants" className="h-[calc(100%-60px)]">
              <ParticipantsList participants={participants} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
