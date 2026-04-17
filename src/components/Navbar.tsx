import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, MessageCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Sessions", path: "/sessions" },
  { label: "Community", path: "/community" },
  { label: "Tasks", path: "/tasks" },
  { label: "Conversations", path: "/conversations" },
  { label: "Dashboard", path: "/dashboard" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, anonymousName, signOut } = useAuth();

  const isAnonymous = user?.is_anonymous;

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) console.error("Google sign-in error:", result.error);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 frosted-glass">
      <div className="container mx-auto flex items-center justify-between px-6 py-3 md:px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet shadow-soft">
            <MessageCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground tracking-tight">
            Shy Speak Connect
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-violet/10 text-violet-deep"
                  : "text-muted-foreground hover:bg-violet/5 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{anonymousName}</span>
          {isAnonymous ? (
            <Button variant="outline" size="sm" className="border-[1.5px] border-violet text-violet hover:bg-violet hover:text-primary-foreground transition-colors" onClick={handleGoogleSignIn}>
              <LogIn className="mr-1 h-4 w-4" /> Sign in with Google
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
          )}
          <Button size="sm" className="btn-shimmer bg-violet hover:bg-violet-deep text-primary-foreground border-0" asChild>
            <Link to="/ask">Ask Anonymously</Link>
          </Button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-violet/10 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5 text-violet" /> : <Menu className="h-5 w-5 text-foreground" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 top-[57px] bg-foreground/20 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 top-[57px] w-[78%] max-w-sm md:hidden frosted-glass border-l border-border/60 shadow-hover overflow-y-auto"
               style={{ animation: "fadeUp 0.35s cubic-bezier(.2,.8,.2,1) both" }}>
            <div className="px-6 py-6 animate-stagger">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block rounded-xl px-4 py-3 text-base font-medium transition-colors mb-1 ${
                    location.pathname === item.path
                      ? "bg-violet/10 text-violet-deep"
                      : "text-foreground hover:bg-violet/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                <p className="text-xs text-muted-foreground px-1">Signed in as <span className="font-medium text-foreground">{anonymousName}</span></p>
                {isAnonymous ? (
                  <Button variant="outline" className="w-full border-[1.5px] border-violet text-violet hover:bg-violet hover:text-primary-foreground" onClick={handleGoogleSignIn}>
                    <LogIn className="mr-1 h-4 w-4" /> Sign in with Google
                  </Button>
                ) : (
                  <Button variant="ghost" className="w-full" onClick={signOut}>Sign out</Button>
                )}
                <Button className="w-full btn-shimmer bg-violet hover:bg-violet-deep text-primary-foreground border-0" asChild>
                  <Link to="/ask">Ask Anonymously</Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
