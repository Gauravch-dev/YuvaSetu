"use server";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";
import { ollamaLLMAdapter } from "@/lib/services/ollama_llm_adapter";
import { logger } from "@/lib/services/logger";

interface ConversationValidation {
  isValid: boolean;
  reason?: string;
  userMessages: number;
  assistantMessages: number;
  totalLength: number;
  meaningfulExchanges: number;
}

/**
 * Validates if the conversation is substantial enough for meaningful feedback
 */
function validateConversation(transcript: { role: string; content: string }[]): ConversationValidation {
  const userMessages = transcript.filter(msg => msg.role === "user");
  const assistantMessages = transcript.filter(msg => msg.role === "assistant");
  
  // Calculate meaningful content (non-empty, non-trivial responses)
  const meaningfulUserMessages = userMessages.filter(msg => 
    msg.content.trim().length > 10 && // More than just "hello" or "yes"
    msg.content.trim().split(' ').length > 2 // More than 2 words
  );
  
  const totalLength = transcript.reduce((sum, msg) => sum + msg.content.length, 0);
  const meaningfulExchanges = Math.min(meaningfulUserMessages.length, assistantMessages.length);
  
  // Validation criteria
  const minUserMessages = 3; // At least 3 user responses
  const minMeaningfulExchanges = 2; // At least 2 meaningful back-and-forth exchanges
  const minTotalLength = 200; // At least 200 characters total
  const minMeaningfulUserMessages = 2; // At least 2 substantial user responses
  
  let isValid = true;
  let reason = "";
  
  if (userMessages.length < minUserMessages) {
    isValid = false;
    reason = `Insufficient user responses (${userMessages.length}/${minUserMessages} required)`;
  } else if (meaningfulUserMessages.length < minMeaningfulUserMessages) {
    isValid = false;
    reason = `Insufficient meaningful responses from candidate (${meaningfulUserMessages.length}/${minMeaningfulUserMessages} required)`;
  } else if (meaningfulExchanges < minMeaningfulExchanges) {
    isValid = false;
    reason = `Insufficient conversation exchanges (${meaningfulExchanges}/${minMeaningfulExchanges} required)`;
  } else if (totalLength < minTotalLength) {
    isValid = false;
    reason = `Interview too brief (${totalLength}/${minTotalLength} characters required)`;
  }
  
  return {
    isValid,
    reason,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    totalLength,
    meaningfulExchanges
  };
}

/**
 * Calculates total score from category averages
 */
