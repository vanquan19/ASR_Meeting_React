export interface WebRTCUser {
  id: string;
  name: string;
  stream: MediaStream;
  isCameraOn: boolean;
  isMutted: boolean;
}
