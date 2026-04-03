"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";
import { NavbarHoverProvider, useNavbarHover } from "@/contexts/NavbarHoverContext";
import { UserProvider } from "@/contexts/UserContext";

interface AuthGuardProps {
  children: React.ReactNode;
  user?: any;
  userRole?: UserRole;
  userCollegeId?: string;
  prefetchedInterviews?: any[] | null;
  prefetchedFeedback?: Record<string, any> | null;
}

const AuthGuard = ({
  children,
  user: serverUser,
  userRole = "student",
  userCollegeId,
  prefetchedInterviews,
  prefetchedFeedback
}: AuthGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: clientUser, loading, authInitialized, firebaseReady } = useFirebaseAuth();

  const user = clientUser || serverUser;

  useEffect(() => {
    if (!authInitialized || !firebaseReady) return;

    if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
      router.push("/");
      return;
    }

    if (!user && pathname !== "/sign-in" && pathname !== "/sign-up") {
      router.push("/sign-in");
      return;
    }
  }, [user, pathname, authInitialized, firebaseReady, router]);

  if (loading || !authInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  const isInterviewPage = pathname.startsWith("/interview/") && pathname !== "/interview";

  if (isInterviewPage) {
    return (
      <UserProvider
        serverUser={serverUser}
        userRole={userRole}
        userCollegeId={userCollegeId}
        prefetchedInterviews={prefetchedInterviews}
        prefetchedFeedback={prefetchedFeedback}
      >
        {children}
      </UserProvider>
    );
  }

  return (
    <UserProvider
      serverUser={serverUser}
      userRole={userRole}
      userCollegeId={userCollegeId}
      prefetchedInterviews={prefetchedInterviews}
      prefetchedFeedback={prefetchedFeedback}
    >
      <NavbarHoverProvider>
        <AuthGuardInner userRole={userRole}>
          {children}
        </AuthGuardInner>
      </NavbarHoverProvider>
    </UserProvider>
  );
};

function AuthGuardInner({
  children,
  userRole
}: {
  children: React.ReactNode;
  userRole: UserRole;
}) {
  const { setHoveringButton } = useNavbarHover();

  return (
    <>
      <nav className="flex items-center justify-between mx-auto max-w-7xl py-4 px-4">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/cclogo.png"
                    alt="Campus Credentials Logo"
                    width={180}
                    height={32}
                    className="object-contain"
                  />
                </Link>

        <div className="flex items-center gap-4">
          {(userRole === "admin" || userRole === "tpo") && (
            <Link href="/generate">
              <button
                className="px-6 py-2.5 bg-gradient-to-r from-[#b8b3f5] to-[#d4d0fc] hover:from-[#cac5fe] hover:to-[#e0dcff] text-dark-100 font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                onMouseEnter={() => setHoveringButton('generate')}
                onMouseLeave={() => setHoveringButton(null)}
              >
                Generate Interview
              </button>
            </Link>
          )}

          {userRole === "tpo" && (
            <Link href="/reports">
              <button
                className="px-6 py-2.5 bg-[#27282f]/80 border border-white/10 hover:border-[#cac5fe]/50 text-light-100 hover:text-white font-semibold rounded-xl transition-all duration-200 hover:bg-[#27282f]"
                onMouseEnter={() => setHoveringButton('reports')}
                onMouseLeave={() => setHoveringButton(null)}
              >
                Reports
              </button>
            </Link>
          )}

          <LogoutButton
            onMouseEnter={() => setHoveringButton('logout')}
            onMouseLeave={() => setHoveringButton(null)}
          />
        </div>
      </nav>

      <div className="root-layout">
        {children}
      </div>
    </>
  );
}

export default AuthGuard;
