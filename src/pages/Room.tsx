import React, { useState, useEffect, useRef } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  FaVideoSlash,
  FaMicrophoneSlash,
  FaDesktop,
  FaPhone,
  FaUserFriends,
} from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { UserType } from "../interface/auth";
import joinSound from "../assets/sounds/join-meeting.mp3";
import { MeetingType } from "../interface/meeting";
import logo from "../assets/images/Logo.png";
import {
  LucideHand,
  LucideMessageCircleMore,
  LucideMic,
  LucideMicOff,
  LucideScreenShare,
  LucideUsersRound,
  LucideVideo,
  LucideVideoOff,
} from "lucide-react";
import { ChatComponent } from "./Chat";
import { ChatType } from "../interface/chat";
import { convertWebMToWav, saveAudio } from "../services/audioService";

interface VideoRoomProps {
  meetingCode: string;
  user: UserType;
  handleLeave: () => void;
  currentMeeting: MeetingType;
}

interface Peer {
  id: string;
  user: UserType;
  connection?: RTCPeerConnection;
  stream?: MediaStream | null;
}

export interface SignalMessage {
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "nego-done"
    | "user-joined"
    | "meeting-users"
    | "chat"
    | "user-left"
    | "has-mic"
    | "end-mic"
    | "clear-mic"
    | "raised-hands"
    | "lower-hands"
    | "participants-length";
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
  handleLeave,
  currentMeeting,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [me, setMe] = useState<UserType & { peerId: string }>({
    ...user,
    peerId: uuidv4(),
  });
  const [hasMic, setHasMic] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [screenShare, setScreenShare] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoOff, setVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [countParticipants, setCountParticipants] = useState(1);
  const [isTakeHand, setIsTakeHand] = useState<boolean>(false);
  const [takeHands, setTakeHands] = useState<string[]>([]);
  const [participants, setParticipants] = useState<
    (UserType & { peerId: string })[]
  >([]);
  const [chats, setChats] = useState<ChatType[]>([]);
  const participantRef = useRef<(UserType & { peerId: string })[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const myVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const screenStream = useRef<MediaStream | null>(null);
  const stompClient = useRef<Client | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Reference to store current stream
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Khởi tạo media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Tắt microphone ngay sau khi lấy stream
        mediaStream.getAudioTracks().forEach((track) => {
          track.enabled = false; // Tắt microphone
        });

        // Bật camera
        mediaStream.getVideoTracks().forEach((track) => {
          track.enabled = true; // Bật camera
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

      // Dọn dẹp thêm nếu cần
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (myVideo.current) {
        myVideo.current.srcObject = null;
      }
    };
  }, []);

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
    const socket = new SockJS(
      `${import.meta.env.VITE_API_BASE_URL}:${import.meta.env.VITE_API_PORT}/ws`
    );
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
        handleAllSignal(signal);
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
      case "user-joined": {
        console.log("User joined:", signal.from);
        //sound join meeting
        const audio = new Audio(joinSound);
        audio.volume = 0.5;
        audio.play();
        handleUserJoined(signal);
        break;
      }

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
    setCountParticipants((prev) => prev + 1);
    createPeerConnection(signal.from, true);
  };

  const handleAllSignal = (signal: SignalMessage) => {
    switch (signal.type) {
      case "offer":
        if (signal.to !== me.peerId) return;
        console.log("Received offer from:", signal.from);
        handleOffer(signal);
        break;
      case "answer":
        if (signal.to !== me.peerId) return;
        console.log("Received answer from:", signal.from);
        handleAnswer(signal);
        break;
      case "ice-candidate": {
        if (signal.to !== me.peerId) return;
        const peerId = signal.from;
        console.log("Received ICE candidate from:", signal.from);
        const peer = peersRef.current[peerId];
        if (peer) {
          handleIceCandidate(signal, peer);
        } else {
          console.warn(`No peer found for ICE candidate from ${peerId}`);
        }
        break;
      }
      case "has-mic":
        console.log("User has mic:", signal.from);
        if (signal.from !== me.peerId) setHasMic(true);
        break;
      case "end-mic":
        console.log("User ended mic:", signal.from);
        setHasMic(false);
        break;
      case "clear-mic":
        {
          if (signal.from === me.peerId) return;
          console.log("User cleared mic:", signal.from);
          // Tắt microphone
          console.log(stream);
          if (!stream) return;
          const audioTrack = stream?.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
            setMuted(true);
          }
          setHasMic(false);
        }
        break;

      case "raised-hands":
        console.log("User raised hand:", signal.from);
        if (signal.from !== me.peerId) {
          setTakeHands((prev) => [...prev, signal.from]);
          setTimeout(() => {
            setTakeHands((prev) =>
              prev.filter((peerId) => peerId !== signal.from)
            );
          }, 50000);
        }
        break;
      case "lower-hands":
        console.log("User lowered hand:", signal.from);
        if (signal.from !== me.peerId) {
          setTakeHands((prev) =>
            prev.filter((peerId) => peerId !== signal.from)
          );
        }
        break;
      case "chat":
        console.log("Received chat message:", signal.payload);
        handleChatMessage(signal);
        break;
      case "user-left":
        console.log("User left:", signal.from);
        handleUserLeft(signal);
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

  const handleUserLeft = (signal: SignalMessage) => {
    if (signal.from === me.peerId) {
      // Người dùng tự rời khỏi phòng
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
      handleLeave();
    } else {
      // Người khác rời khỏi phòng
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

  useEffect(() => {
    sendSignal({
      type: "participants-length",
      from: me.peerId,
      to: "all",
      member: me,
      payload: {
        count: participants.length,
        meetingCode: currentMeeting.meetingCode,
      },
    });
  }, [currentMeeting.meetingCode, participants]);

  const handleChatMessage = (signal: SignalMessage) => {
    const chatMessage: ChatType = {
      id: Date.now(),
      sender: signal.member,
      message: signal.payload.message,
      receiver: signal.to,
      type: signal.payload.type,
      file: signal.payload.file,
      timestamp: signal.payload.timestamp,
    };
    setChats((prev) => [...prev, chatMessage]);
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
    if (stompClient.current?.connected) {
      console.log("Sending signal:", signal.type, "to:", signal.to);
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

  const leaveMeeting = () => {
    sendSignal({
      type: "user-left",
      from: me.peerId,
      to: "all",
      member: me,
      payload: {},
    });
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
            video: !videoOff,
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

  const handleSendAudio = async (audioBlob: File) => {
    const respone = await saveAudio(meetingCode, audioBlob);
    if (respone.code === 200) {
      console.log("Audio saved successfully:", respone);
    }
    setAudioChunks([]);
    setMediaRecorder(null);
  };

  const toggleMute = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMuted(!audioTrack.enabled);

    if (audioTrack.enabled) {
      // Bật microphone và bắt đầu ghi âm
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        try {
          // Chuyển đổi từ webm sang wav trước khi gửi lên server
          const wavBlob = await convertWebMToWav(audioBlob);
          const audioFile = new File([wavBlob], `recording-${Date.now()}.wav`, {
            type: "audio/wav",
          });

          await handleSendAudio(audioFile);
        } catch (error) {
          console.error("Error processing audio:", error);
          setError("Lỗi xử lý file ghi âm");
        }
      };
      mediaRecorder.start();
      setMediaRecorder(mediaRecorder);

      // Gửi tín hiệu có microphone
      sendSignal({
        type: "has-mic",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {},
      });
    } else {
      // Dừng ghi âm và tắt microphone
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
      setMediaRecorder(null);
      setAudioChunks([]);

      // Tắt microphone
      sendSignal({
        type: "end-mic",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {},
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOff(!videoTrack.enabled);

        // Nếu đang bật camera và stream hiện tại không có video track
        if (videoTrack.enabled && !stream.getVideoTracks().length) {
          // Thêm lại video track nếu cần
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((newStream) => {
              const newVideoTrack = newStream.getVideoTracks()[0];
              stream.addTrack(newVideoTrack);

              // Cập nhật peer connections
              Object.values(peersRef.current).forEach((peer) => {
                peer.addTrack(newVideoTrack, stream);
              });
            });
        }
      }
    }
  };
  const handleTurnOffAllMic = () => {
    sendSignal({
      type: "clear-mic",
      from: me.peerId,
      to: "all",
      member: me,
      payload: {},
    });
  };

  const sendRaisedHand = () => {
    if (isTakeHand) {
      setIsTakeHand(false);
      sendSignal({
        type: "lower-hands",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {},
      });
    } else {
      setIsTakeHand(true);
      sendSignal({
        type: "raised-hands",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {},
      });
    }
  };

  // Auto-join on component mount
  useEffect(() => {
    connectToMeeting();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 fixed top-0 left-0 h-screen w-screen z-50">
      <div className="w-full h-full bg-white shadow-lg overflow-hidden">
        <div className="px-4 py-2 bg-black text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="logo" className="size-12" />
            <h2 className="text-base text-white font-semibold uppercase">
              {currentMeeting.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Controls */}
            <div className="flex flex-wrap justify-center gap-3">
              {hasMic && (
                <button
                  onClick={handleTurnOffAllMic}
                  className={`flex items-center gap-2 p-2 rounded-md relative group text-gray-50`}
                >
                  <LucideMicOff size={24} />
                  <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2">
                    Tắt tất cả mic
                  </span>
                </button>
              )}
              <button
                onClick={sendRaisedHand}
                className={`flex items-center gap-2 p-2 rounded-md relative group ${
                  isTakeHand ? " text-yellow-400" : " text-gray-300"
                } `}
              >
                <LucideHand size={24} />
                <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2">
                  Giơ tay
                </span>
              </button>
              <button
                onClick={() => {
                  setShowChat(!showChat);
                  setShowParticipants(false);
                }}
                className={`flex items-center gap-2 p-2 rounded-md relative group ${
                  showChat ? " text-yellow-500" : " text-gray-300"
                } `}
              >
                <span className="absolute top-2 right-2 bg-red-600 h-2.5 w-2.5 rounded-full"></span>
                <LucideMessageCircleMore size={24} />
                <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2">
                  Nhắn tin
                </span>
              </button>

              <button
                onClick={() => {
                  setShowParticipants(!showParticipants);
                  setShowChat(false);
                }}
                className={`relative flex items-center gap-2 p-2 rounded-md group ${
                  showParticipants ? " text-yellow-500" : " text-gray-300"
                } `}
              >
                <span
                  className={`absolute top-0 right-0 font-bold text-sm ${
                    takeHands.length > 0 ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  {takeHands.length > 0 ? takeHands.length : ""}
                </span>
                <LucideUsersRound size={24} />
                <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2 text-gray-300">
                  Danh sách người tham gia
                </span>
              </button>

              <button
                onClick={() => toggleMute()}
                disabled={hasMic}
                className={`relative flex items-center gap-2 p-2 rounded-md group ${
                  muted ? "text-red-700" : " text-gray-300"
                } `}
              >
                {muted ? <LucideMicOff size={24} /> : <LucideMic size={24} />}
                <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2 text-gray-50">
                  {muted ? "Bật mic" : "Tắt mic"}
                </span>
              </button>

              <button
                onClick={toggleVideo}
                className={`relative flex items-center gap-2 p-2 rounded-md group ${
                  videoOff ? "text-red-700" : " text-gray-300"
                } `}
              >
                {videoOff ? (
                  <LucideVideoOff size={24} />
                ) : (
                  <LucideVideo size={24} />
                )}
                <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2">
                  {videoOff ? "Bật camera" : "Tắt camera"}
                </span>
              </button>

              <button
                onClick={toggleScreenShare}
                className={`relative flex items-center gap-2 p-2 rounded-md group ${
                  screenShare ? " text-blue-700" : " text-gray-300"
                } `}
              >
                <LucideScreenShare size={24} />
                <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2">
                  Chia sẻ màn hình
                </span>
              </button>

              <button
                onClick={leaveMeeting}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                <FaPhone /> Rời phòng
              </button>
            </div>
          </div>
        </div>

        {/* Phan noi dung */}
        <div className="flex h-full">
          <div
            className={`bg-gray-900  gap-1 items-center w-full ${
              countParticipants > 8
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6"
                : countParticipants > 4
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : countParticipants > 3
                ? "grid gird-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "flex justify-center"
            }`}
          >
            {/* Video của mình */}
            <div className="relative overflow-hidden bg-black h-auto w-auto">
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
                className="relative overflow-hidden bg-black h-fit w-fit"
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

          {/* Danh sách người tham gia */}
          {showParticipants && (
            <div className="p-4 w-1/4 bg-gray-950">
              <div className="flex items-center gap-2 text-white mb-3">
                <FaUserFriends />
                <h3 className="font-medium">
                  Danh sách người tham gia ({participants.length + 1})
                </h3>
              </div>

              <div className=" p-3">
                <div className="flex items-center gap-3 p-2 border-b border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {me.img ? (
                      <img
                        src={me.img}
                        alt="avatar"
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <span>{me.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-50">{me.name}</p>
                    <p className="text-sm text-gray-50">Bạn</p>
                  </div>
                </div>

                {participants.map((participant) => (
                  <div
                    key={participant.peerId}
                    className="flex items-center gap-3 p-2 border-b border-gray-200 relative"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                      {participant.img ? (
                        <img
                          src={participant.img}
                          alt="avatar"
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <span>{participant.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-50">
                        {participant.name}
                      </p>
                      <p className="text-sm text-gray-50">{participant.id}</p>
                    </div>
                    {takeHands.includes(participant.peerId) && (
                      <div className="absolute top-1/2 -translate-y-full right-6 text-yellow-500 h-2.5 w-2.5 rounded-full">
                        <LucideHand />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Chat */}
          {showChat && (
            <div className="w-1/4 bg-gray-100 h-full overflow-hidden">
              {/* Chat content goes here */}
              <ChatComponent
                chats={chats}
                member={me}
                sendSignal={sendSignal}
                meetingCode={meetingCode}
              />
            </div>
          )}
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
