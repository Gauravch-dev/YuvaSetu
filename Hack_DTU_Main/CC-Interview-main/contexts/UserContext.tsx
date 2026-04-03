"use client";

import { createContext, useContext, ReactNode } from "react";

interface UserContextType {
  serverUser: any | null;
  userRole: UserRole;
  userCollegeId?: string;
  prefetchedInterviews: any[] | null;
  prefetchedFeedback: Record<string, any> | null;
}

const UserContext = createContext<UserContextType>({
  serverUser: null,
  userRole: "student",
  userCollegeId: undefined,
  prefetchedInterviews: null,
  prefetchedFeedback: null
});

export function UserProvider({
  children,
  serverUser,
  userRole = "student",
  userCollegeId,
  prefetchedInterviews = null,
  prefetchedFeedback = null
}: {
  children: ReactNode;
  serverUser: any | null;
  userRole?: UserRole;
  userCollegeId?: string;
  prefetchedInterviews?: any[] | null;
  prefetchedFeedback?: Record<string, any> | null;
}) {
  return (
    <UserContext.Provider value={{ serverUser, userRole, userCollegeId, prefetchedInterviews, prefetchedFeedback }}>
      {children}
    </UserContext.Provider>
  );
}

export function useServerUser() {
  return useContext(UserContext);
}
