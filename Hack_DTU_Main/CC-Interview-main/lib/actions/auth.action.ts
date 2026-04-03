"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  // Create session cookie
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000, // milliseconds
  });

  // Set cookie in the browser
  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

// Get all colleges for dropdown
export async function getColleges(): Promise<College[]> {
  try {
    const collegesSnapshot = await db.collection("colleges").get();
    return collegesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    })) as College[];
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return [];
  }
}

// Get colleges with tpoUserId stripped (safe for client exposure)
export async function getCollegesSafe(): Promise<Omit<College, "tpoUserId">[]> {
  try {
    const collegesSnapshot = await db.collection("colleges").get();
    return collegesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        branches: data.branches || [],
        years: data.years || [],
      };
    });
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return [];
  }
}

// Get branches for a specific college
export async function getCollegeBranches(collegeId: string): Promise<string[]> {
  try {
    const collegeDoc = await db.collection("colleges").doc(collegeId).get();
    if (!collegeDoc.exists) return [];
    const collegeData = collegeDoc.data() as College;
    return collegeData.branches || [];
  } catch (error) {
    console.error("Error fetching college branches:", error);
    return [];
  }
}

// Get years for a specific college
export async function getCollegeYears(collegeId: string): Promise<number[]> {
  try {
    const collegeDoc = await db.collection("colleges").doc(collegeId).get();
    if (!collegeDoc.exists) return [];
    const collegeData = collegeDoc.data() as College;
    return collegeData.years || [];
  } catch (error) {
    console.error("Error fetching college years:", error);
    return [];
  }
}

// Check if user is TPO for a college — returns collegeId or null
export async function checkTPOAccess(userId: string): Promise<string | null> {
  if (!db) return null;

  try {
    const collegesSnapshot = await db
      .collection("colleges")
      .where("tpoUserId", "==", userId)
      .limit(1)
      .get();

    if (collegesSnapshot.empty) return null;
    return collegesSnapshot.docs[0].id;
  } catch (error) {
    console.error("Error checking TPO access:", error);
    return null;
  }
}

/**
 * Resolves the role and college context for a user.
 * - Checks `role` field on user doc first (authoritative if set)
 * - Falls back to legacy detection (TPO via colleges collection)
 * - Defaults to "student"
 */
export async function getUserRole(userId: string): Promise<{ role: UserRole; collegeId?: string }> {
  if (!db) return { role: "student" };

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return { role: "student" };

    const userData = userDoc.data();
    const storedRole = userData?.role as UserRole | undefined;

    if (storedRole === "admin") {
      return { role: "admin" };
    }

    if (storedRole === "tpo") {
      // Use stored collegeId if available, otherwise fall back to colleges query
      const collegeId = userData?.collegeId || await checkTPOAccess(userId);
      return { role: "tpo", collegeId: collegeId || undefined };
    }

    // If no role stored, check legacy TPO mapping for backward compatibility
    if (!storedRole) {
      const collegeId = await checkTPOAccess(userId);
      if (collegeId) {
        return { role: "tpo", collegeId };
      }
    }

    return { role: "student" };
  } catch (error) {
    console.error("Error getting user role:", error);
    return { role: "student" };
  }
}

/**
 * Verify a Firebase ID token and return userId + role.
 * Use this in API routes for consistent auth.
 */
export async function verifyAuthToken(authHeader: string | null): Promise<{ userId: string; role: UserRole; collegeId?: string } | null> {
  if (!auth || !authHeader?.startsWith("Bearer ")) return null;

  try {
    const idToken = authHeader.substring(7);
    const decodedClaims = await auth.verifyIdToken(idToken);
    const { role, collegeId } = await getUserRole(decodedClaims.uid);
    return { userId: decodedClaims.uid, role, collegeId };
  } catch {
    return null;
  }
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email, college, branch, year } = params;

  try {
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    const userData: Record<string, any> = {
      name,
      email,
      role: "student",
    };

    if (college) userData.college = college;
    if (branch) userData.branch = branch;
    if (year) userData.year = year;

    await db.collection("users").doc(uid).set(userData);

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { idToken } = params;

  try {
    // idToken is already verified by Firebase client SDK — no need to re-check user existence
    await setSessionCookie(idToken);
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
  } catch (error) {
    console.error("Error during signout:", error);
  }
}

// Get current user from session cookie — includes role resolution
export async function getCurrentUser(): Promise<User | null> {
  if (!auth || !db) return null;

  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();
    if (!userRecord.exists) return null;

    const userData = userRecord.data();

    // Read role directly from the user doc — no second Firestore read needed
    const role: UserRole = userData?.role || "student";
    const collegeId = userData?.collegeId as string | undefined;

    return {
      ...userData,
      id: userRecord.id,
      role,
      collegeId,
    } as User;
  } catch {
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
