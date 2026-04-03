"use client";

import { signOut } from "firebase/auth";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

const LogoutButton = ({ onMouseEnter, onMouseLeave }: { onMouseEnter?: () => void; onMouseLeave?: () => void }) => {
  const { auth } = useFirebaseAuth();

  const handleLogout = async () => {
    try {
      // Clear server-side session
      await fetch("/api/auth/signout", { method: "POST" });
      // Clear client-side Firebase auth and redirect
      if (auth) {
        await signOut(auth);
      }
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = "/sign-in";
    }
  };

  return (
    <button
      onClick={handleLogout}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="px-6 py-2.5 bg-[#27282f]/80 border border-white/10 hover:border-destructive-100 text-light-100 hover:text-white font-semibold rounded-xl transition-all duration-200 hover:bg-destructive-100"
    >
      Logout
    </button>
  );
};

export default LogoutButton; 