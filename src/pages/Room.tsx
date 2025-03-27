"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Client } from "@stomp/stompjs";
import { UserType } from "../interface/auth";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import peer from "../services/peerService";

interface VideoRoomProps {
  meetingCode: string;
  user: UserType;
  isCameraEnable: boolean;
}

interface Peer {
  id: string;
  user: UserType;
  connection?: RTCPeerConnection;
  stream?: MediaStream | null;
}

interface SignalMessage {
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "nego-done"
    | "user-joined"
    | "meeting-users";
  from: string;
  to: string;
  member: UserType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export default function Room({
  meetingCode,
  user,
  isCameraEnable,
}: VideoRoomProps) {
  //Ket noi toi server
  const socket = useSocket();
  //Luu tru thong tin nguoi dung khac trong phong
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const peersRef = useRef<Map<string, Peer>>(new Map());

  const updatePeers = (
    updateFn: (prevPeers: Map<string, Peer>) => Map<string, Peer>
  ) => {
    const updatedPeers = updateFn(peersRef.current);
    peersRef.current = updatedPeers;
    setPeers(updatedPeers);
  };
  //Luu tru thong tin nguoi dung hien tai
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const updateLocalStream = (stream: MediaStream) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const [remoteStreams, setRemoteStreams] = useState<MediaStream[] | []>([]);
  //trang thai tat/bat mic/video nguoi dung hien tai
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(isCameraEnable);
  //trang thai ket noi toi server
  const [isConnected, setIsConnected] = useState(false);

  // tham chieu toi client Stomp de gui nhan tin hieu
  const stompClientRef = useRef<Client | null>(null);
  //tham chieu DOM toi video cua nguoi dung hien tai
  const localVideoRef = useRef<HTMLVideoElement>(null);
  //luu tru id duy nhat cho nguoi dung hien tai trong phong
  const localPeerId = useRef<string>(`${user.employeeCode}-${Date.now()}`);
  //khoi tao media va ket noi toi server

  useEffect(() => {
    socket.subscribe(`/topic/room/${meetingCode}`, (message) => {
      const signalMessage: SignalMessage = JSON.parse(message.body);
      handleSignalingData(signalMessage);
    });
    socket.subscribe(`/topic/room/${meetingCode}/users`, (message) => {
      const data = JSON.parse(message.body) as SignalMessage;
      handleSignalingData(data);
    });

    socket.subscribe(`/topic/room/${meetingCode}/signal`, (message) => {
      const data = JSON.parse(message.body) as SignalMessage;
      handleSignalingData(data);
    });

    return () => {
      socket.unsubscribe(`/topic/meeting/${meetingCode}`);
      socket.unsubscribe(`/topic/room/${meetingCode}/users`);
      socket.unsubscribe(`/topic/room/${meetingCode}/signal`);
    };
  }, [meetingCode, socket]);

  useEffect(() => {
    socket.publish({
      destination: `/app/participants`,
      body: JSON.stringify({
        peerId: localPeerId.current,
        meetingCode: meetingCode,
      }),
    });
    socket.publish({
      destination: `/app/join`,
      body: JSON.stringify({
        peerId: localPeerId.current,
        meetingCode: meetingCode,
      }),
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  }, [meetingCode, socket]);

  //Ham xu ly tin hieu
  const handleSignalingData = async (message: SignalMessage) => {
    if (message.from === localPeerId.current) {
      return;
    }
    switch (message.type) {
      case "offer":
        if (message.to !== localPeerId.current) return;
        console.log(`Received offer from ${message.from}`);
        handleIncomingCall(message);
        break;
      case "answer":
        if (message.to !== localPeerId.current) return;
        console.log(`Received answer from ${message.from}`);
        handleAcceptCall(message);
        break;
      case "ice-candidate":
        handleNegoNeedIncomming(message);
        break;
      case "nego-done":
        handleNegoNeedFinal(message);
        break;
      case "user-joined":
        if (message.member.employeeCode === user.employeeCode) return;
        // New user joined - initiate connection
        console.log(`New user joined: ${message.from}`);
        updatePeers((prevPeers) => {
          const updatedPeers = new Map(prevPeers);
          const peer = {
            id: message.from,
            user: message.member,
          };
          updatedPeers.set(message.from, peer);
          return updatedPeers;
        });

        handleCallToUser(message.from);

        break;
      case "meeting-users":
        // console.log("Meeting users:", message);
        break;

      default:
        console.log("unlnown message type", message);
    }
  };

  const handleCallToUser = useCallback(
    async (to: string) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      updateLocalStream(stream);

      const offer = await peer.getOffer();
      console.log("Offer created", peer);

      if (offer) {
        sendSignalingMessage({
          type: "offer",
          from: localPeerId.current,
          to: to,
          member: user,
          payload: offer,
        });
      }
    },
    [user]
  );

  const handleIncomingCall = useCallback(
    async (message: SignalMessage) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      const answer = await peer.getAnswer(message.payload);
      if (answer) {
        sendSignalingMessage({
          type: "answer",
          from: localPeerId.current,
          to: message.from,
          member: user,
          payload: answer,
        });
      }
    },
    [user]
  );

  const sendStreams = useCallback(() => {
    console.log("localStream", localStreamRef.current);
    if (!localStreamRef.current) return;
    console.log("Sending streams to peers");
    for (const track of localStreamRef.current.getTracks()) {
      peer.peer.addTrack(track, localStreamRef.current);
    }
  }, []);

  const handleAcceptCall = useCallback(
    async (message: SignalMessage) => {
      console.log("Accepting call from", message.from);
      peer.setLocalDescription(message.payload);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );
  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.publish({
      destination: `/app/signal/${meetingCode}`,
      body: JSON.stringify({
        type: "ice-candidate",
        from: localPeerId.current,
        to: "all",
        payload: offer,
      }),
    });
  }, [meetingCode, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async (message: SignalMessage) => {
      const ans = await peer.getAnswer(message.payload);
      if (ans) {
        sendSignalingMessage({
          type: "nego-done",
          from: localPeerId.current,
          to: message.from,
          member: user,
          payload: ans,
        });
      }
    },
    [user]
  );

  const handleNegoNeedFinal = useCallback(async (message: SignalMessage) => {
    await peer.setLocalDescription(message.payload);
  }, []);

  useEffect(() => {
    peer.peer.ontrack = async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStreams((prev) => [...prev, remoteStream[0]]);
    };
  }, []);

