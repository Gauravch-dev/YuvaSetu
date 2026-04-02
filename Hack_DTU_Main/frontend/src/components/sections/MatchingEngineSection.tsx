import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Cpu, Zap, TrendingUp, Shield } from 'lucide-react';

export const MatchingEngineSection = () => {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden bg-gradient-hero">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px]">
          {/* Orbiting elements */}
          <div className="absolute inset-0 border border-primary/10 rounded-full animate-rotate-slow" />
          <div className="absolute inset-[100px] border border-primary/20 rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
          <div className="absolute inset-[200px] border border-primary/30 rounded-full animate-rotate-slow" style={{ animationDuration: '20s' }} />
          
          {/* Center glow */}
          <div className="absolute inset-[300px] bg-gradient-glow animate-pulse-glow" />
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <RevealOnScroll className="text-center mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Smart Matching Engine
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Semantic AI That <span className="text-primary">Understands You</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our advanced AI understands meaning, not just keywords.
            Whether it's Data Science, Marketing, Finance, or HR—we match you with roles that truly fit your skills.
          </p>
        </RevealOnScroll>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Visual representation */}
          <RevealOnScroll className="relative">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Central brain */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-[hsl(252_94%_67%)] flex items-center justify-center shadow-glow animate-pulse-glow">
                    <Cpu className="w-16 h-16 text-primary-foreground" />
                  </div>
                  
                  {/* Connecting nodes */}
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: '0s' }}>
                    <div className="glass rounded-xl px-4 py-2 text-sm font-medium">Marketing</div>
                  </div>
                  <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: '1s' }}>
                    <div className="glass rounded-xl px-4 py-2 text-sm font-medium">Finance</div>
                  </div>
                  <div className="absolute top-1/2 -left-32 -translate-y-1/2 animate-float" style={{ animationDelay: '2s' }}>
                    <div className="glass rounded-xl px-4 py-2 text-sm font-medium">Strategy</div>
                  </div>
                  <div className="absolute top-1/2 -right-32 -translate-y-1/2 animate-float" style={{ animationDelay: '3s' }}>
                    <div className="glass rounded-xl px-4 py-2 text-sm font-medium">Leadership</div>
                  </div>
                </div>
              </div>
              
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="200" y1="200" x2="200" y2="80" stroke="url(#lineGradient)" strokeWidth="2" />
                <line x1="200" y1="200" x2="200" y2="320" stroke="url(#lineGradient)" strokeWidth="2" />
                <line x1="200" y1="200" x2="80" y2="200" stroke="url(#lineGradient)" strokeWidth="2" />
                <line x1="200" y1="200" x2="320" y2="200" stroke="url(#lineGradient)" strokeWidth="2" />
              </svg>
            </div>
          </RevealOnScroll>
          
          {/* Features list */}
          <RevealOnScroll delay={200}>
            <div className="space-y-8">
              <div className="flex gap-6 group">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold mb-2">Top 5 Curated Matches</h3>
                  <p className="text-muted-foreground">No endless scrolling! Get only your top 5 most relevant opportunities, saving hours of job hunting.</p>
                </div>
              </div>
              
              <div className="flex gap-6 group">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold mb-2">Complete Transparency</h3>
                  <p className="text-muted-foreground">See exactly why you matched—70% skills, 30% location. No mystery, no guesswork, just clear explanations.</p>
                </div>
              </div>
              
              <div className="flex gap-6 group">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold mb-2">Instant Resume Builder</h3>
                  <p className="text-muted-foreground">Auto-generate ATS-friendly resumes from your profile in seconds. No formatting stress, just professional results.</p>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
};
