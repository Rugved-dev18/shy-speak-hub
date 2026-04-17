import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  anonymousName: string;
  isLoading: boolean;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [anonymousName, setAnonymousName] = useState("Guest");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("anonymous_name")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.anonymous_name) setAnonymousName(data.anonymous_name);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer Supabase call to avoid deadlock with auth callback
        setTimeout(() => fetchProfile(session.user.id), 0);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        setIsLoading(false);
      } else {
        supabase.auth.signInAnonymously().then(({ data }) => {
          if (data.user) {
            setUser(data.user);
            fetchProfile(data.user.id);
          }
          setIsLoading(false);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAnonymously = async () => {
    await supabase.auth.signInAnonymously();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await supabase.auth.signInAnonymously();
  };

  return (
    <AuthContext.Provider value={{ user, anonymousName, isLoading, signInAnonymously, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
