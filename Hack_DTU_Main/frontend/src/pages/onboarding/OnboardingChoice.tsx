import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FileUp, Keyboard, ArrowRight, Sparkles, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenieOverlay } from '../../features/VoiceGenie';
import { useToast } from '@/hooks/use-toast';

export const OnboardingChoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [hoveredOption, setHoveredOption] = useState<'resume' | 'manual' | 'voice' | null>(null);
  const [isGenieOpen, setIsGenieOpen] = useState(false);

  // If in edit mode, proceed to form logic (which might be passed down)
  const handleManualClick = () => {
    navigate('/onboarding/form', { state: location.state });
  };

  const handleUploadClick = () => {
    navigate('/onboarding/upload', { state: location.state });
  };

  return (
    <div className="space-y-12 text-center">
      <div className="space-y-4 max-w-2xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
          Let's Build Your <span className="text-primary">Profile</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose how you want to get started. We'll help you create a standout profile either way.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
        {/* Option 1: Upload Resume */}
        <div
          className={`relative group rounded-3xl p-8 cursor-pointer transition-all duration-300 border-2 ${hoveredOption === 'resume'
            ? 'bg-card border-blue-500 shadow-2xl scale-[1.02] ring-4 ring-blue-500/10'
            : 'bg-card/50 border-border shadow-soft hover:bg-card'
            }`}
          onMouseEnter={() => setHoveredOption('resume')}
          onMouseLeave={() => setHoveredOption(null)}
          onClick={handleUploadClick}
        >
          <div className="h-full flex flex-col items-center text-center space-y-6 pt-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors duration-300 ${hoveredOption === 'resume' ? 'bg-blue-500/20 text-blue-600' : 'bg-muted text-muted-foreground'
              }`}>
              <FileUp className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold">Upload Resume</h3>
              <p className="text-muted-foreground">
                We'll magically extract your details. <br />
                Fastest way.
              </p>
            </div>

            <div className="flex-1 w-full flex items-end justify-center pt-4">
              <Button
                variant="outline"
                className={`w-full gap-2 transition-all duration-300 ${hoveredOption === 'resume' ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}`}
              >
                Auto-Fill
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Option 2: Voice Genie (New) */}
        <div
          className={`relative group rounded-3xl p-8 cursor-pointer transition-all duration-300 border-2 ${hoveredOption === 'voice'
            ? 'bg-card border-purple-500 shadow-2xl scale-[1.05] ring-4 ring-purple-500/10 z-10'
            : 'bg-card/50 border-border shadow-soft hover:bg-card'
            }`}
          onMouseEnter={() => setHoveredOption('voice')}
          onMouseLeave={() => setHoveredOption(null)}
          onClick={() => setIsGenieOpen(true)}
        >
           {/* Badge */}
           <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-lg animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Voice AI
            </div>
          </div>

          <div className="h-full flex flex-col items-center text-center space-y-6 pt-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors duration-300 ${hoveredOption === 'voice' ? 'bg-purple-500/20 text-purple-600' : 'bg-muted text-muted-foreground'
              }`}>
              <Mic className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold">Voice Interview</h3>
              <p className="text-muted-foreground">
                Chat with "Genie" to build your profile. <br />
                Fun & interactive!
              </p>
            </div>

            <div className="flex-1 w-full flex items-end justify-center pt-4">
              <Button
                variant="outline"
                className={`w-full gap-2 transition-all duration-300 ${hoveredOption === 'voice' ? 'border-purple-500 text-purple-600 bg-purple-50' : ''}`}
              >
                Start Talking
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Option 3: Manual */}
        <div
          className={`relative group rounded-3xl p-8 cursor-pointer transition-all duration-300 border-2 ${hoveredOption === 'manual'
            ? 'bg-card border-primary shadow-2xl scale-[1.02] ring-4 ring-primary/10'
            : 'bg-card/50 border-border shadow-soft hover:bg-card'
            }`}
          onMouseEnter={() => setHoveredOption('manual')}
          onMouseLeave={() => setHoveredOption(null)}
          onClick={handleManualClick}
        >
          <div className="h-full flex flex-col items-center text-center space-y-6 pt-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors duration-300 ${hoveredOption === 'manual' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
              <Keyboard className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold">Fill Manually</h3>
              <p className="text-muted-foreground">
                Control every detail step-by-step. <br />
                Classic mode.
              </p>
            </div>

            <div className="flex-1 w-full flex items-end justify-center pt-4">
              <Button
                variant="outline"
                className={`w-full gap-2 transition-all duration-300 ${hoveredOption === 'manual' ? 'border-primary text-primary bg-primary/10' : ''}`}
              >
                Enter Details
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Already have an account? <Link to="/login/seeker" className="text-primary hover:underline font-medium">Log in</Link>
      </p>

      {/* Voice Genie Overlay */}
      {isGenieOpen && (
        <GenieOverlay 
          onClose={() => setIsGenieOpen(false)}
          onComplete={(data) => {
             setIsGenieOpen(false);
             // Here we would effectively submit the "form" or navigate to review
             // For now, we mock it by navigating to the form with pre-filled state
             console.log("Voice Data Captured:", data);
             toast({
               title: "Awesome!",
               description: "We've captured your details. Redirecting to review...",
             });
             // Navigate to Form step with data
             // In a real app, we'd map 'data' to the form schema
             navigate('/onboarding/form', { state: { ...location.state, voiceData: data } });
          }}
        />
      )}
    </div>
  );
};
