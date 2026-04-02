import { ArrowLeft, MapPin, Banknote, Clock, Users, Mail, FileText, Check, X, Calendar, Loader2, Archive, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useParams } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { fetchJobById, updateJob, fetchRecommendedCandidates } from '@/lib/auth-api';
import { fetchJobCandidates, updateApplicationStatus } from '@/lib/api/jobs';

export const JobPostingDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [suggestedCandidates, setSuggestedCandidates] = useState<any[]>([]);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || !id) return;

        // 1. Fetch Job
        const data = await fetchJobById(token, id);
        setJob(data);

        // 2. Fetch Candidates (Full Details)
        try {
          const fullCandidates = await fetchJobCandidates(id, token);
          setCandidates(fullCandidates);
        } catch (candError) {
          console.error("Failed to load candidates", candError);
        }

        // 3. Fetch AI Recommendations
        try {
          const suggestions = await fetchRecommendedCandidates(token, id);
          setSuggestedCandidates(suggestions);
        } catch (suggestionError) {
          console.error("Failed to load suggestions", suggestionError);
        }

      } catch (error) {
        console.error(error);
        toast({ title: t('jobPostingDetail.error'), description: t('jobPostingDetail.loadFailed'), variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadJob();
  }, [id]);

  const handleCloseJob = async () => {
    if (!confirm(t('jobPostingDetail.confirmCloseJob'))) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('authToken');
      if (token && id) {
        const updatedJob = await updateJob(token, id, { status: 'CLOSED' });
        setJob(updatedJob);
        toast({ title: t('jobPostingDetail.success'), description: t('jobPostingDetail.jobClosed') });
      }
    } catch (error) {
      console.error(error);
      toast({ title: t('jobPostingDetail.error'), description: t('jobPostingDetail.closeJobFailed'), variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !job?._id) return;

      await updateApplicationStatus(job._id, userId, newStatus, token);

      // Optimistic Update
      setCandidates(prev => prev.map(c =>
        c.userId === userId ? { ...c, status: newStatus } : c
      ));

      toast({ title: t('jobPostingDetail.updated'), description: t('jobPostingDetail.statusChangedTo', { status: newStatus }) });
    } catch (error) {
      toast({ title: t('jobPostingDetail.error'), description: t('jobPostingDetail.updateStatusFailed'), variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-muted-foreground">{t('jobPostingDetail.jobNotFound')}</p>
        <Button onClick={() => navigate('/dashboard/employer')}>{t('jobPostingDetail.backToDashboard')}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" className="gap-2" onClick={() => navigate('/dashboard/employer')}>
          <ArrowLeft className="w-4 h-4" />
          {t('jobPostingDetail.backToDashboard')}
        </Button>
        {/* Close Job Button */}
        {job.status !== 'CLOSED' && (
          <Button
            variant="destructive"
            className="gap-2"
            onClick={handleCloseJob}
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            {t('jobPostingDetail.closeJobPosting')}
          </Button>
        )}
      </div>

      {/* Job Details Card */}
      <div className="bg-card border border-border rounded-3xl p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4" /> {job.salary}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {t('jobPostingDetail.posted')} {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Badge className={
            job.status === 'PUBLISHED' ? "bg-green-500/10 text-green-600 border-green-500/20" :
              job.status === 'CLOSED' ? "bg-red-500/10 text-red-600 border-red-500/20" :
                "bg-orange-500/10 text-orange-600"
          }>
            {job.status}
          </Badge>
        </div>

        <Separator className="my-6" />

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">{t('jobPostingDetail.jobDescription')}</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">{t('jobPostingDetail.requirements')}</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">{job.requirements}</p>

            <h3 className="font-bold text-lg mb-3">{t('jobPostingDetail.requiredSkills')}</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill: string) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Tabs */}
      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="suggestions" className="gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {t('jobPostingDetail.topAiMatches')} <Badge variant="secondary" className="ml-2">{suggestedCandidates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="applicants">
            {t('jobPostingDetail.applicants')} <Badge variant="secondary" className="ml-2">{candidates.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions">
          <div className="bg-card border border-border rounded-3xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl">{t('jobPostingDetail.recommendedCandidates')}</h2>
              <p className="text-sm text-muted-foreground">{t('jobPostingDetail.sortedByMatch')}</p>
            </div>

            {suggestedCandidates.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{t('jobPostingDetail.noRecommendations')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {suggestedCandidates.map((candidate) => (
                  <div key={candidate.id} className="border border-border p-4 rounded-xl hover:border-primary/50 transition-colors bg-muted/20">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {candidate.personalInfo?.fullName?.[0] || <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="font-bold">{candidate.personalInfo?.fullName || t('jobPostingDetail.anonymousUser')}</h3>
                          <p className="text-xs text-muted-foreground">{candidate.personalInfo?.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 font-bold">
                        {candidate.matchScore}% Match
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {candidate.skills?.slice(0, 4).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>
                      ))}
                      {candidate.skills?.length > 4 && <span className="text-xs text-muted-foreground self-center">+{candidate.skills.length - 4} more</span>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/dashboard/employer/candidate/${candidate.userId}`)}
                    >
                      {t('jobPostingDetail.viewProfile')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="applicants">
          <div className="bg-card border border-border rounded-3xl overflow-hidden p-6">
            {candidates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">{t('jobPostingDetail.noApplicants')}</div>
            ) : (
              <div className="grid gap-4">
                {candidates.map((candidate) => (
                  <div key={candidate.userId} className="border border-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-lg font-bold overflow-hidden">
                        {candidate.avatar ? <img src={candidate.avatar} className="w-full h-full object-cover" /> : (candidate.name?.charAt(0) || 'U')}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{candidate.name || t('jobPostingDetail.unknownCandidate')}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Applied {new Date(candidate.appliedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{candidate.experience} Years Exp</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Select
                        defaultValue={candidate.status}
                        onValueChange={(val) => handleStatusChange(candidate.userId, val)}
                      >
                        <SelectTrigger className={`h-8 w-[130px] text-xs border-0 font-medium ${candidate.status === 'APPLIED' ? 'bg-blue-50 text-blue-700' :
                          candidate.status === 'SHORTLISTED' ? 'bg-green-50 text-green-700' :
                            candidate.status === 'INTERVIEW' ? 'bg-purple-50 text-purple-700' :
                              candidate.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                                'bg-gray-50 text-gray-700'
                          }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPLIED">{t('jobPostingDetail.statusApplied')}</SelectItem>
                          <SelectItem value="SHORTLISTED">{t('jobPostingDetail.statusShortlisted')}</SelectItem>
                          <SelectItem value="INTERVIEW">{t('jobPostingDetail.statusInterview')}</SelectItem>
                          <SelectItem value="OFFER">{t('jobPostingDetail.statusOffer')}</SelectItem>
                          <SelectItem value="REJECTED">{t('jobPostingDetail.statusRejected')}</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/employer/candidate/${candidate.userId}`)}>
                        {t('jobPostingDetail.viewProfile')}
                      </Button>
                      {candidate.resumeUrl && (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(candidate.resumeUrl, '_blank')}>
                          <FileText className="w-4 h-4" /> {t('jobPostingDetail.resume')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
