import { NextRequest } from "next/server";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { logger } from "@/lib/services/logger";
import { verifyAuthToken } from "@/lib/actions/auth.action";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication — require valid token, no fallback
    const authResult = await verifyAuthToken(request.headers.get("authorization"));
    if (!authResult) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admins and TPOs can create interviews
    if (authResult.role !== "admin" && authResult.role !== "tpo") {
      logger.warn("API Save Interview", "Unauthorized access attempt", { userId: authResult.userId, role: authResult.role });
      return Response.json(
        { success: false, error: "Admin or TPO access required" },
        { status: 403 }
      );
    }

    const {
      type,
      role,
      level,
      techstack,
      amount,
      targetColleges,
      targetBranches,
      targetYears,
      questions,
      jobDescription
    } = await request.json();

    // Validate input
    if (!type || !role || !level || !techstack || !amount || !questions) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!targetColleges || !targetBranches || !targetYears) {
      return Response.json(
        { success: false, error: "Missing targeting fields (colleges, branches, years)" },
        { status: 400 }
      );
    }

    // TPOs can only create interviews for their own college
    if (authResult.role === "tpo") {
      if (!authResult.collegeId || targetColleges.length !== 1 || targetColleges[0] !== authResult.collegeId) {
        return Response.json(
          { success: false, error: "TPOs can only create interviews for their own college" },
          { status: 403 }
        );
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return Response.json(
        { success: false, error: "Questions must be a non-empty array" },
        { status: 400 }
      );
    }

    logger.info("API Save Interview", "Saving interview to database", {
      role,
      level,
      type,
      questionsGenerated: questions.length,
      targetColleges: targetColleges.length,
      targetBranches: targetBranches.length,
      targetYears: targetYears.length,
      hasJobDescription: !!jobDescription,
      userId: authResult.userId,
    });

    const createdAt = new Date().toISOString();
    const interview: Record<string, any> = {
      role,
      type,
      level,
      techstack: typeof techstack === 'string'
        ? techstack.split(",").map((tech: string) => tech.trim())
        : Array.isArray(techstack)
        ? techstack
        : [],
      questions,
      userId: authResult.userId,
      finalized: true,
      coverImage: getRandomInterviewCover(`${authResult.userId}-${createdAt}`),
      createdAt,
      targetColleges,
      targetBranches,
      targetYears,
    };

    if (jobDescription && typeof jobDescription === 'string' && jobDescription.trim()) {
      interview.jobDescription = jobDescription.trim();
    }

    const docRef = await db.collection("interviews").add(interview);

    logger.info("API Save Interview", "Interview saved successfully", {
      interviewId: docRef.id,
      questionsGenerated: questions.length,
      userId: authResult.userId,
    });

    return Response.json({
      success: true,
      interviewId: docRef.id,
      questionsGenerated: questions.length
    }, { status: 200 });

  } catch (error) {
    logger.error("API Save Interview", "Interview save failed", error);
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
    message: "Save Interview API",
    status: "active"
  }, { status: 200 });
}
