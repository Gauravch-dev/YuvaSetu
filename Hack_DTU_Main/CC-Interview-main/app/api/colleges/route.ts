import { NextRequest } from "next/server";
import { getColleges, getCollegeBranches, getCollegeYears, getCollegesSafe, verifyAuthToken } from "@/lib/actions/auth.action";

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await verifyAuthToken(request.headers.get("authorization"));
    if (!authResult) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");
    const type = searchParams.get("type");

    if (collegeId && type === "branches") {
      const branches = await getCollegeBranches(collegeId);
      return Response.json({ success: true, data: branches }, { status: 200 });
    }

    if (collegeId && type === "years") {
      const years = await getCollegeYears(collegeId);
      return Response.json({ success: true, data: years }, { status: 200 });
    }

    // Admin gets full college data (including tpoUserId for management)
    if (authResult.role === "admin") {
      const colleges = await getColleges();
      return Response.json({ success: true, data: colleges }, { status: 200 });
    }

    // Everyone else gets safe data (no tpoUserId exposed)
    const colleges = await getCollegesSafe();
    return Response.json({ success: true, data: colleges }, { status: 200 });

  } catch (error) {
    console.error("Error fetching college data:", error);
    return Response.json(
      { success: false, error: "Failed to fetch college data" },
      { status: 500 }
    );
  }
}
