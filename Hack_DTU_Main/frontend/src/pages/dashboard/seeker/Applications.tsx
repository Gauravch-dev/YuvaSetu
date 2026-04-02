

import { ExternalLink, Calendar, CheckCircle2, XCircle, Clock, Timer, ChevronRight, Briefcase, Loader2, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyApplications } from '@/lib/api/jobs';
import { useSocket } from '@/context/SocketContext';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'INTERVIEW': return { bg: 'bg-purple-500', lightBg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/30' };
    case 'SHORTLISTED': return { bg: 'bg-green-500', lightBg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' };
    case 'REJECTED': return { bg: 'bg-red-500', lightBg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' };
    case 'OFFER': return { bg: 'bg-emerald-500', lightBg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30' };
    default: return { bg: 'bg-blue-500', lightBg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' };
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'INTERVIEW': return <Calendar className="w-4 h-4" />;
    case 'SHORTLISTED': return <CheckCircle2 className="w-4 h-4" />;
    case 'REJECTED': return <XCircle className="w-4 h-4" />;
    case 'OFFER': return <CheckCircle2 className="w-4 h-4" />;
    default: return <Timer className="w-4 h-4" />;
  }
};

const getProgressPercentage = (status: string) => {
  switch (status) {
    case 'APPLIED': return 25;
    case 'SHORTLISTED': return 50;
    case 'INTERVIEW': return 75;
    case 'OFFER': return 100;
    case 'REJECTED': return 100;
    default: return 25;
  }
};

export const Applications = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("No token");
      return await fetchMyApplications(token);
    }
  });

  // Real-Time Listener
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      console.log("Real-time Update:", data);
      toast({
        title: "Application Update!",
        description: `Your status for ${data.jobTitle} at ${data.company} is now ${data.status}`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    };

    socket.on('application_status_updated', handleStatusUpdate);

    return () => {
      socket.off('application_status_updated', handleStatusUpdate);
    };
  }, [socket, queryClient, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track the status of your job applications.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {applications?.length || 0} Total Applications
        </div>
      </div>

      {/* Application Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications?.map((app: any) => {
          const styles = getStatusStyles(app.status);
          const progress = getProgressPercentage(app.status);
          
          return (
            <div 
              key={app.jobId} 
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
              onClick={() => navigate(`/dashboard/applications/${app.jobId}`)}
            >
              {/* Status Accent Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${styles.bg}`} />
              
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 p-2 border border-border shadow-sm flex items-center justify-center shrink-0">
                  {app.logo ? (
                    <img src={app.logo} alt={app.company} className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{app.company}</p>
                </div>
              </div>

              {/* Location & Date */}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{app.location || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${app.status === 'REJECTED' ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-accent'} rounded-full transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Applied</span>
                  <span>Review</span>
                  <span>Interview</span>
                  <span>Offer</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${styles.lightBg} ${styles.text} ${styles.border} border`}>
                  {getStatusIcon(app.status)}
                  {app.status}
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground group-hover:text-primary">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
        
        {applications?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-6">Start applying to jobs to track your progress here.</p>
            <Button onClick={() => navigate('/dashboard')}>
              Browse Jobs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
