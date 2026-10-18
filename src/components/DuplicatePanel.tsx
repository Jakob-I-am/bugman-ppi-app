"use client";

import { useActionState, useState } from "react";
import { duplicateJob, type DuplicateState } from "@/app/admin/actions";

/** Copies this report to a new draft for another client interested in the same property. */
export function DuplicatePanel({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DuplicateState, FormData>(duplicateJob.bind(null, jobId), {});

  if (!open) {
    return (
      <button type="button" className="btn-quiet" onClick={() => setOpen(true)}>
        Duplicate for another client
      </button>
    );
  }

  return (
    <section className="w-full rounded-lg border border-line bg-white p-5 sm:p-6">
      <h2 className="display text-3xl text-pine">Duplicate for another client</h2>
      <p className="mt-2 max-w-lg text-sm text-stone">
        Copies the whole report, including areas, findings and photos, to a new draft for this client.
        Check it, then finalise to send it. Each client needs their own inspection agreement.
        Changes to one copy don&apos;t affect the others.
      </p>
      <form action={action} className="mt-5 grid max-w-xl gap-4">
        <div>
          <label className="label" htmlFor="dup-name">Client name</label>
          <input className="input" id="dup-name" name="customerName" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="dup-email">Email</label>
            <input className="input" id="dup-email" name="customerEmail" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="dup-phone">Phone</label>
            <input className="input" id="dup-phone" name="customerPhone" type="tel" />
          </div>
          <div>
            <label className="label" htmlFor="dup-ref">Agreement reference</label>
            <input className="input" id="dup-ref" name="agreementRef" required />
          </div>
          <div>
            <label className="label" htmlFor="dup-date">Agreement accepted</label>
            <input className="input" id="dup-date" name="agreementDate" type="date" required />
          </div>
        </div>
        {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>}
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" disabled={pending}>{pending ? "Copying…" : "Create copy"}</button>
          <button type="button" className="btn-quiet" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
