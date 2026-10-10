export function StatusPill({ status }: { status: "DRAFT" | "FINALISED" }) {
  return status === "FINALISED" ? (
    <span className="rounded-full bg-pine px-2.5 py-0.5 text-xs font-semibold text-white">Finalised</span>
  ) : (
    <span className="rounded-full bg-signal px-2.5 py-0.5 text-xs font-semibold text-pine-dark">Draft</span>
  );
}
