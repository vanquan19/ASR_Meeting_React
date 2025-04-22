import { Client } from "@stomp/stompjs";
import { MemberType } from "./member";

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
    | "request-screen";

    from: string;
    to: string;
    member: MemberType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
}


export interface WsContextType {
    socket: Client | null;
    sendSignal: (signal: SignalMessage, meetingCode:string) => void;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
}