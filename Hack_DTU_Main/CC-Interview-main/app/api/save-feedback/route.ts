import { NextRequest } from "next/server";
import { db } from "@/firebase/admin";
import { logger } from "@/lib/services/logger";
import { verifyAuthToken } from "@/lib/actions/auth.action";

export async function POST(request: NextRequest) {
  try {
    // Require valid authentication — no fallback to body userId
    const authResult = await verifyAuthToken(request.headers.get("authorization"));
    if (!authResult) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      interviewId,
      feedbackId,
      totalScore,
      categoryScores,
      strengths,
      areasForImprovement,
      finalAssessment
    } = await request.json();

    // Validate input
    if (!interviewId || (totalScore === null || totalScore === undefined) || !categoryScores) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    logger.info("API Save Feedback", "Saving feedback to database", {
      interviewId,
      userId: authResult.userId,
      totalScore,
      categoriesCount: categoryScores.length,
    });

    const feedback = {
      interviewId,
      userId: authResult.userId,
      totalScore,
      categoryScores,
      strengths: strengths || [],
      areasForImprovement: areasForImprovement || [],
      finalAssessment: finalAssessment || "",
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    logger.info("API Save Feedback", "Feedback saved successfully", {
      feedbackId: feedbackRef.id,
      interviewId,
      userId: authResult.userId,
      totalScore,
    });

    return Response.json({
      success: true,
      feedbackId: feedbackRef.id
    }, { status: 200 });

  } catch (error) {
    logger.error("API Save Feedback", "Feedback save failed", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: "Save Feedback API",
    status: "active"
  }, { status: 200 });
}
