export const peer = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:relay1.expressturn.com:3478",
      username: "efALYHAURNCX3DKZXI",
      credential: "JChoZQCUqDTEtIe1",
    },
  ],
});
