import { NextRequest } from "next/server";
import { getInterviewsWithFilters } from "@/lib/actions/general.action";
import { verifyAuthToken } from "@/lib/actions/auth.action";

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
    const college = searchParams.get("college");
    const branch = searchParams.get("branch");
    const year = searchParams.get("year");

    const filters = {
      ...(college && { college }),
      ...(branch && { branch }),
      ...(year && { year }),
    };

    const interviews = await getInterviewsWithFilters(filters);

    return Response.json({ success: true, data: interviews }, { status: 200 });

  } catch (error) {
    return Response.json(
      { success: false, error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}
