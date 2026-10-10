export function jobNumber(n: number) {
  return `#${n.toString().padStart(4, "0")}`;
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "Not set";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function photoUrls(id: string) {
  return { thumbUrl: `/api/photos/${id}?size=thumb`, fullUrl: `/api/photos/${id}` };
}
