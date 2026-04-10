import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

        {/* Desktop nav */}
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
          <Button variant="outline" size="sm" asChild>
            <Link to="/ask">Ask Anonymously</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
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
          <div className="mt-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/ask" onClick={() => setIsOpen(false)}>Ask Anonymously</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
