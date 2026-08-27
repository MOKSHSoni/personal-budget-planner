import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Coins,
  Calendar,
  Moon,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Save,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import authService from "../services/authService";
import { categoryService } from "../services/expenseService";
import { getErrorMessage } from "../services/api";
import { CURRENCIES } from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    currency: "INR",
    salary_date: 1,
    theme: "light",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      currency: user.currency || "INR",
      salary_date: user.salary_date || 1,
      theme: user.theme || "light",
      password: "",
    });
  }, [user]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        currency: form.currency,
        salary_date: Number(form.salary_date),
        theme: form.theme,
      };
      if (form.password) payload.password = form.password;
      const data = await authService.updateProfile(payload);
      updateUser(data.user);
      setForm((f) => ({ ...f, password: "" }));
      setMessage("Your settings have been saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function restoreDefaults() {
    setRestoring(true);
    setMessage("");
    setError("");
    try {
      const data = await categoryService.restoreDefaults();
      setMessage(`Restored ${data.added} missing default categories.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Preferences & Settings
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Manage your account profile, primary currency, and system appearance
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={save} className="card space-y-5">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Profile Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            icon={User}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email Address"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Financial & Theme Preferences
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Input
              as="select"
              label="Primary Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Input>
            <Input
              label="Salary Deposit Day"
              type="number"
              min="1"
              max="31"
              value={form.salary_date}
              onChange={(e) => setForm({ ...form, salary_date: e.target.value })}
            />
            <Input
              as="select"
              label="Interface Theme"
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </Input>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Security (Optional)
          </h2>
          <div className="mt-3">
            <Input
              label="New Password"
              icon={Lock}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Leave blank to keep your current password"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </div>
      </form>

      {/* Default Categories Helper Card */}
      <div className="card flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Restore Default Categories
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Re-populate any missing default categories (Rent, Food, Electricity, Internet, Shopping, etc.)
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={restoreDefaults}
          loading={restoring}
          className="shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Restore Categories</span>
        </Button>
      </div>
    </div>
  );
}

