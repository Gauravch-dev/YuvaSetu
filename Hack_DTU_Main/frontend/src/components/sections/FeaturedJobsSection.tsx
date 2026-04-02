import { RevealOnScroll, StaggerContainer } from '@/components/RevealOnScroll';
import { 
  TrendingUp, 
  Briefcase,
  Users,
  Target,
  Award,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useParallax } from '@/hooks/useParallax';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';
import { useRef, useState } from 'react';

// Job categories with refined data
const jobCategories = [
  {
    icon: '💻',
    title: 'Full Stack Development',
    shortTitle: 'Full Stack',
    placementCount: 2843,
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    bgGlow: 'bg-violet-500/20',
    trend: '+18%',
  },
  {
    icon: '📊',
    title: 'Data Science & Analytics',
    shortTitle: 'Data Science',
    placementCount: 1956,
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    bgGlow: 'bg-cyan-500/20',
    trend: '+24%',
  },
  {
    icon: '🎨',
    title: 'UI/UX Design',
    shortTitle: 'Design',
    placementCount: 1247,
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    bgGlow: 'bg-rose-500/20',
    trend: '+15%',
  },
  {
    icon: '📱',
    title: 'Digital Marketing',
    shortTitle: 'Marketing',
    placementCount: 1589,
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    bgGlow: 'bg-emerald-500/20',
    trend: '+21%',
  },
  {
    icon: '📈',
    title: 'Product Management',
    shortTitle: 'Product',
    placementCount: 876,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    bgGlow: 'bg-amber-500/20',
    trend: '+12%',
  },
  {
    icon: '💼',
    title: 'Business Development',
    shortTitle: 'Business',
    placementCount: 1134,
    gradient: 'from-slate-500 via-gray-500 to-zinc-500',
    bgGlow: 'bg-slate-500/20',
    trend: '+19%',
  },
];

// Animated counter
const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const { count, ref } = useCounterAnimation(value, 2000);
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// 3D Tilt Card for interactive hover
const TiltCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => setTransform('');

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transform }}
    >
      {children}
    </div>
  );
};

export const FeaturedJobsSection = () => {
  const parallaxSlow = useParallax(0.15);
  const totalPlacements = jobCategories.reduce((sum, cat) => sum + cat.placementCount, 0);

  return (
    <section className="relative py-24 md:py-36 overflow-hidden bg-gradient-to-b from-background via-secondary/5 to-background">
      {/* Sophisticated background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-blob-morph" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] animate-blob-morph" style={{ animationDelay: '5s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header - Professional and clean */}
        <RevealOnScroll className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Placement Statistics</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            <span className="text-foreground">Proven Track Record of</span>
            <br />
            <span className="text-primary">Career Success</span>
          </h2>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Join thousands of professionals who've accelerated their careers through our AI-powered matching platform.
          </p>
        </RevealOnScroll>

        {/* Stats Overview - Clean Bento Grid */}
        <div className="max-w-7xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Main Stats Card */}
            <TiltCard className="md:col-span-2">
              <RevealOnScroll delay={50}>
                <div className="group relative h-full min-h-[280px] rounded-3xl bg-card border border-border p-8 md:p-10 overflow-hidden hover:border-primary/30 transition-all duration-500">
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                  
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Target className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Placements</p>
                          <p className="text-xs text-primary font-medium">Verified & Growing</p>
                        </div>
                      </div>
                      
                      <div className="text-6xl md:text-7xl lg:text-8xl font-display font-bold text-foreground leading-none mb-4">
                        <AnimatedCounter value={totalPlacements} suffix="+" />
                      </div>
                      <p className="text-lg text-muted-foreground">
                        Successful career transitions
                      </p>
                    </div>

                    <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-semibold">+22% YoY Growth</span>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </TiltCard>

            {/* Side Stats */}
            <div className="flex flex-col gap-6 md:gap-8">
              <TiltCard>
                <RevealOnScroll delay={100}>
                  <div className="group relative rounded-3xl bg-card border border-border p-6 hover:border-accent/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                          <div className="text-4xl font-display font-bold text-foreground">
                            <AnimatedCounter value={92} suffix="%" />
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Zap className="w-5 h-5 text-accent" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Of matched candidates placed within 30 days</p>
                    </div>
                  </div>
                </RevealOnScroll>
              </TiltCard>

              <TiltCard>
                <RevealOnScroll delay={150}>
                  <div className="group relative rounded-3xl bg-card border border-border p-6 hover:border-primary/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Active Industries</p>
                          <div className="text-4xl font-display font-bold text-foreground">
                            <AnimatedCounter value={15} suffix="+" />
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Spanning tech, finance, healthcare & more</p>
                    </div>
                  </div>
                </RevealOnScroll>
              </TiltCard>
            </div>
          </div>
        </div>

        {/* Category Cards - Clean, uniform design */}
        <RevealOnScroll className="mb-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display text-2xl font-bold text-foreground">By Domain</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Placements by category</span>
            </div>
          </div>
        </RevealOnScroll>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {jobCategories.map((category, index) => (
            <RevealOnScroll key={category.title} delay={200 + index * 50}>
              <TiltCard>
                <div className="group relative rounded-2xl bg-card border border-border p-5 hover:border-primary/30 transition-all duration-500 overflow-hidden h-full">
                  {/* Gradient glow on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                      {category.shortTitle}
                    </h4>
                    
                    {/* Count */}
                    <div className="text-2xl font-display font-bold text-primary mb-2">
                      <AnimatedCounter value={category.placementCount} />
                    </div>
                    
                    {/* Trend */}
                    <div className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="w-3 h-3" />
                      {category.trend}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </StaggerContainer>

        {/* CTA */}
        <RevealOnScroll delay={500} className="text-center mt-16">
          <div className="inline-flex flex-col items-center">
            <p className="text-muted-foreground text-sm mb-4">
              Ready to write your success story?
            </p>
            <a 
              href="/login/seeker"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 animated-border relative overflow-hidden"
            >
              <span>Start Your Journey</span>
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};
