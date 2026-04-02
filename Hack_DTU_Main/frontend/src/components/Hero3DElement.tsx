import { useEffect, useRef, useState } from 'react';
import { Briefcase, TrendingUp, Target, Sparkles, Zap, Users } from 'lucide-react';

export const Hero3DElement = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const animationRef = useRef<number>();
  const angleRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Smooth auto-rotation with CSS-like easing
    const animate = () => {
      if (!isHovering) {
        angleRef.current += 0.008; // Much slower rotation
        const x = Math.sin(angleRef.current) * 5; // Reduced from 10 to 5
        const y = Math.cos(angleRef.current) * 5;
        setRotation({ x, y });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovering]);

  // Mouse interaction handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateX = (y / rect.height) * -15; // Reduced intensity
    const rotateY = (x / rect.width) * 15;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovering(true);
  
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Smooth return to auto-rotation position
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto h-[400px] md:h-[500px]"
      style={{ perspective: '2000px' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Card Stack */}
      <div
        className="relative w-full h-full preserve-3d transition-transform duration-500 ease-out"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Back Card - Layer 3 */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 backdrop-blur-xl border border-primary/30 shadow-3d"
          style={{
            transform: 'translateZ(-80px) scale(0.85)',
            transformStyle: 'preserve-3d'
          }}
        />

        {/* Middle Card - Layer 2 */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/15 to-primary/15 backdrop-blur-xl border border-accent/30 shadow-3d"
          style={{
            transform: 'translateZ(-40px) scale(0.92)',
            transformStyle: 'preserve-3d'
          }}
        />

        {/* Front Card - Main Content */}
        <div
          className="absolute inset-0 rounded-3xl glass-strong shadow-3d overflow-hidden"
          style={{
            transform: 'translateZ(0px)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 animate-gradient" />
          
          {/* Floating orbs in background */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

          {/* Content */}
          <div className="relative z-10 h-full p-8 md:p-12 flex flex-col justify-between">
            {/* Top Section */}
            <div className="space-y-6">
              {/* Floating icons */}
              <div className="flex gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center animate-float-3d preserve-3d"
                  style={{ animationDelay: '0s' }}
                >
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <div 
                  className="w-16 h-16 rounded-2xl bg-accent/20 backdrop-blur-xl border border-accent/30 flex items-center justify-center animate-float-3d preserve-3d"
                  style={{ animationDelay: '0.5s' }}
                >
                  <Target className="w-8 h-8 text-accent" />
                </div>
                <div 
                  className="w-16 h-16 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center animate-float-3d preserve-3d"
                  style={{ animationDelay: '1s' }}
                >
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">AI-Powered Matching</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  Smart Career
                  <br />
                  <span className="text-primary">Recommendations</span>
                </h3>
              </div>
            </div>

            {/* Middle Section - Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div 
                className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm preserve-3d"
                style={{ transform: 'translateZ(20px)' }}
              >
                <Zap className="w-6 h-6 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">Fast</p>
                <p className="text-xs text-muted-foreground">Matching</p>
              </div>
              <div 
                className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm preserve-3d"
                style={{ transform: 'translateZ(20px)', transitionDelay: '0.1s' }}
              >
                <Users className="w-6 h-6 text-accent mb-2" />
                <p className="text-2xl font-bold text-foreground">Top 5</p>
                <p className="text-xs text-muted-foreground">Curated</p>
              </div>
              <div 
                className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm preserve-3d"
                style={{ transform: 'translateZ(20px)', transitionDelay: '0.2s' }}
              >
                <Sparkles className="w-6 h-6 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">99%</p>
                <p className="text-xs text-muted-foreground">Clear</p>
              </div>
            </div>

            {/* Bottom Section - Progress indicator */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Match Quality</span>
                <span className="text-sm font-semibold text-primary">95%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-gradient"
                  style={{ width: '95%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating particles around the card */}
        <div 
          className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-primary/40 blur-sm animate-pulse-3d preserve-3d"
          style={{ transform: 'translateZ(60px)' }}
        />
        <div 
          className="absolute -bottom-4 -left-4 w-6 h-6 rounded-full bg-accent/40 blur-sm animate-bounce-3d preserve-3d"
          style={{ transform: 'translateZ(60px)' }}
        />
        <div 
          className="absolute top-1/2 -right-6 w-4 h-4 rounded-full bg-primary/30 animate-levitate preserve-3d"
          style={{ transform: 'translateZ(80px)' }}
        />
      </div>

      {/* Shadow underneath */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-foreground/5 rounded-full blur-xl"
        style={{ transform: 'translateZ(-100px) translateX(-50%)' }}
      />
    </div>
  );
};
