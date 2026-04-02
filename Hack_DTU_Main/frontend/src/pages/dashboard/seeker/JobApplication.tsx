import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Banknote, Clock, FileText, Upload, CheckCircle2, Loader2, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { applyJob } from '@/lib/api/jobs';
import { uploadResumeFile } from '@/lib/auth-api';
import { Input } from '@/components/ui/input';

export const JobApplication = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const job = location.state?.job;

  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resume Selection State
  const [resumeMode, setResumeMode] = useState<'SYSTEM' | 'CUSTOM'>('SYSTEM');
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customResumeUrl, setCustomResumeUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
        <p className="text-muted-foreground mb-4">The job details could not be loaded.</p>
        <Button onClick={() => navigate('/dashboard/jobs')}>Back to Jobs</Button>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: "Invalid File", description: "Please upload a PDF resume.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("No token");

      const res = await uploadResumeFile(file, token);
      setCustomFile(file);
      setCustomResumeUrl(res.url); // Backend returns { url: "..." }
      setResumeMode('CUSTOM');

      toast({ title: "Resume Uploaded", description: "Your custom resume is ready." });
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload resume.", variant: "destructive" });
      setCustomFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to apply.",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      if (job) {
        const finalResumeUrl = resumeMode === 'CUSTOM' ? customResumeUrl : undefined;
        await applyJob(job.id, token, finalResumeUrl || undefined);

        toast({
          title: "Application Submitted Successfully!",
          description: `You have applied for ${job.title} at ${job.company}`,
          variant: "default",
        });
        navigate('/dashboard/applications');
      }
    } catch (error: any) {
      toast({
        title: "Application Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <Button
        variant="ghost"
        className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Button>

      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white p-3 shadow-lg border border-border/50 shrink-0">
            <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-bold text-3xl">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                {job.company}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4" />
                {job.salary}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Posted {job.postedAt}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Resume Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Select Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Option 1: System Resume */}
              <div
                className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${resumeMode === 'SYSTEM' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                onClick={() => setResumeMode('SYSTEM')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${resumeMode === 'SYSTEM' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Brainwave Generated Resume</div>
                    <div className="text-xs text-muted-foreground">Based on your Profile</div>
                  </div>
                </div>
                {resumeMode === 'SYSTEM' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>

              {/* Option 2: Custom Resume */}
              <div
                className={`border rounded-xl p-4 transition-all ${resumeMode === 'CUSTOM' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                onClick={() => !customFile && document.getElementById('resume-upload')?.click()}
              >
                <div className="flex items-center justify-between cursor-pointer" onClick={(e) => {
                  if (customFile) { e.stopPropagation(); setResumeMode('CUSTOM'); }
                }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${resumeMode === 'CUSTOM' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Upload Custom Resume</div>
                      <div className="text-xs text-muted-foreground">{customFile ? customFile.name : "Upload a PDF file (Max 5MB)"}</div>
                    </div>
                  </div>
                  {resumeMode === 'CUSTOM' && customFile && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>

                {/* Upload Input & Remove Button */}
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {!customFile && (
                    <Button variant="outline" size="sm" className="w-full mt-2" disabled={isUploading} onClick={() => document.getElementById('resume-upload')?.click()}>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      {isUploading ? "Uploading..." : "Click to Upload"}
                    </Button>
                  )}
                  {customFile && (
                    <div className="flex justify-end mt-2">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-8" onClick={() => {
                        setCustomFile(null);
                        setCustomResumeUrl(null);
                        setResumeMode('SYSTEM');
                      }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter Section */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Cover Letter (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                <Label htmlFor="cover-letter" className="sr-only">Cover Letter</Label>
                <Textarea
                  id="cover-letter"
                  placeholder="Why are you a good fit for this role? Describe your relevant experience..."
                  className="min-h-[120px] resize-y"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">{coverLetter.length}/2000 characters</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/10 shadow-none">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg">Application Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Job ID</span>
                  <span className="font-mono text-xs overflow-hidden text-ellipsis max-w-[100px]">{job.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium text-right">{job.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium">{job.company}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Resume</span>
                  <span className="font-medium">{resumeMode === 'SYSTEM' ? 'System Generated' : 'Custom Upload'}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-primary/10">
                <Button
                  size="lg"
                  className="w-full font-bold shadow-lg hover:shadow-primary/25 transition-all"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  By clicking Submit, you agree to share your profile with {job.company}.
                </p>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
};
