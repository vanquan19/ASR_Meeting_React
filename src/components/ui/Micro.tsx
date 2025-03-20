import { useState, useEffect, useRef } from "react";

interface AudioMeterProps {
  isMicOn: boolean;
}

const AudioMeter: React.FC<AudioMeterProps> = ({ isMicOn }) => {
  const [volume, setVolume] = useState(0);
  const audioRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioRef.current = stream;
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; // Điều chỉnh độ nhạy
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setVolume(average / 255); // Chuẩn hóa giá trị về 0 - 1
          animationFrameId = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (error) {
        console.error("Lỗi khi truy cập microphone:", error);
      }
    };

    const stopMic = () => {
      if (audioRef.current) {
        audioRef.current.getTracks().forEach((track) => track.stop());
        audioRef.current = null;
      }
      setVolume(0);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };

    if (isMicOn) {
      startMic();
    } else {
      stopMic();
    }

    return () => stopMic();
  }, [isMicOn]);

  return (
    <div className="w-full">
      <div className="w-full h-1 bg-gray-200 rounded-lg mt-2">
        <div
          className="h-full bg-green-500 rounded-lg transition-all duration-100"
          style={{ width: `${volume * 100}%` }}
        />
      </div>
    </div>
  );
};

export default AudioMeter;
