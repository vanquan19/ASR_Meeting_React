import { ChatType } from "../interface/chat";
import fetchApi from "../utils/api";

export const saveChat = async (data: ChatType) => {
  const formData = new FormData();
  formData.append("sender", data.sender as string);
  formData.append("message", data.message as string);
  formData.append("receive", data.receiver as string);
  formData.append("type", data.type as string);
  if (data.file) {
    formData.append("file", data.file as File, data.fileName);
  }
  if (data.fileName) {
    formData.append("fileName", data.fileName as string);
  }
  if (data.timestamp) {
    formData.append("timestamp", data.timestamp as string);
  }
  const response = await fetchApi(
    `message`,
    {
      method: "POST",
      body: formData,
      token: localStorage.getItem("token") || "",
    }
  );

  if(response.code !== 200) {
    throw new Error(`Error: ${response.message}`);
  }
  return response;
}

export const getChatToMeeting = async (meetingCode: string) => {
  const response = await fetchApi(
    `message/all?meetingCode=${meetingCode}`,
    {
      method: "GET",
      token: localStorage.getItem("token") || "",
    }
  );

  if(response.code !== 200) {
    throw new Error(`Error: ${response.message}`);
  }
  return response;
}

export const updateFileChat = async (
  file: File,
) =>{
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchApi(
    `chat/file`,
    {
      method: "POST",
      body: formData,
    }
  );

  if(response.code !== 200) {
    throw new Error(`Error: ${response.message}`);
  }
  return response;
}

export const getFileChat = async (name: string) => {
  const response = await fetchApi(
    `chat/file/${name}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if(response.code !== 200) {
    throw new Error(`Error: ${response.message}`);
  }
  return response;
}