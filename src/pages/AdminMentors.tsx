import { Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function AdminMentors() {
  const { isAdmin, isLoading } = useUserRoles();
  const { toast } = useToast();
  const qc = useQueryClient();

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

  const decide = async (appId: string, userId: string, approve: boolean) => {
    const newStatus = approve ? "approved" : "rejected";
    const { error: updateErr } = await supabase
      .from("mentor_applications")
      .update({ status: newStatus })
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
    <div className="container mx-auto max-w-3xl px-6 py-10 md:px-4 animate-page-in">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-violet/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-violet" />
          </div>
          <h1 className="font-display text-3xl font-medium text-foreground">
            Mentor <span className="font-italic-display text-violet">Applications</span>
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">Review and approve people who want to host live sessions.</p>

        <div className="space-y-4 animate-stagger">
          {applications.map((app) => (
            <div key={app.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={
                      app.status === "approved" ? "bg-mint text-foreground" :
                      app.status === "rejected" ? "bg-coral text-primary-foreground" :
                      "bg-muted text-foreground"
                    }>{app.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{app.expertise}</p>
                  <p className="text-sm text-muted-foreground mt-1">{app.bio}</p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">user: {app.user_id.slice(0, 8)}…</p>
                </div>
                {app.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-mint text-foreground hover:bg-mint/80" onClick={() => decide(app.id, app.user_id, true)}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decide(app.id, app.user_id, false)}>
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
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
