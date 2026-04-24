import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, LogIn, CheckCircle2, Clock, Upload, X, FileText, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const EXPERTISE_OPTIONS = [
  "Public Speaking", "Anxiety Coaching", "Career Advice", "Communication",
  "Leadership", "Interview Prep", "Networking", "Confidence Building",
  "Presentation Skills", "Self-Growth",
];

const MENTORING_STYLES = ["Text", "Voice", "Video"] as const;

type DraftState = {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  experience: string;
  expertise_areas: string[];
  skills: string[];
  motivation_text: string;
  value_text: string;
  mentoring_style: string;
  availability: string;
  portfolio_link: string;
};

const emptyDraft: DraftState = {
  full_name: "", email: "", phone: "", role: "", organization: "", experience: "",
  expertise_areas: [], skills: [], motivation_text: "", value_text: "",
  mentoring_style: "", availability: "", portfolio_link: "",
};

export default function BecomeMentor() {
  const { user } = useAuth();
  const { isMentor } = useUserRoles();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isAnonymous = user?.is_anonymous ?? true;
  const draftKey = useMemo(() => (user ? `mentor-app-draft:${user.id}` : null), [user]);

  const [form, setForm] = useState<DraftState>(emptyDraft);
  const [skillInput, setSkillInput] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Hydrate from draft
  useEffect(() => {
    if (!draftKey) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) setForm({ ...emptyDraft, ...JSON.parse(raw) });
    } catch {}
  }, [draftKey]);

  // Save draft (debounced light)
  useEffect(() => {
    if (!draftKey) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(form)); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [form, draftKey]);

  // Prefill email from auth
  useEffect(() => {
    if (user && !isAnonymous && !form.email && user.email) {
      setForm((f) => ({ ...f, email: user.email ?? "" }));
    }
  }, [user, isAnonymous]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const toggleExpertise = (area: string) => {
    setForm((f) => ({
      ...f,
      expertise_areas: f.expertise_areas.includes(area)
        ? f.expertise_areas.filter((a) => a !== area)
        : [...f.expertise_areas, area],
    }));
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s) || form.skills.length >= 20) return;
    if (s.length > 40) return;
    setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  };

  const removeSkill = (s: string) => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }));

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB.", variant: "destructive" });
      return;
    }
    setCvFile(file);
  };

  const validate = (): string | null => {
    if (!form.full_name.trim()) return "Full name is required";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return "Valid email is required";
    if (!form.role.trim()) return "Current role is required";
    if (!form.experience.trim()) return "Years of experience is required";
    if (form.expertise_areas.length === 0) return "Pick at least one area of expertise";
    if (!form.motivation_text.trim()) return "Tell us why you want to mentor";
    if (!form.value_text.trim()) return "Tell us what value you'll provide";
    if (!form.mentoring_style) return "Choose a preferred mentoring style";
    if (!form.availability.trim()) return "Availability is required";
    if (!cvFile) return "Please upload your CV (PDF)";
    if (!agreed) return "Please accept the terms";
    return null;
  };

  const submit = async () => {
    if (!user) return;
    const err = validate();
    if (err) {
      toast({ title: "Please complete the form", description: err, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Upload CV
      const path = `${user.id}/cv-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("mentor-cvs")
        .upload(path, cvFile!, { contentType: "application/pdf", upsert: true });
      if (upErr) throw upErr;

      const { error } = await supabase.from("mentor_applications").insert({
        user_id: user.id,
        // legacy required columns
        bio: form.motivation_text.trim(),
        expertise: form.expertise_areas.join(", "),
        // new structured fields
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role.trim(),
        organization: form.organization.trim() || null,
        experience: form.experience.trim(),
        expertise_areas: form.expertise_areas,
        skills: form.skills,
        motivation_text: form.motivation_text.trim(),
        value_text: form.value_text.trim(),
        mentoring_style: form.mentoring_style,
        availability: form.availability.trim(),
        cv_url: path,
        portfolio_link: form.portfolio_link.trim() || null,
      });
      if (error) throw error;

      toast({ title: "Application submitted! 🌟", description: "An admin will review it soon." });
      if (draftKey) localStorage.removeItem(draftKey);
      qc.invalidateQueries({ queryKey: ["my-application", user.id] });
    } catch (e: any) {
      toast({ title: "Couldn't submit", description: e?.message ?? "Try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-6 py-10 md:px-4 animate-page-in">
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
          Mentors host live sessions and guide shy speakers in a safe, supportive space.
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
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Clock className="h-5 w-5 text-coral" />
              <h2 className="font-display text-xl font-semibold text-foreground">Application status</h2>
              <Badge className={
                application.status === "approved" ? "bg-mint text-foreground" :
                application.status === "rejected" ? "bg-coral text-primary-foreground" :
                "bg-muted text-foreground"
              }>{application.status}</Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              {application.full_name && <p><span className="font-medium text-foreground">Name:</span> {application.full_name}</p>}
              <p><span className="font-medium text-foreground">Expertise:</span> {application.expertise}</p>
              <p><span className="font-medium text-foreground">About:</span> {application.bio}</p>
              {(application as any).admin_feedback && (
                <p className="rounded-lg bg-muted/50 p-3 mt-2">
                  <span className="font-medium text-foreground">Admin feedback:</span> {(application as any).admin_feedback}
                </p>
              )}
            </div>
            {application.status === "pending" && (
              <p className="text-xs text-muted-foreground mt-4">An admin will review your application soon.</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Personal Info */}
            <Section title="1. Personal Information">
              <Field label="Full Name *">
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={100} />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Email *">
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
                </Field>
                <Field label="Phone (optional)">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} />
                </Field>
              </div>
            </Section>

            {/* Professional */}
            <Section title="2. Professional Details">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Current Role / Occupation *">
                  <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} maxLength={120} />
                </Field>
                <Field label="Organization (optional)">
                  <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} maxLength={120} />
                </Field>
              </div>
              <Field label="Years of Experience *">
                <Input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 5" maxLength={20} />
              </Field>
            </Section>

            {/* Expertise */}
            <Section title="3. Expertise">
              <Field label="Areas of Expertise * (select multiple)">
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_OPTIONS.map((a) => {
                    const active = form.expertise_areas.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleExpertise(a)}
                        className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                          active
                            ? "bg-violet text-primary-foreground border-violet"
                            : "bg-card text-foreground border-border hover:border-violet/50"
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Skills (press Enter to add)">
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="e.g. Storytelling"
                    maxLength={40}
                  />
                  <Button type="button" variant="outline" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
                </div>
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.skills.map((s) => (
                      <Badge key={s} className="bg-mint/30 text-foreground gap-1">
                        {s}
                        <button onClick={() => removeSkill(s)} className="ml-1 hover:text-coral"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>
            </Section>

            {/* Mentorship */}
            <Section title="4. Mentorship Details">
              <Field label="Why do you want to become a mentor? *">
                <Textarea value={form.motivation_text} onChange={(e) => setForm({ ...form, motivation_text: e.target.value })} maxLength={1000} className="min-h-[100px]" />
              </Field>
              <Field label="What value can you provide to users? *">
                <Textarea value={form.value_text} onChange={(e) => setForm({ ...form, value_text: e.target.value })} maxLength={1000} className="min-h-[100px]" />
              </Field>
              <Field label="Preferred mentoring style *">
                <div className="flex gap-2 flex-wrap">
                  {MENTORING_STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, mentoring_style: s })}
                      className={`text-sm rounded-full px-4 py-2 border transition-colors ${
                        form.mentoring_style === s
                          ? "bg-violet text-primary-foreground border-violet"
                          : "bg-card text-foreground border-border hover:border-violet/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </Section>

            {/* Availability */}
            <Section title="5. Availability">
              <Field label="Available days/timings *">
                <Textarea
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  placeholder="e.g. Weekdays 7–9pm IST, Sat mornings"
                  maxLength={300}
                  className="min-h-[80px]"
                />
              </Field>
            </Section>

            {/* Upload */}
            <Section title="6. Upload">
              <Field label="Upload CV / Resume (PDF, max 5MB) *">
                <label className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 cursor-pointer hover:border-violet/50 transition-colors">
                  <Upload className="h-5 w-5 text-violet" />
                  <span className="text-sm text-foreground flex-1">
                    {cvFile ? (
                      <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> {cvFile.name}</span>
                    ) : "Choose PDF file"}
                  </span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleCvChange} />
                </label>
              </Field>
              <Field label="Portfolio or LinkedIn link (optional)">
                <Input
                  value={form.portfolio_link}
                  onChange={(e) => setForm({ ...form, portfolio_link: e.target.value })}
                  placeholder="https://linkedin.com/in/you"
                  maxLength={300}
                />
              </Field>
            </Section>

            {/* Agreement */}
            <Section title="7. Agreement">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  I agree to the terms, privacy policy, and code of conduct. I understand my information
                  will be reviewed by admins to assess my mentor application.
                </span>
              </label>
            </Section>

            <Button
              className="w-full bg-violet hover:bg-violet-deep text-primary-foreground h-12"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit application"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Your progress is saved automatically in this browser.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