function calculateTotalScore(categoryScores: any[]): number | string {
  const numericScores = categoryScores
    .map(cat => cat.score)
    .filter((score): score is number => typeof score === 'number');
  
  if (numericScores.length === 0) {
    return "Cannot be determined";
  }
  
  if (numericScores.length !== categoryScores.length) {
    // Some categories couldn't be determined
    return "Cannot be determined";
  }
  
  // Calculate weighted average (you can adjust weights if needed)
  const average = numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length;
  return Math.round(average);
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    logger.info('CreateFeedback', 'Starting feedback generation', {
      interviewId,
      userId,
      transcriptLength: formattedTranscript.length,
      messageCount: transcript.length
    });

    // First, validate the conversation
    const validation = validateConversation(transcript);
    
    logger.info('CreateFeedback', 'Conversation validation result', validation);

    if (!validation.isValid) {
      logger.info('CreateFeedback', 'Conversation insufficient for feedback', { reason: validation.reason });
      
      const feedback = {
        interviewId: interviewId,
        userId: userId,
        totalScore: "Cannot be determined",
        categoryScores: [
          { name: "Communication Skills", score: "Cannot be determined", comment: "Insufficient conversation data for assessment" },
          { name: "Technical Knowledge", score: "Cannot be determined", comment: "Insufficient conversation data for assessment" },
          { name: "Problem Solving", score: "Cannot be determined", comment: "Insufficient conversation data for assessment" },
          { name: "Cultural Fit", score: "Cannot be determined", comment: "Insufficient conversation data for assessment" },
          { name: "Confidence and Clarity", score: "Cannot be determined", comment: "Insufficient conversation data for assessment" },
        ],
        strengths: [],
        areasForImprovement: [],
        finalAssessment: `This interview was too brief or lacked sufficient meaningful interaction for a comprehensive evaluation. ${validation.reason}. To receive proper feedback, please engage more actively with the interviewer and provide detailed responses to questions.`,
        createdAt: new Date().toISOString(),
      };

      let feedbackRef;
      if (feedbackId) {
        feedbackRef = db.collection("feedback").doc(feedbackId);
      } else {
        feedbackRef = db.collection("feedback").doc();
      }

      await feedbackRef.set(feedback);
      return { success: true, feedbackId: feedbackRef.id };
    }

    // Improved LLM prompt - more polite but honest
    const feedbackPrompt = `You are a professional interview assessor providing constructive feedback on a mock interview. Your evaluation should be honest, detailed, and helpful for the candidate's growth while maintaining a respectful and encouraging tone.

Transcript:
${formattedTranscript}

Evaluation Guidelines:
- Be thorough and specific in your analysis
- Provide honest assessment but avoid harsh or dismissive language
- Focus on actionable feedback that helps the candidate improve
- Give credit where deserved - if responses are excellent, score them highly
- Don't hesitate to give high scores (80-100) when truly earned
- Be constructive in criticism - explain what could be improved and how

Please analyze this interview and provide feedback in the following JSON format. IMPORTANT: Use only simple text in comments without special characters, quotes, or line breaks:

{
  "categoryScores": [
    {
      "name": "Communication Skills",
      "score": <number 0-100>,
      "comment": "detailed comment about clarity, articulation, and communication effectiveness"
    },
    {
      "name": "Technical Knowledge", 
      "score": <number 0-100>,
      "comment": "detailed comment about understanding of key concepts and technical competency"
    },
    {
      "name": "Problem Solving",
      "score": <number 0-100>, 
      "comment": "detailed comment about analytical thinking and problem-solving approach"
    },
    {
      "name": "Cultural Fit",
      "score": <number 0-100>,
      "comment": "detailed comment about alignment with professional values and team collaboration"
    },
    {
      "name": "Confidence and Clarity",
      "score": <number 0-100>,
      "comment": "detailed comment about confidence level, clarity of thought, and presentation"
    }
  ],
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "areasForImprovement": ["specific improvement area 1", "specific improvement area 2", "specific improvement area 3"],
  "finalAssessment": "A balanced, constructive overall assessment that acknowledges both strengths and areas for growth, written in an encouraging but honest tone"
}

CRITICAL: 
- Return only valid JSON with no markdown code blocks or additional text
- Do NOT include totalScore in the JSON - it will be calculated separately
- Avoid apostrophes, quotes within strings, and newlines in the JSON
- Be encouraging yet honest - avoid phrases like 'completely useless' or 'not made for this job'
- Instead use constructive language like 'has potential but needs development in...' or 'shows promise with room for improvement in...'`;

    const response = await ollamaLLMAdapter.generateResponse([
      {
        role: 'user',
        content: feedbackPrompt,
      },
    ]);

    logger.debug('CreateFeedback', 'Raw LLM response', { response });

    // Parse the JSON response (strip markdown code blocks if present)
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Additional cleaning to handle problematic characters in JSON strings
    // First, remove control characters that break JSON parsing
    cleanResponse = cleanResponse
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\r\n/g, ' ') // Replace Windows line endings
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, ' ') // Replace carriage returns with spaces
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();

    let object;
    try {
      object = JSON.parse(cleanResponse);
    } catch (parseError) {
      logger.error('CreateFeedback', 'Failed to parse JSON response', { 
        error: parseError,
        originalResponse: response.slice(0, 500),
        cleanedResponse: cleanResponse.slice(0, 500)
      });
      
      // Try a more aggressive cleaning approach
      try {
        // Extract JSON manually using regex
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let extractedJson = jsonMatch[0];
          // Clean up the extracted JSON more aggressively
          extractedJson = extractedJson
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, '')
            .replace(/\\t/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          object = JSON.parse(extractedJson);
          logger.info('CreateFeedback', 'Successfully parsed JSON after aggressive cleaning');
        } else {
          throw new Error('No JSON object found in response');
        }
      } catch (secondParseError) {
        logger.error('CreateFeedback', 'Critical: Unable to parse LLM response after multiple attempts', { 
          error: secondParseError,
          response: response.slice(0, 1000)
        });
        
        // NO FALLBACK SCORES - return "Cannot be determined"
        const feedback = {
          interviewId: interviewId,
          userId: userId,
          totalScore: "Cannot be determined",
          categoryScores: [
            { name: "Communication Skills", score: "Cannot be determined", comment: "Technical error occurred during assessment" },
            { name: "Technical Knowledge", score: "Cannot be determined", comment: "Technical error occurred during assessment" },
            { name: "Problem Solving", score: "Cannot be determined", comment: "Technical error occurred during assessment" },
            { name: "Cultural Fit", score: "Cannot be determined", comment: "Technical error occurred during assessment" },
            { name: "Confidence and Clarity", score: "Cannot be determined", comment: "Technical error occurred during assessment" },
          ],
          strengths: [],
          areasForImprovement: [],
          finalAssessment: "A technical error occurred during the feedback generation process. Please try the interview again or contact support for assistance.",
          createdAt: new Date().toISOString(),
        };

        let feedbackRef;
        if (feedbackId) {
          feedbackRef = db.collection("feedback").doc(feedbackId);
        } else {
          feedbackRef = db.collection("feedback").doc();
        }

        await feedbackRef.set(feedback);
        return { success: true, feedbackId: feedbackRef.id };
      }
    }

    // Validate the parsed data structure
    if (!object.categoryScores || !Array.isArray(object.categoryScores)) {
      throw new Error('Invalid response structure from LLM');
    }

    // Calculate total score from category averages
    const totalScore = calculateTotalScore(object.categoryScores);

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths || ["Interview participation"],
      areasForImprovement: object.areasForImprovement || ["Continue developing interview skills"],
      finalAssessment: object.finalAssessment || "Feedback assessment completed.",
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    logger.info('CreateFeedback', 'Feedback generation completed', {
      totalScore: feedback.totalScore,
      categoriesCount: feedback.categoryScores.length,
      validationPassed: validation.isValid
    });

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    logger.error("CreateFeedback", "System error during feedback generation", error);
    
    // NO FALLBACK - return "Cannot be determined"
    try {
      const feedback = {
        interviewId: interviewId,
        userId: userId,
        totalScore: "Cannot be determined",
        categoryScores: [
          { name: "Communication Skills", score: "Cannot be determined", comment: "System error prevented assessment" },
          { name: "Technical Knowledge", score: "Cannot be determined", comment: "System error prevented assessment" },
          { name: "Problem Solving", score: "Cannot be determined", comment: "System error prevented assessment" },
          { name: "Cultural Fit", score: "Cannot be determined", comment: "System error prevented assessment" },
          { name: "Confidence and Clarity", score: "Cannot be determined", comment: "System error prevented assessment" },
        ],
        strengths: [],
        areasForImprovement: [],
        finalAssessment: "A system error occurred during feedback generation. Please try again or contact support if the issue persists.",
        createdAt: new Date().toISOString(),
      };

      let feedbackRef;
      if (feedbackId) {
        feedbackRef = db.collection("feedback").doc(feedbackId);
      } else {
        feedbackRef = db.collection("feedback").doc();
      }

      await feedbackRef.set(feedback);
      return { success: true, feedbackId: feedbackRef.id };
    } catch (dbError) {
      logger.error("CreateFeedback", "Failed to save error feedback to database", dbError);
      return { success: false };
    }
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

