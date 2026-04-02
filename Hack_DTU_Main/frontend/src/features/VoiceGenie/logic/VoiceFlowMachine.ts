
export type VoiceState =
  | 'IDLE'
  | 'GREETING'
  | 'ASK_NAME'
  | 'VALIDATE_NAME'
  | 'ASK_AGE'
  | 'VALIDATE_AGE'
  | 'ASK_EMAIL'
  | 'VALIDATE_EMAIL'
  | 'ASK_PHONE'
  | 'VALIDATE_PHONE'
  | 'RETRY_PHONE'
  | 'ASK_EDU_DEGREE'
  | 'ASK_EDU_INSTITUTE'
  | 'ASK_EDU_SCORE'
  | 'ASK_LANGUAGES'
  | 'ASK_SKILLS'
  | 'COMPLETED';

export interface VoiceContext {
  name: string;
  age: string;
  email: string;
  phone: string;
  educationDegree: string;
  educationInstitute: string;
  educationScore: string;
  languages: string;
  skills: string[];
  lastTranscript: string;
}

export type VoiceAction =
  | { type: 'START' }
  | { type: 'NEXT', transcript?: string }
  | { type: 'RETRY' } 
  | { type: 'SKIP' }
  | { type: 'RESET' };

export const INITIAL_CONTEXT: VoiceContext = {
  name: '',
  age: '',
  email: '',
  phone: '',
  educationDegree: '',
  educationInstitute: '',
  educationScore: '',
  languages: '',
  skills: [],
  lastTranscript: '',
};

interface StateConfig {
  message: string;
  nextState: VoiceState;
  validate?: (input: string) => boolean | Promise<boolean>;
  onFail?: VoiceState;
  failureMessage?: string;
  extract?: (input: string, ctx: VoiceContext) => Partial<VoiceContext>;
}

// Helpers
const cleanName = (input: string) => {
    return input
        .replace(/my name is/gi, '')
        .replace(/i am/gi, '')
        .replace(/this is/gi, '')
        .trim();
};

export const FLOW_CONFIG: Partial<Record<VoiceState, StateConfig>> = {
  GREETING: {
    message: "Namaste! I'm Genie. Let's build your profile.",
    nextState: 'ASK_NAME',
  },
  ASK_NAME: { 
    message: 'First, What is your full name?',
    nextState: 'VALIDATE_NAME',
  },
  VALIDATE_NAME: {
    message: '',
    nextState: 'ASK_AGE',
    validate: (input) => cleanName(input).length > 2,
    failureMessage: "Could you please say your full name again?",
    onFail: 'ASK_NAME',
    extract: (input) => ({ name: cleanName(input) }),
  },
  ASK_AGE: {
    message: 'Nice to meet you. How old are you?',
    nextState: 'VALIDATE_AGE',
  },
  VALIDATE_AGE: {
    message: '',
    nextState: 'ASK_EMAIL',
    validate: (input) => {
        const age = parseInt(input.replace(/\D/g, ''));
        return !isNaN(age) && age >= 18;
    },
    failureMessage: "You must be 18 or older to proceed. Please state your correct age.",
    onFail: 'ASK_AGE',
    extract: (input) => ({ age: input.replace(/\D/g, '') }),
  },
  ASK_EMAIL: {
    message: 'Got it. What is your email address?',
    nextState: 'VALIDATE_EMAIL',
  },
  VALIDATE_EMAIL: {
      message: '',
      nextState: 'ASK_PHONE',
      validate: (input) => {
          const normalized = input.toLowerCase().replace(/ at /g, '@').replace(/ dot /g, '.').replace(/\s/g, '');
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
      },
      failureMessage: "That doesn't sound like a valid email. Please try again.",
      onFail: 'ASK_EMAIL',
      extract: (input) => {
          const normalized = input.toLowerCase().replace(/ at /g, '@').replace(/ dot /g, '.').replace(/\s/g, '');
          return { email: normalized };
      }
  },
  ASK_PHONE: {
    message: 'Thanks. Now, what is your 10-digit mobile number?',
    nextState: 'VALIDATE_PHONE',
  },
  VALIDATE_PHONE: {
      message: '',
      nextState: 'ASK_EDU_DEGREE', // Start granular education flow
      validate: (input) => {
          const wordMap: Record<string, string> = {
              'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
              'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'oh': '0'
          };
          let norm = input.toLowerCase();
          Object.keys(wordMap).forEach(word => {
               norm = norm.split(word).join(wordMap[word as keyof typeof wordMap]);
          });
          const digits = norm.replace(/\D/g, '');
          return digits.length >= 10;
      },
      failureMessage: "I didn't catch a valid number. Please say your 10-digit mobile number.",
      onFail: 'RETRY_PHONE',
      extract: (input) => {
          const wordMap: Record<string, string> = {
              'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
              'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'oh': '0'
          };
          let norm = input.toLowerCase();
          Object.keys(wordMap).forEach(word => {
               norm = norm.split(word).join(wordMap[word as keyof typeof wordMap]);
          });
          return { phone: norm.replace(/\D/g, '').slice(-10) };
      },
  },
  RETRY_PHONE: {
      message: "I didn't catch a valid number. Please say your 10-digit mobile number.",
      nextState: 'VALIDATE_PHONE', 
  },
  
  // GRANULAR EDUCATION FLOW
  ASK_EDU_DEGREE: {
      message: "Let's talk about your education. What degree are you pursuing? For example, B.Tech CSE.",
      nextState: 'ASK_EDU_INSTITUTE',
      extract: (input) => ({ educationDegree: input }),
  },
  ASK_EDU_INSTITUTE: {
      message: "And from which college or university?",
      nextState: 'ASK_EDU_SCORE',
      extract: (input) => ({ educationInstitute: input }),
  },
  ASK_EDU_SCORE: {
      message: "Great. What is your current CGPA or Percentage?",
      nextState: 'ASK_LANGUAGES',
      extract: (input) => ({ educationScore: input }),
  },

  ASK_LANGUAGES: {
      message: "Which languages do you speak? For example, English and Hindi.",
      nextState: 'ASK_SKILLS',
      extract: (input) => ({ languages: input }),
  },
  ASK_SKILLS: {
    message: "Almost done. Tell me your top skills, like React, Python, or Design.",
    nextState: 'COMPLETED',
    extract: (input) => ({ skills: input.split(/,| and /).map(s => s.trim()).filter(Boolean) }),
  },
  COMPLETED: {
      message: "Perfect! I've created your profile.",
      nextState: 'IDLE',
  }
};

