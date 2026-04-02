import { createContext, useContext, useState, ReactNode } from 'react';

// Extended type definition for the onboarding data
export interface OnboardingData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
    bio?: string;
    age?: string;
    languages?: string;
  };
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    year: string;
    score: string;
  }>;
  experience: Array<{
    id: string;
    role: string;
    company: string;
    duration: string;
    description: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    technologies: string;
    link?: string;
  }>;
  certifications: Array<{
    id: string;
    title: string;
    issuer: string;
    year?: string;
  }>;
  skills: string[];
}

export interface ParsingResult {
  data: Partial<OnboardingData>;
  confidence: number;
  sectionsFound: string[];
  warnings: string[];
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  updateStepData: <K extends keyof OnboardingData>(section: K, data: OnboardingData[K]) => void;
  parseResume: (file: File) => Promise<ParsingResult>;
  isParsing: boolean;
  parsingConfidence: number | null;
  parsingWarnings: string[];
}

const initialData: OnboardingData = {
  personalInfo: { fullName: '', email: '', phone: '' },
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  skills: []
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingConfidence, setParsingConfidence] = useState<number | null>(null);
  const [parsingWarnings, setParsingWarnings] = useState<string[]>([]);

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const updateStepData = <K extends keyof OnboardingData>(section: K, sectionData: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [section]: sectionData }));
  };

  const parseResume = async (file: File): Promise<ParsingResult> => {
    setIsParsing(true);
    setParsingWarnings([]);

    try {
      const { parseResumeFile } = await import('@/lib/resume-parser');
      const result = await parseResumeFile(file);

      setParsingConfidence(result.confidence);
      setParsingWarnings(result.warnings);

      // Only apply data to form if confidence is acceptable
      if (result.confidence >= 30) {
        updateData(result.data);
      }

      return result;
    } catch (error) {
      console.error('Failed to parse resume:', error);
      const failResult: ParsingResult = {
        data: {},
        confidence: 0,
        sectionsFound: [],
        warnings: ['Failed to parse resume. Please fill manually.']
      };
      setParsingConfidence(0);
      setParsingWarnings(failResult.warnings);
      return failResult;
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <OnboardingContext.Provider value={{
      data,
      updateData,
      updateStepData,
      parseResume,
      isParsing,
      parsingConfidence,
      parsingWarnings
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
