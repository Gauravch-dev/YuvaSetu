import { RevealOnScroll, StaggerContainer } from '@/components/RevealOnScroll';
import { GridBackground } from '@/components/ParticleBackground';
import { Brain, FileText, MessageSquare, Target } from 'lucide-react';

const problems = [
  {
    icon: Target,
    title: 'Choice Overload',
    description: 'Instead of hundreds of irrelevant listings, see only the top 3-5 most relevant opportunities curated for you.',
    color: 'from-primary to-[hsl(199_89%_48%)]',
  },
  {
    icon: Brain,
    title: 'Lack of Transparency',
    description: 'Explainable AI (XAI) scores show exactly why you matched—70% skills, 30% location. No black box.',
    color: 'from-[hsl(199_89%_48%)] to-[hsl(252_94%_67%)]',
  },
  {
    icon: FileText,
    title: 'No Resume? No Problem',
    description: 'YuvaSetu auto-generates an ATS-friendly resume from your profile. Zero stress, maximum impact.',
    color: 'from-[hsl(252_94%_67%)] to-accent',
  },
  {
    icon: MessageSquare,
    title: 'Connectivity Challenges',
    description: 'Never miss opportunities. Get alerts via SMS and WhatsApp, even with limited internet access.',
    color: 'from-accent to-primary',
  },
];

export const ProblemsSection = () => {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <GridBackground />
      
      <div className="container mx-auto px-4 relative z-10">
        <RevealOnScroll className="text-center mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            The Problems We Solve
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Ending <span className="text-primary">Opportunity Fatigue</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Job seekers across all fields are overwhelmed by endless, irrelevant listings. 
            YuvaSetu cuts through the noise with intelligent, transparent matching for every career path.
          </p>
        </RevealOnScroll>
        
        <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <div
              key={problem.title}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl"
                style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
              />
              <div className="relative glass rounded-2xl p-8 h-full hover:border-primary/50 transition-all duration-500 group-hover:-translate-y-2">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${problem.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <problem.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4 text-foreground">
                  {problem.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};
