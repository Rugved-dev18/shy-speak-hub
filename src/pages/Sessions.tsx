import { useState } from "react";
import { Link } from "react-router-dom";
import { Radio, Users, ArrowRight, Clock, Plus, CalendarClock, GraduationCap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, isPast } from "date-fns";

type Session = {
  id: string;
  title: string;
  mentor_name: string;
  description: string | null;
  scheduled_at: string | null;
  ended_at: string | null;
  is_live: boolean;
  participant_count: number;
  creator_id: string | null;
  created_at: string;
};

function getStatus(s: Session): "live" | "upcoming" | "ended" {
  if (s.ended_at) return "ended";
  if (s.scheduled_at && !isPast(new Date(s.scheduled_at))) return "upcoming";
  return "live";
}

export default function Sessions() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, anonymousName } = useAuth();
  const { isMentor } = useUserRoles();
  const { toast } = useToast();

  const { data: sessions = [], refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("sessions").select("*").order("scheduled_at", { ascending: true, nullsFirst: false });
      return (data || []) as Session[];
    },
  });

  const createSession = async () => {
    if (!title.trim() || !user) return;
    const { error } = await supabase.from("sessions").insert({
      title: title.trim(),
      description: description.trim() || null,
      mentor_name: anonymousName,
      creator_id: user.id,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
      is_live: true,
    });
    if (error) {
      toast({ title: "Couldn't create session", description: error.message, variant: "destructive" });
      return;
    }
    setTitle(""); setDescription(""); setScheduledAt("");
    setDialogOpen(false);
    refetch();
    toast({ title: "Session created! 🎉" });
  };

  const groups = {
    live: sessions.filter((s) => getStatus(s) === "live"),
    upcoming: sessions.filter((s) => getStatus(s) === "upcoming"),
    ended: sessions.filter((s) => getStatus(s) === "ended"),
  };

  return (
    <div className="container mx-auto max-w-4xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-medium text-foreground" style={{ fontVariationSettings: '"opsz" 96' }}>
              Live <span className="font-italic-display text-violet">Sessions</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Join a mentor-led video session and ask questions anonymously.</p>
          </div>
          {isMentor ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-shimmer bg-violet hover:bg-violet-deep text-primary-foreground border-0">
                  <Plus className="mr-1 h-4 w-4" /> New Session
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Create a Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input placeholder="Session title" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <Textarea placeholder="What's this session about? (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Scheduled start (leave blank to start now)</label>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                  </div>
                  <Button onClick={createSession} disabled={!title.trim()} className="w-full btn-shimmer bg-violet hover:bg-violet-deep text-primary-foreground border-0">
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="outline" className="border-[1.5px] border-violet text-violet hover:bg-violet hover:text-primary-foreground" asChild>
              <Link to="/become-mentor"><GraduationCap className="mr-1 h-4 w-4" /> Become a mentor to host</Link>
            </Button>
          )}
        </div>

        {(["live","upcoming","ended"] as const).map((groupKey) => {
          const list = groups[groupKey];
          if (list.length === 0) return null;
          const heading = groupKey === "live" ? "Live now" : groupKey === "upcoming" ? "Upcoming" : "Past";
          return (
            <section key={groupKey} className="mt-8">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">{heading}</h2>
              <div className="space-y-4 animate-stagger">
                {list.map((session) => {
                  const status = getStatus(session);
                  return (
                    <div
                      key={session.id}
                      className={`group rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-hover ${
                        status === "live" ? "border-l-4 border-l-teal border-border" : "border-border"
                      }`}
                      style={status === "live" ? { boxShadow: "0 2px 20px rgba(108,79,232,0.08), -4px 0 24px rgba(45,200,200,0.18)" } : undefined}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-3 mb-2">
                            {status === "live" && (
                              <div className="pulse-ring inline-flex">
                                <Badge className="bg-mint text-foreground border-0 font-medium">
                                  <Radio className="mr-1 h-3 w-3" /> Live
                                </Badge>
                              </div>
                            )}
                            {status === "upcoming" && (
                              <Badge className="bg-coral text-primary-foreground border-0">
                                <CalendarClock className="mr-1 h-3 w-3" /> Upcoming
                              </Badge>
                            )}
                            {status === "ended" && (
                              <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Ended</Badge>
                            )}
                            {session.scheduled_at && (
                              <span className="text-xs text-muted-foreground">
                                {status === "upcoming"
                                  ? `Starts ${formatDistanceToNow(new Date(session.scheduled_at), { addSuffix: true })}`
                                  : status === "ended" && session.ended_at
                                  ? `Ended ${formatDistanceToNow(new Date(session.ended_at), { addSuffix: true })}`
                                  : `Started ${formatDistanceToNow(new Date(session.scheduled_at), { addSuffix: true })}`}
                              </span>
                            )}
                          </div>
                          <h3 className="font-display text-xl font-semibold text-foreground">{session.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">Hosted by {session.mentor_name}</p>
                          {session.description && (
                            <p className="mt-2 text-sm text-muted-foreground">{session.description}</p>
                          )}
                          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {session.participant_count} joined</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          disabled={status === "ended"}
                          className="shrink-0 border-[1.5px] border-violet text-violet hover:bg-violet hover:text-primary-foreground transition-colors disabled:opacity-50"
                          asChild={status !== "ended"}
                        >
                          {status !== "ended" ? (
                            <Link to={`/session/${session.id}`}>
                              {status === "live" ? "Join" : "Details"} <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          ) : (
                            <span>Ended</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {sessions.length === 0 && (
          <p className="text-center py-12 text-muted-foreground mt-8">No sessions yet. {isMentor ? "Create the first one! 🌟" : "Check back soon."}</p>
        )}
      </div>
    </div>
  );
}
