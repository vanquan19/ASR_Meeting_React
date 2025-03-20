import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface JoinRoomRequest {
  meetingCode: string;
}

export interface Notification {
  message: string;
}

export interface MemberResponse {
  employeeCode: string;
  name: string;
  active: boolean;
  // Add other member properties as needed
}

class WebSocketService {
  private client: Client | null = null;
  private meetingCode: string | null = null;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connect(onConnect: () => void, onError: (error: any) => void): void {
    this.client = new Client({
      webSocketFactory: () => new SockJS("/ws"), // Adjust the endpoint as needed
      connectHeaders: {
        Authorization: `Bearer ${this.token}`,
      },
      debug: (str) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("Connected to WebSocket");
        onConnect();
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
        onError(frame);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error", event);
        onError(event);
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.meetingCode = null;
    }
  }

  joinRoom(
    meetingCode: string,
    onNotification: (notification: Notification) => void,
    onMembersUpdate: (members: MemberResponse[]) => void,
    onError: (error: Notification) => void
  ): void {
    if (!this.client || !this.client.connected) {
      console.error("WebSocket not connected");
      return;
    }

    this.meetingCode = meetingCode;

    // Subscribe to meeting notifications
    this.client.subscribe(
      `/topic/meeting/${meetingCode}`,
      (message: IMessage) => {
        const notification = JSON.parse(message.body) as Notification;
        onNotification(notification);
      }
    );

    // Subscribe to active members updates
    this.client.subscribe(
      `/topic/meeting/${meetingCode}/members`,
      (message: IMessage) => {
        const members = JSON.parse(message.body) as MemberResponse[];
        onMembersUpdate(members);
      }
    );

    // Subscribe to personal active members update
    this.client.subscribe(`/user/queue/active-members`, (message: IMessage) => {
      const members = JSON.parse(message.body) as MemberResponse[];
      onMembersUpdate(members);
    });

    // Subscribe to errors
    this.client.subscribe("/user/queue/errors", (message: IMessage) => {
      const error = JSON.parse(message.body) as Notification;
      onError(error);
    });

    // Send join room request
    this.client.publish({
      destination: "/app/join",
      body: JSON.stringify({ meetingCode }),
    });
  }

  leaveRoom(): void {
    if (!this.client || !this.meetingCode) {
      return;
    }

    // Unsubscribe from all topics
    this.client.unsubscribe(`/topic/meeting/${this.meetingCode}`);
    this.client.unsubscribe(`/topic/meeting/${this.meetingCode}/members`);
    this.client.unsubscribe("/user/queue/active-members");
    this.client.unsubscribe("/user/queue/errors");

    // You might want to send a leave room message to the server
    // this.client.publish({
    //   destination: '/app/leave',
    //   body: JSON.stringify({ meetingCode: this.meetingCode }),
    // });

    this.meetingCode = null;
  }
}

export default WebSocketService;
