import { Link } from "react-router-dom";
import { MessageCircle, Users, Shield, Sparkles, Heart, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";

const features = [
  { icon: MessageCircle, title: "Ask Anonymously", description: "Submit questions without revealing your identity. Your voice matters, even whispered.", color: "violet" },
  { icon: Users, title: "Live Sessions", description: "Join mentored sessions where questions appear in real-time. No pressure, just support.", color: "teal" },
  { icon: Shield, title: "Safe Space", description: "Every interaction is private and protected. Express yourself without fear.", color: "mint" },
  { icon: Sparkles, title: "Group Tasks", description: "Gentle challenges to help you practice communication at your own pace.", color: "coral" },
  { icon: Heart, title: "Community", description: "Connect with others who understand. Share, support, and grow together.", color: "rose" },
  { icon: Lightbulb, title: "Guided Conversations", description: "Pre-built prompts to help you start meaningful conversations step by step.", color: "amber" },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  violet: { bg: "bg-violet/10", text: "text-violet", border: "border-l-violet" },
  teal: { bg: "bg-teal/10", text: "text-teal", border: "border-l-teal" },
  mint: { bg: "bg-mint/20", text: "text-mint", border: "border-l-mint" },
  coral: { bg: "bg-coral/10", text: "text-coral", border: "border-l-coral" },
  rose: { bg: "bg-rose/10", text: "text-rose", border: "border-l-rose" },
  amber: { bg: "bg-amber/10", text: "text-amber", border: "border-l-amber" },
};

export default function Landing() {
  return (
    <div className="min-h-screen animate-page-in">
      {/* Hero with breathing gradient mesh */}
      <section className="gradient-mesh relative">
        <div className="container mx-auto px-6 py-20 md:py-28 md:px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="animate-fade-up">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-soft">
                <Shield className="h-4 w-4 text-violet" />
                Safe & Anonymous
              </div>
              <h1 className="font-display text-5xl font-medium leading-[1.05] text-foreground md:text-6xl lg:text-7xl" style={{ fontVariationSettings: '"opsz" 144' }}>
                Your voice deserves to be{" "}
                <span className="font-italic-display coral-underline text-violet-deep">heard</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed">
                A safe space for shy and introverted people to express themselves, connect with mentors, and grow their confidence — all at their own pace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="btn-shimmer bg-violet hover:bg-violet-deep text-primary-foreground border-0 shadow-soft" asChild>
                  <Link to="/sessions">Join a Session</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-[1.5px] border-violet text-violet hover:bg-violet hover:text-primary-foreground transition-colors" asChild>
                  <Link to="/ask">Ask Anonymously</Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-foreground hover:bg-violet/10" asChild>
                  <Link to="/community">Explore Community</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block animate-float">
              <img src={heroImage} alt="People connecting in a safe space" className="w-full rounded-2xl shadow-hover" width={1280} height={720} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-medium text-foreground">
              Everything you need to <span className="font-italic-display text-violet">speak up</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Designed with care for people who find it hard to express themselves in traditional settings.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {features.map((f) => {
              const c = colorMap[f.color];
              return (
                <div
                  key={f.title}
                  className={`group rounded-2xl border-l-4 ${c.border} border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-hover`}
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${c.bg}`}>
                    <f.icon className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-warm py-20">
        <div className="container mx-auto px-6 md:px-4 text-center">
          <h2 className="font-display text-4xl font-medium text-foreground">
            Ready to take the <span className="font-italic-display text-coral">first step?</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">No signup required. Join as a guest and start expressing yourself today.</p>
          <Button size="lg" className="mt-8 btn-shimmer bg-violet hover:bg-violet-deep text-primary-foreground border-0 shadow-soft" asChild>
            <Link to="/ask">Start Anonymously</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 md:px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Shy Speak Connect. A safe space for every voice. 💜</p>
        </div>
      </footer>
    </div>
  );
}
