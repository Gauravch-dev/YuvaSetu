import { RevealOnScroll, StaggerContainer } from '@/components/RevealOnScroll';
import { Zap, Eye, Brain, Shield, TrendingUp, Target, Sparkles, ArrowRight } from 'lucide-react';
import { useParallax } from '@/hooks/useParallax';
import { Differentiation3DElement } from '@/components/Differentiation3DElement';
import { Button } from '@/components/ui/button';

const differences = [
  {
    icon: Target,
    title: 'Top 5 Only',
    description: 'No endless scrolling. We show you only your best 5 matches, saving hours of job hunting.',
    color: 'from-primary to-blue-600',
  },
  {
    icon: Eye,
    title: 'Complete Transparency',
    description: 'See exactly why you matched - 70% skills, 30% location. No black box algorithms.',
    color: 'from-accent to-teal-600',
  },
  {
    icon: Brain,
    title: 'Explainable AI',
    description: 'Our AI explains every recommendation. Understand your matches, make informed decisions.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: Shield,
    title: 'Zero Resume Stress',
    description: 'Auto-generate ATS-friendly resumes from your profile. Professional results in seconds.',
    color: 'from-orange-500 to-red-600',
  },
];

export const DifferentiationSection = () => {
  const parallaxSlow = useParallax(0.15);
  const parallaxFast = useParallax(0.3);

  return (
    <section className="relative py-24 overflow-hidden perspective-2000">
      {/* Animated 3D Background */}
      <div className="absolute inset-0">
        {/* Gradient base */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background"
          style={{ transform: `translateY(${parallaxSlow}px)` }}
        />
        
        {/* Floating shapes */}
        <div 
          className="absolute top-20 right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-float-3d"
          style={{ transform: `translateY(${parallaxFast}px) translateZ(-50px)` }}
        />
        <div 
          className="absolute bottom-20 left-10 w-32 h-32 rounded-full bg-accent/10 blur-2xl animate-bounce-3d"
          style={{ transform: `translateY(${parallaxSlow}px) translateZ(-30px)`, animationDelay: '1s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-primary/5 to-transparent blur-3xl animate-pulse-slow"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <RevealOnScroll className="text-center mb-16">
          <div className="inline-block relative preserve-3d mb-6" style={{ transform: 'translateZ(20px)' }}>
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
            <span className="relative inline-block px-6 py-2.5 rounded-full bg-accent/10 text-accent text-sm font-bold backdrop-blur-xl border border-accent/20 shadow-lg">
              Why Choose Us
            </span>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 preserve-3d" style={{ transform: 'translateZ(10px)' }}>
            How We're <span className="text-primary relative">
              Different
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 blur-lg -z-10" />
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We're not just another job portal. Experience the YuvaSetu difference.
          </p>
        </RevealOnScroll>

        {/* Two-Column Layout: 3D Element + Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto mb-16">
          {/* Left: Text Content */}
          <div className="order-2 lg:order-1">
            <RevealOnScroll>
              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-3xl font-bold mb-4">
                    Quality Over <span className="text-primary">Quantity</span>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    While others bombard you with hundreds of irrelevant listings, we use AI to curate only your top 5 most relevant opportunities. Save time, reduce stress, find better matches.
                  </p>
                </div>

                {/* Key Points */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">40% Faster Results</h4>
                      <p className="text-sm text-muted-foreground">Get matched in seconds, not hours of scrolling</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Eye className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">100% Transparency</h4>
                      <p className="text-sm text-muted-foreground">See exact match breakdown with explanations</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">95% Match Accuracy</h4>
                      <p className="text-sm text-muted-foreground">Semantic AI understands your true skills</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-4">
                  <Button size="lg" variant="seeker" className="shadow-3d-hover hover:animate-scale-brighten group">
                    <Sparkles className="w-5 h-5" />
                    Experience the Difference
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right: 3D Floating Card Element */}
          <div className="order-1 lg:order-2">
            <RevealOnScroll delay={200}>
              <Differentiation3DElement />
            </RevealOnScroll>
          </div>
        </div>

        {/* Key Differentiators Grid */}
        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mt-20">
          {differences.map((diff, index) => {
            const Icon = diff.icon;
            return (
              <div
                key={diff.title}
                className="group relative preserve-3d"
              >
                {/* Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${diff.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-2xl blur-xl -z-10`} />
                
                <div className="relative glass rounded-2xl p-6 h-full border border-border hover:border-primary/50 transition-all duration-500 group-hover:-translate-y-2 shadow-3d-hover">
                  {/* Icon with 3D effect */}
                  <div className="relative mb-4 preserve-3d" style={{ transform: 'translateZ(20px)' }}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${diff.color} opacity-30 blur-md rounded-xl`} />
                    <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${diff.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                      <Icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                    {diff.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {diff.description}
                  </p>
                </div>
              </div>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
};
