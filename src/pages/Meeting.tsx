"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Client } from "@stomp/stompjs";
import { UserType } from "../interface/auth";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

interface VideoRoomProps {
  meetingCode: string;
  user: UserType;
  isCameraEnable: boolean;
}

interface Peer {
  id: string;
  user: UserType;
  connection: RTCPeerConnection;
  stream?: MediaStream | null;
}

interface SignalMessage {
  type: "offer" | "answer" | "ice-candidate" | "user-joined" | "room-users";
  to: string;
  from: string;
  user: UserType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export default function Meeting({
  meetingCode,
  user,
  isCameraEnable,
}: VideoRoomProps) {
  const socket = useSocket();
  //Luu tru thong tin nguoi dung khac trong phong
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  //Luu tru thong tin nguoi dung hien tai
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
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
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        //ket noi toi server
        connectToSignalingServer();
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };
    initializeMedia();
    return () => {
      // Cleanup
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.deactivate();
      }

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      peers.forEach((peer) => {
        peer.connection.close();
      });
    };
  }, []);

  //Ham ket noi toi server
  const connectToSignalingServer = () => {
    socket.onConnect = () => {
      setIsConnected(true);
      console.log("Connected to signaling server.");
      //subscribe toi phong hoi thoai
      socket.subscribe(`/topic/room/${meetingCode}`, (message) => {
        const data = JSON.parse(message.body) as SignalMessage;
        console.log("Received message topic/room=/" + meetingCode, data);
        handleSignalingData(data);
      });

      //gui thong bao nguoi dung tham gia phong
      socket.publish({
        destination: `/app/room/${meetingCode}/join`,
        body: JSON.stringify({
          peerId: localPeerId.current,
        }),
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Request existing users in the room
      socket.publish({
        destination: `/app/room/${meetingCode}/users`,
        body: JSON.stringify({
          peerId: localPeerId.current,
        }),
      });
    };

    socket.onStompError = (error) => {
      console.error("Socket error:", error);
      setIsConnected(false);
    };

    socket.activate();
    stompClientRef.current = socket;
  };

  //Ham xu ly tin hieu
  const handleSignalingData = async (message: SignalMessage) => {
    if (message.from === localPeerId.current) {
      return;
    }
    switch (message.type) {
      case "offer":
        await handleOffer(message);
        break;
      case "answer":
        await handleAnswer(message);
        break;
      case "ice-candidate":
        handleIceCandidate(message);
        break;
      case "user-joined":
        // New user joined - initiate connection
        console.log(`New user joined: ${message.user.employeeCode}`);
        initiateCall(message.from, message.user);
        break;
      case "room-users": {
        // Received list of existing users in the room
        console.log("Received existing users in the room");
        const users = message.payload;
        users.forEach((user: { peerId: string; user: UserType }) => {
          if (user.peerId !== localPeerId.current) {
            console.log(
              `Initiating call to existing user: ${user.user.employeeCode}`
            );
            initiateCall(user.peerId, user.user);
          }
        });
        break;
      }
      default:
        console.log("unlnown message type", message);
    }
  };

  //Tao ket noi ngang hang
  const createPeerConnection = (
    peerId: string,
    user: UserType
  ): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "stun:stun1.l.google.com:19302",
        },
      ],
    });

    //them stream cua nguoi dung hien tai vao ket noi
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    //lang nghe su kien ICE candidate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({
          type: "ice-candidate",
          from: localPeerId.current,
          to: peerId,
          user: user,
          payload: event.candidate,
        });
      }
    };

    //lang nghe su kien nhan stream tu nguoi dung khac
    peerConnection.ontrack = (event) => {
      console.log("Received remote stream from:", peerId);
      setPeers((prevPeers) => {
        const updatedPeers = new Map(prevPeers);
        const peer = updatedPeers.get(peerId);
        if (peer) {
          updatedPeers.set(peerId, { ...peer, stream: event.streams[0] });
        }
        return updatedPeers;
      });
    };

    const newPeer: Peer = {
      id: peerId,
      user: user,
      connection: peerConnection,
    };

    setPeers((prevPeers) => {
      const updatedPeers = new Map(prevPeers);
      updatedPeers.set(peerId, newPeer);
      return updatedPeers;
    });
    return peerConnection;
  };

  const handleOffer = async (message: SignalMessage) => {
    const { from, user, payload } = message;

    // Create a peer connection if it doesn't exist
    let peerConnection = peers.get(from)?.connection;

    if (!peerConnection) {
      peerConnection = createPeerConnection(from, user);
    }

    // Set the remote description (the offer)
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(payload)
    );

    // Create an answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send the answer back
    sendSignalingMessage({
      type: "answer",
      from: localPeerId.current,
      to: from,
      user: user,
      payload: answer,
    });
  };

  const handleAnswer = async (message: SignalMessage) => {
    const { from, payload } = message;
    const peer = peers.get(from);

    if (peer && peer.connection) {
      await peer.connection.setRemoteDescription(
        new RTCSessionDescription(payload)
      );
    }
  };

  const handleIceCandidate = (message: SignalMessage) => {
    const { from, payload } = message;
    const peer = peers.get(from);

    if (peer && peer.connection) {
      peer.connection
        .addIceCandidate(new RTCIceCandidate(payload))
        .catch((err) => console.error("Error adding ICE candidate:", err));
    }
  };

  const sendSignalingMessage = (message: SignalMessage) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/room/${meetingCode}/signal`,
        body: JSON.stringify(message),
      });
    }
  };

  const initiateCall = async (peerId: string, user: UserType) => {
    // Create a peer connection
    const peerConnection = createPeerConnection(peerId, user);

    // Create an offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send the offer
    sendSignalingMessage({
      type: "offer",
      from: localPeerId.current,
      to: peerId,
      user: user,
      payload: offer,
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
      peer.connection.close();
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
        {Array.from(peers.values()).map((peer) => (
          <Card
            key={peer.id}
            className="relative overflow-hidden aspect-video bg-black"
          >
            {peer.stream ? (
              <RemoteVideo stream={peer.stream} />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                Connecting...
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
              {peer.user.name}
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