  const sendSignalingMessage = (message: SignalMessage) => {
    socket.publish({
      destination: `/app/signal/${meetingCode}`,
      body: JSON.stringify(message),
    });
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const leaveRoom = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    peers.forEach((peer) => {
      if (peer.connection) peer.connection.close();
    });

    // Disconnect from signaling server
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }

    // Redirect to join page
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Room: {meetingCode}</h2>
        <p className="text-muted-foreground">
          Connected as: {user.employeeCode}
        </p>
        {!isConnected && (
          <p className="text-red-500 mt-2">Connecting to signaling server...</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Local video */}
        <Card className="relative overflow-hidden aspect-video bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
            {user.name} (You)
          </div>
        </Card>

        {/* Remote videos */}
        {remoteStreams.map((peer, index) => (
          <Card
            key={index}
            className="relative overflow-hidden aspect-video bg-black"
          >
            {peer ? (
              <RemoteVideo stream={peer} />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                Connecting...
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
              {"test"}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-auto">
        <Button
          variant={audioEnabled ? "default" : "destructive"}
          size="icon"
          onClick={toggleAudio}
        >
          {audioEnabled ? <Mic /> : <MicOff />}
        </Button>
        <Button
          variant={videoEnabled ? "default" : "destructive"}
          size="icon"
          onClick={toggleVideo}
        >
          {videoEnabled ? <Video /> : <VideoOff />}
        </Button>
        <Button variant="destructive" size="icon" onClick={leaveRoom}>
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}

// Component to render remote video
function RemoteVideo({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
}
