import fetchApi from "../utils/api";


interface MeetingType {
  code: number;
  message: string;
  result?: [];
}

export const getAllMeetingForUser: (userId:string) => Promise<MeetingType> = async (userId) => {
    const token = localStorage.getItem('token') || '';

    const response = await fetchApi("meetings/" + userId, {
        method: "GET",
        token: token,
    });
    console.log(response);
    return response;

}