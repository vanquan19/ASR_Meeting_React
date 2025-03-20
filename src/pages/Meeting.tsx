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
import { useCallback, useEffect, useState } from "react";

import { useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { Message } from "@stomp/stompjs";
import peer from "../services/peerService";

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
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [mystream, setMystream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream[] | null>([]);
  const [participants, setParticipants] = useState<unknown[]>([]);

  const handleUserJoin = useCallback((data: Message) => {
    console.log("User Join =>", data);
    const dataBody = JSON.parse(data.body);
    const { users, id } = dataBody;
    console.log(users.name, " Join room");
    setRemoteSocketId(id);
  }, []);

  const handleUserCall = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const offer = await peer.getOffer();
    console.log("Offer =>", offer);
    socket.publish({
      destination: "/app/user-call",
      body: JSON.stringify({
        offer,
        to: remoteSocketId,
      }),
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setMystream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async (data: Message) => {
      console.log("Incoming call =>", data);
      const dataBody = JSON.parse(data.body);
      const { offer, from } = dataBody;
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMystream(stream);
      console.log("Incoming call =>", from, offer);
      const answer = await peer.getAnswer(offer);
      socket.publish({
        destination: "/app/user-accept-call",
        body: JSON.stringify({
          answer,
          to: from,
        }),
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    },
    [socket]
  );

  const sendStream = useCallback(() => {
    if (mystream) {
      for (const track of mystream.getTracks()) {
        peer.peer.addTrack(track, mystream);
      }
    }
  }, [mystream]);

  const handeAcceptCall = useCallback(
    (data: Message) => {
      console.log("Accept call =>", data);
      const dataBody = JSON.parse(data.body);
      const { answer, from } = dataBody;
      console.log("Accept call =>", from, answer);
      sendStream();
    },
    [sendStream]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.publish({
      destination: "/app/user-nego-needed",
      body: JSON.stringify({
        offer,
        to: remoteSocketId,
      }),
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async (data: Message) => {
      const dataBody = JSON.parse(data.body);
      const { offer, from } = dataBody;
      const answer = await peer.getAnswer(offer);
      socket.publish({
        destination: "/app/user-nego-done",
        body: JSON.stringify({
          answer,
          to: from,
        }),
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async (data: Message) => {
    const dataBody = JSON.parse(data.body);
    const { answer } = dataBody;
    await peer.setLocalDescription(answer);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", (event) => {
      const remoteStream = event.streams;
      console.log("Remote stream =>", remoteStream);
      setRemoteStream((prev) => [...(prev || []), remoteStream[0]]);
    });
  }, []);

  useEffect(() => {
    socket.subscribe("/app/user-join", handleUserJoin);
    handleUserCall();
    socket.subscribe("/user/incoming-call", handleIncomingCall);
    socket.subscribe("/user/accept-call", handeAcceptCall);
    socket.subscribe("/user/nego-needed", handleNegoNeedIncomming);
    socket.subscribe("/user/nego-final", handleNegoNeedFinal);

    return () => {
      socket.unsubscribe("/app/user-join");
      socket.unsubscribe("/user/incoming-call");
      socket.unsubscribe("/user/accept-call");
      socket.unsubscribe("/user/nego-needed");
      socket.unsubscribe("/user/nego-final");
    };
  }, [
    handeAcceptCall,
    handleIncomingCall,
    handleNegoNeedFinal,
    handleNegoNeedIncomming,
    handleUserCall,
    handleUserJoin,
    socket,
  ]);

  //participant join room
  useEffect(() => {
    setParticipants([
      {
        id: "user1",
        name: "uset1",
        isSpeaking: false,
        isMuted: micEnabled,
        isScreenSharing: false,
        avatar: "https://randomuser.me/api/portraits",
        isCameraOn: isTurnOnCamera,
        stream: mystream,
        isMyself: true,
      },
    ]);
  }, [mystream, remoteStream, micEnabled, isTurnOnCamera]);

  //signal to the server that the user has joined the room

  console.log("Meeting code:", meetingCode);

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
            mystream={mystream}
            remoteStream={remoteStream}
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
