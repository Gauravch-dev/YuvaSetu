import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface PulsatingMicProps {
  isListening: boolean;
  isSpeaking: boolean;
  onClick?: () => void;
}

export const PulsatingMic: React.FC<PulsatingMicProps> = ({
  isListening,
  isSpeaking,
  onClick,
}) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Pulse Rings - Only active when listening */}
      {isListening && (
        <>
          <div className="absolute w-32 h-32 bg-blue-500/30 rounded-full animate-ping" />
          <div className="absolute w-40 h-40 bg-purple-500/20 rounded-full animate-pulse delay-75" />
        </>
      )}

      {/* Speaking Indicator (Glow) */}
      {isSpeaking && (
          <div className="absolute w-28 h-28 bg-green-500/40 rounded-full animate-pulse" />
      )}

      {/* Main Orb */}
      <button
        onClick={onClick}
        className={`
          relative z-10 w-24 h-24 rounded-full flex items-center justify-center
          transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]
          ${isListening 
            ? 'bg-gradient-to-br from-blue-600 to-purple-700 scale-110 shadow-blue-500/50' 
            : isSpeaking 
                ? 'bg-gradient-to-br from-green-500 to-teal-600 scale-105'
                : 'bg-gray-800 hover:bg-gray-700'}
        `}
      >
        {isListening ? (
          <Mic className="w-10 h-10 text-white animate-bounce" />
        ) : (
          <Mic className="w-10 h-10 text-gray-300" />
        )}
      </button>
    </div>
  );
};
