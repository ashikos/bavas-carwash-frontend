"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      router.push(res.role === "admin" ? "/admin" : "/staff/car-entries");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-grow flex items-center justify-center overflow-hidden">
      <div
        className="absolute -top-56 -right-40 w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(58% 0.135 212 / 0.10), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-64 -left-44 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(58% 0.135 212 / 0.06), transparent 70%)" }}
      />

      <div className="absolute top-7 right-9">
        <ThemeToggle />
      </div>

      <div
        className="relative w-full max-w-[400px] bg-surface border border-border rounded-[20px] p-6 sm:p-10 mx-4"
        style={{ boxShadow: "0 20px 50px var(--shadow)" }}
      >
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-[52px] h-[52px] rounded-2xl bg-accent flex items-center justify-center text-accent-contrast font-heading font-extrabold text-[22px] mb-4">
            B
          </div>
          <div className="font-heading font-extrabold text-xl text-text">Bavas Group</div>
          <div className="text-[13px] text-text-muted mt-1">Car Wash &amp; PUC Management</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-heading font-semibold text-[12.5px] text-text mb-1.5">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-[46px] rounded-[10px] border border-border bg-surface px-3.5 text-sm text-text"
              placeholder="Enter your username"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block font-heading font-semibold text-[12.5px] text-text mb-1.5">
              Password
            </label>
            <input
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
  );
}
