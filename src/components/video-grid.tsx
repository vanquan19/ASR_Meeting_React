"use client";

import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import WebcamComponent from "./ui/Video";

interface Participant {
  id: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
  avatar: string;
  isCameraOn: boolean;
  stream: MediaStream;
  isMyself: boolean;
}

interface VideoGridProps {
  myStream: Participant;
  participants: Participant[];
  activeSpeaker: string;
  isScreenSharing: boolean;
}

export default function VideoGrid({
  participants,
  activeSpeaker,
  isScreenSharing,
}: VideoGridProps) {
  const [layout, setLayout] = useState<"grid" | "focus">(
    isScreenSharing ? "focus" : "grid"
  );

  // Update layout when screen sharing status changes
  useEffect(() => {
    setLayout(isScreenSharing ? "focus" : "grid");
  }, [isScreenSharing]);

  // Find the participant who is screen sharing
  const screenSharerParticipant = participants.find((p) => p.isScreenSharing);

  return (
    <div className="w-full h-full bg-black p-2">
      {layout === "grid" ? (
        <div
          className={cn(
            "grid gap-2 w-full h-full",
            participants.length <= 1
              ? "grid-cols-1"
              : participants.length <= 4
              ? "grid-cols-2"
              : "grid-cols-3"
          )}
        >
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={cn(
                "relative rounded-lg overflow-hidden bg-muted",
                participant.id === activeSpeaker && "ring-2 ring-primary"
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {participant.isCameraOn ? (
                  <WebcamComponent
                    isCameraOn={participant.isCameraOn}
                    stream={participant.stream}
                  />
                ) : (
                  <img
                    src={participant.avatar || "/placeholder.svg"}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex items-center justify-between">
                <span className="text-white text-sm font-medium">
                  {participant.name} {participant.id === "user1" && "(You)"}
                </span>

                {participant.isMuted && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-destructive"
                  >
                    <path d="M16 9v1.5a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4V9" />
                    <path d="M12 18.5V19" />
                    <path d="m3 3 18 18" />
                    <path d="M12 2a3 3 0 0 1 3 3v3.5" />
                    <path d="M9 5a3 3 0 0 1 3-3v8.5" />
                  </svg>
                )}

                {participant.isSpeaking && !participant.isMuted && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-500"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col">
          {/* Main screen share view */}
          <div className="flex-1 bg-muted rounded-lg overflow-hidden mb-2">
            {screenSharerParticipant && (
              <div className="relative w-full h-full">
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <img
                    src="/placeholder.svg?height=720&width=1280"
                    alt="Screen share"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full">
                  <span className="text-white text-sm">
                    {screenSharerParticipant.name} is sharing their screen
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnails of other participants */}
          <div className="h-24 flex gap-2 overflow-x-auto">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={cn(
                  "relative rounded-lg overflow-hidden bg-muted flex-shrink-0 w-32",
                  participant.id === activeSpeaker && "ring-2 ring-primary"
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={participant.avatar || "/placeholder.svg"}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 flex items-center justify-between">
                  <span className="text-white text-xs truncate">
                    {participant.name} {participant.id === "user1" && "(You)"}
                  </span>

                  {participant.isMuted && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-destructive"
                    >
                      <path d="M16 9v1.5a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4V9" />
                      <path d="M12 18.5V19" />
                      <path d="m3 3 18 18" />
                      <path d="M12 2a3 3 0 0 1 3 3v3.5" />
                      <path d="M9 5a3 3 0 0 1 3-3v8.5" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
