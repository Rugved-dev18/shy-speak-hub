import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Pin, CheckCircle, ThumbsUp, Send, Radio, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function SessionDetail() {
  const { id } = useParams();
  const [newQ, setNewQ] = useState("");
  const [isMentor, setIsMentor] = useState(false);
  const { user, anonymousName } = useAuth();
  const { toast } = useToast();

  const { data: session } = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const { data } = await supabase.from("sessions").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: questions = [], refetch } = useQuery({
    queryKey: ["session-questions", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("session_id", id!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  // Real-time subscription for new questions
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`session-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "questions", filter: `session_id=eq.${id}` }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, refetch]);

  if (!session) return <div className="container mx-auto px-4 py-10 text-center text-muted-foreground">Loading session...</div>;

  const submitQuestion = async () => {
    if (!newQ.trim() || !user) return;
    const { error } = await supabase.from("questions").insert({
      session_id: id,
      text: newQ.trim(),
      author_name: anonymousName,
      user_id: user.id,
      tag: "General",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewQ("");
    toast({ title: "Question sent! 💬", description: "It's now visible to the mentor in real-time." });
  };

  const togglePin = async (qId: string, current: boolean) => {
    await supabase.from("questions").update({ is_pinned: !current }).eq("id", qId);
    refetch();
  };

  const toggleAnswered = async (qId: string, current: boolean) => {
    await supabase.from("questions").update({ is_answered: !current }).eq("id", qId);
    refetch();
  };

  const upvote = async (qId: string, current: number) => {
    await supabase.from("questions").update({ upvotes: current + 1 }).eq("id", qId);
    refetch();
  };

  const sorted = [...questions].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return b.upvotes - a.upvotes;
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          {session.is_live && (
            <Badge className="bg-mint text-primary-foreground border-0 animate-pulse-soft">
              <Radio className="mr-1 h-3 w-3" /> Live
            </Badge>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">{session.title}</h1>
        <p className="text-muted-foreground">Hosted by {session.mentor_name}</p>

        <div className="mt-4 flex items-center gap-3">
          <Button variant={isMentor ? "default" : "outline"} size="sm" onClick={() => setIsMentor(!isMentor)}>
            {isMentor ? "Mentor View" : "Switch to Mentor View"}
          </Button>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" /> Posting as {anonymousName}
          </span>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-card">
          <Textarea
            placeholder="Ask your question anonymously..."
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            className="min-h-[80px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={submitQuestion} disabled={!newQ.trim()} size="sm" className="gradient-primary border-0 text-primary-foreground">
              <Send className="mr-1 h-4 w-4" /> Send
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {isMentor ? "Mentor Dashboard" : "Questions"} ({sorted.length})
          </h2>
          {sorted.map((q) => (
            <div
              key={q.id}
              className={`rounded-lg border p-4 shadow-card transition-all animate-scale-in ${
                q.is_pinned ? "border-lavender bg-lavender-light" : q.is_answered ? "border-mint bg-mint-light" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-foreground">{q.text}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{q.author_name}</span>
                    <Badge variant="outline" className="text-xs">{q.tag}</Badge>
                    {q.is_answered && <Badge className="bg-mint text-primary-foreground border-0 text-xs">Answered</Badge>}
                    {q.is_pinned && <Badge className="bg-lavender text-primary-foreground border-0 text-xs">Pinned</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => upvote(q.id, q.upvotes)} className="text-muted-foreground hover:text-foreground">
                    <ThumbsUp className="h-4 w-4 mr-1" /> {q.upvotes}
                  </Button>
                  {isMentor && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => togglePin(q.id, q.is_pinned)} className={q.is_pinned ? "text-lavender" : "text-muted-foreground"}>
                        <Pin className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleAnswered(q.id, q.is_answered)} className={q.is_answered ? "text-mint" : "text-muted-foreground"}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No questions yet. Be the first to ask! 🌟</p>
          )}
        </div>
      </div>
    </div>
  );
}
