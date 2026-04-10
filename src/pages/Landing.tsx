import { Link } from "react-router-dom";
import { MessageCircle, Users, Shield, Sparkles, Heart, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";

const features = [
  { icon: MessageCircle, title: "Ask Anonymously", description: "Submit questions without revealing your identity. Your voice matters, even whispered.", color: "bg-lavender-light text-lavender" },
  { icon: Users, title: "Live Sessions", description: "Join mentored sessions where questions appear in real-time. No pressure, just support.", color: "bg-sky-light text-sky" },
  { icon: Shield, title: "Safe Space", description: "Every interaction is private and protected. Express yourself without fear.", color: "bg-mint-light text-mint" },
  { icon: Sparkles, title: "Group Tasks", description: "Gentle challenges to help you practice communication at your own pace.", color: "bg-peach-light text-peach" },
  { icon: Heart, title: "Community", description: "Connect with others who understand. Share, support, and grow together.", color: "bg-rose-light text-rose" },
  { icon: Lightbulb, title: "Guided Conversations", description: "Pre-built prompts to help you start meaningful conversations step by step.", color: "bg-lavender-light text-lavender" },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="animate-fade-up">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-card">
                <Shield className="h-4 w-4 text-lavender" />
                Safe & Anonymous
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                Your voice deserves to be{" "}
                <span className="bg-gradient-to-r from-lavender to-sky bg-clip-text text-transparent">
                  heard
                </span>
              </h1>
              <p className="mt-4 max-w-lg text-lg text-muted-foreground">
                A safe space for shy and introverted people to express themselves, connect with mentors, and grow their confidence — all at their own pace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="gradient-primary border-0 text-primary-foreground shadow-soft hover:opacity-90 transition-opacity" asChild>
                  <Link to="/sessions">Join a Session</Link>
                </Button>
                <Button size="lg" variant="outline" className="shadow-card" asChild>
                  <Link to="/ask">Ask Anonymously</Link>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <Link to="/community">Explore Community</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block animate-float">
              <img src={heroImage} alt="People connecting in a safe space" className="w-full rounded-2xl" width={1280} height={720} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-foreground">Everything you need to speak up</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Designed with care for people who find it hard to express themselves in traditional settings.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-hover hover:-translate-y-1">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-warm py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">Ready to take the first step?</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">No signup required. Join as a guest and start expressing yourself today.</p>
          <Button size="lg" className="mt-8 gradient-primary border-0 text-primary-foreground shadow-soft hover:opacity-90 transition-opacity" asChild>
            <Link to="/ask">Start Anonymously</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Shy Speak Connect. A safe space for every voice. 💜</p>
        </div>
      </footer>
    </div>
  );
}
