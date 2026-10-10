"use client";

import { useActionState, useState } from "react";
import { checkReport, finaliseJob, type FinaliseState } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export function FinalisePanel({ jobId }: { jobId: string }) {
  const [state, action] = useActionState<FinaliseState, FormData>(finaliseJob.bind(null, jobId), {});
  const [checked, setChecked] = useState<string[] | null>(null);
  const [checking, setChecking] = useState(false);
  const problems = state.problems ?? checked;

  async function check() {
    setChecking(true);
    try {
      setChecked(await checkReport(jobId));
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="rounded-lg border-2 border-pine bg-white p-5 sm:p-6">
      <h2 className="display text-3xl text-pine">Finalise report</h2>
      <p className="mt-2 max-w-lg text-stone">
        Checks the report is complete, locks it and emails the client a link to view it.
        You can reopen it later if something needs correcting.
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
        <form action={action}>
          <ConfirmButton className="btn-primary" message="Finalise this report and email the client?">
            Finalise and send report
          </ConfirmButton>
        </form>
      </div>
    </section>
  );
}
