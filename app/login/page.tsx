"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Foam drifting up behind the card, and water beaded on the glass.
 *
 * Positions are fixed rather than random: this page is server-rendered, and
 * random values would differ between server and client and trip a hydration
 * mismatch. Hand-picked values also just look better than uniform noise.
 */
const BUBBLES = [
  { left: 4, size: 26, delay: 0, duration: 17, opacity: 0.22 },
  { left: 11, size: 13, delay: 5.5, duration: 13, opacity: 0.3 },
  { left: 18, size: 38, delay: 2.2, duration: 21, opacity: 0.16 },
  { left: 26, size: 9, delay: 8.5, duration: 11, opacity: 0.34 },
  { left: 33, size: 20, delay: 1.2, duration: 16, opacity: 0.24 },
  { left: 41, size: 31, delay: 6.8, duration: 19, opacity: 0.18 },
  { left: 49, size: 11, delay: 3.4, duration: 12, opacity: 0.32 },
  { left: 57, size: 24, delay: 9.6, duration: 18, opacity: 0.22 },
  { left: 64, size: 16, delay: 0.8, duration: 14, opacity: 0.28 },
  { left: 72, size: 35, delay: 4.6, duration: 22, opacity: 0.15 },
  { left: 80, size: 12, delay: 7.9, duration: 12.5, opacity: 0.31 },
  { left: 87, size: 22, delay: 2.9, duration: 17.5, opacity: 0.23 },
  { left: 94, size: 15, delay: 6.1, duration: 14.5, opacity: 0.27 },
];

/** Water sitting on the card, as it beads on a freshly waxed panel. */
const BEADS = [
  { top: 7, left: 8, size: 7, drip: false },
  { top: 13, left: 89, size: 10, drip: true, duration: 6.5, delay: 1.4 },
  { top: 31, left: 94, size: 5, drip: false },
  { top: 52, left: 4, size: 6, drip: true, duration: 7.8, delay: 3.6 },
  { top: 74, left: 92, size: 8, drip: false },
  { top: 88, left: 11, size: 5, drip: false },
  { top: 94, left: 78, size: 7, drip: true, duration: 9, delay: 5.2 },
];

/** The mark: water falling onto a car. */
function WashMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 28" fill="none" aria-hidden="true">
      <path
        d="M7.6 1.4s1.9 2.4 1.9 3.4a1.9 1.9 0 11-3.8 0c0-1 1.9-3.4 1.9-3.4z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M16.6 0.6s2.2 2.8 2.2 3.9a2.2 2.2 0 11-4.4 0c0-1.1 2.2-3.9 2.2-3.9z"
        fill="currentColor"
        opacity="0.85"
      />
      <g
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M5 15l1.2-3.6A2 2 0 018.1 10h7.8a2 2 0 011.9 1.4L19 15" />
        <path d="M4 15h16v4a1 1 0 01-1 1h-1" />
        <path d="M4 15a1 1 0 00-1 1v3a1 1 0 001 1h1" />
      </g>
      <circle cx="7.5" cy="20.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="20.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ access_token: string; role: "staff" | "admin"; username: string }>(
        "/api/auth/login",
        { username, password }
      );
      setAuth(res.access_token, res.role, res.username);
      router.push(res.role === "admin" ? "/admin" : "/staff/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-grow flex items-center justify-center overflow-hidden px-4 py-10">
      {/* ---- The wash: water light, then foam rising ---- */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-52 -right-36 w-[620px] h-[620px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-64 -left-44 w-[640px] h-[640px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--accent) 11%, transparent), transparent 70%)",
          }}
        />

        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="wash-bubble absolute bottom-0 rounded-full"
            style={
              {
                left: `${b.left}%`,
                width: b.size,
                height: b.size,
                "--bubble-opacity": b.opacity,
                "--bubble-delay": `${b.delay}s`,
                "--bubble-duration": `${b.duration}s`,
                background:
                  "radial-gradient(circle at 32% 28%, color-mix(in oklab, var(--accent) 55%, transparent), color-mix(in oklab, var(--accent) 14%, transparent) 62%, transparent 72%)",
                border: "1px solid color-mix(in oklab, var(--accent) 26%, transparent)",
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="absolute top-6 right-6 sm:top-7 sm:right-9 z-20">
        <ThemeToggle />
      </div>

      {/* ---- The card: the patch of glass wiped clean ---- */}
      <div
        className="relative w-full max-w-[400px] bg-surface border border-border rounded-[20px] overflow-hidden"
        style={{ boxShadow: "0 20px 50px var(--shadow)" }}
      >
        {/* one squeegee pass on load */}
        <div
          aria-hidden="true"
          className="wash-sweep absolute inset-y-0 -left-1/3 w-1/3 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(100deg, transparent, color-mix(in oklab, var(--accent) 20%, transparent), transparent)",
          }}
        />

        {/* beads sitting on the glass */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          {BEADS.map((b, i) => (
            <span
              key={i}
              className={`absolute rounded-full ${b.drip ? "wash-drip" : ""}`}
              style={
                {
                  top: `${b.top}%`,
                  left: `${b.left}%`,
                  width: b.size,
                  height: b.size,
                  "--bubble-opacity": 0.5,
                  "--drip-duration": `${b.duration ?? 7}s`,
                  "--drip-delay": `${b.delay ?? 0}s`,
                  background:
                    "radial-gradient(circle at 34% 30%, color-mix(in oklab, var(--accent) 42%, transparent), color-mix(in oklab, var(--accent) 12%, transparent) 66%, transparent 74%)",
                  boxShadow: "inset 0 -1px 2px color-mix(in oklab, var(--accent) 22%, transparent)",
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="relative p-6 sm:p-10">
          <div className="flex flex-col items-center text-center mb-7">
            <div
              className="w-[58px] h-[58px] rounded-2xl bg-accent text-accent-contrast flex items-center justify-center mb-4"
              style={{ boxShadow: "0 6px 18px color-mix(in oklab, var(--accent) 32%, transparent)" }}
            >
              <WashMark />
            </div>
            <div className="font-heading font-extrabold text-xl text-text">Bavas Group</div>
            <div className="text-[13px] text-text-muted mt-1">Car Wash &amp; Pollution Centre</div>
            {/* a thin waterline under the name */}
            <div
              className="mt-4 h-px w-20"
              style={{
                background:
                  "linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 55%, transparent), transparent)",
              }}
            />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="username"
                className="block font-heading font-semibold text-[12.5px] text-text mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-[46px] rounded-[10px] border border-border bg-surface px-3.5 text-sm text-text"
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block font-heading font-semibold text-[12.5px] text-text mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full h-[46px] rounded-[10px] border border-border bg-surface px-3.5 text-sm text-text"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="text-sm text-danger">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-[10px] bg-accent text-accent-contrast font-heading font-bold text-[14.5px] disabled:opacity-60"
              style={{ boxShadow: "0 1px 2px var(--shadow)" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="text-center text-xs text-text-muted mt-6">
            Staff &amp; admin access only &middot; contact your manager for credentials
          </div>
        </div>
      </div>
    </div>
  );
}
