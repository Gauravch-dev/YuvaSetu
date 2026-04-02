import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, User, GraduationCap, Briefcase, Cpu, PartyPopper, Sparkles, Folder, Award, Eye, EyeOff, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonalDetails } from './steps/PersonalDetails';
import { Education } from './steps/Education';
import { Experience } from './steps/Experience';
import { Projects } from './steps/Projects';
import { Certifications } from './steps/Certifications';
import { Skills } from './steps/Skills';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { ResumePreview } from '@/components/Resume/ResumePreview';
import { exportResumeToPDF } from '@/lib/resume-export';
import { toast } from 'sonner';
import { GenieInline } from '@/features/VoiceGenie/components/GenieInline';

const STEPS = [
  { id: 1, title: 'Personal Details', component: PersonalDetails, icon: User },
  { id: 2, title: 'Education', component: Education, icon: GraduationCap },
  { id: 3, title: 'Experience', component: Experience, icon: Briefcase },
  { id: 4, title: 'Projects', component: Projects, icon: Folder },
  { id: 5, title: 'Certifications', component: Certifications, icon: Award },
  { id: 6, title: 'Skills', component: Skills, icon: Cpu },
];

export const MultiStepForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showStepSuccess, setShowStepSuccess] = useState(false);
  const { data, updateData } = useOnboarding();
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const editMode = location.state?.editMode;
  const initialProfileData = location.state?.profileData;
  const voiceData = location.state?.voiceData;

  const [showGenie, setShowGenie] = useState(false); // Default to HIDDEN


  // Sync Voice State to Form Step
  const handleVoiceStateChange = (voiceState: string) => {
      // Map voice states to step numbers
      if (['ASK_NAME', 'ASK_AGE', 'ASK_EMAIL', 'ASK_PHONE'].some(s => voiceState.includes(s))) {
          setCurrentStep(1);
      } else if (['ASK_EDU_DEGREE', 'ASK_EDU_INSTITUTE', 'ASK_EDU_SCORE'].some(s => voiceState.includes(s))) {
          setCurrentStep(2);
      } else if (voiceState === 'ASK_LANGUAGES') {
          setCurrentStep(1); // Languages usually in Personal Info
      } else if (voiceState === 'ASK_SKILLS') {
          setCurrentStep(6);
      }
  };

  const handleVoicePartialUpdate = (updates: any) => {
      const newPersonalInfo = { ...data.personalInfo };
      if (updates.name) newPersonalInfo.fullName = updates.name;
      if (updates.email) newPersonalInfo.email = updates.email;
      if (updates.phone) newPersonalInfo.phone = updates.phone;
      if (updates.age) newPersonalInfo.age = updates.age;
      if (updates.languages) newPersonalInfo.languages = updates.languages;

      const newSkills = updates.skills ? updates.skills : data.skills;
      
      let newEducation = [...(data.education || [])];
      // Ensure at least one entry exists
      if (newEducation.length === 0) {
          newEducation.push({
              id: crypto.randomUUID(),
              institution: '',
              degree: '',
              year: new Date().getFullYear().toString(),
              score: ''
          });
      }

      // Update specific fields
      if (updates.educationDegree) newEducation[0].degree = updates.educationDegree;
      if (updates.educationInstitute) newEducation[0].institution = updates.educationInstitute;
      if (updates.educationScore) newEducation[0].score = updates.educationScore;
      
      // Fallback for legacy monolithic 'education' update (if any)
      if (updates.education) newEducation[0].degree = updates.education;

      updateData({
          personalInfo: newPersonalInfo,
          skills: newSkills,
          education: newEducation
      });
  };

  const handleVoiceComplete = (finalData: any) => {
      toast.success("Voice Profile Completed!");
      setShowGenie(false); 
  };


  // Initialize data for Edit Mode or Voice Data
  useEffect(() => {
    if (editMode && initialProfileData) {
      updateData(initialProfileData);
    } else if (voiceData) {
      // Map voice data to form structure
      // voiceData is now likely the STRUCTURED object from the backend
      // structure: { personalInfo: {...}, education: [...], skills: [...] }
      
      const newPersonalInfo = {
          ...data.personalInfo,
          ...voiceData.personalInfo,
          // Fallback if structured data missed something but original voiceData had it? 
          // The structure endpoint returns a full personalInfo object.
      };

      let newEducation = data.education;
      if (Array.isArray(voiceData.education)) {
           newEducation = voiceData.education.map((edu: any) => ({
             id: crypto.randomUUID(),
             institution: edu.institution || '',
             degree: edu.degree || '',
             year: edu.year || new Date().getFullYear().toString(),
             score: ''
           }));
      } else if (typeof voiceData.education === 'string') {
           newEducation = [{
             id: crypto.randomUUID(),
             institution: '',
             degree: voiceData.education,
             year: new Date().getFullYear().toString(),
             score: ''
           }];
      }

      updateData({
        personalInfo: newPersonalInfo,
        skills: voiceData.skills || data.skills || [],
        education: newEducation
      });
      // Optional: Jump to first empty step? Or just start at 1.
      toast.success("Profile pre-filled from Voice Genie!");
    }
  }, []);

  const CurrentComponent = STEPS.find(s => s.id === currentStep)?.component || PersonalDetails;
  const isLastStep = currentStep === STEPS.length;

  // Auto-scale logic
  useEffect(() => {
    const handleResize = () => {
      if (previewContainerRef.current) {
        const { clientWidth, clientHeight } = previewContainerRef.current;
        const targetWidth = 794 + 80;
        const targetHeight = 1123 + 80;
        const scaleX = clientWidth / targetWidth;
        const scaleY = clientHeight / targetHeight;
        const newScale = Math.min(Math.min(scaleX, scaleY), 1.1);
        setScale(newScale);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [showPreview]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
    const formContainer = document.getElementById('form-scroll-container');
    if (formContainer) formContainer.scrollTop = 0;
  }, [currentStep]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter -> Next
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
      // Esc -> Back (Disabled to prevent accidental exits, uncomment if desired)
      // if (e.key === 'Escape') handleBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, data]);

  const handleSaveDraft = () => {
    localStorage.setItem('onboarding_draft', JSON.stringify(data));
    toast.success("Draft saved successfully", {
      icon: <Save className="w-4 h-4" />
    });
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const result = await exportResumeToPDF(data, `${data.personalInfo.fullName || 'resume'}.pdf`);
      if (result.success) {
        toast.success("Resume downloaded successfully!");
      } else {
        toast.error("Failed to generate PDF");
      }
    } catch (error) {
      toast.error("Failed to download resume");
    } finally {
      setIsExporting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const { email, phone, age, linkedin, github, portfolio } = data.personalInfo;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Please enter a valid email address"); return; }
      if (!phone || !/^\d{10,15}$/.test(phone.replace(/[^0-9]/g, ''))) { toast.error("Please enter a valid phone number (10-15 digits)"); return; }
      if (!age) { toast.error("Please enter your age"); return; }
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 18) { toast.error("You must be 18 or older to proceed."); return; }

      const isValidUrl = (url?: string) => {
        if (!url) return true;
        try { new URL(url.startsWith('http') ? url : `https://${url}`); return true; } catch { return false; }
      };
      if (!isValidUrl(linkedin)) { toast.error("Invalid LinkedIn URL"); return; }
      if (!isValidUrl(github)) { toast.error("Invalid GitHub URL"); return; }
      if (!isValidUrl(portfolio)) { toast.error("Invalid Portfolio URL"); return; }
    }

    if (currentStep === 2) {
      const hasInvalidYear = data.education.some(edu => !/^\d{4}$/.test(edu.year));
      if (hasInvalidYear) { toast.error("Please enter a valid 4-digit year for education"); return; }
    }

    if (isLastStep) {
      setIsExporting(true);
      try {
        if (!editMode) {
          const result = await exportResumeToPDF(data, `${data.personalInfo.fullName || 'resume'}.pdf`);
          if (!result.success) {
            toast.error("Failed to generate resume PDF");
            setIsExporting(false);
            return;
          }
        }

        try {
          const token = localStorage.getItem('authToken');
          if (token) {
            const { completeOnboarding, saveJobSeekerProfile } = await import('@/lib/auth-api');
            await saveJobSeekerProfile(token, data);

            if (!editMode) {
              await completeOnboarding(token);
            }
          }
        } catch (error) {
          console.error('Failed to save profile', error);
          toast.error("Failed to save profile data");
          setIsExporting(false);
          return;
        }

        if (editMode) {
          toast.success("Profile updated successfully!");
          navigate('/dashboard');
        } else {
          setShowSuccess(true);
          toast.success("Profile created successfully!", { icon: <PartyPopper className="w-5 h-5" /> });
          setTimeout(() => navigate('/dashboard'), 3000);
        }

      } catch (error) {
        console.error('Submission error:', error);
        toast.error("An error occurred");
      } finally {
        setIsExporting(false);
      }
    } else {
      setShowStepSuccess(true);
      setTimeout(() => setShowStepSuccess(false), 2000);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate(editMode ? '/dashboard' : '/onboarding');
    }
  };

  if (showSuccess) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#FAFAFA] dark:bg-slate-950">
        <div className="text-center animate-in fade-in zoom-in duration-500 max-w-lg px-6">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/20">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">You're All Set!</h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 mb-8">
            We've created your profile and downloaded your resume. Redirecting you to the dashboard...
          </p>
          <div className="h-1 w-32 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full w-full bg-green-500 animate-progress origin-left" />
          </div>
        </div>
      </div>
    );
  }




  return (
    <div className="h-screen w-full bg-white dark:bg-slate-950 flex flex-col xl:flex-row overflow-hidden font-sans">
      
      {/* LEFT: Main Form Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 bg-white dark:bg-slate-900 shadow-xl transition-all duration-300">
        <div className="flex-none px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            {/* ... Existing Header Content ... */}
            <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(editMode ? '/dashboard' : '/onboarding')} className="rounded-full hover:bg-slate-100 -ml-2">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editMode ? `Edit ${STEPS[currentStep - 1].title}` : STEPS[currentStep - 1].title}
              </h1>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Step {currentStep} of {STEPS.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
               <Button 
                variant="outline" 
                size="sm"
                className={`rounded-full ${showGenie ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}`}
                onClick={() => setShowGenie(!showGenie)}
               >
                   <Sparkles className="w-4 h-4 mr-2" />
                   {showGenie ? 'Hide Genie' : 'Ask Genie'}
               </Button>

               <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        <path className="text-primary transition-all duration-500 ease-out" strokeDasharray={`${((currentStep) / STEPS.length) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-primary">{Math.round((currentStep / STEPS.length) * 100)}%</span>
               </div>
          </div>
        </div>

        <div id="form-scroll-container" className="flex-1 overflow-y-auto px-6 py-8 xl:px-12 xl:py-10 custom-scrollbar">
          <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <CurrentComponent />
          </div>
        </div>

        {/* ... Footer ... */}
        <div className="flex-none px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-20">
             {/* ... Footer Content ... */}
             <div className="flex gap-2">
                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="text-slate-500 hover:text-slate-900">Back</Button>
                <Button variant="ghost" onClick={handleSaveDraft} className="text-slate-500 hover:text-primary"><Save className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Save</span></Button>
             </div>
             <div className="flex gap-3">
                 <Button onClick={handleNext} disabled={isExporting} className="rounded-full px-8 bg-slate-900 text-white">{isLastStep ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4 ml-2" /></Button>
             </div>
        </div>
      </div>

      {/* RIGHT: Voice Genie Panel (Replaces Preview on logic, or squeeze between?) */}
      {/* For this refactor, let's Replace the Resume Preview with Genie when active, or split the right side? */}
      {/* Best UX: Form (Left 60%) | Genie (Right 40%) */}
      
      {showGenie ? (
          <div className="hidden xl:flex w-[400px] h-full bg-slate-50 dark:bg-black relative z-20 shadow-2xl transition-all">
             <div className="w-full h-full">
                 <div className="h-full w-full">
                     {/* Dynamic Import to avoid circular dep issues in some bundlers if any */}
                     {/* Assuming GenieInline imported at top */}
                     <GenieInline 
                        onStateChange={handleVoiceStateChange}
                        onPartialUpdate={handleVoicePartialUpdate}
                        onComplete={handleVoiceComplete}
                        onClose={() => setShowGenie(false)}
                     />
                 </div>
             </div>
          </div>
      ) : (
        /* Original Resume Preview Logic could go here or be toggleable */
        <div className={`${showPreview ? 'flex' : 'hidden'} fixed inset-0 z-50 bg-slate-100 dark:bg-black/90 xl:relative xl:z-0 xl:flex-1 xl:bg-[#F3F4F6] dark:xl:bg-black/50 flex-col items-center justify-center overflow-hidden transition-all duration-300`}>
             {/* ... Original Preview Code ... */}
              <div className="absolute top-6 right-6 z-20 hidden xl:block">
                <Button variant="secondary" size="sm" className="bg-white/80 backdrop-blur shadow-sm hover:bg-white text-slate-600 rounded-full" onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </div>
             <div ref={previewContainerRef} className="w-full h-full flex items-center justify-center p-8 lg:p-12 relative">
                <div className="shadow-2xl shadow-slate-300/50 dark:shadow-black/50 bg-white origin-center transition-transform duration-300 ease-out" style={{ transform: `scale(${scale})` }}>
                    <ResumePreview data={data} />
                </div>
            </div>
        </div>
      )}
      
      {/* Mobile Toggle for Preview/Genie */}
      <div className="fixed bottom-24 right-6 xl:hidden z-40 flex flex-col gap-2">
         <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 text-white" onClick={() => setShowGenie(!showGenie)}>
             <Sparkles className="w-6 h-6" />
         </Button>
         <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-slate-900 text-white" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
         </Button>
      </div>

    </div>
  );
};
