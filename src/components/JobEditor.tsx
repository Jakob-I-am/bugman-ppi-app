"use client";

import { useEffect, useRef, useState } from "react";
import { jobForm, type Answers, type Field } from "@/lib/job-form";
import { saveAnswers } from "@/app/admin/actions";
import { PhotoField, type PhotoItem } from "./PhotoField";

type SaveState = "saved" | "unsaved" | "saving" | "error";

/** The long job form. Every change autosaves, so a dropped signal loses at most a second of typing. */
export function JobEditor({
  jobId,
  initialAnswers,
  photosByField,
}: {
  jobId: string;
  initialAnswers: Answers;
  photosByField: Record<string, PhotoItem[]>;
}) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const latest = useRef<Answers>(answers);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save() {
    setSaveState("saving");
    try {
      await saveAnswers(jobId, latest.current);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function update(key: string, value: string | boolean) {
    const next = { ...latest.current, [key]: value };
    latest.current = next;
    setAnswers(next);
    setSaveState("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 800);
  }

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveState !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveState]);

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <nav className="flex gap-4 overflow-x-auto text-sm font-semibold whitespace-nowrap" aria-label="Form sections">
          {jobForm.map((s) => (
            <a key={s.key} href={`#${s.key}`} className="text-pine hover:underline">{s.title}</a>
          ))}
        </nav>
        <SaveIndicator state={saveState} onRetry={save} />
      </div>

      {jobForm.map((section) => (
        <fieldset key={section.key} id={section.key} className="scroll-mt-16 border-b border-line py-8">
          <legend className="sr-only">{section.title}</legend>
          <h2 className="display text-3xl text-pine" aria-hidden="true">{section.title}</h2>
          <div className="mt-5 grid gap-6">
            {section.fields.map((field) => (
              <div key={field.key}>
                <FieldInput field={field} value={answers[field.key]} onChange={(v) => update(field.key, v)} />
                {field.photos && (
                  <PhotoField jobId={jobId} fieldKey={field.key} label={field.label} initial={photosByField[field.key] ?? []} />
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "error") {
    return (
      <button onClick={onRetry} className="shrink-0 rounded-md bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-800">
        Not saved. Retry
      </button>
    );
  }
  const text = { saved: "Saved", unsaved: "Editing…", saving: "Saving…" }[state];
  return <span role="status" className="shrink-0 text-sm text-stone">{text}</span>;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}) {
  const id = `f-${field.key}`;
  const help = field.help ? <p className="mb-1.5 -mt-1 text-sm text-stone">{field.help}</p> : null;
  const internal = field.internal ? <span className="ml-2 text-xs font-normal text-stone">(not shown to customer)</span> : null;

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 font-semibold" htmlFor={id}>
        <input id={id} type="checkbox" className="h-5 w-5 accent-pine" checked={value === true}
          onChange={(e) => onChange(e.target.checked)} />
        {field.label}{internal}
      </label>
    );
  }

  const str = typeof value === "string" ? value : "";
  return (
    <>
      <label className="label" htmlFor={id}>{field.label}{internal}</label>
      {help}
      {field.type === "textarea" ? (
        <textarea id={id} className="input min-h-24" rows={3} value={str} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "select" ? (
        <select id={id} className="input" value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose one</option>
          {field.options?.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          id={id}
          className="input sm:max-w-xs"
          type={field.type}
          inputMode={field.type === "number" ? "numeric" : undefined}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </>
  );
}
