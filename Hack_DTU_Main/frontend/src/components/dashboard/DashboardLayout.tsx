import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardSidebar } from './Sidebar';
import { DashboardHeader } from './Header';

export const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isEmployer = location.pathname.includes('/employer');

  return (
    <div 
      className="min-h-screen bg-background flex"
      style={isEmployer ? {
        // @ts-ignore
        "--primary": "174 72% 40%",
        "--primary-foreground": "0 0% 100%",
        "--ring": "174 72% 40%",
        "--sidebar-primary": "174 72% 40%",
      } as React.CSSProperties : undefined}
    >
      <DashboardSidebar />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <DashboardHeader 
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          title={isEmployer ? "Employer Dashboard" : "User Dashboard"}
        />
        
        <main className="flex-1 p-4 md:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Overlay (Simplified for now) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-background/95 backdrop-blur-sm p-4">
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-xl">Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)}>Close</button>
          </div>
          {/* Reuse nav links logic here in future */}
        </div>
      )}
    </div>
  );
};
