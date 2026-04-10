import { useState } from "react";
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

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      console.error("Google sign-in error:", result.error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <MessageCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
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
                  ? "bg-lavender-light text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{anonymousName}</span>
          {isAnonymous ? (
            <Button variant="outline" size="sm" onClick={handleGoogleSignIn}>
              <LogIn className="mr-1 h-4 w-4" /> Sign in with Google
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/ask">Ask Anonymously</Link>
          </Button>
        </div>

        <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden animate-fade-in">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-lavender-light text-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-border space-y-2">
            <p className="text-xs text-muted-foreground px-3">{anonymousName}</p>
            {isAnonymous ? (
              <Button variant="outline" size="sm" className="w-full" onClick={handleGoogleSignIn}>
                <LogIn className="mr-1 h-4 w-4" /> Sign in with Google
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="w-full" onClick={signOut}>Sign out</Button>
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/ask" onClick={() => setIsOpen(false)}>Ask Anonymously</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
