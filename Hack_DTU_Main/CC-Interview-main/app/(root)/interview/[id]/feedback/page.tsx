import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getFeedbackByIdForTPO,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import FeedbackClient from "./FeedbackClient";

// Force dynamic rendering to ensure auth check is always fresh
export const dynamic = "force-dynamic";

const Feedback = async ({ params, searchParams }: RouteParams) => {
  const { id } = await params;
  const { feedbackId } = await searchParams;

  const [user, interview] = await Promise.all([
    getCurrentUser(),
    getInterviewById(id),
  ]);

  if (!interview) redirect("/");

  const isTPO = user?.role === "tpo";

  // If feedbackId is provided and user is TPO, use college-scoped access
  let feedback;
  if (feedbackId && isTPO && user?.collegeId) {
    // getFeedbackByIdForTPO verifies student belongs to TPO's college
    feedback = await getFeedbackByIdForTPO(feedbackId, user.collegeId);
  } else if (user?.id) {
    feedback = await getFeedbackByInterviewId({
      interviewId: id,
      userId: user.id,
    });
  }

  return (
    <FeedbackClient
      feedback={feedback}
      interview={interview}
      isTPO={isTPO}
      interviewId={id}
    />
  );
};

export default Feedback;
