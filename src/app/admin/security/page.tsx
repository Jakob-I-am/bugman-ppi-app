import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PasskeyManager } from "./PasskeyManager";

export const metadata = { title: "Security" };

export default async function SecurityPage() {
  const user = await requireAdmin();
  const passkeys = await prisma.passkey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true, backedUp: true },
  });

  return (
    <>
      <h1 className="display text-5xl text-pine">Sign-in security</h1>
      <p className="mt-3 max-w-lg text-stone">
        A passkey lets you sign in with Face ID, your fingerprint or your device PIN. There&apos;s no
        password to steal, and it only works on this website, so it can&apos;t be phished.
        Add one on each device you use. Email sign-in links still work as a backup if you lose a device.
      </p>
      <PasskeyManager
        passkeys={passkeys.map((p) => ({
          id: p.id,
          name: p.name,
          backedUp: p.backedUp,
          createdAt: p.createdAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
