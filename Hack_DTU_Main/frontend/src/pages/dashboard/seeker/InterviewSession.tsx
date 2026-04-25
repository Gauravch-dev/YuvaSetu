import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InterviewAgent } from '@/components/interview/InterviewAgent';
import type { FeedbackData, InterviewData } from '@/lib/interview/types';
import type { ProctoringSummary } from '@/lib/interview/proctor';
import { auth } from '../../../lib/firebase';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (user) return await user.getIdToken();
  return localStorage.getItem('authToken');
};

export const InterviewSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userName = localStorage.getItem('userName') || 'Candidate';

  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) return;

      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE}/interview/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(t('interview.fetchError'));
        }

        const json = await res.json();
        const raw = json.data || json;
        setInterview({ ...raw, id: raw._id || raw.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : t('interview.fetchError');
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterview();
  }, [id, t]);

  const handleInterviewEnd = async (feedbackData: FeedbackData, conversationHistory?: { role: string; content: string }[], proctoringSummary?: ProctoringSummary) => {
    const wasTerminated = proctoringSummary?.summary?.autoTerminated === true;
    const hasConversation = (conversationHistory || []).filter(m => m.role === 'user').length > 0;
    const hasValidScore = typeof feedbackData.totalScore === 'number' && feedbackData.totalScore > 0;

    // DON'T save terminated or empty interviews to DB — cache only for display
    if (wasTerminated || !hasConversation || !hasValidScore) {
      const cacheData = {
        interviewId: id,
        ...feedbackData,
        totalScore: wasTerminated ? 0 : feedbackData.totalScore,
        finalAssessment: wasTerminated
          ? 'Interview was auto-terminated due to repeated proctoring violations.'
          : !hasConversation
          ? 'Interview ended before any responses were given.'
          : feedbackData.finalAssessment,
        conversationHistory: conversationHistory || [],
        proctoringSummary,
        terminated: wasTerminated,
        empty: !hasConversation,
        cachedAt: new Date().toISOString(),
      };
      sessionStorage.setItem(`terminated_interview_${id}`, JSON.stringify(cacheData));
      toast.error(
        wasTerminated
          ? 'Interview terminated due to violations. Results are not saved.'
          : 'Interview ended without responses. Results are not saved.',
      );
      navigate(`/dashboard/interview/${id}/feedback`);
      return;
    }

    // Only save COMPLETED interviews with valid scores to DB
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/interview/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interviewId: id,
          totalScore: feedbackData.totalScore,
          categoryScores: feedbackData.categoryScores,
          strengths: feedbackData.strengths,
          areasForImprovement: feedbackData.areasForImprovement,
          finalAssessment: feedbackData.finalAssessment,
          conversationHistory: conversationHistory || [],
          proctoringSummary: proctoringSummary || null,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('[Feedback] Save failed:', errBody);
        throw new Error(errBody.message || t('interview.saveFeedbackError'));
      }

      toast.success(t('interview.feedbackSaved'));
      navigate(`/dashboard/interview/${id}/feedback`);
    } catch (err) {
      console.error('[Feedback] Save error:', err);
      toast.error(err instanceof Error ? err.message : t('interview.saveFeedbackError'));
      navigate(`/dashboard/interview/${id}/feedback`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-slate-400">{t('interview.loadingInterview')}</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-semibold text-white">
            {t('interview.errorTitle')}
          </h2>
          <p className="text-slate-400">{error || t('interview.notFound')}</p>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/mock-interview')}
          >
            {t('interview.backToInterviews')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <InterviewAgent
      userName={userName}
      interviewId={interview.id}
      questions={interview.questions}
      language={interview.language || 'en'}
      onInterviewEnd={handleInterviewEnd}
    />
  );
};
