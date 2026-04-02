import { Plus, Trash2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOnboarding } from '@/contexts/OnboardingContext';

export const Experience = () => {
  const { data, updateStepData } = useOnboarding();
  const { experience } = data;

  const addExperience = () => {
    updateStepData('experience', [
      ...experience,
      {
        id: crypto.randomUUID(),
        role: '',
        company: '',
        duration: '',
        description: ''
      }
    ]);
  };

  const removeExperience = (id: string) => {
    updateStepData('experience', experience.filter(exp => exp.id !== id));
  };

  const updateEntry = (id: string, field: string, value: string) => {
    updateStepData('experience', experience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {experience.map((exp, index) => (
        <div key={exp.id} className="relative p-6 bg-card/50 rounded-xl border border-border space-y-4">
          <div className="absolute -left-3 -top-3 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold border border-accent/20">
            {index + 1}
          </div>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Work Experience</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeExperience(exp.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Role / Title</Label>
              <Input 
                value={exp.role}
                onChange={(e) => updateEntry(exp.id, 'role', e.target.value)}
                placeholder="Ex. Frontend Developer"
              />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input 
                value={exp.company}
                onChange={(e) => updateEntry(exp.id, 'company', e.target.value)}
                placeholder="Ex. Google"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Duration</Label>
              <Input 
                value={exp.duration}
                onChange={(e) => updateEntry(exp.id, 'duration', e.target.value)}
                placeholder="Ex. Jan 2023 - Present"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea 
                value={exp.description}
                onChange={(e) => updateEntry(exp.id, 'description', e.target.value)}
                placeholder="Describe your responsibilities and achievements..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addExperience}
        className="w-full h-12 border-dashed border-2 hover:border-accent hover:text-accent gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Experience
      </Button>
    </div>
  );
};
