import fetchApi from "../utils/api";

export const exportFileWords = async (meetingCode: string) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi(`export/docx/${meetingCode}`, {
        method: "POST",
        token: token,
    });
    return response;
}

export const exportFilePDF = async (meetingCode: string) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi(`export/pdf/${meetingCode}`, {
        method: "POST",
        token: token,
    });
    return response;
}

export const saveFileWords = async (meetingCode: string, fileContent: string) => {
    try {
      const response = await fetchApi(`export/docx/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        token: localStorage.getItem('token') || '',
        body: JSON.stringify({ meetingCode, fileContent }),
      })
      return response
    } catch (error) {
      console.error("Error saving Word file:", error)
      return { code: 500, message: "Error saving Word file" }
    }
  }