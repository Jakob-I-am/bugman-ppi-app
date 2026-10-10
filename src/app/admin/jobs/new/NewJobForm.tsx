"use client";

import { useActionState } from "react";
import { createJob, type CreateJobState } from "../../actions";

export function NewJobForm() {
  const [state, action, pending] = useActionState<CreateJobState, FormData>(createJob, {});
  return (
    <form action={action} className="mt-8 grid max-w-xl gap-5">
      <div>
        <label className="label" htmlFor="customerName">Customer name</label>
        <input className="input" id="customerName" name="customerName" required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="customerEmail">Customer email</label>
          <input className="input" id="customerEmail" name="customerEmail" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="customerPhone">Customer phone</label>
          <input className="input" id="customerPhone" name="customerPhone" type="tel" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="siteAddress">Site address</label>
        <textarea className="input" id="siteAddress" name="siteAddress" rows={2} required />
      </div>
      <div>
        <label className="label" htmlFor="visitDate">Visit date</label>
        <input className="input sm:max-w-56" id="visitDate" name="visitDate" type="date" />
      </div>
      {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>}
      <button className="btn-primary justify-self-start" disabled={pending}>
        {pending ? "Creating…" : "Create job"}
      </button>
    </form>
  );
}
