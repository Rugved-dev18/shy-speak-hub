import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, LogIn, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function BecomeMentor() {
  const { user } = useAuth();
  const { isMentor } = useUserRoles();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAnonymous = user?.is_anonymous ?? true;

  const { data: application } = useQuery({
    queryKey: ["my-application", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("mentor_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !isAnonymous,
  });

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/become-mentor",
    });
    if (result.error) toast({ title: "Sign-in error", description: String(result.error), variant: "destructive" });
  };

  const submit = async () => {
    if (!user || !bio.trim() || !expertise.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("mentor_applications").insert({
      user_id: user.id,
      bio: bio.trim(),
      expertise: expertise.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Application submitted! 🌟", description: "An admin will review it soon." });
    qc.invalidateQueries({ queryKey: ["my-application", user.id] });
  };

  return (
    <div className="container mx-auto max-w-2xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-violet/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-violet" />
          </div>
          <h1 className="font-display text-3xl font-medium text-foreground">
            Become a <span className="font-italic-display text-violet">Mentor</span>
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Mentors host live video sessions and guide shy speakers in a safe, supportive space.
        </p>

        {isMentor ? (
          <div className="rounded-2xl border border-violet/40 bg-violet/5 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-violet mx-auto mb-3" />
            <h2 className="font-display text-xl font-semibold text-foreground">You're a mentor 🎉</h2>
            <p className="text-muted-foreground mt-1">You can now create live sessions.</p>
            <Button className="mt-4 bg-violet hover:bg-violet-deep text-primary-foreground" onClick={() => navigate("/sessions")}>
              Go to Sessions
            </Button>
          </div>
        ) : isAnonymous ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft text-center">
            <p className="text-foreground mb-4">Mentors need a real identity. Please sign in with Google to apply.</p>
            <Button className="bg-violet hover:bg-violet-deep text-primary-foreground" onClick={handleGoogleSignIn}>
              <LogIn className="mr-2 h-4 w-4" /> Sign in with Google
            </Button>
          </div>
        ) : application ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-coral" />
              <h2 className="font-display text-xl font-semibold text-foreground">Application status</h2>
              <Badge className={
                application.status === "approved" ? "bg-mint text-foreground" :
                application.status === "rejected" ? "bg-coral text-primary-foreground" :
                "bg-muted text-foreground"
              }>{application.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Expertise:</span> {application.expertise}</p>
            <p className="text-sm text-muted-foreground mt-2"><span className="font-medium text-foreground">Bio:</span> {application.bio}</p>
            {application.status === "pending" && (
              <p className="text-xs text-muted-foreground mt-4">An admin will review your application soon.</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Areas of expertise</label>
              <Input
                placeholder="e.g. Public speaking, anxiety coaching, career advice"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tell us about yourself</label>
              <Textarea
                placeholder="A short bio — your background, why you want to mentor, how you can help shy speakers."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <Button
              className="w-full bg-violet hover:bg-violet-deep text-primary-foreground"
              onClick={submit}
              disabled={submitting || !bio.trim() || !expertise.trim()}
            >
              {submitting ? "Submitting..." : "Submit application"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
