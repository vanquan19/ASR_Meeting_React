import fetchApi from "../utils/api";

export const convertWebMToWav = async (webmBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Tạo một file reader để đọc blob WebM
      const fileReader = new FileReader();
      
      fileReader.onload = async () => {
        try {
          // Lấy dữ liệu dưới dạng ArrayBuffer
          const webmData = fileReader.result as ArrayBuffer;
          
          // Tạo AudioContext để xử lý âm thanh
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Giải mã dữ liệu WebM
          const audioBuffer = await audioContext.decodeAudioData(webmData);
          
          // Tạo WAV từ audio buffer
          const wavBlob = audioBufferToWav(audioBuffer);
          
          resolve(wavBlob);
        } catch (error) {
          console.error('Error converting WebM to WAV:', error);
          reject(error);
        }
      };
      
      fileReader.onerror = (error) => {
        reject(new Error('File reading failed'));
      };
      
      fileReader.readAsArrayBuffer(webmBlob);
    });
  };
  
  // Hàm chuyển đổi AudioBuffer sang WAV Blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferData = new ArrayBuffer(length);
    const view = new DataView(bufferData);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;
  
    // Lấy dữ liệu từ các kênh
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
  
    // Viết WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
  
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this demo)
  
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // chunk length
  
    // Viết dữ liệu PCM
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i])); // clamp
        const val = sample < 0 ? sample * 32768 : sample * 32767; // convert to 16-bit
        view.setInt16(pos, val, true);
        pos += 2;
      }
    }
  
    // Tạo Blob từ dữ liệu WAV
    return new Blob([view], { type: 'audio/wav' });
  
    // Helper functions
    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
  
    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  };



export const saveAudio = async (meetingCode:string, audio: File) => {
    const token = localStorage.getItem("token") || "";
    const formData = new FormData();
    formData.append('file', audio);

    console.log("Uploading audio file...");
    console.log(audio);

    const response = await fetchApi(`meetings/${meetingCode}/upload-audio`, {
        method: "POST",
        token: token,
        body: formData,
    });
    console.log(response);
    return response;
}