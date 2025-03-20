"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "../lib/utils";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "file";
  fileUrl?: string;
  fileName?: string;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "John Doe",
      content: "Hello everyone! Welcome to the meeting.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      type: "text",
    },
    {
      id: "2",
      sender: "Jane Smith",
      content: "I've prepared a presentation for today.",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      type: "text",
    },
    {
      id: "3",
      sender: "Jane Smith",
      content: "Here's the document I mentioned.",
      timestamp: new Date(Date.now() - 1000 * 60 * 9),
      type: "file",
      fileUrl: "#",
      fileName: "presentation.pdf",
    },
    {
      id: "4",
      sender: "Alex Johnson",
      content: "I've taken a screenshot of the issue we discussed.",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      type: "text",
    },
    {
      id: "5",
      sender: "Alex Johnson",
      content: "",
      timestamp: new Date(Date.now() - 1000 * 60 * 4),
      type: "image",
      fileUrl: "/placeholder.svg?height=300&width=400",
      fileName: "screenshot.png",
    },
    {
      id: "6",
      sender: "You",
      content: "Thanks for sharing! I'll take a look.",
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      type: "text",
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "files">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const message: Message = {
      id: Date.now().toString(),
      sender: "You",
      content: newMessage,
      timestamp: new Date(),
      type: "text",
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter files from messages
  const files = messages.filter(
    (msg) => msg.type === "file" || msg.type === "image"
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs
        defaultValue="chat"
        onValueChange={(value) => setActiveTab(value as "chat" | "files")}
      >
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1">
              Chat
            </TabsTrigger>
            <TabsTrigger value="files" className="flex-1">
              Files
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="chat"
          className="flex-1 flex flex-col h-[calc(100%-50px)]"
        >
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col",
                    message.sender === "You" ? "items-end" : "items-start"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {message.sender}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.sender === "You"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.type === "text" && (
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}

                    {message.type === "image" && (
                      <div>
                        <img
                          src={message.fileUrl || "/placeholder.svg"}
                          alt="Shared image"
                          className="rounded-md max-w-full max-h-[300px] object-contain"
                        />
                        <p className="text-xs mt-1">{message.fileName}</p>
                      </div>
                    )}

                    {message.type === "file" && (
                      <div className="flex items-center gap-2 bg-background/50 rounded p-2">
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
                          className="lucide lucide-file"
                        >
                          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                        </svg>
                        <span className="text-sm">{message.fileName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] resize-none"
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  type="button"
                >
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
                    className="lucide lucide-paperclip"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  type="button"
                >
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
                    className="lucide lucide-image"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSendMessage}
                  disabled={newMessage.trim() === ""}
                >
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
                    className="lucide lucide-send"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files" className="flex-1 h-[calc(100%-50px)]">
          <ScrollArea className="h-full p-4">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4 opacity-50"
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                </svg>
                <p>No files shared yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Shared Files</h3>
                <div className="grid gap-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                    >
                      {file.type === "image" ? (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                          <img
                            src={file.fileUrl || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-file"
                          >
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Shared by {file.sender} • {formatTime(file.timestamp)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          className="lucide lucide-download"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
