import { Search, Plus, Eye, Users, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchJobs } from '@/lib/auth-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const MyPostings = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Fetch ALL jobs
          const data = await fetchJobs(token);
          setJobs(data);
        }
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || job.status === filterStatus;
    const matchesType = filterType === 'ALL' || job.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">My Job Postings</h1>
          <p className="text-muted-foreground">Manage all your job listings and track applicants.</p>
        </div>
        <Button variant="employer" className="gap-2 shadow-button" onClick={() => navigate('/dashboard/employer/post-job')}>
          <Plus className="w-4 h-4" />
          Post New Job
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search job postings..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Postings Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No job postings found matching your filters.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group"
              onClick={() => navigate(`/dashboard/employer/postings/${job._id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl group-hover:text-accent transition-colors">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                        job.status === 'CLOSED' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                          'bg-muted text-muted-foreground border border-border'
                      }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>{job.location || 'Remote'}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                    <span>•</span>
                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-accent" />
                      <span className="text-2xl font-bold text-accent">{job.candidates ? job.candidates.length : 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase">Applicants</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/employer/postings/${job._id}`);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Closing date: Open</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate('/dashboard/employer/post-job', { state: { jobId: job._id } }); }}>Edit</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
