import { NextRequest } from "next/server";
import { db } from "@/firebase/admin";
import { verifyAuthToken } from "@/lib/actions/auth.action";

interface FeedbackDownloadData {
  feedbackId: string;
  interviewId: string;
  studentName: string;
  studentEmail: string;
  college: string;
  branch: string;
  year: string;
  interviewRole: string;
  interviewLevel: string;
  interviewType: string;
  techStack: string;
  totalScore: number | string;
  communicationScore: number | string;
  communicationComment: string;
  technicalScore: number | string;
  technicalComment: string;
  problemSolvingScore: number | string;
  problemSolvingComment: string;
  culturalFitScore: number | string;
  culturalFitComment: string;
  confidenceScore: number | string;
  confidenceComment: string;
  strengths: string;
  areasForImprovement: string;
  finalAssessment: string;
  attemptDate: string;
  interviewCreatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verify TPO auth
    const authResult = await verifyAuthToken(request.headers.get("authorization"));
    if (!authResult) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (authResult.role !== "tpo" || !authResult.collegeId) {
      return Response.json({ success: false, error: "TPO access required" }, { status: 403 });
    }

    const collegeId = authResult.collegeId;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const branch = searchParams.get("branch");
    const year = searchParams.get("year");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Step 1: Get interviews targeting this college
    const interviewsSnapshot = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .where("targetColleges", "array-contains", collegeId)
      .get();

    if (interviewsSnapshot.empty) {
      return formatResponse([], format, collegeId, { branch, year, startDate, endDate });
    }

    // Build interview map
    const interviewMap = new Map<string, FirebaseFirestore.DocumentData>();
    const interviewIds: string[] = [];
    for (const doc of interviewsSnapshot.docs) {
      interviewMap.set(doc.id, doc.data());
      interviewIds.push(doc.id);
    }

    // Step 2: Batch-fetch feedback for these interviews
    const BATCH_SIZE = 30;
    const allFeedbackDocs: { id: string; data: FirebaseFirestore.DocumentData }[] = [];

    for (let i = 0; i < interviewIds.length; i += BATCH_SIZE) {
      const batch = interviewIds.slice(i, i + BATCH_SIZE);
      const feedbackSnapshot = await db
        .collection("feedback")
        .where("interviewId", "in", batch)
        .get();

      for (const doc of feedbackSnapshot.docs) {
        allFeedbackDocs.push({ id: doc.id, data: doc.data() });
      }
    }

    if (allFeedbackDocs.length === 0) {
      return formatResponse([], format, collegeId, { branch, year, startDate, endDate });
    }

    // Step 3: Batch-fetch all unique users
    const uniqueUserIds = [...new Set(allFeedbackDocs.map(f => f.data.userId).filter(Boolean))];
    const userMap = new Map<string, FirebaseFirestore.DocumentData>();

    if (uniqueUserIds.length > 0) {
      const userRefs = uniqueUserIds.map(uid => db.collection("users").doc(uid));
      const userDocs = await db.getAll(...userRefs);
      for (const doc of userDocs) {
        if (doc.exists) {
          userMap.set(doc.id, doc.data()!);
        }
      }
    }

    // Step 4: Build download data with filtering
    const downloadData: FeedbackDownloadData[] = [];

