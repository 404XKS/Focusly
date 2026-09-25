import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Focusly — Sign in" },
      { name: "description", content: "Sign in to keep your Focusly sessions and tasks safe in the cloud." },
      { property: "og:title", content: "Focusly — Sign in" },
      { property: "og:description", content: "Sign in to keep your Focusly sessions and tasks safe in the cloud." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/app" }); });
    supabase.auth.getSession().then(({ data: d }) => { if (d.session) navigate({ to: "/app" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/app" } });
    setBusy(false);
    if (res.error) return setMsg(res.error.message);
    if (mode === "up" && !res.data.session) setMsg("Check your email to confirm your account.");
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg(r.error.message ?? "Google sign-in failed");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-3xl p-6 space-y-4">
        <Link to="/app" className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white"><ArrowLeft className="h-3 w-3" /> Back</Link>
        <h1 className="font-display text-xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
        <p className="text-xs text-white/50">Your sessions and tasks are saved to your account, so clearing browser history won't erase them.</p>
        <button onClick={google} className="w-full rounded-full border border-white/15 py-2 text-sm hover:bg-white/5">Continue with Google</button>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary" />
          <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary" />
          <button disabled={busy} className="w-full rounded-full py-2 text-sm font-medium bg-primary text-primary-foreground disabled:opacity-60">
            {mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>
        {msg && <p className="text-xs text-white/70">{msg}</p>}
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-xs text-white/50 hover:text-white">
          {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