// Batch function to get feedback for multiple interviews at once (performance optimization)
export async function getBatchFeedbackByInterviewIds(
  userId: string,
  interviewIds: string[]
): Promise<Record<string, Feedback>> {
  if (!userId || !interviewIds.length) return {};

  // Firestore 'in' query has a limit of 30 items, so we need to batch
  const BATCH_SIZE = 30;
  const feedbackMap: Record<string, Feedback> = {};

  for (let i = 0; i < interviewIds.length; i += BATCH_SIZE) {
    const batch = interviewIds.slice(i, i + BATCH_SIZE);

    const querySnapshot = await db
      .collection("feedback")
      .where("userId", "==", userId)
      .where("interviewId", "in", batch)
      .get();

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      feedbackMap[data.interviewId] = { id: doc.id, ...data } as Feedback;
    }
  }

  return feedbackMap;
}

// Get feedback by ID (no access control — use getFeedbackByIdForTPO for TPO access)
export async function getFeedbackById(feedbackId: string): Promise<Feedback | null> {
  try {
    const feedbackDoc = await db.collection("feedback").doc(feedbackId).get();
    if (!feedbackDoc.exists) return null;
    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
  } catch (error) {
    return null;
  }
}

// Get feedback by ID with college-scoped access check for TPO
export async function getFeedbackByIdForTPO(feedbackId: string, collegeId: string): Promise<Feedback | null> {
  try {
    const feedbackDoc = await db.collection("feedback").doc(feedbackId).get();
    if (!feedbackDoc.exists) return null;

    const feedbackData = feedbackDoc.data()!;

    // Verify the student belongs to the TPO's college
    if (feedbackData.userId) {
      const userDoc = await db.collection("users").doc(feedbackData.userId).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();
      if (userData?.college !== collegeId) return null;
    }

    return { id: feedbackDoc.id, ...feedbackData } as Feedback;
  } catch (error) {
    return null;
  }
}

