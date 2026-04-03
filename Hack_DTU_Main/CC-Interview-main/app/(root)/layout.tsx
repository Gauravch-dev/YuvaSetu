import { ReactNode } from "react";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getInterviewsForStudent,
  getBatchFeedbackByInterviewIds,
} from "@/lib/actions/general.action";
import AuthGuard from "@/components/AuthGuard";

interface LayoutProps {
  children: ReactNode;
}

const Layout = async ({ children }: LayoutProps) => {
  // getCurrentUser now resolves role + collegeId in one call
  const user = await getCurrentUser();

  if (!user) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  // Prefetch interview data in parallel — pass user data to avoid redundant Firestore read
  const [userInterviews, allInterviews] = await Promise.all([
    getInterviewsByUserId(user.id),
    getInterviewsForStudent(user.id, user),
  ]);

  // Combine interviews (remove duplicates)
  const completedInterviewIds = new Set(userInterviews?.map((interview: any) => interview.id) || []);
  const availableInterviews = allInterviews?.filter((interview: any) => !completedInterviewIds.has(interview.id)) || [];
  const combinedInterviews = [...(userInterviews || []), ...availableInterviews];

  // Batch fetch feedback
  let feedbackMap: Record<string, any> = {};
  if (combinedInterviews.length > 0) {
    const interviewIds = combinedInterviews.map((interview: any) => interview.id);
    feedbackMap = await getBatchFeedbackByInterviewIds(user.id, interviewIds);
  }

  return (
    <AuthGuard
      user={user}
      userRole={user.role}
      userCollegeId={user.collegeId}
      prefetchedInterviews={combinedInterviews}
      prefetchedFeedback={feedbackMap}
    >
      {children}
    </AuthGuard>
  );
};

export default Layout;
