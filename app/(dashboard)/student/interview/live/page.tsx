"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Camera, Mic, MicOff, Send, Bot, User, RotateCcw } from "lucide-react";

interface Message {
  role: "ai" | "user";
  content: string;
  timestamp: Date;
}

export default function LiveInterviewPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [targetRole, setTargetRole] = useState("");
  const [inputText, setInputText] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ROLES = ["Software Engineer", "Data Analyst", "Product Manager", "Cloud Engineer"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const r = new SR();
        r.continuous = false;
        r.interimResults = false;
        r.lang = "en-US";
        r.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
        };
        r.onerror = () => setIsListening(false);
        r.onend = () => setIsListening(false);
        recognitionRef.current = r;
      }
    }
  }, []);

  // Setup Webcam Feed
  useEffect(() => {
    if (isStarted && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" }, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing webcam:", err);
          alert("Webcam access is required for the visual analysis. Please check your browser permissions and ensure no other application is using the camera.");
        });
    }
    return () => {
      // Cleanup webcam stream when component unmounts
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isStarted]);

  const captureFrames = (): string[] => {
    if (!videoRef.current || !canvasRef.current) return [];
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set canvas to same dimensions as video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Scale down image quality to save bandwidth
    const frame = canvas.toDataURL("image/jpeg", 0.5); 
    return [frame];
  };

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      // Remove any tags like [SCORE: 85] from being spoken out loud
      const cleanText = text.replace(/\[.*?\]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const callLiveAPI = async (history: Message[], mode: "start" | "respond", answer?: string) => {
    setIsLoading(true);
    const images = mode === "respond" ? captureFrames() : [];
    
    try {
      const res = await fetch("/api/interview/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          history: history.map(m => ({ role: m.role, content: m.content })),
          studentAnswer: answer,
          mode,
          images,
        }),
      });
      const data = await res.json();
      const aiMsg: Message = { role: "ai", content: data.response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      speakText(data.response);
      setExchangeCount(prev => prev + 1);
      
      if (data.isComplete) {
        setIsFinished(true);
      }
    } catch (err) {
      const errMsg: Message = {
        role: "ai",
        content: "I encountered a technical issue. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = async () => {
    if (!targetRole) return;
    setIsStarted(true);
    setIsFinished(false);
    setMessages([]);
    setExchangeCount(0);
    await callLiveAPI([], "start");
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");

    await callLiveAPI(updatedMessages, "respond", text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition requires Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const resetInterview = () => {
    window.speechSynthesis?.cancel();
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsStarted(false);
    setMessages([]);
    setInputText("");
    setExchangeCount(0);
    setTargetRole("");
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-extrabold gradient-text">Pro Multimodal Interview</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            The ultimate AI interviewer. It tracks your eye contact via webcam, analyzes your vocal confidence, and tests your technical knowledge simultaneously.
          </p>
        </div>

        <GlassCard>
          <h3 className="text-white font-bold mb-4">Select Your Target Role</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setTargetRole(role)}
                className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all border ${
                  targetRole === role
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <button
            onClick={startInterview}
            disabled={!targetRole}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Start Camera & Microphone →
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-3 md:gap-6 h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] animate-in fade-in duration-300">
      
      {/* Top/Left Column: Video Feed & Metrics */}
      <div className="w-full md:w-80 flex flex-row md:flex-col gap-3 md:gap-4 flex-shrink-0 h-32 md:h-auto">
        <GlassCard className="p-2 md:p-4 relative overflow-hidden flex-shrink-0 w-[45%] md:w-full flex flex-col">
          <div className="flex-1 md:flex-none md:aspect-[4/3] bg-black rounded-lg md:rounded-xl overflow-hidden relative border border-white/10">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-rose-500/80 text-white text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              REC
            </div>
            {isListening && (
              <div className="absolute bottom-1 left-1 right-1 md:bottom-2 md:left-2 md:right-2 bg-indigo-500/80 text-white text-[9px] md:text-xs font-semibold px-1 md:px-2 py-0.5 md:py-1 rounded flex justify-center items-center gap-1 md:gap-2">
                <Mic className="w-3 h-3 animate-pulse" /> <span className="hidden md:inline">Listening...</span>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="hidden md:block">
            <h3 className="text-white font-bold text-sm mt-4 mb-2">Live AI Analysis</h3>
            <p className="text-xs text-slate-400">The AI is monitoring your facial expressions, eye contact, and spoken responses to provide a holistic behavioral score.</p>
          </div>
        </GlassCard>

        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col justify-center">
          <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 md:mb-3">Context</h4>
          <p className="text-[10px] md:text-sm text-indigo-400 font-semibold mb-0 md:mb-1">Target Role:</p>
          <p className="text-white text-[11px] md:text-sm mb-1.5 md:mb-4 line-clamp-2 md:line-clamp-none">{targetRole}</p>
          <p className="text-[10px] md:text-sm text-cyan-400 font-semibold mb-0 md:mb-1">Exchanges:</p>
          <p className="text-white text-sm md:text-xl font-bold">{exchangeCount}</p>
        </div>
      </div>

      {/* Bottom/Right Column: Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Unified AI Recruiter</h2>
              <p className="text-xs text-emerald-400">Multimodal processing active</p>
            </div>
          </div>
          <button
            onClick={resetInterview}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            End Interview
          </button>
        </div>

        {/* Messages */}
        <GlassCard className="flex-1 overflow-y-auto custom-scrollbar mb-4 p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === "ai"
                  ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20"
                  : "bg-gradient-to-br from-cyan-500/30 to-teal-500/30 border border-cyan-500/20"
              }`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4 text-indigo-400" /> : <User className="w-4 h-4 text-cyan-400" />}
              </div>

              <div className={`max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "ai"
                    ? "bg-slate-800/80 text-slate-200 rounded-tl-sm"
                    : "bg-cyan-600/20 border border-cyan-500/20 text-white rounded-tr-sm"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </GlassCard>

        {/* Input */}
        <div className="flex gap-3 items-end">
          <button
            onClick={toggleListening}
            disabled={isFinished}
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isFinished ? "bg-white/[0.02] text-slate-600 cursor-not-allowed" :
              isListening
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08]"
            }`}
            title="Voice input"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isFinished}
              placeholder={isFinished ? "Interview complete." : isListening ? "Listening... start speaking!" : "Click the mic to answer, or type..."}
              className="w-full bg-slate-900/80 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={isLoading || !inputText.trim() || isFinished}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white hover:from-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
      </div>
    </div>
  );
}
