import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "mentor" | "user";

export function useUserRoles() {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [] as AppRole[];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return (data?.map((r) => r.role as AppRole)) ?? [];
    },
    enabled: !!user,
  });

  return {
    roles,
    isLoading,
    isAdmin: roles.includes("admin"),
    isMentor: roles.includes("mentor") || roles.includes("admin"),
  };
}
