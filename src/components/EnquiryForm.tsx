"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "@/app/actions";

const services = ["Building and pest inspection", "Building inspection only", "Timber pest inspection only", "Not sure yet"];

export function EnquiryForm() {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="py-6">
        <p className="display text-4xl text-pine">Thanks, we&apos;ve got it.</p>
        <p className="mt-3 text-stone">We&apos;ll call you to confirm a time and send the inspection agreement.</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4" noValidate>
      <div>
        <label className="label" htmlFor="propertyAddress">Property address</label>
        <input className="input" id="propertyAddress" name="propertyAddress" autoComplete="street-address" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="service">Inspection</label>
          <select className="input" id="service" name="service" defaultValue={services[0]} required>
            {services.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="neededBy">Report needed by <span className="font-normal text-stone">(optional)</span></label>
          <input className="input" id="neededBy" name="neededBy" type="date" />
        </div>
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input className="input" id="name" name="name" autoComplete="name" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input className="input" id="phone" name="phone" type="tel" autoComplete="tel" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="message">Anything we should know? <span className="font-normal text-stone">(optional)</span></label>
        <textarea className="input min-h-20" id="message" name="message" rows={2}
          placeholder="e.g. Auction date, agent's name, access arrangements" />
      </div>

      {/* Honeypot for bots. Hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{state.message}</p>
      )}

      <button className="btn-primary w-full sm:w-auto sm:justify-self-start" disabled={pending}>
        {pending ? "Sending…" : "Request an inspection"}
      </button>
    </form>
  );
}