    for (const feedbackEntry of allFeedbackDocs) {
      const feedback = feedbackEntry.data;
      const userData = feedback.userId ? userMap.get(feedback.userId) : undefined;

      // Skip if student is not from TPO's college
      if (!userData || userData.college !== collegeId) continue;

      // Apply branch filter
      if (branch && userData.branch !== branch) continue;

      // Apply year filter
      if (year && userData.year !== year) continue;

      // Apply date filters
      if (startDate && feedback.createdAt < startDate) continue;
      if (endDate && feedback.createdAt > endDate) continue;

      const interviewData = interviewMap.get(feedback.interviewId);
      if (!interviewData) continue;

      const categoryScores = feedback.categoryScores || [];
      const getScoreAndComment = (categoryName: string) => {
        const category = categoryScores.find((cat: any) => cat.name === categoryName);
        return {
          score: category?.score || "N/A",
          comment: category?.comment || "N/A"
        };
      };

      const comm = getScoreAndComment("Communication Skills");
      const tech = getScoreAndComment("Technical Knowledge");
      const problem = getScoreAndComment("Problem Solving");
      const cultural = getScoreAndComment("Cultural Fit");
      const confidence = getScoreAndComment("Confidence and Clarity");

      downloadData.push({
        feedbackId: feedbackEntry.id,
        interviewId: feedback.interviewId,
        studentName: userData.name || "N/A",
        studentEmail: userData.email || "N/A",
        college: userData.college || "N/A",
        branch: userData.branch || "N/A",
        year: userData.year || "N/A",
        interviewRole: interviewData.role || "N/A",
        interviewLevel: interviewData.level || "N/A",
        interviewType: interviewData.type || "N/A",
        techStack: Array.isArray(interviewData.techstack) ? interviewData.techstack.join(", ") : (interviewData.techstack || "N/A"),
        totalScore: feedback.totalScore || "N/A",
        communicationScore: comm.score,
        communicationComment: comm.comment,
        technicalScore: tech.score,
        technicalComment: tech.comment,
        problemSolvingScore: problem.score,
        problemSolvingComment: problem.comment,
        culturalFitScore: cultural.score,
        culturalFitComment: cultural.comment,
        confidenceScore: confidence.score,
        confidenceComment: confidence.comment,
        strengths: Array.isArray(feedback.strengths) ? feedback.strengths.join("; ") : (feedback.strengths || "N/A"),
        areasForImprovement: Array.isArray(feedback.areasForImprovement) ? feedback.areasForImprovement.join("; ") : (feedback.areasForImprovement || "N/A"),
        finalAssessment: feedback.finalAssessment || "N/A",
        attemptDate: feedback.createdAt || "N/A",
        interviewCreatedAt: interviewData.createdAt || "N/A"
      });
    }

    return formatResponse(downloadData, format, collegeId, { branch, year, startDate, endDate });

  } catch (error) {
    console.error("Error generating download:", error);
    return Response.json(
      { success: false, error: "Failed to generate download" },
      { status: 500 }
    );
  }
}

function formatResponse(
  downloadData: FeedbackDownloadData[],
  format: string,
  collegeId: string,
  filters: Record<string, string | null>
) {
  if (format === "csv") {
    const headers = [
      "Feedback ID", "Interview ID", "Student Name", "Student Email",
      "College", "Branch", "Year", "Interview Role", "Interview Level",
      "Interview Type", "Tech Stack", "Total Score",
      "Communication Score", "Communication Comment",
      "Technical Score", "Technical Comment",
      "Problem Solving Score", "Problem Solving Comment",
      "Cultural Fit Score", "Cultural Fit Comment",
      "Confidence Score", "Confidence Comment",
      "Strengths", "Areas for Improvement", "Final Assessment",
      "Attempt Date", "Interview Created Date"
    ];

    const csvContent = [
      headers.join(","),
      ...downloadData.map(row => [
        `"${row.feedbackId}"`, `"${row.interviewId}"`,
        `"${row.studentName}"`, `"${row.studentEmail}"`,
        `"${row.college}"`, `"${row.branch}"`, `"${row.year}"`,
        `"${row.interviewRole}"`, `"${row.interviewLevel}"`,
        `"${row.interviewType}"`, `"${row.techStack}"`,
        `"${row.totalScore}"`,
        `"${row.communicationScore}"`, `"${row.communicationComment.replace(/"/g, '""')}"`,
        `"${row.technicalScore}"`, `"${row.technicalComment.replace(/"/g, '""')}"`,
        `"${row.problemSolvingScore}"`, `"${row.problemSolvingComment.replace(/"/g, '""')}"`,
        `"${row.culturalFitScore}"`, `"${row.culturalFitComment.replace(/"/g, '""')}"`,
        `"${row.confidenceScore}"`, `"${row.confidenceComment.replace(/"/g, '""')}"`,
        `"${row.strengths.replace(/"/g, '""')}"`,
        `"${row.areasForImprovement.replace(/"/g, '""')}"`,
        `"${row.finalAssessment.replace(/"/g, '""')}"`,
        `"${row.attemptDate}"`, `"${row.interviewCreatedAt}"`
      ].join(","))
    ].join("\n");

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `interview_reports_${collegeId}_${timestamp}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } else {
    return Response.json({
      success: true,
      data: downloadData,
      total: downloadData.length,
      collegeId,
      filters
    });
  }
}
