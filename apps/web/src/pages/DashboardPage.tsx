import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  LayoutDashboard,
  ListTodo,
  Lock,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useAuth } from "../auth/AuthContext";
import { Navigate } from "../components/Link";
import { Logo } from "../components/Logo";
import type { Plan, ScheduleBlock, Task, UserPreferences } from "../types";

const formatTime = (date: string, clockFormat: "12h" | "24h") =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: clockFormat === "12h",
  }).format(new Date(date));
const formatDue = (date: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(date),
  );
const blockClass: Record<ScheduleBlock["type"], string> = {
  task: "focus",
  commitment: "commitment",
  exercise: "move",
  meal: "meal",
  break: "rest",
  leisure: "rest",
};
type DashboardView = "today" | "plan" | "tasks" | "insights";
const dashboardViews: DashboardView[] = ["today", "plan", "tasks", "insights"];
const recurrenceLabel: Record<Task["recurrence"], string> = {
  none: "",
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
};
const weekDays = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];
const minuteOptions = ["00", "15", "30", "45"];
const dateInputValue = (date: Date) => {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
};
const CALENDAR_HOUR_HEIGHT = 64;
const minutesSinceMidnight = (date: Date) =>
  date.getHours() * 60 + date.getMinutes();
const clockMinutes = (value: string) => {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
};
const calendarDates = (startAt: string, count = 7) => {
  const start = new Date(startAt);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};
const calendarDayLabel = (date: Date) =>
  new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
const calendarDateLabel = (date: Date) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    date,
  );

