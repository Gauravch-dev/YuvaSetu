import { RevealOnScroll, StaggerContainer } from '@/components/RevealOnScroll';
import { GridBackground } from '@/components/ParticleBackground';
import { Brain, FileText, MessageSquare, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProblemsSection = () => {
  const { t } = useTranslation();

  const problems = [
    {
      icon: Target,
      title: t('problems.choiceOverload'),
      description: t('problems.choiceOverloadDesc'),
      color: 'from-primary to-[hsl(199_89%_48%)]',
    },
    {
      icon: Brain,
      title: t('problems.lackOfTransparency'),
      description: t('problems.lackOfTransparencyDesc'),
      color: 'from-[hsl(199_89%_48%)] to-[hsl(252_94%_67%)]',
    },
    {
      icon: FileText,
      title: t('problems.noResume'),
      description: t('problems.noResumeDesc'),
      color: 'from-[hsl(252_94%_67%)] to-accent',
    },
    {
      icon: MessageSquare,
      title: t('problems.connectivity'),
      description: t('problems.connectivityDesc'),
      color: 'from-accent to-primary',
    },
  ];
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <GridBackground />
      
      <div className="container mx-auto px-4 relative z-10">
        <RevealOnScroll className="text-center mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            {t('problems.badge')}
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {t('problems.titlePrefix')} <span className="text-primary">{t('problems.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('problems.subtitle')}
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
