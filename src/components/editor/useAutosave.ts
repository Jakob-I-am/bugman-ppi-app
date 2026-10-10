"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "saved" | "unsaved" | "saving" | "error";

/**
 * Debounced autosave. Saves run one after another, so a slow save can never
 * land after a newer one and overwrite it.
 */
export function useAutosave<T>(save: (value: T) => Promise<unknown>, delay = 800) {
  const [state, setState] = useState<SaveState>("saved");
  const latest = useRef<{ value: T } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(() => {
    const current = latest.current;
    if (!current) return;
    setState("saving");
    const run = queue.current.then(() => saveRef.current(current.value));
    queue.current = run.then(() => undefined, () => undefined);
    run.then(
      () => {
        if (latest.current === current) setState("saved");
      },
      () => setState("error"),
    );
  }, []);

  const schedule = useCallback(
    (value: T) => {
      latest.current = { value };
      setState("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(() => {
    if (state === "saved") return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state]);

  return { state, schedule, retry: flush };
}

export function SaveBadge({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "error") {
    return (
      <button type="button" onClick={onRetry} className="shrink-0 rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">
        Not saved. Retry
      </button>
    );
  }
  const text = { saved: "Saved", unsaved: "Editing…", saving: "Saving…" }[state];
  return <span role="status" className="shrink-0 text-xs text-stone">{text}</span>;
}
