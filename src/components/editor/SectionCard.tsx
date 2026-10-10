"use client";

import { useState } from "react";
import type { Answers } from "@/lib/report/fields";
import { accessFields, getTemplate } from "@/lib/report/sections";
import { categories, categoriesFor, type FindingCategory } from "@/lib/report/findings";
import type { ReportType } from "@/lib/report/types";
import { addFinding, renameSection, saveSectionAnswers } from "@/app/admin/actions";
import { PhotoField } from "@/components/PhotoField";
import { FieldInput } from "./FieldInput";
import { FindingEditor } from "./FindingEditor";
import { SaveBadge, useAutosave } from "./useAutosave";
import type { EditorSection } from "./types";

export function SectionCard({ jobId, reportType, section, isFirst, isLast, onMove, onDelete }: {
  jobId: string;
  reportType: ReportType;
  section: EditorSection;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: "up" | "down") => void;
  onDelete: () => void;
}) {
  const template = getTemplate(section.templateKey);
  const [title, setTitle] = useState(section.title);
  const [answers, setAnswers] = useState<Answers>(section.answers ?? {});
  const [findings, setFindings] = useState(section.findings);
  const [newCategory, setNewCategory] = useState<FindingCategory | "">("");
  const [adding, setAdding] = useState(false);

  const answersSave = useAutosave((a: Answers) => saveSectionAnswers(section.id, a));
  const titleSave = useAutosave((t: string) => renameSection(section.id, t));
  const saveState =
    [answersSave.state, titleSave.state].find((s) => s === "error") ??
    [answersSave.state, titleSave.state].find((s) => s !== "saved") ??
    "saved";

  const update = (key: string, value: string | boolean) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    answersSave.schedule(next);
  };

  async function add() {
    if (!newCategory) return;
    setAdding(true);
    try {
      const f = await addFinding(section.id, newCategory);
      setFindings((list) => [...list, f]);
      setNewCategory("");
    } catch {
      window.alert("Couldn't add the finding. Check your connection and try again.");
    } finally {
      setAdding(false);
    }
  }

  const [access, reason, notes] = accessFields;
  const limited = typeof answers.access === "string" && answers.access !== "" && answers.access !== "Fully accessible";
  const elementsListId = `elements-${section.id}`;

  return (
    <details open id={`s-${section.id}`} className="group scroll-mt-20 rounded-lg border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:px-6">
        <span className="min-w-0">
          <span className="display block truncate text-3xl text-pine">{title || template.defaultTitle}</span>
          <span className="text-sm text-stone">
            {template.label}
            {answers.access ? `, ${String(answers.access).toLowerCase()}` : ", access not recorded"}
            {`, ${findings.length} ${findings.length === 1 ? "finding" : "findings"}`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <SaveBadge state={saveState} onRetry={() => { answersSave.retry(); titleSave.retry(); }} />
          <span aria-hidden="true" className="text-xl text-stone transition-transform group-open:rotate-180">⌄</span>
        </span>
      </summary>

      <div className="grid gap-5 border-t border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="label" htmlFor={`title-${section.id}`}>Section name</label>
            <input id={`title-${section.id}`} className="input" value={title}
              onChange={(e) => { setTitle(e.target.value); titleSave.schedule(e.target.value); }} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-quiet px-3 py-2.5 text-sm" disabled={isFirst} onClick={() => onMove("up")} aria-label="Move section up">↑</button>
            <button type="button" className="btn-quiet px-3 py-2.5 text-sm" disabled={isLast} onClick={() => onMove("down")} aria-label="Move section down">↓</button>
            <button type="button" className="btn-quiet px-3 py-2.5 text-sm text-red-800" onClick={onDelete}>Delete section</button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FieldInput id={`${section.id}-access`} field={access} value={answers.access} onChange={(v) => update("access", v)} />
          {template.fields.map((f) => (
            <FieldInput key={f.key} id={`${section.id}-${f.key}`} field={f} value={answers[f.key]} onChange={(v) => update(f.key, v)} />
          ))}
          {limited && (
            <div className="sm:col-span-2">
              <FieldInput id={`${section.id}-reason`} field={{ ...reason, required: true }} value={answers.accessReason}
                onChange={(v) => update("accessReason", v)} />
            </div>
          )}
          <div className="sm:col-span-2">
            <FieldInput id={`${section.id}-notes`} field={notes} value={answers.notes} onChange={(v) => update("notes", v)} />
          </div>
        </div>

        <div>
          <p className="label">General photos</p>
          <PhotoField jobId={jobId} target={{ kind: "section", sectionId: section.id }} label={title} initial={section.photos} />
        </div>

        <div>
          <h3 className="text-lg font-bold">Findings</h3>
          <datalist id={elementsListId}>
            {template.elements.map((e) => <option key={e} value={e} />)}
          </datalist>
          {findings.length === 0 ? (
            <p className="mt-1 text-sm text-stone">No findings in this area yet.</p>
          ) : (
            <ol className="mt-3 grid gap-3">
              {findings.map((f) => (
                <FindingEditor
                  key={f.id}
                  jobId={jobId}
                  finding={f}
                  number={findings.filter((x) => x.category === f.category).indexOf(f) + 1}
                  elementsListId={elementsListId}
                  onDeleted={() => setFindings((list) => list.filter((x) => x.id !== f.id))}
                />
              ))}
            </ol>
          )}
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-56 flex-1 sm:flex-none">
              <label className="label" htmlFor={`new-${section.id}`}>Add a finding</label>
              <select id={`new-${section.id}`} className="input" value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as FindingCategory)}>
                <option value="">Choose type</option>
                {categoriesFor(reportType).map((c) => <option key={c} value={c}>{categories[c].label}</option>)}
              </select>
            </div>
            <button type="button" className="btn-primary" disabled={!newCategory || adding} onClick={add}>
              {adding ? "Adding…" : "Add finding"}
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
