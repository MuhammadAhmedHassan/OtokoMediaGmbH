"use client";

import { useCallback, useMemo, useState } from "react";
import type { CreateTokenRequest, TokenResponse } from "@/lib/tokens";

interface CreateTokenFormState {
  userId: string;
  scopes: string;
  expiresInMinutes: string;
}

export default function Home() {
  const [createForm, setCreateForm] = useState<CreateTokenFormState>({
    userId: "",
    scopes: "",
    expiresInMinutes: "60",
  });
  const [tokensUserId, setTokensUserId] = useState<string>("");
  const [createdToken, setCreatedToken] = useState<TokenResponse | null>(null);
  const [tokens, setTokens] = useState<TokenResponse[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedScopes = useMemo(
    () =>
      createForm.scopes
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    [createForm.scopes],
  );

  const handleCreateChange = useCallback(
    (field: keyof CreateTokenFormState, value: string) => {
      setCreateForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmitCreate = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setCreatedToken(null);

      const expiresInMinutesNumber = Number.parseInt(createForm.expiresInMinutes, 10);
      if (Number.isNaN(expiresInMinutesNumber) || expiresInMinutesNumber <= 0) {
        setError("expiresInMinutes must be a positive integer.");
        return;
      }

      const payload: CreateTokenRequest = {
        userId: createForm.userId.trim(),
        scopes: parsedScopes,
        expiresInMinutes: expiresInMinutesNumber,
      };

      if (!payload.userId) {
        setError("userId is required.");
        return;
      }
      if (payload.scopes.length === 0) {
        setError("At least one scope is required.");
        return;
      }

      setIsCreating(true);
      try {
        const response = await fetch("/api/tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const json = (await response.json()) as TokenResponse | { error: string };
        if (!response.ok) {
          const message = "error" in json ? json.error : "Failed to create token.";
          setError(message);
          return;
        }

        if ("id" in json) {
          setCreatedToken(json);
          setTokensUserId(payload.userId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error while creating token.");
      } finally {
        setIsCreating(false);
      }
    },
    [createForm.expiresInMinutes, createForm.userId, parsedScopes],
  );

  const handleLoadTokens = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setTokens([]);

      const userId = tokensUserId.trim();
      if (!userId) {
        setError("userId is required to load tokens.");
        return;
      }

      setIsLoadingTokens(true);
      try {
        const response = await fetch(`/api/tokens?userId=${encodeURIComponent(userId)}`, {
          method: "GET",
        });

        const json = (await response.json()) as TokenResponse[] | { error: string };

        if (!response.ok) {
          const message = "error" in json ? json.error : "Failed to load tokens.";
          setError(message);
          return;
        }

        if (Array.isArray(json)) {
          setTokens(json);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error while loading tokens.");
      } finally {
        setIsLoadingTokens(false);
      }
    },
    [tokensUserId],
  );

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h1 className="text-2xl font-semibold tracking-tight">Token Management Service</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Minimal Next.js-based API for creating and listing user access tokens with scopes and expiry.
          </p>
        </header>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/60 dark:bg-red-950/40">
            {error}
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          <form
            onSubmit={handleSubmitCreate}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-base font-semibold">Create Token</h2>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">User ID</span>
              <input
                type="text"
                value={createForm.userId}
                onChange={(event) => handleCreateChange("userId", event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="e.g. 123"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Scopes (comma separated)</span>
              <input
                type="text"
                value={createForm.scopes}
                onChange={(event) => handleCreateChange("scopes", event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="read, write"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Expiry (minutes)</span>
              <input
                type="number"
                min={1}
                value={createForm.expiresInMinutes}
                onChange={(event) => handleCreateChange("expiresInMinutes", event.target.value)}
                className="w-32 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>

            <button
              type="submit"
              disabled={isCreating}
              className="mt-1 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isCreating ? "Creating..." : "Create Token"}
            </button>

            {createdToken && (
              <div className="mt-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-100">
                <div className="font-semibold">Token created</div>
                <div className="mt-1 break-all">
                  <span className="font-medium">ID:</span> {createdToken.id}
                </div>
                <div className="mt-1 break-all">
                  <span className="font-medium">Token:</span> {createdToken.token}
                </div>
                <div className="mt-1 text-[11px] text-emerald-900/80 dark:text-emerald-100/80">
                  Expires at: {new Date(createdToken.expiresAt).toLocaleString()}
                </div>
              </div>
            )}
          </form>

          <form
            onSubmit={handleLoadTokens}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-base font-semibold">List Tokens</h2>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">User ID</span>
              <input
                type="text"
                value={tokensUserId}
                onChange={(event) => setTokensUserId(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="e.g. 123"
              />
            </label>

            <button
              type="submit"
              disabled={isLoadingTokens}
              className="mt-1 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isLoadingTokens ? "Loading..." : "Load Tokens"}
            </button>

            <div className="mt-2 flex-1 overflow-auto rounded-md border border-dashed border-zinc-300 bg-zinc-50/60 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900/40">
              {tokens.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  No active tokens for this user (or not loaded yet).
                </p>
              ) : (
                <ul className="space-y-2">
                  {tokens.map((token) => (
                    <li
                      key={token.id}
                      className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{token.id}</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Expires: {new Date(token.expiresAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                        <span className="font-medium">Scopes:</span> {token.scopes.join(", ")}
                      </div>
                      <div className="mt-1 break-all text-[11px] text-zinc-600 dark:text-zinc-300">
                        <span className="font-medium">Token:</span> {token.token}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </section>

        <section className="mt-2 rounded-lg border border-zinc-200 bg-white p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">API Summary</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <span className="font-semibold">POST /api/tokens</span> — create a token for a user with scopes and
              expiry.
            </li>
            <li>
              <span className="font-semibold">GET /api/tokens?userId=123</span> — list all non-expired tokens for a
              user.
            </li>
            <li>Storage is in-memory for this demo and resets when the server restarts.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

