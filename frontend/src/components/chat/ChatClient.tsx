"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api";

const ADVISORY_POLL_MS = 30_000;

const MOCK_USERS = [
  { phone: "+16195550001", name: "Maria",  zip: "92103" },
  { phone: "+16195550002", name: "James",  zip: "92103" },
  { phone: "+16195550003", name: "Linda",  zip: "92104" },
  { phone: "+16195550004", name: "Carlos", zip: "92104" },
  { phone: "+16195550005", name: "Aisha",  zip: "92105" },
];

const EXAMPLE_PROMPTS = [
  "Where is the nearest open shelter?",
  "What is the current evacuation status for my area?",
  "I need a ride to the shelter, I don't have a car",
  "My neighbor has a medical device that needs power",
  "I'm trapped in my house, smoke everywhere, can't get out",
];

type DispatchInfo = {
  status: string;
  incident_id: string;
  emergency_type: string;
  details: string;
  user_phone: string;
  position_logged: { lat: number; lon: number; source: string };
  dispatched_units: string[];
  eta_minutes: number;
  dispatched_at: string;
  message: string;
};

type SmsResponse = {
  reply: string;
  is_emergency: boolean;
  dispatch: DispatchInfo | null;
};

type Advisory = {
  advisory: string;
  reasoning: string;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | string;
  generated_at: string;
};

type ChatTurn = {
  id: string;
  role: "user" | "assistant" | "system" | "advisory";
  text: string;
  dispatch?: DispatchInfo;
  advisory?: Advisory;
  ts: number;
  delivered?: boolean;
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ── Inline icons ───────────────────────────────────────────────────────────
function ChatIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function BotIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="8" width="18" height="12" rx="3" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
      <circle cx="9" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}
function LightbulbIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
    </svg>
  );
}
function SendIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M2.5 11.3 21 3.5a.6.6 0 0 1 .8.8L14 22.8a.6.6 0 0 1-1.1.06l-3.4-7.27-7.27-3.4a.6.6 0 0 1 .07-1.1z" />
    </svg>
  );
}
function CheckCheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 13l4 4L14 9" />
      <path d="M9 13l4 4L22 7" />
    </svg>
  );
}
function ChevronDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Advisory bubble (live recommendations from backend) ────────────────────
function riskTone(risk: string): { dot: string; chip: string; border: string; bg: string; text: string } {
  const r = risk.toUpperCase();
  if (r === "CRITICAL")
    return { dot: "bg-red-500", chip: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200", border: "border-red-300 dark:border-red-800", bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-900 dark:text-red-100" };
  if (r === "HIGH")
    return { dot: "bg-orange-500", chip: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200", border: "border-orange-300 dark:border-orange-800", bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-900 dark:text-orange-100" };
  if (r === "MODERATE")
    return { dot: "bg-amber-500", chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200", border: "border-amber-300 dark:border-amber-800", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-900 dark:text-amber-100" };
  return { dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200", border: "border-emerald-300 dark:border-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-900 dark:text-emerald-100" };
}

function AdvisoryBubble({ advisory }: { advisory: Advisory }) {
  const tone = riskTone(advisory.risk_level);
  return (
    <div className={`rounded-2xl border ${tone.border} ${tone.bg} px-4 py-3 ${tone.text}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-2 w-2 rounded-full ${tone.dot}`} />
        <span className="text-[11px] font-bold uppercase tracking-wider">Live advisory</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.chip}`}>
          {advisory.risk_level}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold">{advisory.advisory}</p>
      <p className="mt-1 text-xs opacity-80">{advisory.reasoning}</p>
    </div>
  );
}

// ── Dispatch banner (kept from emergency flow) ─────────────────────────────
function DispatchBanner({ dispatch }: { dispatch: DispatchInfo }) {
  return (
    <div className="mt-3 rounded-xl border-2 border-red-500 bg-red-50 p-4 dark:border-red-400 dark:bg-red-950/40">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
          Emergency Dispatched
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-red-900 dark:text-red-100">{dispatch.message}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-red-900 dark:text-red-100">
        <dt className="font-semibold">Incident</dt>
        <dd className="font-mono">{dispatch.incident_id}</dd>
        <dt className="font-semibold">Type</dt>
        <dd>{dispatch.emergency_type}</dd>
        <dt className="font-semibold">ETA</dt>
        <dd>{dispatch.eta_minutes} min</dd>
        <dt className="font-semibold">Units</dt>
        <dd>{dispatch.dispatched_units.join(", ")}</dd>
        <dt className="font-semibold">Position</dt>
        <dd className="font-mono">
          {dispatch.position_logged.lat.toFixed(4)}, {dispatch.position_logged.lon.toFixed(4)}
        </dd>
      </dl>
    </div>
  );
}

// ── Card wrapper ────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function ChatClient() {
  const [phone, setPhone] = useState(MOCK_USERS[0]!.phone);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [sending, setSending] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  const lastAdvisoryAtRef = useRef<string | null>(null);

  const activeUser = useMemo(
    () => MOCK_USERS.find((u) => u.phone === phone) ?? MOCK_USERS[0]!,
    [phone],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns]);

  // Close examples popover on outside click
  useEffect(() => {
    if (!examplesOpen) return;
    function onClick(e: MouseEvent) {
      if (examplesRef.current && !examplesRef.current.contains(e.target as Node)) {
        setExamplesOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [examplesOpen]);

  // Live advisory polling — push new recommendations into the chat as they arrive.
  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const adv = await apiGet<Advisory>("/agents/recommendations/latest", {
          revalidate: 0,
        });
        if (cancelled) return;
        if (!adv?.generated_at) return;
        if (lastAdvisoryAtRef.current === adv.generated_at) return;
        lastAdvisoryAtRef.current = adv.generated_at;
        setTurns((prev) => [
          ...prev,
          {
            id: `adv-${adv.generated_at}`,
            role: "advisory",
            text: adv.advisory,
            advisory: adv,
            ts: Date.parse(adv.generated_at) || Date.now(),
          },
        ]);
      } catch {
        // 404 (no advisory yet) or transient error — silent retry
      }
    }

    void tick();
    const id = window.setInterval(tick, ADVISORY_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  async function send(messageOverride?: string) {
    const message = (messageOverride ?? input).trim();
    if (!message || sending) return;

    const userId = `u-${Date.now()}`;
    const userTurn: ChatTurn = {
      id: userId,
      role: "user",
      text: message,
      ts: Date.now(),
      delivered: false,
    };
    setTurns((prev) => [...prev, userTurn]);
    setInput("");
    setSending(true);

    try {
      const res = await apiPost<SmsResponse>("/sms/inbound", { phone, message });
      setTurns((prev) =>
        prev
          .map((t) => (t.id === userId ? { ...t, delivered: true } : t))
          .concat({
            id: `a-${Date.now()}`,
            role: "assistant",
            text: res.reply,
            dispatch: res.dispatch ?? undefined,
            ts: Date.now(),
          }),
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `Backend error (${err.status}). Is the API running on ${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}?`
          : "Network error. Could not reach the help agent.";
      setTurns((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "system", text: msg, ts: Date.now() },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function pickExample(text: string) {
    setExamplesOpen(false);
    setInput(text);
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <ChatIcon />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Help chat</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Message a resident. The agent can detect emergencies and trigger a mock dispatch when needed.
            </p>
          </div>
          <div ref={examplesRef} className="relative">
            <button
              type="button"
              onClick={() => setExamplesOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800"
            >
              <LightbulbIcon />
              Try examples
            </button>
            {examplesOpen ? (
              <div className="absolute right-0 z-10 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <ul className="py-1">
                  {EXAMPLE_PROMPTS.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() => pickExample(p)}
                        className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Send-as card */}
      <Card className="px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="chat-send-as" className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Send as
          </label>
          <div className="relative">
            <select
              id="chat-send-as"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-72 appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {MOCK_USERS.map((u) => (
                <option key={u.phone} value={u.phone}>
                  {u.name} ({u.zip}) — {u.phone}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </Card>

      {/* Messages card */}
      <Card>
        <div
          ref={scrollRef}
          className="h-[420px] overflow-y-auto px-5 py-6"
        >
          <div className="mb-4 flex justify-center">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Today
            </span>
          </div>

          {turns.length === 0 ? (
            <p className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No messages yet. Send something as {activeUser.name} to test the help agent.
            </p>
          ) : (
            <ul className="space-y-4">
              {turns.map((t) => {
                if (t.role === "system") {
                  return (
                    <li key={t.id} className="flex justify-center">
                      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        {t.text}
                      </div>
                    </li>
                  );
                }
                if (t.role === "advisory" && t.advisory) {
                  return (
                    <li key={t.id} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                        <BotIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 max-w-[75%]">
                        <AdvisoryBubble advisory={t.advisory} />
                        <div className="mt-1 pl-1 text-xs text-slate-400 dark:text-slate-500">
                          {formatTime(t.ts)}
                        </div>
                      </div>
                    </li>
                  );
                }
                if (t.role === "user") {
                  return (
                    <li key={t.id} className="flex flex-col items-end">
                      <div className="max-w-[75%] rounded-2xl bg-blue-600 px-4 py-2.5 text-sm text-white shadow-sm">
                        <p className="whitespace-pre-wrap break-words">{t.text}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 pr-1 text-xs text-slate-400 dark:text-slate-500">
                        <span>{formatTime(t.ts)}</span>
                        {t.delivered ? (
                          <CheckCheckIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <CheckCheckIcon className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                    </li>
                  );
                }
                // assistant
                return (
                  <li key={t.id} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                      <BotIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 max-w-[75%]">
                      <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                        <p className="whitespace-pre-wrap break-words">{t.text}</p>
                      </div>
                      {t.dispatch ? <DispatchBanner dispatch={t.dispatch} /> : null}
                      <div className="mt-1 pl-1 text-xs text-slate-400 dark:text-slate-500">
                        {formatTime(t.ts)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {/* Input card */}
      <Card className="px-3 py-3">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type a message..."
            className="min-h-[40px] flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
            disabled={sending}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || input.trim().length === 0}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon />
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </Card>

      <p className="px-1 text-xs text-slate-500 dark:text-slate-400">
        The agent can detect emergencies and trigger a mock dispatch when appropriate.
      </p>
    </div>
  );
}
