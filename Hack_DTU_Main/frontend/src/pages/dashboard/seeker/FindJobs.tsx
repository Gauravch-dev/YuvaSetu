import { useState, useEffect } from 'react';
import { Search, Loader2, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { JobCard, Job } from '@/components/dashboard/JobCard';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchRecommendedJobs } from '@/lib/auth-api';

const FILTERS = [
  { category: 'Job Type', key: 'type', options: ['Full-time', 'Part-time', 'Contract', 'Internship'] },
  { category: 'Work Mode', key: 'workMode', options: ['On-site', 'Remote', 'Hybrid'] },
];

export const FindJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    type: [],
    workMode: [],
  });
  const [sortBy, setSortBy] = useState<'match' | 'newest' | 'salary'>('match');

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const data = await fetchRecommendedJobs(token);
          setJobs(data);
        }
      } catch (error) {
        console.error('Failed to fetch jobs', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadJobs();
  }, []);

  const toggleFilter = (category: string, option: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      if (current.includes(option)) {
        return { ...prev, [category]: current.filter(o => o !== option) };
      } else {
        return { ...prev, [category]: [...current, option] };
      }
    });
  };

  const clearFilters = () => {
    setSelectedFilters({ type: [], workMode: [] });
    setSearchQuery('');
  };

  const filteredJobs = jobs.filter(job => {
    // Search filter
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Type filter
    const matchesType = selectedFilters.type.length === 0 || 
      selectedFilters.type.includes(job.type);
    
    // Work mode filter (check location for Remote/Hybrid/On-site)
    const matchesWorkMode = selectedFilters.workMode.length === 0 ||
      selectedFilters.workMode.some(mode => 
        job.location?.toLowerCase().includes(mode.toLowerCase())
      );
    
    return matchesSearch && matchesType && matchesWorkMode;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'match') return (b.matchScore || 0) - (a.matchScore || 0);
    if (sortBy === 'salary') return 0; // Would need salary parsing
    return 0;
  });

  const activeFilterCount = Object.values(selectedFilters).flat().length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Find Your Next Role</h1>
          <p className="text-muted-foreground">
            {isLoading ? 'Loading jobs...' : `${sortedJobs.length} jobs matching your profile`}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs">{activeFilterCount}</Badge>
                )}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80"
                onClick={clearFilters}
                disabled={activeFilterCount === 0 && !searchQuery}
              >
                Clear
              </Button>
            </div>

            {FILTERS.map((section) => (
              <div key={section.category} className="space-y-3 pb-6 border-b border-border last:border-0 last:pb-0">
                <h4 className="font-medium text-sm">{section.category}</h4>
                <div className="space-y-2">
                  {section.options.map((option) => {
                    const isChecked = selectedFilters[section.key]?.includes(option);
                    return (
                      <label 
                        key={option} 
                        className={`flex items-center gap-3 text-sm cursor-pointer group transition-colors ${
                          isChecked ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Checkbox 
                          checked={isChecked}
                          onCheckedChange={() => toggleFilter(section.key, option)}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search job title, company, or skills" 
                className="pl-10 h-12 text-lg" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-12 px-8 gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>

          {/* Sort Tabs */}
          <div className="flex items-center gap-2 pb-4 overflow-x-auto">
            <Badge 
              variant={sortBy === 'match' ? 'default' : 'outline'} 
              className="px-3 py-1 cursor-pointer hover:bg-muted"
              onClick={() => setSortBy('match')}
            >
              Top Match
            </Badge>
            <Badge 
              variant={sortBy === 'newest' ? 'default' : 'outline'} 
              className="px-3 py-1 cursor-pointer hover:bg-muted"
              onClick={() => setSortBy('newest')}
            >
              Newest
            </Badge>
          </div>

          {/* Job Listings */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Frown className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search query.</p>
              <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
