
// STTChatbot.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Loader2, User, BookOpen, Briefcase } from 'lucide-react';

/**
 * INSTALLATION STEPS:
 * 1. npm install @xenova/transformers
 * 2. Ensure your bundler (Vite/Webpack) supports Web Workers.
 *    - For Vite: Import with `?worker` suffix works out of the box.
 * 3. Place 'stt-worker.ts' in a known location (e.g. ./workers/stt-worker.ts)
 */

// Import worker - Adjust path as needed
import STTWorker from '../workers/stt-worker.ts?worker';

interface STTChatbotProps {
  onProfileUpdate?: (profile: any) => void;
}

export const STTChatbot: React.FC<STTChatbotProps> = ({ onProfileUpdate }) => {
  // --- State ---
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialWait, setPartialWait] = useState(false); // UI debouncing
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [downloadProgress, setDownloadProgress] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Form State for Demo ---
  const [profile, setProfile] = useState({
    name: '',
    education: '',
    skills: ''
  });

  // --- Refs ---
  const workerRef = useRef<Worker | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // --- Initialization ---
  useEffect(() => {
    // Initialize Worker
    workerRef.current = new STTWorker();

    workerRef.current.onmessage = (event) => {
      const { type, data, error } = event.data;

      if (type === 'ready') {
        setModelStatus('ready');
        setDownloadProgress(null);
      } else if (type === 'download') {
        setModelStatus('loading');
        setDownloadProgress(data); // { status, file, progress, ... }
      } else if (type === 'result') {
        // data = { text: "..." } from pipeline
        if (data?.text) {
             const newText = data.text.trim();
             if(newText) {
                setTranscript(prev => {
                    const updated = prev + " " + newText;
                    // Auto-fill logic (Simple heuristic regex for demo)
                    autoFillProfile(updated);
                    return updated;
                });
             }
        }
        setPartialWait(false);
      } else if (type === 'error') {
        console.error("Worker Error:", error);
        setErrorMsg(error);
        setModelStatus('error');
      }
    };

    // Trigger Model Load
    workerRef.current.postMessage({ type: 'load' });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // --- Auto-fill Logic ---
  const autoFillProfile = (text: string) => {
      const lower = text.toLowerCase();
      
      // Heuristic 1: Name
      // Pattern: "My name is [Name]" or "I am [Name]"
      const nameMatch = text.match(/(?:my name is|i am)\s+([a-z\s]+?)(?=(?:,|\.|and|studying|at|from|$))/i);
      if (nameMatch && nameMatch[1]) {
          setProfile(p => ({ ...p, name: nameMatch[1].trim() }));
      }

      // Heuristic 2: Education
      // Pattern: "Studying [Major] at [College]"
      const eduMatch = text.match(/(?:studying|student of)\s+([a-z\s\.]+)(?=(?:at|in|,|\.|$))/i);
      const collegeMatch = text.match(/at\s+([a-z\s]+(?:university|college|institute|iit|nit)[a-z\s]*)/i);
      
      if (eduMatch) {
          let edu = eduMatch[1].trim();
          if (collegeMatch) edu += " at " + collegeMatch[1].trim();
          setProfile(p => ({ ...p, education: edu }));
      }

      // Heuristic 3: Skills
      // Pattern: "skills are [x, y, z]" or "know [x, y]"
      const skillMatch = text.match(/(?:skills are|know|skilled in)\s+([a-z0-9\s,]+)/i);
      if (skillMatch) {
          setProfile(p => ({ ...p, skills: skillMatch[1].trim() }));
      }
      
      // Propagate updates
      if (onProfileUpdate) onProfileUpdate(profile);
  };

  // --- Audio Handling ---
  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use MediaRecorder for chunking
      // Note: For real-time 'stream' feel with Transformers.js, typically we pass full float32 arrays.
      // A common pattern is using ScriptProcessor or AudioWorklet to get raw Float32 data.
      // However, simplified MediaRecorder with short timeslice works for 'chunked' interactions too, 
      // though converting Blob > ArrayBuffer > AudioBuffer > Float32 is needed.
      
      // Let's use a simpler approach for high compatibility:
      // AudioContext + ScriptProcessor (deprecated but widest support) or AudioWorklet.
      // For this demo, we'll stick to a robust standard: AudioContext.createScriptProcessor
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      let audioBuffer: number[] = [];
      const CHUNK_SIZE = 16000 * 2; // Process every ~2 seconds of audio? 
      // User asked for 500ms latency. 16000 * 0.5 = 8000 samples.
      
      processor.onaudioprocess = (e) => {
          if (!isListening) return; // Guard
          
          const inputData = e.inputBuffer.getChannelData(0);
          // Push to buffer
          audioBuffer.push(...inputData);
          
          // If buffer is large enough, send to worker
          if (audioBuffer.length >= 8000) { // ~500ms
              const chunk = new Float32Array(audioBuffer);
              audioBuffer = []; // Reset
              
              setPartialWait(true);
              workerRef.current?.postMessage({
                  type: 'generate',
                  audio: chunk,
                  language: 'en'
              });
          }
      };

      setIsListening(true);
      
      // Cleanup helper
      // Store ref to close later
      (mediaRecorderRef as any).current = { 
          stop: () => {
              processor.disconnect();
              source.disconnect();
              stream.getTracks().forEach(t => t.stop());
              audioContextRef.current?.close();
          } 
      };

    } catch (err: any) {
      console.error("Mic Error:", err);
      setErrorMsg("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    setIsListening(false);
    if ((mediaRecorderRef as any).current) {
        (mediaRecorderRef as any).current.stop();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 bg-black/90 min-h-screen text-white rounded-xl font-sans">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Voice Genie (Offline)
            </h1>
            <p className="text-gray-400 mt-2">
                Powered by WebAssembly & Transformers.js. 100% Private, 0% Cost.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Voice Controls */}
            <div className="space-y-6">
                 {/* Status Board */}
                 <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                     <div className="flex items-center justify-between mb-2">
                         <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">System Status</h3>
                         <span className={`px-2 py-1 rounded text-xs font-bold ${
                             modelStatus === 'ready' ? 'bg-green-500/20 text-green-300' : 
                             modelStatus === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                         }`}>
                             {modelStatus.toUpperCase()}
                         </span>
                     </div>
                     {modelStatus === 'loading' && downloadProgress && (
                         <div className="space-y-2">
                             <div className="flex justify-between text-xs text-gray-400">
                                 <span>{downloadProgress.file}</span>
                                 <span>{Math.round(downloadProgress.progress || 0)}%</span>
                             </div>
                             <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-blue-500 transition-all duration-300" 
                                    style={{ width: `${downloadProgress.progress || 0}%` }} 
                                 />
                             </div>
                         </div>
                     )}
                     {errorMsg && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
                 </div>

                 {/* Mic Button */}
                 <div className="flex justify-center py-8">
                     <button
                        disabled={modelStatus !== 'ready'}
                        onClick={isListening ? stopRecording : startRecording}
                        className={`
                            relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                            ${modelStatus !== 'ready' ? 'opacity-50 cursor-not-allowed bg-gray-700' : 
                              isListening ? 'bg-red-500/20 text-red-400 ring-4 ring-red-500/20' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}
                        `}
                     >
                         {/* Ripple Effect when listening */}
                         {isListening && (
                             <span className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping" />
                         )}
                         
                         {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                     </button>
                 </div>
                 
                 <p className="text-center text-sm text-gray-500">
                    {isListening ? "Listening... (Speak clearly)" : "Tap microphone to start"}
                 </p>
            </div>

            {/* Right: Transcript & Form */}
            <div className="space-y-6">
                {/* Transcript Box */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 h-48 overflow-y-auto relative">
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {transcript || <span className="text-gray-600 italic">Translation will appear here...</span>}
                    </p>
                    {partialWait && (
                        <div className="absolute bottom-2 right-2">
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Auto-filled Form */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Live Profile</h3>
                    
                    <div className="space-y-3">
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Name" 
                                value={profile.name}
                                readOnly
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <BookOpen className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Education / University" 
                                value={profile.education}
                                readOnly
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Skills" 
                                value={profile.skills}
                                readOnly
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default STTChatbot;
