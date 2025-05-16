export const speechToText = async (audio: File) => {
    const token = localStorage.getItem('token') || '';
    const formData = new FormData();
    formData.append('audio', audio);
    const response = await fetch("http://127.0.0.1:5000/transcribe", {
        method: "POST",
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
    });
    return response;
}