import { TrendingUp, MessageCircle, Users, Target, Award, Calendar, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const milestones = [
  { label: "First Question", key: "questions", threshold: 1 },
  { label: "Join 3 Sessions", key: "sessions", threshold: 3 },
  { label: "Complete 5 Tasks", key: "tasks", threshold: 5 },
  { label: "10 Day Streak", key: "streak", threshold: 10 },
];

function ProgressRing({
  value,
  max,
  color,
  size = 96,
  stroke = 8,
  children,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
  stroke?: number;
  children: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / Math.max(max, 1), 1);
  const offset = circumference * (1 - pct);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

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
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const stats = [
    { label: "Questions Asked", value: profile?.questions_asked ?? 0, max: 10, icon: MessageCircle, color: "hsl(var(--violet))" },
    { label: "Sessions Joined", value: profile?.sessions_joined ?? 0, max: 5, icon: Users, color: "hsl(var(--teal))" },
    { label: "Tasks Completed", value: profile?.tasks_completed ?? 0, max: 10, icon: Target, color: "hsl(var(--mint))" },
    { label: "Day Streak", value: profile?.day_streak ?? 0, max: 30, icon: Calendar, color: "hsl(var(--coral))" },
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
    <div className="container mx-auto max-w-4xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-medium text-foreground" style={{ fontVariationSettings: '"opsz" 96' }}>
          Your <span className="font-italic-display text-violet">Progress</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{anonymousName}</span>. Every step forward counts. 💜
        </p>

        {/* Confidence ring hero */}
        <div className="mt-8 rounded-2xl bg-card border border-border p-6 shadow-soft flex items-center gap-6 flex-wrap">
          <ProgressRing value={confidence} max={100} color="hsl(var(--violet))" size={120} stroke={10}>
            <div className="text-center">
              <p className="font-display text-3xl font-semibold text-violet-deep leading-none">{confidence}%</p>
            </div>
          </ProgressRing>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5 text-violet" />
              <h2 className="font-display text-xl font-semibold text-foreground">Confidence Progress</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {confidence > 50 ? "You're doing amazing!" : "Every small step counts!"} Keep going at your own pace.
            </p>
          </div>
        </div>

        {/* Stats with rings */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-stagger">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-hover">
              <ProgressRing value={stat.value} max={stat.max} color={stat.color} size={84} stroke={7}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </ProgressRing>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-coral" /> Milestones
          </h2>
          <div className="space-y-3 animate-stagger">
            {milestones.map((m) => {
              const achieved = getMilestoneAchieved(m.key, m.threshold);
              return (
                <div
                  key={m.label}
                  className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                    achieved
                      ? "border-violet/40 bg-violet/5 shadow-violet-glow"
                      : "border-border bg-card shadow-soft"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${achieved ? "bg-violet text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {achieved ? <Check className="h-4 w-4" /> : <span className="text-xs">○</span>}
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
