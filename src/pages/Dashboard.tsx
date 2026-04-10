import { TrendingUp, MessageCircle, Users, Target, Award, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const milestones = [
  { label: "First Question", key: "questions", threshold: 1 },
  { label: "Join 3 Sessions", key: "sessions", threshold: 3 },
  { label: "Complete 5 Tasks", key: "tasks", threshold: 5 },
  { label: "10 Day Streak", key: "streak", threshold: 10 },
];

export default function Dashboard() {
  const { user, anonymousName } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const stats = [
    { label: "Questions Asked", value: profile?.questions_asked ?? 0, icon: MessageCircle, color: "text-lavender" },
    { label: "Sessions Joined", value: profile?.sessions_joined ?? 0, icon: Users, color: "text-sky" },
    { label: "Tasks Completed", value: profile?.tasks_completed ?? 0, icon: Target, color: "text-mint" },
    { label: "Day Streak", value: profile?.day_streak ?? 0, icon: Calendar, color: "text-peach" },
  ];

  const confidence = profile?.confidence_score ?? 0;

  const getMilestoneAchieved = (key: string, threshold: number) => {
    if (!profile) return false;
    if (key === "questions") return profile.questions_asked >= threshold;
    if (key === "sessions") return profile.sessions_joined >= threshold;
    if (key === "tasks") return profile.tasks_completed >= threshold;
    if (key === "streak") return profile.day_streak >= threshold;
    return false;
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-foreground">Your Progress</h1>
        <p className="mt-2 text-muted-foreground">Welcome back, <span className="font-medium text-foreground">{anonymousName}</span>. Every step forward counts. 💜</p>

        <div className="mt-8 rounded-xl gradient-card border border-border p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-lavender" />
            <h2 className="font-display text-lg font-semibold text-foreground">Confidence Progress</h2>
          </div>
          <Progress value={confidence} className="h-3" />
          <p className="mt-2 text-sm text-muted-foreground">{confidence}% — {confidence > 50 ? "You're doing amazing!" : "Every small step counts!"} Keep going at your own pace.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-card text-center">
              <stat.icon className={`h-6 w-6 mx-auto ${stat.color}`} />
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-peach" /> Milestones
          </h2>
          <div className="space-y-3">
            {milestones.map((m) => {
              const achieved = getMilestoneAchieved(m.key, m.threshold);
              return (
                <div key={m.label} className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${achieved ? "border-mint bg-mint-light" : "border-border bg-card"}`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-sm ${achieved ? "bg-mint text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {achieved ? "✓" : "○"}
                  </div>
                  <span className={`text-sm ${achieved ? "text-foreground font-medium" : "text-muted-foreground"}`}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
