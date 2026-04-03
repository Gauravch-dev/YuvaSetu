import { NextRequest } from "next/server";
import { getInterviewAttempts } from "@/lib/actions/general.action";
import { verifyAuthToken } from "@/lib/actions/auth.action";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const { interviewId } = await params;

    const authResult = await verifyAuthToken(request.headers.get("authorization"));
    if (!authResult) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (authResult.role !== "tpo" || !authResult.collegeId) {
      return Response.json(
        { success: false, error: "TPO access required" },
        { status: 403 }
      );
    }

    // getInterviewAttempts now filters by college internally
    const attempts = await getInterviewAttempts(interviewId, authResult.collegeId);

    return Response.json({
      success: true,
      attempts,
      interviewId,
      collegeId: authResult.collegeId
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching interview attempts:", error);
    return Response.json(
      { success: false, error: "Failed to fetch interview attempts" },
      { status: 500 }
    );
  }
}
