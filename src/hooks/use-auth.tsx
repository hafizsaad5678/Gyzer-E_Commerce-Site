/**
 * useAuth — lightweight hook to subscribe to the Supabase auth state.
 *
 * Returns:
 *  - signedIn: boolean | null  (null = still loading)
 *  - userId:   string | null
 *  - userName: string | null   (first name from user_metadata)
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  signedIn: boolean | null;
  userId: string | null;
  userName: string | null;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    signedIn: null,
    userId: null,
    userName: null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setState({
        signedIn: !!session,
        userId: session?.user.id ?? null,
        userName: session?.user.user_metadata?.full_name?.split(" ")[0] ?? null,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        signedIn: !!session,
        userId: session?.user.id ?? null,
        userName: session?.user.user_metadata?.full_name?.split(" ")[0] ?? null,
      });
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}
