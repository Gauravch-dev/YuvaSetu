import { RevealOnScroll } from '@/components/RevealOnScroll';
import { useParallax } from '@/hooks/useParallax';
import { ArrowRight, Check, X, Zap, Target, Eye } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

// Traditional approach pain points
const traditionalFlow = [
  {
    icon: '🔍',
    title: 'Endless Scrolling',
    description: 'Hours browsing irrelevant listings',
    metric: '2+ hrs/day',
  },
  {
    icon: '📝',
    title: 'Manual Filtering',
    description: 'Adjusting filters that still miss',
    metric: '50+ sites',
  },
  {
    icon: '❓',
    title: 'Zero Transparency',
    description: 'No idea why jobs appear',
    metric: '0% clarity',
  },
  {
    icon: '🤞',
    title: 'Spray & Pray',
    description: 'Hoping for callbacks',
    metric: '2% reply',
  },
];

// YuvaSetu's intelligent approach
const yuvaSetuFlow = [
  {
    icon: '🧠',
    title: 'Semantic Understanding',
    description: 'AI understands your true skills',
    metric: 'Deep Analysis',
  },
  {
    icon: '🎯',
    title: 'Curated Top 5',
    description: 'Only your perfect matches',
    metric: 'Top 5 matches',
  },
  {
    icon: '👀',
    title: 'Full Transparency',
    description: 'Detailed match breakdown',
    metric: '100% clarity',
  },
  {
    icon: '✅',
    title: 'Confident Applications',
    description: 'Apply knowing you fit',
    metric: '3x callbacks',
  },
];

const ComparisonCard = ({ 
  children, 
  className = '',
}: { 
  children: React.ReactNode; 
  className?: string;
}) => {
  return (
    <div className={`transition-all duration-300 ease-out ${className}`}>
      {children}
    </div>
  );
};

export const FlowGraph3DSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const { top, height } = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress: 0 when top enters view, 1 when bottom leaves
      // We want animation to happen when section is sticky
      // Adjust start/end points for smoother control
      const scrollDistance = height - windowHeight;
      const scrolled = -top;
      
      let p = scrolled / scrollDistance;
      p = Math.max(0, Math.min(1, p));
      
      setProgress(p);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Init
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation values
  const traditionalOpacity = Math.max(0, 1 - progress * 2.5); // Fades out by 40%
  const traditionalScale = 1 - progress * 0.2; // Shrinks slightly
  const traditionalBlur = progress * 10; // Blurs out
  
  const yuvaOpacity = Math.max(0, (progress - 0.4) * 2.5); // Fades in after 40%
  const yuvaScale = 0.8 + Math.min(0.2, (progress - 0.4) * 0.5); // Grows in
  const yuvaBlur = Math.max(0, 10 - (progress - 0.4) * 20); // Unblurs

  return (
    <section ref={containerRef} className="relative h-[250vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-gradient-to-b from-background via-secondary/5 to-background flex items-center justify-center">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10 w-full max-w-6xl">
          {/* Header - Stays put or fades slightly */}
          <div className="text-center mb-12 transition-opacity duration-300">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <span className="text-sm font-medium text-primary">The Difference</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              Job Hunting, <span className="text-primary">Reimagined</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience a recruitment process designed for clarity, speed, and success.
            </p>
          </div>

          <div className="relative h-[600px] w-full flex items-center justify-center perspective-1000">
            {/* Traditional Approach Layer */}
            <div 
              className="absolute inset-0 flex items-center justify-center p-4"
              style={{ 
                opacity: traditionalOpacity,
                transform: `scale(${traditionalScale}) translateY(${progress * -50}px) rotateX(${progress * 10}deg)`,
                filter: `blur(${traditionalBlur}px)`,
                pointerEvents: traditionalOpacity > 0.1 ? 'auto' : 'none',
                zIndex: 10
              }}
            >
              <div className="w-full max-w-5xl bg-white/50 dark:bg-card/50 backdrop-blur-2xl rounded-3xl border border-red-200/50 dark:border-red-900/20 shadow-2xl p-8 md:p-10 relative overflow-hidden group">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12 relative z-10">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/10 border border-red-200 dark:border-red-900/30 flex items-center justify-center shadow-lg shadow-red-500/5">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl font-bold text-foreground mb-2">Traditional Approach</h3>
                    <p className="text-muted-foreground text-lg">The "Spray & Pray" method causes fatigue.</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 relative z-10">
                  {traditionalFlow.map((step, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <div className="text-3xl grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{step.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{step.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{step.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-xl font-bold text-red-500/80">{step.metric}</span>
                      </div>
                    </div>
                  ))}
                </div>
                 <div className="mt-8 text-center relative z-10">
                  <p className="text-muted-foreground/60 text-sm font-medium tracking-wide uppercase">Results: Frustration & Burnout</p>
                </div>
              </div>
            </div>

            {/* YuvaSetu Approach Layer */}
             <div 
              className="absolute inset-0 flex items-center justify-center p-4"
              style={{ 
                opacity: yuvaOpacity,
                transform: `scale(${yuvaScale}) translateY(0) rotateX(0)`,
                filter: `blur(${yuvaBlur}px)`,
                pointerEvents: yuvaOpacity > 0.1 ? 'auto' : 'none',
                zIndex: 20
              }}
            >
              <div className="w-full max-w-5xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-3xl rounded-3xl border border-primary/20 shadow-2xl shadow-primary/10 p-8 md:p-10 relative overflow-hidden">
                {/* Glowing Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-[80px] pointer-events-none animate-blob-morph" />

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12 relative z-10">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 animate-glow-breathe">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl font-bold text-foreground">YuvaSetu Approach</h3>
                    <p className="text-muted-foreground text-lg">Intelligent matching. Zero noise.</p>
                  </div>
                </div>
                
                 <div className="grid md:grid-cols-2 gap-5 relative z-10">
                  {yuvaSetuFlow.map((step, i) => (
                    <div key={i} className="group flex items-center gap-5 p-5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 transform hover:-translate-y-1">
                      <div className="text-3xl transform group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/10 text-primary font-bold text-sm whitespace-nowrap">
                          {step.metric}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                 <div className="mt-10 text-center relative z-10">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-sm font-medium text-foreground">Result: <span className="text-primary font-bold">Career Accelerated</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
