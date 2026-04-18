import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Pin, CheckCircle, ThumbsUp, Send, Radio, Shield, Video, VideoOff, StopCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { isPast } from "date-fns";

type PresenceUser = { user_id: string; anonymous_name: string };

export default function SessionDetail() {
  const { id } = useParams();
  const [newQ, setNewQ] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [present, setPresent] = useState<PresenceUser[]>([]);
  const { user, anonymousName } = useAuth();
  const { isMentor } = useUserRoles();
  const { toast } = useToast();

  const { data: session, refetch: refetchSession } = useQuery({
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

  // Realtime questions
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`session-q-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "questions", filter: `session_id=eq.${id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, refetch]);

  // Realtime presence
  useEffect(() => {
    if (!id || !user) return;
    const channel = supabase.channel(`session-presence-${id}`, {
      config: { presence: { key: user.id } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const flat = Object.values(state).flat() as PresenceUser[];
        // dedupe by user_id
        const seen = new Set<string>();
        setPresent(flat.filter((p) => { if (seen.has(p.user_id)) return false; seen.add(p.user_id); return true; }));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, anonymous_name: anonymousName });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [id, user, anonymousName]);

  const isCreator = !!user && !!session && session.creator_id === user.id;
  const status: "live" | "upcoming" | "ended" = useMemo(() => {
    if (!session) return "upcoming";
    if (session.ended_at) return "ended";
    if (session.scheduled_at && !isPast(new Date(session.scheduled_at))) return "upcoming";
    return "live";
  }, [session]);

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
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewQ("");
    toast({ title: "Question sent! 💬" });
  };

  const togglePin = async (qId: string, current: boolean) => { await supabase.from("questions").update({ is_pinned: !current }).eq("id", qId); refetch(); };
  const toggleAnswered = async (qId: string, current: boolean) => { await supabase.from("questions").update({ is_answered: !current }).eq("id", qId); refetch(); };
  const upvote = async (qId: string, current: number) => { await supabase.from("questions").update({ upvotes: current + 1 }).eq("id", qId); refetch(); };

  const endSession = async () => {
    if (!isCreator) return;
    const { error } = await supabase.from("sessions").update({ ended_at: new Date().toISOString(), is_live: false }).eq("id", id!);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setShowVideo(false);
    refetchSession();
    toast({ title: "Session ended" });
  };

  const sorted = [...questions].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return b.upvotes - a.upvotes;
  });

  const initials = (n: string) => n.replace(/\d+/g, "").match(/[A-Z][a-z]*/g)?.slice(0, 2).map(s => s[0]).join("") || "?";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {status === "live" && (
            <div className="pulse-ring inline-flex">
              <Badge className="bg-mint text-foreground border-0"><Radio className="mr-1 h-3 w-3" /> Live</Badge>
            </div>
          )}
          {status === "upcoming" && <Badge className="bg-coral text-primary-foreground border-0">Upcoming</Badge>}
          {status === "ended" && <Badge variant="outline">Ended</Badge>}
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">{session.title}</h1>
        <p className="text-muted-foreground">Hosted by {session.mentor_name}</p>
        {session.description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{session.description}</p>}

        {/* Presence */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {present.length} in room
          </div>
          <div className="flex -space-x-2">
            {present.slice(0, 8).map((p) => (
              <Avatar key={p.user_id} className="h-7 w-7 border-2 border-background" title={p.anonymous_name}>
                <AvatarFallback className="bg-violet text-primary-foreground text-[10px] font-semibold">
                  {initials(p.anonymous_name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {present.length > 8 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-semibold text-foreground">
                +{present.length - 8}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
            <Shield className="h-3 w-3" /> Posting as {anonymousName}
          </span>
        </div>

        {/* Video controls */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {status === "live" ? (
            <Button
              onClick={() => setShowVideo((v) => !v)}
              className="bg-violet hover:bg-violet-deep text-primary-foreground"
            >
              {showVideo ? <><VideoOff className="mr-1 h-4 w-4" /> Leave video</> : <><Video className="mr-1 h-4 w-4" /> Join video</>}
            </Button>
          ) : (
            <Button disabled variant="outline">
              <Video className="mr-1 h-4 w-4" /> Video {status === "upcoming" ? "starts soon" : "ended"}
            </Button>
          )}
          {isCreator && status !== "ended" && (
            <Button variant="outline" onClick={endSession} className="text-coral border-coral hover:bg-coral hover:text-primary-foreground">
              <StopCircle className="mr-1 h-4 w-4" /> End session
            </Button>
          )}
        </div>

        {/* Jitsi video */}
        {showVideo && status === "live" && session.room_name && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-border shadow-soft" style={{ height: 520 }}>
            <JitsiMeeting
              domain="meet.jit.si"
              roomName={session.room_name}
              configOverwrite={{
                startWithAudioMuted: true,
                startWithVideoMuted: !isCreator,
                prejoinPageEnabled: false,
                disableModeratorIndicator: false,
              }}
              interfaceConfigOverwrite={{
                MOBILE_APP_PROMO: false,
                SHOW_JITSI_WATERMARK: false,
              }}
              userInfo={{
                displayName: anonymousName,
                email: "",
              }}
              getIFrameRef={(iframe) => { iframe.style.height = "100%"; iframe.style.width = "100%"; }}
            />
          </div>
        )}

        {/* Q&A */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-soft">
          <Textarea
            placeholder="Ask your question anonymously..."
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            className="min-h-[80px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={submitQuestion} disabled={!newQ.trim()} size="sm" className="bg-violet hover:bg-violet-deep text-primary-foreground border-0">
              <Send className="mr-1 h-4 w-4" /> Send
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Questions ({sorted.length})
          </h2>
          {sorted.map((q) => (
            <div
              key={q.id}
              className={`rounded-lg border p-4 shadow-soft transition-all animate-scale-in ${
                q.is_pinned ? "border-violet/40 bg-violet/5" : q.is_answered ? "border-mint/60 bg-mint/10" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-foreground">{q.text}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{q.author_name}</span>
                    <Badge variant="outline" className="text-xs">{q.tag}</Badge>
                    {q.is_answered && <Badge className="bg-mint text-foreground border-0 text-xs">Answered</Badge>}
                    {q.is_pinned && <Badge className="bg-violet text-primary-foreground border-0 text-xs">Pinned</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => upvote(q.id, q.upvotes)} className="text-muted-foreground hover:text-foreground">
                    <ThumbsUp className="h-4 w-4 mr-1" /> {q.upvotes}
                  </Button>
                  {(isMentor || isCreator) && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => togglePin(q.id, q.is_pinned)} className={q.is_pinned ? "text-violet" : "text-muted-foreground"}>
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
