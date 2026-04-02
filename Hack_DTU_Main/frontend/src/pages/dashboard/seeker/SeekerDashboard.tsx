import { Sparkles, Frown, Loader2, Send, CheckCircle, Calendar, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/dashboard/JobCard";
import { JobFiltersWidget, JobFiltersState } from "@/components/dashboard/JobFiltersWidget";
import { JobCardSkeleton } from "@/components/dashboard/JobCardSkeleton";
import { useState, useEffect, useMemo } from "react";
import { fetchRecommendedJobs, getJobSeekerProfile, fetchDashboardStats } from "@/lib/auth-api";
import { useToast } from "@/hooks/use-toast";

export const SeekerDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profileName, setProfileName] = useState("User");
  const [stats, setStats] = useState({ applied: 0, shortlisted: 0, interviews: 0, rejected: 0 });
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const { toast } = useToast();

  // Filter State
  const [filters, setFilters] = useState<JobFiltersState>({
    query: '',
    location: '',
    type: 'all',
    minSalary: 0
  });

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // 1. Fetch Profile for Name
          const profile = await getJobSeekerProfile(token);
          if (profile && profile.personalInfo?.fullName) {
            setProfileName(profile.personalInfo.fullName.split(' ')[0]);
          }

          // 2. Fetch Stats
          const dashboardStats = await fetchDashboardStats(token);
          setStats(dashboardStats);

          // 3. Fetch Recommendations
          const jobs = await fetchRecommendedJobs(token);
          setRecommendedJobs(jobs);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        // Toast only on fatal error, stats/recs might partially fail
        toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter Logic (Client-side filtering of recommended jobs)
  const filteredJobs = useMemo(() => {
    return recommendedJobs.filter(job => {
      // 1. Text Search (Title, Company, Skills)
      const query = filters.query.toLowerCase();

      const skillsMatch = Array.isArray(job.skills)
        ? job.skills.some((skill: string) => skill.toLowerCase().includes(query))
        : false;

      const companyName = job.companyProfileId?.companyName || job.company || "";

      const matchesQuery =
        !query ||
        job.title.toLowerCase().includes(query) ||
        companyName.toLowerCase().includes(query) ||
        skillsMatch;

      // 2. Location Search
      const locQuery = filters.location.toLowerCase();
      const matchesLocation =
        !locQuery ||
        (job.location && job.location.toLowerCase().includes(locQuery));

      // 3. Job Type
      const matchesType =
        filters.type === 'all' ||
        job.type === filters.type;

      // 4. Salary
      let matchesSalary = true;
      if (filters.minSalary > 0 && job.salary) {
        const jobMinSalary = parseInt(job.salary.match(/\d+/)?.[0] || '0');
        matchesSalary = jobMinSalary >= filters.minSalary;
      }

      return matchesQuery && matchesLocation && matchesType && matchesSalary;
    });
  }, [filters, recommendedJobs]);

  // Map API data to JobCard props format
  const mappedJobs = filteredJobs.map(job => ({
    id: job._id,
    title: job.title,
    company: job.companyProfileId?.companyName || "Unknown Company",
    logo: job.companyProfileId?.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/2048px-Instagram_icon.png", // Fallback
    location: job.location,
    salary: job.salary,
    type: job.type,
    postedAt: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently',
    matchScore: job.matchScore,
    matchDetails: job.matchDetails, // Pass down details
    skills: job.skills,
    description: job.description,
    requirements: Array.isArray(job.requirements) ? job.requirements : (typeof job.requirements === 'string' ? (job.requirements as string).split('\n') : []),
    benefits: job.benefits // Real data
  }));

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 flex justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      {/* Welcome & Stats Section */}
      {/* Welcome & Stats Section */}
      <div className="flex flex-col xl:flex-row justify-between items-end gap-6">
        <div className="w-full xl:w-auto">
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back, <span className="text-primary">{profileName}</span>!
          </h1>
          <p className="text-muted-foreground">
            Here are the best jobs matching your resume.
          </p>
        </div>

        {/* Application Status Widget */}
        <div className="w-full xl:w-auto bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between xl:justify-end">
          <h3 className="font-bold text-sm text-muted-foreground mr-2 hidden xl:block">Application Status:</h3>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-3 bg-background/70 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Send className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div className="text-xl font-display font-bold text-foreground">{stats.applied}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Applied</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background/70 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-border/50 hover:border-green-500/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <div className="text-xl font-display font-bold text-green-600">{stats.shortlisted}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Shortlisted</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background/70 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-border/50 hover:border-purple-500/30 transition-colors relative">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <div className="text-xl font-display font-bold text-purple-600">{stats.interviews}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Interviews</div>
              </div>
              {stats.interviews > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping" />}
              {stats.interviews > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />}
            </div>
            <div className="flex items-center gap-3 bg-background/70 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-border/50 hover:border-red-500/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <div className="text-xl font-display font-bold text-red-500">{stats.rejected}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* AI Recommendation Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-8 shadow-sm mb-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl border border-primary/20 shadow-sm">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">AI-Recommended Jobs</h3>
            <p className="text-muted-foreground">
              Our AI has analyzed your profile and found <span className="font-bold text-primary">{filteredJobs.length} matches</span> based on your skills!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl">
              {filteredJobs.length > 0 ? "Recommended Jobs" : "No Jobs Found"}
            </h2>
            <span className="text-sm text-muted-foreground">{filteredJobs.length} Results</span>
          </div>

          <div className="grid gap-4">
            {mappedJobs.length > 0 ? (
              mappedJobs.map((job) => (
                <JobCard key={job.id} job={job} filters={filters} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl">
                <Frown className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-bold">No jobs match your filters</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria or clearing filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets - Sticky */}
        <div className="space-y-8 sticky top-24">
          {/* Job Filters Widget */}
          <JobFiltersWidget filters={filters} setFilters={setFilters} />
        </div>
      </div>



    </div>
  );
};
