import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Code2, Database, Cloud, Container } from 'lucide-react';

const techStack = [
  { icon: Code2, name: 'Python + React', description: 'Modern full-stack' },
  { icon: Database, name: 'MongoDB', description: 'Scalable NoSQL' },
  { icon: Container, name: 'Docker', description: 'Containerized' },
  { icon: Cloud, name: 'AWS Graviton', description: 'ARM optimized' },
];

export const TeamSection = () => {
  return (
    <section id="about" className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Content */}
          <RevealOnScroll>
            <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              Team Havoc
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Building for <span className="text-primary-accent">Scale</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Team Havoc isn't just building a prototype—we're delivering a production-ready, 
              scalable platform. Our system is optimized to run efficiently while delivering 
              human-level matching intelligence.
            </p>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              By focusing on efficient, lightweight ML instead of heavy large language models, 
              YuvaSetu delivers superior results with <span className="text-primary font-semibold">lower cost</span>, 
              <span className="text-primary font-semibold"> lower latency</span>, and 
              <span className="text-primary font-semibold"> high scalability</span>.
            </p>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
              <span className="text-2xl">🚀</span>
              <span className="font-display font-bold">Ready to scale to millions</span>
            </div>
          </RevealOnScroll>
          
          {/* Tech stack cards */}
          <RevealOnScroll delay={200}>
            <div className="grid grid-cols-2 gap-4">
              {techStack.map((tech, index) => (
                <div
                  key={tech.name}
                  className="glass rounded-2xl p-6 text-center hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-[hsl(252_94%_67%_/_0.2)] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <tech.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-1">{tech.name}</h3>
                  <p className="text-sm text-muted-foreground">{tech.description}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
};
