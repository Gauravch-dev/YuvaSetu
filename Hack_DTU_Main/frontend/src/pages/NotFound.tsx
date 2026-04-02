import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto space-y-8">
        {/* Animated 404 Text */}
        <div className="relative">
          <h1 className="text-[180px] md:text-[220px] font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-primary/20 to-accent/20 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30 animate-bounce">
              <HelpCircle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Oops! The page you're looking for seems to have wandered off. 
            Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/">
            <Button size="lg" className="gap-2 min-w-[180px] shadow-lg">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="lg" className="gap-2 min-w-[180px]">
              <ArrowLeft className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-border/50 mt-8">
          <p className="text-sm text-muted-foreground mb-4">Or try these popular pages:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/login/seeker" className="text-sm text-primary hover:underline font-medium">
              Job Seeker Login
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/login/employer" className="text-sm text-accent hover:underline font-medium">
              Employer Login
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">
              About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
