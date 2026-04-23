import { useState, useEffect, useRef, useMemo } from "react";
import { Hash, Users, Heart, Send, Plus, Sparkles, ChevronDown, ChevronRight, Lightbulb, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Communication", "Career", "Self-Growth", "Relationships", "Social Anxiety", "General"];

const SHY_TIPS = [
  "Start with a simple question — curiosity opens doors.",
  "It's okay to lurk first. Reading is participating too.",
  "Short replies count. A single ‘same here’ helps someone feel seen.",
  "Use ‘I feel…’ instead of ‘you should…’ — it's gentler.",
  "Take a breath before you send. You've got this. 💜",
];

interface PresenceUser {
  user_id: string;
  name: string;
}

export default function Community() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c, true]))
  );
  const [messageText, setMessageText] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newCategory, setNewCategory] = useState("Communication");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
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

  // Auto-pick first channel
  useEffect(() => {
    if (!activeId && discussions.length > 0) {
      setActiveId(discussions[0].id);
    }
  }, [discussions, activeId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Realtime messages + presence for active channel
  useEffect(() => {
    if (!activeId || !user) return;
    const channel = supabase.channel(`discussion-${activeId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "discussion_messages", filter: `discussion_id=eq.${activeId}` }, () => {
        refetchMessages();
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state).flat().map((p: any) => ({ user_id: p.user_id, name: p.name }));
        // Dedupe by user_id
        const unique = Array.from(new Map(users.map((u) => [u.user_id, u])).values());
        setPresenceUsers(unique);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, name: anonymousName });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, user, anonymousName, refetchMessages]);

  const createDiscussion = async () => {
    if (!newTopic.trim()) return;
    const { data, error } = await supabase
      .from("discussions")
      .insert({ topic: newTopic.trim(), category: newCategory, creator_id: user?.id })
      .select()
      .single();
    if (error) {
      toast({ title: "Couldn't create channel", description: error.message, variant: "destructive" });
      return;
    }
    setNewTopic("");
    setDialogOpen(false);
    await refetchDiscussions();
    if (data?.id) setActiveId(data.id);
    toast({ title: "Channel created 🌱", description: "Say hi — start the conversation!" });
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !activeId) return;
    const text = messageText.trim();
    setMessageText("");
    const { error } = await supabase.from("discussion_messages").insert({
      discussion_id: activeId,
      text,
      author_name: anonymousName,
      user_id: user?.id,
    });
    if (error) {
      toast({ title: "Message not sent", description: error.message, variant: "destructive" });
      setMessageText(text);
    }
  };

  const support = async (msgId: string, current: number) => {
    await supabase.from("discussion_messages").update({ support_count: current + 1 }).eq("id", msgId);
    refetchMessages();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const grouped = useMemo(() => {
    const map: Record<string, typeof discussions> = {};
    CATEGORIES.forEach((c) => (map[c] = []));
    discussions.forEach((d) => {
      if (!map[d.category]) map[d.category] = [];
      map[d.category].push(d);
    });
    return map;
  }, [discussions]);

  const active = discussions.find((d) => d.id === activeId);
  const tip = useMemo(() => SHY_TIPS[Math.floor(Math.random() * SHY_TIPS.length)], [activeId]);

  const toggleCategory = (cat: string) =>
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const initial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-background">
      <div className="grid h-full grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[260px_1fr_280px]">
        {/* ============ LEFT: CHANNELS ============ */}
        <aside className="hidden md:flex flex-col border-r border-border bg-muted/30">
          <div className="px-4 py-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-foreground">Community</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Safe spaces to talk</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {CATEGORIES.map((cat) => {
                const isOpen = openCategories[cat];
                const channels = grouped[cat] || [];
                return (
                  <div key={cat}>
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <span>{cat}</span>
                      <span className="ml-auto text-[10px] opacity-60">{channels.length}</span>
                    </button>
                    {isOpen && (
                      <div className="space-y-0.5 mt-0.5 mb-1">
                        {channels.length === 0 && (
                          <p className="px-6 py-1 text-xs text-muted-foreground italic">No channels yet</p>
                        )}
                        {channels.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => setActiveId(d.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all group",
                              activeId === d.id
                                ? "bg-violet/15 text-violet font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Hash className="h-4 w-4 shrink-0 opacity-70" />
                            <span className="truncate text-left">{d.topic}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full bg-violet hover:bg-violet-deep text-primary-foreground border-0">
                  <Plus className="mr-1 h-4 w-4" /> Add Topic
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Create a new channel</DialogTitle>
                  <DialogDescription>Pick a category and a topic title. Keep it kind and curious.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <Input
                    placeholder="e.g. tips-for-phone-calls"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                  />
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={createDiscussion}
                    disabled={!newTopic.trim()}
                    className="w-full bg-violet hover:bg-violet-deep text-primary-foreground border-0"
                  >
                    Create Channel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </aside>

        {/* ============ MIDDLE: CHAT ============ */}
        <main className="flex flex-col h-full overflow-hidden bg-card">
          {/* Channel header */}
          <header className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="h-5 w-5 text-violet shrink-0" />
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-foreground truncate">
                  {active?.topic || "Pick a channel"}
                </h2>
                {active && (
                  <p className="text-xs text-muted-foreground">{active.category}</p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="border-violet/20 text-violet shrink-0">
              <Users className="h-3 w-3 mr-1" /> {presenceUsers.length} online
            </Badge>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
            {!active ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
                <p>Select a channel from the sidebar to start chatting.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground animate-fade-up">
                <Sparkles className="h-10 w-10 mb-3 text-violet opacity-60" />
                <p className="font-display text-lg text-foreground">Welcome to #{active.topic}</p>
                <p className="text-sm mt-1">This is the beginning of a kind conversation. 🌱</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {messages.map((msg, idx) => {
                  const prev = messages[idx - 1];
                  const sameAuthor = prev && prev.author_name === msg.author_name &&
                    new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;

                  if (sameAuthor) {
                    return (
                      <div key={msg.id} className="group flex items-start gap-3 pl-[52px] -mt-2 hover:bg-muted/40 rounded -mx-2 px-2 py-0.5 transition-colors">
                        <p className="text-sm text-foreground flex-1 leading-relaxed">{msg.text}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => support(msg.id, msg.support_count)}
                          className="opacity-0 group-hover:opacity-100 h-6 px-2 text-xs text-muted-foreground hover:text-rose transition-opacity"
                        >
                          <Heart className={cn("h-3 w-3 mr-1", msg.support_count > 0 && "fill-rose text-rose")} />
                          {msg.support_count > 0 && msg.support_count}
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="group flex items-start gap-3 hover:bg-muted/40 rounded -mx-2 px-2 py-1 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet to-coral flex items-center justify-center text-primary-foreground font-medium text-sm shrink-0">
                        {initial(msg.author_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm text-foreground">{msg.author_name}</span>
                          <span className="text-[11px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed mt-0.5 break-words">{msg.text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => support(msg.id, msg.support_count)}
                        className={cn(
                          "h-7 px-2 text-xs text-muted-foreground hover:text-rose transition-opacity",
                          msg.support_count > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <Heart className={cn("h-3.5 w-3.5 mr-1", msg.support_count > 0 && "fill-rose text-rose")} />
                        {msg.support_count > 0 && msg.support_count}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Input */}
          {active && (
            <div className="px-5 py-3 border-t border-border shrink-0">
              <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet/30 transition-all">
                <Input
                  placeholder={`Start a conversation in #${active.topic}…`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="h-8 w-8 bg-violet hover:bg-violet-deep text-primary-foreground border-0 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                Press Enter to send. Be kind — every voice matters here.
              </p>
            </div>
          )}
        </main>

        {/* ============ RIGHT: PARTICIPANTS + TIPS ============ */}
        <aside className="hidden lg:flex flex-col border-l border-border bg-muted/30">
          <div className="px-4 py-4 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active — {presenceUsers.length}
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {presenceUsers.length === 0 && (
                <p className="text-xs text-muted-foreground italic px-2 py-2">Waiting for others to join…</p>
              )}
              {presenceUsers.map((p) => (
                <div key={p.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet to-coral flex items-center justify-center text-primary-foreground text-xs font-medium">
                      {initial(p.name)}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-mint border-2 border-muted/30" />
                  </div>
                  <span className="text-sm text-foreground truncate">
                    {p.name}{p.user_id === user?.id && " (you)"}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border">
            <div className="rounded-xl bg-gradient-to-br from-violet/10 to-coral/10 border border-violet/15 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-coral" />
                <span className="text-xs font-semibold text-foreground">Shy tip</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
