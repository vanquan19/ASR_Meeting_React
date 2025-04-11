import { useState, useEffect, useRef } from "react";

import { Camera, CameraOff, Mic, MicOff } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/Image";

interface VideoProps {
  isCameraOn?: boolean;
  isMutted?: boolean;
  name: string;
  stream: MediaStream;
}

export const Video = ({ isCameraOn, isMutted, name, stream }: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCamera, setIsCamera] = useState<boolean>(false);
  const [isMicro, setIsMicro] = useState<boolean>(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    if (isCameraOn) {
      setIsCamera(true);
    }
    if (isMutted) {
      setIsMicro(true);
    }
  }, [stream, isCameraOn, isMutted]);
  return (
    <Card className="overflow-hidden w-full max-w-sm">
      <div className="relative aspect-video bg-muted">
        {isCamera ? (
          <video
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={isMicro}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Avatar className="h-20 w-20">
              <AvatarFallback>{"abc"}</AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Status indicators */}
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge
            variant={isCamera ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isCamera ? <Camera size={14} /> : <CameraOff size={14} />}
          </Badge>
          <Badge
            variant={!isMicro ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {!isMicro ? <Mic size={14} /> : <MicOff size={14} />}
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="font-medium truncate">{name}</div>
      </CardContent>
    </Card>
  );
};
