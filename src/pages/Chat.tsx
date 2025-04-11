import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import type { UserType } from "../interface/auth";
import type { ChatType } from "../interface/chat";
import type { SignalMessage } from "./Room";
import { cn } from "../lib/utils";

export const ChatComponent = ({
  chats,
  sendSignal,
  member,
  meetingCode,
}: {
  chats: ChatType[];
  sendSignal: (signal: SignalMessage) => void;
  member: UserType & { peerId: string };
  meetingCode: string;
}) => {
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const chatContainer = document.querySelector("#scroll-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
      chatContainer.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, [chats]);

  const handleSend = () => {
    if (message.trim() === "" && !file) {
      return;
    }

    sendSignal({
      type: "chat",
      from: member.id + "",
      to: meetingCode,
      member,
      payload: {
        type: file ? file.type : "text",
        message: message,
        file: file,
        timestamp: new Date().toISOString(),
      },
    });

    // Clear input after sending
    setMessage("");
    setFile(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return "🖼️";
    } else if (fileType.startsWith("video/")) {
      return "🎬";
    } else if (fileType.startsWith("audio/")) {
      return "🎵";
    } else {
      return "📄";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0f1420]">
      {/* Messages area - taking up all available space */}
      <div
        id="scroll-container"
        className="flex-1 overflow-y-auto no-scrollbar"
      >
        <div>
          <div className="flex items-center justify-center p-4 bg-[#0f1420] border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Tin nhắn</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {chats.map((chat, index) => {
            const isCurrentUser = chat.sender.id === member.id;

            return (
              <div
                key={index}
                className={cn(
                  "flex gap-2",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                    {chat.sender.img ? (
                      <img
                        src={chat.sender.img || "/placeholder.svg"}
                        alt={chat.sender.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-medium text-white">
                        {chat.sender.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col max-w-[75%]">
                  {!isCurrentUser && (
                    <span className="text-xs text-gray-400 mb-1">
                      {chat.sender.name}
                    </span>
                  )}

                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isCurrentUser
                        ? "bg-blue-600 text-white rounded-tr-none ml-auto"
                        : "bg-gray-700 text-gray-100 rounded-tl-none"
                    )}
                  >
                    {chat.type !== "text" && chat.file && (
                      <div className="mb-2">
                        <a
                          href={URL.createObjectURL(chat.file)}
                          download={chat.file.name}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded",
                            isCurrentUser ? "bg-blue-700" : "bg-gray-800",
                            "hover:bg-opacity-80 transition-colors"
                          )}
                        >
                          <span>{getFileIcon(chat.file.type)}</span>
                          <span className="text-sm truncate max-w-[150px]">
                            {chat.file.name}
                          </span>
                        </a>
                      </div>
                    )}

                    {chat.message && (
                      <p className="break-words">{chat.message}</p>
                    )}

                    <div className="text-xs mt-1 opacity-70 text-right text-white">
                      {formatTime(chat.timestamp)}
                    </div>
                  </div>
                </div>

                {isCurrentUser && (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-blue-700">
                    {chat.sender.img ? (
                      <img
                        src={chat.sender.img || "/placeholder.svg"}
                        alt={chat.sender.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-medium text-white">
                        {chat.sender.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* preview file if exits */}
      {file && (
        <div className="flex items-center gap-2 p-2 bg-gray-800 border-t border-gray-700 text-white">
          <span>{getFileIcon(file.type)}</span>
          <span className="text-sm truncate max-w-[150px]">{file.name}</span>
        </div>
      )}

      {/* Input area - matching the exact style from the screenshot */}
      <div className="p-2 mt-auto mb-16 border-t border-gray-800">
        <div className="flex items-center gap-2 bg-gray-700 rounded-full px-4 py-2">
          <input
            type="file"
            className="hidden"
            id="file-input"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0]);
              }
            }}
          />

          <label
            htmlFor="file-input"
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <Paperclip className="h-5 w-5" />
          </label>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aa..."
            className="flex-1 bg-transparent border-none text-white placeholder:text-gray-400 focus:outline-none"
          />

          <button
            onClick={handleSend}
            disabled={message.trim() === "" && !file}
            className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <SendHorizontal className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
