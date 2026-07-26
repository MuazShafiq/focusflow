import {
  BarChart3, CalendarDays, Check, CheckCircle2, ChevronRight, Circle,
  Clock3, LayoutDashboard, ListTodo, Lock, LogOut, Menu, Plus, Settings,
  Sparkles, Unlock, X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { Navigate } from "../components/Link";
import { Logo } from "../components/Logo";
import type { Plan, ScheduleBlock, Task, UserPreferences } from "../types";

const formatTime = (date: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(date));
const formatDue = (date: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(date));
const blockClass: Record<ScheduleBlock["type"], string> = {
  task: "focus", commitment: "commitment", exercise: "move",
  meal: "meal", break: "rest", leisure: "rest",
};

export const DashboardPage = () => {
  const { session, logout, request } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [nextTasks, nextPlan] = await Promise.all([
        request<Task[]>("/tasks?status=todo"),
        request<Plan | null>("/plans/current"),
      ]);
      setTasks(nextTasks);
      setPlan(nextPlan);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load your plan");
    } finally {
      setLoading(false);
    }
  }, [request, session]);
  useEffect(() => { void load(); }, [load]);
  if (!session) return <Navigate to="/login" replace />;

  const now = new Date();
  const todayBlocks = plan?.blocks.filter((block) => new Date(block.startAt).toDateString() === now.toDateString()) ?? [];
  const focusMinutes = todayBlocks.filter((block) => block.type === "task").reduce(
    (sum, block) => sum + (new Date(block.endAt).getTime() - new Date(block.startAt).getTime()) / 60_000, 0,
  );
  const nextBlock = todayBlocks.find((block) => new Date(block.endAt) > now);

  const generatePlan = async () => {
    setGenerating(true);
    setNotice("");
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    try {
      setPlan(await request<Plan>("/plans/generate", {
        method: "POST", body: JSON.stringify({ rangeStart: start, rangeEnd: end }),
      }));
      setNotice("Your week has been rebuilt around your current priorities.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to generate a plan");
    } finally { setGenerating(false); }
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const task = await request<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"), category: data.get("category"),
          dueAt: new Date(String(data.get("dueAt"))),
          estimatedMinutes: Number(data.get("estimatedMinutes")),
          priority: Number(data.get("priority")), difficulty: Number(data.get("difficulty")),
        }),
      });
      setTasks((current) => [...current, task].sort((a, b) => a.dueAt.localeCompare(b.dueAt)));
      setShowTaskForm(false);
      setNotice("Task added. Regenerate when you want it placed into your week.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to add task");
    }
  };

  const createCommitment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await request("/commitments", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          category: data.get("category"),
          startAt: new Date(String(data.get("startAt"))),
          endAt: new Date(String(data.get("endAt"))),
        }),
      });
      setShowCommitmentForm(false);
      setNotice("Fixed time protected. Regenerate to flow tasks around it.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to add commitment",
      );
    }
  };

  const updatePreferences = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const current = session.user.preferences;
    try {
      await request<UserPreferences>("/preferences", {
        method: "PUT",
        body: JSON.stringify({
          timezone: current.timezone,
          dayStart: data.get("dayStart"),
          dayEnd: data.get("dayEnd"),
          focusSessionMinutes: Number(data.get("focusSessionMinutes")),
          shortBreakMinutes: Number(data.get("shortBreakMinutes")),
          preferredStudyTime: data.get("preferredStudyTime"),
          energyByTime: current.energyByTime,
          exerciseMinutesPerWeek: Number(
            data.get("exerciseMinutesPerWeek"),
          ),
          leisureMinutesPerDay: Number(data.get("leisureMinutesPerDay")),
          autoScheduleLifestyle:
            data.get("autoScheduleLifestyle") === "on",
        }),
      });
      setShowPreferences(false);
      setNotice("Preferences saved. Your next plan will use the new rhythm.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to save preferences",
      );
    }
  };

  const setBlockComplete = async (blockId: string) => {
    if (!plan) return;
    const next = await request<Plan>(
      `/plans/${plan.id}/blocks/${blockId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify({ outcome: "completed", satisfaction: 4 }),
      },
    );
    setPlan(next);
    setNotice("Nice. FocusFlow will use that completion to improve future plans.");
  };

  const toggleBlockLock = async (block: ScheduleBlock) => {
    if (!plan) return;
    setPlan(
      await request<Plan>(`/plans/${plan.id}/blocks/${block.id}/lock`, {
        method: "PATCH",
        body: JSON.stringify({ locked: !block.locked }),
      }),
    );
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top"><Logo /><button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <nav className="sidebar-nav">
          <a className="active" href="#today"><LayoutDashboard size={18} /> Today</a>
          <a href="#plan"><CalendarDays size={18} /> My plan</a>
          <a href="#tasks"><ListTodo size={18} /> Tasks <span>{tasks.length}</span></a>
          <a href="#insights"><BarChart3 size={18} /> Insights</a>
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setShowPreferences(true)}><Settings size={18} /> Preferences</button>
          <button onClick={() => void logout()}><LogOut size={18} /> Sign out</button>
          <div className="user-chip"><span>{session.user.displayName[0]?.toUpperCase()}</span><div><strong>{session.user.displayName}</strong><small>{session.user.email}</small></div></div>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div>
            <span className="muted-label">{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now)}</span>
            <h1>{greeting}, {session.user.displayName.split(" ")[0]}.</h1>
          </div>
          <button className="button button-accent generate-button" onClick={() => void generatePlan()} disabled={generating}><Sparkles size={16} /> {generating ? "Planning…" : "Plan my week"}</button>
        </header>
        {notice && <div className="dashboard-notice"><Sparkles size={15} /> {notice}</div>}
        <section className="metric-grid" id="today">
          <article><span className="metric-icon mint"><Clock3 size={19} /></span><div><small>FOCUS TODAY</small><strong>{Math.round(focusMinutes / 6) / 10}<em>h</em></strong></div><span className="metric-note">Balanced load</span></article>
          <article><span className="metric-icon apricot"><ListTodo size={19} /></span><div><small>OPEN TASKS</small><strong>{tasks.length}</strong></div><span className="metric-note">{tasks.filter((task) => new Date(task.dueAt).getTime() < now.getTime() + 3 * 86_400_000).length} due soon</span></article>
          <article><span className="metric-icon violet"><CheckCircle2 size={19} /></span><div><small>NEXT UP</small><strong className="next-title">{nextBlock?.title ?? "Clear space"}</strong></div><span className="metric-note">{nextBlock ? formatTime(nextBlock.startAt) : "Nothing scheduled"}</span></article>
        </section>
        <div className="dashboard-columns">
          <section className="panel timeline-panel" id="plan">
            <div className="panel-heading">
              <div><span className="muted-label">YOUR RHYTHM</span><h2>Today’s flow</h2></div>
              <button className="text-button" onClick={() => setShowCommitmentForm(true)}>Add fixed time <ChevronRight size={16} /></button>
            </div>
            {loading ? <div className="empty-state">Loading your day…</div> : todayBlocks.length ? (
              <div className="timeline">{todayBlocks.map((block) => (
                <div className="timeline-row" key={block.id}>
                  <time>{formatTime(block.startAt)}</time><span className={`timeline-dot ${blockClass[block.type]}`} />
                  <div className={`timeline-block ${blockClass[block.type]}`}>
                    <div><strong>{block.title}</strong><small>{block.rationale}</small></div>
                    <div className="block-actions">
                      <span>{Math.round((new Date(block.endAt).getTime() - new Date(block.startAt).getTime()) / 60_000)} min</span>
                      <button onClick={() => void toggleBlockLock(block)} aria-label={block.locked ? "Unlock block" : "Lock block"}>{block.locked ? <Lock size={13} /> : <Unlock size={13} />}</button>
                      {block.status === "planned" && <button onClick={() => void setBlockComplete(block.id)} aria-label="Mark complete"><Check size={14} /></button>}
                    </div>
                  </div>
                </div>
              ))}</div>
            ) : (
              <div className="empty-state rich"><Sparkles size={24} /><h3>Your day is still open.</h3><p>Add a task, then let FocusFlow shape your first balanced week.</p><button className="button button-dark button-small" onClick={() => void generatePlan()}>Generate my plan</button></div>
            )}
          </section>
          <section className="panel tasks-panel" id="tasks">
            <div className="panel-heading"><div><span className="muted-label">DEADLINES</span><h2>Open tasks</h2></div><button className="icon-button" onClick={() => setShowTaskForm(true)} aria-label="Add task"><Plus size={19} /></button></div>
            <div className="task-list">
              {tasks.slice(0, 6).map((task) => <div className="task-row" key={task.id}><Circle size={17} /><div><strong>{task.title}</strong><small>{task.category} · {task.remainingMinutes} min</small></div><span className={task.priority >= 4 ? "urgent" : ""}>{formatDue(task.dueAt)}</span></div>)}
              {!tasks.length && <div className="empty-tasks">No open tasks. That’s a good kind of quiet.</div>}
            </div>
            <button className="add-task-row" onClick={() => setShowTaskForm(true)}><Plus size={16} /> Add a task</button>
          </section>
        </div>
      </main>
      {showTaskForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowTaskForm(false)}>
          <form className="task-modal" onSubmit={createTask} onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-heading"><div><span className="muted-label">NEW PRIORITY</span><h2>Add a task</h2></div><button type="button" className="icon-button" onClick={() => setShowTaskForm(false)}><X size={18} /></button></div>
            <label>Task name<input name="title" required placeholder="e.g. Finish database chapter" /></label>
            <div className="form-grid">
              <label>Category<input name="category" defaultValue="Study" /></label>
              <label>Due date<input name="dueAt" type="datetime-local" required /></label>
              <label>Estimated minutes<input name="estimatedMinutes" type="number" min="15" max="2400" defaultValue="60" required /></label>
              <label>Priority<select name="priority" defaultValue="3"><option value="1">1 · Low</option><option value="2">2</option><option value="3">3 · Normal</option><option value="4">4</option><option value="5">5 · Critical</option></select></label>
              <label>Difficulty<select name="difficulty" defaultValue="3"><option value="1">1 · Easy</option><option value="2">2</option><option value="3">3 · Moderate</option><option value="4">4</option><option value="5">5 · Deep work</option></select></label>
            </div>
            <button className="button button-dark button-full"><Check size={17} /> Add to FocusFlow</button>
          </form>
        </div>
      )}
      {showCommitmentForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowCommitmentForm(false)}>
          <form className="task-modal" onSubmit={createCommitment} onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-heading"><div><span className="muted-label">PROTECT YOUR TIME</span><h2>Add a commitment</h2></div><button type="button" className="icon-button" onClick={() => setShowCommitmentForm(false)}><X size={18} /></button></div>
            <label>Title<input name="title" required placeholder="Class, work, appointment…" /></label>
            <div className="form-grid">
              <label>Category<input name="category" defaultValue="Commitment" /></label>
              <span />
              <label>Starts<input name="startAt" type="datetime-local" required /></label>
              <label>Ends<input name="endAt" type="datetime-local" required /></label>
            </div>
            <button className="button button-dark button-full"><Lock size={17} /> Protect this time</button>
          </form>
        </div>
      )}
      {showPreferences && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowPreferences(false)}>
          <form className="task-modal" onSubmit={updatePreferences} onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-heading"><div><span className="muted-label">YOUR RHYTHM</span><h2>Planning preferences</h2></div><button type="button" className="icon-button" onClick={() => setShowPreferences(false)}><X size={18} /></button></div>
            <div className="form-grid">
              <label>Day starts<input name="dayStart" type="time" defaultValue={session.user.preferences.dayStart} required /></label>
              <label>Day ends<input name="dayEnd" type="time" defaultValue={session.user.preferences.dayEnd} required /></label>
              <label>Focus session<input name="focusSessionMinutes" type="number" min="20" max="120" defaultValue={session.user.preferences.focusSessionMinutes} required /></label>
              <label>Short break<input name="shortBreakMinutes" type="number" min="5" max="30" defaultValue={session.user.preferences.shortBreakMinutes} required /></label>
              <label>Strongest study time<select name="preferredStudyTime" defaultValue={session.user.preferences.preferredStudyTime}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label>
              <label>Exercise min/week<input name="exerciseMinutesPerWeek" type="number" min="0" max="840" defaultValue={session.user.preferences.exerciseMinutesPerWeek} required /></label>
              <label>Leisure min/day<input name="leisureMinutesPerDay" type="number" min="0" max="240" defaultValue={session.user.preferences.leisureMinutesPerDay} required /></label>
            </div>
            <label className="checkbox-label"><input name="autoScheduleLifestyle" type="checkbox" defaultChecked={session.user.preferences.autoScheduleLifestyle} /> Automatically protect meals, movement, breaks and leisure</label>
            <button className="button button-dark button-full"><Check size={17} /> Save my rhythm</button>
          </form>
        </div>
      )}
    </div>
  );
};
