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
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-foreground">Group Tasks</h1>
        <p className="mt-2 text-muted-foreground">Gentle challenges to practice communication. No pressure, just growth.</p>

        <div className="mt-8 space-y-4">
          {SAMPLE_TASKS.map((task) => (
            <div key={task.id} className={`rounded-xl border p-6 shadow-card transition-all ${completedTasks.includes(task.id) ? "border-mint bg-mint-light" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {task.isActive ? (
                      <Badge className="bg-peach text-primary-foreground border-0"><Sparkles className="mr-1 h-3 w-3" /> Active</Badge>
                    ) : (
                      <Badge variant="outline">Upcoming</Badge>
                    )}
                    {completedTasks.includes(task.id) && (
                      <Badge className="bg-mint text-primary-foreground border-0"><CheckCircle className="mr-1 h-3 w-3" /> Completed</Badge>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{task.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {task.timeLimit} min</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {task.participants.length} joined</span>
                  </div>
                </div>
                {!completedTasks.includes(task.id) && task.isActive && (
                  <Button variant="outline" size="sm" onClick={() => setActiveTaskId(activeTaskId === task.id ? null : task.id)}>
                    {activeTaskId === task.id ? "Close" : "Participate"}
                  </Button>
                )}
              </div>
              {activeTaskId === task.id && (
                <div className="mt-4 rounded-lg bg-muted p-4 animate-scale-in">
                  <p className="text-sm text-muted-foreground mb-3 italic">Prompt: "{task.prompt}"</p>
                  <Textarea placeholder="Your response..." value={response} onChange={(e) => setResponse(e.target.value)} className="min-h-[80px] resize-none" />
                  <div className="mt-3 flex justify-end">
                    <Button onClick={() => submitResponse(task.id)} disabled={!response.trim()} size="sm" className="gradient-primary border-0 text-primary-foreground">Submit Response</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
