"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { upload } from "@vercel/blob/client";
import { addPhoto, deletePhoto, type PhotoTarget } from "@/app/admin/actions";

export type PhotoItem = { id: string; thumbUrl: string; fullUrl: string };
type Stage = "waiting" | "compressing" | "uploading" | "saving" | "failed";
type Pending = { key: string; stage: Stage; percent: number; error?: string };

const CONCURRENCY = 2;
const STALL_MS = 30_000; // abort an upload that makes no progress for this long
const ATTEMPTS = 3;

const stageText: Record<Stage, string> = {
  waiting: "Waiting",
  compressing: "Shrinking",
  uploading: "Uploading",
  saving: "Saving",
  failed: "Failed",
};

function compress(file: File, maxWidthOrHeight: number, maxSizeMB: number) {
  // JPEG rather than WebP: older iPhone Safari can't encode WebP from a canvas.
  return imageCompression(file, {
    maxWidthOrHeight,
    maxSizeMB,
    fileType: "image/jpeg",
    initialQuality: 0.8,
    useWebWorker: true,
  });
}

/**
 * Uploads one file to the private Blob store. Mobile connections sometimes stall
 * without ever erroring, so if no progress arrives for STALL_MS the upload is
 * aborted and retried instead of waiting forever.
 */
async function uploadWithRetry(pathname: string, body: Blob, jobId: string, onProgress: (pct: number) => void) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const controller = new AbortController();
    let timer = setTimeout(() => controller.abort(), STALL_MS);
    try {
      const result = await upload(pathname, body, {
        access: "private",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ jobId }),
        contentType: "image/jpeg",
        abortSignal: controller.signal,
        onUploadProgress: ({ percentage }) => {
          clearTimeout(timer);
          timer = setTimeout(() => controller.abort(), STALL_MS);
          onProgress(percentage);
        },
      });
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      console.warn(`Upload attempt ${attempt} failed for ${pathname}`, err);
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastError;
}

export function PhotoField({ jobId, target, label, initial }: { jobId: string; target: PhotoTarget; label: string; initial: PhotoItem[] }) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initial);
  const [pending, setPending] = useState<Pending[]>([]);
  const files = useRef(new Map<string, File>());
  // Changing this key swaps in a brand-new <input> after every pick. iOS names every
  // camera photo "image.jpg", and reusing the same input can stop the second pick firing.
  const [inputKey, setInputKey] = useState(0);

  const patch = (key: string, changes: Partial<Pending>) =>
    setPending((list) => list.map((p) => (p.key === key ? { ...p, ...changes } : p)));
  const removeItem = (key: string) => {
    files.current.delete(key);
    setPending((list) => list.filter((p) => p.key !== key));
  };

  async function uploadOne(key: string) {
    const file = files.current.get(key);
    if (!file) return;
    try {
      patch(key, { stage: "compressing", percent: 0, error: undefined });
      const full = await compress(file, 2560, 0.6);
      const thumb = await compress(file, 480, 0.05);

      // One after the other: two parallel uploads per photo is a lot for weak signal.
      patch(key, { stage: "uploading" });
      const base = `jobs/${jobId}/${key}`;
      const fullBlob = await uploadWithRetry(`${base}.jpg`, full, jobId, (pct) => patch(key, { percent: Math.round(pct * 0.9) }));
      const thumbBlob = await uploadWithRetry(`${base}-thumb.jpg`, thumb, jobId, (pct) => patch(key, { percent: 90 + Math.round(pct * 0.1) }));

      patch(key, { stage: "saving", percent: 100 });
      const photo = await addPhoto({
        jobId,
        target,
        pathname: fullBlob.pathname,
        thumbPathname: thumbBlob.pathname,
        takenAt: file.lastModified, // compression strips EXIF, so keep the capture time here
      });
      setPhotos((list) => [...list, photo]);
      removeItem(key);
    } catch (err) {
      console.error(err);
      patch(key, { stage: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []); // copy before the input is replaced
    setInputKey((k) => k + 1);
    void handleFiles(picked);
  }

  async function handleFiles(list: File[]) {
    if (list.length === 0) return;
    const keys = list.map((file) => {
      const key = crypto.randomUUID();
      files.current.set(key, file);
      return key;
    });
    setPending((p) => [...p, ...keys.map((key) => ({ key, stage: "waiting" as const, percent: 0 }))]);

    // A couple at a time: lots of parallel uploads on site signal mostly fail.
    let next = 0;
    const worker = async () => {
      while (next < keys.length) await uploadOne(keys[next++]);
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, keys.length) }, worker));
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this photo?")) return;
    const before = photos;
    setPhotos((list) => list.filter((p) => p.id !== id));
    try {
      await deletePhoto(id);
    } catch {
      setPhotos(before);
      window.alert("Couldn't delete the photo. Check your connection and try again.");
    }
  }

  const failed = pending.filter((p) => p.stage === "failed");

  return (
    <div className="mt-3">
      {photos.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((p) => (
            <li key={p.id} className="relative">
              <a href={p.fullUrl} target="_blank" rel="noopener" className="block overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked images */}
                <img src={p.thumbUrl} alt={`${label} photo`} loading="lazy" className="aspect-square w-full object-cover" />
              </a>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="absolute right-1 top-1 rounded bg-ink/75 px-1.5 text-sm font-semibold text-white"
                aria-label="Delete photo"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* capture opens the camera directly; the second input opens the photo library */}
        <label className="btn-quiet cursor-pointer px-4 py-2 text-sm">
          Take photo
          <input key={`camera-${inputKey}`} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPick} />
        </label>
        <label className="btn-quiet cursor-pointer px-4 py-2 text-sm">
          Add from library
          <input key={`library-${inputKey}`} type="file" accept="image/*" multiple className="sr-only" onChange={onPick} />
        </label>
        <span className="text-sm text-stone">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </span>
      </div>

      {pending.length > 0 && (
        <ul className="mt-2 grid gap-1 text-sm" role="status">
          {pending.map((p) => (
            <li key={p.key}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-3 py-1.5 ${p.stage === "failed" ? "bg-red-50 text-red-900" : "bg-white text-stone"}`}>
              <span className="font-semibold">{stageText[p.stage]}</span>
              {p.stage === "uploading" && <span>{p.percent}%</span>}
              {p.stage === "failed" && (
                <>
                  <span className="min-w-0 flex-1 truncate">{p.error}</span>
                  <button type="button" className="font-semibold underline" onClick={() => uploadOne(p.key)}>Retry</button>
                  <button type="button" className="underline" onClick={() => removeItem(p.key)}>Discard</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {failed.length > 1 && (
        <button type="button" className="mt-2 text-sm font-semibold text-red-800 underline"
          onClick={() => failed.forEach((f) => uploadOne(f.key))}>
          Retry all {failed.length}
        </button>
      )}
    </div>
  );
}
