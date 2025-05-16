import { MeetingMemberType, MeetingResponse, MeetingType } from "../interface/meeting";
import fetchApi from "../utils/api";




export const getAllMeetingForUser: (userId:string, status?: string) => Promise<MeetingResponse> = async (userId, status) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi("meetings/" + (status ? `by-status-for-user?status=${status}` : userId), {
        method: "GET",
        token: token,
    });
    return response;

}

export const getAllMeeting: (
    status?: string,
) => Promise<MeetingResponse> = async (
    status?: string
) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi(`meetings${status ? `/by-status?status=${status}` : ''}`, {
        method: "GET",
        token: token,
    });
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
    return response;
}

export const deleteMeeting: (id: number) => Promise<{code: number, message?:string}> = async (id) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi("meetings/" + id, {
        method: "DELETE",
        token: token,
    });
    return response;
}

export const addMemberToMeeting: ({
  meetingId,
  userId,
  meetingRole,
  forceAdd,
}:
{
    meetingId: number;
    userId: number;
    meetingRole: string;
    forceAdd?: boolean;
}) => Promise<{code: number, result: MeetingMemberType, message:string}> = async ({ meetingId, userId, meetingRole, forceAdd = false }) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi("members/add", {
        method: "POST",
        token: token,
        body: JSON.stringify({ meetingId, userId, meetingRole, forceAdd}),
    });
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
    const response = await fetchApi("members/remove", {
        method: "DELETE",
        token: token,
        body: JSON.stringify({ meetingId, userId }),
    });
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
}) => Promise<{code: number, message?:string, result: MeetingMemberType}> = async ({ meetingId, userId, meetingRole }) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi("members/update", {
        method: "PUT",
        token: token,
        body: JSON.stringify({ meetingId, userId, meetingRole }),
    });
    return response;
}

export const getAllMemberInMeeting: (id: number, search?: string) => Promise<{
    code: number;
    message?: string;
    result: MeetingMemberType[];
}> = async (id, search) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi(`members/${id}${search ? "?search="+search : ""}` , {
        method: "GET",
        token: token,
    });
    return response;
}

export const postponeMeeting: ({
    meetingId,
    startTime,
    endTime
}: {
    meetingId: number;
    startTime: string;
    endTime: string;
}) => Promise<{code: number, message?:string}> = async ({ meetingId, startTime, endTime }) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi("meetings/postpone/" + meetingId, {
        method: "POST",
        token: token,
        body: JSON.stringify({ newStartTime: startTime, newEndTime: endTime }),
    });
    return response;
}

export const cancelMeeting : ({
    meetingId,
    reason
}: {
    meetingId: number;
    reason: string;
}) => Promise<{code: number, message?:string}> = async ({ meetingId, reason }) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi("meetings/cancel", {
        method: "POST",
        token: token,
        body: JSON.stringify({meetingId: meetingId, cancelReason: reason }),
    });
    return response;
}