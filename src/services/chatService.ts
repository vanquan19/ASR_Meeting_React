import fetchApi from "../utils/api";

export const getChatToMeeting = async (meetingCode: string) => {
  const response = await fetchApi(
    `meeting/chat/${meetingCode}`
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