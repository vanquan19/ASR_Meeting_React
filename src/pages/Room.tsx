import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import RecordRTC from "recordrtc";
import {
  FaVideoSlash,
  FaMicrophoneSlash,
  FaDesktop,
  FaPhone,
  FaUserFriends,
} from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import type { UserType } from "../interface/auth";
import joinSound from "../assets/sounds/join-meeting.mp3";
import type { MeetingType } from "../interface/meeting";
import logo from "../assets/images/Logo.png";
import {
  CircleStop,
  LucideHand,
  LucideMessageCircleMore,
  LucideMic,
  LucideMicOff,
  LucideScreenShare,
  LucideUsersRound,
  LucideVideo,
  LucideVideoOff,
  Pause,
  Play,
} from "lucide-react";
import { ChatComponent } from "../components/Chat";
import type { ChatType } from "../interface/chat";
import { saveAudio } from "../services/audioService";
import type { MemberType } from "../interface/member";
import { ROLE_MEETING } from "../constants/meeting";
import { toast } from "react-toastify";
import { captureScreen } from "../services/screenSharing";
import { getChatToMeeting, saveChat } from "../services/chatService";
import { decryptFile, decryptText } from "../utils/aes";

declare module "react" {
  interface VideoHTMLAttributes<T> extends HTMLAttributes<T> {
    srcObject?: MediaStream | MediaSource | Blob | null;
  }
}

interface VideoRoomProps {
  meetingCode: string;
  user: UserType;
  handleLeave: () => void;
  currentMeeting: MeetingType;
}

interface Peer {
  id: string;
  user: MemberType;
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
    | "participants-length"
    | "screen-share"
    | "request-state"
    | "user-state"
    | "request-screen"
    | "toggle-recording";

  from: string;
  to: string;
  member: MemberType;
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
  const [me, setMe] = useState<MemberType>({
    id: user.id,
    name: user.name,
    employeeCode: user.employeeCode || "",
    email: user.email,
    img: user.img || "",
    peerId: uuidv4(),
  });
  const [isStartMeeting, setIsStartMeeting] = useState<boolean>(false);
  const [hasMic, setHasMic] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [screenShare, setScreenShare] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoOff, setVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [isTakeHand, setIsTakeHand] = useState<boolean>(false);
  const [takeHands, setTakeHands] = useState<string[]>([]);
  const [participants, setParticipants] = useState<MemberType[]>([]);
  const [chats, setChats] = useState<ChatType[]>([]);
  const participantRef = useRef<MemberType[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const myVideo = useRef<HTMLVideoElement>(null);
  const screenVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const screenStreamRef = useRef<MediaStream | null>(null);
  const stompClient = useRef<Client | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Reference to store current stream
  const recorderRef = useRef<RecordRTC | null>(null); // Reference to store the recorder
  const audioChucksRef = useRef<Blob[]>([]); // Reference to store audio chunks
  const isResetMic = useRef<boolean>(false); // Reference to track if mic is reset
  //shareScreen
  const [currentScreenSharer, setCurrentScreenSharer] = useState<string | null>(
    null
  );
  //current state
  const allStateRef = useRef<{
    screenShare: boolean;
    muted: boolean;
    isTakeHand: boolean;
    isStartMeeting: boolean;
  }>({
    screenShare,
    muted,
    isTakeHand,
    isStartMeeting,
  });
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
        setTimeout(() => {
          setError("");
        }, 5000);
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
    const socket = new SockJS(`${import.meta.env.VITE_WS_URL}`);
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
        setTimeout(() => {
          setError("");
        }, 5000);
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
          console.log("Received existing participants list:", signal);
          setMe((prev) => ({
            ...prev,
            meetingRole: signal.member.meetingRole,
          }));

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
        setTimeout(() => {
          setError("");
        }, 5000);
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
      sendSignal({
        type: "request-state",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {},
      });
      return;
    }
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
    //if has mic is true

