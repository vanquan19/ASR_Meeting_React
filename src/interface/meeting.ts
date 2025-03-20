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
}