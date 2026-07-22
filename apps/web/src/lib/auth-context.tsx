"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchApi, ApiError } from "@/lib/api";
import type { MeResponse } from "@/lib/api-types";
import { completePendingRegistration, postRegisterRedirectPath } from "@/lib/complete-registration";

interface AuthContextValue {
  /** true enquanto a sessão inicial (Supabase + /me) ainda está sendo resolvida. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  me: MeResponse | null;
  /** Erro ao buscar /me (ex.: cadastro incompleto na API); não impede uso do app. */
  meError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  // Evita tentar auto-completar o cadastro do mesmo usuário mais de uma vez por sessão do app.
  const attemptedUserIdRef = useRef<string | null>(null);

  const loadMe = useCallback(
    async (accessToken: string | null, currentUser: User | null) => {
      if (!accessToken || !currentUser) {
        setMe(null);
        setMeError(null);
        return;
      }
      try {
        let data = await fetchApi<MeResponse>("/me", { token: accessToken });

        if (!data.registered && attemptedUserIdRef.current !== currentUser.id) {
          attemptedUserIdRef.current = currentUser.id;
          const completed = await completePendingRegistration(accessToken, currentUser);
          if (completed) {
            data = completed;
            if (completed.registered) {
              router.push(postRegisterRedirectPath(completed.role));
            }
          }
        }

        setMe(data);
        setMeError(null);
      } catch (err) {
        setMe(null);
        setMeError(err instanceof ApiError ? err.message : "Não foi possível carregar seu perfil.");
      }
    },
    [router],
  );

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
    await loadMe(data.session?.access_token ?? null, data.session?.user ?? null);
  }, [supabase, loadMe]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      await loadMe(data.session?.access_token ?? null, data.session?.user ?? null);
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      void loadMe(newSession?.access_token ?? null, newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadMe]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    attemptedUserIdRef.current = null;
    setMe(null);
  }, [supabase]);

  const value: AuthContextValue = {
    loading,
    session,
    user: session?.user ?? null,
    me,
    meError,
    signIn,
    signOut,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa ser usado dentro de <AuthProvider>");
  return ctx;
}
