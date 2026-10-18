"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { checkReport, finaliseJob, type FinaliseState } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { flushAll } from "./useAutosave";

export function FinalisePanel({ jobId }: { jobId: string }) {
  const [state, action] = useActionState<FinaliseState, FormData>(async (prev, formData) => {
    if (!(await flushAll())) return { problems: ["Some changes haven't saved yet. Check your signal and try again."] };
    return finaliseJob(jobId, prev, formData);
  }, {});
  const [checked, setChecked] = useState<string[] | null>(null);
  const [checking, setChecking] = useState(false);
  const problems = state.problems ?? checked;

  async function check() {
    setChecking(true);
    try {
      await flushAll();
      setChecked(await checkReport(jobId));
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="rounded-lg border-2 border-pine bg-white p-5 sm:p-6">
      <h2 className="display text-3xl text-pine">Review and send</h2>
      <p className="mt-2 max-w-lg text-stone">
        Everything saves as you go, so you can leave and come back to this report any time.
        When you&apos;re ready, preview it exactly as the client will see it, then finalise.
        Finalising locks the report and emails the client. You can reopen it later if needed.
      </p>

      {problems && problems.length > 0 && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Fix these before finalising:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      )}
      {problems && problems.length === 0 && (
        <p role="status" className="mt-4 rounded-md bg-pine/10 p-3 text-sm font-semibold text-pine">The report is complete and ready to finalise.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-quiet" onClick={check} disabled={checking}>
          {checking ? "Checking…" : "Check report"}
        </button>
        <Link href={`/admin/jobs/${jobId}/preview`} className="btn-quiet"
          onClick={(e) => { e.preventDefault(); flushAll().then(() => { window.location.href = `/admin/jobs/${jobId}/preview`; }); }}>
          Preview report
        </Link>
        <form action={action}>
          <ConfirmButton className="btn-primary" message="Finalise this report and email the client?">
            Finalise and send report
          </ConfirmButton>
        </form>
      </div>
    </section>
  );
}
