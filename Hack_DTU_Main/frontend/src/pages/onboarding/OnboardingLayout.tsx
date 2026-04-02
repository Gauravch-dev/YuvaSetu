import { Link, Outlet } from 'react-router-dom';

export const OnboardingLayout = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
            <span className="text-primary-foreground font-display font-bold text-xl">Y</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Yuva<span className="text-primary">Setu</span>
          </span>
        </Link>
        
        <Link to="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Need help?
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 container mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="w-full max-w-4xl animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
