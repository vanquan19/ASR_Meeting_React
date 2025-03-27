// This file contains helper functions for WebRTC operations

// Configuration for RTCPeerConnection
export const peerConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  }
  
  // Get user media with error handling
  export async function getUserMedia(
    constraints: MediaStreamConstraints = { audio: true, video: true },
  ): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (error) {
      console.error("Error getting user media:", error)
  
      // Try fallback to audio only if video fails
      if (constraints.video) {
        console.log("Trying audio only...")
        return getUserMedia({ audio: true, video: false })
      }
  
      throw error
    }
  }
  
  // Helper to handle track enabling/disabling
  export function setTrackEnabled(stream: MediaStream | null, kind: "audio" | "video", enabled: boolean): void {
    if (!stream) return
  
    const tracks = kind === "audio" ? stream.getAudioTracks() : stream.getVideoTracks()
    tracks.forEach((track) => {
      track.enabled = enabled
    })
  }
  
  // Helper to stop all tracks in a stream
  export function stopMediaStream(stream: MediaStream | null): void {
    if (!stream) return
  
    stream.getTracks().forEach((track) => {
      track.stop()
    })
  }
  
  // Helper to attempt reconnection with different constraints
  export async function attemptReconnection(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentPeers: Map<string, any>,
    localPeerId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendSignalingMessage: (message: any) => void,
  ): Promise<void> {
    // For each peer, try to recreate the connection
    currentPeers.forEach((peer, peerId) => {
      console.log(`Attempting to reconnect with peer: ${peer.username}`)
  
      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection(peerConfiguration)
  
      // Get local stream and add tracks
      const localStream = (document.querySelector("video[muted]") as HTMLVideoElement)?.srcObject as MediaStream
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream)
        })
      }
  
      // Create and send a new offer
      peerConnection
        .createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          sendSignalingMessage({
            type: "offer",
            from: localPeerId,
            to: peerId,
            username: peer.username,
            payload: peerConnection.localDescription,
          })
        })
        .catch((err) => console.error("Error creating reconnection offer:", err))
    })
  }
  
  