// Get interviews for students based on their college/branch/year
// TPOs see all interviews for their college (no branch/year filtering)
export async function getInterviewsForStudent(
  userId: string,
  userData?: { college?: string; branch?: string; year?: string; role?: string; collegeId?: string } | null
): Promise<Interview[] | null> {
  try {
    if (!userId || userId.trim() === '') return [];

    // Use pre-fetched user data if available, otherwise fetch
    let user = userData;
    if (!user) {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) return [];
      user = userDoc.data() as User;
    }

    const isTPO = (user as any).role === "tpo";
    const collegeId = isTPO ? ((user as any).collegeId || user.college) : user.college;

    // Must have a college to find targeted interviews
    if (!collegeId) return [];

    // Students (non-TPO) need complete profile
    if (!isTPO && (!user.branch || !user.year)) {
      return [];
    }

    // Get interviews targeted to user's college
    const interviews = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .where("targetColleges", "array-contains", collegeId)
      .orderBy("createdAt", "desc")
      .get();

    // Filter by branch/year match and exclude own interviews
    // TPOs skip branch/year filtering — they see all college interviews
    const filteredInterviews = interviews.docs.filter((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const interview = doc.data() as Interview;

      // Exclude own interviews
      if (interview.userId === userId) return false;

      // TPOs see all interviews for their college
      if (isTPO) return true;

      // Students: must match branch and year
      if (!interview.targetBranches || !interview.targetYears) return false;

      const matchesBranch = interview.targetBranches.includes(user!.branch!);
      const matchesYear = interview.targetYears.includes(parseInt(user!.year!));

      return matchesBranch && matchesYear;
    });

    return filteredInterviews.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    })) as Interview[];

  } catch (error) {
    console.error("Error fetching interviews for student:", error);
    return [];
  }
}

// Get interviews with filters for admin
export async function getInterviewsWithFilters(
  filters: CollegeFilters,
): Promise<Interview[] | null> {
  try {
    // Use Firestore array-contains for efficient college filtering
    let query: FirebaseFirestore.Query = db.collection("interviews").where("finalized", "==", true);

    // If a single college filter is provided, use array-contains for efficient query
    const collegeId = filters.college || (filters.collegeIds?.length === 1 ? filters.collegeIds[0] : null);
    if (collegeId) {
      query = query.where("targetColleges", "array-contains", collegeId);
    }

    const interviews = await query.orderBy("createdAt", "desc").get();

    const filteredInterviews: Interview[] = [];

    for (const doc of interviews.docs) {
      const interview = { id: doc.id, ...doc.data() } as Interview;
      let matchesFilter = true;

      // Multi-college filter (when more than 1 college selected)
      if (filters.collegeIds && filters.collegeIds.length > 1) {
        const hasMatchingCollege = interview.targetColleges?.some(
          id => filters.collegeIds!.includes(id)
        );
        if (!hasMatchingCollege) matchesFilter = false;
      }

      // Branch filter
      if (matchesFilter && filters.branch) {
        const hasMatchingBranch = interview.targetBranches?.includes(filters.branch);
        if (!hasMatchingBranch) matchesFilter = false;
      } else if (matchesFilter && filters.branches && filters.branches.length > 0) {
        const hasMatchingBranch = interview.targetBranches?.some(
          branch => filters.branches!.includes(branch)
        );
        if (!hasMatchingBranch) matchesFilter = false;
      }

      // Year filter
      if (matchesFilter && filters.year) {
        const hasMatchingYear = interview.targetYears?.includes(parseInt(filters.year));
        if (!hasMatchingYear) matchesFilter = false;
      } else if (matchesFilter && filters.years && filters.years.length > 0) {
        const hasMatchingYear = interview.targetYears?.some(
          year => filters.years!.includes(year)
        );
        if (!hasMatchingYear) matchesFilter = false;
      }

      if (matchesFilter) {
        filteredInterviews.push(interview);
      }
    }

    return filteredInterviews;

  } catch (error) {
    console.error("Error getting interviews with filters:", error);
    return null;
  }
}

