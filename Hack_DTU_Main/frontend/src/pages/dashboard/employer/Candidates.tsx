import { Search, FileText, Loader2, CheckCircle2, XCircle, Calendar, Timer, User, Mail, Briefcase, MapPin, GraduationCap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { fetchJobs } from '@/lib/auth-api';
import { fetchJobCandidates, updateApplicationStatus } from '@/lib/api/jobs';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/context/SocketContext';
import { useNavigate } from 'react-router-dom';

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'INTERVIEW': return { bg: 'bg-purple-500', lightBg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/30' };
    case 'SHORTLISTED': return { bg: 'bg-green-500', lightBg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' };
    case 'REJECTED': return { bg: 'bg-red-500', lightBg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' };
    case 'OFFER': return { bg: 'bg-emerald-500', lightBg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30' };
    default: return { bg: 'bg-blue-500', lightBg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' };
  }
};

export const Candidates = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { socket } = useSocket();

  // Fetch Jobs on Mount
  useEffect(() => {
    const loadJobs = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const data = await fetchJobs(token, 'PUBLISHED');
        setJobs(data);
        if (data.length > 0) {
          setSelectedJobId(data[0]._id);
        }
      }
    };
    loadJobs();
  }, []);

  // Fetch Candidates when Job Changes
  useEffect(() => {
    const loadCandidates = async () => {
      if (selectedJobId === 'all' || !selectedJobId) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const data = await fetchJobCandidates(selectedJobId, token);
          setCandidates(data);
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to load candidates", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadCandidates();
  }, [selectedJobId]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await updateApplicationStatus(selectedJobId, userId, newStatus, token);

      setCandidates(prev => prev.map(c =>
        c.userId === userId ? { ...c, status: newStatus } : c
      ));

      toast({ title: "Updated", description: `Candidate status changed to ${newStatus}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const selectedJob = jobs.find(j => j._id === selectedJobId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Candidates</h1>
          <p className="text-muted-foreground">Review and manage applicants for your job postings.</p>
        </div>
      </div>

      {/* Job Selector */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Select Job Posting</h3>
            <p className="text-sm text-muted-foreground">Choose a job to view its applicants</p>
          </div>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-[300px] bg-background">
              <SelectValue placeholder="Select Job" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map(job => (
                <SelectItem key={job._id} value={job._id}>
                  <span className="font-medium">{job.title}</span>
                  <span className="text-muted-foreground ml-2">({job.candidates?.length || 0} applicants)</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedJob && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {selectedJob.location || 'Remote'}
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {selectedJob.type}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Posted {new Date(selectedJob.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Candidates Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">No candidates yet</h3>
          <p className="text-muted-foreground">Candidates will appear here once they apply to this job.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => {
            const styles = getStatusStyles(candidate.status);
            
            return (
              <div 
                key={candidate.userId} 
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Status Header */}
                <div className={`px-4 py-2 ${styles.lightBg} ${styles.text} flex items-center justify-between`}>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {candidate.status === 'INTERVIEW' && <Calendar className="w-4 h-4" />}
                    {candidate.status === 'SHORTLISTED' && <CheckCircle2 className="w-4 h-4" />}
                    {candidate.status === 'REJECTED' && <XCircle className="w-4 h-4" />}
                    {candidate.status === 'APPLIED' && <Timer className="w-4 h-4" />}
                    {candidate.status}
                  </div>
                  <span className="text-xs opacity-70">
                    {new Date(candidate.appliedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Candidate Info */}
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-primary text-white flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden">
                      {candidate.avatar ? (
                        <img src={candidate.avatar} className="w-full h-full object-cover" alt="" />
                      ) : (
                        candidate.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground truncate">{candidate.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{candidate.email}</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {candidate.experience || 0} yrs exp
                    </Badge>
                    {candidate.skills?.slice(0, 2).map((skill: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-border">
                    <Select
                      defaultValue={candidate.status}
                      onValueChange={(val) => handleStatusChange(candidate.userId, val)}
                    >
                      <SelectTrigger className="h-9 text-sm">
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
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs gap-1"
                        onClick={() => navigate(`/dashboard/employer/candidate/${candidate.userId}`)}
                      >
                        <User className="w-3 h-3" />
                        View Profile
                      </Button>
                      {candidate.resumeUrl && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs gap-1"
                          onClick={() => window.open(candidate.resumeUrl, '_blank')}
                        >
                          <FileText className="w-3 h-3" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
