import React, { useEffect, useState, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { useVoiceGenie } from '../hooks/useVoiceGenie';
import { useVoiceFlow } from '../logic/VoiceFlowMachine';
import { PulsatingMic } from './PulsatingMic';

interface GenieInlineProps {
  onStateChange?: (state: string) => void;
  onPartialUpdate?: (data: any) => void;
  onComplete: (data: any) => void;
  onClose?: () => void;
}

export const GenieInline: React.FC<GenieInlineProps> = ({ onStateChange, onPartialUpdate, onComplete, onClose }) => {
  const { currentState, context, transition, updateContext, config } = useVoiceFlow();
  const [transcript, setTranscript] = useState('');
  const [loadingStatus, setLoadingStatus] = useState<any>(null);

  // Notify parent of state changes (usually to scroll form)
  useEffect(() => {
    onStateChange?.(currentState);
  }, [currentState, onStateChange]);

  // Start the interaction on mount if idle
  useEffect(() => {
    if (currentState === 'IDLE') {
        const timer = setTimeout(() => {
            transition('GREETING');
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [currentState, transition]);
  
  // Handlers for Voice Hook
  const handleVoiceResult = useCallback((text: string, isFinal: boolean) => {
    setTranscript(text);
  }, []);

  const {
    isListening,
    isSpeaking,
    isModelLoading,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    error,
    structureProfile,
  } = useVoiceGenie({
    onResult: handleVoiceResult,
    onError: (err) => console.error(err),
    onLoading: (status) => setLoadingStatus(status)
  });

  // Manual Confirm Logic
  const handleConfirm = useCallback(() => {
    if (currentState.startsWith('ASK_')) {
        const conf = config[currentState as keyof typeof config];
        if (conf) {
            // 1. Extract and sync immediately
            if (conf.extract) {
                 const updates = conf.extract(transcript, context);
                 updateContext(updates);
                 // Notify parent form of updates immediately
                 onPartialUpdate?.(updates);
            }

            // 2. Move to next state
            if (conf.nextState) {
                transition(conf.nextState as any);
            }
        }
    }
  }, [currentState, config, transition, transcript, context, updateContext, onPartialUpdate]);


  // Effect: Handle State Entry Logic
  useEffect(() => {
    if (isModelLoading) return;

    const conf = config[currentState as keyof typeof config];
    if (!conf) return;

    // Reset transcript on new state
    if (currentState.startsWith('ASK_')) {
        setTranscript('');
    }

    // 1. Speak the message
    if (conf.message) {
      stopListening(); 
      
      speak(conf.message, () => {
        // 2. On speech end
        if (currentState === 'GREETING') {
             if (conf.nextState) transition(conf.nextState);
        } 
        else if (currentState === 'RETRY_PHONE') {
            transition('ASK_PHONE'); 
        }
        else if (currentState === 'COMPLETED') {
             // Structure data before completing
             const finalize = async () => {
                 setLoadingStatus({ status: 'transcribing', message: 'Finalizing...' });
                 const structured = await structureProfile(context);
                 setLoadingStatus(null);
                 onComplete(structured || context);
             };
             finalize();
        }
        else if (currentState.startsWith('ASK_')) {
            // Auto-start listening for smoother UX
            startListening();
        }
      });
    }

    // Special Handling for Validation States
    if (currentState.startsWith('VALIDATE_')) {
        const processValidation = async () => {
             if (conf.extract) {
                 const updates = conf.extract(transcript, context);
                 updateContext(updates);
                 onPartialUpdate?.(updates);
             }

             let isValid = true;
             if (conf.validate) {
                 isValid = await conf.validate(transcript);
             }

             if (isValid) {
                 if (conf.nextState) transition(conf.nextState as any);
             } else {
                 if (conf.onFail) {
                     const failMsg = conf.failureMessage || "Sorry, I didn't get that.";
                     speak(failMsg, () => {
                         transition(conf.onFail as any);
                     });
                 }
             }
        };
        processValidation();
    }

  }, [currentState, isModelLoading]); 

  // Cleanup
  useEffect(() => {
      return () => {
          cancelSpeech();
          stopListening();
      }
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-l-2xl shadow-2xl overflow-hidden relative">
       {/* Header */}
       <div className="p-6 pb-2 flex justify-between items-start">
           <div>
               <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Voice Genie</h3>
               <p className="text-xs text-slate-400">Assistant Active</p>
           </div>
           {onClose && (
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                   <X size={16} />
               </button>
           )}
       </div>

       {/* Content */}
       <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
           
           {/* Message */}
           <div className="text-center min-h-[60px] flex items-center justify-center">
                {isModelLoading ? (
                    <span className="text-sm animate-pulse">Initializing...</span>
                ) : loadingStatus?.status === 'transcribing' ? (
                    <div className="flex items-center gap-2 text-purple-300">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    </div>
                ) : (
                    <p className="text-lg font-medium leading-relaxed">
                        {isSpeaking ? (config[currentState as keyof typeof config]?.message || "...") : (config[currentState as keyof typeof config]?.message || "")}
                    </p>
                )}
           </div>

           {/* Mic Orb */}
           <div className="scale-75 transform transition-transform">
               <PulsatingMic 
                    isListening={isListening} 
                    isSpeaking={isSpeaking} 
                    onClick={() => {
                        if (error) startListening();
                        else if(isListening) stopListening(); 
                        else if(!isSpeaking) startListening();
                    }} 
               />
               <p className="text-center mt-4 text-xs text-slate-500">
                    {isListening ? "Tap to stop" : "Tap to speak"}
               </p>
           </div>

           {/* Transcript */}
           <div className="w-full bg-black/20 rounded-xl p-4 min-h-[80px] border border-white/5">
                <p className="text-sm text-center text-slate-300 italic">
                    {transcript || "..."}
                </p>
           </div>

           {/* Confirm Button */}
           <div className="h-10">
               {transcript.length > 0 && !isListening && currentState !== 'COMPLETED' && (
                   <button 
                       onClick={handleConfirm}
                       className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold flex items-center gap-2 transition-all animate-bounce-in"
                   >
                       <Check size={14} /> Confirm
                   </button>
               )}
           </div>

       </div>
    </div>
  );
};
