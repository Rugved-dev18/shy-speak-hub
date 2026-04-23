import { useState } from "react";
import { Timer, Users, CheckCircle, Sparkles, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useUserRoles } from "@/hooks/useUserRoles";
import { SAMPLE_TASKS } from "@/lib/store";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  timeLimit: number;
  isActive: boolean;
  participants: string[];
  creatorId?: string | null;
  isCustom?: boolean;
}

export default function GroupTasks() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    prompt: "",
    timeLimit: 5,
    isActive: true,
  });
  const { user } = useAuth();
  const { isMentor } = useUserRoles();
  const { toast } = useToast();

  const { data: completedTasks = [], refetch: refetchCompleted } = useQuery({
    queryKey: ["task-responses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("task_responses").select("task_id").eq("user_id", user.id);
      return (data || []).map((r) => r.task_id);
    },
    enabled: !!user,
  });

  const { data: dbTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const tasks: TaskItem[] = [
    ...dbTasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      prompt: t.prompt,
      timeLimit: t.time_limit,
      isActive: t.is_active,
      participants: [],
      creatorId: t.creator_id,
      isCustom: true,
    })),
    ...SAMPLE_TASKS.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      prompt: t.prompt,
      timeLimit: t.timeLimit,
      isActive: t.isActive,
      participants: t.participants,
      isCustom: false,
    })),
  ];

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
    refetchCompleted();
    toast({ title: "Great job! 🎉", description: "You completed the challenge. Every step counts!" });
  };

  const createTask = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.description.trim() || !form.prompt.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("tasks").insert({
      creator_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      prompt: form.prompt.trim(),
      time_limit: form.timeLimit,
      is_active: form.isActive,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't create task", description: error.message, variant: "destructive" });
      return;
    }
    setForm({ title: "", description: "", prompt: "", timeLimit: 5, isActive: true });
    setCreateOpen(false);
    refetchTasks();
    toast({ title: "Task created ✨", description: "Your challenge is now live for the community." });
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
      return;
    }
    refetchTasks();
    toast({ title: "Task removed" });
  };

  return (
    <div className="container mx-auto max-w-3xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-medium text-foreground" style={{ fontVariationSettings: '"opsz" 96' }}>
              Group <span className="font-italic-display text-coral">Tasks</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Gentle challenges to practice communication. No pressure, just growth.</p>
          </div>
          {isMentor && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="btn-shimmer bg-violet hover:bg-violet-deep text-primary-foreground border-0">
                  <Plus className="mr-1 h-4 w-4" /> New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create a new group task</DialogTitle>
                  <DialogDescription>
                    Design a gentle, supportive challenge for the community to practice with.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Share a small win"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What is this challenge about?"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="min-h-[70px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="A starter sentence for participants..."
                      value={form.prompt}
                      onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                      className="min-h-[70px] resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="timeLimit">Time limit (min)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        min={1}
                        max={60}
                        value={form.timeLimit}
                        onChange={(e) => setForm({ ...form, timeLimit: Math.max(1, parseInt(e.target.value) || 1) })}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        id="isActive"
                        checked={form.isActive}
                        onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={createTask} disabled={submitting} className="bg-violet hover:bg-violet-deep text-primary-foreground border-0">
                    {submitting ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="mt-8 space-y-4 animate-stagger">
          {tasks.map((task, idx) => {
            const isCompleted = completedTasks.includes(task.id);
            const progress = isCompleted ? 100 : task.isActive ? Math.min(20 + idx * 15, 70) : 0;
            const canDelete = task.isCustom && (task.creatorId === user?.id);
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
                      {task.isCustom && (
                        <Badge variant="outline" className="border-violet/30 text-violet">Mentor</Badge>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground">{task.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{task.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {task.timeLimit} min</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {task.participants.length} joined</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
