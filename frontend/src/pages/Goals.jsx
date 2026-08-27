import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Target,
  Sparkles,
  TrendingUp,
  PiggyBank,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import goalService from "../services/goalService";
import { getErrorMessage } from "../services/api";
import { formatCurrency, toDateInput } from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import CountUp from "../components/common/CountUp";
import { MetricSkeleton } from "../components/common/Skeleton";
import GoalCard from "../components/cards/GoalCard";
import GoalProgressChart from "../components/charts/GoalProgressChart";

const PRIORITIES = ["Low", "Medium", "High", "Very High"];
const EMPTY = { goal_name: "", target_amount: "", saved_amount: "0", deadline: "", priority: "Medium" };

export default function Goals() {
  const { currency } = useAuth();
  const [data, setData] = useState({ goals: [], monthly_saving_capacity: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [contributeGoal, setContributeGoal] = useState(null);
  const [contribution, setContribution] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await goalService.list());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(goal) {
    setEditing(goal);
    setForm({
      goal_name: goal.goal_name,
      target_amount: String(goal.target_amount),
      saved_amount: String(goal.saved_amount),
      deadline: toDateInput(goal.deadline),
      priority: goal.priority,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function save() {
    if (!form.goal_name.trim()) return setFormError("Goal name is required");
    if (!(Number(form.target_amount) > 0)) return setFormError("Target amount must be greater than zero");
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        goal_name: form.goal_name.trim(),
        target_amount: Number(form.target_amount),
        saved_amount: Number(form.saved_amount) || 0,
        deadline: form.deadline || null,
        priority: form.priority,
      };
      if (editing) await goalService.update(editing.id, payload);
      else await goalService.create(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(goal) {
    if (!window.confirm(`Delete goal "${goal.goal_name}"?`)) return;
    try {
      await goalService.remove(goal.id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function submitContribution() {
    if (!(Number(contribution) > 0)) return setFormError("Contribution must be greater than zero");
    setSaving(true);
    try {
      await goalService.contribute(contributeGoal.id, Number(contribution));
      setContributeGoal(null);
      setContribution("");
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Savings Goals
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Set long-term targets and track your monthly contribution milestones
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span>Add Goal</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Monthly Saving Capacity Highlight */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Estimated Monthly Saving Capacity
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-700 dark:text-brand-300">
            <CountUp value={data.monthly_saving_capacity} currency={currency} isCurrency={true} />
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Calculated available surplus from your budget allocations
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
          <PiggyBank className="h-6 w-6" strokeWidth={2} />
        </div>
      </div>

      {/* Goals Content */}
      {loading && data.goals.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
      ) : data.goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals set yet"
          description="Create savings goals for vacations, emergency funds, gadgets, or investments."
          actionLabel="+ Add Your First Goal"
          onAction={openCreate}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                currency={currency}
                onEdit={openEdit}
                onDelete={remove}
                onContribute={(g) => {
                  setContributeGoal(g);
                  setContribution("");
                  setFormError("");
                }}
              />
            ))}
          </div>

          <GoalProgressChart goals={data.goals} currency={currency} />
        </>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        open={modalOpen}
        title={editing ? "Edit Goal" : "Add Goal"}
        subtitle="Define your savings target and milestone"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? "Update Goal" : "Save Goal"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {formError}
            </p>
          )}
          <Input
            label="Goal Name"
            value={form.goal_name}
            onChange={(e) => setForm({ ...form, goal_name: e.target.value })}
            placeholder="e.g. Emergency Fund, New Laptop, Holiday Trip"
          />
          <Input
            label="Target Amount"
            type="number"
            min="0"
            step="0.01"
            value={form.target_amount}
            onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Already Saved Amount"
            type="number"
            min="0"
            step="0.01"
            value={form.saved_amount}
            onChange={(e) => setForm({ ...form, saved_amount: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Target Date (Optional)"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
          <Input
            as="select"
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Input>
        </div>
      </Modal>

      {/* Add Contribution Modal */}
      <Modal
        open={Boolean(contributeGoal)}
        title={`Add Savings — ${contributeGoal?.goal_name || ""}`}
        subtitle="Log an additional contribution toward this target"
        onClose={() => setContributeGoal(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setContributeGoal(null)}>
              Cancel
            </Button>
            <Button onClick={submitContribution} loading={saving}>
              Add Contribution
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {formError}
            </p>
          )}
          <Input
            label="Contribution Amount"
            type="number"
            min="0"
            step="0.01"
            value={contribution}
            onChange={(e) => setContribution(e.target.value)}
            placeholder="0.00"
          />
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Suggested This Month:
            </span>{" "}
            {formatCurrency(contributeGoal?.suggested_contribution || 0, currency)}
          </div>
        </div>
      </Modal>
    </div>
  );
}

