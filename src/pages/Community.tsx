import { useState, useEffect } from "react";
import { MessageSquare, Users, Heart, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CATEGORIES = ["Social Anxiety", "Self-Growth", "Relationships", "Career", "Communication", "General"];

export default function Community() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, anonymousName } = useAuth();
  const { toast } = useToast();

  const { data: discussions = [], refetch: refetchDiscussions } = useQuery({
    queryKey: ["discussions"],
    queryFn: async () => {
      const { data } = await supabase.from("discussions").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["discussion-messages", activeId],
    queryFn: async () => {
      if (!activeId) return [];
      const { data } = await supabase
        .from("discussion_messages")
        .select("*")
        .eq("discussion_id", activeId)
        .is("parent_id", null)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!activeId,
  });

  // Realtime for messages
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`discussion-${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "discussion_messages", filter: `discussion_id=eq.${activeId}` }, () => {
        refetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId, refetchMessages]);

  const createDiscussion = async () => {
    if (!newTopic.trim()) return;
    await supabase.from("discussions").insert({ topic: newTopic.trim(), category: newCategory, creator_id: user?.id });
    setNewTopic("");
    setDialogOpen(false);
    refetchDiscussions();
    toast({ title: "Discussion created! 🌱" });
  };

  const addReply = async () => {
    if (!replyText.trim() || !activeId) return;
    await supabase.from("discussion_messages").insert({
      discussion_id: activeId,
      text: replyText.trim(),
      author_name: anonymousName,
      user_id: user?.id,
    });
    setReplyText("");
    toast({ title: "Reply posted! 💜" });
  };

  const support = async (msgId: string, current: number) => {
    await supabase.from("discussion_messages").update({ support_count: current + 1 }).eq("id", msgId);
    refetchMessages();
  };

  const active = discussions.find((d) => d.id === activeId);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Community Talks</h1>
            <p className="mt-2 text-muted-foreground">Topic-based discussions. Support each other, no pressure.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> New Topic</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Start a Discussion</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} />
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={createDiscussion} disabled={!newTopic.trim()} className="w-full gradient-primary border-0 text-primary-foreground">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!active ? (
          <div className="mt-8 space-y-4">
            {discussions.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveId(d.id)}
                className="w-full text-left rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-hover hover:-translate-y-0.5"
              >
                <Badge variant="outline" className="mb-2 text-xs">{d.category}</Badge>
                <h3 className="font-display text-lg font-semibold text-foreground">{d.topic}</h3>
                <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {d.participant_count}</span>
                </div>
              </button>
            ))}
            {discussions.length === 0 && <p className="text-center py-12 text-muted-foreground">No discussions yet. Start the first one! 🌱</p>}
          </div>
        ) : (
          <div className="mt-8">
            <Button variant="ghost" size="sm" onClick={() => setActiveId(null)} className="mb-4">← Back to topics</Button>
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <Badge variant="outline" className="mb-2">{active.category}</Badge>
              <h2 className="font-display text-xl font-semibold text-foreground">{active.topic}</h2>
              <div className="mt-6 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="rounded-lg bg-muted p-4 animate-scale-in">
                    <p className="text-foreground">{msg.text}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{msg.author_name}</span>
                      <Button variant="ghost" size="sm" onClick={() => support(msg.id, msg.support_count)} className="text-muted-foreground hover:text-rose">
                        <Heart className={`h-4 w-4 mr-1 ${msg.support_count > 0 ? "fill-rose text-rose" : ""}`} /> {msg.support_count}
                      </Button>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="text-center py-6 text-muted-foreground">Be the first to share your thoughts 🌱</p>}
              </div>
              <div className="mt-6 flex gap-2">
                <Textarea placeholder="Share your thoughts supportively..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="min-h-[60px] resize-none" />
                <Button onClick={addReply} disabled={!replyText.trim()} className="gradient-primary border-0 text-primary-foreground shrink-0 self-end">
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
