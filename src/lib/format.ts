export function jobNumber(n: number) {
  return `#${n.toString().padStart(4, "0")}`;
}

export function formatDate(d: Date | null | undefined) {
  if (!d) return "Not set";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function photoUrls(id: string) {
  return { thumbUrl: `/api/photos/${id}?size=thumb`, fullUrl: `/api/photos/${id}` };
}
