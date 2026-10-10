"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";

type Item = { id: string; name: string | null; backedUp: boolean; createdAt: string | null };

export function PasskeyManager({ passkeys }: { passkeys: Item[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    setError("");
    setBusy(true);
    try {
      const res = await authClient.passkey.addPasskey({ name: name.trim() || "Passkey" });
      if (res?.error) throw new Error(res.error.message);
      setName("");
      router.refresh();
    } catch {
      setError("The passkey wasn't added. If you cancelled the prompt, try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Item) {
    if (!window.confirm(`Remove "${p.name ?? "Passkey"}"? You won't be able to sign in with it any more.`)) return;
    const res = await authClient.passkey.deletePasskey({ id: p.id });
    if (res?.error) {
      window.alert("Couldn't remove the passkey. Try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-6">
      {passkeys.length === 0 ? (
        <p className="rounded-md border border-line bg-white p-4 text-stone">No passkeys yet.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {passkeys.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-semibold">{p.name ?? "Passkey"}</p>
                <p className="text-sm text-stone">
                  Added {formatDate(p.createdAt)}
                  {p.backedUp ? ", synced to your password manager or cloud keychain" : ", stored on this device only"}
                </p>
              </div>
              <button type="button" className="text-sm font-semibold text-red-800 underline" onClick={() => remove(p)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="max-w-md rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold">Add a passkey on this device</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="label" htmlFor="passkey-name">Name</label>
            <input id="passkey-name" className="input" placeholder="e.g. iPhone, work laptop"
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button type="button" className="btn-primary" onClick={add} disabled={busy}>
            {busy ? "Waiting for your device…" : "Add passkey"}
          </button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
      </div>
    </div>
  );
}
