import { Bell, Menu, Check, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from 'react';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "Application Viewed",
    message: "TechCorp has viewed your application for Senior Frontend Engineer.",
    time: "2 hours ago",
    read: false,
    icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />
  },
  {
    id: 2,
    title: "New Job Match",
    message: "A new job matching your profile: Product Designer at DesignStudio.",
    time: "5 hours ago",
    read: false,
    icon: <Bell className="w-4 h-4 text-yellow-500" />
  },
  {
    id: 3,
    title: "Profile Update",
    message: "Your profile was successfully updated.",
    time: "1 day ago",
    read: true,
    icon: <Check className="w-4 h-4 text-green-500" />
  },
  {
    id: 4,
    title: "Application Status",
    message: "Your application for Backend Engineer at FinTech Solutions has been shortlisted.",
    time: "2 days ago",
    read: true,
    icon: <Clock className="w-4 h-4 text-purple-500" />
  }
];

export const DashboardHeader = ({ onMenuClick, title }: { onMenuClick?: () => void, title?: string }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const [userProfile, setUserProfile] = useState<{ name: string, role: string, profilePicture?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const { fetchProtectedData } = await import('@/lib/auth-api');
          // Use Generic /auth/me for Header (works for both roles)
          const userData = await fetchProtectedData('/auth/me', token);

          if (userData) {
            setUserProfile({
              name: userData.personalInfo?.fullName || userData.companyProfile?.companyName || userData.name || "User",
              role: userData.role === 'EMPLOYER' ? 'Employer' : 'Job Seeker',
              profilePicture: userData.personalInfo?.profilePicture || userData.companyProfile?.logoUrl
            });
          }
        }
      } catch (error) {
        console.error("Failed to load header profile", error);
      }
    };

    fetchProfile();

    // Listen for profile updates
    window.addEventListener('profile-updated', fetchProfile);
    return () => window.removeEventListener('profile-updated', fetchProfile);
  }, []);

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border h-20 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h4 className="font-semibold leading-none">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              <div className="grid gap-1">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${!notification.read ? "bg-muted/20" : ""
                        }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className={`mt-1 bg-background p-2 rounded-full border border-border shadow-sm`}>
                        {notification.icon}
                      </div>
                      <div className="grid gap-1">
                        <div className="font-medium text-sm flex justify-between items-start gap-2">
                          {notification.title}
                          {!notification.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {notification.time}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold">{userProfile?.name || "User"}</p>
            <p className="text-xs text-muted-foreground">{userProfile?.role || "Welcome"}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
            {userProfile?.profilePicture ? (
              <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-primary">{userProfile ? getInitials(userProfile.name) : "U"}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
