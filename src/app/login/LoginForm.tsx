"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    await authClient.signIn.magicLink({
      email: email.trim().toLowerCase(),
      callbackURL: "/portal",
      errorCallbackURL: "/login?error=link",
    });
    // Same message whether or not the email has an account, so nobody can probe for customers.
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div role="status">
        <p className="font-semibold">Check your inbox.</p>
        <p className="mt-1 text-stone">
          If {email} has a job with us, a sign-in link is on its way. It expires in 15 minutes.
        </p>
        <button className="mt-4 text-sm font-semibold text-pine underline" onClick={() => setState("idle")}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div>
        <label className="label" htmlFor="email">Email address</label>
        <input className="input" id="email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button className="btn-primary" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
