import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { ConfidenceBar } from '@/components/Resume/ConfidenceBar';
import { toast } from 'sonner';

export const ResumeUpload = () => {
  const navigate = useNavigate();
  const { parseResume, isParsing, parsingConfidence, parsingWarnings } = useOnboarding();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAttemptedParsing, setHasAttemptedParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = async (selectedFile: File) => {
    // Only allow PDF for deterministic parsing
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF file for best results.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max size is 5MB.');
      return;
    }

    setFile(selectedFile);
    setHasAttemptedParsing(false);

    // Auto-parse on file selection
    try {
      const result = await parseResume(selectedFile);
      setHasAttemptedParsing(true);

      if (result.sectionsFound.includes('AI Analyzed')) {
        toast.success('Resume analyzed by OnDemand AI (High Accuracy)');
      } else if (result.confidence >= 70) {
        toast.success('Resume parsed successfully! Please review the data.');
      } else if (result.confidence >= 30) {
        toast.warning('Some sections need review. Please check all fields.');
      } else {
        toast.error('Could not reliably parse resume. Please fill manually.');
      }
    } catch (error) {
      console.error('Parse error:', error);
      setHasAttemptedParsing(true);
    }
  };

  const handleContinue = () => {
    navigate('/onboarding/form');
  };

  const handleManualEntry = () => {
    navigate('/onboarding/form');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl font-bold">Upload Your Resume</h1>
        <p className="text-muted-foreground text-lg">
          We'll extract your details to pre-fill the form. <br />
          You can review and edit everything before submission.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 text-center cursor-pointer ${isDragging
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : file
            ? 'border-primary/50 bg-card'
            : 'border-border bg-card/50 hover:bg-card hover:border-primary/50'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isParsing && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={isParsing}
        />

        {isParsing ? (
          <div className="space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2">Analyzing Resume...</h3>
              <p className="text-muted-foreground animate-pulse">Extracting text and detecting sections...</p>
            </div>
          </div>
        ) : file ? (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-xl text-primary mb-1">{file.name}</h3>
              <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); setHasAttemptedParsing(false); }}>
              Change File
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">Click to upload or drag and drop</h3>
              <p className="text-muted-foreground">PDF only (max. 5MB)</p>
            </div>
          </div>
        )}
      </div>

      {/* Confidence Bar - Shown after parsing attempt */}
      {hasAttemptedParsing && (
        <ConfidenceBar
          confidence={parsingConfidence}
          warnings={parsingWarnings}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="ghost" onClick={() => navigate('/onboarding')} disabled={isParsing}>
          Back
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleManualEntry}
            disabled={isParsing}
          >
            Fill Manually
          </Button>
          <Button
            variant="seeker"
            size="lg"
            onClick={handleContinue}
            disabled={!file || isParsing}
            className="min-w-[200px]"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue to Review'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
