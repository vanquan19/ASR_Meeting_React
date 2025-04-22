import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { createContext, useContext, useEffect, useState } from "react";

const SocketContext = createContext<WsContextType | null>(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
};

import { ReactNode } from "react";
import { SignalMessage, WsContextType } from "../interface/websocket";

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = (props: SocketProviderProps) => {
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Client | null>(null);
  useEffect(() => {
    const ws = new SockJS(`${import.meta.env.VITE_WS_URL}`);
    const client = new Client({
      webSocketFactory: () => ws,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      debug: (str) => {
        console.log(str);
      },
      onConnect: () => {
        console.log("Connected to WebSocket");
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers.message);
        setError("Lỗi kết nối: " + frame.headers.message);
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
      },
    });

    setSocket(client);
    client.activate();

    return () => {
      if (client.connected) {
        client.deactivate();
      }
      console.log("WebSocket connection closed");
    };
  }, []);

  console.log("socket current", socket);
  const sendSignal = (signal: SignalMessage, meetingCode: string) => {
    if (socket) {
      socket.publish({
        destination: `/app/signal/${meetingCode}`,
        body: JSON.stringify(signal),
      });
    } else {
      console.warn("Cannot send signal: WebSocket not connected");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socket,
        sendSignal,
        error,
        setError,
      }}
      {...props}
    >
      {props.children}
    </SocketContext.Provider>
  );
};
