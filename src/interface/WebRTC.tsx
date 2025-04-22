import { MemberType } from "./member";

export interface Peer {
  id: string;
  user: MemberType;
  connection?: RTCPeerConnection;
  stream?: MediaStream | null;
}
