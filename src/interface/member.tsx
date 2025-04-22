import { UserType } from "./auth";

export interface MemberType {
  id?: number;
  name: string;
  employeeCode: string;
  email: string;
  img: string;
  meetingRole?: string;
  peerId: string;
  user?: UserType;
  active?: boolean;
}
