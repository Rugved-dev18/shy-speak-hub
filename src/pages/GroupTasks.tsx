import { useState } from "react";
import { Timer, Users, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SAMPLE_TASKS } from "@/lib/store";

export default function GroupTasks() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: completedTasks = [], refetch } = useQuery({
    queryKey: ["task-responses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("task_responses").select("task_id").eq("user_id", user.id);
      return (data || []).map((r) => r.task_id);
    },
    enabled: !!user,
  });

  const submitResponse = async (taskId: string) => {
    if (!response.trim() || !user) return;
    const { error } = await supabase.from("task_responses").insert({
      user_id: user.id,
      task_id: taskId,
      response_text: response.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setResponse("");
    setActiveTaskId(null);
    refetch();
    toast({ title: "Great job! 🎉", description: "You completed the challenge. Every step counts!" });
  };

  return (
    <div className="container mx-auto max-w-3xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-medium text-foreground" style={{ fontVariationSettings: '"opsz" 96' }}>
          Group <span className="font-italic-display text-coral">Tasks</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Gentle challenges to practice communication. No pressure, just growth.</p>

        <div className="mt-8 space-y-4 animate-stagger">
          {SAMPLE_TASKS.map((task, idx) => {
            const isCompleted = completedTasks.includes(task.id);
            const progress = isCompleted ? 100 : task.isActive ? Math.min(20 + idx * 15, 70) : 0;
            return (
              <div
                key={task.id}
                className={`relative rounded-2xl border p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-hover overflow-hidden ${
                  isCompleted ? "border-mint bg-mint-light/40" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {task.isActive ? (
                        <Badge className="bg-coral text-primary-foreground border-0 font-medium">
                          <Sparkles className="mr-1 h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Upcoming</Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-mint text-foreground border-0 font-medium">
                          <CheckCircle className="mr-1 h-3 w-3" /> Completed
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground">{task.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{task.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {task.timeLimit} min</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {task.participants.length} joined</span>
                    </div>
                  </div>
                  {!isCompleted && task.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[1.5px] border-violet text-violet hover:bg-violet hover:text-primary-foreground transition-colors"
                      onClick={() => setActiveTaskId(activeTaskId === task.id ? null : task.id)}
                    >
                      {activeTaskId === task.id ? "Close" : "Participate"}
                    </Button>
                  )}
                </div>
                {activeTaskId === task.id && (
                  <div className="mt-4 rounded-xl bg-violet/5 border border-violet/10 p-4 animate-scale-in">
                    <p className="text-sm text-muted-foreground mb-3 italic">Prompt: "{task.prompt}"</p>
                    <Textarea placeholder="Your response..." value={response} onChange={(e) => setResponse(e.target.value)} className="min-h-[80px] resize-none rounded-xl" />
                    <div className="mt-3 flex justify-end">
                      <Button onClick={() => submitResponse(task.id)} disabled={!response.trim()} size="sm" className="btn-shimmer bg-violet hover:bg-violet-deep text-primary-foreground border-0">Submit Response</Button>
                    </div>
                  </div>
                )}
                {/* Progress bar */}
                {(task.isActive || isCompleted) && (
                  <div className="absolute left-0 right-0 bottom-0 h-1 bg-muted">
                    <div
                      className={`h-full transition-all duration-700 ${isCompleted ? "bg-mint" : "bg-coral"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
