import React, { useState, useEffect, useRef } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaDesktop,
  FaPhone,
  FaUserFriends,
} from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { UserType } from "../interface/auth";

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
    | "meeting-users"
    | "user-left";
  from: string;
  to: string;
  member: UserType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

interface JoinRequest {
  meetingCode: string;
  peerId: string;
}

const VideoRoom: React.FC<VideoRoomProps> = ({
  meetingCode,
  user,
  isCameraEnable,
}) => {
  const [me, setMe] = useState<UserType & { peerId: string }>({
    ...user,
    peerId: uuidv4(),
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [screenShare, setScreenShare] = useState(false);
  const [muted, setMuted] = useState(!isCameraEnable);
  const [videoOff, setVideoOff] = useState(!isCameraEnable);
  const [participants, setParticipants] = useState<
    (UserType & { peerId: string })[]
  >([]);
  const participantRef = useRef<(UserType & { peerId: string })[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const myVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const screenStream = useRef<MediaStream | null>(null);
  const stompClient = useRef<Client | null>(null);

  // Khởi tạo media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: isCameraEnable,
          audio: true,
        });
        setStream(mediaStream);
        if (myVideo.current) {
          myVideo.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError(
          "Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền."
        );
      }
    };

    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream.current) {
        screenStream.current.getTracks().forEach((track) => track.stop());
      }
      disconnect();
    };
  }, [isCameraEnable]);

  useEffect(() => {
    if (stream && Object.keys(peersRef.current).length > 0) {
      console.log("Stream updated, re-adding tracks to existing peers");
      Object.entries(peersRef.current).forEach(([peerId, peer]) => {
        // Xóa các track cũ
        peer.getSenders().forEach((sender) => peer.removeTrack(sender));

        // Thêm track mới
        if (stream) {
          stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
            console.log(`Re-added ${track.kind} track to peer ${peerId}`);
          });
        }
      });
    }
  }, [stream]);

  const initWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient.current = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      debug: (str) => {
        console.log(str);
      },
      onConnect: () => {
        console.log("Connected to WebSocket");
        subscribeToTopics();
        joinMeeting();
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers.message);
        setError("Lỗi kết nối: " + frame.headers.message);
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
      },
    });

    stompClient.current.activate();
  };

  const subscribeToTopics = () => {
    stompClient.current?.subscribe(
      `/topic/room/${meetingCode}`,
      (message: IMessage) => {
        const signal: SignalMessage = JSON.parse(message.body);
        handleSignal(signal);
      }
    );

    stompClient.current?.subscribe(
      `/topic/room/${meetingCode}/signal`,
      (message: IMessage) => {
        const signal: SignalMessage = JSON.parse(message.body);
        handleWebRTCSignal(signal);
      }
    );

    // Trong subscribeToTopics
    stompClient.current?.subscribe(
      `/user/queue/room/${meetingCode}/users`,
      (message: IMessage) => {
        const signal: SignalMessage = JSON.parse(message.body);
        if (signal.type === "meeting-users") {
          // Lọc ra những người thực sự mới (chưa có trong danh sách hiện tại)
          const currentPeerIds = Object.keys(peersRef.current);
          const newParticipants = signal.payload.members.filter(
            (m: SignalMessage) =>
              m.from !== me.peerId && !currentPeerIds.includes(m.from)
          );

          if (newParticipants.length > 0) {
            updateParticipantsList(newParticipants);
          }
        }
      }
    );

    stompClient.current?.subscribe(
      `/user/queue/errors`,
      (message: IMessage) => {
        const error = JSON.parse(message.body);
        setError(error.message);
      }
    );
  };

  const handleSignal = (signal: SignalMessage) => {
    switch (signal.type) {
      case "user-joined":
        console.log("User joined:", signal.from);
        handleUserJoined(signal);
        break;
      case "user-left":
        console.log("User left:", signal.from);
        handleUserLeft(signal);
        break;
      default:
        console.log("Unhandled signal type:", signal.type);
    }
  };

  const handleUserJoined = (signal: SignalMessage) => {
    if (signal.from === me.peerId) {
      console.log("Ignoring self join signal");
      return;
    }

    console.log(`New user joined: ${signal.from} (${signal.member.name})`);

    // Thêm vào danh sách participants
    setParticipants((prev) => {
      const existing = prev.find((p) => p.peerId === signal.from);
      if (!existing) {
        return [...prev, { ...signal.member, peerId: signal.from }];
      }
      return prev;
    });
    participantRef.current = [
      ...participantRef.current,
      { peerId: signal.from, ...signal.member },
    ];

    // Tạo peer connection với người mới (isInitiator = true)
    if (!peersRef.current[signal.from]) {
      console.log(`Creating peer connection for new user ${signal.from}`);
      createPeerConnection(signal.from, false);
    } else {
      console.log(`Peer connection already exists for ${signal.from}`);
    }
  };

  const handleUserLeft = (signal: SignalMessage) => {
    const peerId = signal.from;
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].close();
      delete peersRef.current[peerId];
    }

    setPeers((prev) => {
      const newPeers = { ...prev };
      delete newPeers[peerId];
      return newPeers;
    });

    setParticipants((prev) => prev.filter((p) => p.peerId !== peerId));
  };

  const handleWebRTCSignal = (signal: SignalMessage) => {
    if (signal.to !== me.peerId) return;

    const peer = peersRef.current[signal.from];
    if (!peer) return;

    switch (signal.type) {
      case "offer":
        console.log("Received offer from:", signal.from);
        handleOffer(signal);
        break;
      case "answer":
        console.log("Received answer from:", signal.from);
        handleAnswer(signal);
        break;
      case "ice-candidate":
        console.log("Received ICE candidate from:", signal.from);
        handleIceCandidate(signal, peer);
        break;

      default:
        console.warn("Unknown signal type:", signal.type);
    }
  };

  const handleOffer = async (signal: SignalMessage) => {
    const peerId = signal.from;
    let peer = peersRef.current[peerId];

    if (!peer || peer.signalingState === "closed") {
      peer = createPeerConnection(peerId, false); // Người nhận offer là receiver
    }

    try {
      await peer.setRemoteDescription(
        new RTCSessionDescription(signal.payload)
      );

      // QUAN TRỌNG: Đảm bảo thêm track trước khi tạo answer
      if (stream) {
        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });
      }

      const answer = await peer.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(answer);

      sendSignal({
        type: "answer",
        from: me.peerId,
        to: peerId,
        member: me,
        payload: answer,
      });
    } catch (err) {
      console.error(`Error handling offer from ${peerId}:`, err);
    }
  };

  const handleAnswer = async (signal: SignalMessage) => {
    const peerId = signal.from;
    const peer = peersRef.current[peerId];
    console.log("Received answer from:", peerId + signal.member.name);

    if (!peer) {
      console.error(`No peer found for ${peerId}`);
      return;
    }

    try {
      await peer.setRemoteDescription(
        new RTCSessionDescription(signal.payload)
      );
      console.log(`Successfully set remote answer from ${peerId}`);
    } catch (err) {
      console.error(`Error handling answer from ${peerId}:`, err);
    }
  };
  const handleIceCandidate = async (
    signal: SignalMessage,
    peer: RTCPeerConnection
  ) => {
    try {
      console.log("Received ICE candidate from:", signal.from);
      if (signal.payload) {
        await peer.addIceCandidate(new RTCIceCandidate(signal.payload));
      }
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  };

  const updateParticipantsList = (signals: SignalMessage[]) => {
    const newParticipants = signals
      .map((s) => ({ ...s.member, peerId: s.from }))
      .filter((p) => p.peerId !== me.peerId);

    setParticipants(newParticipants);
    participantRef.current = newParticipants;

    // Người đang trong phòng sẽ tạo peer connection và gửi offer cho người mới
    newParticipants.forEach((participant) => {
      if (!peersRef.current[participant.peerId]) {
        console.log(
          `Creating initiator peer for new participant ${participant.peerId}`
        );
        createPeerConnection(participant.peerId, true); // Người cũ là initiator
      }
    });
  };
  const createPeerConnection = (peerId: string, isInitiator: boolean) => {
    console.log(
      `Created ${isInitiator ? "initiator" : "receiver"} peer for ${peerId}`
    );
    // Đóng kết nối cũ nếu tồn tại
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].close();
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
    });

    // QUAN TRỌNG: Luôn thêm track nếu có stream
    if (stream) {
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
        console.log(`Added ${track.kind} track to peer ${peerId}`);
      });
    }

    // Xử lý ICE candidate
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ice-candidate",
          from: me.peerId,
          to: peerId,
          member: me,
          payload: event.candidate,
        });
      }
    };

    // Xử lý remote stream
    peer.ontrack = (event) => {
      console.log(`Received remote stream from ${peerId}`, event.streams);
      if (event.streams && event.streams.length > 0) {
        setPeers((prev) => ({
          ...prev,
          [peerId]: {
            id: peerId,
            user: participantRef.current.find(
              (p) => p.peerId === peerId
            ) as UserType,
            connection: peer,
            stream: event.streams[0],
          },
        }));
      }
    };

    // Chỉ initiator mới tạo offer ngay lập tức
    if (isInitiator) {
      peer.onnegotiationneeded = async () => {
        try {
          console.log("Negotiation needed from", me.name);
          const offer = await peer.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await peer.setLocalDescription(offer);

          sendSignal({
            type: "offer",
            from: me.peerId,
            to: peerId,
            member: me,
            payload: offer,
          });
        } catch (err) {
          console.error(`Error creating offer for ${peerId}:`, err);
        }
      };
    }

    peersRef.current[peerId] = peer;
    return peer;
  };
  const sendSignal = (signal: SignalMessage) => {
    console.log("Sending signal:", signal);
    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: `/app/signal/${meetingCode}`,
        body: JSON.stringify(signal),
      });
    }
  };

  const joinMeeting = () => {
    const joinRequest: JoinRequest = {
      meetingCode: meetingCode,
      peerId: me.peerId,
    };

    // Gửi yêu cầu tham gia phòng
    stompClient.current?.publish({
      destination: "/app/join",
      body: JSON.stringify(joinRequest),
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    // Yêu cầu danh sách người tham gia hiện tại
    stompClient.current?.publish({
      destination: "/app/participants",
      body: JSON.stringify(joinRequest),
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  };

  const connectToMeeting = async () => {
    setLoading(true);
    setError("");

    if (!me.id || !me.name) {
      setError("Thông tin người dùng không đầy đủ");
      setLoading(false);
      return;
    }

    initWebSocket();
    setLoading(false);
  };

  const disconnect = () => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }
    setPeers({});
    peersRef.current = {};
    setParticipants([]);
  };

  const leaveMeeting = () => {
    // Gửi thông báo rời phòng
    sendSignal({
      type: "user-left",
      from: me.peerId,
      to: "all",
      member: me,
      payload: null,
    });

    // Đóng tất cả kết nối
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};
    setPeers({});

    // Dừng tất cả stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
    }

    // Ngắt kết nối WebSocket
    if (stompClient.current) {
      stompClient.current.deactivate();
    }
  };

  const toggleScreenShare = async () => {
    if (screenShare) {
      screenStream.current?.getTracks().forEach((track) => track.stop());
      setScreenShare(false);

      // Quay lại stream camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: isCameraEnable,
        audio: true,
      });
      setStream(newStream);
      if (myVideo.current) {
        myVideo.current.srcObject = newStream;
      }

      // Cập nhật stream cho các peer
      Object.values(peersRef.current).forEach((peer) => {
        const senders = peer.getSenders();
        if (stream) {
          senders.forEach((sender) => {
            if (sender.track?.kind === "video") {
              sender.replaceTrack(stream.getVideoTracks()[0]);
            }
          });
        }
      });
    } else {
      try {
        const screenStreamVal = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStream.current = screenStreamVal;
        setScreenShare(true);
        if (myVideo.current) {
          myVideo.current.srcObject = screenStreamVal;
        }

        // Cập nhật stream cho các peer
        Object.values(peersRef.current).forEach((peer) => {
          const senders = peer.getSenders();
          senders.forEach((sender) => {
            if (sender.track?.kind === "video") {
              sender.replaceTrack(screenStreamVal.getVideoTracks()[0]);
            }
          });
        });

        // Xử lý khi người dùng dừng chia sẻ màn hình từ trình duyệt
        screenStreamVal.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
        setError("Không thể chia sẻ màn hình. Vui lòng thử lại.");
      }
    }
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Tự động tham gia khi component mount
  useEffect(() => {
    connectToMeeting();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">Phòng họp: {meetingCode}</h2>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
              {participants.length + 1} người tham gia
            </span>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Video của mình */}
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              className="w-full h-auto"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 flex justify-between items-center">
              <span>{me.name} (Bạn)</span>
              <div className="flex gap-1">
                {muted && <FaMicrophoneSlash className="text-red-400" />}
                {videoOff && <FaVideoSlash className="text-red-400" />}
                {screenShare && <FaDesktop className="text-blue-400" />}
              </div>
            </div>
          </div>

          {/* Video của người tham gia */}
          {Object.values(peers).map((peer) => (
            <div
              key={peer.id}
              className="relative rounded-lg overflow-hidden bg-black"
            >
              <video
                playsInline
                ref={(video) => {
                  if (video && peer.stream) {
                    video.srcObject = peer.stream;
                  }
                }}
                autoPlay
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                {peer.user.name}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-center gap-3">
          <button
            onClick={toggleMute}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              muted ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
            } hover:bg-gray-300`}
          >
            {muted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            {muted ? "Bật mic" : "Tắt mic"}
          </button>

          <button
            onClick={toggleVideo}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              videoOff ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
            } hover:bg-gray-300`}
          >
            {videoOff ? <FaVideoSlash /> : <FaVideo />}
            {videoOff ? "Bật camera" : "Tắt camera"}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              screenShare
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-200 text-gray-700"
            } hover:bg-gray-300`}
          >
            <FaDesktop />
            {screenShare ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
          </button>

          <button
            onClick={leaveMeeting}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            <FaPhone /> Rời phòng
          </button>
        </div>

        {/* Danh sách người tham gia */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <FaUserFriends />
            <h3 className="font-medium">
              Danh sách người tham gia ({participants.length + 1})
            </h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-3 p-2 border-b border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                {me.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{me.name}</p>
                <p className="text-sm text-gray-500">Bạn</p>
              </div>
            </div>

            {participants.map((participant) => (
              <div
                key={participant.peerId}
                className="flex items-center gap-3 p-2 border-b border-gray-200 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                  {participant.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{participant.name}</p>
                  <p className="text-sm text-gray-500">{participant.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Đang kết nối...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRoom;
