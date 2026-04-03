import { NextRequest } from "next/server";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { ollamaLLMAdapter } from "@/lib/services/ollama_llm_adapter";
import { logger } from "@/lib/services/logger";
import { verifyAuthToken } from "@/lib/actions/auth.action";

export async function POST(request: NextRequest) {
  try {
    // Require valid authentication — no fallback
    const authResult = await verifyAuthToken(request.headers.get("authorization"));
    if (!authResult) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admins can generate interviews
    if (authResult.role !== "admin") {
      logger.warn("API Generate", "Non-admin access attempt", { userId: authResult.userId, role: authResult.role });
      return Response.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { type, role, level, techstack, amount, targetColleges, targetBranches, targetYears } = await request.json();

    if (!type || !role || !level || !techstack || !amount) {
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

    logger.info("API Generate", "Starting interview generation", {
      role, level, type, amount,
      targetColleges: targetColleges.length,
      userId: authResult.userId,
    });

    const prompt = `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]

        Thank you!`;

    const questions = await ollamaLLMAdapter.generateResponse([
      { role: "user", content: prompt },
    ]);

    let parsedQuestions: string[];
    try {
      parsedQuestions = JSON.parse(questions);
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Response is not an array");
      }
    } catch (parseError) {
      logger.warn("API Generate", "Failed to parse JSON, attempting text extraction");

      const lines = questions.split('\n').filter(line => line.trim());
      parsedQuestions = lines
        .filter(line =>
          line.includes('?') &&
          !line.toLowerCase().includes('thank you') &&
          line.length > 10
        )
        .map(line => line.replace(/^\d+\.?\s*/, '').replace(/^["\[\]]/g, '').replace(/["\[\]],?$/g, '').trim())
        .slice(0, amount);

      if (parsedQuestions.length === 0) {
        return Response.json(
          { success: false, error: "Failed to generate valid questions" },
          { status: 500 }
        );
      }
    }

    const createdAt = new Date().toISOString();
    const interview = {
      role,
      type,
      level,
      techstack: typeof techstack === 'string'
        ? techstack.split(",").map((tech: string) => tech.trim())
        : Array.isArray(techstack)
        ? techstack
        : [],
      questions: parsedQuestions,
      userId: authResult.userId,
      finalized: true,
      coverImage: getRandomInterviewCover(`${authResult.userId}-${createdAt}`),
      createdAt,
      targetColleges,
      targetBranches,
      targetYears,
    };

    const docRef = await db.collection("interviews").add(interview);

    logger.info("API Generate", "Interview generated successfully", {
      interviewId: docRef.id,
      questionsGenerated: parsedQuestions.length,
      userId: authResult.userId,
    });

    return Response.json({
      success: true,
      interviewId: docRef.id,
      questionsGenerated: parsedQuestions.length
    }, { status: 200 });

  } catch (error) {
    logger.error("API Generate", "Interview generation failed", error);
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
    message: "Interview Generation API",
    status: "active"
  }, { status: 200 });
}
