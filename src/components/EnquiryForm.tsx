"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "@/app/actions";

const pests = ["Rats or mice", "Wasps or hornets", "Bed bugs", "Cockroaches", "Fleas", "Moths or beetles", "Birds", "Squirrels", "Not sure"];

export function EnquiryForm() {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="py-6">
        <p className="display text-4xl text-pine">Thanks, we&apos;ve got it.</p>
        <p className="mt-3 text-stone">We&apos;ll call you back, usually the same working day.</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input className="input" id="name" name="name" autoComplete="name" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input className="input" id="phone" name="phone" type="tel" autoComplete="tel" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="postcode">Postcode</label>
          <input className="input" id="postcode" name="postcode" autoComplete="postal-code" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="pest">What&apos;s the problem?</label>
        <select className="input" id="pest" name="pest" defaultValue="" required>
          <option value="" disabled>Choose one</option>
          {pests.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="message">Anything else we should know? <span className="font-normal text-stone">(optional)</span></label>
        <textarea className="input min-h-24" id="message" name="message" rows={3} />
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
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
