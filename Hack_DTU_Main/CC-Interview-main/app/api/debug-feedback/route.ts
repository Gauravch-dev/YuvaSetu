import { NextRequest } from "next/server";
import { db, auth } from "@/firebase/admin";
import { checkTPOAccess } from "@/lib/actions/auth.action";

export async function GET(request: NextRequest) {
  try {
    if (!auth || !db) {
      return Response.json(
        { success: false, error: "Service unavailable" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const decodedClaims = await auth.verifyIdToken(idToken);
    const userId = decodedClaims.uid;

    const collegeId = await checkTPOAccess(userId);
    if (!collegeId) {
      return Response.json(
        { success: false, error: "Access denied - TPO only" },
        { status: 403 }
      );
    }

    // Get all interviews for this college
    const interviewsSnapshot = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .where("targetColleges", "array-contains", collegeId)
      .get();

    const interviewIds = interviewsSnapshot.docs.map((doc: any) => doc.id);
    const interviewDetails = interviewsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      role: doc.data().role,
      targetColleges: doc.data().targetColleges,
    }));

    // Get total count of all feedback documents
    const totalFeedbackSnapshot = await db
      .collection("feedback")
      .get();

    const totalFeedbackCount = totalFeedbackSnapshot.size;

    // Get unique interviewIds from all feedback documents
    const allFeedbackInterviewIds = totalFeedbackSnapshot.docs.map((doc: any) => doc.data().interviewId);
    const uniqueFeedbackInterviewIds = [...new Set(allFeedbackInterviewIds)] as string[];

    // Check overlap between interview IDs and feedback interviewIds
    const overlappingIds = interviewIds.filter((id: string) => uniqueFeedbackInterviewIds.includes(id));
    const nonOverlappingTPOInterviews = interviewIds.filter((id: string) => !uniqueFeedbackInterviewIds.includes(id));
    const feedbacksWithoutTPOInterview = uniqueFeedbackInterviewIds.filter((id: string) => !interviewIds.includes(id));

    // Sample feedbacks
    const feedbackSamples = totalFeedbackSnapshot.docs.slice(0, 10).map((doc: any) => ({
      feedbackId: doc.id,
      interviewId: doc.data().interviewId,
      interviewIdType: typeof doc.data().interviewId,
      userId: doc.data().userId,
      totalScore: doc.data().totalScore,
    }));

    // Test actual where query for first 3 interviews
    const queryTests: Array<{interviewId: string; queryResult: number; idType: string; matchedDocs: string[]}> = [];
    for (const interviewId of interviewIds.slice(0, 3)) {
      const snapshot = await db
        .collection("feedback")
        .where("interviewId", "==", interviewId)
        .get();
      queryTests.push({
        interviewId,
        queryResult: snapshot.size,
        idType: typeof interviewId,
        matchedDocs: snapshot.docs.map((d: any) => d.id),
      });
    }

    // Also do a manual in-memory check to compare
    const inMemoryCheck: Record<string, number> = {};
    for (const interviewId of interviewIds.slice(0, 3)) {
      const count = totalFeedbackSnapshot.docs.filter(
        (doc: any) => doc.data().interviewId === interviewId
      ).length;
      inMemoryCheck[interviewId] = count;
    }

    return Response.json({
      success: true,
      debug: {
        collegeId,
        tpoInterviews: {
          count: interviewsSnapshot.docs.length,
          sampleIds: interviewIds.slice(0, 5),
          details: interviewDetails.slice(0, 3),
        },
        allFeedbacks: {
          totalCount: totalFeedbackCount,
          uniqueInterviewIds: uniqueFeedbackInterviewIds.length,
          sampleInterviewIds: uniqueFeedbackInterviewIds.slice(0, 5),
        },
        overlap: {
          matchingCount: overlappingIds.length,
          matchingIds: overlappingIds.slice(0, 5),
          tpoInterviewsWithNoFeedback: nonOverlappingTPOInterviews.length,
          feedbacksNotForTPOInterviews: feedbacksWithoutTPOInterview.length,
        },
        samples: {
          feedbacks: feedbackSamples,
        },
        queryTests,
        inMemoryCheck,
      }
    });

  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
