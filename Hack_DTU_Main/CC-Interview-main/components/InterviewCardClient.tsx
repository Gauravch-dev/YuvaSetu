"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { Code2, Users, Layers, Calendar, Star, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface InterviewCardClientProps {
  interviewId: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt: string;
  feedback?: any; // Passed from parent (batch fetched)
}

const InterviewCardClient = ({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
  feedback,
}: InterviewCardClientProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

  // Get icon and color based on interview type
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "Technical":
        return {
          icon: Code2,
          bgColor: "bg-blue-500/10",
          textColor: "text-blue-400",
          borderColor: "from-blue-500 to-cyan-500",
        };
      case "Behavioral":
        return {
          icon: Users,
          bgColor: "bg-purple-500/10",
          textColor: "text-purple-400",
          borderColor: "from-purple-500 to-pink-500",
        };
      case "Mixed":
        return {
          icon: Layers,
          bgColor: "bg-green-500/10",
          textColor: "text-green-400",
          borderColor: "from-green-500 to-emerald-500",
        };
      default:
        return {
          icon: Layers,
          bgColor: "bg-gray-500/10",
          textColor: "text-gray-400",
          borderColor: "from-gray-500 to-slate-500",
        };
    }
  };

  const typeConfig = getTypeConfig(normalizedType);
  const TypeIcon = typeConfig.icon;

  const handleButtonClick = () => {
    setIsLoading(true);
    const targetUrl = feedback
      ? `/interview/${interviewId}/feedback`
      : `/interview/${interviewId}`;
    router.push(targetUrl);
  };

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || "2024-01-01"
  ).format("MMM D, YYYY");

  return (
    <div className="w-full h-[280px]">
      <div className={cn(
        "relative rounded-xl overflow-hidden h-full",
        "bg-gradient-to-b from-[#27282f]/90 to-[#1A1C20]/90",
        "border border-white/10",
        "shadow-lg"
      )}>
        {/* Top Border Gradient */}
        <div className={cn("h-1 w-full bg-gradient-to-r", typeConfig.borderColor)} />
        
        <div className="p-6 flex flex-col gap-4 h-[calc(100%-4px)]">
          {/* Header with Type Icon */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white capitalize mb-2">
                {role} Interview
              </h3>
              <p className="text-sm text-light-100">
                <span className={cn("inline-flex items-center gap-1", typeConfig.textColor)}>
                  <TypeIcon className="w-4 h-4" />
                  {normalizedType}
                </span>
              </p>
            </div>
          </div>

          {/* Date & Score */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-light-100" />
              <span className="text-sm text-light-100">{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <Star className="size-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-light-100">
                {feedback?.totalScore === "Cannot be determined" 
                  ? "Not scored"
                  : feedback?.totalScore 
                    ? `${feedback.totalScore}/100`
                    : "Not taken"
                }
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <button
              onClick={handleButtonClick}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#b8b3f5] to-[#d4d0fc] hover:from-[#cac5fe] hover:to-[#e0dcff] text-dark-100 font-bold rounded-xl h-11 transition-all duration-200 shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                feedback ? "View Feedback" : "Start Interview"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCardClient;

