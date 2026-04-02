import { useState, useEffect } from 'react';
import { exportResumeToPDF } from '@/lib/resume-export';
import type { OnboardingData } from '@/contexts/OnboardingContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Star,
  CheckCircle2,
  MoreHorizontal,
  Download,
  MessageSquare,
  Calendar,
  Eye,
  FileText,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { VectorMatchAnimation } from "@/components/dashboard/VectorMatchAnimation";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { fetchJobById } from '@/lib/auth-api';
import { fetchJobCandidates, fetchJobAnalytics, updateApplicationStatus } from '@/lib/api/jobs';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const VisualCandidatesDemo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');

  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  // Helper to construct Radar Data from flat matchDetails
  const getRadarData = (details: any) => {
    if (!details) return [];
    return [
      { subject: 'Skills', A: details.skills || 0, fullMark: 100 },
      { subject: 'Exp', A: details.experience || 0, fullMark: 100 },
      { subject: 'Role Fit', A: details.roleFit || 0, fullMark: 100 },
      { subject: 'Culture', A: Math.max((details.roleFit || 0) - 10, 60), fullMark: 100 },
      { subject: 'Comm', A: Math.max((details.skills || 0) - 5, 70), fullMark: 100 },
    ];
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || !id) return;

        // Parallel Fetching
        const [jobData, candidatesData, analyticsData] = await Promise.all([
          fetchJobById(token, id),
          fetchJobCandidates(id, token),
          fetchJobAnalytics(id, token)
        ]);

        setJob(jobData);
        setCandidates(candidatesData);
        setAnalytics(analyticsData);

      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !job?._id) return;

      await updateApplicationStatus(job._id, userId, newStatus, token);

      // Optimistic Update
      setCandidates(prev => prev.map(c =>
        c.userId === userId ? { ...c, status: newStatus } : c
      ));

      toast({ title: "Updated", description: `Candidate status changed to ${newStatus}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleExportDB = () => {
    if (!candidates || candidates.length === 0) {
      toast({ title: "No Data", description: "No candidates to export", variant: "destructive" });
      return;
    }

    // CSV Header (Added Granular Analytics Keys)
    const headers = [
      "Name", "Email", "Phone", "Status", "Match Score",
      "Skills Match", "Experience Fit", "Role Fit", // Added Analytics Columns
      "Role", "Experience (Years)", "LinkedIn", "GitHub", "Applied At"
    ];

    // CSV Rows
    const rows = candidates.map(c => [
      `"${c.name || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.status}"`,
      `"${c.matchScore}%"`,
      `"${c.matchDetails?.skills || 0}%"`,     // Analytics: Skills
      `"${c.matchDetails?.experience || 0}%"`, // Analytics: Experience
      `"${c.matchDetails?.roleFit || 0}%"`,    // Analytics: Role Fit
      `"${c.role || ''}"`,
      `"${Array.isArray(c.experience) ? c.experience.length : (c.experience || 0)}"`,
      `"${c.links?.linkedin || ''}"`,
      `"${c.links?.github || ''}"`,
      `"${new Date(c.appliedAt).toLocaleDateString()}"`
    ]);

    // Combine
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Create Blob and Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Candidates_${job?.title || 'Export'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export Successful", description: "Candidate database downloaded as CSV" });
  };

  if (isLoading) {
    return (
      <div className="flex bg-background h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) return <div>Job not found</div>;

  return (
    <div
      className="min-h-screen bg-background p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto animate-fade-in pb-20"
      style={{
        // @ts-ignore
        "--primary": "var(--employer)",
        "--primary-foreground": "0 0% 100%",
        "--ring": "var(--employer)",
      } as React.CSSProperties}
    >

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
              {job.status === 'PUBLISHED' ? 'Active Job' : job.status}
            </Badge>
            <span className="text-sm text-muted-foreground">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" /> {job.type}
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> {job.salary}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="employer" className="gap-2" onClick={handleExportDB}>
            <Download className="w-4 h-4" /> Export DB
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/dashboard/employer/postings')}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>
      </div>

      {/* Stats Cards & Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats Cards */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Applicants</p>
                  <h3 className="text-3xl font-display font-bold text-primary">{analytics?.pipeline?.total || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Match Score</p>
                  <h3 className="text-3xl font-display font-bold text-green-600">{analytics?.avgMatch || 0}%</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Additional Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">In Pipeline</p>
                {/* Sum of Shortlisted + Interview + Offer */}
                <h4 className="text-2xl font-bold text-orange-600">
                  {(analytics?.pipeline?.shortlisted || 0) + (analytics?.pipeline?.interview || 0) + (analytics?.pipeline?.offer || 0)}
                </h4>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Interviews</p>
                <h4 className="text-2xl font-bold text-blue-600">{analytics?.pipeline?.interview || 0}</h4>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Middle Column: Match Distribution Chart */}
        <Card className="col-span-1 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Match Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.matchDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="range" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Applicant Trends */}
        <Card className="col-span-1 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Applicant Activity (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.applicantTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  />
                  <Bar dataKey="applicants" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-6">
          <TabsTrigger value="all">All Candidates</TabsTrigger>
          <TabsTrigger value="top">Top Matches ({'>'}80%)</TabsTrigger>
          <TabsTrigger value="pipeline">In Pipeline</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {candidates.map((candidate) => (
              <div
                key={candidate.userId}
                className="group relative bg-card hover:bg-muted/30 border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Match Score Indicator - Mocking Score as we don't store it persistently per candidate list usually, but let's see if candidates API returns it */}
                {/* Assuming API returns matchScore now or we calculate simple one */}
                <div className="absolute top-4 right-4 z-10">
                  <div className={`
                    flex flex-col items-center justify-center w-14 h-14 rounded-xl font-bold text-sm border-2 shadow-sm bg-card
                    ${(candidate.matchScore || 0) >= 90 ? 'border-green-500 text-green-600' :
                      (candidate.matchScore || 0) >= 80 ? 'border-blue-500 text-blue-600' : 'border-orange-500 text-orange-600'}
                  `}>
                    <span>{candidate.matchScore || '?'}%</span>
                    <span className="text-[10px] uppercase font-normal text-muted-foreground">Match</span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Avatar & Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <Avatar className="w-16 h-16 border-2 border-primary/10 shadow-md">
                      <AvatarImage src={candidate.avatar} />
                      <AvatarFallback>{candidate.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="pt-1">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {candidate.name || 'Candidate'}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{candidate.role || 'Job Seeker'}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {Array.isArray(candidate.experience) ? candidate.experience.length : (candidate.experience || 0)} roles exp
                      </p>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-2 mb-6 h-16 overflow-hidden content-start">
                    {candidate.skills?.slice(0, 3).map((skill: string) => (
                      <span key={skill} className="px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground border border-border">
                        {skill}
                      </span>
                    ))}
                    {candidate.skills?.length > 3 && (
                      <span className="px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground border border-border">
                        +{candidate.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Match Breakdown */}
                  <div className="space-y-3 mb-6 bg-muted/30 p-4 rounded-xl">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">General Fit</span>
                        <span className="font-medium">{candidate.matchScore || 0}%</span>
                      </div>
                      <Progress value={candidate.matchScore || 0} className="h-1.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Skills</span>
                        <span className="font-medium">{candidate.matchDetails?.skills || 0}%</span>
                      </div>
                      <Progress value={candidate.matchDetails?.skills || 0} className="h-1.5" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="w-full h-9 text-xs bg-primary hover:bg-primary/90"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <Eye className="w-3 h-3 mr-2" /> View Profile
                    </Button>

                    {/* Status Change Dropdown */}
                    <Select
                      defaultValue={candidate.status}
                      onValueChange={(val) => handleStatusChange(candidate.userId, val)}
                    >
                      <SelectTrigger className={`w-full h-9 text-xs border-0 font-medium ${candidate.status === 'APPLIED' ? 'bg-blue-50 text-blue-700' :
                        candidate.status === 'SHORTLISTED' ? 'bg-green-50 text-green-700' :
                          candidate.status === 'INTERVIEW' ? 'bg-purple-50 text-purple-700' :
                            candidate.status === 'OFFER' ? 'bg-teal-50 text-teal-700' :
                              candidate.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                                'bg-gray-50 text-gray-700'
                        }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPLIED">Applied</SelectItem>
                        <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                        <SelectItem value="INTERVIEW">Interview</SelectItem>
                        <SelectItem value="OFFER">Offer</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Simplified other tabs logic for demo purposes - just filtering candidates array */}
        <TabsContent value="top" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {candidates.filter(c => (c.matchScore || 0) >= 80).map(candidate => (
              // Reusing the same card structure would be better as a component, but for now copying basics
              <div key={candidate.userId} className="p-6 border rounded-2xl bg-card">
                <h3 className="font-bold">{candidate.name}</h3>
                <div className="text-green-600 font-bold">{candidate.matchScore}% Match</div>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate(`/dashboard/employer/candidate/${candidate.userId}`)}>View Profile</Button>
              </div>
            ))}
            {candidates.filter(c => (c.matchScore || 0) >= 80).length === 0 && <div className="col-span-4 text-center py-10 text-muted-foreground">No top matches found.</div>}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {candidates.filter(c => ['SHORTLISTED', 'INTERVIEW', 'OFFER'].includes(c.status)).map(candidate => (
              <div key={candidate.userId} className="p-6 border rounded-2xl bg-card">
                <h3 className="font-bold">{candidate.name}</h3>
                <Badge>{candidate.status}</Badge>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate(`/dashboard/employer/candidate/${candidate.userId}`)}>View Profile</Button>
              </div>
            ))}
            {candidates.filter(c => ['SHORTLISTED', 'INTERVIEW', 'OFFER'].includes(c.status)).length === 0 && <div className="col-span-4 text-center py-10 text-muted-foreground">No candidates in pipeline.</div>}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {candidates.filter(c => c.status === 'REJECTED').map(candidate => (
              <div key={candidate.userId} className="p-6 border rounded-2xl bg-card opacity-70">
                <h3 className="font-bold">{candidate.name}</h3>
                <Badge variant="destructive">Rejected</Badge>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate(`/dashboard/employer/candidate/${candidate.userId}`)}>View Profile</Button>
              </div>
            ))}
            {candidates.filter(c => c.status === 'REJECTED').length === 0 && <div className="col-span-4 text-center py-10 text-muted-foreground">No rejected candidates.</div>}
          </div>
        </TabsContent>

      </Tabs>

      {/* Candidate Details Dialog */}
      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-3xl overflow-hidden p-0 gap-0">
          <div className="w-full h-full bg-background">
            {selectedCandidate && (
              <>
                <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={selectedCandidate.avatar} />
                      <AvatarFallback className="text-lg">{selectedCandidate.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-2xl font-bold">{selectedCandidate.name}</DialogTitle>
                      <DialogDescription className="text-base flex items-center gap-2 mt-1">
                        <Briefcase className="w-4 h-4" /> {selectedCandidate.role || 'Job Seeker'}
                        <span className="text-muted-foreground">•</span>
                        <Clock className="w-4 h-4" /> {Array.isArray(selectedCandidate.experience) ? selectedCandidate.experience.length : (selectedCandidate.experience || 0)} years exp
                      </DialogDescription>
                      <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                        {selectedCandidate.email && <p>Email: {selectedCandidate.email}</p>}
                        {selectedCandidate.phone && <p>Phone: {selectedCandidate.phone}</p>}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      const url = selectedCandidate.resume || selectedCandidate.resumeUrl;

                      if (url) {
                        window.open(url, '_blank');
                      } else {
                        // Map to OnboardingData for standardized PDF generation
                        const resumeData: OnboardingData = {
                          personalInfo: {
                            fullName: selectedCandidate.name,
                            email: selectedCandidate.email || '',
                            phone: selectedCandidate.phone || '',
                            bio: selectedCandidate.bio || '',
                            linkedin: selectedCandidate.links?.linkedin,
                            github: selectedCandidate.links?.github,
                            portfolio: selectedCandidate.links?.portfolio,
                          },
                          education: selectedCandidate.education?.map((e: any) => ({
                            id: e._id || Math.random().toString(),
                            institution: e.institution,
                            degree: e.degree,
                            year: e.year,
                            score: e.score
                          })) || [],
                          experience: selectedCandidate.experience?.map((e: any) => ({
                            id: e._id || Math.random().toString(),
                            role: e.role,
                            company: e.company,
                            duration: e.duration,
                            description: e.description
                          })) || [],
                          projects: selectedCandidate.projects?.map((p: any) => ({
                            id: p._id || Math.random().toString(),
                            title: p.title,
                            description: p.description,
                            technologies: p.technologies,
                            link: p.link
                          })) || [],
                          certifications: selectedCandidate.certifications?.map((c: any) => ({
                            id: c._id || Math.random().toString(),
                            title: c.title,
                            issuer: c.issuer,
                            year: c.year
                          })) || [],
                          skills: selectedCandidate.skills || []
                        };

                        toast({ title: "Generating Resume", description: "Creating standardized PDF..." });

                        try {
                          await exportResumeToPDF(resumeData, `${selectedCandidate.name}_Resume.pdf`);
                          toast({ title: "Success", description: "Resume downloaded successfully" });
                        } catch (error) {
                          console.error("PDF Gen Error", error);
                          toast({ title: "Error", description: "Failed to generate resume", variant: "destructive" });
                        }
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" /> {selectedCandidate.resumeUrl ? 'View Resume' : 'Download Resume'}
                  </Button>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 h-full">

                  {/* Left: Radar Chart */}
                  <div className="md:col-span-2 bg-muted/10 p-6 flex flex-col items-center justify-center border-r">
                    <h4 className="font-bold text-sm text-center mb-4">Detailed Match Profile</h4>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData(selectedCandidate.matchDetails)}>
                          <PolarGrid stroke="var(--border)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Match"
                            dataKey="A"
                            stroke="var(--primary)"
                            fill="var(--primary)"
                            fillOpacity={0.3}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-4">
                      <div className="text-3xl font-bold text-primary">{selectedCandidate.matchScore}%</div>
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Overall Match</div>
                    </div>
                  </div>

                  {/* Right: Details & Status */}
                  <div className="md:col-span-3 p-6 space-y-6">

                    {/* Summary Actions */}
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-destructive/10" >
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">Current Status</p>
                        <Select
                          defaultValue={selectedCandidate.status}
                          onValueChange={(val) => handleStatusChange(selectedCandidate.userId, val)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APPLIED">Applied</SelectItem>
                            <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                            <SelectItem value="INTERVIEW">Interview</SelectItem>
                            <SelectItem value="OFFER">Offer</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Skills */}
                    <div>
                      <h4 className="font-bold text-sm mb-3">Top Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills?.map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Fit Breakdown */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Skills Match</span>
                          <span className="font-bold">{selectedCandidate.matchDetails?.skills || 0}%</span>
                        </div>
                        <Progress value={selectedCandidate.matchDetails?.skills || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Direct Experience</span>
                          <span className="font-bold">{selectedCandidate.matchDetails?.experience || 0}%</span>
                        </div>
                        <Progress value={selectedCandidate.matchDetails?.experience || 0} className="h-2" />
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};
