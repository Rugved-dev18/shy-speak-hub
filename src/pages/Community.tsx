import { useState } from "react";
import { MessageSquare, Users, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SAMPLE_DISCUSSIONS, generateAnonymousName, type DiscussionMessage } from "@/lib/store";

export default function Community() {
  const [discussions, setDiscussions] = useState(SAMPLE_DISCUSSIONS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const anonymousName = useState(() => generateAnonymousName())[0];
  const { toast } = useToast();

  const active = discussions.find((d) => d.id === activeId);

  const addReply = (discussionId: string) => {
    if (!replyText.trim()) return;
    const msg: DiscussionMessage = {
      id: crypto.randomUUID(),
      author: anonymousName,
      text: replyText.trim(),
      timestamp: new Date(),
      supportCount: 0,
      replies: [],
    };
    setDiscussions((prev) =>
      prev.map((d) => d.id === discussionId ? { ...d, messages: [...d.messages, msg] } : d)
    );
    setReplyText("");
    toast({ title: "Reply posted! 💜" });
  };

  const support = (discussionId: string, msgId: string) => {
    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === discussionId
          ? { ...d, messages: d.messages.map((m) => m.id === msgId ? { ...m, supportCount: m.supportCount + 1 } : m) }
          : d
      )
    );
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-foreground">Community Talks</h1>
        <p className="mt-2 text-muted-foreground">Topic-based discussions. Support each other, no pressure.</p>

        {!active ? (
          <div className="mt-8 space-y-4">
            {discussions.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveId(d.id)}
                className="w-full text-left rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-hover hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 text-xs">{d.category}</Badge>
                    <h3 className="font-display text-lg font-semibold text-foreground">{d.topic}</h3>
                    <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {d.participantCount}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {d.messages.length} messages</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <Button variant="ghost" size="sm" onClick={() => setActiveId(null)} className="mb-4">← Back to topics</Button>
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <Badge variant="outline" className="mb-2">{active.category}</Badge>
              <h2 className="font-display text-xl font-semibold text-foreground">{active.topic}</h2>

              <div className="mt-6 space-y-4">
                {active.messages.map((msg) => (
                  <div key={msg.id} className="rounded-lg bg-muted p-4 animate-scale-in">
                    <p className="text-foreground">{msg.text}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{msg.author}</span>
                      <Button variant="ghost" size="sm" onClick={() => support(active.id, msg.id)} className="text-muted-foreground hover:text-rose">
                        <Heart className={`h-4 w-4 mr-1 ${msg.supportCount > 0 ? "fill-rose text-rose" : ""}`} /> {msg.supportCount}
                      </Button>
                    </div>
                    {msg.replies.length > 0 && (
                      <div className="mt-3 ml-4 space-y-2 border-l-2 border-lavender-light pl-4">
                        {msg.replies.map((r) => (
                          <div key={r.id} className="rounded-lg bg-card p-3">
                            <p className="text-sm text-foreground">{r.text}</p>
                            <span className="text-xs text-muted-foreground">{r.author}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {active.messages.length === 0 && (
                  <p className="text-center py-6 text-muted-foreground">Be the first to share your thoughts 🌱</p>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <Textarea
                  placeholder="Share your thoughts supportively..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <Button onClick={() => addReply(active.id)} disabled={!replyText.trim()} className="gradient-primary border-0 text-primary-foreground shrink-0 self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