// Get interview attempts — college-scoped with batch user fetch
export async function getInterviewAttempts(interviewId: string, collegeId: string): Promise<StudentFeedbackData[]> {
  try {
    const feedbackQuery = await db
      .collection("feedback")
      .where("interviewId", "==", interviewId)
      .orderBy("createdAt", "desc")
      .get();

    if (feedbackQuery.empty) return [];

    // Collect unique userIds for batch fetch
    const userIds = [...new Set(
      feedbackQuery.docs
        .map(doc => doc.data().userId)
        .filter(Boolean)
    )];

    // Batch fetch all user docs in one round-trip (Firestore getAll)
    const userRefs = userIds.map(uid => db.collection("users").doc(uid));
    const userDocs = userRefs.length > 0 ? await db.getAll(...userRefs) : [];

    // Build userId -> userData map
    const userMap = new Map<string, FirebaseFirestore.DocumentData>();
    for (const doc of userDocs) {
      if (doc.exists) {
        userMap.set(doc.id, doc.data()!);
      }
    }

    const attempts: StudentFeedbackData[] = [];

    for (const feedbackDoc of feedbackQuery.docs) {
      const feedbackData = feedbackDoc.data();
      const userData = feedbackData.userId ? userMap.get(feedbackData.userId) : undefined;

      // Skip students not from this TPO's college
      const studentCollege = userData?.college;
      if (studentCollege !== collegeId) continue;

      attempts.push({
        feedbackId: feedbackDoc.id,
        studentName: userData?.name || "Unknown Student",
        studentEmail: userData?.email || "N/A",
        college: studentCollege,
        branch: userData?.branch || "Unknown Branch",
        year: userData?.year,
        totalScore: feedbackData.totalScore || 0,
        attemptDate: feedbackData.createdAt,
        categoryScores: feedbackData.categoryScores || {},
        strengths: feedbackData.strengths || [],
        areasForImprovement: feedbackData.areasForImprovement || []
      });
    }

    return attempts;

  } catch (error) {
    console.error("Error fetching interview attempts:", error);
    return [];
  }
}

// Get interviews for TPO reports — college-scoped with efficient feedback counting
export async function getInterviewsForTPO(params: TPOReportParams): Promise<Interview[] | null> {
  try {
    const { collegeId, branch, year } = params;

    const interviews = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .where("targetColleges", "array-contains", collegeId)
      .orderBy("createdAt", "desc")
      .get();

    // Filter by branch and year if provided
    const filteredInterviews: Interview[] = [];

    for (const doc of interviews.docs) {
      const interview = { id: doc.id, ...doc.data() } as Interview;

      if (branch && interview.targetBranches && !interview.targetBranches.includes(branch)) {
        continue;
      }

      if (year && interview.targetYears && !interview.targetYears.includes(parseInt(year))) {
        continue;
      }

      filteredInterviews.push(interview);
    }

    // Batch count feedback per interview using 'in' queries (max 30 per batch)
    const BATCH_SIZE = 30;
    const feedbackCountByInterview: Record<string, number> = {};
    const interviewIds = filteredInterviews.map(i => i.id);

    for (let i = 0; i < interviewIds.length; i += BATCH_SIZE) {
      const batch = interviewIds.slice(i, i + BATCH_SIZE);
      const feedbackSnapshot = await db
        .collection("feedback")
        .where("interviewId", "in", batch)
        .get();

      for (const doc of feedbackSnapshot.docs) {
        const fInterviewId = doc.data().interviewId;
        feedbackCountByInterview[fInterviewId] = (feedbackCountByInterview[fInterviewId] || 0) + 1;
      }
    }

    const interviewsWithCounts = filteredInterviews.map((interview) => ({
      ...interview,
      submissionCount: feedbackCountByInterview[interview.id] || 0,
    }));

    return interviewsWithCounts;

  } catch (error) {
    console.error("Error getting interviews for TPO:", error);
    return null;
  }
}

// Original functions (keeping for backward compatibility)
export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  // Validate userId
  if (!userId || userId.trim() === '') {
    // console.warn('getInterviewsByUserId called with invalid userId:', userId);
    return [];
  }

  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}
