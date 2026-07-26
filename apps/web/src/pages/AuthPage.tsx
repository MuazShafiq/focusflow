import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, Navigate, useNavigate } from "../components/Link";
import { Logo } from "../components/Logo";

export const AuthPage = ({ mode }: { mode: "login" | "register" }) => {
  const { session, login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (session) return <Navigate to="/app" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        await login(String(data.get("email")), String(data.get("password")));
      } else {
        await register({
          displayName: String(data.get("displayName")),
          email: String(data.get("email")),
          password: String(data.get("password")),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
      navigate("/app");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue");
    } finally {
      setPending(false);
    }
  };

  const isLogin = mode === "login";
  return (
    <main className="auth-layout">
      <section className="auth-aside">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Back</Link>
        <Logo />
        <div className="auth-quote">
          <Sparkles size={24} />
          <blockquote>“A good plan should leave you with energy—not take all of it.”</blockquote>
          <p>FocusFlow protects work, rest, and everything between.</p>
        </div>
        <div className="auth-orbit" aria-hidden="true"><i /><i /><i /></div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <span className="muted-label">{isLogin ? "WELCOME BACK" : "START FRESH"}</span>
          <h1>{isLogin ? "Find your flow." : "Plan a better week."}</h1>
          <p>{isLogin ? "Your balanced schedule is waiting." : "A few details now. A calmer schedule next."}</p>
          {!isLogin && (
            <label>Name<input name="displayName" placeholder="What should we call you?" required minLength={2} /></label>
          )}
          <label>Email<input name="email" type="email" placeholder="you@example.com" required autoComplete="email" /></label>
          <label>
            Password
            <input name="password" type="password" placeholder="At least 8 characters" required minLength={8} autoComplete={isLogin ? "current-password" : "new-password"} />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-dark button-full" disabled={pending}>
            {pending ? "One moment…" : isLogin ? "Sign in" : "Create my account"}
            {!pending && <ArrowRight size={17} />}
          </button>
          <p className="auth-switch">
            {isLogin ? "New to FocusFlow?" : "Already have an account?"}{" "}
            <Link to={isLogin ? "/register" : "/login"}>{isLogin ? "Create an account" : "Sign in"}</Link>
          </p>
        </form>
      </section>
    </main>
  );
};
