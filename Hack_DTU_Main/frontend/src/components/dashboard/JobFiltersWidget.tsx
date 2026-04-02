
import { Search, MapPin, Banknote, Briefcase, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';

export interface JobFiltersState {
    query: string;
    location: string;
    type: string;
    minSalary: number;
}

interface JobFiltersWidgetProps {
    filters: JobFiltersState;
    setFilters: (filters: JobFiltersState) => void;
}

export const JobFiltersWidget = ({ filters, setFilters }: JobFiltersWidgetProps) => {
    const { t } = useTranslation();

    const handleChange = (key: keyof JobFiltersState, value: any) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({ query: '', location: '', type: 'all', minSalary: 0 });
    };

    const hasActiveFilters = filters.query || filters.location || filters.type !== 'all' || filters.minSalary > 0;

    return (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Filter className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{t('jobFilters.filterJobs')}</h3>
                    </div>
                </div>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4 mr-1" /> {t('findJobs.clear')}
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Search className="w-4 h-4" /> {t('jobFilters.roleOrKeyword')}
                    </label>
                    <Input
                        placeholder={t('jobFilters.rolePlaceholder')}
                        className="bg-background"
                        value={filters.query}
                        onChange={(e) => handleChange('query', e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" /> {t('jobFilters.locationLabel')}
                    </label>
                    <Input
                        placeholder={t('jobFilters.locationPlaceholder')}
                        className="bg-background"
                        value={filters.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="w-4 h-4" /> {t('jobFilters.jobType')}
                    </label>
                    <Select value={filters.type} onValueChange={(val) => handleChange('type', val)}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('jobFilters.allTypes')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('jobFilters.allTypes')}</SelectItem>
                            <SelectItem value="Full-time">{t('jobFilters.fullTime')}</SelectItem>
                            <SelectItem value="Contract">{t('jobFilters.contract')}</SelectItem>
                            <SelectItem value="Freelance">{t('jobFilters.freelance')}</SelectItem>
                            <SelectItem value="Internship">{t('jobFilters.internship')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Salary Filter */}
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-sm">
                        <label className="font-medium flex items-center gap-2 text-muted-foreground">
                            <Banknote className="w-4 h-4" /> {t('jobFilters.minSalary')}
                        </label>
                        <span className="text-xs font-semibold text-primary">₹{filters.minSalary}L+</span>
                    </div>
                    <Slider
                        value={[filters.minSalary]}
                        min={0}
                        max={50}
                        step={1}
                        className="py-2"
                        onValueChange={(vals) => handleChange('minSalary', vals[0])}
                    />
                </div>
            </div>

            <Button className="w-full gap-2 font-bold shadow-button" size="lg">
                {t('jobFilters.viewMatches')}
            </Button>
        </div>
    );
};
