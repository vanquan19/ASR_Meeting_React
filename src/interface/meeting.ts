import { UserType } from "./auth";
import { DepartmentType } from "./department";
import { RoomType } from "./room";


export interface MeetingType  {
    id: number;
    name: string;
    meetingCode: string;
    startTime: string;
    endTime: string;
    status: string;
    room: RoomType;
    department: DepartmentType;
    count?: number;
}

export interface MeetingResponse {
    code: number;
    message?: string;
    result: MeetingType[];
}

export interface RequestAddMember {
    meetingId: number;
    userId: number;
    meetingRole: string;
  }

  export interface MeetingMemberType {
    id: number;
    user: UserType;
    meeting: MeetingType;
    meetingRole: string;
    active: boolean;
    warning: boolean;
  }