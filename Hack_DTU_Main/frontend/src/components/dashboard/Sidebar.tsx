import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, BookOpen, Send, User, Settings, LogOut, Users, Building2, TrendingUp, FileText, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const DashboardSidebar = () => {
  const location = useLocation();
  const isEmployer = location.pathname.includes('/employer');
  const { t } = useTranslation();

  const SEEKER_NAV = [
    { icon: LayoutDashboard, label: t('sidebar.overview'), href: '/dashboard' },
    { icon: Send, label: t('sidebar.applications'), href: '/dashboard/applications' },
    { icon: TrendingUp, label: t('sidebar.skillGap'), href: '/dashboard/skill-gap' },
    { icon: PenTool, label: t('sidebar.mockTests'), href: '/dashboard/upskill' },
    { icon: User, label: t('sidebar.myProfile'), href: '/dashboard/profile' },
    { icon: Settings, label: t('sidebar.settings'), href: '/dashboard/settings' },
  ];

  const EMPLOYER_NAV = [
    { icon: LayoutDashboard, label: t('sidebar.overview'), href: '/dashboard/employer' },
    { icon: Briefcase, label: t('sidebar.postAJob'), href: '/dashboard/employer/post-job' },
    { icon: FileText, label: t('sidebar.myPostings'), href: '/dashboard/employer/postings' },
    { icon: Building2, label: t('sidebar.companyProfile'), href: '/dashboard/employer/profile' },
    { icon: Settings, label: t('sidebar.settings'), href: '/dashboard/employer/settings' },
  ];

  const navItems = isEmployer ? EMPLOYER_NAV : SEEKER_NAV;

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col z-40 hidden lg:flex">
      {/* Logo */}
      <div className="p-8">
        <Link to={isEmployer ? "/dashboard/employer" : "/dashboard"} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-background border-2 border-primary flex items-center justify-center shadow-glow overflow-hidden">
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Yuva<span className="text-primary">Setu</span>
          </span>
        </Link>
      </div>

      {/* Nav Items */}
      <div className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium",
                isActive
                  ? "bg-primary text-primary-foreground shadow-button"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User & Logout */}
      <div className="p-4 border-t border-border">
        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('sidebar.signOut')}</span>
        </Link>
      </div>
    </div>
  );
};
