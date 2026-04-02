import { useEffect, useRef, useState } from 'react';
import { Target, Eye, Brain, Zap, Shield, Sparkles, TrendingUp, Users } from 'lucide-react';

export const Differentiation3DElement = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-rotation effect
  useEffect(() => {
    let animationFrame: number;
    let angle = 0;

    const animate = () => {
      if (autoRotate) {
        angle += 0.3;
        setRotation({
          x: Math.sin(angle * 0.01) * 8,
          y: Math.cos(angle * 0.01) * 8,
        });
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [autoRotate]);

  // Mouse interaction
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientY - rect.top - rect.height / 2) / 20;
      const y = (e.clientX - rect.left - rect.width / 2) / 20;
      
      setAutoRotate(false);
      setRotation({ x: -x, y });
    };

    const handleMouseLeave = () => {
      setAutoRotate(true);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto h-[400px] md:h-[500px] perspective-2000"
      style={{ perspective: '2000px' }}
    >
      {/* 3D Card Stack */}
      <div
        className="relative w-full h-full preserve-3d transition-transform duration-100"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Back Card - Other Portals */}
        <div
          className="absolute inset-0 glass-strong rounded-3xl p-6 border-2 border-muted-foreground/20 backdrop-blur-xl shadow-3d"
          style={{
            transform: 'translateZ(-80px)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-muted-foreground" />
                <h3 className="font-display text-xl font-bold text-muted-foreground">Other Portals</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">✗</div>
                  <span>Hundreds of listings</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">✗</div>
                  <span>No match explanation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">✗</div>
                  <span>Manual filtering</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Card - Transition */}
        <div
          className="absolute inset-0 glass-strong rounded-3xl p-6 border-2 border-primary/30 backdrop-blur-xl shadow-3d"
          style={{
            transform: 'translateZ(-40px)',
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(135deg, rgba(var(--muted)/0.3), rgba(var(--primary)/0.1))',
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-primary" />
              <p className="font-semibold text-lg">Upgrading...</p>
            </div>
          </div>
        </div>

        {/* Front Card - YuvaSetu */}
        <div
          className="absolute inset-0 glass-strong rounded-3xl p-6 border-2 border-primary/50 backdrop-blur-xl shadow-3d overflow-hidden"
          style={{
            transform: 'translateZ(0px)',
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(135deg, rgba(var(--primary)/0.1), rgba(var(--accent)/0.05))',
          }}
        >
          {/* Gradient glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/30 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/30 to-transparent blur-3xl" />

          <div className="relative flex flex-col h-full justify-between" style={{ transform: 'translateZ(20px)' }}>
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary">YuvaSetu</h3>
              </div>

              {/* Key Features with icons */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Top 5 Only</h4>
                    <p className="text-xs text-muted-foreground">Curated matches</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Eye className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">100% Clear</h4>
                    <p className="text-xs text-muted-foreground">Match breakdown</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Explainable AI</h4>
                    <p className="text-xs text-muted-foreground">Understand why</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom stat */}
            <div className="mt-4 pt-4 border-t border-border" style={{ transform: 'translateZ(10px)' }}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[95%] bg-gradient-to-r from-primary to-accent rounded-full" />
                  </div>
                  <span className="font-bold text-primary">95%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-primary/40 blur-sm animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-accent/40 blur-sm animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 left-20 w-3 h-3 rounded-full bg-primary/40 blur-sm animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-10 right-10 w-4 h-4 rounded-full bg-accent/40 blur-sm animate-float" style={{ animationDelay: '1.5s' }} />

      {/* Shadow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-primary/10 blur-xl rounded-full" />
    </div>
  );
};
