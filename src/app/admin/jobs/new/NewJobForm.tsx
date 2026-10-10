"use client";

import { useActionState } from "react";
import { createJob, type CreateJobState } from "../../actions";
import { reportTypeLabels, type ReportType } from "@/lib/report/types";

export function NewJobForm() {
  const [state, action, pending] = useActionState<CreateJobState, FormData>(createJob, {});
  return (
    <form action={action} className="mt-8 grid max-w-xl gap-5">
      <div>
        <label className="label" htmlFor="propertyAddress">Property address</label>
        <textarea className="input" id="propertyAddress" name="propertyAddress" rows={2} required />
      </div>
      <div>
        <label className="label" htmlFor="reportType">Inspection type</label>
        <select className="input" id="reportType" name="reportType" defaultValue="BUILDING_AND_PEST">
          {(Object.keys(reportTypeLabels) as ReportType[]).map((t) => <option key={t} value={t}>{reportTypeLabels[t]}</option>)}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="inspectionDate">Inspection date</label>
          <input className="input" id="inspectionDate" name="inspectionDate" type="date" />
        </div>
        <div>
          <label className="label" htmlFor="agreementRef">Agreement reference</label>
          <input className="input" id="agreementRef" name="agreementRef" />
        </div>
      </div>

      <fieldset className="grid gap-5 border-t border-line pt-5">
        <legend className="mb-1 font-bold">Client (the purchaser)</legend>
        <div>
          <label className="label" htmlFor="customerName">Name</label>
          <input className="input" id="customerName" name="customerName" required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="customerEmail">Email</label>
            <input className="input" id="customerEmail" name="customerEmail" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="customerPhone">Phone</label>
            <input className="input" id="customerPhone" name="customerPhone" type="tel" />
          </div>
        </div>
      </fieldset>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="standardAreas" defaultChecked className="mt-1 h-5 w-5 accent-pine" />
        <span>
          <span className="font-semibold">Start with the standard areas</span>
          <span className="block text-sm text-stone">Site, exterior, roof exterior, roof space, subfloor, living room, kitchen and bathroom. Remove any that don&apos;t apply and add the rest as you go.</span>
        </span>
      </label>

      {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>}
      <button className="btn-primary justify-self-start" disabled={pending}>
        {pending ? "Creating…" : "Create job"}
      </button>
    </form>
  );
}
