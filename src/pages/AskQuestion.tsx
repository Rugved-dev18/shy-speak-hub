import { useState } from "react";
import { Send, Tag, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TAGS, generateAnonymousName, type Question } from "@/lib/store";

export default function AskQuestion() {
  const [text, setText] = useState("");
  const [selectedTag, setSelectedTag] = useState("General");
  const [submitted, setSubmitted] = useState<Question[]>([]);
  const { toast } = useToast();
  const anonymousName = useState(() => generateAnonymousName())[0];

  const handleSubmit = () => {
    if (!text.trim()) return;
    const q: Question = {
      id: crypto.randomUUID(),
      text: text.trim(),
      author: anonymousName,
      tag: selectedTag,
      timestamp: new Date(),
      upvotes: 0,
      isPinned: false,
      isAnswered: false,
    };
    setSubmitted((prev) => [q, ...prev]);
    setText("");
    toast({ title: "Question submitted! 🎉", description: "Your anonymous question has been sent safely." });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="animate-fade-up">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-lavender" />
          Posting as <span className="font-medium text-foreground">{anonymousName}</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground">Ask Anonymously</h1>
        <p className="mt-2 text-muted-foreground">Your identity is completely hidden. Ask anything you need help with.</p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card">
          <Textarea
            placeholder="What's on your mind? No one will know it's you..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className={`cursor-pointer transition-all ${selectedTag === tag ? "gradient-primary border-0 text-primary-foreground" : "hover:bg-muted"}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSubmit} disabled={!text.trim()} className="gradient-primary border-0 text-primary-foreground">
              <Send className="mr-2 h-4 w-4" /> Submit Question
            </Button>
          </div>
        </div>

        {submitted.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Your Submitted Questions</h2>
            <div className="space-y-3">
              {submitted.map((q) => (
                <div key={q.id} className="rounded-lg border border-border bg-card p-4 shadow-card animate-scale-in">
                  <p className="text-foreground">{q.text}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{q.tag}</Badge>
                    <span className="text-xs text-muted-foreground">Just now</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