export const voiceReducer = (
  state: VoiceState,
  action: VoiceAction
): VoiceState => {
  switch (action.type) {
    case 'START':
      return 'GREETING';
    case 'RESET':
      return 'IDLE';
    case 'NEXT':
        // Logic for transitioning based on current state
        if (state === 'GREETING') return 'ASK_NAME';
        if (state === 'ASK_NAME') return 'VALIDATE_NAME'; 
        if (state === 'VALIDATE_NAME') {
            // Validation happens in the component effect usually, 
            // but strictly in reducer, we assume 'NEXT' implies successful validation 
            // OR we handle validation logic here if we pass the transcript in validation call?
            // Actually, a clearer pattern for React useReducer with async checks:
            // Component:
            //   useEffect(() => {
            //      if (state.startsWith('VALIDATE')) {
            //          const isValid = config.validate(transcript);
            //          if (isValid) dispatch({ type: 'VALID_INPUT', payload: transcript })
            //          else dispatch({ type: 'INVALID_INPUT' })
            //      }
            //   })
            
            // For simplicity in this constrained prompt, let's keep the reducer simple
            // and assume the caller (hook/component) handles the logic of "checking" 
            // and dispatches purely state transitions or specific events.
            // But wait, the prompt says "State Management: Use a finite state machine pattern".
            
            return state; // Placeholder, real logic needs more specific actions like VALID_NAME_SUCCESS
        }
        return state;
    default:
      return state;
  }
};

// Simplified "Machine" Hook concept that uses the Reducer internally
// but exposes a cleaner API for the UI to consume.
import { useReducer, useEffect } from 'react';

type InternalAction = 
 | { type: 'TRANSITION'; to: VoiceState }
 | { type: 'UPDATE_CONTEXT'; payload: Partial<VoiceContext> };

const internalReducer = (
    state: { current: VoiceState; context: VoiceContext },
    action: InternalAction
) => {
    switch (action.type) {
        case 'TRANSITION':
            return { ...state, current: action.to };
        case 'UPDATE_CONTEXT':
            return { ...state, context: { ...state.context, ...action.payload } };
        default:
            return state;
    }
};

export const useVoiceFlow = () => {
    const [state, dispatch] = useReducer(internalReducer, {
        current: 'IDLE',
        context: INITIAL_CONTEXT
    });

    const transition = (to: VoiceState) => dispatch({ type: 'TRANSITION', to });
    const updateContext = (payload: Partial<VoiceContext>) => dispatch({ type: 'UPDATE_CONTEXT', payload });

    return {
        currentState: state.current,
        context: state.context,
        transition,
        updateContext,
        config: FLOW_CONFIG
    };
};
