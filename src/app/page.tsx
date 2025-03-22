"use client";
import { useState, useRef } from "react";

export default function Home() {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string>("");
  const [textResponse, setTextResponse] = useState<string>("");  // GPTからのテキストレスポンス
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // 🔹 mediaRecorder を useRef で管理
  const audioChunksRef = useRef<Blob[]>([]); // 🔹 音声データを格納
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    // 🔹 Ref に mediaRecorder を保存
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      try {
        console.log("Sending request to Django...");
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "audio.webm");

        const response = await fetch("http://127.0.0.1:8000/api/transcribe/", {
          method: "POST",
          body: formData,
        });

        console.log("Server Response Status:", response.status);
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const data: { audio_url: string; text: string } = await response.json();
        console.log("Response:", data);

        if (!data.audio_url) throw new Error("audio_url is missing in response");

        // テキスト更新
        setTextResponse(data.text);

        // 古い音声を停止してから新しい音声をセット
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        // 音声のURLを設定
        const completeAudioURL = `http://127.0.0.1:8000${data.audio_url}`;
        setAudioURL(completeAudioURL);

        // 音声を再生
        audioRef.current = new Audio(completeAudioURL);
        audioRef.current.load();
        audioRef.current.play()
          .then(() => console.log("Audio is playing"))
          .catch((error) => console.error("Audio play error:", error));
        // 🔹 音声 URL とテキストをリセット
        setAudioURL("");

      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">音声アシスタント ソフィア</h1>

      {textResponse && (
        <div className="mt-6 flex items-start space-x-4">
          {/* AI の画像 (アイコンの場合) */}
          {/* <img src="/ai_avatar.png" alt="AI Avatar" className="w-16 h-16 rounded-full shadow-lg" /> */}

          {/* 吹き出し */}
          {/* <div className="bg-white shadow-md rounded-lg p-4 max-w-lg relative">
            <p className="text-gray-700 font-semibold">AI:</p>
            <p className="text-gray-900 mt-2">{textResponse}</p> */}

            {/* 吹き出しの三角形 */}
            {/* <div className="absolute top-4 left-[-10px] w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"></div> */}
          {/* </div> */}

          {/* 立ち絵（左側に表示） */}
          <div className="flex-shrink-0 w-32 md:w-48">
            <img src="/ai_avatar.png" alt="AI Character" className="w-full" />
          </div>

          {/* 吹き出し（右側に表示） */}
          <div className="bg-white shadow-md rounded-lg p-4 max-w-lg relative">
            <p className="text-gray-700 font-semibold">ソフィア:</p>
            <p className="text-gray-900 mt-2">{textResponse}</p>

            {/* 🔹 吹き出しの三角形（キャラの口元に向ける） */}
            <div className="absolute top-6 left-[-10px] w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"></div>
          </div>
        </div>
      )}
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-lg text-white font-semibold transition ${
          recording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {recording ? "録音停止" : "お話しする"}
      </button>
    </div>
  );
}