import { TrendingUp, BookOpen, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const SkillGapWidget = () => {
  // Mock data - in real app would come from analysis logic
  const currentRole = "Frontend Developer";
  const targetRole = "Senior Full Stack Dev";
  const matchPercentage = 65;
  
  const recommendedSkills = [
    { name: "Next.js 14", impact: "+15% match", type: "Framework" },
    { name: "GraphQL", impact: "+8% match", type: "API" },
    { name: "System Design", impact: "+10% match", type: "Concept" },
  ];

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Skill Gap Analysis</h3>
            <p className="text-sm text-muted-foreground">Path to <span className="font-medium text-foreground">{targetRole}</span></p>
          </div>
        </div>
        <Link to="/dashboard/skill-gap">
          <Button variant="ghost" size="sm" className="text-muted-foreground">View Full Report</Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Current Match</span>
          <span className="font-bold text-primary">{matchPercentage}%</span>
        </div>
        <Progress value={matchPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          You need to master <span className="text-foreground font-medium">3 more skills</span> to reach top 10% of applicants.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Skills to Master</h4>
        {recommendedSkills.map((skill) => (
          <div key={skill.name} className="group flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-border cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">{skill.name}</p>
                <p className="text-xs text-muted-foreground">{skill.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-md">
                {skill.impact}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-6 gap-2 border-dashed">
        <Lock className="w-4 h-4" />
        Unlock 50+ Premium Jobs
      </Button>
    </div>
  );
};
