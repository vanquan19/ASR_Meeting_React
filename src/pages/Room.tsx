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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const streamRef = useRef<MediaStream | null>(null); // Reference to store current stream

  // Khởi tạo media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: isCameraEnable,
          audio: true,
        });
        setStream(mediaStream);
        streamRef.current = mediaStream;

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
      console.log("Cleaning up video room component");

      // Gọi leaveMeeting để dọn dẹp đúng cách
      leaveMeeting();

      // Dọn dẹp thêm nếu cần
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (myVideo.current) {
        myVideo.current.srcObject = null;
      }
    };
  }, [isCameraEnable]);

  // Add stream tracks to existing peer connections when stream changes
  useEffect(() => {
    if (stream) {
      streamRef.current = stream;

      // Update existing peer connections with new stream
      Object.entries(peersRef.current).forEach(([peerId, peer]) => {
        // Remove old tracks
        const senders = peer.getSenders();
        senders.forEach((sender) => {
          if (sender.track) {
            peer.removeTrack(sender);
          }
        });

        // Add new tracks
        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
          console.log(`Updated ${track.kind} track for peer ${peerId}`);
        });

        // Renegotiate after changing tracks
        triggerNegotiation(peerId, peer);
      });
    }
  }, [stream]);

  const triggerNegotiation = async (
    peerId: string,
    peer: RTCPeerConnection
  ) => {
    try {
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
      console.error(
        `Error creating offer during renegotiation for ${peerId}:`,
        err
      );
    }
  };

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

    stompClient.current?.subscribe(
      `/user/queue/room/${meetingCode}/users`,
      (message: IMessage) => {
        const signal: SignalMessage = JSON.parse(message.body);
        if (signal.type === "meeting-users") {
          console.log(
            "Received existing participants list:",
            signal.payload.members
          );
          if (signal.payload.members && Array.isArray(signal.payload.members)) {
            const existingMembers = signal.payload.members.filter(
              (member: SignalMessage) => member.from !== me.peerId
            );

            if (existingMembers.length > 0) {
              console.log("Processing existing members:", existingMembers);
              updateParticipantsList(existingMembers);
            }
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

    // Add to participants list
    const newParticipant = { ...signal.member, peerId: signal.from };
    setParticipants((prev) => {
      // Check if already in list
      const exists = prev.some((p) => p.peerId === newParticipant.peerId);
      if (!exists) {
        return [...prev, newParticipant];
      }
      return prev;
    });

    // Update participant reference for future use
    participantRef.current = participantRef.current.filter(
      (p) => p.peerId !== newParticipant.peerId
    );
    participantRef.current.push(newParticipant);

    // Create peer connection for the new user and send an offer
    // Since we are already in the room, we initiate the connection
    console.log(
      `Creating initiator peer connection for new user ${signal.from}`
    );
    createPeerConnection(signal.from, true);
  };

  const handleUserLeft = (signal: SignalMessage) => {
    const peerId = signal.from;

    console.log(`User left: ${peerId}, cleaning up...`);

    // Đóng kết nối peer nếu có
    if (peersRef.current[peerId]) {
      try {
        peersRef.current[peerId].close();
        delete peersRef.current[peerId];
      } catch (err) {
        console.error(`Error closing peer connection for ${peerId}:`, err);
      }
    }

    // Cập nhật state
    setPeers((prev) => {
      const newPeers = { ...prev };
      delete newPeers[peerId];
      return newPeers;
    });

    // Loại bỏ khỏi danh sách người tham gia
    setParticipants((prev) => prev.filter((p) => p.peerId !== peerId));
    participantRef.current = participantRef.current.filter(
      (p) => p.peerId !== peerId
    );
  };
  const handleWebRTCSignal = (signal: SignalMessage) => {
    if (signal.to !== me.peerId) return;

    const peerId = signal.from;

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
        const peer = peersRef.current[peerId];
        if (peer) {
          handleIceCandidate(signal, peer);
        } else {
          console.warn(`No peer found for ICE candidate from ${peerId}`);
        }
        break;
      default:
        console.warn("Unknown signal type:", signal.type);
    }
  };

  const handleOffer = async (signal: SignalMessage) => {
    const peerId = signal.from;

    // Make sure we have the user in participants list
    const userInfo = signal.member;
    if (!participantRef.current.some((p) => p.peerId === peerId)) {
      const newParticipant = { ...userInfo, peerId };
      participantRef.current.push(newParticipant);
      setParticipants((prev) => [...prev, newParticipant]);
    }

    // Create or get peer connection
    let peer = peersRef.current[peerId];
    if (!peer || peer.connectionState === "closed") {
      console.log(`Creating receiver peer for ${peerId} in response to offer`);
      peer = createPeerConnection(peerId, false);
    }

    try {
      // Set remote description from the offer
      await peer.setRemoteDescription(
        new RTCSessionDescription(signal.payload)
      );

      // Create and set answer
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      // Send answer back
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

    if (!peer) {
      console.error(`No peer found for answer from ${peerId}`);
      return;
    }

    try {
      console.log(`Setting remote description for answer from ${peerId}`);
      await peer.setRemoteDescription(
        new RTCSessionDescription(signal.payload)
      );
    } catch (err) {
      console.error(`Error handling answer from ${peerId}:`, err);
    }
  };

  const handleIceCandidate = async (
    signal: SignalMessage,
    peer: RTCPeerConnection
  ) => {
    try {
      if (signal.payload) {
        await peer.addIceCandidate(new RTCIceCandidate(signal.payload));
        console.log(`Added ICE candidate from ${signal.from}`);
      }
    } catch (err) {
      console.error(`Error adding ICE candidate from ${signal.from}:`, err);
    }
  };

  const updateParticipantsList = (signals: SignalMessage[]) => {
    console.log("Updating participants list with:", signals);

    // Extract participants from signals
    const newParticipants = signals
      .map((s) => ({ ...s.member, peerId: s.from }))
      .filter((p) => p.peerId !== me.peerId);

    // Update state with new participants
    setParticipants((prev) => {
      // Filter out duplicates
      const existing = prev.map((p) => p.peerId);
      const uniqueNew = newParticipants.filter(
        (p) => !existing.includes(p.peerId)
      );
      return [...prev, ...uniqueNew];
    });

    // Update reference for further use
    participantRef.current = [
      ...participantRef.current.filter(
        (p) => !newParticipants.some((np) => np.peerId === p.peerId)
      ),
      ...newParticipants,
    ];

    // For each existing participant, create a peer connection
    // We are the newcomer, so we'll create peer connections as a receiver
    newParticipants.forEach((participant) => {
      console.log(
        `Creating receiver peer for existing participant ${participant.peerId}`
      );
      if (!peersRef.current[participant.peerId]) {
        createPeerConnection(participant.peerId, false);
      }
    });
  };

  const createPeerConnection = (peerId: string, isInitiator: boolean) => {
    console.log(
      `Creating ${
        isInitiator ? "initiator" : "receiver"
      } peer connection for ${peerId}`
    );

    // Close existing connection if any
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

    // Add current stream tracks to the peer
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, streamRef.current!);
        console.log(`Added ${track.kind} track to peer ${peerId}`);
      });
    }

    // Handle ICE candidates
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

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state: ${peer.connectionState}`);
    };

    // Handle ice connection state changes
    peer.oniceconnectionstatechange = () => {
      console.log(
        `Peer ${peerId} ICE connection state: ${peer.iceConnectionState}`
      );
    };

    // CRUCIAL: Handle remote stream
    peer.ontrack = (event) => {
      console.log(`Received remote track from ${peerId}`, event.streams[0]?.id);

      if (event.streams && event.streams.length > 0) {
        const remoteStream = event.streams[0];

        // Find user info for this peer
        const userInfo = participantRef.current.find(
          (p) => p.peerId === peerId
        );

        if (!userInfo) {
          console.warn(`No user info found for peer ${peerId}`);
          return;
        }

        // Update peers state with the remote stream
        setPeers((prev) => ({
          ...prev,
          [peerId]: {
            id: peerId,
            user: userInfo,
            connection: peer,
            stream: remoteStream,
          },
        }));

        console.log(`Successfully added remote stream for ${peerId}`);
      }
    };

    // If we're the initiator, we need to create and send an offer
    if (isInitiator) {
      console.log(`As initiator, creating offer for ${peerId}`);
      // Delay slightly to ensure connection is ready
      setTimeout(async () => {
        try {
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
      }, 1000);
    }

    // Store the peer
    peersRef.current[peerId] = peer;
    return peer;
  };

  const sendSignal = (signal: SignalMessage) => {
    console.log("Sending signal:", signal.type, "to:", signal.to);
    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: `/app/signal/${meetingCode}`,
        body: JSON.stringify(signal),
      });
    } else {
      console.warn("Cannot send signal: WebSocket not connected");
    }
  };

  const joinMeeting = () => {
    const joinRequest: JoinRequest = {
      meetingCode: meetingCode,
      peerId: me.peerId,
    };

    // Send join request
    stompClient.current?.publish({
      destination: "/app/join",
      body: JSON.stringify(joinRequest),
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    // Request current participants list
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

    // Clean up peer connections
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};
    setPeers({});
    setParticipants([]);
  };
  const leaveMeeting = () => {
    // Gửi thông báo rời phòng tới server và các peer khác
    if (stompClient.current?.connected) {
      sendSignal({
        type: "user-left",
        from: me.peerId,
        to: "all",
        member: me,
        payload: null,
      });
    }

    // Đóng tất cả kết nối peer
    Object.entries(peersRef.current).forEach(([peerId, peer]) => {
      try {
        console.log(`Closing peer connection with ${peerId}`);
        peer.close();
      } catch (err) {
        console.error(`Error closing peer ${peerId}:`, err);
      }
    });
    peersRef.current = {};
    setPeers({});

    // Dừng tất cả stream
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped local media track:", track.kind);
      });
    }

    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped screen share track:", track.kind);
      });
      screenStream.current = null;
      setScreenShare(false);
    }

    // Ngắt kết nối WebSocket
    if (stompClient.current) {
      stompClient.current.deactivate();
      stompClient.current = null;
    }

    // Reset danh sách người tham gia
    setParticipants([]);
    participantRef.current = [];
  };

  const toggleScreenShare = async () => {
    try {
      if (screenShare) {
        // Dừng chia sẻ màn hình
        if (screenStream.current) {
          screenStream.current.getTracks().forEach((track) => {
            track.stop();
            console.log("Stopped screen share track:", track.kind);
          });
          screenStream.current = null;
        }
        setScreenShare(false);

        // Quay lại sử dụng camera (nếu được bật)
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: !videoOff && isCameraEnable,
            audio: !muted,
          });

          setStream(newStream);
          streamRef.current = newStream;

          if (myVideo.current) {
            myVideo.current.srcObject = newStream;
          }

          // Cập nhật track cho tất cả peer connections
          Object.entries(peersRef.current).forEach(([peerId, peer]) => {
            const senders = peer.getSenders();

            // Tìm và thay thế video track
            const videoSender = senders.find((s) => s.track?.kind === "video");
            if (videoSender && newStream.getVideoTracks().length > 0) {
              videoSender
                .replaceTrack(newStream.getVideoTracks()[0])
                .then(() => console.log(`Replaced video track for ${peerId}`))
                .catch((err) =>
                  console.error(
                    `Error replacing video track for ${peerId}:`,
                    err
                  )
                );
            }

            // Tìm và thay thế audio track nếu cần
            const audioSender = senders.find((s) => s.track?.kind === "audio");
            if (audioSender && newStream.getAudioTracks().length > 0) {
              audioSender
                .replaceTrack(newStream.getAudioTracks()[0])
                .then(() => console.log(`Replaced audio track for ${peerId}`))
                .catch((err) =>
                  console.error(
                    `Error replacing audio track for ${peerId}:`,
                    err
                  )
                );
            }
          });
        } catch (err) {
          console.error("Error reacquiring user media:", err);
          setError(
            "Không thể khôi phục camera/microphone sau khi dừng chia sẻ màn hình"
          );
        }
      } else {
        // Bắt đầu chia sẻ màn hình
        const screenStreamVal = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true, // Cho phép chia sẻ âm thanh hệ thống nếu có
        });

        screenStream.current = screenStreamVal;
        setScreenShare(true);

        if (myVideo.current) {
          myVideo.current.srcObject = screenStreamVal;
        }

        // Cập nhật video track cho tất cả peer connections
        Object.entries(peersRef.current).forEach(([peerId, peer]) => {
          const senders = peer.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");

          if (videoSender && screenStreamVal.getVideoTracks().length > 0) {
            videoSender
              .replaceTrack(screenStreamVal.getVideoTracks()[0])
              .then(() =>
                console.log(`Replaced with screen share for ${peerId}`)
              )
              .catch((err) =>
                console.error(
                  `Error replacing with screen share for ${peerId}:`,
                  err
                )
              );
          }
        });

        // Xử lý khi người dùng dừng chia sẻ từ trình duyệt
        screenStreamVal.getVideoTracks()[0].onended = () => {
          console.log("Screen sharing ended by browser UI");
          toggleScreenShare();
        };
      }
    } catch (err) {
      console.error("Error handling screen share:", err);
      setError("Không thể chia sẻ màn hình. Vui lòng thử lại.");
      setScreenShare(false);
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

  // Auto-join on component mount
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
