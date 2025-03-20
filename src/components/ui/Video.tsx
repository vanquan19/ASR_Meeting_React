import { useEffect, useRef } from "react";

interface WebcamProps {
  isCameraOn: boolean;
  stream?: MediaStream | null;
  isMyself?: boolean;
}

const WebcamComponent: React.FC<WebcamProps> = ({
  isCameraOn,
  stream,
  isMyself,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (error) {
        console.error("Lỗi khi mở camera:", error);
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const remoteStream = stream;
    if (!isMyself && remoteStream) {
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
      }
      streamRef.current = remoteStream;
      return;
    }

    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isCameraOn, stream]); // Chạy lại khi `isCameraOn` thay đổi

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="border rounded-lg shadow-lg w-full h-full bg-black"
    />
  );
};

export default WebcamComponent;
