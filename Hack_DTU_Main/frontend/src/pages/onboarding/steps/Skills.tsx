import { useState } from 'react';
import { X, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/contexts/OnboardingContext';

const SUGGESTED_SKILLS = [
  "React", "Node.js", "Python", "Java", "SQL", "TypeScript", 
  "AWS", "Docker", "Figma", "Data Analysis", "Machine Learning"
];

export const Skills = () => {
  const { data, updateStepData } = useOnboarding();
  const { skills } = data;
  const [inputValue, setInputValue] = useState('');

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      updateStepData('skills', [...skills, skill]);
      setInputValue('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    updateStepData('skills', skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(inputValue.trim());
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <Label>Add Skills</Label>
        <div className="flex gap-2">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill and press Enter..."
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={() => addSkill(inputValue.trim())}
            disabled={!inputValue.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected Skills */}
      <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-muted/30 rounded-xl border border-border">
        {skills.length === 0 && (
          <p className="text-muted-foreground w-full text-center py-4">
            No skills added yet. Start typing above or pick from suggestions.
          </p>
        )}
        {skills.map((skill) => (
          <div 
            key={skill}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 animate-scale-in"
          >
            <span className="font-medium text-sm">{skill}</span>
            <button
              onClick={() => removeSkill(skill)}
              className="text-primary/50 group-hover:text-primary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 text-accent" />
          <span>Suggested based on market trends</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).map((skill) => (
            <button
              key={skill}
              onClick={() => addSkill(skill)}
              className="px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/50 hover:text-primary transition-all text-sm text-muted-foreground"
            >
              + {skill}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
