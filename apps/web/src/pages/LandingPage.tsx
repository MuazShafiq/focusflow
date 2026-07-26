import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Check,
  Sparkles,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { Link } from "../components/Link";

const previewBlocks = [
  { time: "08:00", title: "Data structures", meta: "High-energy focus", kind: "focus" },
  { time: "09:00", title: "Reset + breakfast", meta: "Protected recovery", kind: "rest" },
  { time: "10:30", title: "Project research", meta: "Deadline in 4 days", kind: "focus" },
  { time: "12:30", title: "Lunch", meta: "No tasks allowed", kind: "meal" },
  { time: "17:30", title: "Movement", meta: "Weekly goal · 3/5", kind: "move" },
];

export const LandingPage = () => (
  <div className="landing">
    <nav className="landing-nav page-width">
      <Logo />
      <div className="nav-actions">
        <Link className="text-link" to="/login">Sign in</Link>
        <Link className="button button-dark button-small" to="/register">
          Start planning <ArrowRight size={15} />
        </Link>
      </div>
    </nav>
    <main>
      <section className="hero page-width">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> Adaptive planning, built around you
          </div>
          <h1>Make room for <span>what matters.</span></h1>
          <p className="hero-lede">
            FocusFlow turns deadlines, energy patterns, and real life into a
            balanced plan you can actually follow.
          </p>
          <div className="hero-actions">
            <Link className="button button-accent" to="/register">
              Build my first week <ArrowRight size={17} />
            </Link>
            <span className="no-card"><Check size={15} /> Free. No card. No chaos.</span>
          </div>
          <div className="hero-proof">
            <span><BrainCircuit size={18} /> Learns your rhythm</span>
            <span><CalendarDays size={18} /> Protects your life</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Example adaptive schedule">
          <div className="visual-glow" />
          <div className="schedule-card">
            <div className="schedule-head">
              <div>
                <span className="muted-label">MONDAY · JUL 27</span>
                <h2>Your day, in balance.</h2>
              </div>
              <div className="balance-score"><strong>86</strong><span>balance</span></div>
            </div>
            <div className="schedule-progress"><span /></div>
            <div className="schedule-list">
              {previewBlocks.map((block) => (
                <div className="preview-block" key={block.time}>
                  <time>{block.time}</time>
                  <span className={`block-dot ${block.kind}`} />
                  <div><strong>{block.title}</strong><small>{block.meta}</small></div>
                </div>
              ))}
            </div>
            <div className="schedule-note">
              <Sparkles size={15} />
              Two deep-work blocks moved to your strongest morning window.
            </div>
          </div>
        </div>
      </section>
      <section className="principles page-width">
        <div><span>01</span><h3>Tell it the truth</h3><p>Add deadlines, commitments, sleep, breaks, and the life you want around your work.</p></div>
        <div><span>02</span><h3>Get a feasible plan</h3><p>Constraints keep every plan realistic. Nothing overlaps, and recovery is not an afterthought.</p></div>
        <div><span>03</span><h3>Let it learn</h3><p>Complete, skip, or move blocks. FocusFlow learns which plans work for you—not an average user.</p></div>
      </section>
    </main>
  </div>
);
