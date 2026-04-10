import { useState } from "react";
import { Timer, Users, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SAMPLE_TASKS, generateAnonymousName } from "@/lib/store";

export default function GroupTasks() {
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const anonymousName = useState(() => generateAnonymousName())[0];
  const { toast } = useToast();

  const submitResponse = (taskId: string) => {
    if (!response.trim()) return;
    setCompleted((prev) => [...prev, taskId]);
    setResponse("");
    setActiveTaskId(null);
    toast({ title: "Great job! 🎉", description: "You completed the challenge. Every step counts!" });
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-foreground">Group Tasks</h1>
        <p className="mt-2 text-muted-foreground">Gentle challenges to practice communication. No pressure, just growth.</p>

        <div className="mt-8 space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className={`rounded-xl border p-6 shadow-card transition-all ${completed.includes(task.id) ? "border-mint bg-mint-light" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {task.isActive ? (
                      <Badge className="bg-peach text-primary-foreground border-0"><Sparkles className="mr-1 h-3 w-3" /> Active</Badge>
                    ) : (
                      <Badge variant="outline">Upcoming</Badge>
                    )}
                    {completed.includes(task.id) && (
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
                {!completed.includes(task.id) && task.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTaskId(activeTaskId === task.id ? null : task.id)}
                  >
                    {activeTaskId === task.id ? "Close" : "Participate"}
                  </Button>
                )}
              </div>

              {activeTaskId === task.id && (
                <div className="mt-4 rounded-lg bg-muted p-4 animate-scale-in">
                  <p className="text-sm text-muted-foreground mb-3 italic">Prompt: "{task.prompt}"</p>
                  <Textarea
                    placeholder="Your response..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button onClick={() => submitResponse(task.id)} disabled={!response.trim()} size="sm" className="gradient-primary border-0 text-primary-foreground">
                      Submit Response
                    </Button>
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
