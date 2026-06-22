import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// Topics Lisa can talk about. Edit these freely.
// ─────────────────────────────────────────────────────────────
const TOPICS = [
  "Why stretching matters more after 40",
  "“I’m just not flexible” — the real story",
  "What assisted stretching actually feels like",
  "Morning stiffness and what it’s telling you",
  "Why your foam roller isn’t enough",
  "Stretching for deeper sleep",
  "The hip and lower-back connection",
  "What to expect at your first session",
  "Getting your range of motion back",
  "Staying active and mobile as you age",
];

// ─────────────────────────────────────────────────────────────
// The writer's instructions. This is what makes it sound like Lisa.
// ─────────────────────────────────────────────────────────────
const SYSTEM = `You are the in-house video script writer for Pro Stretch Flex, a private, appointment-only assisted Thai stretching studio in Worthington, Ohio, owned and run by Lisa.

Write ONE short video script that Lisa will read straight to camera in a single take, about 90 seconds long.

Her voice: warm, grounded, knowledgeable, and plain-spoken. She talks to active adults roughly 40 to 75 who want to keep moving freely and feel like themselves. She is encouraging, never hypey, never salesy. No jargon. The studio's promise is simple: move freely again, feel like yourself again.

Shape of the script:
- Open with one real, recognizable feeling the viewer has (a stiff lower back getting out of bed, hips that don't turn like they used to, "I used to be able to touch my toes"). Make them feel seen in the first sentence.
- Give one genuinely useful insight or reframe. Teach something true. Earn the watch.
- Close with a soft, human invitation to come in for a session at the studio. Warm, not pushy.

Hard rules:
- Output ONLY the words Lisa speaks. Nothing else.
- No scene directions, no labels, no headings, no "[pause]", no markdown, no hashtags, no emojis.
- Write in first person as Lisa.
- Short, natural sentences she can read in one breath.
- Target 200 to 230 words total.
- If extra context is provided, weave it in naturally without forcing it.`;

const WPM = 150; // spoken-words-per-minute estimate for the timer

