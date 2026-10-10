"use client";

import { useState } from "react";
import { categories, toneClasses } from "@/lib/report/findings";
import { saveFinding, deleteFinding } from "@/app/admin/actions";
import { PhotoField } from "@/components/PhotoField";
import { SaveBadge, useAutosave } from "./useAutosave";
import type { EditorFinding } from "./types";

type Data = Pick<EditorFinding, "element" | "location" | "description" | "recommendation" | "detail">;

export function FindingEditor({ jobId, finding, number, elementsListId, onDeleted }: {
  jobId: string; finding: EditorFinding; number: number; elementsListId: string; onDeleted: () => void;
}) {
  const info = categories[finding.category];
  const [data, setData] = useState<Data>({
    element: finding.element, location: finding.location, description: finding.description,
    recommendation: finding.recommendation, detail: finding.detail,
  });
  const autosave = useAutosave((d: Data) => saveFinding(finding.id, d));
  const [deleting, setDeleting] = useState(false);
  const id = (k: string) => `f-${finding.id}-${k}`;

  const update = (key: keyof Data, value: string) => {
    const next = { ...data, [key]: value };
    setData(next);
    autosave.schedule(next);
  };

  async function remove() {
    if (!window.confirm(`Delete this ${info.label.toLowerCase()} and its photos?`)) return;
    setDeleting(true);
    try {
      await deleteFinding(finding.id);
      onDeleted();
    } catch {
      setDeleting(false);
      window.alert("Couldn't delete it. Check your connection and try again.");
    }
  }

  return (
    <li className="rounded-md border border-line bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${toneClasses[info.tone]}`}>
          {info.label} {number}
        </span>
        <div className="flex items-center gap-3">
          <SaveBadge state={autosave.state} onRetry={autosave.retry} />
          <button type="button" onClick={remove} disabled={deleting} className="text-sm font-semibold text-red-800 underline">
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {info.detail && (
          <div>
            <label className="label" htmlFor={id("detail")}>{info.detail.label}<span className="text-red-700"> *</span></label>
            <select id={id("detail")} className="input" value={data.detail} onChange={(e) => update("detail", e.target.value)}>
              <option value="">Choose one</option>
              {info.detail.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor={id("element")}>Building element</label>
          <input id={id("element")} className="input" list={elementsListId} value={data.element}
            onChange={(e) => update("element", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={id("location")}>Location<span className="text-red-700"> *</span></label>
          <input id={id("location")} className="input" placeholder="e.g. North-east corner, above window"
            value={data.location} onChange={(e) => update("location", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={id("description")}>Description<span className="text-red-700"> *</span></label>
          <textarea id={id("description")} className="input min-h-24" rows={3} value={data.description}
            onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={id("recommendation")}>Recommendation</label>
          <textarea id={id("recommendation")} className="input" rows={2} value={data.recommendation}
            onChange={(e) => update("recommendation", e.target.value)} />
        </div>
      </div>

      <PhotoField jobId={jobId} target={{ kind: "finding", findingId: finding.id }} label={info.label} initial={finding.photos} />
    </li>
  );
}
