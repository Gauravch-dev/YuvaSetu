import { NextRequest } from "next/server";
import { getInterviewsForTPO } from "@/lib/actions/general.action";
import { verifyAuthToken } from "@/lib/actions/auth.action";

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");
    const year = searchParams.get("year");

    const interviews = await getInterviewsForTPO({
      collegeId: authResult.collegeId,
      branch: branch || undefined,
      year: year || undefined,
    });

    return Response.json({ success: true, data: interviews || [], collegeId: authResult.collegeId }, { status: 200 });

  } catch {
    return Response.json(
      { success: false, error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