const ScheduleCalendar = ({
  blocks,
  dates,
  clockFormat,
  dayStart,
  dayEnd,
  week = false,
  onToggleLock,
  onComplete,
}: {
  blocks: ScheduleBlock[];
  dates: Date[];
  clockFormat: UserPreferences["clockFormat"];
  dayStart: string;
  dayEnd: string;
  week?: boolean;
  onToggleLock(block: ScheduleBlock): void;
  onComplete(blockId: string): void;
}) => {
  const blockStarts = blocks.map((block) =>
    minutesSinceMidnight(new Date(block.startAt)),
  );
  const blockEnds = blocks.map((block) =>
    minutesSinceMidnight(new Date(block.endAt)),
  );
  const startHour = Math.max(
    0,
    Math.floor(Math.min(clockMinutes(dayStart), ...blockStarts) / 60),
  );
  const endHour = Math.min(
    24,
    Math.max(
      startHour + 4,
      Math.ceil(Math.max(clockMinutes(dayEnd), ...blockEnds) / 60),
    ),
  );
  const hours = Array.from(
    { length: endHour - startHour },
    (_, index) => startHour + index,
  );
  const calendarHeight = (endHour - startHour) * CALENDAR_HOUR_HEIGHT;
  const now = new Date();
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(
    null,
  );
  const gridStyle = {
    "--calendar-days": dates.length,
    "--calendar-height": `${calendarHeight}px`,
    "--calendar-min-width":
      dates.length === 1 ? "500px" : dates.length <= 3 ? "720px" : "1080px",
  } as CSSProperties;
  const hourLabel = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      hour12: clockFormat === "12h",
    }).format(date);
  };

  return (
    <div
      className={`calendar-shell ${week ? "week-calendar" : "day-calendar"}`}
    >
      <div className="calendar-scroll">
        <div className="calendar-grid" style={gridStyle}>
          <div className="calendar-corner" aria-hidden="true" />
          <div className="calendar-day-headers">
            {dates.map((date) => {
              const today = date.toDateString() === now.toDateString();
              return (
                <div
                  className={`calendar-day-header ${today ? "today" : ""}`}
                  key={dateInputValue(date)}
                >
                  <span>{calendarDayLabel(date)}</span>
                  <strong>{date.getDate()}</strong>
                  <small>{calendarDateLabel(date)}</small>
                </div>
              );
            })}
          </div>
          <div className="calendar-time-axis">
            {hours.map((hour) => (
              <time
                key={hour}
                style={{ top: (hour - startHour) * CALENDAR_HOUR_HEIGHT }}
              >
                {hourLabel(hour)}
              </time>
            ))}
          </div>
          <div className="calendar-days">
            {dates.map((date) => {
              const dateKey = dateInputValue(date);
              const dayBlocks = blocks.filter(
                (block) => dateInputValue(new Date(block.startAt)) === dateKey,
              );
              const currentMinute = minutesSinceMidnight(now);
              const showNow =
                date.toDateString() === now.toDateString() &&
                currentMinute >= startHour * 60 &&
                currentMinute <= endHour * 60;

              return (
                <div className="calendar-day-column" key={dateKey}>
                  {hours.map((hour) => (
                    <span
                      className="calendar-hour-line"
                      key={hour}
                      style={{
                        top: (hour - startHour) * CALENDAR_HOUR_HEIGHT,
                      }}
                    />
                  ))}
                  {showNow && (
                    <span
                      className="calendar-now-line"
                      style={{
                        top:
                          ((currentMinute - startHour * 60) / 60) *
                          CALENDAR_HOUR_HEIGHT,
                      }}
                    >
                      <i />
                    </span>
                  )}
                  {dayBlocks.map((block) => {
                    const start = new Date(block.startAt);
                    const end = new Date(block.endAt);
                    const durationMinutes = Math.max(
                      1,
                      (end.getTime() - start.getTime()) / 60_000,
                    );
                    const top =
                      ((minutesSinceMidnight(start) - startHour * 60) / 60) *
                      CALENDAR_HOUR_HEIGHT;
                    const height = Math.max(
                      16,
                      (durationMinutes / 60) * CALENDAR_HOUR_HEIGHT - 2,
                    );
                    const short = durationMinutes < 30;

                    return (
                      <article
                        className={`calendar-event ${blockClass[block.type]} ${short ? "short" : ""} ${block.status === "completed" ? "completed" : ""} ${selectedBlock?.id === block.id ? "selected" : ""}`}
                        key={block.id}
                        style={{ top, height }}
                        title={block.rationale}
                        tabIndex={0}
                        onClick={() => setSelectedBlock(block)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedBlock(block);
                          }
                        }}
                      >
                        <div className="calendar-event-copy">
                          <strong>{block.title}</strong>
                          <time>
                            {formatTime(block.startAt, clockFormat)}–
                            {formatTime(block.endAt, clockFormat)}
                          </time>
                        </div>
                        <div className="calendar-event-actions">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleLock(block);
                            }}
                            aria-label={
                              block.locked ? "Unlock block" : "Lock block"
                            }
                          >
                            {block.locked ? (
                              <Lock size={12} />
                            ) : (
                              <Unlock size={12} />
                            )}
                          </button>
                          {block.status === "planned" && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onComplete(block.id);
                                setSelectedBlock(null);
                              }}
                              aria-label="Mark complete"
                            >
                              <Check size={13} />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {selectedBlock && (
        <aside className="calendar-selection" aria-live="polite">
          <span
            className={`calendar-selection-accent ${blockClass[selectedBlock.type]}`}
          />
          <div>
            <strong>{selectedBlock.title}</strong>
            <small>
              {formatTime(selectedBlock.startAt, clockFormat)}–
              {formatTime(selectedBlock.endAt, clockFormat)}
              {" · "}
              {Math.round(
                (new Date(selectedBlock.endAt).getTime() -
                  new Date(selectedBlock.startAt).getTime()) /
                  60_000,
              )}{" "}
              min
            </small>
            <p>{selectedBlock.rationale}</p>
          </div>
          <div className="calendar-selection-actions">
            <button onClick={() => onToggleLock(selectedBlock)}>
              {selectedBlock.locked ? <Unlock size={14} /> : <Lock size={14} />}
              {selectedBlock.locked ? "Unlock" : "Lock"}
            </button>
            {selectedBlock.status === "planned" && (
              <button
                onClick={() => {
                  onComplete(selectedBlock.id);
                  setSelectedBlock(null);
                }}
              >
                <Check size={14} /> Complete
              </button>
            )}
            <button
              className="calendar-selection-close"
              onClick={() => setSelectedBlock(null)}
              aria-label="Close details"
            >
              <X size={15} />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
const dateWithClockTime = (
  date: string,
  hour: FormDataEntryValue | null,
  minute: FormDataEntryValue | null,
  period: FormDataEntryValue | null,
  clockFormat: "12h" | "24h",
) => {
  const selectedHour = Number(hour);
  const hour24 =
    clockFormat === "24h"
      ? selectedHour
      : (selectedHour % 12) + (period === "PM" ? 12 : 0);
  return new Date(
    `${date}T${String(hour24).padStart(2, "0")}:${String(minute)}:00`,
  );
};

const ClockTimeField = ({
  prefix,
  label,
  defaultHour,
  defaultMinute,
  defaultPeriod,
  clockFormat,
}: {
  prefix: "start" | "end";
  label: string;
  defaultHour: string;
  defaultMinute: string;
  defaultPeriod: "AM" | "PM";
  clockFormat: "12h" | "24h";
}) => (
  <fieldset
    className={`meridiem-field ${clockFormat === "24h" ? "twenty-four-hour" : ""}`}
  >
    <legend>{label}</legend>
    <select
      name={`${prefix}Hour`}
      defaultValue={defaultHour}
      aria-label={`${label} hour`}
    >
      {Array.from({ length: clockFormat === "24h" ? 24 : 12 }, (_, index) =>
        String(clockFormat === "24h" ? index : index + 1),
      ).map((hour) => (
        <option value={hour} key={hour}>
          {clockFormat === "24h" ? hour.padStart(2, "0") : hour}
        </option>
      ))}
    </select>
    <span>:</span>
    <select
      name={`${prefix}Minute`}
      defaultValue={defaultMinute}
      aria-label={`${label} minute`}
    >
      {minuteOptions.map((minute) => (
        <option value={minute} key={minute}>
          {minute}
        </option>
      ))}
    </select>
    {clockFormat === "12h" && (
      <select
        name={`${prefix}Period`}
        defaultValue={defaultPeriod}
        aria-label={`${label} AM or PM`}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    )}
  </fieldset>
);

export const DashboardPage = () => {
  const { session, logout, request, savePreferences } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [commitmentRecurrence, setCommitmentRecurrence] = useState<
    "none" | "weekly"
  >("none");
  const [showPreferences, setShowPreferences] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [planViewDays, setPlanViewDays] = useState<1 | 3 | 7>(() =>
    window.matchMedia("(max-width: 760px)").matches ? 1 : 7,
  );
  const [planDateOffset, setPlanDateOffset] = useState(0);
  const [planHorizon, setPlanHorizon] = useState<7 | 14>(7);
  const [activeView, setActiveView] = useState<DashboardView>(() => {
    const hash = window.location.hash.slice(1) as DashboardView;
    return dashboardViews.includes(hash) ? hash : "today";
  });

  const openView = (view: DashboardView) => {
    setActiveView(view);
    setSidebarOpen(false);
    window.history.replaceState(
      null,
      "",
      view === "today" ? "/dashboard" : `/dashboard#${view}`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      setNotice(
        error instanceof Error ? error.message : "Unable to load your plan",
      );
    } finally {
      setLoading(false);
    }
  }, [request, session]);
  useEffect(() => {
    void load();
  }, [load]);
  if (!session) return <Navigate to="/login" replace />;

  const now = new Date();
  const clockFormat = session.user.preferences.clockFormat ?? "12h";
  const todayBlocks =
    plan?.blocks.filter(
      (block) => new Date(block.startAt).toDateString() === now.toDateString(),
    ) ?? [];
  const focusMinutes = todayBlocks
    .filter((block) => block.type === "task")
    .reduce(
      (sum, block) =>
        sum +
        (new Date(block.endAt).getTime() - new Date(block.startAt).getTime()) /
          60_000,
      0,
    );
  const nextBlock = todayBlocks.find((block) => new Date(block.endAt) > now);
  const planBlocks = plan?.blocks ?? [];
  const planDayCount = plan
    ? Math.max(
        1,
        Math.min(
          14,
          Math.ceil(
            (new Date(plan.rangeEnd).getTime() -
              new Date(plan.rangeStart).getTime()) /
              86_400_000,
          ),
        ),
      )
    : 0;
  const allPlanDates = plan ? calendarDates(plan.rangeStart, planDayCount) : [];
  const maxPlanOffset = Math.max(0, planDayCount - planViewDays);
  const planDates = allPlanDates.slice(
    Math.min(planDateOffset, maxPlanOffset),
    Math.min(planDateOffset, maxPlanOffset) + planViewDays,
  );
  const completedBlocks = planBlocks.filter(
    (block) => block.status === "completed",
  ).length;
  const lifestyleBlocks = planBlocks.filter((block) =>
    ["exercise", "meal", "break", "leisure"].includes(block.type),
  ).length;
  const scheduledFocusMinutes = planBlocks
    .filter((block) => block.type === "task")
    .reduce(
      (sum, block) =>
        sum +
        (new Date(block.endAt).getTime() - new Date(block.startAt).getTime()) /
          60_000,
      0,
    );

  const generatePlan = async () => {
    setGenerating(true);
    setNotice("");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + planHorizon);
    try {
      setPlan(
        await request<Plan>("/plans/generate", {
          method: "POST",
          body: JSON.stringify({ rangeStart: start, rangeEnd: end }),
        }),
      );
      setPlanDateOffset(0);
      setNotice(
        `Your next ${planHorizon} days have been rebuilt around your current priorities.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to generate a plan",
      );
    } finally {
      setGenerating(false);
    }
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const task = await request<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          category: data.get("category"),
          dueAt: new Date(String(data.get("dueAt"))),
          estimatedMinutes: Number(data.get("estimatedMinutes")),
          priority: Number(data.get("priority")),
          difficulty: Number(data.get("difficulty")),
          recurrence: data.get("recurrence"),
        }),
      });
      setTasks((current) =>
        [...current, task].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
      );
      setShowTaskForm(false);
      setNotice(
        "Task added. Regenerate when you want it placed into your week.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to add task");
    }
  };

  const createCommitment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const anchorDate = String(data.get("anchorDate"));
    const startAt = dateWithClockTime(
      anchorDate,
      data.get("startHour"),
      data.get("startMinute"),
      data.get("startPeriod"),
      clockFormat,
    );
    const endAt = dateWithClockTime(
      anchorDate,
      data.get("endHour"),
      data.get("endMinute"),
      data.get("endPeriod"),
      clockFormat,
    );
    const recurrenceDays = data.getAll("recurrenceDays").map(Number);
    if (endAt <= startAt) {
      setNotice("The end time must be later than the start time.");
      return;
    }
    if (commitmentRecurrence === "weekly" && !recurrenceDays.length) {
      setNotice("Choose at least one day for a weekly commitment.");
      return;
    }
    try {
      await request("/commitments", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          category: data.get("category"),
          startAt,
          endAt,
          recurrence: commitmentRecurrence,
          recurrenceDays,
        }),
      });
      setShowCommitmentForm(false);
      setCommitmentRecurrence("none");
      setNotice(
        commitmentRecurrence === "weekly"
          ? "Weekly time protected. Regenerate to flow tasks around it."
          : "Fixed time protected. Regenerate to flow tasks around it.",
      );
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
      const preferences = await request<UserPreferences>("/preferences", {
        method: "PUT",
        body: JSON.stringify({
          timezone: current.timezone,
          clockFormat: data.get("clockFormat"),
          dayStart: data.get("dayStart"),
          dayEnd: data.get("dayEnd"),
          focusSessionMinutes: Number(data.get("focusSessionMinutes")),
          shortBreakMinutes: Number(data.get("shortBreakMinutes")),
          preferredStudyTime: data.get("preferredStudyTime"),
          energyByTime: current.energyByTime,
          exerciseMinutesPerWeek: Number(data.get("exerciseMinutesPerWeek")),
          leisureMinutesPerDay: Number(data.get("leisureMinutesPerDay")),
          autoScheduleLifestyle: data.get("autoScheduleLifestyle") === "on",
        }),
      });
      savePreferences(preferences);
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
    setNotice(
      "Nice. FocusFlow will use that completion to improve future plans.",
    );
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
    return hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";
  })();

  return (
    <div className="dashboard-shell">
      <aside
        id="dashboard-sidebar"
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div className="sidebar-top">
          <Logo />
          <button
            type="button"
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          <button
            type="button"
            className={activeView === "today" ? "active" : ""}
            aria-current={activeView === "today" ? "page" : undefined}
            onClick={() => openView("today")}
          >
            <LayoutDashboard size={18} /> Today
          </button>
          <button
            type="button"
            className={activeView === "plan" ? "active" : ""}
            aria-current={activeView === "plan" ? "page" : undefined}
            onClick={() => openView("plan")}
          >
            <CalendarDays size={18} /> My plan
          </button>
          <button
            type="button"
            className={activeView === "tasks" ? "active" : ""}
            aria-current={activeView === "tasks" ? "page" : undefined}
            onClick={() => openView("tasks")}
          >
            <ListTodo size={18} /> Tasks <span>{tasks.length}</span>
          </button>
          <button
            type="button"
            className={activeView === "insights" ? "active" : ""}
            aria-current={activeView === "insights" ? "page" : undefined}
            onClick={() => openView("insights")}
          >
            <BarChart3 size={18} /> Insights
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setShowPreferences(true)}>
            <Settings size={18} /> Preferences
          </button>
          <button onClick={() => void logout()}>
            <LogOut size={18} /> Sign out
          </button>
          <div className="user-chip">
            <span>{session.user.displayName[0]?.toUpperCase()}</span>
            <div>
              <strong>{session.user.displayName}</strong>
              <small>{session.user.email}</small>
            </div>
          </div>
        </div>
      </aside>
      <button
        type="button"
        className={`sidebar-scrim ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close navigation"
        tabIndex={sidebarOpen ? 0 : -1}
      />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <button
            type="button"
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-controls="dashboard-sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu size={21} />
          </button>
          <div>
            <span className="muted-label">
              {new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              }).format(now)}
            </span>
            <h1>
              {greeting}, {session.user.displayName.split(" ")[0]}.
            </h1>
          </div>
          <button
            className="button button-accent generate-button"
            onClick={() => void generatePlan()}
            disabled={generating}
          >
            <Sparkles size={16} />{" "}
            {generating ? "Planning…" : `Plan ${planHorizon} days`}
          </button>
        </header>
        {notice && (
          <div className="dashboard-notice">
            <Sparkles size={15} /> {notice}
          </div>
        )}
        {activeView === "today" && (
          <>
            <section className="metric-grid">
              <article>
                <span className="metric-icon mint">
                  <Clock3 size={19} />
                </span>
                <div>
                  <small>FOCUS TODAY</small>
                  <strong>
                    {Math.round(focusMinutes / 6) / 10}
                    <em>h</em>
                  </strong>
                </div>
                <span className="metric-note">Balanced load</span>
              </article>
              <article>
                <span className="metric-icon apricot">
                  <ListTodo size={19} />
                </span>
                <div>
                  <small>OPEN TASKS</small>
                  <strong>{tasks.length}</strong>
                </div>
                <span className="metric-note">
                  {
                    tasks.filter(
                      (task) =>
                        new Date(task.dueAt).getTime() <
                        now.getTime() + 3 * 86_400_000,
                    ).length
                  }{" "}
                  due soon
                </span>
              </article>
              <article>
                <span className="metric-icon violet">
                  <CheckCircle2 size={19} />
                </span>
                <div>
                  <small>NEXT UP</small>
                  <strong className="next-title">
                    {nextBlock?.title ?? "Clear space"}
                  </strong>
                </div>
                <span className="metric-note">
                  {nextBlock
                    ? formatTime(nextBlock.startAt, clockFormat)
                    : "Nothing scheduled"}
                </span>
              </article>
            </section>
            <div className="dashboard-columns">
              <section className="panel timeline-panel">
                <div className="panel-heading">
                  <div>
                    <span className="muted-label">YOUR RHYTHM</span>
                    <h2>Today’s flow</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setShowCommitmentForm(true)}
                  >
                    Add fixed time <ChevronRight size={16} />
                  </button>
                </div>
                {loading ? (
                  <div className="empty-state">Loading your day…</div>
                ) : todayBlocks.length ? (
                  <ScheduleCalendar
                    blocks={todayBlocks}
                    dates={[now]}
                    clockFormat={clockFormat}
                    dayStart={session.user.preferences.dayStart}
                    dayEnd={session.user.preferences.dayEnd}
                    onComplete={(blockId) => void setBlockComplete(blockId)}
                    onToggleLock={(block) => void toggleBlockLock(block)}
                  />
                ) : (
                  <div className="empty-state rich">
                    <Sparkles size={24} />
                    <h3>Your day is still open.</h3>
                    <p>
                      Add a task, then let FocusFlow shape your first balanced
                      week.
                    </p>
                    <button
                      className="button button-dark button-small"
                      onClick={() => void generatePlan()}
                    >
                      Generate my plan
                    </button>
                  </div>
                )}
              </section>
              <section className="panel tasks-panel">
                <div className="panel-heading">
                  <div>
                    <span className="muted-label">DEADLINES</span>
                    <h2>Open tasks</h2>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => setShowTaskForm(true)}
                    aria-label="Add task"
                  >
                    <Plus size={19} />
                  </button>
                </div>
                <div className="task-list">
                  {tasks.slice(0, 6).map((task) => (
                    <div className="task-row" key={task.id}>
                      <Circle size={17} />
                      <div>
                        <strong>{task.title}</strong>
                        <small>
                          {task.category} · {task.remainingMinutes} min
                          {task.recurrence !== "none"
                            ? ` · ${recurrenceLabel[task.recurrence]}`
                            : ""}
                        </small>
                      </div>
                      <span className={task.priority >= 4 ? "urgent" : ""}>
                        {formatDue(task.dueAt)}
                      </span>
                    </div>
                  ))}
                  {!tasks.length && (
                    <div className="empty-tasks">
                      No open tasks. That’s a good kind of quiet.
                    </div>
                  )}
                </div>
                <button
                  className="add-task-row"
                  onClick={() => setShowTaskForm(true)}
                >
                  <Plus size={16} /> Add a task
                </button>
              </section>
            </div>
          </>
        )}
        {activeView === "plan" && (
          <section className="panel dashboard-view-panel">
            <div className="panel-heading">
              <div>
                <span className="muted-label">CALENDAR VIEW</span>
                <h2>My plan</h2>
              </div>
              <button
                className="text-button"
                onClick={() => setShowCommitmentForm(true)}
              >
                Add fixed time <ChevronRight size={16} />
              </button>
            </div>
            {loading ? (
              <div className="empty-state">Loading your plan…</div>
            ) : planBlocks.length ? (
              <>
                <div className="plan-calendar-toolbar">
                  <div className="calendar-nav">
                    <button
                      onClick={() =>
                        setPlanDateOffset((current) =>
                          Math.max(0, current - planViewDays),
                        )
                      }
                      disabled={planDateOffset <= 0}
                      aria-label="Previous dates"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      className="calendar-today-button"
                      onClick={() => {
                        const todayIndex = allPlanDates.findIndex(
                          (date) => date.toDateString() === now.toDateString(),
                        );
                        setPlanDateOffset(
                          todayIndex < 0
                            ? 0
                            : Math.min(todayIndex, maxPlanOffset),
                        );
                      }}
                    >
                      Today
                    </button>
                    <button
                      onClick={() =>
                        setPlanDateOffset((current) =>
                          Math.min(maxPlanOffset, current + planViewDays),
                        )
                      }
                      disabled={planDateOffset >= maxPlanOffset}
                      aria-label="Next dates"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <strong>
                      {planDates.length
                        ? `${calendarDateLabel(planDates[0]!)}${planDates.length > 1 ? ` – ${calendarDateLabel(planDates[planDates.length - 1]!)}` : ""}`
                        : ""}
                    </strong>
                  </div>
                  <div className="calendar-view-options">
                    <label>
                      Plan length
                      <select
                        value={planHorizon}
                        onChange={(event) =>
                          setPlanHorizon(Number(event.target.value) as 7 | 14)
                        }
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                      </select>
                    </label>
                    <div
                      className="calendar-view-switch"
                      aria-label="Calendar view"
                    >
                      {(
                        [
                          [1, "Day"],
                          [3, "3 days"],
                          [7, "Week"],
                        ] as const
                      ).map(([days, label]) => (
                        <button
                          className={planViewDays === days ? "active" : ""}
                          key={days}
                          onClick={() => {
                            setPlanViewDays(days);
                            setPlanDateOffset((current) =>
                              Math.min(
                                current,
                                Math.max(0, planDayCount - days),
                              ),
                            );
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <ScheduleCalendar
                  blocks={planBlocks}
                  dates={planDates}
                  clockFormat={clockFormat}
                  dayStart={session.user.preferences.dayStart}
                  dayEnd={session.user.preferences.dayEnd}
                  week={planViewDays > 1}
                  onComplete={(blockId) => void setBlockComplete(blockId)}
                  onToggleLock={(block) => void toggleBlockLock(block)}
                />
              </>
            ) : (
              <div className="empty-state rich">
                <CalendarDays size={24} />
                <h3>No plan yet.</h3>
                <p>
                  Add tasks and fixed commitments, then generate a balanced
                  week.
                </p>
                <button
                  className="button button-dark button-small"
                  onClick={() => void generatePlan()}
                >
                  Generate my plan
                </button>
              </div>
            )}
          </section>
        )}
        {activeView === "tasks" && (
          <section className="panel dashboard-view-panel">
            <div className="panel-heading">
              <div>
                <span className="muted-label">ALL OPEN WORK</span>
                <h2>Tasks</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowTaskForm(true)}
                aria-label="Add task"
              >
                <Plus size={19} />
              </button>
            </div>
            <div className="task-list expanded-task-list">
              {tasks.map((task) => (
                <div className="task-row" key={task.id}>
                  <Circle size={17} />
                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      {task.category} · {task.remainingMinutes} min · priority{" "}
                      {task.priority}
                      {task.recurrence !== "none"
                        ? ` · repeats ${recurrenceLabel[task.recurrence].toLowerCase()}`
                        : ""}
                    </small>
                  </div>
                  <span className={task.priority >= 4 ? "urgent" : ""}>
                    {formatDue(task.dueAt)}
                  </span>
                </div>
              ))}
              {!tasks.length && (
                <div className="empty-state rich">
                  <ListTodo size={24} />
                  <h3>No open tasks.</h3>
                  <p>
                    Add the work you want FocusFlow to place into your week.
                  </p>
                </div>
              )}
            </div>
            <button
              className="add-task-row"
              onClick={() => setShowTaskForm(true)}
            >
              <Plus size={16} /> Add a task
            </button>
          </section>
        )}
        {activeView === "insights" && (
          <>
            <section className="metric-grid">
              <article>
                <span className="metric-icon mint">
                  <Clock3 size={19} />
                </span>
                <div>
                  <small>PLANNED FOCUS</small>
                  <strong>
                    {Math.round(scheduledFocusMinutes / 6) / 10}
                    <em>h</em>
                  </strong>
                </div>
                <span className="metric-note">Current plan</span>
              </article>
              <article>
                <span className="metric-icon apricot">
                  <CheckCircle2 size={19} />
                </span>
                <div>
                  <small>BLOCKS COMPLETED</small>
                  <strong>{completedBlocks}</strong>
                </div>
                <span className="metric-note">
                  of {planBlocks.length} planned blocks
                </span>
              </article>
              <article>
                <span className="metric-icon violet">
                  <Sparkles size={19} />
                </span>
                <div>
                  <small>LIFESTYLE BLOCKS</small>
                  <strong>{lifestyleBlocks}</strong>
                </div>
                <span className="metric-note">Rest, meals and movement</span>
              </article>
            </section>
            <section className="panel dashboard-view-panel insight-explainer">
              <div>
                <span className="muted-label">LEARNING STATUS</span>
                <h2>
                  {plan
                    ? `Scheduler ${plan.modelVersion}`
                    : "No learning signal yet"}
                </h2>
              </div>
              <p>
                FocusFlow learns from schedule-block completions. Mark blocks
                complete in My plan and future schedules will favor the times of
                day where you follow through most often.
              </p>
            </section>
          </>
        )}
      </main>
      <nav className="mobile-bottom-nav" aria-label="Primary navigation">
        <button
          type="button"
          className={activeView === "today" ? "active" : ""}
          aria-current={activeView === "today" ? "page" : undefined}
          onClick={() => openView("today")}
        >
          <LayoutDashboard size={20} />
          <span>Today</span>
        </button>
        <button
          type="button"
          className={activeView === "plan" ? "active" : ""}
          aria-current={activeView === "plan" ? "page" : undefined}
          onClick={() => openView("plan")}
        >
          <CalendarDays size={20} />
          <span>Plan</span>
        </button>
        <button
          type="button"
          className={activeView === "tasks" ? "active" : ""}
          aria-current={activeView === "tasks" ? "page" : undefined}
          onClick={() => openView("tasks")}
        >
          <ListTodo size={20} />
          <span>Tasks</span>
          {tasks.length > 0 && <i>{tasks.length}</i>}
        </button>
        <button
          type="button"
          className={activeView === "insights" ? "active" : ""}
          aria-current={activeView === "insights" ? "page" : undefined}
          onClick={() => openView("insights")}
        >
          <BarChart3 size={20} />
          <span>Insights</span>
        </button>
      </nav>
      {showTaskForm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setShowTaskForm(false)}
        >
          <form
            className="task-modal"
            onSubmit={createTask}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="muted-label">NEW PRIORITY</span>
                <h2>Add a task</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowTaskForm(false)}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Task name
              <input
                name="title"
                required
                placeholder="e.g. Finish database chapter"
              />
            </label>
            <div className="form-grid">
              <label>
                Category
                <input name="category" defaultValue="Study" />
              </label>
              <label>
                First due date
                <input name="dueAt" type="datetime-local" required />
              </label>
              <label>
                Estimated minutes
                <input
                  name="estimatedMinutes"
                  type="number"
                  min="15"
                  max="2400"
                  defaultValue="60"
                  required
                />
              </label>
              <label>
                Repeat
                <select name="recurrence" defaultValue="none">
                  <option value="none">Never</option>
                  <option value="daily">Every day</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekly">Every week</option>
                </select>
              </label>
              <label>
                Priority
                <select name="priority" defaultValue="3">
                  <option value="1">1 · Low</option>
                  <option value="2">2</option>
                  <option value="3">3 · Normal</option>
                  <option value="4">4</option>
                  <option value="5">5 · Critical</option>
                </select>
              </label>
              <label>
                Difficulty
                <select name="difficulty" defaultValue="3">
                  <option value="1">1 · Easy</option>
                  <option value="2">2</option>
                  <option value="3">3 · Moderate</option>
                  <option value="4">4</option>
                  <option value="5">5 · Deep work</option>
                </select>
              </label>
            </div>
            <button className="button button-dark button-full">
              <Check size={17} /> Add to FocusFlow
            </button>
          </form>
        </div>
      )}
      {showCommitmentForm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setShowCommitmentForm(false)}
        >
          <form
            className="task-modal commitment-modal"
            onSubmit={createCommitment}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="muted-label">PROTECT YOUR TIME</span>
                <h2>Add a commitment</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowCommitmentForm(false)}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Title
              <input
                name="title"
                required
                placeholder="Class, work, appointment…"
              />
            </label>
            <div className="form-grid">
              <label>
                Category
                <select name="category" defaultValue="Commitment">
                  <option value="Commitment">Commitment</option>
                  <option value="Work">Work</option>
                  <option value="Study">Study</option>
                  <option value="Exercise">Exercise</option>
                  <option value="Appointment">Appointment</option>
                </select>
              </label>
              <label>
                Repeats
                <select
                  value={commitmentRecurrence}
                  onChange={(event) =>
                    setCommitmentRecurrence(
                      event.target.value as "none" | "weekly",
                    )
                  }
                >
                  <option value="none">Does not repeat</option>
                  <option value="weekly">Every week</option>
                </select>
              </label>
            </div>
            <label>
              {commitmentRecurrence === "weekly" ? "Starts on" : "Date"}
              <input
                name="anchorDate"
                type="date"
                defaultValue={dateInputValue(now)}
                required
              />
            </label>
            {commitmentRecurrence === "weekly" && (
              <fieldset className="repeat-days">
                <legend>Repeat on</legend>
                <div>
                  {weekDays.map((day) => (
                    <label className="day-option" key={day.value}>
                      <input
                        name="recurrenceDays"
                        type="checkbox"
                        value={day.value}
                        defaultChecked={day.value > 0 && day.value < 6}
                      />
                      <span>{day.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="time-grid">
              <ClockTimeField
                prefix="start"
                label="Starts"
                defaultHour="9"
                defaultMinute="00"
                defaultPeriod="AM"
                clockFormat={clockFormat}
              />
              <ClockTimeField
                prefix="end"
                label="Ends"
                defaultHour="10"
                defaultMinute="00"
                defaultPeriod="AM"
                clockFormat={clockFormat}
              />
            </div>
            <button className="button button-dark button-full">
              <Lock size={17} /> Protect this time
            </button>
          </form>
        </div>
      )}
      {showPreferences && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setShowPreferences(false)}
        >
          <form
            className="task-modal"
            onSubmit={updatePreferences}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="muted-label">YOUR RHYTHM</span>
                <h2>Planning preferences</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowPreferences(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Clock format
                <select name="clockFormat" defaultValue={clockFormat}>
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </select>
              </label>
              <label>
                Day starts
                <input
                  name="dayStart"
                  type="time"
                  defaultValue={session.user.preferences.dayStart}
                  required
                />
              </label>
              <label>
                Day ends
                <input
                  name="dayEnd"
                  type="time"
                  defaultValue={session.user.preferences.dayEnd}
                  required
                />
              </label>
              <label>
                Focus session
                <input
                  name="focusSessionMinutes"
                  type="number"
                  min="20"
                  max="120"
                  defaultValue={session.user.preferences.focusSessionMinutes}
                  required
                />
              </label>
              <label>
                Short break
                <input
                  name="shortBreakMinutes"
                  type="number"
                  min="5"
                  max="30"
                  defaultValue={session.user.preferences.shortBreakMinutes}
                  required
                />
              </label>
              <label>
                Strongest study time
                <select
                  name="preferredStudyTime"
                  defaultValue={session.user.preferences.preferredStudyTime}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </label>
              <label>
                Exercise min/week
                <input
                  name="exerciseMinutesPerWeek"
                  type="number"
                  min="0"
                  max="840"
                  defaultValue={session.user.preferences.exerciseMinutesPerWeek}
                  required
                />
              </label>
              <label>
                Leisure min/day
                <input
                  name="leisureMinutesPerDay"
                  type="number"
                  min="0"
                  max="240"
                  defaultValue={session.user.preferences.leisureMinutesPerDay}
                  required
                />
              </label>
            </div>
            <label className="checkbox-label">
              <input
                name="autoScheduleLifestyle"
                type="checkbox"
                defaultChecked={session.user.preferences.autoScheduleLifestyle}
              />{" "}
              Automatically protect meals, movement, breaks and leisure
            </label>
            <button className="button button-dark button-full">
              <Check size={17} /> Save my rhythm
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
