import { useState } from 'react';
import { Search, MapPin, Briefcase, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const jobTypes = ['Remote', 'Full-time', 'Internship', 'Part-time'];
const trendingRoles = ['Data Analyst', 'Product Manager', 'Software Engineer', 'Marketing', 'UI/UX Designer'];

export const SearchBar = () => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <section className="relative py-16 -mt-20 z-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Main Search Card */}
          <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-3d">
            {/* Search Inputs */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Role Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Job title or keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              {/* Location */}
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="City or remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              {/* Search Button */}
              <Button 
                size="lg" 
                variant="seeker" 
                className="w-full shadow-3d-hover hover:animate-scale-brighten"
              >
                <Search className="w-5 h-5" />
                Search Jobs
              </Button>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Job Type:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedFilters.includes(type)
                        ? 'bg-primary text-primary-foreground shadow-button'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Roles */}
            <div className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Briefcase className="w-4 h-4" />
                <span className="font-medium">Trending:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setSearchQuery(role)}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all duration-300 hover:scale-105"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
