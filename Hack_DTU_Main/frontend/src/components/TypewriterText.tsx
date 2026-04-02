import { useState, useEffect, useMemo } from 'react';

interface TypewriterTextProps {
  text: string | string[];
  speed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;
  showCursor?: boolean;
  className?: string;
}

export const TypewriterText = ({
  text,
  speed = 80,
  deleteSpeed = 50,
  pauseDuration = 2000,
  loop = false,
  showCursor = true,
  className = '',
}: TypewriterTextProps) => {
  const phrases = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const [displayText, setDisplayText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, speed + Math.random() * 50);
      } else if (phrases.length > 1 || loop) {
        timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, deleteSpeed);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex, phrases, speed, deleteSpeed, pauseDuration, loop]);

  useEffect(() => {
    setDisplayText('');
    setPhraseIndex(0);
    setIsDeleting(false);
  }, [text]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <span className="animate-cursor-blink ml-0.5 font-light text-primary">|</span>
      )}
    </span>
  );
};

export default TypewriterText;
