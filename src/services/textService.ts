import fetchApi from "../utils/api";

export const exportFileWords = async (meetingCode: string) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi(`export/docx/${meetingCode}`, {
        method: "POST",
        token: token,
    });
    console.log(response);
    return response;
}

export const exportFilePDF = async (meetingCode: string) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi(`export/pdf/${meetingCode}`, {
        method: "POST",
        token: token,
    });
    console.log(response);
    return response;
}