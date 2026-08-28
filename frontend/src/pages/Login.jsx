import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, LogIn, AlertTriangle } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { getErrorMessage } from "../services/api";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/70 p-4 dark:bg-[#090d11]">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md ring-4 ring-brand-500/20">
            <ShieldCheck className="h-6 w-6" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Planner
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sign in to access your finances, budgets, and goals
          </p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 shadow-xl">
        <form onSubmit={onSubmit} className="card space-y-4 shadow-card-hover">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Input
            label="Email Address"
            name="email"
            type="email"
            icon={Mail}
            value={form.email}
            onChange={onChange}
            required
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            icon={Lock}
            value={form.password}
            onChange={onChange}
            required
            placeholder="••••••••"
          />
          <Button type="submit" loading={loading} className="w-full">
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </Button>
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Create one now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

