import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { createContext, useContext, useMemo } from "react";

const SocketContext = createContext<Client | null>(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
};

import { ReactNode } from "react";

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = (props: SocketProviderProps) => {
  const socket = useMemo(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      debug: (str) => {
        console.log("STORM", str);
      },
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log("STOMP connected");
    };

    client.onStompError = (frame) => {
      console.error("STOMP error", frame);
    };

    client.activate();
    return client;
  }, []);

  return (
    <SocketContext.Provider value={socket} {...props}>
      {props.children}
    </SocketContext.Provider>
  );
};
