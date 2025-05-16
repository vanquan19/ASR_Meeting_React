import { UserType } from "./auth";

export interface Notification {
  id: string;
  sender: UserType | string;
  receiver?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  notificationId?: string;
}