"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Client } from "@stomp/stompjs";
import { UserType } from "../interface/auth";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import SockJS from "sockjs-client";

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
  type: "offer" | "answer" | "ice-candidate" | "user-joined" | "meeting-users";
  from: string;
  to: string;
  member: UserType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export default function Meeting({
  meetingCode,
  user,
  isCameraEnable,
}: VideoRoomProps) {
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
        if (peer.connection) {
          peer.connection.close();
        }
      });
    };
  }, []);

  //Ham ket noi toi server
  const connectToSignalingServer = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },

      reconnectDelay: 5000,
    });
    client.onConnect = () => {
      setIsConnected(true);
      console.log("Connected to signaling server.");
      //subscribe toi phong hoi thoai
      client.subscribe(`/topic/room/${meetingCode}`, (message) => {
        const data = JSON.parse(message.body) as SignalMessage;
        handleSignalingData(data);
      });
      //lay danh sach nguoi dung trong phong
      client.subscribe(`/topic/room/${meetingCode}/users`, (message) => {
        const data = JSON.parse(message.body) as SignalMessage;
        handleSignalingData(data);
      });

      // Request existing users in the room
      client.publish({
        destination: `/app/participants`,
        body: JSON.stringify({
          peerId: localPeerId.current,
          meetingCode: meetingCode,
        }),
      });
      //gui thong bao nguoi dung tham gia phong
      client.publish({
        destination: `/app/join`,
        body: JSON.stringify({
          peerId: localPeerId.current,
          meetingCode: meetingCode,
        }),
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    };

    client.onStompError = (error) => {
      console.error("client error:", error);
      setIsConnected(false);
    };

    client.activate();
    stompClientRef.current = client;
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
        if (message.member.employeeCode === user.employeeCode) return;
        // New user joined - initiate connection
        console.log(`New user joined: ${message.member.employeeCode}`);
        initiateCall(message.from, message.member);
        break;
      case "meeting-users":
        // console.log("Meeting users:", message);
        break;

      default:
        console.log("unlnown message type", message);
    }
  };

  //Tao ket noi ngang hang
  const createPeerConnection = (
    peerId: string,
    user: UserType
  ): RTCPeerConnection => {
    console.log(`Creating peer connection to ${peerId}`);
    console.log("Current peers in createPeerConnection: ", peersRef.current);
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    // lang nghe su kien ICE candidate
    peerConnection.onicecandidate = (event) => {
      console.log("ICE candidate created");
      if (event.candidate) {
        sendSignalingMessage({
          type: "ice-candidate",
          from: localPeerId.current,
          to: peerId,
          member: user,
          payload: event.candidate,
        });
      }
    };

    //lang nghe su kien nhan stream tu nguoi dung khac
    peerConnection.ontrack = (event) => {
      console.log("Received remote stream from:", peerId);
      updatePeers((prevPeers) => {
        const updatedPeers = new Map(prevPeers);
        const peer = updatedPeers.get(peerId);
        if (peer) {
          peer.stream = event.streams[0];
          return updatedPeers;
        }
        return prevPeers;
      });
    };

    return peerConnection;
  };

  const handleOffer = async (message: SignalMessage) => {
    const { from, member, payload } = message;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Set the remote description (the offer)
    const peerConnection = createPeerConnection(from, member);
    if (peerConnection.signalingState !== "stable") {
      console.warn(
        "PeerConnection is not in a stable state. Skipping setRemoteDescription."
      );
      return;
    }

    if (!peerConnection.remoteDescription) {
      await peerConnection.setRemoteDescription(payload);
    }
    // Create an answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

    const newPeer: Peer = {
      id: from,
      user: member,
      connection: peerConnection,
    };

    updatePeers((prevPeers) => {
      const updatedPeers = new Map(prevPeers);
      updatedPeers.set(from, newPeer);
      return updatedPeers;
    });

    // Send the answer back
    sendSignalingMessage({
      type: "answer",
      from: localPeerId.current,
      to: from,
      member: user,
      payload: answer,
    });
  };

  const handleAnswer = async (message: SignalMessage) => {
    const { from, payload } = message;

    const peer = peersRef.current.get(from);

    if (peer && peer.connection) {
      if (peer.connection.signalingState !== "have-local-offer") {
        console.warn(
          "PeerConnection is not in a state to receive an answer. Skipping setRemoteDescription."
        );
        return;
      }
      if (peer.connection.remoteDescription) {
        console.warn(
          "PeerConnection already has a remote description. Skipping setRemoteDescription."
        );
        return;
      }
      console.log("Setting remote description for answer");
      await peer.connection.setRemoteDescription(
        new RTCSessionDescription(payload)
      );
      for (const track of localStream!.getTracks()) {
        peer.connection.addTrack(track, localStream!);
      }
    }
  };

  const handleIceCandidate = (message: SignalMessage) => {
    const { from, payload } = message;
    const peer = peersRef.current.get(from);

    if (peer && peer.connection) {
      peer.connection
        .addIceCandidate(new RTCIceCandidate(payload))
        .catch((err) => console.error("Error adding ICE candidate:", err));
    }
  };

  const sendSignalingMessage = (message: SignalMessage) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/signal/${meetingCode}`,
        body: JSON.stringify(message),
      });
    }
  };

  const initiateCall = async (peerId: string, member: UserType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    // Create a peer connection
    const peerConnection = createPeerConnection(peerId, member);

    // Create an offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const newPeer: Peer = {
      id: peerId,
      user: member,
      connection: peerConnection,
    };

    updatePeers((prevPeers) => {
      const updatedPeers = new Map(prevPeers);
      updatedPeers.set(peerId, newPeer);
      return updatedPeers;
    });

    // Send the offer
    sendSignalingMessage({
      type: "offer",
      from: localPeerId.current,
      to: peerId,
      member: user,
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
