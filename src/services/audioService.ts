import fetchApi from "../utils/api";

export const saveAudio = async (meetingCode:string, audio: File) => {
    const token = localStorage.getItem("token") || "";
    const formData = new FormData();
    formData.append('file', audio);

    console.log("Uploading audio file...");
    console.log(audio);

    const response = await fetchApi(`audio/${meetingCode}/upload`, {
        method: "POST",
        token: token,
        body: formData,
    });
    console.log(response);
    return response;
}