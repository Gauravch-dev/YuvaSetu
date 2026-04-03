"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useServerUser } from "@/contexts/UserContext";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Download, Loader2 } from "lucide-react";

// Session storage key for caching reports data
const REPORTS_CACHE_KEY = "tpo_reports_cache";

interface College {
  id: string;
  name: string;
  branches: string[];
  years: number[];
  tpoUserId: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  questions: string[];
  createdAt: string;
  targetColleges?: string[];
  targetBranches?: string[];
  targetYears?: number[];
  submissionCount?: number;
}

const ReportsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: firebaseUser, loading, authInitialized } = useFirebaseAuth();
  const { serverUser } = useServerUser();
  const [isTPO, setIsTPO] = useState<boolean | null>(null); // null = not checked yet
  const [college, setCollege] = useState<College | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filters, setFilters] = useState({
    branch: searchParams.get("branch") || "",
    year: searchParams.get("year") || ""
  });

  // Reset branch and year when college changes (handled automatically since we only have one college per TPO)
  const [showTable, setShowTable] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [hasRestoredFromCache, setHasRestoredFromCache] = useState(false);

  // Use server user immediately if available
  const userId = serverUser?.id || firebaseUser?.uid;

  // Restore from cache on mount if we have the "loaded" param
  useEffect(() => {
    if (hasRestoredFromCache) return;

    const shouldRestore = searchParams.get("loaded") === "true";
    if (shouldRestore && typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(REPORTS_CACHE_KEY);
        if (cached) {
          const { interviews: cachedInterviews, filters: cachedFilters } = JSON.parse(cached);
          if (cachedInterviews && cachedInterviews.length > 0) {
            setInterviews(cachedInterviews);
            setFilters(cachedFilters || { branch: "", year: "" });
            setShowTable(true);
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
    }
    setHasRestoredFromCache(true);
  }, [searchParams, hasRestoredFromCache]);

  useEffect(() => {
    if (!userId) {
      if (!loading && authInitialized) {
        router.push("/sign-in");
      }
      return;
    }

    // Need firebaseUser for the ID token
    if (!firebaseUser) {
      return;
    }

    // Check if user is TPO
    checkTPOAccess();
  }, [userId, firebaseUser, loading, authInitialized, router]);

  const checkTPOAccess = async () => {
    setCheckingAccess(true);
    try {
      // Need Firebase user for the ID token
      if (!firebaseUser) {
        // If we have serverUser but not firebaseUser yet, wait for it
        return;
      }

      const idToken = await firebaseUser.getIdToken();
      const response = await fetch("/api/reports", {
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setIsTPO(true);
        // Fetch college details
        await fetchCollegeDetails(result.collegeId);
      } else {
        setIsTPO(false);
      }
    } catch (error) {
      console.error("Error checking TPO access:", error);
      setIsTPO(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchCollegeDetails = async (collegeId: string) => {
    try {
      if (!firebaseUser) return;
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch("/api/colleges", {
        headers: { "Authorization": `Bearer ${idToken}` },
      });
      const result = await response.json();

      if (result.success) {
        const collegeData = result.data.find((c: College) => c.id === collegeId);
        if (collegeData) {
          setCollege(collegeData);
        }
      }
    } catch (error) {
      console.error("Error fetching college details:", error);
    }
  };

  const fetchInterviews = async () => {
    if (!firebaseUser || !college) {
      return;
    }

    setLoadingReports(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const params = new URLSearchParams({
        ...(filters.branch && { branch: filters.branch }),
        ...(filters.year && { year: filters.year }),
      });

      const url = `/api/reports?${params}`;

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        const loadedInterviews = result.data || [];
        setInterviews(loadedInterviews);
        setShowTable(true);

        // Cache data in sessionStorage for back navigation
        if (typeof window !== "undefined") {
          sessionStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify({
            interviews: loadedInterviews,
            filters: filters
          }));
        }

        // Update URL to indicate data is loaded (for back navigation)
        const urlParams = new URLSearchParams();
        urlParams.set("loaded", "true");
        if (filters.branch) urlParams.set("branch", filters.branch);
        if (filters.year) urlParams.set("year", filters.year);
        router.replace(`/reports?${urlParams.toString()}`, { scroll: false });
      } else {
        toast.error("Failed to fetch interviews");
      }
    } catch {
      toast.error("Failed to fetch interviews");
    } finally {
      setLoadingReports(false);
    }
  };

  const viewReport = (interviewId: string) => {
    setLoadingReportId(interviewId);
    // Navigate to report page - back button will return to this cached state
    router.push(`/reports/${interviewId}`);
  };

  const handleDownloadClick = () => {
    setLoadingDownload(true);
    router.push("/reportsdownload");
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
  if (isTPO === false || !college) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Not Allowed</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the reports section.
            This area is restricted to Training and Placement Officers (TPO) only.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-gradient-to-r from-[#b8b3f5] to-[#d4d0fc] hover:from-[#cac5fe] hover:to-[#e0dcff] text-dark-100 font-bold rounded-xl transition-colors duration-200 shadow-lg"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto p-6">


      {/* Header Actions */}
      <div className="border-gradient p-0.5 rounded-2xl w-full">
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xl font-bold">Filter Interviews</h3>
            <button
              onClick={handleDownloadClick}
              disabled={loadingDownload}
              className="px-6 py-2.5 bg-[#27282f]/80 border border-white/10 hover:border-[#cac5fe]/50 text-light-100 hover:text-white font-semibold rounded-xl transition-all duration-200 hover:bg-[#27282f] whitespace-nowrap flex items-center gap-2 disabled:opacity-70"
            >
              {loadingDownload ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loadingDownload ? "Loading..." : "Download All Reports"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 form">
            <div>
              <label className="label">Filter by Branch</label>
              <select
                value={filters.branch}
                onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                className="flex h-12 w-full rounded-xl border border-white/10 bg-[#27282f]/80 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cac5fe]/20 focus-visible:border-[#cac5fe] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              >
                <option value="" className="bg-[#27282f] text-white">All Branches</option>
                {college.branches.map((branch) => (
                  <option key={branch} value={branch} className="bg-[#27282f] text-white">
                    {branch}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="label">Filter by Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                className="flex h-12 w-full rounded-xl border border-white/10 bg-[#27282f]/80 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cac5fe]/20 focus-visible:border-[#cac5fe] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              >
                <option value="" className="bg-[#27282f] text-white">All Years</option>
                {college.years.map((year) => (
                  <option key={year} value={year} className="bg-[#27282f] text-white">
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchInterviews}
                disabled={loadingReports}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-[#b8b3f5] to-[#d4d0fc] hover:from-[#cac5fe] hover:to-[#e0dcff] text-dark-100 font-bold rounded-xl transition-all duration-200 shadow-lg h-12 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loadingReports ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load Reports"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {showTable && (
        <div className="border-gradient p-0.5 rounded-2xl w-full">
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">
              Interview Reports ({interviews.length})
            </h3>
            {interviews.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-800 dark:bg-gray-900">
                      <th className="border border-border px-4 py-3 text-left text-white font-semibold">Role</th>
                      <th className="border border-border px-4 py-3 text-left text-white font-semibold">Target Branches</th>
                      <th className="border border-border px-4 py-3 text-left text-white font-semibold">Target Years</th>
                      <th className="border border-border px-4 py-3 text-left text-white font-semibold">Questions</th>
                      <th className="border border-border px-4 py-3 text-left text-white font-semibold">Submissions</th>
                      <th className="border border-border px-4 py-3 text-left text-white font-semibold">Created</th>
                      <th className="border border-border px-4 py-3 text-left text-white font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map((interview) => (
                      <tr key={interview.id} className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="border border-border px-4 py-3 text-black dark:text-white">{interview.role}</td>
                        <td className="border border-border px-4 py-3 text-black dark:text-white">
                          <div className="flex flex-wrap gap-1">
                            {(interview.targetBranches || []).slice(0, 2).map((branch, idx) => (
                              <span key={idx} className="bg-success-100 text-dark-100 text-xs px-2 py-1 rounded">
                                {branch}
                              </span>
                            ))}
                            {(interview.targetBranches || []).length > 2 && (
                              <span className="text-gray-500 dark:text-gray-400 text-xs">
                                +{(interview.targetBranches || []).length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border border-border px-4 py-3 text-black dark:text-white">
                          <div className="flex flex-wrap gap-1">
                            {(interview.targetYears || []).slice(0, 2).map((year, idx) => (
                              <span key={idx} className="bg-primary-200 text-dark-100 text-xs px-2 py-1 rounded">
                                {year}
                              </span>
                            ))}
                            {(interview.targetYears || []).length > 2 && (
                              <span className="text-gray-500 dark:text-gray-400 text-xs">
                                +{(interview.targetYears || []).length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border border-border px-4 py-3 text-black dark:text-white">{interview.questions.length}</td>
                        <td className="border border-border px-4 py-3 text-black dark:text-white">
                          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded font-medium">
                            {interview.submissionCount ?? 0}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-3 text-black dark:text-white">
                          {new Date(interview.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border border-border px-4 py-3">
                          <button
                            onClick={() => viewReport(interview.id)}
                            disabled={loadingReportId === interview.id}
                            className="px-4 py-2 bg-gradient-to-r from-[#b8b3f5] to-[#d4d0fc] hover:from-[#cac5fe] hover:to-[#e0dcff] text-dark-100 font-bold rounded-xl transition-all duration-200 shadow-lg text-sm disabled:opacity-70 flex items-center gap-2"
                          >
                            {loadingReportId === interview.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "View"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-foreground text-lg font-medium">No interviews found for the selected filters.</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Try adjusting your filters or check back later when interviews are assigned to your students.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!showTable && (
        <div className="border-gradient p-0.5 rounded-2xl w-full">
          <div className="card p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to View Reports?</h3>
            <p className="text-light-100 mb-6">
              Set your filters above and click "Load Reports" to see interview analytics for your students.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage; 