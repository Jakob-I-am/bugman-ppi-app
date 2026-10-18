"use client";

import { useState } from "react";
import Link from "next/link";
import type { Answers } from "@/lib/report/fields";
import { sectionTemplates, getTemplate } from "@/lib/report/sections";
import { includesBuilding, type ReportType } from "@/lib/report/types";
import { addSection, deleteSection, moveSection, saveFrameAnswers } from "@/app/admin/actions";
import { COVER_KEY, hasNoSubfloor } from "@/lib/report/frame";
import { PhotoField, type PhotoItem } from "@/components/PhotoField";
import { FrameEditor } from "./FrameEditor";
import { SectionCard } from "./SectionCard";
import { FinalisePanel } from "./FinalisePanel";
import { flushAll, useAutosave } from "./useAutosave";
import type { EditorSection } from "./types";

type SectionMeta = EditorSection & { smokeAlarm?: string };

export function ReportEditor({ jobId, reportType, frameAnswers, initialSections, jobPhotos }: {
  jobId: string; reportType: ReportType; frameAnswers: Answers; initialSections: EditorSection[];
  /** Photos on the job itself, keyed by field ("cover", "slabEdgeComments"). */
  jobPhotos: Record<string, PhotoItem[]>;
}) {
  const [sections, setSections] = useState<SectionMeta[]>(
    initialSections.map((s) => ({ ...s, smokeAlarm: typeof s.answers.smokeAlarm === "string" ? s.answers.smokeAlarm : undefined })),
  );
  const [templateKey, setTemplateKey] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<"" | "saving" | "saved" | "error">("");
  const [frame, setFrame] = useState<Answers>(frameAnswers ?? {});
  const frameSave = useAutosave((a: Answers) => saveFrameAnswers(jobId, a));

  const updateFrame = (key: string, value: string | boolean) => {
    const next = { ...frame, [key]: value };
    setFrame(next);
    frameSave.schedule(next);
  };
  const patchSection = (id: string, changes: Partial<SectionMeta>) =>
    setSections((list) => list.map((s) => (s.id === id ? { ...s, ...changes } : s)));

  async function saveNow() {
    setSaveMessage("saving");
    const ok = await flushAll();
    setSaveMessage(ok ? "saved" : "error");
    if (ok) setTimeout(() => setSaveMessage(""), 3000);
  }

  // Smoke alarm summary shown above the compliance question.
  const alarmAreas = sections.filter((s) => getTemplate(s.templateKey).smokeAlarm);
  const withAlarm = alarmAreas.filter((s) => s.smokeAlarm === "Yes");
  const withoutAlarm = alarmAreas.filter((s) => s.smokeAlarm === "No");
  const unanswered = alarmAreas.filter((s) => !s.smokeAlarm);
  const smokeSummary = includesBuilding(reportType) ? (
    <dl className="mt-4 grid gap-3 rounded-md bg-paper p-4 text-sm">
      <div><dt className="font-semibold">Smoke alarms found in</dt><dd>{withAlarm.map((s) => s.title).join(", ") || "None"}</dd></div>
      <div><dt className="font-semibold">No smoke alarm in</dt><dd>{withoutAlarm.map((s) => s.title).join(", ") || "None"}</dd></div>
      {unanswered.length > 0 && (
        <div className="text-red-800"><dt className="font-semibold">Not recorded yet</dt><dd>{unanswered.map((s) => s.title).join(", ")}</dd></div>
      )}
    </dl>
  ) : null;

  const frameProps = {
    reportType, answers: frame, onChange: updateFrame, saveState: frameSave.state, onRetry: frameSave.retry,
    extras: { smokeAlarms: smokeSummary },
    jobId,
    fieldPhotos: jobPhotos,
  };
  const noSubfloor = hasNoSubfloor(frame);

  const existingKeys = new Set(sections.map((s) => s.templateKey));
  const available = sectionTemplates.filter(
    (t) => (t.repeatable || !existingKeys.has(t.key)) && !(t.key === "subfloor" && noSubfloor),
  );

  async function add() {
    if (!templateKey) return;
    setBusy(true);
    try {
      const s = await addSection(jobId, templateKey, newTitle);
      setSections((list) => [...list, s]);
      setTemplateKey("");
      setNewTitle("");
      requestAnimationFrame(() => document.getElementById(`s-${s.id}`)?.scrollIntoView({ behavior: "smooth" }));
    } catch {
      window.alert("Couldn't add the section. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: "up" | "down") {
    const target = dir === "up" ? index - 1 : index + 1;
    const before = sections;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    try {
      await moveSection(sections[index].id, dir);
    } catch {
      setSections(before);
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete "${title}", including all its findings and photos? This can't be undone.`)) return;
    try {
      await deleteSection(id);
      setSections((list) => list.filter((s) => s.id !== id));
    } catch {
      window.alert("Couldn't delete the section. Check your connection and try again.");
    }
  }

  return (
    <div className="mt-6">
      <div className="sticky top-0 z-10 -mx-5 border-b border-line bg-paper/95 px-5 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <nav aria-label="Report sections" className="flex min-w-0 gap-4 overflow-x-auto py-1 text-sm font-semibold whitespace-nowrap">
            <a href="#cover" className="text-pine hover:underline">Cover</a>
            <a href="#frame-property" className="text-pine hover:underline">Details</a>
            {sections.map((s) => (
              <a key={s.id} href={`#s-${s.id}`} className="text-pine hover:underline">{s.title}</a>
            ))}
            <a href="#add-section" className="text-pine hover:underline">Add area</a>
            <a href="#conclusion" className="text-pine hover:underline">Conclusion</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/admin/jobs/${jobId}/preview`} className="btn-quiet px-3 py-1.5 text-sm"
              onClick={(e) => { e.preventDefault(); flushAll().then(() => { window.location.href = `/admin/jobs/${jobId}/preview`; }); }}>
              Preview
            </Link>
            <button type="button" className="btn-primary px-3 py-1.5 text-sm" onClick={saveNow} disabled={saveMessage === "saving"}>
              {saveMessage === "saving" ? "Saving…" : saveMessage === "saved" ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>
        {saveMessage === "error" && (
          <p role="alert" className="mt-1 text-sm text-red-800">Some changes didn&apos;t save. Check your signal and press Save again.</p>
        )}
      </div>

      <div className="mt-6 grid gap-5">
        <section id="cover" className="scroll-mt-20 rounded-lg border border-line bg-white p-5 sm:p-6">
          <h2 className="display text-3xl text-pine">Cover photo</h2>
          <p className="mt-1 text-sm text-stone">
            Shown first on the report, full width. Usually the house from the street. Add more than one and the first becomes the main image.
          </p>
          <PhotoField jobId={jobId} target={{ kind: "job", fieldKey: COVER_KEY }} label="Cover" initial={jobPhotos[COVER_KEY] ?? []} />
        </section>

        <FrameEditor {...frameProps} part="start" />

        {sections.map((s, i) => (
          <SectionCard
            key={s.id}
            jobId={jobId}
            reportType={reportType}
            section={s}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            onMove={(dir) => move(i, dir)}
            onDelete={() => remove(s.id, s.title)}
            onSmokeAlarmChange={(v) => patchSection(s.id, { smokeAlarm: v })}
            onTitleChange={(t) => patchSection(s.id, { title: t })}
            notNeeded={s.templateKey === "subfloor" && noSubfloor
              ? "Floor construction is concrete slab on ground, so a subfloor section isn't needed. You can delete it."
              : undefined}
          />
        ))}

        <section id="add-section" className="scroll-mt-20 rounded-lg border-2 border-dashed border-line p-5 sm:p-6">
          <h2 className="display text-3xl text-pine">Add an area</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label className="label" htmlFor="new-section">Area type</label>
              <select id="new-section" className="input" value={templateKey}
                onChange={(e) => { setTemplateKey(e.target.value); setNewTitle(e.target.value ? getTemplate(e.target.value).defaultTitle : ""); }}>
                <option value="">Choose one</option>
                {available.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div className="min-w-48 flex-1">
              <label className="label" htmlFor="new-section-title">Name</label>
              <input id="new-section-title" className="input" value={newTitle} placeholder="e.g. Bedroom 2"
                onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <button type="button" className="btn-primary" disabled={!templateKey || busy} onClick={add}>
              {busy ? "Adding…" : "Add area"}
            </button>
          </div>
        </section>

        <div id="conclusion" className="grid scroll-mt-20 gap-5">
          <FrameEditor {...frameProps} part="end" />
        </div>

        <FinalisePanel jobId={jobId} />
      </div>
    </div>
  );
}