    // Create peer connection for the new user and send an offer
    // Since we are already in the room, we initiate the connection
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
        if (signal.to === me.peerId) setHasMic(true);
        break;
      case "end-mic":
        console.log("User ended mic:", signal.from);
        setHasMic(false);
        break;
      case "clear-mic":
        {
          // giả ấn vào tongleMuted button neu dang on mic
          if (signal.from === me.peerId) return;
          const isStartMeeting = signal.payload.isStartMeeting;
          if ((muted && !isStartMeeting) || (!muted && isStartMeeting)) {
            const button = document.querySelector("#toggle-mic-btn");
            if (button) {
              (button as HTMLButtonElement).click();
            }
          }

          allStateRef.current.muted = true;
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

      case "screen-share":
        if (signal.from === me.peerId) return;
        console.log("Received screen candidate from:", signal.from);
        handleScreenSharing(signal);
        break;
      case "request-state":
        if (signal.from === me.peerId) return;
        if (
          allStateRef.current.screenShare ||
          !allStateRef.current.muted ||
          allStateRef.current.isTakeHand
        )
          sendSignal({
            type: "user-state",
            from: me.peerId,
            to: signal.from,
            member: me,
            payload: {
              screenShare: allStateRef.current.screenShare,
              muted: !allStateRef.current.muted,
              isTakeHand: allStateRef.current.isTakeHand,
              isStartMeeting: allStateRef.current.isStartMeeting,
            },
          });
        break;
      case "user-state": {
        if (signal.to !== me.peerId) return;
        const { muted, screenShare, isTakeHand, isStartMeeting } =
          signal.payload;
        if (screenShare) {
          setCurrentScreenSharer(signal.from);
          // Yêu cầu đổi track screen cho người mới
          sendSignal({
            type: "request-screen",
            from: me.peerId,
            to: signal.from,
            member: me,
            payload: { isSharing: true },
          });
        }
        if (signal.payload.muted) {
          setHasMic(muted);
        }
        if (isTakeHand) {
          setTakeHands((prev) => [...prev, signal.from]);
        }
        if (isStartMeeting) {
          setIsStartMeeting(isStartMeeting);
          allStateRef.current.isStartMeeting = isStartMeeting;
        }
        break;
      }
      case "request-screen": {
        if (signal.to !== me.peerId) return;

        const targetPeerId = signal.from;
        const peerConnection = peersRef.current[targetPeerId]; // 🎯 Chỉ người yêu cầu

        if (!peerConnection || !screenStreamRef.current) return;

        const videoTrack = screenStreamRef.current.getVideoTracks()[0];
        if (!videoTrack) return;

        const sender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        break;
      }
      case "toggle-recording": {
        if (signal.from === me.peerId) return;
        const { isStartMeeting } = signal.payload;
        setIsStartMeeting(isStartMeeting);
        allStateRef.current.isStartMeeting = isStartMeeting;
        if (!isStartMeeting && recorderRef.current) {
          stopRecording();
        }
        break;
      }

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
      // Dừng ghi âm nếu đang bật mic
      if (!muted && recorderRef.current) {
        stopRecording();
      }

      // Dừng chia sẻ màn hình nếu đang chia sẻ
      if (screenShare) {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        }
        setScreenShare(false);
        allStateRef.current.screenShare = false;
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

      // Nếu người rời phòng đang bật mic
      if (hasMic && signal.from === peerId) {
        setHasMic(false);
      }

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
    //ckeck if any is sharing screen

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

  const handleChatMessage = async (signal: SignalMessage) => {
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
    await saveChat({
      ...chat,
      sender: signal.from,
      message: signal.payload.message,
    }).catch((error) => {
      console.error("Error saving chat:", error);
    });
  };

  //initial chat
  useEffect(() => {
    const getChat = async () => {
      const res = await getChatToMeeting(meetingCode);
      if (res.code !== 200) {
        setError(res.message);
        setTimeout(() => {
          setError("");
        }, 5000);
        return;
      }
      setChats(
        res.result.map((chat: ChatType) => {
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
    getChat();
  }, [meetingCode]);

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
        {
          urls: [import.meta.env.VITE_WEBRTC_SERVER_URL1],
          username: import.meta.env.VITE_WEBRTC_SERVER_USERNAME,
          credential: import.meta.env.VITE_WEBRTC_SERVER_PASSWORD,
        },
        {
          urls: [import.meta.env.VITE_WEBRTC_SERVER_URL2],
          username: import.meta.env.VITE_WEBRTC_SERVER_USERNAME,
          credential: import.meta.env.VITE_WEBRTC_SERVER_PASSWORD,
        },
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
      setTimeout(() => {
        setError("");
      }, 5000);
      setLoading(false);
      return;
    }

    initWebSocket();
    setLoading(false);
  };

  const leaveMeeting = () => {
    // Dừng ghi âm nếu đang bật mic
    if (!muted && recorderRef.current) {
      stopRecording();
      sendSignal({
        type: "end-mic",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {},
      });
    }
    // Tat chia se man hinh
    if (screenShare) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setScreenShare(false);
      allStateRef.current.screenShare = false;
      sendSignal({
        type: "screen-share",
        from: me.peerId,
        to: "all",
        member: me,
        payload: { isSharing: false },
      });
    }
    sendSignal({
      type: "user-left",
      from: me.peerId,
      to: "all",
      member: me,
      payload: {},
    });
  };
  const handleScreenSharing = async (signal: SignalMessage) => {
    const { from, payload, member } = signal;
    if (from === me.peerId) return;
    if (payload.isSharing) {
      // Ai đó bắt đầu chia sẻ màn hình
      toast.info(`${member?.name} đang chia sẻ màn hình`);
      setCurrentScreenSharer(from); // set người đang chia sẻ
    } else {
      // Ai đó dừng chia sẻ
      toast.info(`${member?.name} đã dừng chia sẻ màn hình`);
      setCurrentScreenSharer(null);
    }
  };
  const handleEndScreenSharing = () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;

    setScreenShare(false);
    allStateRef.current.screenShare = false;
    // Đổi lại video track cho mỗi peer
    Object.values(peersRef.current).forEach((peerConnection) => {
      const videoTrack = streamRef.current?.getVideoTracks()[0];

      const sender = peerConnection
        .getSenders()
        .find((s) => s.track?.kind === "video");

      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    });
    // Khôi phục lại camera local
    streamRef.current?.getVideoTracks().forEach((track) => {
      if (!track.enabled) track.enabled = true;
    });
    setTimeout(() => {
      if (myVideo.current && streamRef.current) {
        myVideo.current.srcObject = streamRef.current;

        // Đảm bảo track vẫn bật
        streamRef.current
          .getVideoTracks()
          .forEach((track) => (track.enabled = true));
      }
    }, 50);

    sendSignal({
      type: "screen-share",
      from: me.peerId,
      to: "all",
      member: me,
      payload: { isSharing: false },
    });
  };
  const toggleScreenShare = async () => {
    try {
      // If already sharing, stop sharing
      if (screenShare) {
        // Notify others that screen sharing has ended
        handleEndScreenSharing();
      } else {
        // Check if someone else is already sharing
        if (currentScreenSharer) {
          toast.warn(
            `Bạn không thể chi sẻ màn hình, bởi ai đó đang sử dụng tính năng này!`
          );
          return;
        }

        const screenStream = await captureScreen();
        screenStreamRef.current = screenStream;
        const videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.addEventListener("ended", () => {
          console.log("Screen sharing ended");
          handleEndScreenSharing();
        });

        // Update the current screen sharer
        Object.values(peersRef.current).forEach((peerConnection) => {
          const videoTrack = screenStream.getVideoTracks()[0];

          const sender = peerConnection
            .getSenders()
            .find((s) => s.track?.kind === "video");

          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });

        if (myVideo.current) {
          myVideo.current.srcObject = screenStream;
        }

        setScreenShare(true);
        allStateRef.current.screenShare = true;
        // Notify others about screen sharing
        sendSignal({
          type: "screen-share",
          from: me.peerId,
          to: "all",
          member: me,
          payload: { isSharing: true },
        });
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
      setError("Không thể chia sẻ màn hình. Vui lòng thử lại.");
      setTimeout(() => {
        setError("");
      }, 5000);
    }
  };

  useEffect(() => {
    if (screenShare)
      if (screenShare && screenStreamRef.current && screenVideo.current) {
        screenVideo.current.srcObject = screenStreamRef.current;
      }
  }, [screenShare]);

  const handleSendAudio = async (audioBlob: Blob) => {
    const audioFile = new File([audioBlob], `recording-${Date.now()}.ogg`, {
      type: "audio/ogg",
      lastModified: Date.now(),
    });

    const respone = await saveAudio(meetingCode, audioFile);
    if (respone.code === 200) {
      console.log("Audio saved successfully:", respone);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    if (!allStateRef.current.isStartMeeting) return;
    try {
      const recorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/ogg",
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 5000,
        ondataavailable: (blob) => {
          audioChucksRef.current.push(blob);
        },
      });
      recorderRef.current = recorder;
      recorder.startRecording();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    if (!allStateRef.current.isStartMeeting) return;
    try {
      recorderRef.current.stopRecording(async () => {
        const audioBlob = recorderRef.current?.getBlob();
        if (!audioBlob) return;
        await handleSendAudio(audioBlob);
      });
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const toggleMute = useCallback(() => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMuted(!audioTrack.enabled);
    allStateRef.current.muted = !audioTrack.enabled;

    if (audioTrack.enabled) {
      // Bật microphone và bắt đầu ghi âm
      startRecording();
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
      stopRecording();
      // Tắt microphone
      sendSignal({
        type: "end-mic",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {},
      });
    }
  }, [stream, me.peerId, isResetMic]);

  const toggleRecording = () => {
    if (isStartMeeting) {
      allStateRef.current.isStartMeeting = false;
      setIsStartMeeting(false);
      if (recorderRef.current) {
        stopRecording();
      }
      sendSignal({
        type: "toggle-recording",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {
          isStartMeeting: false,
        },
      });
    } else {
      allStateRef.current.isStartMeeting = true;
      setIsStartMeeting(true);
      sendSignal({
        type: "clear-mic",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {
          isStartMeeting: true,
        },
      });
      setTimeout(() => {
        sendSignal({
          type: "toggle-recording",
          from: me.peerId,
          to: "all",
          member: me,
          payload: {
            isStartMeeting: true,
          },
        });
      }, 0);
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
      allStateRef.current.isTakeHand = false;
      sendSignal({
        type: "lower-hands",
        from: me.peerId,
        to: "all",
        member: me,
        payload: {},
      });
    } else {
      setIsTakeHand(true);
      allStateRef.current.isTakeHand = true;
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

  useEffect(() => {
    const handleBeforeUnload = () => {
      const button = document.querySelector("#leave-meeting-btn");
      if (button) {
        (button as HTMLButtonElement).click();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 fixed top-0 left-0 h-screen w-screen z-50">
      <div className="w-full h-full bg-white shadow-lg overflow-hidden">
        <div className="px-4 py-2 bg-black text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src={logo || "/placeholder.svg"}
              alt="logo"
              className="size-12"
            />
            <h2 className="text-base text-white font-semibold uppercase">
              {currentMeeting.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Controls */}
            <div className="flex flex-wrap justify-center gap-3">
              {!isStartMeeting &&
                (me.meetingRole === "SECRETARY" ||
                  me.meetingRole === "PRESIDENT") && (
                  <button
                    onClick={toggleRecording}
                    className={`flex items-center gap-2 p-2 rounded-md relative group text-gray-50`}
                  >
                    <Play size={24} />
                    <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2">
                      Bắt đầu ghi âm
                    </span>
                  </button>
                )}
              {isStartMeeting &&
                (me.meetingRole === "SECRETARY" ||
                  me.meetingRole === "PRESIDENT") && (
                  <button
                    onClick={toggleRecording}
                    className={`flex items-center gap-2 p-2 rounded-md relative group text-gray-50`}
                  >
                    <Pause size={24} />
                    <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2">
                      Kết thúc ghi âm
                    </span>
                  </button>
                )}
              {isStartMeeting &&
                me.meetingRole !== "PRESIDENT" &&
                me.meetingRole !== "SECRETARY" && (
                  <button
                    className={`flex items-center gap-2 p-2 rounded-md relative group text-red-800`}
                  >
                    <CircleStop
                      size={24}
                      className="animate-pulse duration-200"
                    />
                    <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2">
                      Cuộc họp đang được ghi lại
                    </span>
                  </button>
                )}
              {hasMic && me.meetingRole === "PRESIDENT" && (
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
                disabled={hasMic && isStartMeeting}
                id="toggle-mic-btn"
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
                disabled={
                  currentScreenSharer !== null &&
                  currentScreenSharer !== me.peerId
                }
                className={`relative flex items-center gap-2 p-2 rounded-md group ${
                  screenShare
                    ? "text-blue-700"
                    : currentScreenSharer !== null &&
                      currentScreenSharer !== me.peerId
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-gray-300"
                }`}
              >
                <LucideScreenShare size={24} />
                <span className="absolute top-full hidden group-hover:block whitespace-nowrap left-1/2 -translate-x-1/2">
                  {currentScreenSharer !== null &&
                  currentScreenSharer !== me.peerId
                    ? "Người khác đang chia sẻ màn hình"
                    : screenShare
                    ? "Dừng chia sẻ màn hình"
                    : "Chia sẻ màn hình"}
                </span>
              </button>

              <button
                id="leave-meeting-btn"
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
          {(currentScreenSharer || screenShare) && (
            <div className="flex h-[calc(100vh-64px)] flex-col items-center bg-gray-950">
              {/* Screen share display */}
              <div
                className={`bg-black relative items-center h-auto my-auto ${
                  participants.length > 0 ? "w-5/6" : "w-full"
                }`}
              >
                {/* When I am sharing my screen */}
                {screenShare && (
                  <video
                    ref={screenVideo}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )}
                {/* When someone else is sharing their screen */}
                {!screenShare &&
                  currentScreenSharer &&
                  peers[currentScreenSharer]?.stream && (
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      ref={(video) => {
                        if (video) {
                          video.srcObject =
                            peers[currentScreenSharer].stream || null;
                        }
                      }}
                    />
                  )}
                {/* Display sharer info */}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white p-2 rounded">
                  {!currentScreenSharer
                    ? "Bạn đang chia sẻ màn hình"
                    : `${
                        peers[currentScreenSharer]?.user.name +
                          ` [${
                            ROLE_MEETING.find(
                              (role) =>
                                role.id ===
                                peers[currentScreenSharer]?.user.meetingRole
                            )?.name
                          }]` || "Người dùng"
                      } đang chia sẻ màn hình`}
                </div>
              </div>

              {/* Video thumbnails when screen sharing is active */}
              {participants.length > 0 && (
                <div
                  className={`bg-gray-900  gap-1 w-full grid grid-cols-6 items-center lg:min-h-52 mt-0.5`}
                >
                  {/* Video của mình  */}
                  {currentScreenSharer !== me.peerId && !screenShare && (
                    <div className="relative overflow-hidden bg-black h-full w-full col-span-1">
                      <video
                        playsInline
                        muted
                        ref={(video) => {
                          if (video) {
                            video.srcObject = streamRef.current;
                          }
                        }}
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 flex justify-between items-center">
                        <span>
                          {me.name} (Bạn) [{" "}
                          {ROLE_MEETING.find(
                            (role) => role.id === me.meetingRole
                          )?.name || "Unknown"}
                          ]
                        </span>
                        <div className="flex gap-1">
                          {muted && (
                            <FaMicrophoneSlash className="text-red-400" />
                          )}
                          {videoOff && (
                            <FaVideoSlash className="text-red-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Video của người tham gia */}
                  {Object.values(peers).map((peer) => {
                    if (peer.id === currentScreenSharer) return null;
                    return (
                      <div
                        key={peer.id}
                        className={`relative overflow-hidden bg-black h-full w-full col-span-1`}
                      >
                        <video
                          playsInline
                          ref={(video) => {
                            if (video && peer.stream) {
                              video.srcObject = peer.stream;
                            }
                          }}
                          autoPlay
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 flex justify-between items-center">
                          <span>
                            {peer.user.name} [{" "}
                            {ROLE_MEETING.find(
                              (role) => role.id === peer.user.meetingRole
                            )?.name || "Unknown"}
                            ]
                          </span>
                          <div className="flex gap-1">
                            {takeHands.includes(peer.id) && (
                              <LucideHand className="text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!currentScreenSharer && !screenShare && (
            <div
              className={`bg-gray-900 p-1 gap-1 w-full pb-14 ${
                showParticipants || showChat ? "flex-1" : "w-full"
              } ${
                participants.length <= 1
                  ? "flex justify-center items-center"
                  : participants.length <= 9
                  ? "grid grid-cols-3 items-center"
                  : participants.length <= 16
                  ? "grid grid-cols-4 auto-rows-fr"
                  : "grid grid-cols-5 auto-rows-fr"
              }`}
            >
              {/* Video của mình */}
              <div
                className={`relative overflow-hidden bg-black h-full w-full ${
                  participants.length <= 2 && "max-h-1/2"
                } ${participants.length <= 0 && "max-w-1/2"}`}
              >
                <video
                  playsInline
                  muted
                  ref={(video) => {
                    if (video) {
                      video.srcObject = streamRef.current;
                      myVideo.current = video;
                    }
                  }}
                  autoPlay
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 flex justify-between items-center">
                  <span>
                    {me.name} (Bạn) [{" "}
                    {ROLE_MEETING.find((role) => role.id === me.meetingRole)
                      ?.name || "Unknown"}
                    ]
                  </span>
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
                  className={`relative overflow-hidden bg-black h-full w-full ${
                    participants.length <= 2 && "max-h-1/2 "
                  } ${participants.length <= 0 && "max-w-1/2 "}`}
                >
                  <video
                    playsInline
                    ref={(video) => {
                      if (video && peer.stream) {
                        video.srcObject = peer.stream;
                      }
                    }}
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 flex justify-between items-center">
                    <span>
                      {peer.user.name} [{" "}
                      {ROLE_MEETING.find(
                        (role) => role.id === peer.user.meetingRole
                      )?.name || "Unknown"}
                      ]
                    </span>
                    <div className="flex gap-1">
                      {takeHands.includes(peer.id) && (
                        <LucideHand className="text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Danh sách người tham gia */}
          {showParticipants && (
            <div className="p-4 w-1/4 min-w-96 bg-gray-950">
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
                    <p className="font-medium text-gray-50">
                      {me.name} ({" "}
                      {
                        ROLE_MEETING.find((role) => role.id === me.meetingRole)
                          ?.name
                      }
                      )
                    </p>
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
                        {participant.name} ({" "}
                        {
                          ROLE_MEETING.find(
                            (role) => role.id === participant.meetingRole
                          )?.name
                        }
                        )
                      </p>
                      <p className="text-sm text-gray-50">
                        {participant.employeeCode}
                      </p>
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
            <div className="w-1/4 min-w-96 bg-gray-100 h-full overflow-hidden">
              {/* Chat content goes here */}
              <ChatComponent
                chats={chats}
                member={me}
                meetingCode={meetingCode}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
