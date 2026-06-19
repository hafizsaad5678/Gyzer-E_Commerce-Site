import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: { redirect: window.location.pathname } as any });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) navigate({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <SiteLayout>
        <div className="container-page py-32 text-center text-muted-foreground text-sm">Loading…</div>
      </SiteLayout>
    );
  }
  return <Outlet />;
}
