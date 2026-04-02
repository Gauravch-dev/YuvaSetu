import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const CTASection = () => {
  const { t } = useTranslation();
  
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-[hsl(252_94%_67%_/_0.1)]" />
      
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[hsl(252_94%_67%_/_0.15)] rounded-full blur-[120px] animate-float-slow" style={{ animationDelay: '5s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <RevealOnScroll className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {t('cta.badge')}
            </span>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {t('cta.title')}
            <span className="text-primary">{t('cta.titleHighlight')}</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t('cta.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login/seeker">
              <Button variant="seeker" size="xl" className="group">
                {t('cta.seekerButton')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login/employer">
              <Button variant="employer" size="xl" className="group">
                {t('cta.employerButton')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-8">
            {t('cta.disclaimer')}
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
};
