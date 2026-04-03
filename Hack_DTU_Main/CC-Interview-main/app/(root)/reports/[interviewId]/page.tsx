"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2 } from "lucide-react";

// Session storage key for caching student attempts
const getAttemptsCacheKey = (interviewId: string) => `tpo_attempts_${interviewId}`;

interface StudentAttempt {
  feedbackId: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userBranch?: string;
  userYear?: string;
  totalScore: number | string; // Allow "Cannot be determined"
  categoryScores?: Array<{
    name: string;
    score: number | string; // Allow "Cannot be determined"
    comment: string;
  }>;
  strengths?: string[];
  areasForImprovement?: string[];
  finalAssessment?: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  questions: string[];
  createdAt: string;
}



const InterviewReportPage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const interviewId = params.interviewId as string;

  const { user, loading, authInitialized } = useFirebaseAuth();
  const [isTPO, setIsTPO] = useState<boolean | null>(null); // null = not checked yet
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [loadingFeedbackId, setLoadingFeedbackId] = useState<string | null>(null);
  const [hasRestoredFromCache, setHasRestoredFromCache] = useState(false);

  // Restore UI data from cache (TPO access is still verified server-side)
  useEffect(() => {
    if (hasRestoredFromCache || !interviewId) return;

    const shouldRestore = searchParams.get("loaded") === "true";
    if (shouldRestore && typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(getAttemptsCacheKey(interviewId));
        if (cached) {
          const { attempts: cachedAttempts, interview: cachedInterview } = JSON.parse(cached);
          if (cachedAttempts) {
            // Only restore data for display — access check still runs via checkAccess()
            setAttempts(cachedAttempts);
            setInterview(cachedInterview);
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
    }
    setHasRestoredFromCache(true);
  }, [searchParams, hasRestoredFromCache, interviewId]);

  useEffect(() => {
    if (!authInitialized) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }
    
    // Check TPO access and fetch data
    checkAccess(user);
  }, [user, authInitialized, router, interviewId]);

  const checkAccess = async (user: User) => {
    setCheckingAccess(true);
    try {
      const idToken = await user.getIdToken();

      // Check TPO access
      const accessResponse = await fetch("/api/reports", {
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      });

      const accessResult = await accessResponse.json();

      if (!accessResult.success) {
        setIsTPO(false);
        return;
      }

      setIsTPO(true);

      // Fetch interview attempts
      await fetchInterviewAttempts(idToken);

    } catch (error) {
      console.error("Error checking access:", error);
      setIsTPO(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchInterviewAttempts = async (idToken: string) => {
    try {
      // Also fetch interview details
      const [attemptsResponse, interviewResponse] = await Promise.all([
        fetch(`/api/reports/${interviewId}`, {
          headers: { "Authorization": `Bearer ${idToken}` },
        }),
        fetch(`/api/interviews/${interviewId}`, {
          headers: { "Authorization": `Bearer ${idToken}` },
        }).catch(() => null) // Interview details are optional
      ]);

      const result = await attemptsResponse.json();

      if (result.success) {
        // Map the API response to match our interface
        const mappedAttempts = (result.attempts || []).map((attempt: any) => ({
          feedbackId: attempt.feedbackId,
          userName: attempt.studentName,
          userEmail: attempt.studentEmail,
          userBranch: attempt.branch,
          userYear: attempt.year,
          totalScore: attempt.totalScore,
          createdAt: attempt.attemptDate,
          categoryScores: [],
          strengths: [],
          areasForImprovement: [],
          finalAssessment: ""
        }));

        setAttempts(mappedAttempts);

        // Try to get interview details
        let interviewData = null;
        if (interviewResponse) {
          try {
            const interviewResult = await interviewResponse.json();
            if (interviewResult.success) {
              interviewData = interviewResult.interview;
              setInterview(interviewData);
            }
          } catch (e) {
            // Interview details are optional
          }
        }

        // Cache data in sessionStorage for back navigation
        if (typeof window !== "undefined") {
          sessionStorage.setItem(getAttemptsCacheKey(interviewId), JSON.stringify({
            attempts: mappedAttempts,
            interview: interviewData
          }));
        }

        // Update URL to indicate data is loaded
        router.replace(`/reports/${interviewId}?loaded=true`, { scroll: false });
      } else {
        toast.error("Failed to fetch interview attempts");
      }
    } catch (error) {
      console.error("Error fetching attempts:", error);
      toast.error("Failed to fetch interview attempts");
    }
  };

  const showFeedback = (attempt: StudentAttempt) => {
    setLoadingFeedbackId(attempt.feedbackId);
    router.push(`/interview/${interviewId}/feedback?feedbackId=${attempt.feedbackId}`);
  };



  const getScoreColor = (score: number | string) => {
    if (typeof score === 'string') return "text-gray-600 bg-gray-100"; // For "Cannot be determined"
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Helper function to format score display
  const formatScore = (score: number | string): string => {
    if (typeof score === 'string') return score; // "Cannot be determined"
    return `${score}%`;
  };

  // Helper functions for calculations
  const getNumericScores = (attempts: StudentAttempt[]): number[] => {
    return attempts
      .map(a => a.totalScore)
      .filter((score): score is number => typeof score === 'number');
  };

  const calculateAverage = (attempts: StudentAttempt[]): string => {
    const numericScores = getNumericScores(attempts);
    if (numericScores.length === 0) return "Cannot be determined";
    return Math.round(numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length).toString();
  };

  const calculateHighest = (attempts: StudentAttempt[]): string => {
    const numericScores = getNumericScores(attempts);
    if (numericScores.length === 0) return "Cannot be determined";
    return Math.max(...numericScores).toString();
  };

  const calculatePassed = (attempts: StudentAttempt[]): number => {
    const numericScores = getNumericScores(attempts);
    return numericScores.filter(score => score >= 70).length;
  };

  // Show loading while checking auth or TPO access
  if (loading || checkingAccess || isTPO === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  // Only show access denied after the check is complete
  if (isTPO === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Not Allowed</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view this report.
          </p>
          <Button 
            onClick={() => router.push("/reports")}
            className="btn-primary"
          >
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button 
          onClick={() => router.back()}
          className="btn-secondary"
        >
          ← Back to Reports
        </Button>
      </div>

      {/* Interview Details */}
      {interview && (
        <div className="card-border">
          <div className="card p-6">
            <h1 className="text-3xl font-bold mb-4">Interview Report</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-semibold">{interview.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Level</p>
                <p className="font-semibold">{interview.level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-semibold">{interview.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Questions</p>
                <p className="font-semibold">{interview.questions.length}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {interview.techstack.map((tech, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Attempts */}
      <div className="card-border">
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">
            Student Attempts ({attempts.length})
          </h2>
          
          {attempts.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {attempts.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Attempts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {calculateAverage(attempts)}
                  </p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {calculateHighest(attempts)}
                  </p>
                  <p className="text-sm text-gray-600">Highest Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {calculatePassed(attempts)}
                  </p>
                  <p className="text-sm text-gray-600">Passed (≥70%)</p>
                </div>
              </div>

              {/* Attempts Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-gray-800 dark:bg-gray-900">
                      <th className="border border-border px-4 py-2 text-left text-white font-semibold">Student Name</th>
                      <th className="border border-border px-4 py-2 text-left text-white font-semibold">Email</th>
                      <th className="border border-border px-4 py-2 text-left text-white font-semibold">Branch</th>
                      <th className="border border-border px-4 py-2 text-left text-white font-semibold">Year</th>
                      <th className="border border-border px-4 py-2 text-left text-white font-semibold">Total Score</th>
                      <th className="border border-border px-4 py-2 text-left text-white font-semibold">Attempt Date</th>
                      <th className="border border-border px-4 py-2 text-left text-white font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.feedbackId} className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700">
                        <td className="border border-border px-4 py-2 font-medium text-black dark:text-white">
                          {attempt.userName}
                        </td>
                        <td className="border border-border px-4 py-2 text-black dark:text-white">
                          {attempt.userEmail}
                        </td>
                        <td className="border border-border px-4 py-2 text-black dark:text-white">
                          {attempt.userBranch || "N/A"}
                        </td>
                        <td className="border border-border px-4 py-2 text-black dark:text-white">
                          {attempt.userYear || "N/A"}
                        </td>
                        <td className="border border-border px-4 py-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(attempt.totalScore)}`}>
                            {formatScore(attempt.totalScore)}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-2 text-black dark:text-white">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border border-border px-4 py-2">
                          <Button
                            onClick={() => showFeedback(attempt)}
                            disabled={loadingFeedbackId === attempt.feedbackId}
                            className="btn-primary text-sm disabled:opacity-70"
                          >
                            {loadingFeedbackId === attempt.feedbackId ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                                Loading...
                              </>
                            ) : (
                              "View Feedback"
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No students have attempted this interview yet.</p>
              <p className="text-gray-400 text-sm mt-2">
                Check back later once students start taking the interview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewReportPage; 