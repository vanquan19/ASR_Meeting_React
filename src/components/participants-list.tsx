"use client";

import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";

interface Participant {
  id: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
  avatar: string;
}

interface ParticipantsListProps {
  participants: Participant[];
}

export default function ParticipantsList({
  participants,
}: ParticipantsListProps) {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Participants ({participants.length})
          </h3>
        </div>

        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md",
                participant.isSpeaking && !participant.isMuted && "bg-accent"
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={participant.avatar || "/placeholder.svg"}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {participant.isMuted && (
                  <div className="absolute -bottom-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
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
                      className="lucide lucide-mic-off"
                    >
                      <line x1="2" x2="22" y1="2" y2="22" />
                      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                      <path d="M5 10v2a7 7 0 0 0 12 5" />
                      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </div>
                )}

                {participant.isSpeaking && !participant.isMuted && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
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
                      className="lucide lucide-mic"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {participant.name} {participant.id === "user1" && "(You)"}
                  </p>

                  {participant.isScreenSharing && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-monitor-share mr-1"
                      >
                        <path d="M9 10a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9Z" />
                        <path d="M12 14v3" />
                        <path d="M8 17h8" />
                        <rect width="20" height="14" x="2" y="3" rx="2" />
                        <path d="M12 3v14" />
                      </svg>
                      Sharing
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-1 rounded-full hover:bg-muted">
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
                    className="lucide lucide-message-square"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                <button className="p-1 rounded-full hover:bg-muted">
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
                    className="lucide lucide-more-vertical"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
