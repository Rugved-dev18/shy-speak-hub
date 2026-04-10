import { TrendingUp, MessageCircle, Users, Target, Award, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { generateAnonymousName } from "@/lib/store";
import { useState } from "react";

const stats = [
  { label: "Questions Asked", value: 7, icon: MessageCircle, color: "text-lavender" },
  { label: "Sessions Joined", value: 3, icon: Users, color: "text-sky" },
  { label: "Tasks Completed", value: 5, icon: Target, color: "text-mint" },
  { label: "Day Streak", value: 4, icon: Calendar, color: "text-peach" },
];

const milestones = [
  { label: "First Question", achieved: true },
  { label: "Join 3 Sessions", achieved: true },
  { label: "Complete 5 Tasks", achieved: true },
  { label: "Start a Discussion", achieved: false },
  { label: "10 Day Streak", achieved: false },
];

export default function Dashboard() {
  const anonymousName = useState(() => generateAnonymousName())[0];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-foreground">Your Progress</h1>
        <p className="mt-2 text-muted-foreground">Welcome back, <span className="font-medium text-foreground">{anonymousName}</span>. Every step forward counts. 💜</p>

        {/* Confidence meter */}
        <div className="mt-8 rounded-xl gradient-card border border-border p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-lavender" />
            <h2 className="font-display text-lg font-semibold text-foreground">Confidence Progress</h2>
          </div>
          <Progress value={62} className="h-3" />
          <p className="mt-2 text-sm text-muted-foreground">62% — You're doing amazing! Keep going at your own pace.</p>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-card text-center">
              <stat.icon className={`h-6 w-6 mx-auto ${stat.color}`} />
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-peach" /> Milestones
          </h2>
          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m.label} className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${m.achieved ? "border-mint bg-mint-light" : "border-border bg-card"}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-sm ${m.achieved ? "bg-mint text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {m.achieved ? "✓" : "○"}
                </div>
                <span className={`text-sm ${m.achieved ? "text-foreground font-medium" : "text-muted-foreground"}`}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
