import fetchApi from "../utils/api";

export const saveAudio = async (meetingCode: string, audio: File) => {
  const token = localStorage.getItem("token") || "";
  const formData = new FormData();
  formData.append("file", audio);

  const response = await fetchApi(`audio/${meetingCode}/upload`, {
    method: "POST",
    token: token,
    body: formData,
  });
  return response;
};

export const mergeAudio = async (meetingCode: string) => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi(`export/merge/${meetingCode}`, {
    method: "POST",
    token: token,
  });
  return response;
};
