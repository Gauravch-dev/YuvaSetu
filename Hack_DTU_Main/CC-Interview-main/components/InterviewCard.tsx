import dayjs from "dayjs";
import Link from "next/link";
import { Code2, Users, Layers, Calendar, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

const InterviewCard = async ({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
}: InterviewCardProps) => {
  const feedback =
    userId && interviewId
      ? await getFeedbackByInterviewId({
          interviewId,
          userId,
        })
      : null;

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
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", typeConfig.bgColor)}>
                  <TypeIcon className={cn("size-4", typeConfig.textColor)} />
                </div>
                <span className={cn("text-sm font-medium", typeConfig.textColor)}>
                  {normalizedType}
                </span>
              </div>
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
          <div className="mt-auto pt-4">
            <Link
              href={
                feedback
                  ? `/interview/${interviewId}/feedback`
                  : `/interview/${interviewId}`
              }
            >
              <button className="w-full bg-gradient-to-r from-[#b8b3f5] to-[#d4d0fc] hover:from-[#cac5fe] hover:to-[#e0dcff] text-dark-100 font-bold rounded-xl h-11 transition-colors duration-200 shadow-lg">
                {feedback ? "View Feedback" : "Start Interview"}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;

