import { MeetingMemberType, MeetingResponse, MeetingType } from "../interface/meeting";
import fetchApi from "../utils/api";




export const getAllMeetingForUser: (userId:string) => Promise<MeetingResponse> = async (userId) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi("meetings/" + userId, {
        method: "GET",
        token: token,
    });
    console.log(response);
    return response;

}

export const getAllMeeting: () => Promise<MeetingResponse> = async () => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi("meetings", {
        method: "GET",
        token: token,
    });
    console.log(response);
    return response;
}


export const createMeeting: ({
  meetingCode,
  roomId,
  departmentId,
  name,
  startTime,
  endTime,
}:
{
    meetingCode: string;
    roomId: string;
    departmentId: string;
    name: string;
    startTime: string;
    endTime: string;
}) => Promise<{code: number, message?:string, result:MeetingType}> = async ({ meetingCode, roomId, departmentId, name, startTime, endTime }) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi("meetings/create", {
        method: "POST",
        token: token,
        body: JSON.stringify({ meetingCode, roomId, departmentId, name, startTime, endTime }),
    });
    return response;
}

export const updateMeeting: ({
  id,
  meetingCode,
  roomId,
  departmentId,
  name,
  startTime,
  endTime,
}:
{
    id: number; 
    meetingCode: string;
    roomId: string;
    departmentId: string;
    name: string;
    startTime: string;
    endTime: string;
}) => Promise<{code: number, message?:string}> = async ({ id, meetingCode, roomId, departmentId, name, startTime, endTime }) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi("meetings/update", {
        method: "PUT",
        token: token,
        body: JSON.stringify({ id, meetingCode, roomId, departmentId, name, startTime, endTime }),
    });
    console.log(response);
    return response;
}

export const addMemberToMeeting: ({
  meetingId,
  userId,
  meetingRole,
}:
{
    meetingId: number;
    userId: number;
    meetingRole: string;
}) => Promise<{code: number, result: MeetingType, message:string}> = async ({ meetingId, userId, meetingRole }) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi("members/add", {
        method: "POST",
        token: token,
        body: JSON.stringify({ meetingId, userId, meetingRole }),
    });
    console.log(response);
    return response;
}



export const deleteMemberInMeeting: ({
  meetingId,
  userId,
}:
{
    meetingId: number;
    userId: number;
}) => Promise<{code: number, message?:string}> = async ({ meetingId, userId }) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi("members/delete", {
        method: "DELETE",
        token: token,
        body: JSON.stringify({ meetingId, userId }),
    });
    console.log(response);
    return response;
}
export const updateMemberInMeeting: ({
  meetingId,
  userId,
  meetingRole,
}:
{
    meetingId: number;
    userId: number;
    meetingRole: string;
}) => Promise<{code: number, message?:string}> = async ({ meetingId, userId, meetingRole }) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi("members/update", {
        method: "PUT",
        token: token,
        body: JSON.stringify({ meetingId, userId, meetingRole }),
    });
    console.log(response);
    return response;
}

export const getAllMemberInMeeting: (id: number, search?: string) => Promise<{
    code: number;
    message?: string;
    result: MeetingMemberType[];
}> = async (id, search) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi(`members/${id}${search && "?search="+search}` , {
        method: "GET",
        token: token,
    });
    console.log(response);
    return response;
}