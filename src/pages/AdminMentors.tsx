import { useState } from "react";
import { Shield, Check, X, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function AdminMentors() {
  const { isAdmin, isLoading } = useUserRoles();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const { data: applications = [] } = useQuery({
    queryKey: ["all-applications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mentor_applications")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const viewCv = async (path: string) => {
    const { data, error } = await supabase.storage.from("mentor-cvs").createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) {
      toast({ title: "Couldn't open CV", description: error?.message ?? "Unknown error", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const decide = async (appId: string, userId: string, approve: boolean) => {
    const newStatus = approve ? "approved" : "rejected";
    const { error: updateErr } = await supabase
      .from("mentor_applications")
      .update({ status: newStatus, admin_feedback: feedback[appId]?.trim() || null })
      .eq("id", appId);
    if (updateErr) {
      toast({ title: "Error", description: updateErr.message, variant: "destructive" });
      return;
    }
    if (approve) {
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "mentor" });
      if (roleErr && !roleErr.message.includes("duplicate")) {
        toast({ title: "Role assign failed", description: roleErr.message, variant: "destructive" });
        return;
      }
    }
    toast({ title: approve ? "Approved 🎉" : "Rejected" });
    qc.invalidateQueries({ queryKey: ["all-applications"] });
  };

  if (isLoading) return <div className="container mx-auto px-6 py-10 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-2xl px-6 py-10 text-center">
        <Shield className="h-10 w-10 text-coral mx-auto mb-3" />
        <h1 className="font-display text-2xl font-semibold text-foreground">Admins only</h1>
        <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-violet/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-violet" />
          </div>
          <h1 className="font-display text-3xl font-medium text-foreground">
            Mentor <span className="font-italic-display text-violet">Applications</span>
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">Review mentor applications, preview CVs, and approve or reject.</p>

        <div className="space-y-4 animate-stagger">
          {applications.map((app: any) => (
            <div key={app.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={
                      app.status === "approved" ? "bg-mint text-foreground" :
                      app.status === "rejected" ? "bg-coral text-primary-foreground" :
                      "bg-muted text-foreground"
                    }>{app.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-base font-semibold text-foreground">{app.full_name ?? "Unnamed applicant"}</p>
                  {app.email && <p className="text-xs text-muted-foreground">{app.email}{app.phone ? ` · ${app.phone}` : ""}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <Detail label="Role" value={app.role} />
                <Detail label="Organization" value={app.organization} />
                <Detail label="Experience" value={app.experience} />
                <Detail label="Mentoring style" value={app.mentoring_style} />
                <Detail label="Availability" value={app.availability} className="md:col-span-2" />
                <Detail label="Expertise" value={(app.expertise_areas?.length ? app.expertise_areas.join(", ") : app.expertise)} className="md:col-span-2" />
                {app.skills?.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-foreground mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {app.skills.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Detail label="Motivation" value={app.motivation_text ?? app.bio} className="md:col-span-2" />
                <Detail label="Value to users" value={app.value_text} className="md:col-span-2" />
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {app.cv_url && (
                  <Button size="sm" variant="outline" onClick={() => viewCv(app.cv_url)}>
                    <FileText className="h-4 w-4 mr-1" /> Preview CV
                  </Button>
                )}
                {app.portfolio_link && (
                  <a href={app.portfolio_link} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-1" /> Portfolio
                    </Button>
                  </a>
                )}
              </div>

              {app.admin_feedback && app.status !== "pending" && (
                <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Feedback:</span> {app.admin_feedback}
                </p>
              )}

              {app.status === "pending" && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    placeholder="Optional feedback for the applicant…"
                    value={feedback[app.id] ?? ""}
                    onChange={(e) => setFeedback((f) => ({ ...f, [app.id]: e.target.value }))}
                    maxLength={500}
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-mint text-foreground hover:bg-mint/80" onClick={() => decide(app.id, app.user_id, true)}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decide(app.id, app.user_id, false)}>
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {applications.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">No applications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, className = "" }: { label: string; value?: string | null; className?: string }) {
  if (!value) return null;
  return (
    <div className={className}>
      <p className="text-xs font-medium text-foreground mb-0.5">{label}</p>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
}
