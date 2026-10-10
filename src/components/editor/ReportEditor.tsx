"use client";

import { useState } from "react";
import type { Answers } from "@/lib/report/fields";
import { sectionTemplates, getTemplate } from "@/lib/report/sections";
import type { ReportType } from "@/lib/report/types";
import { addSection, deleteSection, moveSection, saveFrameAnswers } from "@/app/admin/actions";
import { FrameEditor } from "./FrameEditor";
import { SectionCard } from "./SectionCard";
import { FinalisePanel } from "./FinalisePanel";
import { useAutosave } from "./useAutosave";
import type { EditorSection } from "./types";

export function ReportEditor({ jobId, reportType, frameAnswers, initialSections }: {
  jobId: string; reportType: ReportType; frameAnswers: Answers; initialSections: EditorSection[];
}) {
  const [sections, setSections] = useState(initialSections);
  const [templateKey, setTemplateKey] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [frame, setFrame] = useState<Answers>(frameAnswers ?? {});
  const frameSave = useAutosave((a: Answers) => saveFrameAnswers(jobId, a));

  const updateFrame = (key: string, value: string | boolean) => {
    const next = { ...frame, [key]: value };
    setFrame(next);
    frameSave.schedule(next);
  };
  const frameProps = { reportType, answers: frame, onChange: updateFrame, saveState: frameSave.state, onRetry: frameSave.retry };

  const existingKeys = new Set(sections.map((s) => s.templateKey));
  const available = sectionTemplates.filter((t) => t.repeatable || !existingKeys.has(t.key));

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
      <nav aria-label="Report sections"
        className="sticky top-0 z-10 -mx-5 flex gap-4 overflow-x-auto border-b border-line bg-paper/95 px-5 py-3 text-sm font-semibold whitespace-nowrap backdrop-blur">
        <a href="#frame-property" className="text-pine hover:underline">Details</a>
        {sections.map((s) => (
          <a key={s.id} href={`#s-${s.id}`} className="text-pine hover:underline">{s.title}</a>
        ))}
        <a href="#add-section" className="text-pine hover:underline">Add area</a>
        <a href="#conclusion" className="text-pine hover:underline">Conclusion</a>
      </nav>

      <div className="mt-6 grid gap-5">
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
