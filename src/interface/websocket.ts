import { Client } from "@stomp/stompjs";
import { MemberType } from "./member";
import { UserType } from "./auth";

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
    | "toggle-recording"
    | "notification"
    | "read-notification"
    | "user-action";

  from: string;
  to: string;
  member: MemberType | UserType | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export interface WsContextType {
  socket: Client | null;
  connected: boolean;
  sendSignal: (signal: SignalMessage, meetingCode: string) => void;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}
