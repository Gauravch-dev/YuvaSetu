import React, { useEffect, useState, useCallback } from 'react';
import { X, SkipForward, Check } from 'lucide-react';
import { useVoiceGenie } from '../hooks/useVoiceGenie';
import { useVoiceFlow, FLOW_CONFIG } from '../logic/VoiceFlowMachine';
import { PulsatingMic } from './PulsatingMic';

interface GenieOverlayProps {
  onClose: () => void;
  onComplete: (data: any) => void;
}

export const GenieOverlay: React.FC<GenieOverlayProps> = ({ onClose, onComplete }) => {
  const { currentState, context, transition, updateContext, config } = useVoiceFlow();
  const [transcript, setTranscript] = useState('');
  
  // Start the interaction on mount
  useEffect(() => {
    if (currentState === 'IDLE') {
        // Small delay to ensure UI is ready and feels natural
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

  const handleConfirm = useCallback(() => {
    // Determine action based on current state
    if (currentState.startsWith('ASK_')) {
        const conf = config[currentState as keyof typeof config];
        if (conf) {
            // Extract data if configured (e.g. for SKILLS, EDUCATION where we might not have a VALIDATE state)
            if (conf.extract) {
                 // We use the current 'transcript' state which holds the user's input
                 const updates = conf.extract(transcript, context);
                 updateContext(updates);
            }

            if (conf.nextState) {
                transition(conf.nextState as any);
            }
        }
    }
  }, [currentState, config, transition, transcript, context, updateContext]);

  const [loadingStatus, setLoadingStatus] = useState<any>(null);

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
    // onSilence: handleConfirm, // No auto-confirm on silence
    onError: (err) => console.error(err),
    onLoading: (status) => setLoadingStatus(status)
  });

  // Effect: Handle State Entry Logic
  useEffect(() => {
    // Wait for model to load before doing anything
    if (isModelLoading) return;

    const conf = config[currentState as keyof typeof config];
    if (!conf) return;

    // 0. Reset transcript on new state
    if (currentState.startsWith('ASK_')) {
        setTranscript('');
    }

    // 1. Speak the message
    if (conf.message) {
      stopListening(); // Don't listen while genie speaks
      speak(conf.message, () => {
        // 2. On speech end
        
        // If it's a greeting, auto-move
        if (currentState === 'GREETING') {
             transition('ASK_NAME');
        } 
        // If it's a RETRY state, we go back to asking but user must initiate listen
        else if (currentState === 'RETRY_PHONE') {
            transition('ASK_PHONE'); 
        }
        else if (currentState === 'COMPLETED') {
             // Structure data before completing
             const finalize = async () => {
                 setLoadingStatus({ status: 'transcribing', message: 'Structuring Profile...' });
                 const structured = await structureProfile(context);
                 setLoadingStatus(null);
                 // If structure failed, fallback to raw context, but logic below expects structured or we map in form?
                 // Actually MultiStepForm expects { personalInfo:..., education:..., skills:... }
                 // Our backend returns exactly that structure!
                 // So we pass 'structured' or 'context' if failed.
                 
                 // If structured is null, we pass context and let MultiStepForm do its best (which we already fixed to map simple fields)
                 onComplete(structured || context);
             };
             finalize();
        }
        // REMOVED: Auto-start listening
        // else if (currentState.startsWith('ASK_')) {
        //      startListening();
        // }
      });
    }

    // Special Handling for Validation States
    if (currentState.startsWith('VALIDATE_')) {
        const processValidation = async () => {
             // 1. Extract and Update Context
             if (conf.extract) {
                 const updates = conf.extract(transcript, context);
                 updateContext(updates);
             }

             // 2. Validate
             let isValid = true;
             if (conf.validate) {
                 isValid = await conf.validate(transcript);
             }

             if (isValid) {
                 if (conf.nextState) transition(conf.nextState as any);
             } else {
                 if (conf.onFail) {
                     // Speak failure message
                     const failMsg = conf.failureMessage || "Sorry, I didn't get that.";
                     speak(failMsg, () => {
                         transition(conf.onFail as any);
                     });
                 }
             }
        };
        processValidation();
    }

  }, [currentState, isModelLoading]); // Run when state changes or model finishes loading

  // Cleanup
  useEffect(() => {
      return () => {
          cancelSpeech();
          stopListening();
      }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 transition-opacity duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 p-8">
         <button onClick={onClose} className="text-white/50 hover:text-white">
             <X size={32} />
         </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl space-y-12">
          
          {/* Genie's Message (Top) */}
          <div className="min-h-[100px] flex items-end justify-center">
             <h2 className="text-2xl md:text-3xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 animate-pulse">
                {isModelLoading ? (
                    <div className="flex flex-col items-center gap-4">
                        <span>Initializing Voice Engine...</span>
                    </div>
                ) : loadingStatus?.status === 'transcribing' ? (
                     <div className="flex flex-col items-center gap-4">
                        <span>Processing Audio...</span>
                    </div>
                ) : error ? (
                    <span className="text-red-400">
                        {error === 'network' ? 'Network Error. Please check your connection.' : 
                         error === 'not-allowed' ? 'Microphone Access Denied.' : error}
                    </span>
                ) : (
                    isSpeaking ? (config[currentState as keyof typeof config]?.message || "Processing...") : (config[currentState as keyof typeof config]?.message || "")
                )}
             </h2>
          </div>

          {/* Orb */}
          <div className="py-8">
              {isModelLoading ? (
                  <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-purple-500 animate-spin" />
              ) : (
                <>
                <PulsatingMic 
                    isListening={isListening} 
                    isSpeaking={isSpeaking} 
                    onClick={() => {
                    if (error) {
                        startListening(); // Retry on error
                    } else {
                        if(isListening) stopListening(); // Manual Stop
                        else if(!isSpeaking) startListening(); // Manual Start
                    }
                }} />
                {error && <p className="text-white/50 text-sm text-center mt-4">Tap mic to retry</p>}
                {!isListening && !isSpeaking && !error && <p className="text-white/30 text-sm text-center mt-4">Tap to speak</p>}
                </>
              )}
          </div>

          {/* User's Transcript (Bottom) */}
          <div className="min-h-[120px] w-full bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
             <p className="text-xl md:text-2xl text-center text-white/90 font-medium leading-relaxed">
                 {isModelLoading ? 
                    <span className="text-white/30 italic">Downloading AI Model...</span> :
                    (transcript || <span className="text-white/30 italic">...</span>)
                 }
             </p>
          </div>
      </div>

      {/* Controls */}
      <div className="h-24 w-full flex items-center justify-center space-x-6">
          {!isModelLoading && currentState !== 'COMPLETED' && (
              <>
                {transcript.length > 0 && !isListening && (
                <button 
                  onClick={() => handleConfirm()} // Manual Confirm
                  className="px-8 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 flex items-center gap-2 transition-all animate-fade-in"
                >
                    <Check size={20} /> Confirm
                </button>
                )}
              </>
          )}
      </div>
    </div>
  );
};
