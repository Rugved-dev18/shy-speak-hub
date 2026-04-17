import { useState } from "react";
import { Link } from "react-router-dom";
import { Radio, Users, ArrowRight, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function Sessions() {
  const [title, setTitle] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: sessions = [], refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("sessions").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createSession = async () => {
    if (!title.trim() || !mentorName.trim() || !user) return;
    const { error } = await supabase.from("sessions").insert({
      title: title.trim(),
      mentor_name: mentorName.trim(),
      creator_id: user.id,
      is_live: true,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setTitle("");
    setMentorName("");
    setDialogOpen(false);
    refetch();
    toast({ title: "Session created! 🎉" });
  };

  return (
    <div className="container mx-auto max-w-4xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-medium text-foreground" style={{ fontVariationSettings: '"opsz" 96' }}>
              Live <span className="font-italic-display text-violet">Sessions</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Join a mentored session and ask questions anonymously in real time.</p>
          </div>
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
                <Input placeholder="Mentor name" value={mentorName} onChange={(e) => setMentorName(e.target.value)} />
                <Button onClick={createSession} disabled={!title.trim() || !mentorName.trim()} className="w-full btn-shimmer bg-violet hover:bg-violet-deep text-primary-foreground border-0">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8 space-y-4 animate-stagger">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-hover ${
                session.is_live ? "border-l-4 border-l-teal border-border" : "border-border"
              }`}
              style={session.is_live ? { boxShadow: "0 2px 20px rgba(108,79,232,0.08), -4px 0 24px rgba(45,200,200,0.18)" } : undefined}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {session.is_live ? (
                      <div className="pulse-ring inline-flex">
                        <Badge className="bg-mint text-foreground border-0 font-medium">
                          <Radio className="mr-1 h-3 w-3" /> Live
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Ended</Badge>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">{session.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Hosted by {session.mentor_name}</p>
                  <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {session.participant_count} participants</span>
                  </div>
                </div>
                <Button variant="outline" className="shrink-0 border-[1.5px] border-violet text-violet hover:bg-violet hover:text-primary-foreground transition-colors" asChild>
                  <Link to={`/session/${session.id}`}>Join <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">No sessions yet. Create the first one! 🌟</p>
          )}
        </div>
      </div>
    </div>
  );
}
