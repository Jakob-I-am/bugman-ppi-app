"use client";

import { isVisible, type Answers } from "@/lib/report/fields";
import { frameFor } from "@/lib/report/frame";
import type { ReportType } from "@/lib/report/types";
import { PhotoField, type PhotoItem } from "@/components/PhotoField";
import { FieldInput } from "./FieldInput";
import { SaveBadge, type SaveState } from "./useAutosave";

const START = ["property", "agreement"];

/**
 * The fixed parts of the report. Rendered twice (details at the top, conclusions
 * at the bottom) but controlled by the parent, so both share one set of answers.
 */
export function FrameEditor({ jobId, reportType, answers, onChange, saveState, onRetry, part, extras = {}, fieldPhotos }: {
  jobId: string;
  reportType: ReportType;
  answers: Answers;
  onChange: (key: string, value: string | boolean) => void;
  saveState: SaveState;
  onRetry: () => void;
  part: "start" | "end";
  /** Extra content shown above a frame section's fields, keyed by section key. */
  extras?: Record<string, React.ReactNode>;
  /** Existing photos for fields with `photos: true`, keyed by field key. */
  fieldPhotos: Record<string, PhotoItem[]>;
}) {
  const sections = frameFor(reportType).filter((s) => (part === "start") === START.includes(s.key));

  return (
    <>
      {sections.map((section) => (
        <section key={section.key} id={`frame-${section.key}`} className="scroll-mt-20 rounded-lg border border-line bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="display text-3xl text-pine">{section.title}</h2>
            <SaveBadge state={saveState} onRetry={onRetry} />
          </div>
          {extras[section.key]}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {section.fields.filter((f) => isVisible(f, answers)).map((field) => (
              <div key={field.key} className={field.type === "textarea" || field.help || field.photos ? "sm:col-span-2" : ""}>
                <FieldInput id={`frame-${field.key}`} field={field} value={answers[field.key]} onChange={(v) => onChange(field.key, v)} />
                {field.photos && (
                  <PhotoField jobId={jobId} target={{ kind: "job", fieldKey: field.key }} label={field.label}
                    initial={fieldPhotos[field.key] ?? []} />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
