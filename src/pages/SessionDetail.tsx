import { useState } from "react";
import { useParams } from "react-router-dom";
import { Pin, CheckCircle, ThumbsUp, Send, Radio, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SAMPLE_SESSIONS, generateAnonymousName, type Question } from "@/lib/store";

export default function SessionDetail() {
  const { id } = useParams();
  const session = SAMPLE_SESSIONS.find((s) => s.id === id);
  const [questions, setQuestions] = useState<Question[]>(session?.questions || []);
  const [newQ, setNewQ] = useState("");
  const [isMentor, setIsMentor] = useState(false);
  const anonymousName = useState(() => generateAnonymousName())[0];
  const { toast } = useToast();

  if (!session) return <div className="container mx-auto px-4 py-10 text-center text-muted-foreground">Session not found</div>;

  const submitQuestion = () => {
    if (!newQ.trim()) return;
    const q: Question = {
      id: crypto.randomUUID(),
      text: newQ.trim(),
      author: anonymousName,
      tag: "General",
      timestamp: new Date(),
      upvotes: 0,
      isPinned: false,
      isAnswered: false,
    };
    setQuestions((prev) => [q, ...prev]);
    setNewQ("");
    toast({ title: "Question sent! 💬", description: "It's now visible to the mentor." });
  };

  const togglePin = (qId: string) => setQuestions((prev) => prev.map((q) => q.id === qId ? { ...q, isPinned: !q.isPinned } : q));
  const toggleAnswered = (qId: string) => setQuestions((prev) => prev.map((q) => q.id === qId ? { ...q, isAnswered: !q.isAnswered } : q));
  const upvote = (qId: string) => setQuestions((prev) => prev.map((q) => q.id === qId ? { ...q, upvotes: q.upvotes + 1 } : q));

  const sorted = [...questions].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.upvotes - a.upvotes;
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          {session.isLive && (
            <Badge className="bg-mint text-primary-foreground border-0 animate-pulse-soft">
              <Radio className="mr-1 h-3 w-3" /> Live
            </Badge>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">{session.title}</h1>
        <p className="text-muted-foreground">Hosted by {session.mentor}</p>

        <div className="mt-4 flex items-center gap-3">
          <Button variant={isMentor ? "default" : "outline"} size="sm" onClick={() => setIsMentor(!isMentor)}>
            {isMentor ? "Mentor View" : "Switch to Mentor View"}
          </Button>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" /> Posting as {anonymousName}
          </span>
        </div>

        {/* Question input */}
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

        {/* Questions feed */}
        <div className="mt-8 space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">{isMentor ? "Mentor Dashboard" : "Questions"} ({sorted.length})</h2>
          {sorted.map((q) => (
            <div
              key={q.id}
              className={`rounded-lg border p-4 shadow-card transition-all animate-scale-in ${
                q.isPinned ? "border-lavender bg-lavender-light" : q.isAnswered ? "border-mint bg-mint-light" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-foreground">{q.text}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{q.author}</span>
                    <Badge variant="outline" className="text-xs">{q.tag}</Badge>
                    {q.isAnswered && <Badge className="bg-mint text-primary-foreground border-0 text-xs">Answered</Badge>}
                    {q.isPinned && <Badge className="bg-lavender text-primary-foreground border-0 text-xs">Pinned</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => upvote(q.id)} className="text-muted-foreground hover:text-foreground">
                    <ThumbsUp className="h-4 w-4 mr-1" /> {q.upvotes}
                  </Button>
                  {isMentor && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => togglePin(q.id)} className={q.isPinned ? "text-lavender" : "text-muted-foreground"}>
                        <Pin className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleAnswered(q.id)} className={q.isAnswered ? "text-mint" : "text-muted-foreground"}>
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