export default function App() {
  const [screen, setScreen] = useState("home"); // home | review | teleprompter
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [script, setScript] = useState("");
  const [usedTopic, setUsedTopic] = useState("");

  async function writeScript() {
    if (!topic) {
      setError("Pick something to talk about first.");
      return;
    }
    setError("");
    setLoading(true);

    const userMessage =
      `Write the script for this topic: "${topic}".` +
      (note.trim() ? `\n\nExtra context from Lisa: ${note.trim()}` : "");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM, userMessage }),
      });
      const data = await res.json();
      if (!res.ok || !data.script) {
        throw new Error(data.error || "no script");
      }
      setScript(data.script);
      setUsedTopic(topic);
      setScreen("review");
    } catch {
      setError("That didn’t come through. Check the connection and tap Write my script again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Styles />
      {screen === "home" && (
        <Home
          topic={topic}
          setTopic={setTopic}
          note={note}
          setNote={setNote}
          loading={loading}
          error={error}
          onWrite={writeScript}
        />
      )}
      {screen === "review" && (
        <Review
          topic={usedTopic}
          script={script}
          onRead={() => setScreen("teleprompter")}
          onAgain={() => {
            setScreen("home");
          }}
        />
      )}
      {screen === "teleprompter" && (
        <Teleprompter script={script} onExit={() => setScreen("review")} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Home: pick a topic, add an optional note, write the script.
// ─────────────────────────────────────────────────────────────
function Home({ topic, setTopic, note, setNote, loading, error, onWrite }) {
  return (
    <div className="page">
      <div className="wrap">
        <div className="eyebrow">Pro Stretch Flex · Studio</div>
        <h1 className="h1">
          Today’s script,
          <br />
          ready in one take.
        </h1>
        <p className="lead">
          Pick what you want to talk about. The studio writes the words. You read
          them straight to camera.
        </p>

        <div className="label">What are we talking about?</div>
        <div className="topics">
          {TOPICS.map((t) => (
            <button
              key={t}
              className={"chip" + (topic === t ? " chip-on" : "")}
              onClick={() => setTopic(t)}
              aria-pressed={topic === t}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="label">Anything specific? (optional)</div>
        <textarea
          className="note"
          rows={3}
          placeholder="A client win, a seasonal tip, an offer to mention…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && <div className="error">{error}</div>}

        <button className="btn-primary" onClick={onWrite} disabled={loading}>
          {loading ? "Writing your script…" : "Write my script"}
        </button>

        <div className="footer">Move freely again. Feel like yourself again.</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Review: read the draft, then send it to the teleprompter.
// ─────────────────────────────────────────────────────────────
function Review({ topic, script, onRead, onAgain }) {
  const [copied, setCopied] = useState(false);
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  const secs = Math.round((words / WPM) * 60);

  function copy() {
    navigator.clipboard?.writeText(script).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {}
    );
  }

  return (
    <div className="page">
      <div className="wrap">
        <div className="eyebrow">Your script · {topic}</div>
        <div className="meta">
          {words} words · about {secs}s to read
        </div>

        <div className="script-card">
          {script.split(/\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <button className="btn-primary" onClick={onRead}>
          Read it to camera
        </button>
        <div className="row">
          <button className="btn-ghost" onClick={onAgain}>
            Write another
          </button>
          <button className="btn-ghost" onClick={copy}>
            {copied ? "Copied" : "Copy text"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Teleprompter: large, slow-scrolling text for one-take recording.
// ─────────────────────────────────────────────────────────────
const SIZES = [30, 40, 52, 66]; // font sizes in px

function Teleprompter({ script, onExit }) {
  const stageRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3); // 1..5
  const [sizeIdx, setSizeIdx] = useState(1);
  const [countdown, setCountdown] = useState(0);

  const playingRef = useRef(false);
  const speedRef = useRef(3);
  const rafRef = useRef(0);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Smooth, frame-rate-independent auto-scroll.
  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      const el = stageRef.current;
      if (el && playingRef.current) {
        const pxPerSec = 18 * speedRef.current; // level 3 ≈ 54 px/s
        el.scrollTop += (pxPerSec * dt) / 1000;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          playingRef.current = false;
          setPlaying(false);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function toggle() {
    if (countdown > 0) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    const el = stageRef.current;
    const atTop = !el || el.scrollTop < 8;
    if (atTop) {
      let n = 3;
      setCountdown(n);
      const iv = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearInterval(iv);
          setCountdown(0);
          setPlaying(true);
        } else {
          setCountdown(n);
        }
      }, 800);
    } else {
      setPlaying(true);
    }
  }

  function restart() {
    const el = stageRef.current;
    if (el) el.scrollTop = 0;
    setPlaying(false);
    setCountdown(0);
  }

  const fontPx = SIZES[sizeIdx];

  return (
    <div className="tp">
      <div className="tp-top">
        <button className="tp-x" onClick={onExit}>
          ‹ Back
        </button>
        <div className="tp-size">
          <button onClick={() => setSizeIdx((i) => Math.max(0, i - 1))}>A−</button>
          <button onClick={() => setSizeIdx((i) => Math.min(SIZES.length - 1, i + 1))}>
            A+
          </button>
        </div>
      </div>

      <div className="tp-band" />

      <div className="tp-stage" ref={stageRef} onClick={toggle}>
        <div className="tp-text" style={{ fontSize: fontPx + "px" }}>
          {script.split(/\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      {countdown > 0 && (
        <div className="tp-count">
          <span>{countdown}</span>
        </div>
      )}

      {!playing && countdown === 0 && (
        <div className="tp-hint">Tap anywhere to start · tap again to pause</div>
      )}

      <div className="tp-controls">
        <button className="tp-btn" onClick={restart}>
          Restart
        </button>
        <button
          className="tp-btn"
          onClick={() => setSpeed((s) => Math.max(1, s - 1))}
        >
          Slower
        </button>
        <button className="tp-play" onClick={toggle}>
          {playing ? "Pause" : "Start"}
        </button>
        <button
          className="tp-btn"
          onClick={() => setSpeed((s) => Math.min(5, s + 1))}
        >
          Faster
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles (scoped via class names).
// ─────────────────────────────────────────────────────────────
function Styles() {
  return (
    <style>{`
    .page {
      min-height: 100%;
      display: flex;
      justify-content: center;
      padding: 40px 22px 56px;
    }
    .wrap { width: 100%; max-width: 540px; }

    .eyebrow {
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--terra-dk);
      font-weight: 600;
    }
    .h1 {
      font-family: var(--serif);
      font-weight: 500;
      font-size: clamp(34px, 9vw, 52px);
      line-height: 1.02;
      letter-spacing: -0.01em;
      color: var(--brown);
      margin: 14px 0 16px;
    }
    .lead {
      font-size: 16px;
      line-height: 1.55;
      color: var(--brown-mid);
      max-width: 42ch;
    }

    .label {
      font-size: 13px;
      font-weight: 600;
      color: var(--brown-lt);
      margin: 30px 0 12px;
    }

    .topics { display: flex; flex-wrap: wrap; gap: 9px; }
    .chip {
      border: 1px solid var(--sand-dark);
      background: var(--white);
      color: var(--brown-mid);
      border-radius: 999px;
      padding: 11px 15px;
      font-size: 14px;
      line-height: 1.2;
      transition: transform 0.08s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .chip:hover { border-color: var(--terra-lt); }
    .chip:active { transform: scale(0.98); }
    .chip-on {
      background: var(--terra);
      border-color: var(--terra);
      color: #fff;
      font-weight: 500;
    }

    .note {
      width: 100%;
      border: 1px solid var(--sand-dark);
      background: var(--white);
      border-radius: 14px;
      padding: 14px 16px;
      font-size: 15px;
      line-height: 1.5;
      color: var(--brown);
      resize: vertical;
    }
    .note:focus { outline: 2px solid var(--terra-lt); outline-offset: 1px; border-color: transparent; }
    .note::placeholder { color: var(--brown-lt); opacity: 0.7; }

    .error {
      margin-top: 18px;
      background: #fbe5dc;
      border: 1px solid var(--terra-lt);
      color: var(--terra-dk);
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 14px;
    }

    .btn-primary {
      width: 100%;
      margin-top: 26px;
      background: var(--brown);
      color: var(--cream);
      border-radius: 14px;
      padding: 17px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.01em;
      transition: transform 0.08s ease, background 0.15s ease;
    }
    .btn-primary:hover { background: var(--brown-mid); }
    .btn-primary:active { transform: scale(0.99); }
    .btn-primary:disabled { opacity: 0.7; cursor: default; }

    .row { display: flex; gap: 12px; margin-top: 12px; }
    .btn-ghost {
      flex: 1;
      border: 1px solid var(--sand-dark);
      background: transparent;
      color: var(--brown-mid);
      border-radius: 14px;
      padding: 14px;
      font-size: 15px;
      font-weight: 500;
    }
    .btn-ghost:hover { border-color: var(--terra-lt); color: var(--terra-dk); }

    .footer {
      margin-top: 40px;
      font-family: var(--serif);
      font-style: italic;
      font-size: 15px;
      color: var(--brown-lt);
    }

    .meta { font-size: 13px; color: var(--brown-lt); margin: 8px 0 18px; }

    .script-card {
      background: var(--white);
      border: 1px solid var(--sand);
      border-radius: 18px;
      padding: 26px 24px;
      box-shadow: 0 1px 0 rgba(44,31,20,0.04);
    }
    .script-card p {
      font-family: var(--serif);
      font-size: 19px;
      line-height: 1.62;
      color: var(--brown);
      margin-bottom: 16px;
    }
    .script-card p:last-child { margin-bottom: 0; }

    /* ── Teleprompter ── */
    .tp {
      position: fixed;
      inset: 0;
      background: var(--cream);
      display: flex;
      flex-direction: column;
    }
    .tp-top {
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 3;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 18px;
      background: linear-gradient(var(--cream), rgba(245,240,232,0));
    }
    .tp-x { font-size: 16px; font-weight: 600; color: var(--brown-mid); padding: 6px 4px; }
    .tp-size { display: flex; gap: 8px; }
    .tp-size button {
      width: 44px; height: 36px;
      border-radius: 10px;
      border: 1px solid var(--sand-dark);
      background: var(--white);
      color: var(--brown-mid);
      font-size: 14px; font-weight: 600;
    }

    .tp-band {
      position: absolute;
      top: 50%; left: 0; right: 0;
      height: 120px;
      transform: translateY(-50%);
      background: rgba(193,122,84,0.07);
      border-top: 1px solid rgba(193,122,84,0.18);
      border-bottom: 1px solid rgba(193,122,84,0.18);
      z-index: 1;
      pointer-events: none;
    }

    .tp-stage {
      position: absolute;
      inset: 0;
      overflow-y: auto;
      z-index: 2;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .tp-stage::-webkit-scrollbar { display: none; }
    .tp-text {
      font-family: var(--serif);
      font-weight: 500;
      line-height: 1.5;
      color: var(--brown);
      text-align: center;
      padding: 60vh 26px 70vh;
      max-width: 760px;
      margin: 0 auto;
    }
    .tp-text p { margin-bottom: 0.7em; }

    .tp-count {
      position: absolute;
      inset: 0;
      z-index: 4;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(245,240,232,0.86);
      pointer-events: none;
    }
    .tp-count span {
      font-family: var(--serif);
      font-size: 140px;
      font-weight: 500;
      color: var(--terra);
    }

    .tp-hint {
      position: absolute;
      bottom: 96px; left: 0; right: 0;
      z-index: 3;
      text-align: center;
      font-size: 13px;
      color: var(--brown-lt);
      pointer-events: none;
    }

    .tp-controls {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 16px calc(16px + env(safe-area-inset-bottom));
      background: linear-gradient(rgba(245,240,232,0), var(--cream) 38%);
    }
    .tp-btn {
      border: 1px solid var(--sand-dark);
      background: var(--white);
      color: var(--brown-mid);
      border-radius: 12px;
      padding: 13px 14px;
      font-size: 14px;
      font-weight: 600;
    }
    .tp-play {
      background: var(--terra);
      color: #fff;
      border-radius: 12px;
      padding: 14px 30px;
      font-size: 16px;
      font-weight: 700;
      min-width: 120px;
    }
    .tp-play:active { transform: scale(0.98); }
    `}</style>
  );
}
