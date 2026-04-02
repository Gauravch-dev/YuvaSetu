import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/contexts/OnboardingContext';

export const Education = () => {
  const { data, updateStepData } = useOnboarding();
  const { education } = data;

  const addEducation = () => {
    updateStepData('education', [
      ...education,
      {
        id: crypto.randomUUID(),
        institution: '',
        degree: '',
        year: '',
        score: ''
      }
    ]);
  };

  const removeEducation = (id: string) => {
    updateStepData('education', education.filter(edu => edu.id !== id));
  };

  const updateEntry = (id: string, field: string, value: string) => {
    updateStepData('education', education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {education.map((edu, index) => (
        <div key={edu.id} className="relative p-6 bg-card/50 rounded-xl border border-border space-y-4">
          <div className="absolute -left-3 -top-3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-primary/20">
            {index + 1}
          </div>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Education Details</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeEducation(edu.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Institution / College</Label>
              <Input 
                value={edu.institution}
                onChange={(e) => updateEntry(edu.id, 'institution', e.target.value)}
                placeholder="Ex. IIT Bombay"
              />
            </div>
            <div className="space-y-2">
              <Label>Degree / Course</Label>
              <Input 
                value={edu.degree}
                onChange={(e) => updateEntry(edu.id, 'degree', e.target.value)}
                placeholder="Ex. B.Tech Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label>Completion Year</Label>
              <Input 
                value={edu.year}
                onChange={(e) => updateEntry(edu.id, 'year', e.target.value)}
                placeholder="Ex. 2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Grade / CGPA</Label>
              <Input 
                value={edu.score}
                onChange={(e) => updateEntry(edu.id, 'score', e.target.value)}
                placeholder="Ex. 9.5 CGPA"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addEducation}
        className="w-full h-12 border-dashed border-2 hover:border-primary hover:text-primary gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Education
      </Button>
    </div>
  );
};
