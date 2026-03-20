"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuthFormState = {
  email: string;
  password: string;
};

type ApiErrorResponse = {
  errors?: Array<{
    message: string;
    path?: string;
  }>;
  message?: string;
};

type AuthResponse = {
  token?: string;
  user?: {
    collection: string | null;
    email: string | null;
    id: number | string | null;
  };
};

function formatApiError(data: ApiErrorResponse | null, fallback: string): string {
  if (data?.errors && data.errors.length > 0) {
    return data.errors.map((error) => error.message).join(" ");
  }

  return data?.message || fallback;
}

export default function LoginPage() {
  const [registerForm, setRegisterForm] = useState<AuthFormState>({
    email: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState<AuthFormState>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Checking session...");
  const [token, setToken] = useState("");
  const [session, setSession] = useState<AuthResponse["user"] | null>(null);

  async function refreshSession() {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await response.json().catch(() => null)) as AuthResponse | ApiErrorResponse | null;

    if (!response.ok) {
      setSession(null);
      setMessage(formatApiError(data as ApiErrorResponse | null, "No active session."));
      return;
    }

    setSession((data as AuthResponse).user ?? null);
    setMessage("Active session loaded from the protected route.");
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  async function sendAuthRequest(
    endpoint: "/api/auth/login" | "/api/auth/register",
    form: AuthFormState,
    successMessage: string,
  ) {
    setIsLoading(true);
    setMessage("Submitting request...");

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(form),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as AuthResponse | ApiErrorResponse | null;

      if (!response.ok) {
        setMessage(formatApiError(data as ApiErrorResponse | null, "Request failed."));
        return;
      }

      setToken(
        data && "token" in data && typeof data.token === "string" ? data.token : "",
      );
      setMessage(successMessage);
      await refreshSession();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    setMessage("Ending session...");

    try {
      const response = await fetch("/api/auth/logout", {
        credentials: "same-origin",
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as ApiErrorResponse | null;

      if (!response.ok) {
        setMessage(formatApiError(data, "Logout failed."));
        return;
      }

      setToken("");
      setSession(null);
      setMessage(data?.message || "Logged out.");
      await refreshSession();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fef3c7,_transparent_30%),linear-gradient(180deg,_#fff7ed_0%,_#ffffff_55%,_#f8fafc_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-amber-200/70 bg-white/85 shadow-[0_30px_120px_-45px_rgba(120,53,15,0.45)] backdrop-blur">
          <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.2fr_1fr] lg:px-10">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
                Editorial Control Center
              </p>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  Internal access for the newsroom stack.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600">
                  Register an internal user, start a session, and confirm the protected
                  session endpoint responds with live auth state.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-950 px-5 py-4 text-slate-100">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                  Latest Result
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{message}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
                  <Link
                    className="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-amber-300 hover:text-white"
                    href="/api/auth/session"
                  >
                    Protected route
                  </Link>
                  <Link
                    className="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-amber-300 hover:text-white"
                    href="/admin"
                  >
                    Payload admin
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Session State
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Active user
                  </p>
                  <p className="mt-3 text-sm text-slate-700">
                    {session?.email || "No authenticated user"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {session?.collection
                      ? `${session.collection} #${String(session.id)}`
                      : "Protected route returns 401 without a session."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Session token
                    </p>
                    <button
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isLoading}
                      onClick={() => {
                        void refreshSession();
                      }}
                      type="button"
                    >
                      Refresh protected route
                    </button>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs leading-6 text-emerald-200">
                    {token || "No token returned yet."}
                  </pre>
                </div>

                <button
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                  onClick={() => {
                    void handleLogout();
                  }}
                  type="button"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void sendAuthRequest(
                "/api/auth/register",
                registerForm,
                "Registration succeeded. Session started.",
              );
            }}
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Register
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Create an internal account
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  autoComplete="email"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
                  onChange={(event) => {
                    setRegisterForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }));
                  }}
                  required
                  type="email"
                  value={registerForm.email}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
                  minLength={3}
                  onChange={(event) => {
                    setRegisterForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }));
                  }}
                  required
                  type="password"
                  value={registerForm.password}
                />
              </label>
            </div>

            <button
              className="mt-6 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              Register and start session
            </button>
          </form>

          <form
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void sendAuthRequest("/api/auth/login", loginForm, "Login succeeded.");
            }}
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                Login
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Restore a valid session
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  autoComplete="email"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => {
                    setLoginForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }));
                  }}
                  required
                  type="email"
                  value={loginForm.email}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  minLength={3}
                  onChange={(event) => {
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }));
                  }}
                  required
                  type="password"
                  value={loginForm.password}
                />
              </label>
            </div>

            <button
              className="mt-6 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              Log in
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
