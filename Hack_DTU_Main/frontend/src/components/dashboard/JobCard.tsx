import { MapPin, Building2, Banknote, Clock, Heart, CheckCircle2, ThumbsUp, ThumbsDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { VectorMatchAnimation } from './VectorMatchAnimation';

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  type: string;
  postedAt: string;
  matchScore: number;
  matchDetails?: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
  };
  skills: string[];
  description?: string;
  requirements?: string[];
  benefits?: string[];
  hasApplied?: boolean;
}

export const JobCard = ({ job, isApplied = false, filters }: {
  job: Job;
  isApplied?: boolean;
  filters?: { location: string; minSalary: number;[key: string]: any };
}) => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleApply = () => {
    navigate(`/dashboard/jobs/${job.id}/apply`, { state: { job } });
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    toast.success(
      type === 'up'
        ? "Great! We'll show you more jobs like this."
        : "Thanks! We'll show fewer jobs like this.",
      {
        description: "Your feedback helps improve recommendations",
      }
    );
  };

  return (
    <div className="group relative bg-card hover:bg-card/80 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-card hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-sm border border-border/50">
            <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Building2 className="w-4 h-4" />
              <span>{job.company}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Match Score with Distribution Breakdown */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${job.matchScore >= 90 ? 'bg-green-500/10 text-green-600 border-green-500/20' :
            job.matchScore >= 75 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
              'bg-muted text-muted-foreground border-border'
            }`}>
            {job.matchScore}% Match
          </div>


          {/* Recommendation Feedback */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${feedback === 'up' ? 'text-green-500' : 'text-muted-foreground hover:text-green-500'}`}
              onClick={() => handleFeedback('up')}
              title="More like this"
              aria-label="Show more jobs like this"
            >
              <ThumbsUp className={`w-4 h-4 ${feedback === 'up' ? 'fill-green-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${feedback === 'down' ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
              onClick={() => handleFeedback('down')}
              title="Fewer like this"
              aria-label="Show fewer jobs like this"
            >
              <ThumbsDown className={`w-4 h-4 ${feedback === 'down' ? 'fill-red-500' : ''}`} />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" aria-label="Save this job">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
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
          {job.postedAt}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {job.skills.slice(0, 3).map((skill) => (
          <Badge key={skill} variant="secondary" className="rounded-md font-normal">
            {skill}
          </Badge>
        ))}
        {job.skills.length > 3 && (
          <Badge variant="outline" className="rounded-md font-normal">
            +{job.skills.length - 3} more
          </Badge>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant={(isApplied || job.hasApplied) ? "outline" : "seeker"}
          className="flex-1 w-full"
          onClick={handleApply}
          disabled={isApplied || job.hasApplied}
        >
          {(isApplied || job.hasApplied) ? "Applied" : "Apply Now"}
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full flex-1">View Details</Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-xl w-full">
            <SheetHeader className="mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-sm border border-border/50 flex-shrink-0">
                  <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold">{job.title}</SheetTitle>
                  <SheetDescription className="text-base font-medium text-foreground">{job.company}</SheetDescription>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> {job.salary}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.postedAt}</span>
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Match Score Distribution */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10 mb-4">
              <div className="flex items-center justify-between mb-4">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <h3 className="font-bold text-sm flex items-center gap-2 cursor-help underline decoration-dotted decoration-primary/50">
                      <Info className="w-4 h-4 text-primary" />
                      Match Distribution
                    </h3>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 bg-slate-950 text-slate-50 border-slate-800" align="start">
                    <div className="space-y-3">
                      <h4 className="font-bold text-sm text-primary mb-2">Multi-Vector AI Match</h4>

                      {/* Visual Animation */}
                      <div className="flex justify-center py-2">
                        <VectorMatchAnimation score={job.matchScore} />
                      </div>

                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2 font-mono">
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-green-400 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div> Skills
                          </span>
                          <span className="text-slate-400">
                            {job.matchDetails?.skills || 0}% × 0.50
                          </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-blue-400 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Experience
                          </span>
                          <span className="text-slate-400">
                            {job.matchDetails?.experience || 0}% × 0.30
                          </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-purple-400 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div> Bio/Fit
                          </span>
                          <span className="text-slate-400">
                            {job.matchDetails?.location || 0}% × 0.20
                          </span>
                        </div>
                        <Separator className="bg-slate-700 my-1" />
                        <div className="flex justify-between font-bold text-sm pt-1">
                          <span className="text-white">Total Score</span>
                          <span className="text-primary">{job.matchScore}%</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-tight">
                        We use 3 separate weighted vectors to calculate your perfect match:
                        <br />
                        <span className="text-white">Score = (Skills×0.5) + (Exp×0.3) + (Bio×0.2)</span>
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <div className="text-2xl font-bold text-primary">{job.matchScore}%</div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium">Skills Match</span>
                    <span className="text-xs font-bold text-green-600">{job.matchDetails?.skills || 85}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: `${job.matchDetails?.skills || 85}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium">Experience Level</span>
                    <span className="text-xs font-bold text-blue-600">{job.matchDetails?.experience || 78}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${job.matchDetails?.experience || 78}%` }} />
                  </div>
                </div>

                {/* Always show Bio/Fit Match (Previously Location) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium">Bio & Culture Fit</span>
                    <span className="text-xs font-bold text-purple-600">{job.matchDetails?.location || 92}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" style={{ width: `${job.matchDetails?.location || 92}%` }} />
                  </div>
                </div>

                {/* Only show Salary Match if user filtered by Min Salary */}
                {(filters?.minSalary && filters.minSalary > 0) ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium">Salary Range</span>
                      <span className="text-xs font-bold text-orange-600">{job.matchDetails?.salary || 88}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" style={{ width: `${job.matchDetails?.salary || 88}%` }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <Separator className="my-4" />

            <ScrollArea className="h-[calc(100vh-250px)] pr-6">
              <div className="space-y-6 pb-32">
                <div>
                  <h3 className="font-bold text-lg mb-2">About the Role</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {job.description || "As a key member of our specific team, you will drive innovation and build scalable solutions. You'll work closely with cross-functional teams to define, design, and ship new features."}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3">Key Requirements</h3>
                  <ul className="space-y-2">
                    {((job.requirements && job.requirements.length > 0) ? job.requirements : [
                      "3+ years of experience in relevant field",
                      "Strong proficiency in modern technologies",
                      "Experience with cloud platforms (AWS/GCP/Azure)",
                      "Excellent problem-solving skills",
                      "Strong communication and teamwork abilities"
                    ]).map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3">Benefits</h3>
                  <ul className="grid grid-cols-2 gap-2">
                    {(job.benefits || [
                      "Competitive Salary", "Remote Work Options", "Health Insurance", "Stock Options", "Learning Budget", "Team Retreats"
                    ]).map((benefit, i) => (
                      <li key={i} className="bg-muted/30 p-2.5 rounded-lg text-sm font-medium border border-border/50 text-center">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4">
                  <h3 className="font-bold text-lg mb-3">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border mt-auto">
              <Button
                size="lg"
                className="w-full text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all"
                onClick={handleApply}
                disabled={isApplied}
                variant={isApplied ? "outline" : "default"}
              >
                {isApplied ? "Applied" : "Apply Now"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
